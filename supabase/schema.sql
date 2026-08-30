-- ============================================================
-- Quill — freelance invoice tracker
-- Run this whole file once in the Supabase SQL Editor.
-- It is idempotent: safe to run again if you need to reset.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Profiles
--    One row per authenticated user. Holds the freelancer's own
--    business details, which get printed at the top of invoices.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  business_name text,
  created_at    timestamptz not null default now()
);

-- A profile row is created automatically the moment a user signs up,
-- so the app never has to handle a "user exists but profile doesn't" state.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, business_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'business_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2. Clients
--    The people you bill. Every client belongs to exactly one user.
-- ------------------------------------------------------------
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  email      text,
  company    text,
  notes      text,
  created_at timestamptz not null default now()
);

create index if not exists clients_user_id_idx on public.clients (user_id);

-- ------------------------------------------------------------
-- 3. Invoices
--    The core entity. Status drives the whole business flow:
--    draft -> sent -> paid  (with void as an escape hatch).
--    "Overdue" is NOT stored: it is derived at read time from
--    status = 'sent' AND due_date < today, so it can never go stale.
-- ------------------------------------------------------------
create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  client_id      uuid not null references public.clients (id) on delete restrict,
  invoice_number text not null,
  status         text not null default 'draft'
                 check (status in ('draft', 'sent', 'paid', 'void')),
  issue_date     date not null default current_date,
  due_date       date not null,
  tax_rate       numeric(5, 2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  currency       text not null default 'INR',
  notes          text,
  sent_at        timestamptz,
  paid_at        timestamptz,
  created_at     timestamptz not null default now(),

  -- Invoice numbers must be unique per freelancer, not globally.
  unique (user_id, invoice_number)
);

create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists invoices_client_id_idx on public.invoices (client_id);
create index if not exists invoices_status_idx on public.invoices (user_id, status);

-- ------------------------------------------------------------
-- 4. Invoice line items
--    Amounts are stored per line and summed in the app rather than
--    caching a total on the invoice, so a total can never drift out
--    of sync with the lines it came from.
-- ------------------------------------------------------------
create table if not exists public.invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity    numeric(10, 2) not null default 1 check (quantity > 0),
  unit_price  numeric(12, 2) not null default 0 check (unit_price >= 0),
  position    integer not null default 0
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

-- ============================================================
-- Row Level Security
-- Every table is locked by default; a user can only ever touch
-- rows that belong to them. This is the security boundary — the
-- app code is not trusted to filter by user_id on its own.
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.clients       enable row level security;
alter table public.invoices      enable row level security;
alter table public.invoice_items enable row level security;

-- Profiles: you can read and edit only your own.
drop policy if exists "own profile: select" on public.profiles;
create policy "own profile: select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "own profile: update" on public.profiles;
create policy "own profile: update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "own profile: insert" on public.profiles;
create policy "own profile: insert" on public.profiles
  for insert with check (auth.uid() = id);

-- Clients: full CRUD, scoped to the owner.
drop policy if exists "own clients: all" on public.clients;
create policy "own clients: all" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Invoices: full CRUD, scoped to the owner.
drop policy if exists "own invoices: all" on public.invoices;
create policy "own invoices: all" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Line items have no user_id of their own. Ownership is inherited
-- from the parent invoice, checked with an EXISTS subquery.
drop policy if exists "own invoice items: all" on public.invoice_items;
create policy "own invoice items: all" on public.invoice_items
  for all using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id and i.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_items.invoice_id and i.user_id = auth.uid()
    )
  );
