-- =====================================================================
--  ALILOX — kids 3D block-world platform · Supabase schema (run once)
--  Paste into Supabase → SQL Editor → Run.  Safe to re-run (idempotent).
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  create type user_role as enum ('child','parent','admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type account_status as enum ('pending','active','frozen','banned');
exception when duplicate_object then null; end $$;
do $$ begin
  create type friend_status as enum ('pending','accepted','blocked');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,16}$'),
  display_name text not null check (char_length(display_name) between 1 and 24),
  role user_role not null default 'child',
  status account_status not null default 'pending',
  parent_id uuid references public.profiles(id) on delete set null,
  parent_email text,                       -- used while the account is still pending
  under13 boolean not null default true,
  friend_code text unique not null default upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),
  avatar jsonb not null default '{"skin":0,"shirt":2,"pants":2,"hair":"short","hairc":0,"face":"😀","hat":"cap","back":"none","pet":"none"}',
  photo_path text,                         -- storage path (bucket photos) — only shown to approved friends
  photo_approved boolean not null default false,
  coins int not null default 100 check (coins >= 0),
  xp int not null default 0 check (xp >= 0),
  level int not null default 1,
  streak int not null default 0,
  last_gift date,
  lang text not null default 'ar',
  daily_limit_min int not null default 60,  -- parent setting
  allowed_from int not null default 7,      -- hour of day (parent setting)
  allowed_to int not null default 21,
  house jsonb not null default '{"wall":0,"floor":0,"items":[]}',
  owned text[] not null default array['cap'],
  badges text[] not null default '{}',
  worlds_done text[] not null default '{}',
  created_at timestamptz not null default now(),
  last_seen timestamptz
);
create index if not exists profiles_parent_idx on public.profiles(parent_id);

-- level formula: level n needs 100*n^1.5 xp cumulative (simple & fun)
create or replace function public.level_for_xp(x int) returns int language sql immutable as $$
  select greatest(1, floor(power(greatest(x,0)::float/100.0, 1.0/1.5))::int + 1);
$$;

-- keep level in sync & protect sensitive columns from self-edit
create or replace function public.profiles_guard() returns trigger language plpgsql security definer as $$
declare me_role user_role;
begin
  select role into me_role from public.profiles where id = auth.uid();
  if tg_op = 'UPDATE' and auth.uid() = new.id and coalesce(me_role,'child') <> 'admin' and coalesce(current_setting('app.bypass', true),'') <> '1' then
    -- a user may not change their own role/status/coins/xp/owned/parent (server functions do that)
    new.role := old.role; new.status := old.status; new.coins := old.coins; new.xp := old.xp;
    new.owned := old.owned; new.badges := old.badges; new.parent_id := old.parent_id; new.friend_code := old.friend_code;
    new.photo_approved := old.photo_approved; new.daily_limit_min := old.daily_limit_min; new.allowed_from := old.allowed_from; new.allowed_to := old.allowed_to;
    new.under13 := old.under13; new.worlds_done := old.worlds_done; new.streak := old.streak; new.last_gift := old.last_gift;
  end if;
  new.level := public.level_for_xp(new.xp);
  return new;
end $$;
drop trigger if exists profiles_guard_trg on public.profiles;
create trigger profiles_guard_trg before update on public.profiles for each row execute function public.profiles_guard();

-- auto-create profile on signup (metadata from the client)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare v_role user_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'child');
        v_username text := lower(coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text,1,8)));
        v_admins text[] := string_to_array(coalesce(current_setting('app.admin_emails', true), ''), ',');
begin
  if new.email = any(v_admins) then v_role := 'admin'; end if;
  insert into public.profiles (id, username, display_name, role, status, parent_email, under13, lang)
  values (new.id, v_username, coalesce(new.raw_user_meta_data->>'display_name', v_username), v_role,
          case when v_role = 'child' then 'pending'::account_status else 'active'::account_status end,
          new.raw_user_meta_data->>'parent_email', coalesce((new.raw_user_meta_data->>'under13')::boolean, v_role='child'),
          coalesce(new.raw_user_meta_data->>'lang','ar'))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- catalog (shop) ----------
create table if not exists public.items (
  id text primary key, kind text not null check (kind in ('hat','back','pet','face','furniture','wall','floor','emote')),
  name_en text not null, name_ar text not null, icon text not null, price int not null default 0, rarity text not null default 'common',
  season text, active boolean not null default true, sort int not null default 100
);

-- ---------- friends ----------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references public.profiles(id) on delete cascade,
  addressee uuid not null references public.profiles(id) on delete cascade,
  status friend_status not null default 'pending',
  parent_ok boolean not null default false,     -- parent of an under-13 child must approve
  created_at timestamptz not null default now(),
  unique (requester, addressee), check (requester <> addressee)
);
create index if not exists friendships_addr_idx on public.friendships(addressee);

-- ---------- scores / sessions / quests ----------
create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  world text not null, mode text not null default 'solo', score int not null default 0, time_s int, coins int default 0, finished boolean default false,
  created_at timestamptz not null default now());
create index if not exists scores_user_idx on public.scores(user_id, created_at desc);
create index if not exists scores_world_idx on public.scores(world, score desc);

create table if not exists public.play_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null default current_date, minutes int not null default 0, unique(user_id, day));

create table if not exists public.quests (
  id text primary key, period text not null check (period in ('daily','weekly')), kind text not null, target int not null,
  title_en text not null, title_ar text not null, reward_coins int not null default 20, reward_xp int not null default 50, icon text not null default '⭐', active boolean default true);
create table if not exists public.quest_progress (
  user_id uuid not null references public.profiles(id) on delete cascade, quest_id text not null references public.quests(id) on delete cascade,
  period_key text not null, progress int not null default 0, claimed boolean not null default false, primary key(user_id, quest_id, period_key));

-- ---------- seasons / events (admin) ----------
create table if not exists public.seasons (
  id text primary key, name_en text not null, name_ar text not null, icon text not null, theme jsonb not null default '{}',
  starts_at date not null, ends_at date not null, active boolean default true);

-- ---------- user-made worlds ----------
create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(), owner uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30), code text unique not null default upper(substr(encode(gen_random_bytes(3),'hex'),1,6)),
  data jsonb not null default '{"blocks":[],"coins":[]}', published boolean not null default false, approved boolean not null default false,
  plays int not null default 0, likes int not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

-- ---------- rooms (online play, max 6) ----------
create table if not exists public.rooms (
  code text primary key, host uuid not null references public.profiles(id) on delete cascade, world text not null default 'obby',
  max_players int not null default 6 check (max_players between 2 and 6), status text not null default 'lobby' check (status in ('lobby','playing','ended')),
  private boolean not null default true, created_at timestamptz not null default now());
create table if not exists public.room_members (
  room_code text not null references public.rooms(code) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(), finished_at timestamptz, score int, primary key(room_code, user_id));

-- ---------- support / moderation ----------
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'support' check (kind in ('support','report','photo_review','world_review')),
  subject text not null, body text, target_user uuid references public.profiles(id) on delete set null, target_world uuid references public.worlds(id) on delete set null,
  status text not null default 'open' check (status in ('open','resolved','rejected')), admin_note text, created_at timestamptz not null default now(), resolved_at timestamptz);
create table if not exists public.audit_log (
  id bigserial primary key, actor uuid, action text not null, target uuid, meta jsonb, created_at timestamptz not null default now());

-- =====================================================================
--  helper functions (security definer = run with table-owner rights)
-- =====================================================================
create or replace function public.my_role() returns user_role language sql stable security definer set search_path=public as $$
  select role from public.profiles where id = auth.uid() $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;
create or replace function public.is_parent_of(child uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id = child and parent_id = auth.uid()) $$;
create or replace function public.are_friends(a uuid, b uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.friendships where status='accepted' and parent_ok and ((requester=a and addressee=b) or (requester=b and addressee=a))) $$;

-- Parent links a pending child by username + the parent email the child typed
create or replace function public.parent_claim_child(p_username text) returns json language plpgsql security definer set search_path=public as $$
declare c public.profiles; me public.profiles; my_email text;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.role <> 'parent' and me.role <> 'admin' then raise exception 'Only parents can claim children'; end if;
  select email into my_email from auth.users where id = auth.uid();
  select * into c from public.profiles where username = lower(p_username) and role = 'child';
  if c.id is null then raise exception 'Child not found'; end if;
  if c.parent_id is not null and c.parent_id <> me.id then raise exception 'This child already has a parent'; end if;
  if c.parent_email is not null and lower(c.parent_email) <> lower(my_email) and me.role <> 'admin' then raise exception 'The child entered a different parent email'; end if;
  update public.profiles set parent_id = me.id, status = 'active' where id = c.id;
  insert into public.audit_log(actor, action, target) values (me.id, 'claim_child', c.id);
  return json_build_object('ok', true, 'child', c.username);
end $$;

-- Parent (or admin) creates a child account directly: returns nothing; account is created client-side with service role via API
-- Parent settings
create or replace function public.parent_set_child(p_child uuid, p_status account_status, p_limit int, p_from int, p_to int, p_photo_ok boolean) returns void language plpgsql security definer set search_path=public as $$
begin
  if not (public.is_parent_of(p_child) or public.is_admin()) then raise exception 'Not your child'; end if;
  update public.profiles set status = case when p_status in ('active','frozen') then p_status else status end,
    daily_limit_min = greatest(10, least(300, p_limit)), allowed_from = least(23, greatest(0,p_from)), allowed_to = least(24, greatest(1,p_to)), photo_approved = p_photo_ok where id = p_child;
end $$;

-- Friend request by friend code
create or replace function public.friend_request(p_code text) returns json language plpgsql security definer set search_path=public as $$
declare other public.profiles; me public.profiles;
begin
  select * into me from public.profiles where id = auth.uid();
  select * into other from public.profiles where friend_code = upper(p_code) and status = 'active';
  if other.id is null then raise exception 'No player with that friend code'; end if;
  if other.id = me.id then raise exception 'That is your own code 🙂'; end if;
  insert into public.friendships(requester, addressee, status, parent_ok)
  values (me.id, other.id, 'pending', not (me.under13 or other.under13))
  on conflict (requester, addressee) do nothing;
  return json_build_object('ok', true, 'to', other.display_name);
end $$;

create or replace function public.friend_respond(p_id uuid, p_accept boolean) returns void language plpgsql security definer set search_path=public as $$
declare f public.friendships;
begin
  select * into f from public.friendships where id = p_id;
  if f.addressee <> auth.uid() then raise exception 'Not yours'; end if;
  if p_accept then update public.friendships set status='accepted' where id=p_id; else delete from public.friendships where id=p_id; end if;
end $$;

-- Parent approves a friendship for their child
create or replace function public.parent_approve_friend(p_id uuid, p_ok boolean) returns void language plpgsql security definer set search_path=public as $$
declare f public.friendships;
begin
  select * into f from public.friendships where id = p_id;
  if not (public.is_parent_of(f.requester) or public.is_parent_of(f.addressee) or public.is_admin()) then raise exception 'Not your child'; end if;
  if p_ok then update public.friendships set parent_ok = true where id = p_id; else delete from public.friendships where id = p_id; end if;
end $$;

-- Economy: award coins/xp after a run (server-validated caps), record score and quest progress
create or replace function public.finish_run(p_world text, p_mode text, p_score int, p_time int, p_coins int, p_finished boolean, p_deaths int) returns json language plpgsql security definer set search_path=public as $$
declare me public.profiles; gain int; xp_gain int; q record; pk text; new_badges text[] := '{}';
begin
  perform set_config('app.bypass','1',true);
  select * into me from public.profiles where id = auth.uid();
  if me.status <> 'active' then raise exception 'Account not active'; end if;
  gain := least(60, greatest(0, p_coins)) + case when p_finished then 20 else 0 end;
  xp_gain := least(400, greatest(0, p_score)) + case when p_finished then 50 else 0 end;
  insert into public.scores(user_id, world, mode, score, time_s, coins, finished) values (me.id, p_world, p_mode, least(2000,greatest(0,p_score)), p_time, p_coins, p_finished);
  if p_finished and not (p_world = any(me.worlds_done)) then me.worlds_done := array_append(me.worlds_done, p_world); end if;
  if p_finished and not ('first' = any(me.badges)) then new_badges := array_append(new_badges, 'first'); end if;
  if p_finished and p_deaths = 0 and not ('nofall' = any(me.badges)) then new_badges := array_append(new_badges, 'nofall'); end if;
  if p_mode = 'cpu' and p_finished and not ('robot' = any(me.badges)) then new_badges := array_append(new_badges, 'robot'); end if;
  if array_length(me.worlds_done,1) >= 3 and not ('worlds' = any(me.badges)) then new_badges := array_append(new_badges, 'worlds'); end if;
  update public.profiles set coins = coins + gain, xp = xp + xp_gain, worlds_done = me.worlds_done, badges = array_cat(badges, new_badges), last_seen = now() where id = me.id;
  -- quests
  for q in select * from public.quests where active loop
    pk := case when q.period='daily' then to_char(current_date,'YYYY-MM-DD') else to_char(date_trunc('week',current_date),'YYYY-MM-DD') end;
    if (q.kind='play') or (q.kind='finish' and p_finished) or (q.kind='coins') or (q.kind='world_'||p_world and p_finished) or (q.kind='online' and p_mode='online') then
      insert into public.quest_progress(user_id, quest_id, period_key, progress) values (me.id, q.id, pk, case when q.kind='coins' then p_coins else 1 end)
      on conflict (user_id, quest_id, period_key) do update set progress = least(q.target, public.quest_progress.progress + excluded.progress);
    end if;
  end loop;
  return json_build_object('coins', gain, 'xp', xp_gain, 'badges', new_badges);
end $$;

create or replace function public.claim_quest(p_quest text) returns json language plpgsql security definer set search_path=public as $$
declare q public.quests; pk text; qp public.quest_progress;
begin
  perform set_config('app.bypass','1',true);
  select * into q from public.quests where id = p_quest and active;
  pk := case when q.period='daily' then to_char(current_date,'YYYY-MM-DD') else to_char(date_trunc('week',current_date),'YYYY-MM-DD') end;
  select * into qp from public.quest_progress where user_id = auth.uid() and quest_id = p_quest and period_key = pk;
  if qp.progress is null or qp.progress < q.target or qp.claimed then raise exception 'Quest not complete'; end if;
  update public.quest_progress set claimed = true where user_id = auth.uid() and quest_id = p_quest and period_key = pk;
  update public.profiles set coins = coins + q.reward_coins, xp = xp + q.reward_xp where id = auth.uid();
  return json_build_object('coins', q.reward_coins, 'xp', q.reward_xp);
end $$;

create or replace function public.claim_daily_gift() returns json language plpgsql security definer set search_path=public as $$
declare me public.profiles; s int; g int;
begin
  perform set_config('app.bypass','1',true);
  select * into me from public.profiles where id = auth.uid();
  if me.last_gift = current_date then raise exception 'Already claimed today'; end if;
  s := case when me.last_gift = current_date - 1 then me.streak + 1 else 1 end;
  g := 25 + least(50, (s-1)*5);
  update public.profiles set streak = s, last_gift = current_date, coins = coins + g, xp = xp + 10,
    badges = case when s >= 3 and not ('streak3' = any(badges)) then array_append(badges, 'streak3') else badges end where id = me.id;
  return json_build_object('coins', g, 'streak', s);
end $$;

create or replace function public.buy_item(p_item text) returns json language plpgsql security definer set search_path=public as $$
declare it public.items; me public.profiles;
begin
  perform set_config('app.bypass','1',true);
  select * into it from public.items where id = p_item and active;
  if it.id is null then raise exception 'Item not found'; end if;
  select * into me from public.profiles where id = auth.uid();
  if p_item = any(me.owned) then raise exception 'Already owned'; end if;
  if me.coins < it.price then raise exception 'Not enough Alicoins'; end if;
  update public.profiles set coins = coins - it.price, owned = array_append(owned, p_item) where id = me.id;
  return json_build_object('ok', true, 'coins', me.coins - it.price);
end $$;

-- play time accounting (called every minute from the client while playing)
create or replace function public.tick_play(p_minutes int) returns json language plpgsql security definer set search_path=public as $$
declare me public.profiles; used int; h int;
begin
  select * into me from public.profiles where id = auth.uid();
  insert into public.play_sessions(user_id, day, minutes) values (me.id, current_date, greatest(0,least(5,p_minutes)))
  on conflict (user_id, day) do update set minutes = public.play_sessions.minutes + excluded.minutes;
  select minutes into used from public.play_sessions where user_id = me.id and day = current_date;
  update public.profiles set last_seen = now() where id = me.id;
  h := extract(hour from (now() at time zone 'Asia/Riyadh'))::int;
  return json_build_object('used', used, 'limit', me.daily_limit_min, 'allowed', me.role <> 'child' or (used < me.daily_limit_min and h >= me.allowed_from and h < me.allowed_to), 'from', me.allowed_from, 'to', me.allowed_to);
end $$;

create or replace function public.world_played(p_id uuid) returns void language sql security definer set search_path=public as $$
  update public.worlds set plays = plays + 1 where id = p_id and published and approved $$;
create or replace function public.admin_stats() returns json language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return json_build_object('users', (select count(*) from public.profiles), 'children', (select count(*) from public.profiles where role='child'), 'pending', (select count(*) from public.profiles where status='pending'),
    'today', (select count(*) from public.profiles where last_seen::date = current_date), 'runs', (select count(*) from public.scores), 'runs_today', (select count(*) from public.scores where created_at::date = current_date),
    'open_tickets', (select count(*) from public.tickets where status='open'), 'worlds_pending', (select count(*) from public.worlds where published and not approved));
end $$;
create or replace function public.admin_set_user(p_id uuid, p_status account_status, p_role user_role, p_coins int) returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.profiles set status = p_status, role = p_role, coins = greatest(0, p_coins) where id = p_id;
  insert into public.audit_log(actor, action, target, meta) values (auth.uid(), 'admin_set_user', p_id, json_build_object('status',p_status,'role',p_role,'coins',p_coins)::jsonb);
end $$;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.friendships enable row level security;
alter table public.scores enable row level security;
alter table public.play_sessions enable row level security;
alter table public.quests enable row level security;
alter table public.quest_progress enable row level security;
alter table public.seasons enable row level security;
alter table public.worlds enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.tickets enable row level security;
alter table public.audit_log enable row level security;

-- profiles: everyone signed-in can read public bits (we expose a safe view below); self/parent/admin can update
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid() or public.is_parent_of(id) or public.is_admin()) with check (id = auth.uid() or public.is_parent_of(id) or public.is_admin());

-- safe public view (hides parent_email etc.)
create or replace view public.players as
  select id, username, display_name, role, status, avatar, level, xp, badges, friend_code, last_seen,
         case when photo_approved and photo_path is not null then photo_path end as photo_path, under13
  from public.profiles;
grant select on public.players to authenticated;

drop policy if exists items_read on public.items; create policy items_read on public.items for select to authenticated using (true);
drop policy if exists items_admin on public.items; create policy items_admin on public.items for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists quests_read on public.quests; create policy quests_read on public.quests for select to authenticated using (true);
drop policy if exists quests_admin on public.quests; create policy quests_admin on public.quests for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists seasons_read on public.seasons; create policy seasons_read on public.seasons for select to anon, authenticated using (true);
drop policy if exists seasons_admin on public.seasons; create policy seasons_admin on public.seasons for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists friendships_rw on public.friendships;
create policy friendships_rw on public.friendships for select to authenticated using (requester = auth.uid() or addressee = auth.uid() or public.is_parent_of(requester) or public.is_parent_of(addressee) or public.is_admin());
drop policy if exists friendships_del on public.friendships;
create policy friendships_del on public.friendships for delete to authenticated using (requester = auth.uid() or addressee = auth.uid() or public.is_parent_of(requester) or public.is_parent_of(addressee) or public.is_admin());

drop policy if exists scores_read on public.scores; create policy scores_read on public.scores for select to authenticated using (true);
drop policy if exists sessions_read on public.play_sessions; create policy sessions_read on public.play_sessions for select to authenticated using (user_id = auth.uid() or public.is_parent_of(user_id) or public.is_admin());
drop policy if exists qp_read on public.quest_progress; create policy qp_read on public.quest_progress for select to authenticated using (user_id = auth.uid());

drop policy if exists worlds_read on public.worlds; create policy worlds_read on public.worlds for select to authenticated using (owner = auth.uid() or (published and approved) or public.is_admin());
drop policy if exists worlds_write on public.worlds; create policy worlds_write on public.worlds for insert to authenticated with check (owner = auth.uid());
drop policy if exists worlds_update on public.worlds; create policy worlds_update on public.worlds for update to authenticated using (owner = auth.uid() or public.is_admin()) with check (owner = auth.uid() or public.is_admin());
drop policy if exists worlds_delete on public.worlds; create policy worlds_delete on public.worlds for delete to authenticated using (owner = auth.uid() or public.is_admin());

drop policy if exists rooms_read on public.rooms; create policy rooms_read on public.rooms for select to authenticated using (true);
drop policy if exists rooms_ins on public.rooms; create policy rooms_ins on public.rooms for insert to authenticated with check (host = auth.uid());
drop policy if exists rooms_upd on public.rooms; create policy rooms_upd on public.rooms for update to authenticated using (host = auth.uid() or public.is_admin());
drop policy if exists rooms_del on public.rooms; create policy rooms_del on public.rooms for delete to authenticated using (host = auth.uid() or public.is_admin());
drop policy if exists rm_read on public.room_members; create policy rm_read on public.room_members for select to authenticated using (true);
drop policy if exists rm_ins on public.room_members; create policy rm_ins on public.room_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists rm_upd on public.room_members; create policy rm_upd on public.room_members for update to authenticated using (user_id = auth.uid());
drop policy if exists rm_del on public.room_members; create policy rm_del on public.room_members for delete to authenticated using (user_id = auth.uid() or exists(select 1 from public.rooms r where r.code = room_code and r.host = auth.uid()));

drop policy if exists tickets_read on public.tickets; create policy tickets_read on public.tickets for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists tickets_ins on public.tickets; create policy tickets_ins on public.tickets for insert to authenticated with check (user_id = auth.uid());
drop policy if exists tickets_admin on public.tickets; create policy tickets_admin on public.tickets for update to authenticated using (public.is_admin());
drop policy if exists audit_admin on public.audit_log; create policy audit_admin on public.audit_log for select to authenticated using (public.is_admin());

-- room capacity guard
create or replace function public.room_guard() returns trigger language plpgsql security definer as $$
declare n int; mx int; st text;
begin
  select count(*) into n from public.room_members where room_code = new.room_code;
  select max_players, status into mx, st from public.rooms where code = new.room_code;
  if st <> 'lobby' then raise exception 'Room already started'; end if;
  if n >= mx then raise exception 'Room is full'; end if;
  return new;
end $$;
drop trigger if exists room_guard_trg on public.room_members;
create trigger room_guard_trg before insert on public.room_members for each row execute function public.room_guard();


-- ---------- table privileges (RLS still decides row access) ----------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;

-- ---------- storage bucket for photos (private; served through signed URLs) ----------
insert into storage.buckets (id, name, public) values ('photos','photos', false) on conflict (id) do nothing;
drop policy if exists photos_own on storage.objects;
create policy photos_own on storage.objects for all to authenticated
  using (bucket_id = 'photos' and (split_part(name,'/',1) = auth.uid()::text or public.is_admin()))
  with check (bucket_id = 'photos' and (split_part(name,'/',1) = auth.uid()::text or public.is_admin()));
drop policy if exists photos_friends_read on storage.objects;
create policy photos_friends_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (public.are_friends(auth.uid(), split_part(name,'/',1)::uuid) or public.is_parent_of(split_part(name,'/',1)::uuid)));

-- ---------- seed: shop catalog, quests, first season ----------
insert into public.items (id, kind, name_en, name_ar, icon, price, rarity, sort) values
 ('cap','hat','Cap','كاب','🧢',0,'common',1),('party','hat','Party hat','قبعة حفلة','🥳',40,'common',2),('headphones','hat','Headphones','سماعات','🎧',60,'common',3),
 ('bunny','hat','Bunny ears','أذنا أرنب','🐰',80,'rare',4),('flower','hat','Flower','زهرة','🌸',50,'common',5),('halo','hat','Halo','هالة','😇',120,'rare',6),
 ('wizard','hat','Wizard hat','قبعة ساحر','🧙',150,'rare',7),('crown','hat','Crown','تاج','👑',250,'epic',8),
 ('cape','back','Hero cape','عباءة بطل','🦸',90,'common',10),('wings','back','Angel wings','أجنحة','🪽',180,'rare',11),('jetpack','back','Jetpack','جيت باك','🚀',220,'epic',12),
 ('duck','pet','Duck','بطة','🦆',70,'common',20),('cat','pet','Cat','قطة','🐱',120,'common',21),('dog','pet','Puppy','جرو','🐶',120,'common',22),('dragon','pet','Dragon','تنين','🐉',300,'epic',23),('robot','pet','Robo-buddy','روبوت','🤖',200,'rare',24),
 ('sofa','furniture','Sofa','كنبة','🛋️',60,'common',30),('bed','furniture','Bed','سرير','🛏️',80,'common',31),('tv','furniture','TV','تلفاز','📺',120,'rare',32),('plant','furniture','Plant','نبتة','🪴',30,'common',33),('lamp','furniture','Lamp','مصباح','💡',25,'common',34)
on conflict (id) do nothing;
insert into public.items (id, kind, name_en, name_ar, icon, price, rarity, sort) values
 ('wall_blue','wall','Blue walls','جدران زرقاء','🟦',40,'common',40),('wall_pink','wall','Pink walls','جدران وردية','🟪',40,'common',41),('floor_wood','floor','Wood floor','أرضية خشب','🟫',40,'common',42),('floor_grass','floor','Grass floor','أرضية عشب','🟩',40,'common',43),
 ('trophy','furniture','Trophy','كأس','🏆',150,'rare',35),('piano','furniture','Piano','بيانو','🎹',200,'epic',36),('rug','furniture','Rug','سجادة','🧶',35,'common',37)
on conflict (id) do nothing;

insert into public.quests (id, period, kind, target, title_en, title_ar, reward_coins, reward_xp, icon) values
 ('d_play3','daily','play',3,'Play 3 rounds','العب 3 جولات',20,60,'🎮'),('d_finish1','daily','finish',1,'Finish any world','أنهِ أي عالم',25,80,'🌀'),
 ('d_coins20','daily','coins',20,'Collect 20 coins','اجمع 20 عملة',20,50,'🪙'),('w_obby','weekly','world_obby',1,'Beat Obby Run','اجتز عالم الأوبي',40,150,'🧱'),
 ('w_tower','weekly','world_tower',1,'Climb the Sky Tower','تسلّق البرج',40,150,'🗼'),('w_online','weekly','online',2,'Play 2 online rounds','العب جولتين أونلاين',60,200,'🌐')
on conflict (id) do nothing;

insert into public.seasons (id, name_en, name_ar, icon, theme, starts_at, ends_at) values
 ('winter26','Winter Wonderland','موسم الشتاء','❄️','{"sky":"#BFE3FF","accent":"#60A5FA","snow":true}','2026-12-01','2027-01-31'),
 ('national','National Day','اليوم الوطني','🇸🇦','{"sky":"#A7F3D0","accent":"#16A34A"}','2026-09-20','2026-09-25')
on conflict (id) do nothing;

-- =====================================================================
-- Make yourself admin AFTER signing up (replace the email):
--   update public.profiles set role='admin', status='active' where id = (select id from auth.users where email='you@example.com');
-- =====================================================================
