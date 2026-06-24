create table if not exists public.currency_rates (
  base_currency public.currency_code not null,
  quote_currency public.currency_code not null,
  rate numeric(18, 8) not null,
  rate_date date not null,
  provider text not null,
  fetched_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  primary key (base_currency, quote_currency),
  constraint currency_rates_rate_check check (rate > 0),
  constraint currency_rates_provider_not_empty_check check (btrim(provider) <> '')
);

comment on table public.currency_rates is
  E'Current exchange-rate snapshot used for display conversions. Rows are overwritten when fresh rates are fetched.';

comment on column public.currency_rates.base_currency is
  E'The currency used as the conversion base.';

comment on column public.currency_rates.quote_currency is
  E'The target currency for the conversion rate.';

comment on column public.currency_rates.rate is
  E'Latest known conversion rate from base_currency to quote_currency.';

comment on column public.currency_rates.rate_date is
  E'The provider date for this exchange rate.';

comment on column public.currency_rates.provider is
  E'The exchange-rate provider that supplied this row.';

comment on column public.currency_rates.fetched_at is
  E'When the worker fetched this exchange rate.';

alter table public.currency_rates enable row level security;

drop policy if exists currency_rates_select_all on public.currency_rates;
create policy currency_rates_select_all
on public.currency_rates
for select
to anon, authenticated
using (true);

grant select on public.currency_rates to anon, authenticated, service_role;
grant insert (
  base_currency,
  quote_currency,
  rate,
  rate_date,
  provider,
  fetched_at
) on public.currency_rates to service_role;
grant update (
  base_currency,
  quote_currency,
  rate,
  rate_date,
  provider,
  fetched_at
) on public.currency_rates to service_role;
grant delete on public.currency_rates to service_role;

drop trigger if exists _100_timestamps on public.currency_rates;
create trigger _100_timestamps
  before insert or update on public.currency_rates
  for each row execute procedure private.tg__timestamps();
