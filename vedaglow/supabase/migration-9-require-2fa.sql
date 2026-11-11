-- OPTIONAL, run only AFTER you have turned on 2-step verification in Admin -> Security and signed in with a code at least once.
-- Makes the DATABASE itself refuse admin actions unless the session passed 2-step verification (aal2). If you run it before enrolling, you lock yourself out of admin.
-- To undo: re-run the original in schema.sql: create or replace function public.is_admin() ... exists (select 1 from public.admins where user_id = auth.uid())
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2' $$;
insert into public.schema_migrations (version, note) values ('9c', 'is_admin requires aal2') on conflict (version) do nothing;
