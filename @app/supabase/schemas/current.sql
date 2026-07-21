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

create table if not exists public.binder_stats (
  binder_id uuid primary key references public.binders(id) on delete cascade,
  view_count bigint default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint binder_stats_view_count_check check (view_count >= 0)
);

comment on table public.binder_stats is
  E'Stores aggregate statistics for a binder.';

comment on column public.binder_stats.view_count is
  E'Number of successful binder page visits by visitors other than the authenticated binder owner.';

comment on constraint binder_stats_binder_id_fkey on public.binder_stats is
  E'@graphql({"foreign_name": "binder", "local_name": "stats"})';

alter table public.binder_stats enable row level security;

drop policy if exists binder_stats_select_owner on public.binder_stats;
create policy binder_stats_select_owner
on public.binder_stats
for select
to authenticated
using (
  exists (
    select 1
    from public.binders
    where binders.id = binder_stats.binder_id
    and binders.owner_id = auth.uid()
  )
);

drop trigger if exists _100_timestamps on public.binder_stats;
create trigger _100_timestamps
  before insert or update on public.binder_stats
  for each row execute procedure private.tg__timestamps();

grant select on public.binder_stats to anon, authenticated;
grant all on public.binder_stats to service_role;

create or replace function public.record_binder_view(
  binder_short_id text
) returns boolean as $$
declare
  v_binder_id uuid;
  v_owner_id uuid;
begin
  select binders.id, binders.owner_id
  into v_binder_id, v_owner_id
  from public.binders
  where binders.short_id = $1
  and binders.visibility in ('listed', 'unlisted');

  if not found then
    return false;
  end if;

  if auth.uid() is not null and auth.uid() = v_owner_id then
    return false;
  end if;

  insert into public.binder_stats (binder_id, view_count)
  values (v_binder_id, 1)
  on conflict (binder_id)
  do update
  set view_count = binder_stats.view_count + 1;

  return true;
end;
$$ language plpgsql strict volatile security definer set search_path from current;

comment on function public.record_binder_view(text) is
  E'Atomically records a successful listed or unlisted binder visit unless the authenticated user owns the binder.';

revoke execute on function public.record_binder_view(text) from public;
grant execute on function public.record_binder_view(text) to anon, authenticated;
