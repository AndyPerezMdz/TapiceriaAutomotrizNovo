-- =====================================================================
-- Cambios PENDIENTES de aplicar a la base de datos
-- =====================================================================
-- Cómo se usa:
--   1. Aquí se escribe cada cambio nuevo (tablas, columnas, funciones…).
--      Todo debe poder correrse varias veces sin romper nada.
--   2. Se corre en Supabase → SQL Editor → New query.
--   3. Ya aplicado, el cambio se pasa a supabase/schema.sql (la foto
--      completa de la base) y este archivo vuelve a quedar vacío.
--
-- La base completa, tal como está hoy, vive en supabase/schema.sql.
-- =====================================================================

-- =====================================================================
-- CUPÓN DE BIENVENIDA EDITABLE DESDE EL PANEL
-- =====================================================================
-- Antes: el trigger award_welcome_coupon creaba un 10% fijo.
-- Ahora: lo crea con lo que diga welcome_coupon_settings (lo edita el admin).

-- 1) Tipo de cupón, para distinguir los personales en el panel.
alter table public.coupons
  add column if not exists kind text not null default 'general';
alter table public.coupons drop constraint if exists coupons_kind_check;
alter table public.coupons
  add constraint coupons_kind_check check (kind in ('general', 'bienvenida', 'puntos', 'referido'));

-- Marca los que ya existen.
update public.coupons set kind = 'bienvenida'
 where kind = 'general' and client_id is not null and title = '10% de bienvenida';
update public.coupons set kind = 'puntos'
 where kind = 'general' and client_id is not null and title = 'Recompensa por puntos';
update public.coupons set kind = 'referido'
 where kind = 'general' and client_id is not null and title in ('Recompensa por referido', 'Bienvenida');

-- 2) Configuración (una sola fila).
create table if not exists public.welcome_coupon_settings (
  id integer primary key default 1 check (id = 1),
  is_enabled boolean not null default true,
  title text not null default '10% de bienvenida',
  description text default 'Válido en tu primer pedido',
  discount_type text not null default 'percentage' check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null default 10 check (discount_value > 0),
  first_order_only boolean not null default true,
  valid_days integer check (valid_days is null or valid_days > 0),
  requires_deposit boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.welcome_coupon_settings (id) values (1) on conflict (id) do nothing;

alter table public.welcome_coupon_settings enable row level security;
drop policy if exists "Cualquiera lee el cupon de bienvenida" on public.welcome_coupon_settings;
create policy "Cualquiera lee el cupon de bienvenida" on public.welcome_coupon_settings
  for select to public using (true);
-- Se edita solo con update_welcome_coupon (abajo), por eso no hay política de escritura.

-- 3) El trigger de registro usa la configuración.
create or replace function public.award_welcome_coupon()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s record;
  v_coupon_id uuid;
begin
  if new.role = 'cliente' then
    select * into v_s from public.welcome_coupon_settings where id = 1;
    if not found or not v_s.is_enabled then
      return new;
    end if;

    insert into public.coupons
      (title, description, discount_type, discount_value, audience, client_id, is_active, kind, expires_at, requires_deposit)
    values
      (v_s.title, v_s.description, v_s.discount_type, v_s.discount_value,
       case when v_s.first_order_only then 'nuevos' else 'ambos' end,
       new.id, true, 'bienvenida',
       case when v_s.valid_days is null then null
            else ((now() at time zone 'America/Merida')::date + v_s.valid_days) end,
       v_s.requires_deposit)
    returning id into v_coupon_id;

    insert into public.active_coupons (client_id, coupon_id)
    values (new.id, v_coupon_id)
    on conflict (client_id) do update set coupon_id = excluded.coupon_id, activated_at = now();
  end if;

  return new;
exception
  when others then
    -- Si algo falla al crear el cupón, no debe impedir que el registro se complete.
    return new;
end;
$$;

-- 4) El admin guarda la configuración y, si quiere, actualiza los de
--    bienvenida que todavía no se usan. Devuelve cuántos actualizó.
create or replace function public.update_welcome_coupon(
  p_is_enabled boolean,
  p_title text,
  p_description text,
  p_discount_type text,
  p_discount_value numeric,
  p_first_order_only boolean,
  p_valid_days integer,
  p_requires_deposit boolean,
  p_apply_to_unused boolean
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if not coalesce(get_my_role() = 'admin'::user_role, false) then
    raise exception 'No autorizado';
  end if;
  if coalesce(trim(p_title), '') = '' then
    raise exception 'El cupón necesita un título';
  end if;
  if p_discount_type = 'percentage' and p_discount_value > 100 then
    raise exception 'El porcentaje no puede ser mayor a 100';
  end if;

  update public.welcome_coupon_settings
     set is_enabled = p_is_enabled,
         title = trim(p_title),
         description = nullif(trim(coalesce(p_description, '')), ''),
         discount_type = p_discount_type,
         discount_value = p_discount_value,
         first_order_only = p_first_order_only,
         valid_days = p_valid_days,
         requires_deposit = p_requires_deposit,
         updated_at = now()
   where id = 1;

  if p_apply_to_unused then
    update public.coupons c
       set title = trim(p_title),
           description = nullif(trim(coalesce(p_description, '')), ''),
           discount_type = p_discount_type,
           discount_value = p_discount_value,
           audience = case when p_first_order_only then 'nuevos' else 'ambos' end,
           requires_deposit = p_requires_deposit
     where c.kind = 'bienvenida'
       and c.is_active
       and not exists (select 1 from public.coupon_redemptions r where r.coupon_id = c.id);
    get diagnostics v_count = row_count;
  end if;

  return v_count;
end;
$$;

revoke all on function public.update_welcome_coupon(boolean, text, text, text, numeric, boolean, integer, boolean, boolean) from public, anon;
grant execute on function public.update_welcome_coupon(boolean, text, text, text, numeric, boolean, integer, boolean, boolean) to authenticated;

-- 5) "Solo primer pedido" ahora sí se respeta en los cupones personales
--    de bienvenida (antes el 10% se podía usar en cualquier pedido).
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

  -- Generales: dependen de la categoría del cliente.
  -- Personales: solo se revisa "primer pedido" (cupón de bienvenida).
  if v_coupon.client_id is null or v_coupon.audience = 'nuevos' then
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

-- 6) En "Mis cupones": un cupón personal de primer pedido que ya no puede
--    usarse (porque el cliente ya hizo pedidos) sale como "caducado".
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
         case
           when c.expires_at is not null and c.expires_at < me.today then 'caducado'
           when c.client_id = me.uid and c.audience = 'nuevos' and me.segment <> 'nuevo' then 'caducado'
           else 'activo'
         end,
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

-- 7) Los cupones de puntos y de referidos también se marcan con su tipo.
create or replace function public.redeem_loyalty_points()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_settings record;
  v_coupon_id uuid;
begin
  select balance into v_balance from public.loyalty_points where client_id = auth.uid();
  select * into v_settings from public.loyalty_settings where id = 1;

  if v_balance is null or v_balance < v_settings.points_for_reward then
    raise exception 'No tienes suficientes puntos todavía.';
  end if;

  insert into public.coupons (title, description, discount_type, discount_value, audience, client_id, is_active, kind)
  values (
    'Recompensa por puntos',
    'Cupón generado por canjear tus puntos de lealtad.',
    v_settings.reward_type,
    v_settings.reward_value,
    'ambos',
    auth.uid(),
    true,
    'puntos'
  )
  returning id into v_coupon_id;

  update public.loyalty_points set balance = balance - v_settings.points_for_reward
  where client_id = auth.uid();

  insert into public.loyalty_ledger (client_id, points, type)
  values (auth.uid(), -v_settings.points_for_reward, 'canjeado');

  insert into public.active_coupons (client_id, coupon_id)
  values (auth.uid(), v_coupon_id)
  on conflict (client_id) do update set coupon_id = v_coupon_id, activated_at = now();

  return v_coupon_id;
end;
$$;

create or replace function public.award_referral_reward()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referred_by uuid;
  v_delivered_count int;
  v_settings record;
  v_referrer_coupon uuid;
  v_referred_coupon uuid;
begin
  if new.status = 'entregado' and old.status is distinct from 'entregado' and new.final_price is not null then
    select referred_by into v_referred_by from public.profiles where id = new.client_id;

    if v_referred_by is not null
       and not exists (select 1 from public.referral_rewards where referred_id = new.client_id)
    then
      select count(*) into v_delivered_count
      from public.orders
      where client_id = new.client_id and status = 'entregado' and deleted_at is null;

      if v_delivered_count = 1 then
        select * into v_settings from public.referral_settings where id = 1;

        insert into public.coupons (title, description, discount_type, discount_value, audience, client_id, is_active, kind)
        values ('Recompensa por referido', 'Gracias por invitar a un amigo al taller.', v_settings.reward_type, v_settings.reward_value, 'ambos', v_referred_by, true, 'referido')
        returning id into v_referrer_coupon;

        insert into public.coupons (title, description, discount_type, discount_value, audience, client_id, is_active, kind)
        values ('Bienvenida', 'Un descuento de bienvenida por venir referido.', v_settings.reward_type, v_settings.reward_value, 'ambos', new.client_id, true, 'referido')
        returning id into v_referred_coupon;

        insert into public.referral_rewards (referrer_id, referred_id, referrer_coupon_id, referred_coupon_id)
        values (v_referred_by, new.client_id, v_referrer_coupon, v_referred_coupon);
      end if;
    end if;
  end if;
  return new;
end;
$$;
