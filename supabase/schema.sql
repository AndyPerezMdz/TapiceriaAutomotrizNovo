-- =====================================================================
-- Tapicería Automotriz by NOVO · ESQUEMA COMPLETO DE LA BASE DE DATOS
-- =====================================================================
-- Foto fiel de la base de producción (Supabase) al 13 nov 2026.
-- Se puede correr completo cuantas veces quieras en el SQL Editor:
--   * en una base nueva, crea todo desde cero;
--   * en la base actual, no cambia nada (todo es "si no existe" o "reemplaza").
-- Los cambios nuevos se agregan en supabase/sql/novo.sql y, cuando se
-- apliquen, se reflejan aquí también.
--
-- Orden: extensiones · tipos · tablas · llaves y reglas · índices ·
--        seguridad (RLS) · funciones · permisos · triggers · políticas ·
--        buckets de Storage · tarea mensual · filas de configuración.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Ayudante temporal: agrega una regla solo si todavía no existe.
--    (Vive solo mientras corre este script.)
-- ---------------------------------------------------------------------
create or replace function pg_temp.add_constraint(p_table text, p_name text, p_def text)
returns void
language plpgsql
as $$
begin
  if not exists (
    select 1 from pg_constraint where conname = p_name and conrelid = p_table::regclass
  ) then
    execute format('alter table %s add constraint %I %s', p_table, p_name, p_def);
  end if;
end;
$$;


-- ---------------------------------------------------------------------
-- 1. EXTENSIONES
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";
create extension if not exists vector;   -- embeddings de business_info (IA)
create extension if not exists pg_cron;  -- purga mensual de pedidos eliminados


-- ---------------------------------------------------------------------
-- 2. TIPOS
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('cliente', 'empleado', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pendiente_revision', 'cotizado', 'aprobado', 'rechazado',
    'en_proceso', 'listo_para_entrega', 'entregado', 'cancelado'
  );
exception when duplicate_object then null; end $$;


-- ---------------------------------------------------------------------
-- 3. TABLAS
-- ---------------------------------------------------------------------

-- Usuarios ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid not null,
  role user_role not null default 'cliente'::user_role,
  full_name text,
  phone text,
  created_at timestamp with time zone not null default now(),
  email text,
  is_active boolean not null default true,
  avatar_url text,
  referred_by uuid,
  marketing_opt_in boolean not null default false,
  ui_mode text not null default 'normal'::text,
  text_size text not null default 'normal'::text,
  high_contrast boolean not null default false,
  reduce_motion boolean not null default false,
  ui_mode_chosen boolean not null default false
);

create table if not exists public.push_subscriptions (
  id uuid not null default gen_random_uuid(),
  client_id uuid not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.notification_reads (
  user_id uuid not null,
  notification_key text not null,
  read_at timestamp with time zone not null default now()
);

create table if not exists public.audit_log (
  id uuid not null default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text not null,
  entity_type text not null,
  entity_label text,
  details text,
  created_at timestamp with time zone not null default now()
);

-- Catálogo ------------------------------------------------------------
create table if not exists public.services (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  title text not null,
  short_description text,
  full_description text,
  icon text,
  "order" integer default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  image_url text
);

create table if not exists public.service_stages (
  id uuid not null default gen_random_uuid(),
  service_id uuid not null,
  name text not null,
  client_description text,
  "order" integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.material_types (
  id uuid not null default gen_random_uuid(),
  service_id uuid not null,
  name text not null,
  price_hint text,
  "order" integer default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  image_url text
);

create table if not exists public.material_colors (
  id uuid not null default gen_random_uuid(),
  material_type_id uuid not null,
  name text not null,
  hex_color text,
  is_active boolean not null default true,
  "order" integer default 0,
  created_at timestamp with time zone not null default now(),
  requires_visit boolean not null default false,
  image_url text
);

create table if not exists public.stitching_types (
  id uuid not null default gen_random_uuid(),
  service_id uuid not null,
  name text not null,
  price_hint text,
  image_url text,
  "order" integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.stitching_colors (
  id uuid not null default gen_random_uuid(),
  stitching_type_id uuid not null,
  name text not null,
  hex_color text,
  image_url text,
  "order" integer not null default 0,
  is_active boolean not null default true
);

-- Cupones (antes que pedidos: orders.coupon_id apunta aquí) -------------
create table if not exists public.coupons (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  discount_type text not null,
  discount_value numeric not null,
  audience text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  service_id uuid,
  expires_at date,
  client_id uuid,
  requires_deposit boolean not null default false
);

-- Pedidos -------------------------------------------------------------
create table if not exists public.orders (
  id uuid not null default gen_random_uuid(),
  client_id uuid not null,
  vehicle_make text,
  vehicle_model text,
  vehicle_year integer,
  service_description text not null,
  status order_status not null default 'pendiente_revision'::order_status,
  estimated_price numeric(10,2),
  final_price numeric(10,2),
  admin_notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  material_type_id uuid,
  material_color_id uuid,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  service_id uuid,
  client_last_viewed_at timestamp with time zone,
  delivered_at timestamp with time zone,
  share_token uuid,
  coupon_id uuid,
  deposit_amount numeric,
  deposit_paid_at timestamp with time zone,
  deposit_registered_by uuid
);

create table if not exists public.order_items (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  service_id uuid,
  material_type_id uuid,
  material_color_id uuid,
  price numeric,
  "order" integer not null default 0,
  created_at timestamp with time zone not null default now(),
  current_stage_id uuid,
  stage_updated_at timestamp with time zone
);

create table if not exists public.order_photos (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  url text not null,
  uploaded_by uuid,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.order_status_history (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  status order_status not null,
  note text,
  changed_by uuid,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.order_item_stage_history (
  id uuid not null default gen_random_uuid(),
  order_item_id uuid not null,
  stage_id uuid,
  stage_name text not null,
  changed_by uuid,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.quote_reminders (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  sent_by uuid,
  channels text[] not null default '{}'::text[],
  created_at timestamp with time zone not null default now()
);

create table if not exists public.dropoff_proposals (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  proposed_by text not null,
  proposed_date date not null,
  proposed_time text not null,
  status text not null default 'pendiente'::text,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  responded_at timestamp with time zone
);

-- Cupones: uso -----------------------------------------------------------
create table if not exists public.coupon_redemptions (
  id uuid not null default gen_random_uuid(),
  coupon_id uuid not null,
  client_id uuid not null,
  order_id uuid,
  redeemed_at timestamp with time zone not null default now(),
  used_at timestamp with time zone
);

create table if not exists public.active_coupons (
  client_id uuid not null,
  coupon_id uuid not null,
  activated_at timestamp with time zone not null default now()
);

-- Lealtad y referidos ---------------------------------------------------
create table if not exists public.loyalty_settings (
  id integer not null default 1,
  pesos_per_point numeric not null default 100,
  points_for_reward integer not null default 500,
  reward_type text not null default 'fixed'::text,
  reward_value numeric not null default 200
);

create table if not exists public.loyalty_points (
  client_id uuid not null,
  balance integer not null default 0
);

create table if not exists public.loyalty_ledger (
  id uuid not null default gen_random_uuid(),
  client_id uuid not null,
  order_id uuid,
  points integer not null,
  type text not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.referral_settings (
  id integer not null default 1,
  reward_type text not null default 'fixed'::text,
  reward_value numeric not null default 100
);

create table if not exists public.referral_rewards (
  id uuid not null default gen_random_uuid(),
  referrer_id uuid not null,
  referred_id uuid not null,
  referrer_coupon_id uuid,
  referred_coupon_id uuid,
  created_at timestamp with time zone not null default now()
);

-- Citas -----------------------------------------------------------------
create table if not exists public.appointments (
  id uuid not null default gen_random_uuid(),
  client_id uuid,
  order_id uuid,
  client_name text not null,
  client_phone text not null,
  appointment_date date not null,
  appointment_time text not null,
  status text not null default 'pendiente'::text,
  notes text,
  created_at timestamp with time zone not null default now(),
  reason text,
  kind text not null default 'visita'::text
);

create table if not exists public.blocked_dates (
  blocked_date date not null,
  reason text,
  created_at timestamp with time zone not null default now()
);

-- Atención a clientes ---------------------------------------------------
create table if not exists public.complaints (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  client_id uuid not null,
  source text not null,
  description text not null,
  status text not null default 'abierta'::text,
  resolution_note text,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  satisfaction_rating integer,
  satisfaction_comment text
);

create table if not exists public.site_feedback (
  id uuid not null default gen_random_uuid(),
  client_id uuid not null,
  type text not null,
  message text not null,
  status text not null default 'nuevo'::text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.reviews (
  id uuid not null default gen_random_uuid(),
  order_id uuid not null,
  client_id uuid not null,
  rating integer not null,
  comment text,
  is_published boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.contact_submissions (
  id uuid not null default gen_random_uuid(),
  name text not null,
  phone text,
  message text not null,
  status text not null default 'nuevo'::text,
  created_at timestamp with time zone not null default now()
);

-- Sitio y negocio -------------------------------------------------------
create table if not exists public.gallery_items (
  id uuid not null default gen_random_uuid(),
  service_id uuid,
  image_before_url text,
  image_after_url text,
  caption text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.faqs (
  id uuid not null default gen_random_uuid(),
  question text not null,
  answer text not null,
  "order" integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.business_settings (
  id integer not null default 1,
  name text not null default 'Tapicería Automotriz by NOVO'::text,
  whatsapp text not null default '9998024783'::text,
  address text not null default 'C. 47 694-E x 88 y 90, Cd Caucel, 97314 Mérida, Yuc.'::text,
  hours_weekday text not null default '9:30 am – 5:00 pm'::text,
  hours_saturday text not null default '9:30 am – 3:00 pm'::text,
  facebook text default 'https://www.facebook.com/people/Tapicería-automotriz-by-NOVO/100065386363184/'::text
);

create table if not exists public.business_info (
  id uuid not null default gen_random_uuid(),
  key text not null,
  value text not null,
  embedding vector(1536),
  created_at timestamp with time zone not null default now()
);


-- ---------------------------------------------------------------------
-- 4. LLAVES PRIMARIAS, ÚNICAS Y REGLAS (CHECK)
-- ---------------------------------------------------------------------
select pg_temp.add_constraint('public.active_coupons', 'active_coupons_pkey', 'PRIMARY KEY (client_id)');
select pg_temp.add_constraint('public.appointments', 'appointments_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.appointments', 'appointments_kind_check', $c$CHECK ((kind = ANY (ARRAY['visita'::text, 'recepcion'::text])))$c$);
select pg_temp.add_constraint('public.appointments', 'appointments_status_check', $c$CHECK ((status = ANY (ARRAY['pendiente'::text, 'confirmada'::text, 'completada'::text, 'cancelada'::text])))$c$);
select pg_temp.add_constraint('public.audit_log', 'audit_log_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.blocked_dates', 'blocked_dates_pkey', 'PRIMARY KEY (blocked_date)');
select pg_temp.add_constraint('public.business_info', 'business_info_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.business_info', 'business_info_key_key', 'UNIQUE (key)');
select pg_temp.add_constraint('public.business_settings', 'business_settings_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.business_settings', 'single_row', 'CHECK ((id = 1))');
select pg_temp.add_constraint('public.complaints', 'complaints_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.complaints', 'complaints_satisfaction_rating_check', 'CHECK (((satisfaction_rating >= 1) AND (satisfaction_rating <= 5)))');
select pg_temp.add_constraint('public.complaints', 'complaints_source_check', $c$CHECK ((source = ANY (ARRAY['web'::text, 'whatsapp'::text])))$c$);
select pg_temp.add_constraint('public.complaints', 'complaints_status_check', $c$CHECK ((status = ANY (ARRAY['abierta'::text, 'atendida'::text, 'cerrada'::text])))$c$);
select pg_temp.add_constraint('public.contact_submissions', 'contact_submissions_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.coupon_redemptions', 'coupon_redemptions_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.coupon_redemptions', 'coupon_redemptions_coupon_id_client_id_key', 'UNIQUE (coupon_id, client_id)');
select pg_temp.add_constraint('public.coupons', 'coupons_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.coupons', 'coupons_audience_check', $c$CHECK ((audience = ANY (ARRAY['nuevos'::text, 'ambos'::text, 'registrados'::text, 'frecuentes'::text, 'clientes'::text])))$c$);
select pg_temp.add_constraint('public.coupons', 'coupons_discount_type_check', $c$CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])))$c$);
select pg_temp.add_constraint('public.coupons', 'coupons_discount_value_check', 'CHECK ((discount_value > (0)::numeric))');
select pg_temp.add_constraint('public.dropoff_proposals', 'dropoff_proposals_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.dropoff_proposals', 'dropoff_proposals_proposed_by_check', $c$CHECK ((proposed_by = ANY (ARRAY['staff'::text, 'cliente'::text])))$c$);
select pg_temp.add_constraint('public.dropoff_proposals', 'dropoff_proposals_status_check', $c$CHECK ((status = ANY (ARRAY['pendiente'::text, 'aceptada'::text, 'rechazada'::text])))$c$);
select pg_temp.add_constraint('public.faqs', 'faqs_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.gallery_items', 'gallery_items_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.loyalty_ledger', 'loyalty_ledger_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.loyalty_ledger', 'loyalty_ledger_type_check', $c$CHECK ((type = ANY (ARRAY['ganado'::text, 'canjeado'::text])))$c$);
select pg_temp.add_constraint('public.loyalty_points', 'loyalty_points_pkey', 'PRIMARY KEY (client_id)');
select pg_temp.add_constraint('public.loyalty_settings', 'loyalty_settings_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.loyalty_settings', 'loyalty_settings_reward_type_check', $c$CHECK ((reward_type = ANY (ARRAY['percentage'::text, 'fixed'::text])))$c$);
select pg_temp.add_constraint('public.loyalty_settings', 'single_row', 'CHECK ((id = 1))');
select pg_temp.add_constraint('public.material_colors', 'material_colors_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.material_types', 'material_types_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.notification_reads', 'notification_reads_pkey', 'PRIMARY KEY (user_id, notification_key)');
select pg_temp.add_constraint('public.order_item_stage_history', 'order_item_stage_history_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.order_items', 'order_items_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.order_photos', 'order_photos_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.order_status_history', 'order_status_history_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.orders', 'orders_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.orders', 'orders_share_token_key', 'UNIQUE (share_token)');
select pg_temp.add_constraint('public.profiles', 'profiles_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.profiles', 'profiles_text_size_check', $c$CHECK ((text_size = ANY (ARRAY['normal'::text, 'grande'::text, 'extra'::text])))$c$);
select pg_temp.add_constraint('public.profiles', 'profiles_ui_mode_check', $c$CHECK ((ui_mode = ANY (ARRAY['normal'::text, 'sencillo'::text])))$c$);
select pg_temp.add_constraint('public.push_subscriptions', 'push_subscriptions_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.push_subscriptions', 'push_subscriptions_endpoint_key', 'UNIQUE (endpoint)');
select pg_temp.add_constraint('public.quote_reminders', 'quote_reminders_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.referral_rewards', 'referral_rewards_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.referral_rewards', 'referral_rewards_referred_id_key', 'UNIQUE (referred_id)');
select pg_temp.add_constraint('public.referral_settings', 'referral_settings_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.referral_settings', 'referral_settings_reward_type_check', $c$CHECK ((reward_type = ANY (ARRAY['percentage'::text, 'fixed'::text])))$c$);
select pg_temp.add_constraint('public.referral_settings', 'single_row', 'CHECK ((id = 1))');
select pg_temp.add_constraint('public.reviews', 'reviews_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.reviews', 'reviews_order_id_unique', 'UNIQUE (order_id)');
select pg_temp.add_constraint('public.reviews', 'reviews_rating_check', 'CHECK (((rating >= 1) AND (rating <= 5)))');
select pg_temp.add_constraint('public.service_stages', 'service_stages_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.services', 'services_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.services', 'services_slug_key', 'UNIQUE (slug)');
select pg_temp.add_constraint('public.site_feedback', 'site_feedback_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.site_feedback', 'site_feedback_status_check', $c$CHECK ((status = ANY (ARRAY['nuevo'::text, 'revisado'::text])))$c$);
select pg_temp.add_constraint('public.site_feedback', 'site_feedback_type_check', $c$CHECK ((type = ANY (ARRAY['queja'::text, 'sugerencia'::text])))$c$);
select pg_temp.add_constraint('public.stitching_colors', 'stitching_colors_pkey', 'PRIMARY KEY (id)');
select pg_temp.add_constraint('public.stitching_types', 'stitching_types_pkey', 'PRIMARY KEY (id)');


-- ---------------------------------------------------------------------
-- 5. LLAVES FORÁNEAS (relaciones entre tablas)
-- ---------------------------------------------------------------------
select pg_temp.add_constraint('public.active_coupons', 'active_coupons_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.active_coupons', 'active_coupons_coupon_id_fkey', 'FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.appointments', 'appointments_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.appointments', 'appointments_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.audit_log', 'audit_log_actor_id_fkey', 'FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.complaints', 'complaints_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.complaints', 'complaints_created_by_fkey', 'FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.complaints', 'complaints_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.coupon_redemptions', 'coupon_redemptions_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.coupon_redemptions', 'coupon_redemptions_coupon_id_fkey', 'FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.coupon_redemptions', 'coupon_redemptions_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.coupons', 'coupons_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.coupons', 'coupons_service_id_fkey', 'FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.dropoff_proposals', 'dropoff_proposals_created_by_fkey', 'FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.dropoff_proposals', 'dropoff_proposals_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.gallery_items', 'gallery_items_service_id_fkey', 'FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.loyalty_ledger', 'loyalty_ledger_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.loyalty_ledger', 'loyalty_ledger_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.loyalty_points', 'loyalty_points_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.material_colors', 'material_colors_material_type_id_fkey', 'FOREIGN KEY (material_type_id) REFERENCES public.material_types(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.material_types', 'material_types_service_id_fkey', 'FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.notification_reads', 'notification_reads_user_id_fkey', 'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.order_item_stage_history', 'order_item_stage_history_changed_by_fkey', 'FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.order_item_stage_history', 'order_item_stage_history_order_item_id_fkey', 'FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.order_item_stage_history', 'order_item_stage_history_stage_id_fkey', 'FOREIGN KEY (stage_id) REFERENCES public.service_stages(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.order_items', 'order_items_current_stage_id_fkey', 'FOREIGN KEY (current_stage_id) REFERENCES public.service_stages(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.order_items', 'order_items_material_color_id_fkey', 'FOREIGN KEY (material_color_id) REFERENCES public.material_colors(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.order_items', 'order_items_material_type_id_fkey', 'FOREIGN KEY (material_type_id) REFERENCES public.material_types(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.order_items', 'order_items_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.order_items', 'order_items_service_id_fkey', 'FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.order_photos', 'order_photos_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.order_photos', 'order_photos_uploaded_by_fkey', 'FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)');
select pg_temp.add_constraint('public.order_status_history', 'order_status_history_changed_by_fkey', 'FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.order_status_history', 'order_status_history_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.orders', 'orders_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.orders', 'orders_coupon_id_fkey', 'FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.orders', 'orders_deleted_by_fkey', 'FOREIGN KEY (deleted_by) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.orders', 'orders_deposit_registered_by_fkey', 'FOREIGN KEY (deposit_registered_by) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.orders', 'orders_material_color_id_fkey', 'FOREIGN KEY (material_color_id) REFERENCES public.material_colors(id)');
select pg_temp.add_constraint('public.orders', 'orders_material_type_id_fkey', 'FOREIGN KEY (material_type_id) REFERENCES public.material_types(id)');
select pg_temp.add_constraint('public.orders', 'orders_service_id_fkey', 'FOREIGN KEY (service_id) REFERENCES public.services(id)');
select pg_temp.add_constraint('public.profiles', 'profiles_id_fkey', 'FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.profiles', 'profiles_referred_by_fkey', 'FOREIGN KEY (referred_by) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.push_subscriptions', 'push_subscriptions_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.quote_reminders', 'quote_reminders_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.quote_reminders', 'quote_reminders_sent_by_fkey', 'FOREIGN KEY (sent_by) REFERENCES public.profiles(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.referral_rewards', 'referral_rewards_referred_coupon_id_fkey', 'FOREIGN KEY (referred_coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.referral_rewards', 'referral_rewards_referred_id_fkey', 'FOREIGN KEY (referred_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.referral_rewards', 'referral_rewards_referrer_coupon_id_fkey', 'FOREIGN KEY (referrer_coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL');
select pg_temp.add_constraint('public.referral_rewards', 'referral_rewards_referrer_id_fkey', 'FOREIGN KEY (referrer_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.reviews', 'reviews_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.reviews', 'reviews_order_id_fkey', 'FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.service_stages', 'service_stages_service_id_fkey', 'FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.site_feedback', 'site_feedback_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.stitching_colors', 'stitching_colors_stitching_type_id_fkey', 'FOREIGN KEY (stitching_type_id) REFERENCES public.stitching_types(id) ON DELETE CASCADE');
select pg_temp.add_constraint('public.stitching_types', 'stitching_types_service_id_fkey', 'FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE');


-- ---------------------------------------------------------------------
-- 6. ÍNDICES
-- ---------------------------------------------------------------------
create index if not exists dropoff_proposals_order_idx on public.dropoff_proposals using btree (order_id, created_at);
create index if not exists idx_profiles_marketing_opt_in on public.profiles using btree (marketing_opt_in) where (marketing_opt_in = true);
create index if not exists quote_reminders_order_idx on public.quote_reminders using btree (order_id, created_at desc);


-- ---------------------------------------------------------------------
-- 7. SEGURIDAD POR FILA (RLS) — todas las tablas la tienen prendida
-- ---------------------------------------------------------------------
alter table public.active_coupons enable row level security;
alter table public.appointments enable row level security;
alter table public.audit_log enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.business_info enable row level security;
alter table public.business_settings enable row level security;
alter table public.complaints enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.coupons enable row level security;
alter table public.dropoff_proposals enable row level security;
alter table public.faqs enable row level security;
alter table public.gallery_items enable row level security;
alter table public.loyalty_ledger enable row level security;
alter table public.loyalty_points enable row level security;
alter table public.loyalty_settings enable row level security;
alter table public.material_colors enable row level security;
alter table public.material_types enable row level security;
alter table public.notification_reads enable row level security;
alter table public.order_item_stage_history enable row level security;
alter table public.order_items enable row level security;
alter table public.order_photos enable row level security;
alter table public.order_status_history enable row level security;
alter table public.orders enable row level security;
alter table public.profiles enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.quote_reminders enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.referral_settings enable row level security;
alter table public.reviews enable row level security;
alter table public.service_stages enable row level security;
alter table public.services enable row level security;
alter table public.site_feedback enable row level security;
alter table public.stitching_colors enable row level security;
alter table public.stitching_types enable row level security;


-- ---------------------------------------------------------------------
-- 8. FUNCIONES
-- ---------------------------------------------------------------------

-- 8.1 Ayudantes que usan las demás ----------------------------------

-- Rol del usuario actual (solo si está activo).
CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from public.profiles where id = auth.uid() and is_active = true;
$function$;

-- Frecuente = 5 o más pedidos entregados.
CREATE OR REPLACE FUNCTION public.is_frequent_client(p_client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select count(*) >= 5
  from public.orders
  where client_id = p_client_id and status = 'entregado' and deleted_at is null;
$function$;

-- Nuevo = sin pedidos (sin contar rechazados/cancelados/eliminados).
CREATE OR REPLACE FUNCTION public.is_new_client(p_client_id uuid, p_except_order uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select not exists (
    select 1 from public.orders
    where client_id = p_client_id
      and deleted_at is null
      and status not in ('rechazado', 'cancelado')
      and (p_except_order is null or id <> p_except_order)
  );
$function$;

-- Categoría: nuevo · no_frecuente · frecuente.
CREATE OR REPLACE FUNCTION public.client_segment(p_client_id uuid, p_except_order uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case
    when public.is_new_client(p_client_id, p_except_order) then 'nuevo'
    when public.is_frequent_client(p_client_id) then 'frecuente'
    else 'no_frecuente'
  end;
$function$;

-- ¿La audiencia del cupón incluye esa categoría?
CREATE OR REPLACE FUNCTION public.coupon_audience_matches(p_audience text, p_segment text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case p_audience
    when 'ambos' then true
    when 'nuevos' then p_segment = 'nuevo'
    when 'registrados' then p_segment in ('no_frecuente', 'frecuente')
    when 'frecuentes' then p_segment = 'frecuente'
    when 'clientes' then p_segment = 'no_frecuente'
    else false
  end;
$function$;

-- Bitácora de cambios (Historial del panel).
CREATE OR REPLACE FUNCTION public.write_audit_log(p_action text, p_entity_type text, p_entity_label text, p_details text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_actor_name text;
begin
  select full_name into v_actor_name from public.profiles where id = auth.uid();

  insert into public.audit_log (actor_id, actor_name, action, entity_type, entity_label, details)
  values (auth.uid(), coalesce(v_actor_name, 'Sistema'), p_action, p_entity_type, p_entity_label, p_details);
end;
$function$;


-- 8.2 Funciones de triggers ---------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, phone, email, role, marketing_opt_in)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'cliente'),
    coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  );
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.award_welcome_coupon()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_coupon_id uuid;
begin
  if new.role = 'cliente' then
    insert into public.coupons (title, description, discount_type, discount_value, audience, client_id, is_active)
    values ('10% de bienvenida', 'Válido en tu primer pedido', 'percentage', 10, 'clientes', new.id, true)
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
$function$;

CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.get_my_role() <> 'admin' then
    if new.role is distinct from old.role or new.is_active is distinct from old.is_active then
      raise exception 'No tienes permiso para cambiar tu rol o estado de actividad.';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.audit_profile_role_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if old.role is distinct from new.role then
    perform public.write_audit_log(
      'Cambio de rol', 'Usuario', new.full_name,
      old.role || ' → ' || new.role
    );
  end if;

  if old.is_active is distinct from new.is_active then
    perform public.write_audit_log(
      case when new.is_active then 'Usuario reactivado' else 'Usuario desactivado' end,
      'Usuario', new.full_name, null
    );
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.client_last_viewed_at is distinct from old.client_last_viewed_at
     and new.status is not distinct from old.status
     and new.estimated_price is not distinct from old.estimated_price
     and new.final_price is not distinct from old.final_price
     and new.admin_notes is not distinct from old.admin_notes
     and new.material_type_id is not distinct from old.material_type_id
     and new.material_color_id is not distinct from old.material_color_id
     and new.service_id is not distinct from old.service_id
     and new.deleted_at is not distinct from old.deleted_at
  then
    -- Solo cambió la marca de "visto" — no cuenta como actualización real
    new.updated_at = old.updated_at;
  else
    new.updated_at = now();
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_delivered_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.status = 'entregado' and old.status is distinct from 'entregado' then
    new.delivered_at = now();
  elsif new.status is distinct from 'entregado' then
    new.delivered_at = null;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.log_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if (tg_op = 'INSERT') or (old.status is distinct from new.status) then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_order_status_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  allowed boolean := false;
begin
  if old.status = new.status then
    return new;
  end if;

  allowed := case old.status
    when 'pendiente_revision' then new.status in ('cotizado', 'cancelado')
    when 'cotizado' then new.status in ('aprobado', 'rechazado', 'cancelado')
    when 'aprobado' then new.status in ('en_proceso', 'cotizado', 'cancelado')
    when 'rechazado' then new.status in ('cancelado')
    when 'en_proceso' then new.status in ('listo_para_entrega', 'cotizado', 'cancelado')
    when 'listo_para_entrega' then new.status in ('entregado', 'cotizado', 'cancelado')
    else false
  end;

  if not allowed then
    raise exception 'Transición de estado no permitida: % -> %', old.status, new.status;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_edit_after_final_state()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if old.status in ('cancelado', 'entregado') then
    if new.status is distinct from old.status
      or new.estimated_price is distinct from old.estimated_price
      or new.final_price is distinct from old.final_price
      or new.admin_notes is distinct from old.admin_notes
      or new.material_type_id is distinct from old.material_type_id
      or new.material_color_id is distinct from old.material_color_id
    then
      raise exception 'Este pedido ya está en un estado final y no se puede editar.';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_employee_price_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.get_my_role() = 'empleado' then
    if new.final_price is distinct from old.final_price
       or new.estimated_price is distinct from old.estimated_price
    then
      raise exception 'Solo un administrador puede cambiar el precio.';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_employee_item_price_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.get_my_role() = 'empleado' then
    if new.price is distinct from old.price then
      raise exception 'Solo un administrador puede cambiar el precio.';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_quote_without_price()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.status = 'cotizado' and new.estimated_price is null then
    raise exception 'No se puede marcar como Cotizado sin un precio.';
  end if;
  return new;
end;
$function$;

-- Al entregar, la base de datos fija el precio final (también cuando entrega
-- un empleado). Si el cupón pedía anticipo y no se dejó el 50%, se quita el
-- cupón, le regresa al cliente y se cobra la suma de servicios sin descuento.
CREATE OR REPLACE FUNCTION public.set_final_price_on_delivery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.mark_coupon_used_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.status = 'aprobado' and old.status is distinct from 'aprobado' and new.coupon_id is not null then
    update public.coupon_redemptions
    set used_at = now()
    where order_id = new.id and coupon_id = new.coupon_id;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.award_loyalty_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_pesos_per_point numeric;
  v_points int;
begin
  if new.status = 'entregado' and old.status is distinct from 'entregado' and new.final_price is not null then
    select pesos_per_point into v_pesos_per_point from public.loyalty_settings where id = 1;
    v_points := floor(new.final_price / v_pesos_per_point);

    if v_points > 0 then
      insert into public.loyalty_points (client_id, balance)
      values (new.client_id, v_points)
      on conflict (client_id) do update set balance = loyalty_points.balance + v_points;

      insert into public.loyalty_ledger (client_id, order_id, points, type)
      values (new.client_id, new.id, v_points, 'ganado');
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.award_referral_reward()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

        insert into public.coupons (title, description, discount_type, discount_value, audience, client_id, is_active)
        values ('Recompensa por referido', 'Gracias por invitar a un amigo al taller.', v_settings.reward_type, v_settings.reward_value, 'ambos', v_referred_by, true)
        returning id into v_referrer_coupon;

        insert into public.coupons (title, description, discount_type, discount_value, audience, client_id, is_active)
        values ('Bienvenida', 'Un descuento de bienvenida por venir referido.', v_settings.reward_type, v_settings.reward_value, 'ambos', new.client_id, true)
        returning id into v_referred_coupon;

        insert into public.referral_rewards (referrer_id, referred_id, referrer_coupon_id, referred_coupon_id)
        values (v_referred_by, new.client_id, v_referrer_coupon, v_referred_coupon);
      end if;
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.init_stages_on_in_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  with upd as (
    update public.order_items oi
    set current_stage_id = (
          select ss.id from public.service_stages ss
          where ss.service_id = oi.service_id and ss.is_active
          order by ss."order" limit 1
        ),
        stage_updated_at = now()
    where oi.order_id = new.id and oi.current_stage_id is null
    returning oi.id, oi.current_stage_id
  )
  insert into public.order_item_stage_history (order_item_id, stage_id, stage_name)
  select upd.id, upd.current_stage_id, ss.name
  from upd join public.service_stages ss on ss.id = upd.current_stage_id;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.audit_orders_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_label text;
begin
  select coalesce(vehicle_make || ' ' || vehicle_model, 'Pedido') into v_label
  from public.orders where id = new.id;

  if old.status is distinct from new.status then
    perform public.write_audit_log(
      'Cambio de estado', 'Pedido', v_label,
      old.status || ' → ' || new.status
    );
  end if;

  if old.estimated_price is distinct from new.estimated_price then
    perform public.write_audit_log(
      'Cambio de precio', 'Pedido', v_label,
      coalesce(old.estimated_price::text, 'sin precio') || ' → ' || coalesce(new.estimated_price::text, 'sin precio')
    );
  end if;

  if old.deleted_at is null and new.deleted_at is not null then
    perform public.write_audit_log('Eliminación', 'Pedido', v_label, null);
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.audit_services_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit_log('Servicio creado', 'Servicio', new.title, null);
  elsif tg_op = 'UPDATE' then
    perform public.write_audit_log('Servicio editado', 'Servicio', new.title, null);
  elsif tg_op = 'DELETE' then
    perform public.write_audit_log('Servicio eliminado', 'Servicio', old.title, null);
  end if;
  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.audit_gallery_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    perform public.write_audit_log('Foto agregada', 'Galería', coalesce(new.caption, 'Sin descripción'), null);
  elsif tg_op = 'DELETE' then
    perform public.write_audit_log('Foto eliminada', 'Galería', coalesce(old.caption, 'Sin descripción'), null);
  end if;
  return coalesce(new, old);
end;
$function$;

CREATE OR REPLACE FUNCTION public.check_contact_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from public.contact_submissions
  where phone = new.phone
    and created_at > now() - interval '1 hour';

  if recent_count >= 3 then
    raise exception 'Has enviado demasiados mensajes. Intenta de nuevo más tarde.';
  end if;

  return new;
end;
$function$;


-- 8.3 Funciones que llama la página ------------------------------------

-- Pedidos -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.client_respond_to_quote(order_id uuid, new_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  order_client uuid;
  order_current_status text;
begin
  select client_id, status into order_client, order_current_status
  from public.orders where id = order_id;

  if order_client is null then
    raise exception 'Pedido no encontrado';
  end if;

  if order_client <> auth.uid() then
    raise exception 'No autorizado';
  end if;

  if order_current_status <> 'cotizado' then
    raise exception 'Este pedido no está en estado de cotización';
  end if;

  if new_status not in ('aprobado', 'rechazado') then
    raise exception 'Estado inválido';
  end if;

  update public.orders set status = new_status::order_status where id = order_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.mark_order_viewed(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.orders
  set client_last_viewed_at = now()
  where id = p_order_id and client_id = auth.uid();
end;
$function$;

CREATE OR REPLACE FUNCTION public.soft_delete_order(order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  order_client uuid;
  requester_role user_role;
begin
  select client_id into order_client from public.orders where id = order_id;

  if order_client is null then
    raise exception 'Pedido no encontrado';
  end if;

  select role into requester_role from public.profiles where id = auth.uid();

  if not (order_client = auth.uid() or requester_role in ('empleado', 'admin')) then
    raise exception 'No autorizado';
  end if;

  update public.orders
  set deleted_at = now(), deleted_by = auth.uid()
  where id = order_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.find_order_by_folio(p_folio text)
 RETURNS TABLE(id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select o.id from public.orders o
  where upper(left(o.id::text, 8)) = upper(p_folio);
$function$;

CREATE OR REPLACE FUNCTION public.set_order_item_stage(p_item_id uuid, p_stage_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_service_id uuid;
  v_stage_service uuid;
  v_stage_name text;
begin
  if public.get_my_role() is null or public.get_my_role() not in ('empleado', 'admin') then
    raise exception 'No autorizado';
  end if;

  select service_id into v_service_id from public.order_items where id = p_item_id;
  select service_id, name into v_stage_service, v_stage_name
  from public.service_stages where id = p_stage_id and is_active = true;

  if v_service_id is null or v_stage_service is distinct from v_service_id then
    raise exception 'Esa etapa no corresponde a este servicio';
  end if;

  update public.order_items
  set current_stage_id = p_stage_id, stage_updated_at = now()
  where id = p_item_id;

  insert into public.order_item_stage_history (order_item_id, stage_id, stage_name, changed_by)
  values (p_item_id, p_stage_id, v_stage_name, auth.uid());
end;
$function$;

CREATE OR REPLACE FUNCTION public.register_deposit(p_order_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.purge_deleted_orders_internal(p_older_than_days integer DEFAULT NULL::integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  purged_count int;
begin
  if p_older_than_days is null then
    -- Purga manual: TODOS los eliminados, sin importar antigüedad
    select count(*) into purged_count from public.orders where deleted_at is not null;

    perform public.write_audit_log(
      'Purga de pedidos', 'Sistema',
      purged_count || ' pedido(s)',
      'Eliminados permanentemente (manual, todos los marcados como eliminados)'
    );

    delete from public.orders where deleted_at is not null;
  else
    -- Purga automática: solo los que llevan más de X días eliminados
    select count(*) into purged_count
    from public.orders
    where deleted_at is not null
      and deleted_at < now() - (p_older_than_days || ' days')::interval;

    perform public.write_audit_log(
      'Purga de pedidos', 'Sistema',
      purged_count || ' pedido(s)',
      'Eliminados automáticamente (más de ' || p_older_than_days || ' días)'
    );

    delete from public.orders
    where deleted_at is not null
      and deleted_at < now() - (p_older_than_days || ' days')::interval;
  end if;

  return purged_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.purge_deleted_orders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.get_my_role() <> 'admin' then
    raise exception 'No autorizado';
  end if;

  -- Llamada manual desde el botón: sin filtro de días, borra todo
  return public.purge_deleted_orders_internal(null);
end;
$function$;

-- Seguimiento público (/seguimiento/[token]) --------------------------------
CREATE OR REPLACE FUNCTION public.generate_share_token(p_order_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_token uuid;
begin
  select share_token into v_token from public.orders
  where id = p_order_id and client_id = auth.uid();

  if v_token is null then
    v_token := gen_random_uuid();
    update public.orders set share_token = v_token
    where id = p_order_id and client_id = auth.uid();
  end if;

  return v_token;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_order_by_share_token(p_token uuid)
 RETURNS TABLE(vehicle_make text, vehicle_model text, status text, created_at timestamp with time zone, total_price numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    o.vehicle_make, o.vehicle_model, o.status::text, o.created_at,
    coalesce(o.final_price, o.estimated_price)
  from public.orders o
  where o.share_token = p_token and o.deleted_at is null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_order_history_by_share_token(p_token uuid)
 RETURNS TABLE(status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select h.status::text, h.created_at
  from public.order_status_history h
  join public.orders o on o.id = h.order_id
  where o.share_token = p_token and o.deleted_at is null
  order by h.created_at asc;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_order_items_by_share_token(p_token uuid)
 RETURNS TABLE(service_title text, material_label text, price numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    coalesce(s.title, 'Servicio'),
    case
      when mt.name is not null and mc.name is not null then mt.name || ' · ' || mc.name
      else mt.name
    end,
    oi.price
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.services s on s.id = oi.service_id
  left join public.material_types mt on mt.id = oi.material_type_id
  left join public.material_colors mc on mc.id = oi.material_color_id
  where o.share_token = p_token and o.deleted_at is null
  order by oi."order" asc;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_order_stages_by_share_token(p_token uuid)
 RETURNS TABLE(item_id uuid, item_order integer, service_title text, stage_id uuid, stage_name text, client_description text, stage_order integer, is_current boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

-- Fecha para traer el coche ----------------------------------------------
CREATE OR REPLACE FUNCTION public.propose_dropoff(p_order_id uuid, p_date date, p_time text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.accept_dropoff(p_proposal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Cupones, puntos y referidos ----------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_coupon_to_order(p_coupon_id uuid, p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_my_coupons()
 RETURNS TABLE(id uuid, title text, description text, discount_type text, discount_value numeric, audience text, service_id uuid, service_title text, expires_at date, is_personal boolean, requires_deposit boolean, status text, redeemed_at timestamp with time zone, order_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_client_segments()
 RETURNS TABLE(id uuid, full_name text, email text, phone text, created_at timestamp with time zone, orders_count bigint, delivered_count bigint, segment text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.redeem_loyalty_points()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  insert into public.coupons (title, description, discount_type, discount_value, audience, client_id, is_active)
  values (
    'Recompensa por puntos',
    'Cupón generado por canjear tus puntos de lealtad.',
    v_settings.reward_type,
    v_settings.reward_value,
    'ambos',
    auth.uid(),
    true
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
$function$;

CREATE OR REPLACE FUNCTION public.set_referred_by(p_referred_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_referred_by = auth.uid() then
    return; -- no permitir auto-referirse
  end if;

  update public.profiles
  set referred_by = p_referred_by
  where id = auth.uid() and referred_by is null;
end;
$function$;

-- Perfil y preferencias -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_marketing_opt_in(p_value boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.profiles
  set marketing_opt_in = p_value
  where id = auth.uid();
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_marketing_subscribers()
 RETURNS TABLE(email text, full_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if public.get_my_role() != 'admin' then
    raise exception 'No autorizado';
  end if;

  return query
  select p.email, p.full_name
  from public.profiles p
  where p.marketing_opt_in = true and p.role = 'cliente';
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_ui_preferences(p_ui_mode text, p_text_size text, p_high_contrast boolean, p_reduce_motion boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;


-- ---------------------------------------------------------------------
-- 9. PERMISOS DE LAS FUNCIONES
--    Supabase da permiso de ejecutar a todos por defecto; estas son las
--    que se restringieron a propósito.
-- ---------------------------------------------------------------------
revoke all on function public.get_my_coupons() from public, anon;
grant execute on function public.get_my_coupons() to authenticated;
revoke all on function public.get_client_segments() from public, anon;
grant execute on function public.get_client_segments() to authenticated;
revoke all on function public.set_ui_preferences(text, text, boolean, boolean) from public, anon;
grant execute on function public.set_ui_preferences(text, text, boolean, boolean) to authenticated;
revoke all on function public.set_order_item_stage(uuid, uuid) from public, anon;
grant execute on function public.set_order_item_stage(uuid, uuid) to authenticated;
revoke all on function public.propose_dropoff(uuid, date, text) from public, anon;
grant execute on function public.propose_dropoff(uuid, date, text) to authenticated;
revoke all on function public.accept_dropoff(uuid) from public, anon;
grant execute on function public.accept_dropoff(uuid) to authenticated;
revoke all on function public.register_deposit(uuid, numeric) from public, anon;
grant execute on function public.register_deposit(uuid, numeric) to authenticated;
-- Solo se usan dentro de otras funciones.
revoke all on function public.is_new_client(uuid, uuid) from public, anon, authenticated;
revoke all on function public.client_segment(uuid, uuid) from public, anon, authenticated;
-- El seguimiento público lo usa gente sin cuenta.
grant execute on function public.get_order_by_share_token(uuid) to anon, authenticated;
grant execute on function public.get_order_history_by_share_token(uuid) to anon, authenticated;
grant execute on function public.get_order_items_by_share_token(uuid) to anon, authenticated;
grant execute on function public.get_order_stages_by_share_token(uuid) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 10. TRIGGERS
--     Los BEFORE UPDATE de orders corren en orden alfabético; el "zz_"
--     del precio final va al último a propósito (después del candado de
--     precios del empleado).
-- ---------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists award_welcome_coupon_trigger on public.profiles;
create trigger award_welcome_coupon_trigger after insert on public.profiles
  for each row execute function public.award_welcome_coupon();
drop trigger if exists prevent_self_privilege_escalation_trigger on public.profiles;
create trigger prevent_self_privilege_escalation_trigger before update on public.profiles
  for each row execute function public.prevent_self_privilege_escalation();
drop trigger if exists audit_profiles_trigger on public.profiles;
create trigger audit_profiles_trigger after update on public.profiles
  for each row execute function public.audit_profile_role_changes();

drop trigger if exists enforce_order_status_transition_trigger on public.orders;
create trigger enforce_order_status_transition_trigger before update on public.orders
  for each row execute function public.enforce_order_status_transition();
drop trigger if exists on_order_updated on public.orders;
create trigger on_order_updated before update on public.orders
  for each row execute function public.handle_updated_at();
drop trigger if exists prevent_edit_after_final_state_trigger on public.orders;
create trigger prevent_edit_after_final_state_trigger before update on public.orders
  for each row execute function public.prevent_edit_after_final_state();
drop trigger if exists prevent_employee_price_change_trigger on public.orders;
create trigger prevent_employee_price_change_trigger before update on public.orders
  for each row execute function public.prevent_employee_price_change();
drop trigger if exists prevent_quote_without_price_trigger on public.orders;
create trigger prevent_quote_without_price_trigger before update on public.orders
  for each row execute function public.prevent_quote_without_price();
drop trigger if exists set_delivered_at_trigger on public.orders;
create trigger set_delivered_at_trigger before update on public.orders
  for each row execute function public.handle_delivered_at();
drop trigger if exists zz_set_final_price_on_delivery on public.orders;
create trigger zz_set_final_price_on_delivery before update on public.orders
  for each row execute function public.set_final_price_on_delivery();
drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change after insert or update on public.orders
  for each row execute function public.log_order_status_change();
drop trigger if exists audit_orders_trigger on public.orders;
create trigger audit_orders_trigger after update on public.orders
  for each row execute function public.audit_orders_changes();
drop trigger if exists award_loyalty_points_trigger on public.orders;
create trigger award_loyalty_points_trigger after update on public.orders
  for each row execute function public.award_loyalty_points();
drop trigger if exists award_referral_reward_trigger on public.orders;
create trigger award_referral_reward_trigger after update on public.orders
  for each row execute function public.award_referral_reward();
drop trigger if exists mark_coupon_used_on_approval_trigger on public.orders;
create trigger mark_coupon_used_on_approval_trigger after update on public.orders
  for each row execute function public.mark_coupon_used_on_approval();
drop trigger if exists init_stages_on_in_progress_trigger on public.orders;
create trigger init_stages_on_in_progress_trigger after update on public.orders
  for each row when (((new.status = 'en_proceso'::order_status) and (old.status is distinct from 'en_proceso'::order_status)))
  execute function public.init_stages_on_in_progress();

drop trigger if exists prevent_employee_item_price_change_trigger on public.order_items;
create trigger prevent_employee_item_price_change_trigger before update on public.order_items
  for each row execute function public.prevent_employee_item_price_change();

drop trigger if exists audit_services_trigger on public.services;
create trigger audit_services_trigger after insert or delete or update on public.services
  for each row execute function public.audit_services_changes();
drop trigger if exists audit_gallery_trigger on public.gallery_items;
create trigger audit_gallery_trigger after insert or delete on public.gallery_items
  for each row execute function public.audit_gallery_changes();
drop trigger if exists contact_rate_limit_trigger on public.contact_submissions;
create trigger contact_rate_limit_trigger before insert on public.contact_submissions
  for each row execute function public.check_contact_rate_limit();


-- ---------------------------------------------------------------------
-- 11. POLÍTICAS DE ACCESO (quién ve y cambia qué)
-- ---------------------------------------------------------------------

-- profiles
drop policy if exists "Ver propio perfil o staff ve todos" on public.profiles;
create policy "Ver propio perfil o staff ve todos" on public.profiles for select to public
  using (((auth.uid() = id) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Actualizar propio perfil" on public.profiles;
create policy "Actualizar propio perfil" on public.profiles for update to public
  using ((auth.uid() = id));
drop policy if exists "Admin actualiza cualquier perfil" on public.profiles;
create policy "Admin actualiza cualquier perfil" on public.profiles for update to public
  using ((get_my_role() = 'admin'::user_role));

-- push_subscriptions
drop policy if exists "Cliente gestiona sus propias suscripciones" on public.push_subscriptions;
create policy "Cliente gestiona sus propias suscripciones" on public.push_subscriptions for all to public
  using ((client_id = auth.uid())) with check ((client_id = auth.uid()));
drop policy if exists "Staff puede leer para mandar notificaciones" on public.push_subscriptions;
create policy "Staff puede leer para mandar notificaciones" on public.push_subscriptions for select to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));

-- notification_reads
drop policy if exists notification_reads_own on public.notification_reads;
create policy notification_reads_own on public.notification_reads for all to authenticated
  using ((user_id = auth.uid())) with check ((user_id = auth.uid()));

-- audit_log
drop policy if exists "Solo staff ve el historial" on public.audit_log;
create policy "Solo staff ve el historial" on public.audit_log for select to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));

-- services
drop policy if exists "Servicios activos son públicos" on public.services;
create policy "Servicios activos son públicos" on public.services for select to public
  using (((is_active = true) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Solo admin gestiona servicios" on public.services;
create policy "Solo admin gestiona servicios" on public.services for all to public
  using ((get_my_role() = 'admin'::user_role));

-- service_stages
drop policy if exists "Etapas son de lectura publica" on public.service_stages;
create policy "Etapas son de lectura publica" on public.service_stages for select to public using (true);
drop policy if exists "Solo admin gestiona etapas" on public.service_stages;
create policy "Solo admin gestiona etapas" on public.service_stages for all to public
  using ((get_my_role() = 'admin'::user_role));

-- material_types / material_colors
drop policy if exists "Materiales activos son públicos" on public.material_types;
create policy "Materiales activos son públicos" on public.material_types for select to public
  using (((is_active = true) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Solo admin gestiona tipos de material" on public.material_types;
create policy "Solo admin gestiona tipos de material" on public.material_types for all to public
  using ((get_my_role() = 'admin'::user_role));
drop policy if exists "Colores activos son públicos" on public.material_colors;
create policy "Colores activos son públicos" on public.material_colors for select to public
  using (((is_active = true) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Solo admin gestiona colores" on public.material_colors;
create policy "Solo admin gestiona colores" on public.material_colors for all to public
  using ((get_my_role() = 'admin'::user_role));

-- stitching_types / stitching_colors
drop policy if exists "Cualquiera puede leer costuras activas" on public.stitching_types;
create policy "Cualquiera puede leer costuras activas" on public.stitching_types for select to public using (true);
drop policy if exists "Solo admin gestiona tipos de costura" on public.stitching_types;
create policy "Solo admin gestiona tipos de costura" on public.stitching_types for all to public
  using ((get_my_role() = 'admin'::user_role));
drop policy if exists "Cualquiera puede leer colores de costura" on public.stitching_colors;
create policy "Cualquiera puede leer colores de costura" on public.stitching_colors for select to public using (true);
drop policy if exists "Solo admin gestiona colores de costura" on public.stitching_colors;
create policy "Solo admin gestiona colores de costura" on public.stitching_colors for all to public
  using ((get_my_role() = 'admin'::user_role));

-- orders
drop policy if exists "Cliente ve sus propios pedidos" on public.orders;
create policy "Cliente ve sus propios pedidos" on public.orders for select to public
  using (((client_id = auth.uid()) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Cliente crea sus propios pedidos" on public.orders;
create policy "Cliente crea sus propios pedidos" on public.orders for insert to public
  with check (((client_id = auth.uid()) and (status = 'pendiente_revision'::order_status) and (estimated_price is null) and (final_price is null) and (deleted_at is null)));
drop policy if exists "Staff actualiza pedidos" on public.orders;
create policy "Staff actualiza pedidos" on public.orders for update to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])))
  with check ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));
drop policy if exists "Admin actualiza todo en pedidos" on public.orders;
create policy "Admin actualiza todo en pedidos" on public.orders for update to public
  using ((get_my_role() = 'admin'::user_role));

-- order_items
drop policy if exists "Cliente ve items de sus propios pedidos, staff ve todos" on public.order_items;
create policy "Cliente ve items de sus propios pedidos, staff ve todos" on public.order_items for select to public
  using (((exists (select 1 from orders o where ((o.id = order_items.order_id) and (o.client_id = auth.uid())))) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Cliente crea items en sus propios pedidos" on public.order_items;
create policy "Cliente crea items en sus propios pedidos" on public.order_items for insert to public
  with check ((exists (select 1 from orders o where ((o.id = order_items.order_id) and (o.client_id = auth.uid())))));
drop policy if exists "Staff actualiza items de pedidos" on public.order_items;
create policy "Staff actualiza items de pedidos" on public.order_items for update to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));

-- order_photos
drop policy if exists "Ver fotos de pedidos propios o staff" on public.order_photos;
create policy "Ver fotos de pedidos propios o staff" on public.order_photos for select to public
  using (((exists (select 1 from orders o where ((o.id = order_photos.order_id) and (o.client_id = auth.uid())))) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Cliente sube fotos a sus propios pedidos" on public.order_photos;
create policy "Cliente sube fotos a sus propios pedidos" on public.order_photos for insert to public
  with check ((exists (select 1 from orders o where ((o.id = order_photos.order_id) and (o.client_id = auth.uid())))));
drop policy if exists "Admin borra fotos" on public.order_photos;
create policy "Admin borra fotos" on public.order_photos for delete to public
  using ((get_my_role() = 'admin'::user_role));

-- order_status_history
drop policy if exists "Ver historial de pedidos propios o staff" on public.order_status_history;
create policy "Ver historial de pedidos propios o staff" on public.order_status_history for select to public
  using (((exists (select 1 from orders o where ((o.id = order_status_history.order_id) and (o.client_id = auth.uid())))) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Staff inserta historial" on public.order_status_history;
create policy "Staff inserta historial" on public.order_status_history for insert to public
  with check ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));
drop policy if exists "Staff actualiza nota de historial" on public.order_status_history;
create policy "Staff actualiza nota de historial" on public.order_status_history for update to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));

-- order_item_stage_history
drop policy if exists "Cliente ve historial de sus pedidos, staff ve todo" on public.order_item_stage_history;
create policy "Cliente ve historial de sus pedidos, staff ve todo" on public.order_item_stage_history for select to public
  using (((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])) or (exists (select 1 from (order_items oi join orders o on ((o.id = oi.order_id))) where ((oi.id = order_item_stage_history.order_item_id) and (o.client_id = auth.uid()))))));

-- quote_reminders
drop policy if exists quote_reminders_select on public.quote_reminders;
create policy quote_reminders_select on public.quote_reminders for select to authenticated
  using (((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])) or (exists (select 1 from orders o where ((o.id = quote_reminders.order_id) and (o.client_id = auth.uid()))))));

-- dropoff_proposals
drop policy if exists dropoff_proposals_select on public.dropoff_proposals;
create policy dropoff_proposals_select on public.dropoff_proposals for select to authenticated
  using (((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])) or (exists (select 1 from orders o where ((o.id = dropoff_proposals.order_id) and (o.client_id = auth.uid()))))));

-- coupons
drop policy if exists "Cliente ve cupones generales y los suyos, staff ve todo" on public.coupons;
create policy "Cliente ve cupones generales y los suyos, staff ve todo" on public.coupons for select to public
  using (((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])) or ((is_active = true) and ((client_id is null) or (client_id = auth.uid())))));
drop policy if exists "Solo admin gestiona cupones" on public.coupons;
create policy "Solo admin gestiona cupones" on public.coupons for all to public
  using ((get_my_role() = 'admin'::user_role));

-- coupon_redemptions
drop policy if exists "Cliente ve sus propios canjes, staff ve todos" on public.coupon_redemptions;
create policy "Cliente ve sus propios canjes, staff ve todos" on public.coupon_redemptions for select to public
  using (((client_id = auth.uid()) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Cliente activa su propio cupon" on public.coupon_redemptions;
create policy "Cliente activa su propio cupon" on public.coupon_redemptions for insert to public
  with check ((client_id = auth.uid()));
drop policy if exists "Staff marca cupon como usado" on public.coupon_redemptions;
create policy "Staff marca cupon como usado" on public.coupon_redemptions for update to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));

-- active_coupons
drop policy if exists "Cliente ve su propio cupon activo" on public.active_coupons;
create policy "Cliente ve su propio cupon activo" on public.active_coupons for select to public
  using ((client_id = auth.uid()));
drop policy if exists "Cliente activa su propio cupon" on public.active_coupons;
create policy "Cliente activa su propio cupon" on public.active_coupons for insert to public
  with check ((client_id = auth.uid()));
drop policy if exists "Cliente actualiza su propio cupon activo" on public.active_coupons;
create policy "Cliente actualiza su propio cupon activo" on public.active_coupons for update to public
  using ((client_id = auth.uid()));
drop policy if exists "Cliente desactiva su propio cupon" on public.active_coupons;
create policy "Cliente desactiva su propio cupon" on public.active_coupons for delete to public
  using ((client_id = auth.uid()));

-- loyalty_settings / loyalty_points / loyalty_ledger
drop policy if exists "Cualquiera lee la configuracion de puntos" on public.loyalty_settings;
create policy "Cualquiera lee la configuracion de puntos" on public.loyalty_settings for select to public using (true);
drop policy if exists "Solo admin edita puntos" on public.loyalty_settings;
create policy "Solo admin edita puntos" on public.loyalty_settings for all to public
  using ((get_my_role() = 'admin'::user_role));
drop policy if exists "Cliente ve su propio saldo, staff ve todos" on public.loyalty_points;
create policy "Cliente ve su propio saldo, staff ve todos" on public.loyalty_points for select to public
  using (((client_id = auth.uid()) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Cliente ve su propio historial, staff ve todo" on public.loyalty_ledger;
create policy "Cliente ve su propio historial, staff ve todo" on public.loyalty_ledger for select to public
  using (((client_id = auth.uid()) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));

-- referral_settings / referral_rewards
drop policy if exists "Cualquiera lee la configuracion de referidos" on public.referral_settings;
create policy "Cualquiera lee la configuracion de referidos" on public.referral_settings for select to public using (true);
drop policy if exists "Solo admin edita referidos" on public.referral_settings;
create policy "Solo admin edita referidos" on public.referral_settings for all to public
  using ((get_my_role() = 'admin'::user_role));
drop policy if exists "Cliente ve sus propios referidos, staff ve todo" on public.referral_rewards;
create policy "Cliente ve sus propios referidos, staff ve todo" on public.referral_rewards for select to public
  using (((referrer_id = auth.uid()) or (referred_id = auth.uid()) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));

-- appointments / blocked_dates
drop policy if exists "Cliente crea su propia cita" on public.appointments;
create policy "Cliente crea su propia cita" on public.appointments for insert to public
  with check ((client_id = auth.uid()));
drop policy if exists "Cliente ve sus propias citas, staff ve todas" on public.appointments;
create policy "Cliente ve sus propias citas, staff ve todas" on public.appointments for select to public
  using (((client_id = auth.uid()) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Staff actualiza citas" on public.appointments;
create policy "Staff actualiza citas" on public.appointments for update to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));
drop policy if exists "Staff elimina citas" on public.appointments;
create policy "Staff elimina citas" on public.appointments for delete to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));
drop policy if exists "Cualquiera puede leer fechas bloqueadas" on public.blocked_dates;
create policy "Cualquiera puede leer fechas bloqueadas" on public.blocked_dates for select to public using (true);
drop policy if exists "Solo admin gestiona fechas bloqueadas" on public.blocked_dates;
create policy "Solo admin gestiona fechas bloqueadas" on public.blocked_dates for all to public
  using ((get_my_role() = 'admin'::user_role));

-- complaints
drop policy if exists "Cliente ve sus propias quejas, staff ve todas" on public.complaints;
create policy "Cliente ve sus propias quejas, staff ve todas" on public.complaints for select to public
  using (((client_id = auth.uid()) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Cliente crea queja en su propio pedido" on public.complaints;
create policy "Cliente crea queja en su propio pedido" on public.complaints for insert to public
  with check (((client_id = auth.uid()) and (source = 'web'::text) and (exists (select 1 from orders o where ((o.id = complaints.order_id) and (o.client_id = auth.uid()))))));
drop policy if exists "Cliente califica su propia queja" on public.complaints;
create policy "Cliente califica su propia queja" on public.complaints for update to public
  using ((client_id = auth.uid())) with check ((client_id = auth.uid()));
drop policy if exists "Staff actualiza el estado de las quejas" on public.complaints;
create policy "Staff actualiza el estado de las quejas" on public.complaints for update to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));
-- (El nombre real quedó cortado a 63 caracteres; así existe en la base.)
drop policy if exists "Staff crea queja para cualquier pedido (ej. reportada por Whats" on public.complaints;
create policy "Staff crea queja para cualquier pedido (ej. reportada por Whats" on public.complaints for insert to public
  with check ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));

-- site_feedback
drop policy if exists "Cliente envia su propia retroalimentacion" on public.site_feedback;
create policy "Cliente envia su propia retroalimentacion" on public.site_feedback for insert to public
  with check ((client_id = auth.uid()));
drop policy if exists "Cliente ve su propia retroalimentacion" on public.site_feedback;
create policy "Cliente ve su propia retroalimentacion" on public.site_feedback for select to public
  using ((client_id = auth.uid()));
drop policy if exists "Staff ve toda la retroalimentacion" on public.site_feedback;
create policy "Staff ve toda la retroalimentacion" on public.site_feedback for select to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));
drop policy if exists "Staff actualiza el estado" on public.site_feedback;
create policy "Staff actualiza el estado" on public.site_feedback for update to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));

-- reviews
drop policy if exists "Cliente crea reseña de su propio pedido" on public.reviews;
create policy "Cliente crea reseña de su propio pedido" on public.reviews for insert to public
  with check (((client_id = auth.uid()) and (is_published = false) and (exists (select 1 from orders o where ((o.id = reviews.order_id) and (o.client_id = auth.uid()) and (o.status = 'entregado'::order_status))))));
drop policy if exists "Cliente ve sus propias reseñas" on public.reviews;
create policy "Cliente ve sus propias reseñas" on public.reviews for select to public
  using (((client_id = auth.uid()) or (get_my_role() = any (array['empleado'::user_role, 'admin'::user_role]))));
drop policy if exists "Cualquiera ve reseñas publicadas" on public.reviews;
create policy "Cualquiera ve reseñas publicadas" on public.reviews for select to public
  using ((is_published = true));
drop policy if exists "Solo admin publica/despublica reseñas" on public.reviews;
create policy "Solo admin publica/despublica reseñas" on public.reviews for update to public
  using ((get_my_role() = 'admin'::user_role));

-- contact_submissions
drop policy if exists "Cualquiera puede enviar contacto" on public.contact_submissions;
create policy "Cualquiera puede enviar contacto" on public.contact_submissions for insert to public with check (true);
drop policy if exists "Solo staff ve mensajes de contacto" on public.contact_submissions;
create policy "Solo staff ve mensajes de contacto" on public.contact_submissions for select to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));
drop policy if exists "Staff actualiza estado de contactos" on public.contact_submissions;
create policy "Staff actualiza estado de contactos" on public.contact_submissions for update to public
  using ((get_my_role() = any (array['empleado'::user_role, 'admin'::user_role])));

-- gallery_items / faqs
drop policy if exists "Galería es pública" on public.gallery_items;
create policy "Galería es pública" on public.gallery_items for select to public using (true);
drop policy if exists "Solo admin gestiona galería" on public.gallery_items;
create policy "Solo admin gestiona galería" on public.gallery_items for all to public
  using ((get_my_role() = 'admin'::user_role));
drop policy if exists "Cualquiera puede leer FAQs activas" on public.faqs;
create policy "Cualquiera puede leer FAQs activas" on public.faqs for select to public
  using (((is_active = true) or (get_my_role() = 'admin'::user_role)));
drop policy if exists "Solo admin gestiona FAQs" on public.faqs;
create policy "Solo admin gestiona FAQs" on public.faqs for all to public
  using ((get_my_role() = 'admin'::user_role));

-- business_settings / business_info
drop policy if exists "Cualquiera puede leer la configuración" on public.business_settings;
create policy "Cualquiera puede leer la configuración" on public.business_settings for select to public using (true);
drop policy if exists "Solo admin edita la configuración" on public.business_settings;
create policy "Solo admin edita la configuración" on public.business_settings for update to public
  using ((get_my_role() = 'admin'::user_role));
drop policy if exists "Cualquiera puede leer business_info" on public.business_info;
create policy "Cualquiera puede leer business_info" on public.business_info for select to public using (true);
drop policy if exists "Solo admin gestiona business_info" on public.business_info;
create policy "Solo admin gestiona business_info" on public.business_info for all to public
  using ((get_my_role() = 'admin'::user_role));

-- Storage (archivos)
drop policy if exists "Avatares son públicos para lectura" on storage.objects;
create policy "Avatares son públicos para lectura" on storage.objects for select to public
  using ((bucket_id = 'avatars'::text));
drop policy if exists "Usuario sube su propio avatar" on storage.objects;
create policy "Usuario sube su propio avatar" on storage.objects for insert to authenticated
  with check (((bucket_id = 'avatars'::text) and (name ~~ ((auth.uid())::text || '.%'::text))));
drop policy if exists "Usuario actualiza su propio avatar" on storage.objects;
create policy "Usuario actualiza su propio avatar" on storage.objects for update to authenticated
  using (((bucket_id = 'avatars'::text) and (name ~~ ((auth.uid())::text || '.%'::text))));
drop policy if exists "Fotos de pedidos son públicas para lectura" on storage.objects;
create policy "Fotos de pedidos son públicas para lectura" on storage.objects for select to public
  using ((bucket_id = 'order-photos'::text));
drop policy if exists "Cliente sube fotos a order-photos" on storage.objects;
create policy "Cliente sube fotos a order-photos" on storage.objects for insert to authenticated
  with check (((bucket_id = 'order-photos'::text) and (exists (select 1 from orders o where (((o.id)::text = split_part(objects.name, '/'::text, 1)) and (o.client_id = auth.uid()))))));
drop policy if exists "Solo admin borra fotos de order-photos" on storage.objects;
create policy "Solo admin borra fotos de order-photos" on storage.objects for delete to authenticated
  using (((bucket_id = 'order-photos'::text) and (get_my_role() = 'admin'::user_role)));
drop policy if exists "Galería de fotos es pública para lectura" on storage.objects;
create policy "Galería de fotos es pública para lectura" on storage.objects for select to public
  using ((bucket_id = 'gallery'::text));
drop policy if exists "Solo admin sube fotos a galería" on storage.objects;
create policy "Solo admin sube fotos a galería" on storage.objects for insert to authenticated
  with check (((bucket_id = 'gallery'::text) and (get_my_role() = 'admin'::user_role)));
drop policy if exists "Solo admin borra fotos de galería" on storage.objects;
create policy "Solo admin borra fotos de galería" on storage.objects for delete to authenticated
  using (((bucket_id = 'gallery'::text) and (get_my_role() = 'admin'::user_role)));


-- ---------------------------------------------------------------------
-- 12. BUCKETS DE STORAGE (carpetas de archivos)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('order-photos', 'order-photos', true),
  ('gallery', 'gallery', true),
  ('manuales', 'manuales', true)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- 13. TAREA MENSUAL: purga de pedidos eliminados hace más de 30 días
--     (día 1 de cada mes, 3 am UTC)
-- ---------------------------------------------------------------------
select cron.unschedule(jobid) from cron.job where jobname = 'purge-deleted-orders-monthly';
select cron.schedule('purge-deleted-orders-monthly', '0 3 1 * *', 'select public.purge_deleted_orders_internal(30)');


-- ---------------------------------------------------------------------
-- 14. FILAS DE CONFIGURACIÓN (la página las necesita para funcionar)
-- ---------------------------------------------------------------------
insert into public.business_settings (id) values (1) on conflict (id) do nothing;
insert into public.loyalty_settings (id) values (1) on conflict (id) do nothing;
insert into public.referral_settings (id) values (1) on conflict (id) do nothing;
