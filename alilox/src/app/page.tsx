import Link from 'next/link';
import { currentProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export default async function Landing() {
  const { user } = await currentProfile(); if (user) redirect('/play');
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-center">
      <div className="text-7xl mb-2">🧱</div>
      <h1 className="text-5xl font-bold"><span className="text-sun">Ali</span><span className="text-mint">lox</span></h1>
      <p className="mt-3 text-lg text-white/80">عالمك المكعّب ثلاثي الأبعاد — آمن، ممتع، ومصنوع للأطفال.<br /><span className="text-white/60">Your own 3D block world — safe, fun and made for kids.</span></p>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/signup" className="btn-sun text-lg">🚀 إنشاء حساب · Sign up</Link><Link href="/login" className="btn-ghost text-lg">تسجيل الدخول · Log in</Link></div>
      <div className="mt-12 grid gap-4 sm:grid-cols-3 text-start">
        {[['🧍','شخصيتك أنت','ارفع صورتك، غيّر شعرك وملابسك وقبعاتك، واختر حيوانك الأليف.'],['🌍','عوالم ومدينة','أوبي، برج السماء، حديقة العملات، الأرضية المتساقطة، وبيت خاص بك.'],['🤝','مع الأصدقاء','غرف حتى 6 لاعبين، شات صوتي، وأصدقاء بموافقة وليّ الأمر.'],['⭐','مهام ومواسم','مهام يومية وأسبوعية، مستويات، شارات، وأحداث موسمية.'],['🧱','ابنِ عالمك','محرر عوالم بسيط: ابنِ مسارك وشاركه برمز.'],['👨‍👩‍👧','للوالدين','وقت لعب يومي، ساعات مسموحة، اعتماد الصور والأصدقاء، وتقارير.']].map(([i,h,d]) => <div key={h} className="card"><div className="text-3xl">{i}</div><h3 className="text-lg mt-1">{h}</h3><p className="muted text-sm">{d}</p></div>)}
      </div>
      <p className="mt-10 text-xs text-white/40">Made with ❤️ for Aleen & Mansour · Alilox</p>
    </main>
  );
}
