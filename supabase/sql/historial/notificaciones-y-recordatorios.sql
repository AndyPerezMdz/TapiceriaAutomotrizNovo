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
