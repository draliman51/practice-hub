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
 // Adventure campaign (unlocks in order)
 {id:'c1',ic:'🟢',modes:['solo'],hidden:true,campaign:1,th:[60,100,150]},
 {id:'c2',ic:'🪙',modes:['solo'],hidden:true,campaign:2,timed:60,th:[80,140,200]},
 {id:'c3',ic:'🚗',modes:['solo'],hidden:true,campaign:3,th:[60,110,160]},
 {id:'c4',ic:'🏃',modes:['solo'],hidden:true,campaign:4,runner:true,th:[150,260,340]},
 {id:'c5',ic:'👊',modes:['solo'],hidden:true,campaign:5,fight:true,th:[60,110,150]},
 {id:'c6',ic:'🌋',modes:['solo'],hidden:true,campaign:6,th:[70,130,190]},
 {id:'c7',ic:'🚦',modes:['solo'],hidden:true,campaign:7,th:[60,110,160]},
 {id:'c8',ic:'🌪️',modes:['solo'],hidden:true,campaign:8,th:[80,150,220]},
 {id:'c9',ic:'🐲',modes:['solo'],hidden:true,campaign:9,fight:true,th:[100,200,300]},
 {id:'c10',ic:'🏆',modes:['solo'],hidden:true,campaign:10,th:[120,220,320]},
];
export const hex=c=>'#'+c.toString(16).padStart(6,'0');

export const CAMPAIGN=[{id:'c1',en:'First Steps',ar:'الخطوات الأولى',d_en:'A gentle obby to warm up.',d_ar:'أوبي سهل للإحماء.'},{id:'c2',en:'Coin Garden',ar:'حديقة العملات',d_en:'Grab 15 coins in 60 seconds.',d_ar:'اجمع 15 عملة في 60 ثانية.'},{id:'c3',en:'Traffic Dash',ar:'عبور الشارع',d_en:'Cross 4 busy roads without getting hit!',d_ar:'اعبر 4 شوارع مزدحمة دون أن تصدمك سيارة!'},{id:'c4',en:'Dash Runner',ar:'العدّاء',d_en:'Auto-run and dodge the obstacles. 3 lives.',d_ar:'تجري تلقائيًا وتتفادى العوائق. 3 أرواح.'},{id:'c5',en:'Monster Arena',ar:'حلبة الوحوش',d_en:'Punch 4 monsters before they get you.',d_ar:'الكم 4 وحوش قبل أن تمسك بك.'},{id:'c6',en:'Lava Bridges',ar:'جسور الحمم',d_en:'Narrow bridges and moving platforms.',d_ar:'جسور ضيقة ومنصات متحركة.'},{id:'c7',en:'Rush Hour',ar:'ساعة الذروة',d_en:'6 roads, faster cars.',d_ar:'6 شوارع وسيارات أسرع.'},{id:'c8',en:'Tower Storm',ar:'عاصفة البرج',d_en:'A taller, tighter tower.',d_ar:'برج أعلى وأضيق.'},{id:'c9',en:'Boss Fight',ar:'معركة الزعيم',d_en:'A giant boss with 12 HP and two minions.',d_ar:'زعيم عملاق بـ12 نقطة حياة مع تابعَين.'},{id:'c10',en:'Grand Finale',ar:'الختام الكبير',d_en:'The ultimate sky race.',d_ar:'سباق السماء النهائي.'}];
