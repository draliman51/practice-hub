'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/components/Toast';
import { useT, nameOf } from '@/lib/i18n';
import { play } from '@/game/sfx';
import type { Profile, Item } from '@/lib/types';
const WALLS = ['#FDE68A', '#BFDBFE', '#FBCFE8', '#D9F99D', '#E9D5FF']; const FLOORS = ['#D6D3D1', '#B45309', '#86EFAC', '#93C5FD', '#FCA5A5'];
const WALL_ITEM: Record<string, number> = { wall_blue: 1, wall_pink: 2 }; const FLOOR_ITEM: Record<string, number> = { floor_wood: 1, floor_grass: 2 };
export default function HouseClient({ profile, items, visit }: { profile: Profile; items: Item[]; visit: any }) {
  const { t, lang } = useT(); const r = useRouter(); const ro = !!visit && visit.id !== profile.id; const [h, setH] = useState<Profile['house']>(ro ? visit.house : profile.house); const [tool, setTool] = useState<string>('sofa'); const [busy, setBusy] = useState(false);
  const furn = items.filter((i) => i.kind === 'furniture' && profile.owned.includes(i.id)); const ic = (id: string) => items.find((i) => i.id === id)?.icon || '❓';
  const tap = (x: number, y: number) => { if (ro) return; play('tap'); setH((hh) => { const at = hh.items.findIndex((i) => i.x === x && i.y === y); if (at >= 0 || tool === 'erase') return { ...hh, items: hh.items.filter((i) => !(i.x === x && i.y === y)) }; if (hh.items.length >= 40) return hh; return { ...hh, items: [...hh.items, { id: tool, x, y }] }; }); };
  const save = async () => { setBusy(true); const { error } = await supabase().from('profiles').update({ house: h }).eq('id', profile.id); setBusy(false); if (error) return toast('😕 ' + error.message); toast(t('saved')); r.refresh(); };
  return <div><div className="flex items-center gap-2"><h1 className="grow text-3xl">🏠 {ro ? visit.display_name : t('house')}</h1>{!ro && <button className="btn-mint btn-sm" disabled={busy} onClick={save}>{t('save')}</button>}</div>
    <div className="card mt-3 p-2"><div className="rounded-2xl p-3" style={{ background: WALLS[h.wall] || WALLS[0] }}><div className="grid grid-cols-8 gap-1 rounded-xl p-1" style={{ background: FLOORS[h.floor] || FLOORS[0] }}>
      {Array.from({ length: 48 }, (_, k) => { const x = k % 8, y = Math.floor(k / 8); const it = h.items.find((i) => i.x === x && i.y === y); return <button key={k} onClick={() => tap(x, y)} className="aspect-square rounded-md bg-black/5 text-2xl leading-none hover:bg-black/10">{it ? ic(it.id) : ''}</button>; })}
    </div></div></div>
    {!ro && <>
      <h2 className="mt-4 mb-2 text-lg">🛋️ {lang === 'ar' ? 'الأثاث' : 'Furniture'}</h2><div className="flex flex-wrap gap-2">{furn.map((i) => <button key={i.id} className={`chip ${tool === i.id ? 'on' : ''}`} onClick={() => setTool(i.id)}>{i.icon} {nameOf(lang, i)}</button>)}<button className={`chip ${tool === 'erase' ? 'on' : ''}`} onClick={() => setTool('erase')}>🧹 {lang === 'ar' ? 'مسح' : 'Erase'}</button></div>
      {furn.length === 0 && <p className="muted mt-2 text-sm">{lang === 'ar' ? 'اشترِ أثاثًا من المتجر 🛍️' : 'Buy furniture in the Shop 🛍️'}</p>}
      <h2 className="mt-4 mb-2 text-lg">🎨 {lang === 'ar' ? 'الجدران والأرضية' : 'Walls & floor'}</h2>
      <div className="flex flex-wrap gap-2">{WALLS.map((c, i) => { const locked = i > 0 && !profile.owned.includes(Object.keys(WALL_ITEM).find((k) => WALL_ITEM[k] === i) || '') && i < 3; return <span key={c} className={`sw ${h.wall === i ? 'on' : ''} ${locked ? 'opacity-40' : ''}`} style={{ background: c }} onClick={() => !locked && setH({ ...h, wall: i })} />; })}<span className="muted text-xs self-center">{lang === 'ar' ? 'جدران' : 'walls'}</span></div>
      <div className="mt-2 flex flex-wrap gap-2">{FLOORS.map((c, i) => { const locked = i > 0 && !profile.owned.includes(Object.keys(FLOOR_ITEM).find((k) => FLOOR_ITEM[k] === i) || '') && i < 3; return <span key={c} className={`sw ${h.floor === i ? 'on' : ''} ${locked ? 'opacity-40' : ''}`} style={{ background: c }} onClick={() => !locked && setH({ ...h, floor: i })} />; })}<span className="muted text-xs self-center">{lang === 'ar' ? 'أرضية' : 'floor'}</span></div>
      <p className="muted mt-3 text-xs">{lang === 'ar' ? 'أصدقاؤك يمكنهم زيارة بيتك من صفحة الأصدقاء.' : 'Friends can visit your house from the Friends page.'}</p></>}
  </div>;
}
