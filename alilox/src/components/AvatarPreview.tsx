'use client';
import { useEffect, useRef } from 'react';
export default function AvatarPreview({ p, className }: { p: { name: string; avatar: any; photoUrl?: string | null }; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null); const vRef = useRef<any>(null);
  useEffect(() => { let dead = false; (async () => { const eng = await import('@/game/engine'); if (dead || !ref.current) return; vRef.current = eng.preview(ref.current, p); })(); return () => { dead = true; vRef.current?.stop(); vRef.current = null; }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { vRef.current?.rebuild(p); }, [p]);
  return <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky to-blue-100 touch-none ${className || 'h-[150px] w-[120px]'}`}><canvas ref={ref} className="h-full w-full block" /></div>;
}
