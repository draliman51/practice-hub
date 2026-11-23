'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import GameCanvas from '@/components/GameCanvas';
import { toast } from '@/components/Toast';
import { useT } from '@/lib/i18n';
import { play } from '@/game/sfx';
import { WORLD_TEMPLATES } from '@/game/templates';
import type { Profile } from '@/lib/types';
const PAL = [0x3B82F6, 0xA78BFA, 0x2EE6D6, 0xFF5DA2, 0xFF8A3D, 0x4ADE80, 0xFFD23F, 0xF1F5F9];
type Block = { x: number; y: number; z: number; c: number; kind?: string };
export default function EditorClient({ profile, photoUrl, world, mine }: { profile: Profile; photoUrl: string | null; world: any; mine: any[] }) {
  const { t, lang } = useT(); const r = useRouter();
  const [name, setName] = useState(world?.name || (lang === 'ar' ? 'عالمي' : 'My world')); const [data, setData] = useState<{ blocks: Block[]; coins: { x: number; y: number; z: number }[]; start: { x: number; y: number; z: number } }>(world?.data?.blocks ? world.data : { blocks: [{ x: 0, y: 0, z: 0, c: PAL[5] }], coins: [], start: { x: 0, y: 0, z: 0 } });
  const [layer, setLayer] = useState(0); const [tool, setTool] = useState<'block' | 'coin' | 'start' | 'finish' | 'check' | 'erase'>('block'); const [color, setColor] = useState(PAL[0]); const [test, setTest] = useState(false); const [id, setId] = useState<string | null>(world?.id || null); const [busy, setBusy] = useState(false);
  const N = 24; // 24x24 grid, layers 0..7
  const at = (x: number, z: number) => data.blocks.find((b) => b.x === x && b.z === z && b.y === layer); const coinAt = (x: number, z: number) => data.coins.find((c) => c.x === x && c.z === z && c.y === layer);
  const tap = (x: number, z: number) => { play('tap'); setData((d) => { const blocks = d.blocks.filter((b) => !(b.x === x && b.z === z && b.y === layer)); const coins = d.coins.filter((c) => !(c.x === x && c.z === z && c.y === layer)); let start = d.start;
    if (tool === 'erase') return { blocks, coins, start }; if (tool === 'coin') return { blocks: d.blocks, coins: coins.length === d.coins.length && d.coins.length < 60 ? [...coins, { x, y: layer, z }] : coins, start }; if (tool === 'start') { start = { x, y: layer, z }; return { blocks: d.blocks, coins: d.coins, start }; }
    if (blocks.length >= 400) { toast('Max 400 blocks'); return d; } return { blocks: [...blocks, { x, y: layer, z, c: color, kind: tool === 'block' ? undefined : tool }], coins, start }; }); };
  const save = async (publish?: boolean) => { setBusy(true); const payload: any = { name: name.slice(0, 30), data, owner: profile.id, updated_at: new Date().toISOString() }; if (publish != null) { payload.published = publish; payload.approved = false; }
    let res; if (id) res = await supabase().from('worlds').update(payload).eq('id', id).select().single(); else res = await supabase().from('worlds').insert(payload).select().single(); setBusy(false);
    if (res.error) return toast('😕 ' + res.error.message); setId(res.data.id); if (publish) { await supabase().from('tickets').insert({ user_id: profile.id, kind: 'world_review', subject: `World review: ${name}`, target_world: res.data.id }); } toast(publish ? (lang === 'ar' ? 'أُرسل للمراجعة ✅ رمز عالمك: ' + res.data.code : 'Sent for review ✅ Code: ' + res.data.code) : t('saved')); r.refresh(); };
  if (test) return <div><button className="btn-ghost btn-sm mb-2" onClick={() => setTest(false)}>← {t('editor')}</button><GameCanvas world="custom" mode="solo" me={profile} myPhotoUrl={photoUrl} data={data} preview onExit={() => setTest(false)} /></div>;
  const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
  return <div><div className="flex flex-wrap items-center gap-2"><h1 className="grow text-3xl">🧱 {t('editor')}</h1><input className="input w-44" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} /><button className="btn-ghost btn-sm" onClick={() => setTest(true)}>▶ {lang === 'ar' ? 'جرّب' : 'Test'}</button><button className="btn-mint btn-sm" disabled={busy} onClick={() => save()}>{t('save')}</button><button className="btn-sun btn-sm" disabled={busy} onClick={() => save(true)}>🚀 {lang === 'ar' ? 'نشر' : 'Publish'}</button></div>
    <p className="muted text-sm mt-1">{lang === 'ar' ? 'انقر لوضع مكعب في الطبقة الحالية. ابنِ مسارًا من البداية 🟢 إلى النهاية 🟡 وأضف عملات. بعد النشر يراجعه فريق Alilox ثم يظهر للجميع.' : 'Tap to place a block on the current layer. Build a path from Start 🟢 to Finish 🟡 and add coins. After publishing, the Alilox team reviews it before everyone can play it.'}</p>
    <div className="card mt-3 p-3"><b className="text-sm">💡 {lang === 'ar' ? 'ابدأ من قالب (قابل للتعديل)' : 'Start from a template (editable)'}</b><div className="mt-2 flex flex-wrap gap-2">{WORLD_TEMPLATES.map((tp) => <button key={tp.id} className="chip" title={lang === 'ar' ? tp.d_ar : tp.d_en} onClick={() => { if (data.blocks.length > 1 && !confirm(lang === 'ar' ? 'سيستبدل القالب ما بنيته. متابعة؟' : 'This replaces your current build. Continue?')) return; setData(tp.build() as any); setLayer(0); play('ok'); toast((lang === 'ar' ? tp.ar : tp.en) + ' ✅'); }}>{tp.ic} {lang === 'ar' ? tp.ar : tp.en}</button>)}</div>
      <p className="muted mt-2 text-xs">{lang === 'ar' ? 'أفكار: اجعل الفجوات صغيرة في البداية، ضع نقطة تفتيش 🚩 بعد كل جزء صعب، وأضف عملات 🪙 لتوجيه اللاعب. جرّب عالمك بزر "جرّب" قبل النشر.' : 'Tips: keep gaps small at first, place a checkpoint 🚩 after each hard part, and use coins 🪙 to guide players. Test with ▶ before publishing.'}</p></div>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {(['block', 'coin', 'check', 'finish', 'start', 'erase'] as const).map((k) => <button key={k} className={`chip ${tool === k ? 'on' : ''}`} onClick={() => setTool(k)}>{{ block: '🧱', coin: '🪙', check: '🚩', finish: '🌀', start: '🟢', erase: '🧹' }[k]} {{ block: lang === 'ar' ? 'مكعب' : 'Block', coin: lang === 'ar' ? 'عملة' : 'Coin', check: lang === 'ar' ? 'نقطة تفتيش' : 'Checkpoint', finish: lang === 'ar' ? 'نهاية' : 'Finish', start: lang === 'ar' ? 'بداية' : 'Start', erase: lang === 'ar' ? 'مسح' : 'Erase' }[k]}</button>)}
      <span className="muted text-xs ms-2">{lang === 'ar' ? 'اللون' : 'Colour'}</span>{PAL.map((c) => <span key={c} className={`sw !h-7 !w-7 ${color === c ? 'on' : ''}`} style={{ background: hex(c) }} onClick={() => setColor(c)} />)}
      <span className="muted text-xs ms-2">{lang === 'ar' ? 'الطبقة' : 'Layer'}</span>{[0, 1, 2, 3, 4, 5, 6, 7].map((l) => <button key={l} className={`chip !px-2 ${layer === l ? 'on' : ''}`} onClick={() => setLayer(l)}>{l}</button>)}
    </div>
    <div className="card mt-3 overflow-auto p-2"><div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${N}, 22px)`, width: N * 24 }}>
      {Array.from({ length: N * N }, (_, k) => { const x = k % N - N / 2, z = Math.floor(k / N) - N / 2; const b = at(x, z); const c = coinAt(x, z); const below = !b && data.blocks.find((q) => q.x === x && q.z === z && q.y === layer - 1); const isStart = data.start.x === x && data.start.z === z && data.start.y === layer;
        return <button key={k} onClick={() => tap(x, z)} className="h-[22px] w-[22px] rounded-[4px] text-[12px] leading-none" style={{ background: b ? hex(b.c) : below ? hex(below.c) + '55' : 'rgba(255,255,255,.06)' }}>{isStart ? '🟢' : b?.kind === 'finish' ? '🌀' : b?.kind === 'check' ? '🚩' : c ? '🪙' : ''}</button>; })}
    </div></div>
    <div className="mt-2 text-xs muted">🧱 {data.blocks.length}/400 · 🪙 {data.coins.length}/60</div>
    {mine.length > 0 && <div className="card mt-4"><b>{lang === 'ar' ? 'عوالمي' : 'My worlds'}</b><div className="mt-2 grid gap-1">{mine.map((w) => <div key={w.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"><b className="grow">{w.name}</b><span className="muted text-xs">{w.code} · {w.published ? (w.approved ? '✅' : '⏳') : '📝'} · ▶ {w.plays}</span><Link className="btn-ghost btn-sm" href={`/editor?id=${w.id}`}>✏️</Link><Link className="btn-ghost btn-sm" href={`/worlds/${w.id}`}>▶</Link></div>)}</div></div>}
  </div>;
}
