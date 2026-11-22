'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'ar' | 'en';
const D = {
  en: {
    appName: 'Alilox', tagline: 'Your own 3D block world — made for kids, by Baba.',
    login: 'Log in', signup: 'Create account', logout: 'Log out', username: 'Username', password: 'Password', email: 'Email', displayName: 'Display name',
    iAmChild: "I'm a kid 🧒", iAmParent: "I'm a parent 👨‍👩‍👧", parentEmail: "Parent's email", under13: 'I am under 13', continue: 'Continue', back: 'Back', save: 'Save', saved: 'Saved! ✅', cancel: 'Cancel',
    pendingTitle: 'Almost there! 🕒', pendingText: 'Your account is waiting for your parent to approve it. Ask them to log in and add you from the Parent dashboard using your username:',
    home: 'City', avatar: 'Avatar', shop: 'Shop', quests: 'Quests', friends: 'Friends', house: 'My house', rooms: 'Play together', editor: 'Build', worlds: 'Worlds', settings: 'Settings', parent: 'Parent', admin: 'Admin',
    coins: 'Alicoins', level: 'Level', xp: 'XP', streak: 'day streak', dailyGift: 'Daily gift', claim: 'Claim', claimed: 'Claimed — come back tomorrow!',
    playNow: 'Play', worldsTitle: 'Worlds', justMe: 'Just me', vsRobot: 'Me vs Robot', online: 'Online with friends',
    obby: 'Obby Run', tower: 'Sky Tower', park: 'Coin Park', arena: 'Falling Floor', race: 'Pet Race', city: 'Alilox City',
    obbyD: 'Jump across platforms, dodge the lava and reach the golden portal.', towerD: 'Climb the spiral tower into the clouds. Don’t look down!', parkD: 'Grab all 30 coins before the time runs out!', arenaD: 'The floor is falling! Be the last one standing.', raceD: 'Tap fast to make your pet win the race!', cityD: 'Walk around, visit houses and jump into any world.',
    hair: 'Hair', face: 'Face', clothes: 'Clothes', hats: 'Hats', backItems: 'Back', pets: 'Pets', skin: 'Skin tone', shirt: 'Shirt', pants: 'Pants', photo: 'My photo', uploadPhoto: 'Upload photo', photoHint: 'Your photo is shown only to approved friends and family. A parent must approve it first.',
    buy: 'Buy', wear: 'Wear', wearing: 'Wearing', owned: 'Owned', notEnough: 'Not enough Alicoins',
    friendCode: 'My friend code', addFriend: 'Add a friend by code', requests: 'Requests', accept: 'Accept', decline: 'Decline', waitingParent: 'Waiting for parent approval', noFriends: 'No friends yet — share your code!',
    createRoom: 'Create room', joinRoom: 'Join room', roomCode: 'Room code', start: 'Start', leave: 'Leave', players: 'Players', voice: 'Voice', mute: 'Mute', unmute: 'Unmute', waitingHost: 'Waiting for the host…',
    daily: 'Daily', weekly: 'Weekly', reward: 'Reward', done: 'Done',
    language: 'Language', sound: 'Sound', shadows: 'Shadows', sensitivity: 'Camera sensitivity', invert: 'Invert camera', account: 'Account', deleteHint: 'To delete the account, ask a parent or contact support.',
    support: 'Support', sendTicket: 'Send to support', subject: 'Subject', message: 'Message', report: 'Report', sent: 'Sent! Our team will look at it.',
    timeUp: 'Play time is over for today ⏰', outsideHours: 'Alilox is closed right now — see you at {h}:00!', frozen: 'This account is paused by a parent.',
    parentDash: 'Parent dashboard', myKids: 'My kids', claimChild: 'Link a child (username)', createChild: 'Create a child account', limit: 'Daily limit (min)', hours: 'Allowed hours', photoOk: 'Approve photo', pause: 'Pause', resume: 'Resume', weeklyReport: 'This week', friendApprovals: 'Friend approvals', approve: 'Approve',
    cityWelcome: 'Welcome to Alilox City! Walk into a portal to play.',
  },
  ar: {
    appName: 'Alilox', tagline: 'عالمك المكعّب ثلاثي الأبعاد — صُنع للأطفال، من بابا.',
    login: 'تسجيل الدخول', signup: 'إنشاء حساب', logout: 'خروج', username: 'اسم المستخدم', password: 'كلمة المرور', email: 'البريد الإلكتروني', displayName: 'الاسم الظاهر',
    iAmChild: 'أنا طفل 🧒', iAmParent: 'أنا وليّ أمر 👨‍👩‍👧', parentEmail: 'بريد وليّ الأمر', under13: 'عمري أقل من 13', continue: 'متابعة', back: 'رجوع', save: 'حفظ', saved: 'تم الحفظ ✅', cancel: 'إلغاء',
    pendingTitle: 'اقتربنا! 🕒', pendingText: 'حسابك بانتظار موافقة وليّ الأمر. اطلب منه الدخول وإضافتك من لوحة وليّ الأمر باستخدام اسم المستخدم:',
    home: 'المدينة', avatar: 'شخصيتي', shop: 'المتجر', quests: 'المهام', friends: 'الأصدقاء', house: 'بيتي', rooms: 'العب مع أصدقائك', editor: 'ابنِ عالمك', worlds: 'العوالم', settings: 'الإعدادات', parent: 'وليّ الأمر', admin: 'الإدارة',
    coins: 'عملة', level: 'المستوى', xp: 'خبرة', streak: 'أيام متتالية', dailyGift: 'هدية اليوم', claim: 'استلام', claimed: 'استلمتها — عد غدًا!',
    playNow: 'العب', worldsTitle: 'العوالم', justMe: 'لوحدي', vsRobot: 'ضد الروبوت', online: 'أونلاين مع الأصدقاء',
    obby: 'سباق الأوبي', tower: 'برج السماء', park: 'حديقة العملات', arena: 'الأرضية المتساقطة', race: 'سباق الحيوانات', city: 'مدينة Alilox',
    obbyD: 'اقفز بين المنصات وتفادَ الحمم وصولًا إلى البوابة الذهبية.', towerD: 'تسلّق البرج الحلزوني إلى السحاب. لا تنظر للأسفل!', parkD: 'اجمع 30 عملة قبل انتهاء الوقت!', arenaD: 'الأرضية تتساقط! كن آخر الصامدين.', raceD: 'انقر بسرعة ليفوز حيوانك الأليف بالسباق!', cityD: 'تجوّل، زر البيوت، وادخل أي عالم.',
    hair: 'الشعر', face: 'الوجه', clothes: 'الملابس', hats: 'القبعات', backItems: 'الظهر', pets: 'الحيوانات', skin: 'لون البشرة', shirt: 'القميص', pants: 'البنطال', photo: 'صورتي', uploadPhoto: 'رفع صورة', photoHint: 'صورتك تظهر فقط لأصدقائك المعتمدين وعائلتك، وبعد موافقة وليّ الأمر.',
    buy: 'شراء', wear: 'ارتداء', wearing: 'ترتديه', owned: 'تملكه', notEnough: 'لا تكفي العملات',
    friendCode: 'رمز صداقتي', addFriend: 'أضف صديقًا بالرمز', requests: 'الطلبات', accept: 'قبول', decline: 'رفض', waitingParent: 'بانتظار موافقة وليّ الأمر', noFriends: 'لا أصدقاء بعد — شارك رمزك!',
    createRoom: 'إنشاء غرفة', joinRoom: 'الانضمام لغرفة', roomCode: 'رمز الغرفة', start: 'ابدأ', leave: 'مغادرة', players: 'اللاعبون', voice: 'الصوت', mute: 'كتم', unmute: 'إلغاء الكتم', waitingHost: 'بانتظار المضيف…',
    daily: 'يومية', weekly: 'أسبوعية', reward: 'المكافأة', done: 'مكتملة',
    language: 'اللغة', sound: 'الصوت', shadows: 'الظلال', sensitivity: 'حساسية الكاميرا', invert: 'عكس الكاميرا', account: 'الحساب', deleteHint: 'لحذف الحساب اطلب من وليّ الأمر أو تواصل مع الدعم.',
    support: 'الدعم', sendTicket: 'إرسال للدعم', subject: 'الموضوع', message: 'الرسالة', report: 'إبلاغ', sent: 'أُرسلت! سيطّلع عليها فريقنا.',
    timeUp: 'انتهى وقت اللعب لليوم ⏰', outsideHours: 'Alilox مغلقة الآن — نراك الساعة {h}:00!', frozen: 'هذا الحساب موقوف مؤقتًا من وليّ الأمر.',
    parentDash: 'لوحة وليّ الأمر', myKids: 'أطفالي', claimChild: 'ربط طفل (اسم المستخدم)', createChild: 'إنشاء حساب طفل', limit: 'الحد اليومي (دقيقة)', hours: 'ساعات اللعب', photoOk: 'اعتماد الصورة', pause: 'إيقاف', resume: 'تفعيل', weeklyReport: 'هذا الأسبوع', friendApprovals: 'طلبات الصداقة', approve: 'اعتماد',
    cityWelcome: 'أهلًا بك في مدينة Alilox! ادخل أي بوابة لتلعب.',
  },
} as const;
export type Key = keyof typeof D.en;
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key, vars?: Record<string, string | number>) => string }>({ lang: 'ar', setLang: () => {}, t: (k) => String(k) });
export function LangProvider({ children, initial }: { children: React.ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial || 'ar');
  useEffect(() => { try { const s = localStorage.getItem('alilox_lang') as Lang | null; if (s && !initial) setLangState(s); } catch {} }, [initial]);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; try { localStorage.setItem('alilox_lang', lang); document.cookie = `alilox_lang=${lang};path=/;max-age=31536000`; } catch {} }, [lang]);
  const t = (k: Key, vars?: Record<string, string | number>) => { let s: string = (D[lang] as any)[k] ?? D.en[k] ?? k; if (vars) Object.entries(vars).forEach(([a, b]) => { s = s.replace(`{${a}}`, String(b)); }); return s; };
  return <Ctx.Provider value={{ lang, setLang: setLangState, t }}>{children}</Ctx.Provider>;
}
export const useT = () => useContext(Ctx);
export const nameOf = (lang: Lang, it: { name_en: string; name_ar: string }) => (lang === 'ar' ? it.name_ar : it.name_en);
