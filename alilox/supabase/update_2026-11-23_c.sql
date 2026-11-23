-- Levels by coins only (run once)
create or replace function public.level_for_xp(x int) returns int language sql immutable as $$
  select greatest(1, floor(power(greatest(x,0)::float/60.0, 1.0/1.5))::int + 1);
$$;
create or replace function public.finish_run(p_world text, p_mode text, p_score int, p_time int, p_coins int, p_finished boolean, p_deaths int) returns json language plpgsql security definer set search_path=public as $$
declare me public.profiles; gain int; xp_gain int; q record; pk text; new_badges text[] := '{}'; done_q json[] := '{}'; qp public.quest_progress; old_level int; new_level int;
begin
  perform set_config('app.bypass','1',true);
  select * into me from public.profiles where id = auth.uid();
  if me.status <> 'active' then raise exception 'Account not active'; end if;
  gain := least(60, greatest(0, p_coins)) + case when p_finished then 20 else 0 end;
  xp_gain := gain;  -- levels are driven by coins only
  old_level := public.level_for_xp(me.xp);
  insert into public.scores(user_id, world, mode, score, time_s, coins, finished) values (me.id, p_world, p_mode, least(2000,greatest(0,p_score)), p_time, p_coins, p_finished);
  if p_finished and not (p_world = any(me.worlds_done)) then me.worlds_done := array_append(me.worlds_done, p_world); end if;
  if p_finished and not ('first' = any(me.badges)) then new_badges := array_append(new_badges, 'first'); end if;
  if p_finished and p_deaths = 0 and not ('nofall' = any(me.badges)) then new_badges := array_append(new_badges, 'nofall'); end if;
  if p_mode = 'cpu' and p_finished and not ('robot' = any(me.badges)) then new_badges := array_append(new_badges, 'robot'); end if;
  if array_length(me.worlds_done,1) >= 3 and not ('worlds' = any(me.badges)) then new_badges := array_append(new_badges, 'worlds'); end if;
  if p_world = 'c10' and p_finished and not ('hero' = any(me.badges)) then new_badges := array_append(new_badges, 'hero'); end if;
  -- quests: progress + automatic reward when complete
  for q in select * from public.quests where active loop
    pk := case when q.period='daily' then to_char(current_date,'YYYY-MM-DD') else to_char(date_trunc('week',current_date),'YYYY-MM-DD') end;
    if (q.kind='play') or (q.kind='finish' and p_finished) or (q.kind='coins') or (q.kind='world_'||p_world and p_finished) or (q.kind='online' and p_mode='online') then
      insert into public.quest_progress(user_id, quest_id, period_key, progress) values (me.id, q.id, pk, case when q.kind='coins' then p_coins else 1 end)
      on conflict (user_id, quest_id, period_key) do update set progress = least(q.target, public.quest_progress.progress + excluded.progress);
      select * into qp from public.quest_progress where user_id = me.id and quest_id = q.id and period_key = pk;
      if qp.progress >= q.target and not qp.claimed then
        update public.quest_progress set claimed = true where user_id = me.id and quest_id = q.id and period_key = pk;
        gain := gain + q.reward_coins; xp_gain := xp_gain + q.reward_coins;
        done_q := done_q || json_build_object('id', q.id, 'icon', q.icon, 'coins', q.reward_coins, 'xp', q.reward_xp);
      end if;
    end if;
  end loop;
  update public.profiles set coins = coins + gain, xp = xp + xp_gain, worlds_done = me.worlds_done, badges = array_cat(badges, new_badges), last_seen = now() where id = me.id;
  new_level := public.level_for_xp(me.xp + xp_gain);
  return json_build_object('coins', gain, 'xp', xp_gain, 'badges', new_badges, 'quests', to_json(done_q), 'level', new_level, 'level_up', new_level > old_level);
end $$;


update public.profiles set xp = greatest(0, coins);
