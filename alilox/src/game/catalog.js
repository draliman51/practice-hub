// Shared visual catalog for the engine and the UI
export const SKIN=[0xF2C9A6,0xE0AC85,0xC68642,0x8D5524,0x5C3A1E,0xFFDBAC];
export const COLORS=[0x1F2B5B,0xFF5DA2,0x3B82F6,0x2EE6D6,0xFFD23F,0xFF8A3D,0x4ADE80,0xA78BFA,0xEF4444,0x111827,0xFFFFFF,0x8B5CF6];
export const HAIRC=[0x1a1a1a,0x5b3a1a,0xb45309,0xfcd34d,0xef4444,0x60a5fa,0xf472b6,0xffffff];
export const HAIR=[{id:'short',en:'Short',ar:'قصير',ic:'💇'},{id:'long',en:'Long',ar:'طويل',ic:'👩'},{id:'pony',en:'Ponytail',ar:'ذيل حصان',ic:'🎀'},{id:'spiky',en:'Spiky',ar:'شائك',ic:'⚡'},{id:'bun',en:'Bun',ar:'كعكة',ic:'🍡'},{id:'none',en:'None',ar:'بدون',ic:'🥚'}];
export const FACES=['😀','😎','🤩','😜','🥳','😺','🤖','😇'];
export const EMOTES=[{id:'wave',en:'Wave',ar:'تلويح',ic:'👋'},{id:'dance',en:'Dance',ar:'رقص',ic:'💃'},{id:'spin',en:'Spin',ar:'دوران',ic:'🌀'},{id:'cheer',en:'Cheer',ar:'هتاف',ic:'🎉'}];
export const CHAT=['Hi! 👋','GG! 🏆','Watch this! 👀','Catch me! 🏃','Yay! 🎉','Oops 😅','Let’s go! 🚀','Follow me ➡️','مرحبا 👋','يلا 🚀','أحسنت 👏','هههه 😂'];
export const WORLDS=[
 {id:'city',ic:'🏙️',modes:['solo','online'],hub:true},
 {id:'obby',ic:'🧱',modes:['solo','cpu','online'],robotTime:70,th:[80,150,220]},
 {id:'tower',ic:'🗼',modes:['solo','cpu','online'],robotTime:80,th:[80,150,220]},
 {id:'park',ic:'🎡',modes:['solo','online'],timed:60,th:[150,280,380]},
 {id:'arena',ic:'🟥',modes:['solo','online'],th:[20,45,70]},
 {id:'race',ic:'🐾',modes:['solo','online'],mini:true,th:[1,2,3]},
 {id:'skyrace',ic:'🏎️',modes:['solo','cpu','online'],robotTime:60,th:[80,150,220]},
 {id:'treasure',ic:'🏝️',modes:['solo','online'],timed:90,th:[100,175,240]},
 {id:'tag',ic:'👹',modes:['solo','online'],survive:90,th:[40,80,120]},
 {id:'custom',ic:'🧱',modes:['solo'],hidden:true,th:[60,120,200]},
];
export const hex=c=>'#'+c.toString(16).padStart(6,'0');
