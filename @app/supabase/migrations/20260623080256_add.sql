
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

drop function if exists public.binder_cards_by_short_id(text, text, integer);

create or replace function public.binder_cards_by_short_id(
  binder_short_id text
) returns setof public.binder_cards as $$
  select binder_cards.*
  from public.binder_cards
  inner join public.binders
  on binders.id = binder_cards.binder_id
  where binders.short_id = binder_short_id;
$$ language sql stable set search_path from current;

comment on function public.binder_cards_by_short_id(text) is
  E'Returns binder cards by binder short_id. Ordering is applied through GraphQL orderBy.';

grant execute on function public.binder_cards_by_short_id(text) to anon, authenticated;

create or replace function public.binder_card_count_by_short_id(
  binder_short_id text
) returns integer as $$
  select count(distinct binder_cards.card_id)::integer
  from public.binder_cards
  inner join public.binders
  on binders.id = binder_cards.binder_id
  where binders.short_id = binder_short_id;
$$ language sql stable set search_path from current;

comment on function public.binder_card_count_by_short_id(text) is
  E'Returns the number of unique cards in a binder by binder short_id.';

grant execute on function public.binder_card_count_by_short_id(text) to anon, authenticated;

alter table public.binder_cards
  add column if not exists card_name text,
  add column if not exists card_released_at date;

update public.binder_cards
set
  card_name = cards.name,
  card_released_at = cards.released_at
from public.cards
where cards.id = binder_cards.card_id
and cards.tcg_id = binder_cards.tcg_id;

alter table public.binder_cards
  alter column card_name set not null;

create index if not exists binder_cards_binder_id_card_name_idx
on public.binder_cards (binder_id, card_name, created_at desc, id);

create index if not exists binder_cards_binder_id_card_released_at_idx
on public.binder_cards (binder_id, card_released_at desc, card_name, id);

drop trigger if exists _400_set_card_sort_fields on public.binder_cards;
drop function if exists private.tg_binder_cards__set_card_sort_fields();

create or replace function private.tg_binder_cards__set_card_sort_fields()
returns trigger as $$
declare
  v_card_name text;
  v_card_released_at date;
begin
  select cards.name, cards.released_at
  into v_card_name, v_card_released_at
  from public.cards
  where cards.id = NEW.card_id
  and cards.tcg_id = NEW.tcg_id;

  if not found then
    return NEW;
  end if;

  NEW.card_name = v_card_name;
  NEW.card_released_at = v_card_released_at;
  return NEW;
end;
$$ language plpgsql volatile set search_path from current;

comment on function private.tg_binder_cards__set_card_sort_fields() is
  E'Copies card sort fields onto binder_cards so GraphQL orderBy can sort binder cards by card metadata.';

create trigger _400_set_card_sort_fields
  before insert or update of tcg_id, card_id on public.binder_cards
  for each row execute procedure private.tg_binder_cards__set_card_sort_fields();

drop trigger if exists _500_sync_binder_card_sort_fields on public.cards;
drop function if exists private.tg_cards__sync_binder_card_sort_fields();

create or replace function private.tg_cards__sync_binder_card_sort_fields()
returns trigger as $$
begin
  if OLD.name is not distinct from NEW.name
  and OLD.released_at is not distinct from NEW.released_at then
    return NEW;
  end if;

  update public.binder_cards
  set
    card_name = NEW.name,
    card_released_at = NEW.released_at
  where binder_cards.card_id = NEW.id
  and binder_cards.tcg_id = NEW.tcg_id;

  return NEW;
end;
$$ language plpgsql volatile set search_path from current;

comment on function private.tg_cards__sync_binder_card_sort_fields() is
  E'Syncs denormalized binder card sort fields when card sort metadata changes.';

create trigger _500_sync_binder_card_sort_fields
  after update of name, released_at on public.cards
  for each row execute procedure private.tg_cards__sync_binder_card_sort_fields();
