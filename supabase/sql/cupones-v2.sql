-- Cupones v2: audiencia "nuevos", validaciones completas al aplicar y
-- una sola función para que el cliente vea activos, canjeados y caducados.
-- Correr una vez en el SQL Editor de Supabase.

-- 1) Nueva audiencia: clientes sin pedidos todavía.
alter table public.coupons drop constraint if exists coupons_audience_check;
alter table public.coupons
  add constraint coupons_audience_check
  check (audience = any (array['clientes', 'frecuentes', 'ambos', 'nuevos']));

-- 2) ¿Es cliente nuevo? (sin pedidos, sin contar rechazados/cancelados/eliminados).
--    p_except_order permite ignorar el pedido que se está creando ahora mismo.
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

-- 3) Aplicar cupón a un pedido, con todas las validaciones.
create or replace function public.apply_coupon_to_order(p_coupon_id uuid, p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_id uuid;
  v_coupon record;
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

  if v_coupon.audience = 'frecuentes' and not public.is_frequent_client(auth.uid()) then
    raise exception 'Este cupón es solo para clientes frecuentes';
  end if;

  if v_coupon.audience = 'nuevos' and not public.is_new_client(auth.uid(), p_order_id) then
    raise exception 'Este cupón es solo para tu primer pedido';
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

-- 4) Cupones del cliente con su estado. Los canjeados salen siempre
--    (aunque el cupón se haya desactivado o el cliente cambie de audiencia).
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
  status text,          -- 'activo' | 'canjeado' | 'caducado'
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
           public.is_frequent_client(auth.uid()) as frequent,
           public.is_new_client(auth.uid()) as is_new,
           (now() at time zone 'America/Merida')::date as today
  )
  -- Canjeados
  select c.id, c.title, c.description, c.discount_type, c.discount_value, c.audience,
         c.service_id, s.title, c.expires_at, c.client_id is not null,
         'canjeado', r.redeemed_at, r.order_id
  from public.coupon_redemptions r
  join public.coupons c on c.id = r.coupon_id
  left join public.services s on s.id = c.service_id
  cross join me
  where r.client_id = me.uid

  union all

  -- Disponibles o caducados (que nunca usó)
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
    and (
      c.client_id = me.uid
      or c.audience = 'ambos'
      or (c.audience = 'frecuentes' and me.frequent)
      or (c.audience = 'clientes' and not me.frequent)
      or (c.audience = 'nuevos' and me.is_new)
    );
$$;

revoke all on function public.get_my_coupons() from public, anon;
grant execute on function public.get_my_coupons() to authenticated;
-- is_new_client solo se usa dentro de las funciones de arriba: nadie más la llama.
revoke all on function public.is_new_client(uuid, uuid) from public, anon, authenticated;
