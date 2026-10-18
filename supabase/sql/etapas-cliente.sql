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
