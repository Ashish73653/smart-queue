-- Enable UUID generation
create extension if not exists "pgcrypto";

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0,
  duration_minutes integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference varchar(12) not null unique,
  customer_name text not null,
  phone text not null,
  booking_date date not null,
  preferred_time_range text,
  note text,
  queue_number integer not null,
  status text not null default 'waiting'
    check (status in ('waiting','in_progress','done','cancelled','no_show')),
  total_price numeric(10,2) not null default 0,
  total_duration integer not null default 0,
  extra_delay_minutes integer not null default 0,
  is_walk_in boolean not null default false,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_queue_unique unique (booking_date, queue_number)
);

create table if not exists booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  quantity integer not null default 1
);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists shop_settings (
  id uuid primary key default gen_random_uuid(),
  shop_name text not null default 'Smart Queue Barbershop',
  contact_number text,
  opening_time text,
  closing_time text,
  is_open boolean not null default true,
  buffer_minutes integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_date_status
  on bookings (booking_date, status);

create index if not exists idx_bookings_phone
  on bookings (phone);

create index if not exists idx_booking_services_booking
  on booking_services (booking_id);

-- Simple trigger to keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_services on services;
create trigger trg_update_services
before update on services
for each row execute procedure set_updated_at();

drop trigger if exists trg_update_bookings on bookings;
create trigger trg_update_bookings
before update on bookings
for each row execute procedure set_updated_at();

drop trigger if exists trg_update_shop_settings on shop_settings;
create trigger trg_update_shop_settings
before update on shop_settings
for each row execute procedure set_updated_at();
