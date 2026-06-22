-- Initial multi-TCG catalog and binder schema.
-- This file is safe to run repeatedly while developing.
comment on schema public is e'@graphql({"inflect_names": true})';

create extension if not exists pg_trgm with schema extensions;

drop function if exists public.binder_by_short_id(text);

drop table if exists public.binder_cards;
drop table if exists public.binders;
drop table if exists public.card_market_prices;
drop table if exists public.mtg_card_details;
drop table if exists public.cards;
drop table if exists public.card_sets;
drop table if exists public.tcg;

drop function if exists private.request_header(text);

drop type if exists public.card_finish;
drop type if exists public.binder_visibility;
drop type if exists public.currency_code;
drop type if exists public.market_price_source;
drop type if exists public.mtg_color;
drop type if exists public.language_code;
drop type if exists public.card_condition;

create type public.binder_visibility as enum (
  'listed',
  'unlisted',
  'private'
);

create type public.currency_code as enum (
  'THB',
  'USD',
  'GBP',
  'EUR',
  'JPY'
);

create type public.market_price_source as enum (
  'cardmarket',
  'cardkingdom',
  'tcgplayer'
);

create type public.mtg_color as enum (
  'W',
  'U',
  'B',
  'R',
  'G',
  'C'
);

create type public.language_code as enum (
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ja',
  'ko',
  'ru',
  'zhs',
  'zht',
  'he',
  'la',
  'grc',
  'ar',
  'sa',
  'ph',
  'qya'
);

create type public.card_condition as enum (
  'mint',
  'near_mint',
  'excellent',
  'good',
  'light_played',
  'played',
  'poor'
);

create table if not exists public.tcg (
  id text primary key,
  name text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint tcg_id_format_check check (id ~ '^[a-z0-9][a-z0-9_-]*$')
);

insert into public.tcg (id, name)
values ('mtg', 'Magic: The Gathering')
on conflict (id) do update
set name = excluded.name;

create table if not exists public.card_sets (
  id uuid default gen_random_uuid() primary key,
  tcg_id text not null,
  external_id text not null,
  code text,
  name text not null,
  release_at date,
  icon_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint card_sets_tcg_fkey foreign key (tcg_id)
    references public.tcg(id) on delete restrict,
  constraint card_sets_tcg_external_id_key unique (tcg_id, external_id),
  constraint card_sets_tcg_id_id_key unique (tcg_id, id)
);

create unique index if not exists card_sets_tcg_code_idx
on public.card_sets (tcg_id, code)
where code is not null;

create index if not exists card_sets_tcg_id_idx
on public.card_sets (tcg_id);

create table if not exists public.cards (
  id uuid default gen_random_uuid() primary key,
  tcg_id text not null,
  card_set_id uuid,
  external_id text not null,
  name text not null,
  collector_number text,
  rarity text,
  finishes text[] default '{}'::text[] not null,
  image_small_url text,
  image_normal_url text,
  released_at date,
  synced_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint cards_tcg_fkey foreign key (tcg_id)
    references public.tcg(id) on delete restrict,
  constraint cards_tcg_external_id_key unique (tcg_id, external_id),
  constraint cards_tcg_id_id_key unique (tcg_id, id),
  constraint cards_card_set_fkey foreign key (tcg_id, card_set_id)
    references public.card_sets(tcg_id, id) on delete restrict
);

create index if not exists cards_card_set_id_idx
on public.cards (card_set_id);

create index if not exists cards_tcg_name_idx
on public.cards (tcg_id, name);

create index if not exists cards_name_trgm_idx
on public.cards using gin (name gin_trgm_ops);

create table if not exists public.card_market_prices (
  id uuid default gen_random_uuid() primary key,
  tcg_id text not null,
  card_id uuid not null,
  source public.market_price_source not null,
  finish text not null,
  amount numeric(12, 2) not null,
  currency public.currency_code not null,
  buy_url text,
  price_date date not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint card_market_prices_card_fkey foreign key (tcg_id, card_id)
    references public.cards(tcg_id, id) on delete cascade,
  unique (tcg_id, card_id, source, finish),
  constraint card_market_prices_finish_not_empty_check check (btrim(finish) <> ''),
  constraint card_market_prices_amount_check check (amount >= 0),
  constraint card_market_prices_buy_url_not_empty_check check (buy_url is null or btrim(buy_url) <> '')
);

create index if not exists card_market_prices_card_id_idx
on public.card_market_prices (card_id);

create index if not exists card_market_prices_source_idx
on public.card_market_prices (source);

create table if not exists public.mtg_card_details (
  card_id uuid primary key,
  oracle_id text,
  mana_cost text,
  mana_value numeric(6, 2),
  type_line text,
  oracle_text text,
  keywords text[] default '{}'::text[] not null,
  colors public.mtg_color[] default '{}'::public.mtg_color[] not null,
  color_identity public.mtg_color[] default '{}'::public.mtg_color[] not null,
  layout text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint mtg_card_details_card_fkey foreign key (card_id)
    references public.cards(id) on delete cascade
);

create index if not exists mtg_card_details_oracle_id_idx
on public.mtg_card_details (oracle_id)
where oracle_id is not null;

create table if not exists public.binders (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid default auth.uid() not null references auth.users(id) on delete cascade,
  tcg_id text not null,
  short_id text not null,
  name text not null,
  visibility public.binder_visibility default 'unlisted' not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint binders_tcg_fkey foreign key (tcg_id)
    references public.tcg(id) on delete restrict,
  unique (short_id),
  unique (id, tcg_id),
  constraint binders_name_not_empty_check check (btrim(name) <> ''),
  constraint binders_short_id_check check (short_id ~ '^[A-Za-z0-9]{9}$')
);

create index if not exists binders_owner_id_idx
on public.binders (owner_id);

create index if not exists binders_tcg_id_idx
on public.binders (tcg_id);

create table if not exists public.binder_cards (
  id uuid default gen_random_uuid() primary key,
  binder_id uuid not null,
  tcg_id text not null,
  card_id uuid not null,
  quantity integer default 1 not null,
  condition public.card_condition default 'near_mint' not null,
  finish text default 'normal' not null,
  language public.language_code default 'en' not null,
  price_amount numeric(12, 2),
  price_currency public.currency_code,
  dynamic_price_rule text,
  note text,
  position integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint binder_cards_binder_fkey foreign key (binder_id, tcg_id)
    references public.binders(id, tcg_id) on delete cascade,
  constraint binder_cards_card_fkey foreign key (tcg_id, card_id)
    references public.cards(tcg_id, id) on delete restrict,
  constraint binder_cards_quantity_check check (quantity > 0),
  constraint binder_cards_position_check check (position >= 0),
  constraint binder_cards_price_amount_check check (price_amount is null or price_amount >= 0)
);

create index if not exists binder_cards_binder_id_position_idx
on public.binder_cards (binder_id, position);

create index if not exists binder_cards_card_id_idx
on public.binder_cards (card_id);

comment on constraint card_sets_tcg_fkey on public.card_sets is
  E'@graphql({"foreign_name": "tcg", "local_name": "cardSets"})';

comment on constraint cards_tcg_fkey on public.cards is
  E'@graphql({"foreign_name": "tcg", "local_name": "cards"})';

comment on constraint cards_card_set_fkey on public.cards is
  E'@graphql({"foreign_name": "cardSet", "local_name": "cards"})';

comment on constraint card_market_prices_card_fkey on public.card_market_prices is
  E'@graphql({"foreign_name": "card", "local_name": "marketPrices"})';

comment on constraint mtg_card_details_card_fkey on public.mtg_card_details is
  E'@graphql({"foreign_name": "card", "local_name": "mtgCardDetail"})';

comment on constraint binders_tcg_fkey on public.binders is
  E'@graphql({"foreign_name": "tcg", "local_name": "binders"})';

comment on constraint binder_cards_binder_fkey on public.binder_cards is
  E'@graphql({"foreign_name": "binder", "local_name": "binderCards"})';

comment on constraint binder_cards_card_fkey on public.binder_cards is
  E'@graphql({"foreign_name": "card", "local_name": "binderCards"})';

alter table public.tcg enable row level security;
alter table public.card_sets enable row level security;
alter table public.cards enable row level security;
alter table public.card_market_prices enable row level security;
alter table public.mtg_card_details enable row level security;
alter table public.binders enable row level security;
alter table public.binder_cards enable row level security;

create or replace function private.request_header(name text)
returns text
language sql
stable
set search_path from current
as $$
  select nullif(current_setting('request.headers', true), '')::json ->> lower(name);
$$;
comment on function private.request_header(text) is
  E'Returns a request header value by lowercased header name.';

drop policy if exists tcg_select_all on public.tcg;
create policy tcg_select_all
on public.tcg
for select
to anon, authenticated
using (true);

drop policy if exists card_sets_select_all on public.card_sets;
create policy card_sets_select_all
on public.card_sets
for select
to anon, authenticated
using (true);

drop policy if exists cards_select_all on public.cards;
create policy cards_select_all
on public.cards
for select
to anon, authenticated
using (true);

drop policy if exists card_market_prices_select_all on public.card_market_prices;
create policy card_market_prices_select_all
on public.card_market_prices
for select
to anon, authenticated
using (true);

drop policy if exists mtg_card_details_select_all on public.mtg_card_details;
create policy mtg_card_details_select_all
on public.mtg_card_details
for select
to anon, authenticated
using (true);

drop policy if exists binders_select_listed_or_owner on public.binders;
create policy binders_select_listed_or_owner
on public.binders
for select
to anon, authenticated
using (
  visibility = 'listed'
  or owner_id = auth.uid()
  or (
    visibility = 'unlisted'
    and short_id = private.request_header('x-binder-short-id')
  )
);

drop policy if exists binders_insert_owner on public.binders;
create policy binders_insert_owner
on public.binders
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists binders_update_owner on public.binders;
create policy binders_update_owner
on public.binders
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists binders_delete_owner on public.binders;
create policy binders_delete_owner
on public.binders
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists binder_cards_select_listed_or_owner on public.binder_cards;
create policy binder_cards_select_listed_or_owner
on public.binder_cards
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.binders
    where binders.id = binder_cards.binder_id
      and (
        binders.visibility = 'listed'
        or binders.owner_id = auth.uid()
        or (
          binders.visibility = 'unlisted'
          and binders.short_id = private.request_header('x-binder-short-id')
        )
      )
  )
);

drop policy if exists binder_cards_insert_owner on public.binder_cards;
create policy binder_cards_insert_owner
on public.binder_cards
for insert
to authenticated
with check (
  exists (
    select 1
    from public.binders
    where binders.id = binder_cards.binder_id
      and binders.owner_id = auth.uid()
  )
);

drop policy if exists binder_cards_update_owner on public.binder_cards;
create policy binder_cards_update_owner
on public.binder_cards
for update
to authenticated
using (
  exists (
    select 1
    from public.binders
    where binders.id = binder_cards.binder_id
      and binders.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.binders
    where binders.id = binder_cards.binder_id
      and binders.owner_id = auth.uid()
  )
);

drop policy if exists binder_cards_delete_owner on public.binder_cards;
create policy binder_cards_delete_owner
on public.binder_cards
for delete
to authenticated
using (
  exists (
    select 1
    from public.binders
    where binders.id = binder_cards.binder_id
      and binders.owner_id = auth.uid()
  )
);

grant select on public.tcg to anon, authenticated;
grant select on public.card_sets to anon, authenticated;
grant select on public.cards to anon, authenticated;
grant select on public.card_market_prices to anon, authenticated;
grant select on public.mtg_card_details to anon, authenticated;

grant select on public.binders to anon, authenticated;
grant insert (tcg_id, name, visibility) on public.binders to authenticated;
grant update (tcg_id, name, visibility) on public.binders to authenticated;
grant delete on public.binders to authenticated;
grant select on public.binder_cards to anon, authenticated;
grant insert (
  binder_id,
  tcg_id,
  card_id,
  quantity,
  condition,
  finish,
  language,
  price_amount,
  price_currency,
  dynamic_price_rule,
  note,
  position
) on public.binder_cards to authenticated;
grant update (
  tcg_id,
  card_id,
  quantity,
  condition,
  finish,
  language,
  price_amount,
  price_currency,
  dynamic_price_rule,
  note,
  position
) on public.binder_cards to authenticated;
grant delete on public.binder_cards to authenticated;

grant all on public.tcg to service_role;
grant all on public.card_sets to service_role;
grant all on public.cards to service_role;
grant all on public.card_market_prices to service_role;
grant all on public.mtg_card_details to service_role;
grant all on public.binders to service_role;
grant all on public.binder_cards to service_role;

drop function if exists private.tg__validate_binder_card_finish();
drop function if exists private.tg__validate_card_finishes_update();
drop function if exists private.tg_binders__set_short_id();
drop function if exists private.generate_random_string(integer, text);
drop function if exists private.tg_binder_cards__validate_finish();
drop function if exists private.tg_cards__validate_finishes_update();
drop function if exists private.tg__timestamps();

/*
 * This trigger is used on tables with created_at and updated_at to ensure that
 * these timestamps are kept valid (namely: `created_at` cannot be changed, and
 * `updated_at` must be monotonically increasing).
 */
create or replace function private.tg__timestamps()
returns trigger
language plpgsql
volatile
set search_path from current
as $$
begin
  NEW.created_at = (case when TG_OP = 'INSERT' then now() else OLD.created_at end);
  NEW.updated_at = (case when TG_OP = 'UPDATE' and OLD.updated_at >= now() then OLD.updated_at + interval '1 millisecond' else now() end);
  return NEW;
end;
$$;
comment on function private.tg__timestamps() is
  E'This trigger should be called on all tables with created_at, updated_at - it ensures that they cannot be manipulated and that updated_at will always be larger than the previous updated_at.';

create trigger _100_timestamps
  before insert or update on public.tcg
  for each row execute procedure private.tg__timestamps();

create trigger _100_timestamps
  before insert or update on public.card_sets
  for each row execute procedure private.tg__timestamps();

create trigger _100_timestamps
  before insert or update on public.cards
  for each row execute procedure private.tg__timestamps();

create trigger _100_timestamps
  before insert or update on public.card_market_prices
  for each row execute procedure private.tg__timestamps();

create trigger _100_timestamps
  before insert or update on public.mtg_card_details
  for each row execute procedure private.tg__timestamps();

create trigger _100_timestamps
  before insert or update on public.binders
  for each row execute procedure private.tg__timestamps();

create trigger _100_timestamps
  before insert or update on public.binder_cards
  for each row execute procedure private.tg__timestamps();

create or replace function private.generate_random_string(
  character_count integer,
  alphabet text
)
returns text
language plpgsql
volatile
strict
set search_path from current
as $$
declare
  result text := '';
  alphabet_length integer := length(alphabet);
  random_byte integer;
  max_valid_byte integer;
begin
  if character_count < 0 then
    raise exception 'character_count must be greater than or equal to 0'
      using errcode = '22023';
  end if;

  if alphabet_length = 0 then
    raise exception 'alphabet must not be empty'
      using errcode = '22023';
  end if;

  if alphabet_length > 256 then
    raise exception 'alphabet must contain 256 characters or fewer'
      using errcode = '22023';
  end if;

  max_valid_byte = 256 - (256 % alphabet_length);

  while length(result) < character_count loop
    random_byte = get_byte(gen_random_bytes(1), 0);

    if random_byte < max_valid_byte then
      result = result || substr(alphabet, (random_byte % alphabet_length) + 1, 1);
    end if;
  end loop;

  return result;
end;
$$;
comment on function private.generate_random_string(integer, text) is
  E'Generates a random string with the requested character count from the provided alphabet.';

create or replace function private.tg_binders__set_short_id()
returns trigger
language plpgsql
volatile
security definer
set search_path from current
as $$
begin
  if NEW.short_id is not null then
    return NEW;
  end if;

  loop
    NEW.short_id = private.generate_random_string(
      9,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    );

    exit when not exists (
      select 1
      from public.binders
      where binders.short_id = NEW.short_id
    );
  end loop;

  return NEW;
end;
$$;
comment on function private.tg_binders__set_short_id() is
  E'Generates an alphanumeric public identifier for binders when one is not provided.';

create trigger _500_set_short_id
  before insert on public.binders
  for each row execute procedure private.tg_binders__set_short_id();

create or replace function private.tg_binder_cards__validate_finish()
returns trigger
language plpgsql
volatile
set search_path from current
as $$
declare
  available_finishes text[];
begin
  select cards.finishes
  into available_finishes
  from public.cards
  where cards.id = NEW.card_id
    and cards.tcg_id = NEW.tcg_id;

  if not found then
    return NEW;
  end if;

  if not (NEW.finish = any(available_finishes)) then
    raise exception 'finish "%" is not available for card %', NEW.finish, NEW.card_id
      using errcode = '23514';
  end if;

  return NEW;
end;
$$;

create trigger _500_validate_finish
  before insert or update of tcg_id, card_id, finish on public.binder_cards
  for each row execute procedure private.tg_binder_cards__validate_finish();

create or replace function public.binder_by_short_id(binder_short_id text)
returns public.binders
language sql
stable
set search_path = ''
as $$
  select binders.*
  from public.binders
  where binders.short_id = binder_short_id
  limit 1;
$$;
comment on function public.binder_by_short_id(text) is
  E'Returns a binder by short_id when row level security allows the caller to read it.';

grant execute on function public.binder_by_short_id(text) to anon, authenticated;
