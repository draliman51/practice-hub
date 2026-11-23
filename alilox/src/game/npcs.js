// AI companions — named characters with looks, personalities and bilingual lines.
export const CAST = [
  { id: 'zayn', name: 'Zayn', avatar: { skin: 2, shirt: 2, pants: 9, hair: 'spiky', hairc: 0, face: '😎', hat: 'cap', back: 'none', pet: 'dog' }, speed: 1.02, vibe: 'racer',
    lines: { en: ['Race you to the portal! 🏁', 'Catch me if you can! 🏃', 'I never fall… almost 😅', 'Nice moves!'], ar: ['سباق إلى البوابة! 🏁', 'امسكني إن استطعت! 🏃', 'أنا لا أسقط… تقريبًا 😅', 'حركات رائعة!'] } },
  { id: 'luna', name: 'Luna', avatar: { skin: 0, shirt: 7, pants: 1, hair: 'long', hairc: 3, face: '🤩', hat: 'flower', back: 'wings', pet: 'cat' }, speed: .9, vibe: 'friendly',
    lines: { en: ['I love your outfit! 💖', 'Did you find the secret coins? 👀', 'Let’s dance! 💃', 'Follow me, I know a shortcut!'], ar: ['أحب زيّك! 💖', 'هل وجدت العملات السرية؟ 👀', 'هيا نرقص! 💃', 'اتبعني، أعرف طريقًا مختصرًا!'] } },
  { id: 'bolt', name: 'Bolt', avatar: { skin: 3, shirt: 4, pants: 2, hair: 'short', hairc: 1, face: '😜', hat: 'headphones', back: 'jetpack', pet: 'robot' }, speed: 1.12, vibe: 'speedy',
    lines: { en: ['Zoooom! ⚡', 'Too slow! 😜', 'Jetpack goes brrr 🚀', 'GG!! 🏆'], ar: ['زووووم! ⚡', 'بطيء جدًا! 😜', 'الجيت باك يطير 🚀', 'أحسنت!! 🏆'] } },
  { id: 'mango', name: 'Captain Mango', avatar: { skin: 1, shirt: 5, pants: 0, hair: 'bun', hairc: 2, face: '🥳', hat: 'wizard', back: 'cape', pet: 'duck' }, speed: .8, vibe: 'silly',
    lines: { en: ['Ahoy! 🏴‍☠️ Treasure is near!', 'My duck is faster than you 🦆', 'Mango power! 🥭', 'Wanna see a trick? 🌀'], ar: ['أهوي! 🏴‍☠️ الكنز قريب!', 'بطتي أسرع منك 🦆', 'قوة المانجو! 🥭', 'تريد أن ترى خدعة؟ 🌀'] } },
  { id: 'pixel', name: 'Pixel', avatar: { skin: 4, shirt: 3, pants: 7, hair: 'pony', hairc: 5, face: '😺', hat: 'bunny', back: 'none', pet: 'dragon' }, speed: .95, vibe: 'curious',
    lines: { en: ['Hi friend! 👋', 'My dragon is shy 🐉', 'Did you claim your daily gift? 🎁', 'The tower is my favourite! 🗼'], ar: ['مرحبًا يا صديقي! 👋', 'تنيني خجول 🐉', 'هل استلمت هدية اليوم؟ 🎁', 'البرج هو المفضل لدي! 🗼'] } },
];
export const MONSTER_LINES = { en: ['Grrr! 👹', 'Got you… almost!', 'Run run run!'], ar: ['غرررر! 👹', 'كدت أمسكك!', 'اركض اركض!'] };
export const pickLine = (npc, lang) => { const L = npc.lines[lang === 'ar' ? 'ar' : 'en']; return L[Math.floor(Math.random() * L.length)]; };
