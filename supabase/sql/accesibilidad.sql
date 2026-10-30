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
