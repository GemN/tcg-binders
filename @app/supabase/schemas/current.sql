comment on table public.binder_cards is
  E'@graphql({"totalCount": {"enabled": true}})';

create or replace function public.binder_card_count(
  binder public.binders
) returns integer as $$
  select count(distinct bc.card_id)::integer
  from public.binder_cards as bc
  where bc.binder_id = ($1).id;
$$ language sql stable set search_path from current;

comment on function public.binder_card_count(public.binders) is
  E'Returns the number of unique cards in a binder.';

grant execute on function public.binder_card_count(public.binders) to anon, authenticated;
