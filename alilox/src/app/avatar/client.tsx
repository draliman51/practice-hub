'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AvatarPreview from '@/components/AvatarPreview';
import { supabase } from '@/lib/supabase/client';
import { useT, nameOf } from '@/lib/i18n';
import { toast } from '@/components/Toast';
import { SKIN, COLORS, HAIRC, HAIR, FACES, hex } from '@/game/catalog';
import { play } from '@/game/sfx';
import type { Profile, Item, Avatar } from '@/lib/types';
export default function AvatarClient({ profile, photoUrl: p0, items }: { profile: Profile; photoUrl: string | null; items: Item[] }) {
  const { t, lang } = useT(); const r = useRouter(); const [av, setAv] = useState<Avatar>(profile.avatar); const [tab, setTab] = useState<'hair' | 'face' | 'clothes' | 'hat' | 'back' | 'pet'>('hair'); const [photoUrl, setPhotoUrl] = useState(p0); const [busy, setBusy] = useState(false);
  const set = (k: keyof Avatar, v: any) => { setAv((a) => ({ ...a, [k]: v })); play('tap'); };
  const save = async () => { setBusy(true); const { error } = await supabase().from('profiles').update({ avatar: av }).eq('id', profile.id); setBusy(false); if (error) return toast('😕 ' + error.message); toast(t('saved')); r.refresh(); };
  const upload = async (f: File) => { if (!f) return; setBusy(true);
    // downscale to a 256px square centred crop before upload (fast, private, small)
    const img = await createImageBitmap(f); const s = Math.min(img.width, img.height); const c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256);
    const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), 'image/jpeg', .86)); const path = `${profile.id}/face.jpg`;
    const { error } = await supabase().storage.from('photos').upload(path, blob, { upsert: true, contentType: 'image/jpeg' }); if (error) { setBusy(false); return toast('😕 ' + error.message); }
    await supabase().from('profiles').update({ photo_path: path, avatar: { ...av, face: 'photo' } }).eq('id', profile.id);
    if (profile.role === 'child') await supabase().from('tickets').insert({ user_id: profile.id, kind: 'photo_review', subject: `Photo review: ${profile.username}` });
    const { data } = await supabase().storage.from('photos').createSignedUrl(path, 3600); setPhotoUrl(data?.signedUrl || null); setAv((a) => ({ ...a, face: 'photo' })); setBusy(false); toast(lang === 'ar' ? 'رُفعت الصورة ✅ بانتظار اعتماد وليّ الأمر' : 'Photo uploaded ✅ waiting for parent approval'); r.refresh(); };
  const owned = (k: string) => items.filter((i) => i.kind === k && profile.owned.includes(i.id));
  const Sw = ({ arr, k }: { arr: number[]; k: keyof Avatar }) => <div className="flex flex-wrap gap-2">{arr.map((c, i) => <span key={i} className={`sw ${av[k] === i ? 'on' : ''}`} style={{ background: hex(c) }} onClick={() => set(k, i)} />)}</div>;
  const Chips = ({ list, k, none }: { list: { id: string; label: string; ic: string }[]; k: keyof Avatar; none?: boolean }) => <div className="flex flex-wrap gap-2">{(none ? [{ id: 'none', label: lang === 'ar' ? 'بدون' : 'None', ic: '🚫' }] : []).concat(list).map((i) => <button key={i.id} className={`chip ${av[k] === i.id ? 'on' : ''}`} onClick={() => set(k, i.id)}>{i.ic} {i.label}</button>)}</div>;
  const L = (s: string) => <div className="mt-3 mb-1 text-xs font-bold uppercase tracking-wide text-white/60">{s}</div>;
  return <div>
    <div className="flex items-center gap-2"><h1 className="grow text-3xl">🧍 {t('avatar')}</h1><button className="btn-mint btn-sm" disabled={busy} onClick={save}>{t('save')}</button></div>
    <AvatarPreview p={{ name: profile.display_name, avatar: av, photoUrl }} className="mt-3 h-[270px] w-full" />
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{([['hair', '💇 ' + t('hair')], ['face', '🙂 ' + t('face')], ['clothes', '👕 ' + t('clothes')], ['hat', '🧢 ' + t('hats')], ['back', '🦸 ' + t('backItems')], ['pet', '🐾 ' + t('pets')]] as const).map(([k, l]) => <button key={k} className={`chip ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>
    <div className="card mt-2">
      {tab === 'hair' && <>{L(t('hair'))}<Chips list={HAIR.map((h) => ({ id: h.id, label: lang === 'ar' ? h.ar : h.en, ic: h.ic }))} k="hair" />{L(lang === 'ar' ? 'لون الشعر' : 'Hair colour')}<Sw arr={HAIRC} k="hairc" /></>}
      {tab === 'face' && <>{L(t('face'))}<div className="flex flex-wrap gap-2">{photoUrl && <button className={`chip ${av.face === 'photo' ? 'on' : ''}`} onClick={() => set('face', 'photo')}>📷 {t('photo')}</button>}{FACES.map((f) => <button key={f} className={`chip ${av.face === f ? 'on' : ''}`} onClick={() => set('face', f)}>{f}</button>)}</div>
        {L(t('skin'))}<Sw arr={SKIN} k="skin" />
        {L(t('uploadPhoto'))}<label className="btn-ghost btn-sm cursor-pointer">📷 {t('uploadPhoto')}<input type="file" accept="image/*" capture="user" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label><p className="muted mt-1 text-xs">{t('photoHint')}{profile.photo_path && !profile.photo_approved ? (lang === 'ar' ? ' · الصورة بانتظار الاعتماد (تراها أنت فقط الآن).' : ' · Photo pending approval (only you see it for now).') : ''}</p></>}
      {tab === 'clothes' && <>{L(t('shirt'))}<Sw arr={COLORS} k="shirt" />{L(t('pants'))}<Sw arr={COLORS} k="pants" /></>}
      {tab === 'hat' && <>{L(t('hats'))}<Chips none list={owned('hat').map((i) => ({ id: i.id, label: nameOf(lang, i), ic: i.icon }))} k="hat" /><p className="muted mt-2 text-xs">{lang === 'ar' ? 'المزيد في المتجر 🛍️' : 'More in the Shop 🛍️'}</p></>}
      {tab === 'back' && <>{L(t('backItems'))}<Chips none list={owned('back').map((i) => ({ id: i.id, label: nameOf(lang, i), ic: i.icon }))} k="back" /></>}
      {tab === 'pet' && <>{L(t('pets'))}<Chips none list={owned('pet').map((i) => ({ id: i.id, label: nameOf(lang, i), ic: i.icon }))} k="pet" /></>}
    </div>
  </div>;
}
