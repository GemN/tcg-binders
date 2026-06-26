alter table public.binders
  add column if not exists note text not null default '';

grant insert (note) on public.binders to authenticated;
grant update (note) on public.binders to authenticated;
