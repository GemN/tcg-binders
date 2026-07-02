alter table public.user_profiles
  add column if not exists nickname text default '' not null,
  add column if not exists country text default '' not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
    and table_name = 'user_profiles'
    and column_name = 'firstname'
  )
  and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
    and table_name = 'user_profiles'
    and column_name = 'lastname'
  ) then
    update public.user_profiles
    set nickname = coalesce(
      nullif(trim(nickname), ''),
      nullif(trim(concat_ws(' ', nullif(firstname, ''), nullif(lastname, ''))), ''),
      ''
    );
  end if;
end;
$$;

alter table public.user_profiles
  drop column if exists firstname,
  drop column if exists lastname;

grant update(nickname, country) on public.user_profiles
  to authenticated;

create or replace function private.tg__new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, nickname, country)
  values (
    NEW.id,
    coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'nickname'), ''), ''),
    coalesce(NEW.raw_user_meta_data ->> 'country', '')
  );
  return NEW;
end;
$$ language plpgsql volatile security definer set search_path from current;
