'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { rpc } from '@/components/AppShell';
import { toast, confetti } from '@/components/Toast';
import { useT, nameOf } from '@/lib/i18n';
import { play } from '@/game/sfx';
import type { Profile, Item } from '@/lib/types';
const KINDS: [string, string, string][] = [['hat', '🧢', 'hats'], ['back', '🦸', 'backItems'], ['pet', '🐾', 'pets'], ['furniture', '🛋️', 'house'], ['wall', '🟦', 'house'], ['floor', '🟫', 'house']];
export default function ShopClient({ profile, items }: { profile: Profile; items: Item[] }) {
  const { t, lang } = useT(); const r = useRouter(); const [owned, setOwned] = useState(profile.owned); const [coins, setCoins] = useState(profile.coins); const [av, setAv] = useState(profile.avatar);
  const buy = async (i: Item) => { if (coins < i.price) { play('bad'); return toast(`${t('notEnough')} (${i.price - coins} 🪙)`); } const d = await rpc<any>('buy_item', { p_item: i.id }); if (!d) return; setOwned([...owned, i.id]); setCoins(d.coins); confetti(); play('win'); toast(`${i.icon} ${nameOf(lang, i)}!`); r.refresh(); };
  const wear = async (i: Item) => { if (!['hat', 'back', 'pet'].includes(i.kind)) return; const na = { ...av, [i.kind]: av[i.kind as 'hat'] === i.id ? 'none' : i.id }; setAv(na); await supabase().from('profiles').update({ avatar: na }).eq('id', profile.id); play('tap'); r.refresh(); };
  const rar: Record<string, string> = { common: 'border-white/10', rare: 'border-sky', epic: 'border-grape' };
  return <div><div className="flex items-center"><h1 className="grow text-3xl">🛍️ {t('shop')}</h1><span className="pill-sun text-lg">🪙 {coins}</span></div>
    <p className="muted text-sm">{lang === 'ar' ? 'اجمع العملات من العوالم والمهام والهدية اليومية.' : 'Earn Alicoins in the worlds, quests and the daily gift.'}</p>
    {KINDS.map(([k, ic, lk]) => { const list = items.filter((i) => i.kind === k); if (!list.length) return null; return <section key={k} className="mt-5"><h2 className="text-xl mb-2">{ic} {(t as any)(lk)}{k === 'wall' ? ' · ' + (lang === 'ar' ? 'جدران' : 'walls') : k === 'floor' ? ' · ' + (lang === 'ar' ? 'أرضيات' : 'floors') : ''}</h2>
      <div className="grid-auto">{list.map((i) => { const own = owned.includes(i.id); const eq = (av as any)[i.kind] === i.id; return <div key={i.id} className={`card flex flex-col items-center gap-1 border-2 p-3 text-center ${rar[i.rarity] || ''} ${eq ? '!border-sun' : ''}`}><div className="text-4xl">{i.icon}</div><b className="text-sm">{nameOf(lang, i)}</b>{i.rarity !== 'common' && <span className="text-[10px] uppercase text-white/50">{i.rarity}</span>}
        {own ? (['hat', 'back', 'pet'].includes(i.kind) ? <button className={`btn-sm w-full ${eq ? 'btn-ghost' : 'btn-mint'}`} onClick={() => wear(i)}>{eq ? '✓ ' + t('wearing') : t('wear')}</button> : <span className="pill">✓ {t('owned')}</span>) : <button className={`btn-sm w-full ${coins >= i.price ? 'btn-candy' : 'btn-ghost'}`} onClick={() => buy(i)}>🪙 {i.price}</button>}</div>; })}</div></section>; })}
  </div>;
}
