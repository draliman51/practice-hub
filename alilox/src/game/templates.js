// Starter templates for the world editor and the house — fully editable after loading.
const B=(x,y,z,c,kind)=>({x,y,z,c,kind});
const line=(x0,z0,n,dz,y,c)=>Array.from({length:n},(_,i)=>B(x0,y,z0+i*dz,c));
export const WORLD_TEMPLATES=[
 {id:'classic',en:'Classic Obby',ar:'أوبي كلاسيكي',ic:'🧱',d_en:'Start → stepping blocks → bridge → finish.',d_ar:'بداية ← مكعبات قفز ← جسر ← نهاية.',
  build(){ const blocks=[],coins=[]; for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)blocks.push(B(x,0,z-10,0x4ADE80)); [[-2,-6],[2,-4],[-2,-2],[2,0]].forEach((p,i)=>{blocks.push(B(p[0],0,p[1],[0x3B82F6,0xA78BFA][i%2]));coins.push({x:p[0],y:0,z:p[1]});}); line(0,2,6,1,0,0xFF8A3D).forEach(b=>blocks.push(b)); blocks.push(B(0,0,9,0x4ADE80,'check')); [1,2,3].forEach(h=>blocks.push(B(0,h,9+h,0x2EE6D6))); for(let x=-1;x<=1;x++)for(let z=0;z<=2;z++)blocks.push(B(x,3,13+z,0xFFD23F,x===0&&z===1?'finish':undefined)); return {blocks,coins,start:{x:0,y:0,z:-10}}; }},
 {id:'spiral',en:'Spiral Tower',ar:'برج حلزوني',ic:'🗼',d_en:'Climb the stairs around a pillar.',d_ar:'اصعد الدرج حول العمود.',
  build(){ const blocks=[],coins=[]; for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)blocks.push(B(x,0,z,0x4ADE80)); const pal=[0x3B82F6,0xA78BFA,0x2EE6D6,0xFF5DA2]; for(let i=1;i<=14;i++){ const a=i*.7,r=3.5; const x=Math.round(Math.cos(a)*r),z=Math.round(Math.sin(a)*r); const y=Math.floor(i/2); blocks.push(B(x,y,z,pal[i%4],i===7?'check':undefined)); if(i%3===0)coins.push({x,y,z}); } blocks.push(B(0,7,0,0xFFD23F,'finish')); blocks.push(B(1,7,0,0xFFD23F)); blocks.push(B(-1,7,0,0xFFD23F)); return {blocks,coins,start:{x:0,y:0,z:0}}; }},
 {id:'garden',en:'Coin Garden',ar:'حديقة العملات',ar2:'',ic:'🪙',d_en:'A big lawn with coin islands.',d_ar:'ساحة واسعة مع جزر عملات.',
  build(){ const blocks=[],coins=[]; for(let x=-6;x<=6;x++)for(let z=-6;z<=6;z++)blocks.push(B(x,0,z,(x+z)%2?0x4ADE80:0x86EFAC)); [[-4,-4],[4,4],[-4,4],[4,-4],[0,0]].forEach((p,i)=>{blocks.push(B(p[0],1,p[1],0xFF8A3D)); if(i<4)blocks.push(B(p[0],2,p[1],0xFFD23F)); coins.push({x:p[0],y:i<4?2:1,z:p[1]});}); [[-2,0],[2,0],[0,-2],[0,2]].forEach(p=>coins.push({x:p[0],y:0,z:p[1]})); blocks.push(B(6,0,6,0xFFD23F,'finish')); return {blocks,coins,start:{x:-6,y:0,z:-6}}; }},
 {id:'bridge',en:'Parkour Bridge',ar:'جسر الباركور',ic:'🌉',d_en:'A long bridge with gaps and checkpoints.',d_ar:'جسر طويل بفجوات ونقاط تفتيش.',
  build(){ const blocks=[],coins=[]; blocks.push(B(0,0,-11,0x4ADE80),B(-1,0,-11,0x4ADE80),B(1,0,-11,0x4ADE80)); let z=-9; for(let s=0;s<5;s++){ for(let k=0;k<3;k++){blocks.push(B(0,0,z,[0x3B82F6,0xA78BFA][s%2])); z++;} coins.push({x:0,y:0,z:z-2}); z+=2; blocks.push(B(0,0,z,0x4ADE80,s%2?'check':undefined)); z++; } blocks.push(B(0,0,z+1,0xFFD23F,'finish')); return {blocks,coins,start:{x:0,y:0,z:-11}}; }},
];
export const HOUSE_TEMPLATES=[
 {id:'cozy',en:'Cozy Room',ar:'غرفة دافئة',ic:'🛋️',wall:0,floor:5,items:[{id:'sofa',x:3,y:4},{id:'rug',x:3,y:3},{id:'lamp',x:0,y:0},{id:'plant',x:7,y:0},{id:'tv',x:3,y:1},{id:'bed',x:0,y:4}]},
 {id:'gamer',en:'Gamer Den',ar:'عرين اللاعب',ic:'🎮',wall:5,floor:0,items:[{id:'tv',x:3,y:0},{id:'sofa',x:3,y:2},{id:'lamp',x:0,y:0},{id:'lamp',x:7,y:0},{id:'trophy',x:0,y:5},{id:'bed',x:6,y:4}]},
 {id:'garden',en:'Garden House',ar:'بيت الحديقة',ic:'🌿',wall:1,floor:6,items:[{id:'plant',x:0,y:0},{id:'plant',x:7,y:0},{id:'plant',x:0,y:5},{id:'plant',x:7,y:5},{id:'rug',x:3,y:3},{id:'sofa',x:3,y:2},{id:'piano',x:5,y:0}]},
 {id:'royal',en:'Royal Hall',ar:'القاعة الملكية',ic:'👑',wall:2,floor:4,items:[{id:'trophy',x:3,y:0},{id:'trophy',x:4,y:0},{id:'piano',x:0,y:2},{id:'sofa',x:3,y:4},{id:'rug',x:3,y:3},{id:'lamp',x:7,y:5},{id:'bed',x:0,y:5}]},
];
