
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

create or replace function public.binder_cards_by_short_id(
  binder_short_id text,
  sort text default 'seller_order',
  result_limit integer default 36
) returns setof public.binder_cards as $$
  select binder_cards.*
  from public.binder_cards
  inner join public.binders
  on binders.id = binder_cards.binder_id
  inner join public.cards
  on cards.id = binder_cards.card_id
  and cards.tcg_id = binder_cards.tcg_id
  where binders.short_id = binder_short_id
  order by
    case when sort = 'name' then cards.name end asc nulls last,
    case when sort = 'release_date' then cards.released_at end desc nulls last,
    case when sort = 'seller_order' then binder_cards.position end asc nulls last,
    binder_cards.position asc,
    binder_cards.id asc
  limit least(greatest(result_limit, 0), 500);
$$ language sql stable set search_path from current;

comment on function public.binder_cards_by_short_id(text, text, integer) is
  E'Returns binder cards by binder short_id, ordered by the requested binder display sort.';

grant execute on function public.binder_cards_by_short_id(text, text, integer) to anon, authenticated;
