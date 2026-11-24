-- Signup choice: child may link to a parent (pending approval) or create the account directly (active). An email is always linked.
alter table public.profiles add column if not exists link_parent boolean not null default true;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare v_role user_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'child');
        v_username text := lower(coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text,1,8)));
        v_admins text[] := string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',');
begin
  if new.email = any(v_admins) then v_role := 'admin'; end if;
  insert into public.profiles (id, username, display_name, role, status, parent_email, under13, lang, link_parent)
  values (new.id, v_username, coalesce(new.raw_user_meta_data->>'display_name', v_username), v_role,
          case when v_role = 'child' and coalesce((new.raw_user_meta_data->>'link_parent')::boolean, true) then 'pending'::account_status else 'active'::account_status end,
          new.raw_user_meta_data->>'parent_email', coalesce((new.raw_user_meta_data->>'under13')::boolean, v_role='child'),
          coalesce(new.raw_user_meta_data->>'lang','ar'), coalesce((new.raw_user_meta_data->>'link_parent')::boolean, true))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
