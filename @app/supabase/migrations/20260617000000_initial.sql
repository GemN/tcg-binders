create schema if not exists private;

create extension if not exists pg_graphql with schema graphql;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

create type public.organization_member_role as enum (
  'OWNER',
  'ADMIN',
  'MEMBER'
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  firstname text default '' not null,
  lastname text default '' not null,
  is_admin boolean default false not null
);

create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_member_role default 'MEMBER' not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (organization_id, user_id),
  unique (organization_id, id),
  check (role <> 'OWNER'::public.organization_member_role or is_active)
);

create unique index organization_members_one_owner_per_org
  on public.organization_members(organization_id)
  where role = 'OWNER'::public.organization_member_role;

alter table public.user_profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

grant select on public.user_profiles to anon, authenticated;
grant update(firstname, lastname) on public.user_profiles to authenticated;
grant all on public.user_profiles to service_role;

grant select on public.organizations to anon, authenticated;
grant update(name) on public.organizations to authenticated;
grant all on public.organizations to service_role;

grant select on public.organization_members to anon;
grant select, insert, update, delete on public.organization_members to authenticated;
grant all on public.organization_members to service_role;

create or replace function private.is_organization_member(
  organization_id uuid,
  user_id uuid,
  required_roles public.organization_member_role[] default null
) returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = is_organization_member.organization_id
      and m.user_id = is_organization_member.user_id
      and m.is_active = true
      and (
        is_organization_member.required_roles is null
        or cardinality(is_organization_member.required_roles) = 0
        or m.role = any(is_organization_member.required_roles)
      )
  );
$$;

create policy user_profiles_select_own
  on public.user_profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy user_profiles_update_own
  on public.user_profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy organizations_select_if_member
  on public.organizations
  for select
  to authenticated
  using (
    private.is_organization_member(organizations.id, (select auth.uid()))
  );

create policy organizations_update_if_admin
  on public.organizations
  for update
  to authenticated
  using (
    private.is_organization_member(
      organizations.id,
      (select auth.uid()),
      array['OWNER', 'ADMIN']::public.organization_member_role[]
    )
  )
  with check (
    private.is_organization_member(
      organizations.id,
      (select auth.uid()),
      array['OWNER', 'ADMIN']::public.organization_member_role[]
    )
  );

create policy organization_members_select_if_member
  on public.organization_members
  for select
  to authenticated
  using (
    private.is_organization_member(
      organization_members.organization_id,
      (select auth.uid())
    )
  );

create policy organization_members_insert_if_admin
  on public.organization_members
  for insert
  to authenticated
  with check (
    private.is_organization_member(
      organization_members.organization_id,
      (select auth.uid()),
      array['OWNER', 'ADMIN']::public.organization_member_role[]
    )
  );

create policy organization_members_update_if_admin
  on public.organization_members
  for update
  to authenticated
  using (
    private.is_organization_member(
      organization_members.organization_id,
      (select auth.uid()),
      array['OWNER', 'ADMIN']::public.organization_member_role[]
    )
  )
  with check (
    private.is_organization_member(
      organization_members.organization_id,
      (select auth.uid()),
      array['OWNER', 'ADMIN']::public.organization_member_role[]
    )
  );

create policy organization_members_delete_if_admin
  on public.organization_members
  for delete
  to authenticated
  using (
    private.is_organization_member(
      organization_members.organization_id,
      (select auth.uid()),
      array['OWNER', 'ADMIN']::public.organization_member_role[]
    )
  );

create view public.user_organization_contexts
with (security_invoker = true)
as
select
  m.user_id,
  o.id as organization_id,
  o.name as organization_name,
  m.role
from public.organizations o
join public.organization_members m on m.organization_id = o.id
where m.is_active = true;

grant select on public.user_organization_contexts to anon, authenticated;

create or replace function public.current_user_profile()
returns public.user_profiles
language sql
stable
security definer
set search_path = ''
as $$
  select *
  from public.user_profiles
  where id = (select auth.uid());
$$;

grant execute on function public.current_user_profile() to anon, authenticated;

create or replace function public.current_user_organization_contexts()
returns setof public.organization_members
language sql
stable
security definer
set search_path = ''
as $$
  select m.*
  from public.organization_members m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = (select auth.uid())
    and m.is_active = true
  order by o.name;
$$;

grant execute on function public.current_user_organization_contexts() to anon, authenticated;

create or replace function public.create_organization(name text)
returns public.organizations
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_organization public.organizations;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.organizations(name)
  values (create_organization.name)
  returning * into v_organization;

  insert into public.organization_members(organization_id, user_id, role)
  values (v_organization.id, v_user_id, 'OWNER');

  return v_organization;
end;
$$;

grant execute on function public.create_organization(text) to anon, authenticated;

create or replace function private.tg__new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, firstname, lastname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'firstname', ''),
    coalesce(new.raw_user_meta_data ->> 'lastname', '')
  );
  return new;
end;
$$;

drop trigger if exists _500_new_user on auth.users;
create trigger _500_new_user
  after insert on auth.users
  for each row execute procedure private.tg__new_user();
