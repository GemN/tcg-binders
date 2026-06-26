\set ON_ERROR_STOP on

begin;

create temp table import_mtg_sets_raw (
  code text,
  mtgo_code text,
  name text,
  release_date text,
  set_type text,
  is_online_only text,
  is_foil_only text,
  is_non_foil_only text,
  parent_code text,
  total_set_size text,
  base_set_size text,
  keyrune_code text,
  is_partial_preview text,
  is_foreign_only text,
  is_paper_only text,
  languages text,
  tcgplayer_group_id text,
  token_set_code text,
  mcm_id text,
  mcm_name text,
  mcm_id_extras text,
  block text
) on commit drop;

create temp table import_mtg_cards_raw (
  artist text,
  artist_ids text,
  ascii_name text,
  attraction_lights text,
  availability text,
  booster_types text,
  border_color text,
  card_parts text,
  color_identity text,
  color_indicator text,
  colors text,
  defense text,
  duel_deck text,
  edhrec_rank text,
  edhrec_saltiness text,
  face_converted_mana_cost text,
  face_flavor_name text,
  face_mana_value text,
  face_name text,
  face_printed_name text,
  finishes text,
  flavor_name text,
  flavor_text text,
  frame_effects text,
  frame_version text,
  hand text,
  has_alternative_deck_limit text,
  has_content_warning text,
  is_alternative text,
  is_full_art text,
  is_funny text,
  is_game_changer text,
  is_online_only text,
  is_oversized text,
  is_promo text,
  is_rebalanced text,
  is_reprint text,
  is_reserved text,
  is_story_spotlight text,
  is_textless text,
  is_timeshifted text,
  keywords text,
  language text,
  layout text,
  leadership_skills text,
  life text,
  loyalty text,
  mana_cost text,
  mana_value text,
  name text,
  collector_number text,
  original_printings text,
  original_release_date text,
  original_text text,
  other_face_ids text,
  power text,
  printed_name text,
  printed_text text,
  printed_type text,
  printings text,
  produced_mana text,
  promo_types text,
  rarity text,
  rebalanced_printings text,
  related_cards text,
  security_stamp text,
  set_code text,
  side text,
  signature text,
  sku_ids text,
  source_products text,
  subsets text,
  subtypes text,
  supertypes text,
  oracle_text text,
  toughness text,
  type_line text,
  types text,
  uuid text,
  variations text,
  watermark text
) on commit drop;

create temp table import_mtg_card_prices_raw (
  card_finish text,
  currency text,
  price_date text,
  game_availability text,
  price_amount text,
  price_provider text,
  provider_listing text,
  uuid text
) on commit drop;

create temp table import_mtg_card_purchase_urls_raw (
  uuid text,
  card_kingdom text,
  card_kingdom_foil text,
  card_kingdom_etched text,
  cardmarket text,
  cardmarket_foil text,
  tcgplayer text,
  tcgplayer_etched text,
  tcgplayer_alternative_foil text
) on commit drop;

\copy import_mtg_sets_raw from '__MTG_SETS_CSV__' with (format csv, header true)
\copy import_mtg_cards_raw from '__MTG_CARDS_CSV__' with (format csv, header true)
\copy import_mtg_card_prices_raw from '__MTG_CARD_PRICES_CSV__' with (format csv, header true)
\copy import_mtg_card_purchase_urls_raw from '__MTG_CARD_PURCHASE_URLS_CSV__' with (format csv, header true)

create function pg_temp.import_mtg_date(value text) returns date as $$
  select case
    when btrim(coalesce(value, '')) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then btrim(value)::date
    else null
  end;
$$ language sql stable set search_path from current;

create function pg_temp.import_mtg_text_array(value text) returns text[] as $$
  select coalesce(array_agg(part order by part), '{}'::text[])
  from (
    select distinct btrim(part) as part
    from regexp_split_to_table(coalesce(value, ''), ',') as part
    where btrim(part) <> ''
  ) parts;
$$ language sql stable set search_path from current;

create function pg_temp.import_mtg_is_arena_only(value text) returns boolean as $$
  select 'arena' = any(availability)
    and not ('paper' = any(availability))
    and not ('mtgo' = any(availability))
  from (
    select coalesce(array_agg(lower(btrim(part))), '{}'::text[]) as availability
    from regexp_split_to_table(coalesce(value, ''), ',') as part
    where btrim(part) <> ''
  ) parts;
$$ language sql stable set search_path from current;

create function pg_temp.import_mtg_finish_array(value text) returns text[] as $$
  select coalesce(array_agg(finish order by finish), '{}'::text[])
  from (
    select distinct case lower(btrim(part))
      when 'nonfoil' then 'normal'
      else lower(btrim(part))
    end as finish
    from regexp_split_to_table(coalesce(value, ''), ',') as part
    where btrim(part) <> ''
  ) parts;
$$ language sql stable set search_path from current;

create function pg_temp.import_mtg_color_array(value text) returns public.mtg_color[] as $$
  select coalesce(array_agg(color::public.mtg_color order by color), '{}'::public.mtg_color[])
  from (
    select distinct upper(btrim(part)) as color
    from regexp_split_to_table(coalesce(value, ''), ',') as part
    where upper(btrim(part)) in ('W', 'U', 'B', 'R', 'G', 'C')
  ) parts;
$$ language sql stable set search_path from current;

create function pg_temp.import_mtg_language_code(value text) returns text as $$
  select case lower(btrim(coalesce(value, '')))
    when 'english' then 'en'
    when 'spanish' then 'es'
    when 'french' then 'fr'
    when 'german' then 'de'
    when 'italian' then 'it'
    when 'portuguese' then 'pt'
    when 'japanese' then 'ja'
    when 'korean' then 'ko'
    when 'russian' then 'ru'
    when 'chinese simplified' then 'zhs'
    when 'chinese traditional' then 'zht'
    when 'hebrew' then 'he'
    when 'latin' then 'la'
    when 'ancient greek' then 'grc'
    when 'arabic' then 'ar'
    when 'sanskrit' then 'sa'
    when 'phyrexian' then 'ph'
    when 'quenya' then 'qya'
    else 'en'
  end;
$$ language sql stable set search_path from current;

create function pg_temp.import_mtg_scryfall_image_url(
  set_code text,
  collector_number text,
  language text,
  image_version text
) returns text as $$
  select case
    when nullif(btrim(coalesce(set_code, '')), '') is null then null
    when nullif(btrim(coalesce(collector_number, '')), '') is null then null
    else 'https://api.scryfall.com/cards/'
      || lower(btrim(set_code))
      || '/'
      || regexp_replace(btrim(collector_number), '\s+', '%20', 'g')
      || '/'
      || pg_temp.import_mtg_language_code(language)
      || '?format=image&version='
      || image_version
  end;
$$ language sql stable set search_path from current;

create temp table import_mtg_sets as
select distinct on (code)
  nullif(btrim(code), '') as code,
  nullif(btrim(name), '') as name,
  pg_temp.import_mtg_date(release_date) as release_date,
  nullif(btrim(keyrune_code), '') as keyrune_code
from import_mtg_sets_raw
where nullif(btrim(code), '') is not null
  and nullif(btrim(name), '') is not null
order by code;

create index import_mtg_sets_code_idx
on import_mtg_sets (code);

create temp table import_mtg_arena_only_cards as
select distinct
  nullif(btrim(uuid), '') as uuid
from import_mtg_cards_raw
where nullif(btrim(uuid), '') is not null
  and nullif(btrim(name), '') is not null
  and pg_temp.import_mtg_is_arena_only(availability);

create index import_mtg_arena_only_cards_uuid_idx
on import_mtg_arena_only_cards (uuid);

create temp table import_mtg_cards as
select distinct on (uuid)
  nullif(btrim(uuid), '') as uuid,
  nullif(btrim(set_code), '') as set_code,
  nullif(btrim(name), '') as name,
  nullif(btrim(collector_number), '') as collector_number,
  nullif(btrim(rarity), '') as rarity,
  finishes,
  language,
  mana_cost,
  mana_value,
  nullif(btrim(type_line), '') as type_line,
  nullif(oracle_text, '') as oracle_text,
  keywords,
  colors,
  color_identity,
  nullif(btrim(layout), '') as layout,
  original_release_date
from import_mtg_cards_raw
where nullif(btrim(uuid), '') is not null
  and nullif(btrim(name), '') is not null
  and not pg_temp.import_mtg_is_arena_only(availability)
order by uuid;

create index import_mtg_cards_uuid_idx
on import_mtg_cards (uuid);

create index import_mtg_cards_set_code_idx
on import_mtg_cards (set_code);

create temp table import_mtg_card_prices_supported as
select
  *
from (
  select
    nullif(btrim(uuid), '') as uuid,
    lower(btrim(price_provider)) as price_provider,
    case lower(btrim(card_finish))
      when 'nonfoil' then 'normal'
      else lower(btrim(card_finish))
    end as finish,
    upper(btrim(currency)) as currency,
    btrim(price_date)::date as price_date,
    btrim(price_amount)::numeric(12, 2) as amount
  from import_mtg_card_prices_raw
  where nullif(btrim(uuid), '') is not null
    and nullif(btrim(game_availability), '') is not null
    and nullif(btrim(price_provider), '') is not null
    and nullif(btrim(provider_listing), '') is not null
    and nullif(btrim(card_finish), '') is not null
    and nullif(btrim(currency), '') is not null
    and nullif(btrim(price_date), '') is not null
    and nullif(btrim(price_amount), '') is not null
    and lower(btrim(game_availability)) = 'paper'
    and lower(btrim(provider_listing)) = 'retail'
    and lower(btrim(price_provider)) in (
      'cardkingdom',
      'cardmarket',
      'tcgplayer'
    )
) prices
;

create temp table import_mtg_card_prices as
select distinct on (
  uuid,
  price_provider,
  finish
)
  *
from import_mtg_card_prices_supported prices
where exists (
  select 1
  from import_mtg_cards cards
  where cards.uuid = prices.uuid
)
order by
  uuid,
  price_provider,
  finish,
  price_date desc;

create index import_mtg_card_prices_uuid_idx
on import_mtg_card_prices (uuid);

create temp table import_mtg_card_purchase_urls as
select distinct on (
  uuid,
  price_provider,
  finish
)
  uuid,
  price_provider,
  finish,
  buy_url
from (
  select
    nullif(btrim(raw.uuid), '') as uuid,
    urls.price_provider,
    urls.finish,
    nullif(btrim(urls.buy_url), '') as buy_url,
    urls.priority
  from import_mtg_card_purchase_urls_raw raw
  cross join lateral (
    values
      ('cardkingdom', 'normal', card_kingdom, 100),
      ('cardkingdom', 'foil', card_kingdom_foil, 100),
      ('cardkingdom', 'etched', card_kingdom_etched, 100),
      ('cardmarket', 'normal', cardmarket, 100),
      ('cardmarket', 'foil', cardmarket_foil, 100),
      ('tcgplayer', 'normal', tcgplayer, 100),
      ('tcgplayer', 'foil', tcgplayer_alternative_foil, 50),
      ('tcgplayer', 'foil', tcgplayer, 100),
      ('tcgplayer', 'etched', tcgplayer_etched, 100)
  ) as urls(price_provider, finish, buy_url, priority)
) purchase_urls
where uuid is not null
  and buy_url is not null
  and exists (
    select 1
    from import_mtg_cards cards
    where cards.uuid = purchase_urls.uuid
  )
order by
  uuid,
  price_provider,
  finish,
  priority;

create index import_mtg_card_purchase_urls_lookup_idx
on import_mtg_card_purchase_urls (uuid, price_provider, finish);

insert into public.tcg (id, name)
values ('mtg', 'Magic: The Gathering')
on conflict (id) do update
set name = excluded.name;

insert into public.card_sets (
  tcg_id,
  external_id,
  code,
  name,
  release_at,
  icon_url
)
select
  'mtg',
  sets.code,
  sets.code,
  sets.name,
  sets.release_date,
  'https://svgs.scryfall.io/sets/'
    || lower(coalesce(nullif(sets.keyrune_code, 'DEFAULT'), sets.code))
    || '.svg'
from import_mtg_sets sets
on conflict (tcg_id, external_id) do update
set
  code = excluded.code,
  name = excluded.name,
  release_at = excluded.release_at,
  icon_url = excluded.icon_url;

insert into public.cards (
  tcg_id,
  card_set_id,
  external_id,
  name,
  collector_number,
  rarity,
  finishes,
  image_small_url,
  image_normal_url,
  released_at,
  synced_at
)
select
  'mtg',
  card_sets.id,
  cards.uuid,
  cards.name,
  cards.collector_number,
  cards.rarity,
  pg_temp.import_mtg_finish_array(cards.finishes),
  pg_temp.import_mtg_scryfall_image_url(
    cards.set_code,
    cards.collector_number,
    cards.language,
    'small'
  ),
  pg_temp.import_mtg_scryfall_image_url(
    cards.set_code,
    cards.collector_number,
    cards.language,
    'normal'
  ),
  coalesce(
    pg_temp.import_mtg_date(cards.original_release_date),
    card_sets.release_at
  ),
  now()
from import_mtg_cards cards
inner join public.card_sets
on card_sets.tcg_id = 'mtg'
and card_sets.external_id = cards.set_code
on conflict (tcg_id, external_id) do update
set
  card_set_id = excluded.card_set_id,
  name = excluded.name,
  collector_number = excluded.collector_number,
  rarity = excluded.rarity,
  finishes = excluded.finishes,
  image_small_url = excluded.image_small_url,
  image_normal_url = excluded.image_normal_url,
  released_at = excluded.released_at,
  synced_at = excluded.synced_at;

insert into public.mtg_card_details (
  card_id,
  oracle_id,
  mana_cost,
  mana_value,
  type_line,
  oracle_text,
  keywords,
  colors,
  color_identity,
  layout
)
select
  cards.id,
  null,
  nullif(imported.mana_cost, ''),
  case
    when btrim(coalesce(imported.mana_value, '')) ~ '^[0-9]+(\.[0-9]+)?$'
      and btrim(imported.mana_value)::numeric < 10000 then btrim(imported.mana_value)::numeric(6, 2)
    else null
  end,
  imported.type_line,
  imported.oracle_text,
  pg_temp.import_mtg_text_array(imported.keywords),
  pg_temp.import_mtg_color_array(imported.colors),
  pg_temp.import_mtg_color_array(imported.color_identity),
  imported.layout
from import_mtg_cards imported
inner join public.cards
on cards.tcg_id = 'mtg'
and cards.external_id = imported.uuid
on conflict (card_id) do update
set
  oracle_id = coalesce(excluded.oracle_id, public.mtg_card_details.oracle_id),
  mana_cost = excluded.mana_cost,
  mana_value = excluded.mana_value,
  type_line = excluded.type_line,
  oracle_text = excluded.oracle_text,
  keywords = excluded.keywords,
  colors = excluded.colors,
  color_identity = excluded.color_identity,
  layout = excluded.layout;

insert into public.card_market_prices (
  tcg_id,
  card_id,
  source,
  finish,
  amount,
  currency,
  buy_url,
  price_date
)
select
  'mtg',
  cards.id,
  prices.price_provider::public.market_price_source,
  prices.finish,
  prices.amount,
  prices.currency::public.currency_code,
  purchase_urls.buy_url,
  prices.price_date
from import_mtg_card_prices prices
inner join public.cards
on cards.tcg_id = 'mtg'
and cards.external_id = prices.uuid
left join import_mtg_card_purchase_urls purchase_urls
on purchase_urls.uuid = prices.uuid
and purchase_urls.price_provider = prices.price_provider
and purchase_urls.finish = prices.finish
on conflict (
  tcg_id,
  card_id,
  source,
  finish
) do update
set
  amount = excluded.amount,
  currency = excluded.currency,
  buy_url = excluded.buy_url,
  price_date = excluded.price_date;

delete from public.card_market_prices prices
using public.cards cards
where prices.tcg_id = 'mtg'
  and cards.tcg_id = prices.tcg_id
  and cards.id = prices.card_id
  and not exists (
    select 1
    from import_mtg_card_prices imported
    where imported.uuid = cards.external_id
      and imported.price_provider = prices.source::text
      and imported.finish = prices.finish
  );

delete from public.cards cards
using import_mtg_arena_only_cards arena_only_cards
where cards.tcg_id = 'mtg'
  and cards.external_id = arena_only_cards.uuid
  and not exists (
    select 1
    from public.binder_cards binder_cards
    where binder_cards.tcg_id = cards.tcg_id
      and binder_cards.card_id = cards.id
  );

\echo import summary
select
  (select count(*) from import_mtg_sets) as sets_csv_rows,
  (select count(*) from public.card_sets where tcg_id = 'mtg') as sets_in_database,
  (select count(*) from import_mtg_arena_only_cards) as skipped_arena_only_card_rows,
  (select count(*) from import_mtg_cards) as cards_csv_rows,
  (select count(*) from public.cards where tcg_id = 'mtg') as cards_in_database,
  (select count(*) from import_mtg_card_prices) as price_csv_rows,
  (
    select count(*)
    from import_mtg_card_prices_raw
    where lower(btrim(price_provider)) in (
      'cardhoarder',
      'manapool'
    )
  ) as skipped_unsupported_provider_rows,
  (
    select count(*)
    from import_mtg_card_prices_raw
    where lower(btrim(price_provider)) in (
      'cardkingdom',
      'cardmarket',
      'tcgplayer'
    )
    and (
      lower(btrim(game_availability)) <> 'paper'
      or lower(btrim(provider_listing)) <> 'retail'
    )
  ) as skipped_non_paper_or_non_retail_rows,
  (
    select count(*)
    from import_mtg_cards
    where btrim(coalesce(mana_value, '')) ~ '^[0-9]+(\.[0-9]+)?$'
      and btrim(mana_value)::numeric >= 10000
  ) as skipped_oversized_mana_value_rows,
  (
    select count(*)
    from import_mtg_card_prices_supported prices
    left join import_mtg_cards cards
    on cards.uuid = prices.uuid
    where cards.uuid is null
  ) as skipped_price_rows_without_imported_card,
  (
    select count(*)
    from public.cards cards
    inner join import_mtg_arena_only_cards arena_only_cards
    on arena_only_cards.uuid = cards.external_id
    where cards.tcg_id = 'mtg'
  ) as retained_arena_only_cards_with_binders,
  (select count(*) from public.card_market_prices where tcg_id = 'mtg') as prices_in_database,
  (select min(price_date) from import_mtg_card_prices) as min_price_date,
  (select max(price_date) from import_mtg_card_prices) as max_price_date;

commit;
