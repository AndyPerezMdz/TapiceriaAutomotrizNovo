-- =====================================================================
-- Tapicería Automotriz by NOVO · cambios a la base de datos
-- Un solo archivo con todo lo que hemos agregado. Se puede correr completo
-- cuantas veces quieras en el SQL Editor de Supabase: cada parte es
-- idempotente (si ya existe, la reemplaza o la deja igual).
-- Lo nuevo se agrega siempre al final de este archivo.
-- =====================================================================


-- =====================================================================
-- 1. ETAPAS VISIBLES PARA EL CLIENTE
-- =====================================================================

-- Etapas visibles para el cliente (portal y página pública de seguimiento)
-- Correr en el SQL Editor de Supabase. Es idempotente.
--
-- Nota: service_stages ya tenía la política "Etapas son de lectura publica" (SELECT, true),
-- así que el portal del cliente no necesita una política nueva. Se borra la duplicada
-- que agregó la primera versión de este archivo.
drop policy if exists "service_stages_select_authenticated" on public.service_stages;

-- La primera versión recibía p_token text; las demás funciones de seguimiento usan uuid.
-- Se borra para no dejar dos sobrecargas (PostgREST no sabría cuál elegir).
drop function if exists public.get_order_stages_by_share_token(text);

-- Etapas por servicio para la página pública /seguimiento/[token].
create or replace function public.get_order_stages_by_share_token(p_token uuid)
returns table (
  item_id uuid,
  item_order integer,
  service_title text,
  stage_id uuid,
  stage_name text,
  client_description text,
  stage_order integer,
  is_current boolean
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  return query
  select
    oi.id,
    oi."order",
    coalesce(s.title, 'Servicio'),
    st.id,
    st.name,
    st.client_description,
    st."order",
    st.id = oi.current_stage_id
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.services s on s.id = oi.service_id
  join public.service_stages st on st.service_id = oi.service_id
  where o.share_token = p_token
    and o.deleted_at is null
    and (st.is_active or st.id = oi.current_stage_id)
  order by oi."order" asc, st."order" asc;
end;
$function$;

revoke all on function public.get_order_stages_by_share_token(uuid) from public;
grant execute on function public.get_order_stages_by_share_token(uuid) to anon, authenticated;


-- =====================================================================
-- 2. NOTIFICACIONES LEÍDAS Y RECORDATORIOS DE COTIZACIÓN
-- =====================================================================

-- Notificaciones leídas + recordatorios de cotización
-- Correr una vez en el SQL Editor de Supabase. Es idempotente.

-- 1) Qué notificaciones ya leyó cada cliente.
--    La llave incluye la fecha del aviso, así que si el pedido vuelve a cambiar,
--    la notificación aparece otra vez como no leída.
create table if not exists public.notification_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_key text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_key)
);

alter table public.notification_reads enable row level security;

drop policy if exists "notification_reads_own" on public.notification_reads;
create policy "notification_reads_own"
  on public.notification_reads
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 2) Recordatorios que el staff manda a clientes con cotización sin responder.
create table if not exists public.quote_reminders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  sent_by uuid references public.profiles (id) on delete set null,
  channels text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists quote_reminders_order_idx
  on public.quote_reminders (order_id, created_at desc);

alter table public.quote_reminders enable row level security;

-- Staff ve todos; el cliente ve los de sus pedidos (para su campanita).
drop policy if exists "quote_reminders_select" on public.quote_reminders;
create policy "quote_reminders_select"
  on public.quote_reminders
  for select
  to authenticated
  using (
    get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])
    or exists (
      select 1 from public.orders o
      where o.id = quote_reminders.order_id and o.client_id = auth.uid()
    )
  );
-- Los inserta la API con la llave de servicio, por eso no hay política de insert.


-- =====================================================================
-- 3. ACCESIBILIDAD Y MODO SENCILLO
-- =====================================================================

-- Preferencias de accesibilidad y "modo sencillo" por usuario.
-- Correr una vez en el SQL Editor de Supabase.

alter table public.profiles
  add column if not exists ui_mode text not null default 'normal'
    check (ui_mode in ('normal', 'sencillo')),
  add column if not exists text_size text not null default 'normal'
    check (text_size in ('normal', 'grande', 'extra')),
  add column if not exists high_contrast boolean not null default false,
  add column if not exists reduce_motion boolean not null default false,
  -- false hasta que el cliente elige su vista por primera vez
  add column if not exists ui_mode_chosen boolean not null default false;

-- Guarda las preferencias del usuario que llama (solo su propia fila).
create or replace function public.set_ui_preferences(
  p_ui_mode text,
  p_text_size text,
  p_high_contrast boolean,
  p_reduce_motion boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if p_ui_mode not in ('normal', 'sencillo') or p_text_size not in ('normal', 'grande', 'extra') then
    raise exception 'Preferencia inválida';
  end if;

  update public.profiles
     set ui_mode = p_ui_mode,
         text_size = p_text_size,
         high_contrast = coalesce(p_high_contrast, false),
         reduce_motion = coalesce(p_reduce_motion, false),
         ui_mode_chosen = true
   where id = auth.uid();
end;
$$;

revoke all on function public.set_ui_preferences(text, text, boolean, boolean) from public, anon;
grant execute on function public.set_ui_preferences(text, text, boolean, boolean) to authenticated;


-- =====================================================================
-- 4. CUPONES: CATEGORÍAS, VALIDACIONES E HISTORIAL
-- =====================================================================

-- Cupones v3 (incluye todo lo de v2; basta con correr este archivo).
-- Categorías de cliente:
--   nuevo         → aún sin pedidos (sin contar rechazados/cancelados/eliminados)
--   no_frecuente  → ya tiene pedidos, pero menos de 5 entregados
--   frecuente     → 5 o más pedidos entregados
-- Audiencias de cupón:
--   nuevos       → solo nuevos
--   ambos        → nuevos y ya registrados (todos)
--   registrados  → ya registrados (no frecuentes + frecuentes)
--   frecuentes   → solo frecuentes
--   clientes     → solo no frecuentes

-- 1) Audiencias permitidas.
alter table public.coupons drop constraint if exists coupons_audience_check;
alter table public.coupons
  add constraint coupons_audience_check
  check (audience = any (array['nuevos', 'ambos', 'registrados', 'frecuentes', 'clientes']));

-- 2) ¿Es cliente nuevo? p_except_order ignora el pedido que se está creando.
create or replace function public.is_new_client(p_client_id uuid, p_except_order uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.orders
    where client_id = p_client_id
      and deleted_at is null
      and status not in ('rechazado', 'cancelado')
      and (p_except_order is null or id <> p_except_order)
  );
$$;

-- 3) Categoría de un cliente.
create or replace function public.client_segment(p_client_id uuid, p_except_order uuid default null)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_new_client(p_client_id, p_except_order) then 'nuevo'
    when public.is_frequent_client(p_client_id) then 'frecuente'
    else 'no_frecuente'
  end;
$$;

-- 4) ¿La audiencia del cupón incluye esa categoría?
create or replace function public.coupon_audience_matches(p_audience text, p_segment text)
returns boolean
language sql
immutable
as $$
  select case p_audience
    when 'ambos' then true
    when 'nuevos' then p_segment = 'nuevo'
    when 'registrados' then p_segment in ('no_frecuente', 'frecuente')
    when 'frecuentes' then p_segment = 'frecuente'
    when 'clientes' then p_segment = 'no_frecuente'
    else false
  end;
$$;

-- 5) Aplicar cupón a un pedido, con todas las validaciones.
create or replace function public.apply_coupon_to_order(p_coupon_id uuid, p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_coupon record;
  v_segment text;
  v_today date := (now() at time zone 'America/Merida')::date;
begin
  select client_id into v_client_id from public.orders where id = p_order_id;
  if v_client_id is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;

  select * into v_coupon from public.coupons where id = p_coupon_id;
  if not found or not v_coupon.is_active then
    raise exception 'Este cupón ya no está disponible';
  end if;

  if v_coupon.client_id is not null and v_coupon.client_id <> auth.uid() then
    raise exception 'Este cupón no es tuyo';
  end if;

  if v_coupon.expires_at is not null and v_coupon.expires_at < v_today then
    raise exception 'Este cupón ya venció';
  end if;

  if v_coupon.service_id is not null and not exists (
    select 1 from public.order_items where order_id = p_order_id and service_id = v_coupon.service_id
  ) then
    raise exception 'Este cupón no aplica a ningún servicio de este pedido';
  end if;

  -- Los cupones personales (canje de puntos) no dependen de la categoría.
  if v_coupon.client_id is null then
    -- Se ignora el pedido recién creado para saber en qué categoría estaba el cliente.
    v_segment := public.client_segment(auth.uid(), p_order_id);
    if not public.coupon_audience_matches(v_coupon.audience, v_segment) then
      raise exception '%', case v_coupon.audience
        when 'nuevos' then 'Este cupón es solo para tu primer pedido'
        when 'registrados' then 'Este cupón es para clientes que ya nos han hecho un pedido'
        when 'frecuentes' then 'Este cupón es solo para clientes frecuentes'
        when 'clientes' then 'Este cupón es para clientes que todavía no son frecuentes'
        else 'Este cupón no aplica para tu cuenta'
      end;
    end if;
  end if;

  if exists (select 1 from public.coupon_redemptions where coupon_id = p_coupon_id and client_id = auth.uid()) then
    raise exception 'Ya usaste este cupón';
  end if;

  insert into public.coupon_redemptions (coupon_id, client_id, order_id)
  values (p_coupon_id, auth.uid(), p_order_id);

  update public.orders set coupon_id = p_coupon_id where id = p_order_id;

  -- Ya se gastó: deja de estar "activado".
  delete from public.active_coupons where client_id = auth.uid() and coupon_id = p_coupon_id;
end;
$$;

-- 6) Cupones del cliente con su estado (activo / canjeado / caducado).
--    Los canjeados salen siempre, aunque cambie de categoría o se desactive el cupón.
drop function if exists public.get_my_coupons();
create or replace function public.get_my_coupons()
returns table (
  id uuid,
  title text,
  description text,
  discount_type text,
  discount_value numeric,
  audience text,
  service_id uuid,
  service_title text,
  expires_at date,
  is_personal boolean,
  status text,
  redeemed_at timestamptz,
  order_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select auth.uid() as uid,
           public.client_segment(auth.uid()) as segment,
           (now() at time zone 'America/Merida')::date as today
  )
  select c.id, c.title, c.description, c.discount_type, c.discount_value, c.audience,
         c.service_id, s.title, c.expires_at, c.client_id is not null,
         'canjeado', r.redeemed_at, r.order_id
  from public.coupon_redemptions r
  join public.coupons c on c.id = r.coupon_id
  left join public.services s on s.id = c.service_id
  cross join me
  where r.client_id = me.uid

  union all

  select c.id, c.title, c.description, c.discount_type, c.discount_value, c.audience,
         c.service_id, s.title, c.expires_at, c.client_id is not null,
         case when c.expires_at is not null and c.expires_at < me.today then 'caducado' else 'activo' end,
         null, null
  from public.coupons c
  left join public.services s on s.id = c.service_id
  cross join me
  where c.is_active
    and (c.client_id is null or c.client_id = me.uid)
    and not exists (select 1 from public.coupon_redemptions r where r.coupon_id = c.id and r.client_id = me.uid)
    and (c.client_id = me.uid or public.coupon_audience_matches(c.audience, me.segment));
$$;

-- 7) Lista de clientes por categoría (solo staff), para el panel.
create or replace function public.get_client_segments()
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  created_at timestamptz,
  orders_count bigint,
  delivered_count bigint,
  segment text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.email, p.phone, p.created_at,
         count(o.id) filter (where o.status not in ('rechazado', 'cancelado')),
         count(o.id) filter (where o.status = 'entregado'),
         case
           when count(o.id) filter (where o.status not in ('rechazado', 'cancelado')) = 0 then 'nuevo'
           when count(o.id) filter (where o.status = 'entregado') >= 5 then 'frecuente'
           else 'no_frecuente'
         end
  from public.profiles p
  left join public.orders o on o.client_id = p.id and o.deleted_at is null
  where p.role = 'cliente'
    and public.get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])
  group by p.id
  order by p.full_name;
$$;

-- Permisos
revoke all on function public.get_my_coupons() from public, anon;
grant execute on function public.get_my_coupons() to authenticated;
revoke all on function public.get_client_segments() from public, anon;
grant execute on function public.get_client_segments() to authenticated;
-- Solo se usan dentro de las funciones de arriba.
revoke all on function public.is_new_client(uuid, uuid) from public, anon, authenticated;
revoke all on function public.client_segment(uuid, uuid) from public, anon, authenticated;


-- =====================================================================
-- 5. FECHA PARA TRAER EL COCHE (propuestas staff ↔ cliente)
-- =====================================================================
-- El staff propone día y hora; el cliente acepta o sugiere otra; el staff
-- acepta o vuelve a sugerir. Máximo 4 propuestas por pedido (la original
-- + 3 sugerencias); después se arregla por WhatsApp.
-- Al aceptarse, se crea una cita "recepcion" en el calendario.

alter table public.appointments
  add column if not exists kind text not null default 'visita';
alter table public.appointments drop constraint if exists appointments_kind_check;
alter table public.appointments
  add constraint appointments_kind_check check (kind in ('visita', 'recepcion'));

create table if not exists public.dropoff_proposals (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  proposed_by text not null check (proposed_by in ('staff', 'cliente')),
  proposed_date date not null,
  proposed_time text not null,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'aceptada', 'rechazada')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists dropoff_proposals_order_idx
  on public.dropoff_proposals (order_id, created_at);

alter table public.dropoff_proposals enable row level security;

-- Staff ve todas; el cliente, las de sus pedidos. Se escriben solo con las funciones.
drop policy if exists "dropoff_proposals_select" on public.dropoff_proposals;
create policy "dropoff_proposals_select"
  on public.dropoff_proposals
  for select
  to authenticated
  using (
    get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])
    or exists (select 1 from public.orders o where o.id = dropoff_proposals.order_id and o.client_id = auth.uid())
  );

create or replace function public.propose_dropoff(p_order_id uuid, p_date date, p_time text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_is_staff boolean := coalesce(get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]), false);
  v_side text;
  v_count int;
  v_id uuid;
  v_today date := (now() at time zone 'America/Merida')::date;
begin
  select * into v_order from public.orders where id = p_order_id and deleted_at is null;
  if not found then
    raise exception 'Pedido no encontrado';
  end if;

  if v_is_staff then
    v_side := 'staff';
  elsif v_order.client_id = auth.uid() then
    v_side := 'cliente';
  else
    raise exception 'No autorizado';
  end if;

  if v_order.status in ('entregado', 'cancelado', 'rechazado') then
    raise exception 'Este pedido ya no se puede agendar';
  end if;

  if exists (select 1 from public.dropoff_proposals where order_id = p_order_id and status = 'aceptada') then
    raise exception 'Ya hay una fecha confirmada para este pedido';
  end if;

  if p_date <= v_today or extract(dow from p_date) = 0 then
    raise exception 'Elige un día a partir de mañana, de lunes a sábado';
  end if;

  if exists (select 1 from public.blocked_dates where blocked_date = p_date) then
    raise exception 'Ese día el taller no abre';
  end if;

  -- El cliente solo puede sugerir cuando el taller ya propuso algo.
  if v_side = 'cliente' and not exists (
    select 1 from public.dropoff_proposals
    where order_id = p_order_id and status = 'pendiente' and proposed_by = 'staff'
  ) then
    raise exception 'Espera a que el taller te proponga una fecha';
  end if;

  select count(*) into v_count from public.dropoff_proposals where order_id = p_order_id;
  if v_count >= 4 then
    raise exception 'Ya se hicieron 3 sugerencias; acuerden la fecha por WhatsApp';
  end if;

  -- La propuesta anterior queda descartada.
  update public.dropoff_proposals
     set status = 'rechazada', responded_at = now()
   where order_id = p_order_id and status = 'pendiente';

  insert into public.dropoff_proposals (order_id, proposed_by, proposed_date, proposed_time, created_by)
  values (p_order_id, v_side, p_date, p_time, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.accept_dropoff(p_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p record;
  v_order record;
  v_client record;
  v_is_staff boolean := coalesce(get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]), false);
begin
  select * into v_p from public.dropoff_proposals where id = p_proposal_id;
  if not found or v_p.status <> 'pendiente' then
    raise exception 'Esta propuesta ya no está vigente';
  end if;

  select * into v_order from public.orders where id = v_p.order_id;

  -- Acepta la otra parte: el cliente las del staff y el staff las del cliente.
  if v_p.proposed_by = 'staff' and v_order.client_id is distinct from auth.uid() then
    raise exception 'No autorizado';
  end if;
  if v_p.proposed_by = 'cliente' and not v_is_staff then
    raise exception 'No autorizado';
  end if;

  update public.dropoff_proposals set status = 'aceptada', responded_at = now() where id = p_proposal_id;

  select full_name, phone into v_client from public.profiles where id = v_order.client_id;

  insert into public.appointments
    (client_id, order_id, client_name, client_phone, appointment_date, appointment_time, reason, status, kind)
  values
    (v_order.client_id, v_order.id, coalesce(v_client.full_name, 'Cliente'), coalesce(v_client.phone, ''), v_p.proposed_date, v_p.proposed_time,
     'Recepción del vehículo', 'confirmada', 'recepcion');
end;
$$;

revoke all on function public.propose_dropoff(uuid, date, text) from public, anon;
grant execute on function public.propose_dropoff(uuid, date, text) to authenticated;
revoke all on function public.accept_dropoff(uuid) from public, anon;
grant execute on function public.accept_dropoff(uuid) to authenticated;


-- =====================================================================
-- 6. ANTICIPO Y CUPONES QUE SOLO VALEN CON ANTICIPO
-- =====================================================================
-- Todos los pedidos registran el anticipo que deja el cliente (en el taller
-- o por transferencia; lo captura el staff). Los cupones con
-- requires_deposit solo valen si el anticipo cubre al menos el 50% del
-- total ya con descuento.

alter table public.orders
  add column if not exists deposit_amount numeric,
  add column if not exists deposit_paid_at timestamptz,
  add column if not exists deposit_registered_by uuid references public.profiles (id) on delete set null;

alter table public.coupons
  add column if not exists requires_deposit boolean not null default false;

-- Registrar (o corregir) el anticipo. p_amount null lo borra.
create or replace function public.register_deposit(p_order_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not coalesce(get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]), false) then
    raise exception 'No autorizado';
  end if;
  if p_amount is not null and p_amount <= 0 then
    raise exception 'El anticipo debe ser mayor a cero';
  end if;

  update public.orders
     set deposit_amount = p_amount,
         deposit_paid_at = case when p_amount is null then null else now() end,
         deposit_registered_by = case when p_amount is null then null else auth.uid() end
   where id = p_order_id;
end;
$$;

-- Al entregar, la base de datos fija el precio final (así también funciona
-- cuando entrega un empleado, que no puede tocar precios):
--   * si el cupón pedía anticipo y no se dejó el 50%, se quita el cupón,
--     le regresa al cliente y se cobra la suma de los servicios sin descuento;
--   * si no hay precio final, se usa el estimado.
-- Se llama "zz_" para correr después de prevent_employee_price_change.
drop function if exists public.release_unearned_coupon(uuid);

create or replace function public.set_final_price_on_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requires boolean := false;
  v_raw numeric;
begin
  if new.status = 'entregado' and old.status is distinct from 'entregado' then
    if new.coupon_id is not null then
      select requires_deposit into v_requires from public.coupons where id = new.coupon_id;
    end if;

    if coalesce(v_requires, false)
       and (new.estimated_price is null or coalesce(new.deposit_amount, 0) < new.estimated_price * 0.5) then
      delete from public.coupon_redemptions where coupon_id = new.coupon_id and order_id = new.id;
      new.coupon_id := null;
      select sum(price) into v_raw from public.order_items where order_id = new.id;
      new.final_price := coalesce(v_raw, new.estimated_price);
    elsif new.final_price is null then
      new.final_price := new.estimated_price;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists zz_set_final_price_on_delivery on public.orders;
create trigger zz_set_final_price_on_delivery
before update on public.orders
for each row execute function public.set_final_price_on_delivery();

revoke all on function public.register_deposit(uuid, numeric) from public, anon;
grant execute on function public.register_deposit(uuid, numeric) to authenticated;

-- get_my_coupons ahora también dice si el cupón pide anticipo.
drop function if exists public.get_my_coupons();
create or replace function public.get_my_coupons()
returns table (
  id uuid,
  title text,
  description text,
  discount_type text,
  discount_value numeric,
  audience text,
  service_id uuid,
  service_title text,
  expires_at date,
  is_personal boolean,
  requires_deposit boolean,
  status text,
  redeemed_at timestamptz,
  order_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select auth.uid() as uid,
           public.client_segment(auth.uid()) as segment,
           (now() at time zone 'America/Merida')::date as today
  )
  select c.id, c.title, c.description, c.discount_type, c.discount_value, c.audience,
         c.service_id, s.title, c.expires_at, c.client_id is not null, c.requires_deposit,
         'canjeado', r.redeemed_at, r.order_id
  from public.coupon_redemptions r
  join public.coupons c on c.id = r.coupon_id
  left join public.services s on s.id = c.service_id
  cross join me
  where r.client_id = me.uid

  union all

  select c.id, c.title, c.description, c.discount_type, c.discount_value, c.audience,
         c.service_id, s.title, c.expires_at, c.client_id is not null, c.requires_deposit,
         case when c.expires_at is not null and c.expires_at < me.today then 'caducado' else 'activo' end,
         null, null
  from public.coupons c
  left join public.services s on s.id = c.service_id
  cross join me
  where c.is_active
    and (c.client_id is null or c.client_id = me.uid)
    and not exists (select 1 from public.coupon_redemptions r where r.coupon_id = c.id and r.client_id = me.uid)
    and (c.client_id = me.uid or public.coupon_audience_matches(c.audience, me.segment));
$$;

revoke all on function public.get_my_coupons() from public, anon;
grant execute on function public.get_my_coupons() to authenticated;
