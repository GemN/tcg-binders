/*
  Demo credentials:
  - email: admin@example.com
  - password: test
*/

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_anonymous
) values (
  '00000000-0000-0000-0000-000000000000',
  '2e7bfea0-e2ab-474e-8634-9afe18ee0888',
  'authenticated',
  'authenticated',
  'admin@example.com',
  '$2a$10$D.04p2shfn7piuELp.jbnOfgNT7t1tM2kJPPTzAlRqPXXOBdvjHyu',
  now(),
  '',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{"email_verified": true, "firstname": "Demo", "lastname": "Admin"}',
  now(),
  now(),
  false
) on conflict (id) do nothing;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at,
  id
) values (
  '2e7bfea0-e2ab-474e-8634-9afe18ee0888',
  '2e7bfea0-e2ab-474e-8634-9afe18ee0888',
  '{"sub": "2e7bfea0-e2ab-474e-8634-9afe18ee0888", "email": "admin@example.com", "email_verified": true, "phone_verified": false}',
  'email',
  now(),
  now(),
  now(),
  '58e12b66-01ea-4c38-875c-4410fff03718'
) on conflict (provider_id, provider) do nothing;

update public.user_profiles
set is_admin = true
where id = '2e7bfea0-e2ab-474e-8634-9afe18ee0888';

insert into public.organizations (id, name)
values ('1d440560-1a5a-4a8b-8d68-1b2e55524427', 'Demo Workspace')
on conflict (id) do nothing;

insert into public.organization_members (organization_id, user_id, role)
values (
  '1d440560-1a5a-4a8b-8d68-1b2e55524427',
  '2e7bfea0-e2ab-474e-8634-9afe18ee0888',
  'OWNER'
) on conflict (organization_id, user_id) do nothing;
