alter table public.binders
  add column if not exists note text;

update public.binders
set note = ''
where note is null;

alter table public.binders
  alter column note set default '',
  alter column note set not null;

grant insert (note) on public.binders to authenticated;
grant update (note) on public.binders to authenticated;
