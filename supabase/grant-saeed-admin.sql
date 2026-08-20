-- Run once in the Supabase SQL Editor to persist this admin role in the database.
-- The application also recognizes this confirmed email through its server-side allowlist.

do $$
declare
  target_user_id uuid;
begin
  select id
  into target_user_id
  from auth.users
  where lower(email) = 'saeedpsycl@gmail.com'
  limit 1;

  if target_user_id is null then
    raise exception 'No Supabase Auth user exists for saeedpsycl@gmail.com';
  end if;

  insert into public.profiles (id, email, role)
  values (target_user_id, 'saeedpsycl@gmail.com', 'admin')
  on conflict (id) do update
  set email = excluded.email,
      role = 'admin',
      updated_at = now();

  insert into public.admin_users (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'admin')
  where id = target_user_id;
end $$;
