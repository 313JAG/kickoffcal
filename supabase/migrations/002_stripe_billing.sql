-- KickoffCal Stripe billing columns (safe to re-run)

alter table public.profiles
  add column if not exists is_pro boolean not null default false;

alter table public.profiles
  add column if not exists pro_status text not null default 'free';

alter table public.profiles
  add column if not exists stripe_customer_id text;

alter table public.profiles
  add column if not exists stripe_subscription_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_pro_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_pro_status_check
      check (pro_status in ('free', 'active', 'canceled', 'past_due', 'trialing'));
  end if;
end $$;

create unique index if not exists profiles_stripe_customer_id_uidx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;
