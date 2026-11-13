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
