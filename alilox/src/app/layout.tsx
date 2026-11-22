import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { LangProvider, type Lang } from '@/lib/i18n';
import Toaster from '@/components/Toast';

export const metadata: Metadata = { title: 'Alilox — your 3D block world', description: 'A safe, fun 3D block world for kids: avatars, pets, worlds, friends and quests.', manifest: '/manifest.webmanifest', appleWebApp: { capable: true, title: 'Alilox', statusBarStyle: 'black-translucent' }, icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' } };
export const viewport: Viewport = { themeColor: '#1b1140', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = (cookies().get('alilox_lang')?.value as Lang) || 'ar';
  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;700;800&family=Cairo:wght@400;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LangProvider initial={lang}>{children}<Toaster /></LangProvider>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}` }} />
      </body>
    </html>
  );
}
