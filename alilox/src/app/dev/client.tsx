'use client';
import GameCanvas from '@/components/GameCanvas';
import AvatarPreview from '@/components/AvatarPreview';
const me: any = { id: 'dev', display_name: 'Tester', avatar: { skin: 1, shirt: 1, pants: 7, hair: 'pony', hairc: 2, face: '😎', hat: 'crown', back: 'wings', pet: 'dragon' }, photo_path: null };
export default function DevClient({ world, mode }: { world: string; mode: 'solo' | 'cpu' | 'online' }) {
  return <main className="mx-auto max-w-4xl p-4"><div className="mb-3 flex gap-3"><AvatarPreview p={{ name: 'Tester', avatar: me.avatar }} /><div><h1 className="text-2xl">Dev playground</h1><p className="muted text-sm">world={world} mode={mode}</p></div></div><GameCanvas world={world} mode={mode} me={me} others={mode === 'online' ? [{ id: 'bot1', name: 'Friend', avatar: { skin: 2, shirt: 4, pants: 2, hair: 'short', hairc: 0, face: '🥳', hat: 'party', back: 'none', pet: 'duck' } }] : []} /></main>;
}
