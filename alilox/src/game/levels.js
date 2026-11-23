// Level definitions: platforms {x,y,z,w,h,d,c,kind,mv} and coins {x,y,z}
const C={g:0x4ADE80,b:0x3B82F6,p:0xA78BFA,o:0xFF8A3D,t:0x2EE6D6,y:0xFFD23F,r:0xFF5DA2,w:0xF1F5F9,s:0x475569};
export function level(id,data){
  const P=[],coins=[],portals=[],decor=[],cars=[],obstacles=[],monsters=[]; const add=(x,y,z,w,h,d,c,kind,mv)=>P.push({x,y,z,w,h,d,c,kind:kind||'plat',mv}); const coin=(x,z,y)=>coins.push({x,z,y:(y||0)+1.5});
  let spawn={x:0,y:.5,z:0,yaw:0};
  if(id==='obby'){
    add(0,0,0,10,1,10,C.g,'start'); add(-2,0,8,3,1,3,C.b); add(2,0,12,3,1,3,C.p); add(-2,0,16,3,1,3,C.b); add(2,0,20,3,1,3,C.p); add(0,0,28,2,1,10,C.o); add(0,0,37,6,1,6,C.g,'check');
    add(0,1,43,3,1,3,C.t); add(0,2,47,3,1,3,C.b); add(0,3,51,3,1,3,C.t); add(0,4,55,4,1,4,C.b); add(0,4,62,4,1,4,C.y,'plat',{axis:'x',range:5,speed:1.1}); add(0,4,69,6,1,6,C.g,'check');
    add(0,4,75,3,1,3,C.r); add(0,4,80.5,3,1,3,C.p); add(0,4,86,3,1,3,C.r); add(0,4,95,4,1,4,C.y,'plat',{axis:'z',range:5,speed:0.9}); add(0,4,106,6,1,6,C.g,'check');
    add(0,5,112,3,1,3,C.b); add(3,6,116,3,1,3,C.t); add(0,7,120,3,1,3,C.b); add(-3,8,124,3,1,3,C.t); add(0,8,132,10,1,10,C.y,'finish');
    [[-2,8],[2,12],[-2,16],[2,20],[0,25],[0,31],[0,43,1],[0,47,2],[0,51,3],[0,62,4],[0,75,4],[0,80.5,4],[0,86,4],[0,95,4],[0,112,5],[3,116,6],[0,120,7],[-3,124,8]].forEach(a=>coin(a[0],a[1],a[2]));
  } else if(id==='tower'){
    add(0,0,0,10,1,10,C.g,'start'); add(0,14,0,1.4,28,1.4,C.s,'wall'); spawn={x:0,y:.5,z:-4,yaw:.66};
    const cols=[C.b,C.p,C.t,C.r,C.o]; for(let i=1;i<=34;i++){ const a=i*.5, r=6.2, x=+(Math.cos(a)*r).toFixed(2), z=+(Math.sin(a)*r).toFixed(2), y=i*.85; const chk=i%11===0; add(x,y,z,chk?3.6:2.6,1,chk?3.6:2.6,chk?C.g:cols[i%5],chk?'check':'plat'); if(i%3===0) coin(x,z,y); }
    add(0,30,0,9,1,9,C.y,'finish');
  } else if(id==='park'){
    add(0,0,0,44,1,44,C.g,'start');
    const B=[[-14,1,-12,4],[-8,2,-14,3],[10,1,-10,5],[14,2,-4,3],[12,3,2,3],[-12,1,8,4],[-6,2,12,3],[0,3,14,3],[6,1,10,4],[-16,1,0,3],[16,1,12,3],[-2,1,-6,3],[4,2,-16,3],[-15,3,-5,3],[8,4,16,3]];
    B.forEach((b,i)=>add(b[0],b[1],b[2],b[3],1,b[3],[C.b,C.p,C.t,C.r,C.o,C.w][i%6])); B.forEach(b=>coin(b[0],b[2],b[1]));
    [[-18,18],[18,-18],[0,-19],[-19,-19],[19,19],[9,5],[-9,-4],[3,19],[-19,5],[18,4],[-4,18],[12,-17],[-12,16],[0,5],[-7,3]].forEach(a=>coin(a[0],a[1],0));
    for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; decor.push({kind:'tree',x:Math.cos(a)*19.5,z:Math.sin(a)*19.5}); }
  } else if(id==='arena'){
    // 9x9 falling tiles, each 3x1x3 → kind 'tile' with index
    for(let i=0;i<9;i++) for(let j=0;j<9;j++) add((i-4)*3.2,0,(j-4)*3.2,3,1,3,[C.b,C.p,C.t,C.r,C.o,C.g][(i+j)%6],'tile');
    spawn={x:0,y:.5,z:0,yaw:0};
  } else if(id==='city'){
    add(0,0,0,70,1,70,0x86EFAC,'start'); spawn={x:0,y:.6,z:-9,yaw:0};
    // plaza
    add(0,.3,0,16,.6,16,0xFDE68A,'plat'); add(0,1.2,0,3,1.8,3,0x1F2B5B,'wall'); decor.push({kind:'sign',x:0,z:0,y:3.2,text:'ALILOX'});
    // portals around the plaza
    [['obby',-18,-14,'🧱'],['tower',18,-14,'🗼'],['park',-18,14,'🎡'],['arena',18,14,'🟥'],['race',0,-24,'🐾'],['house',0,24,'🏠'],['worlds',-26,0,'🌍'],['shop',26,0,'🛍️']].forEach(([id,x,z,ic])=>{ add(x,.4,z,6,.8,6,0xA78BFA,'plat'); portals.push({id,x,z,ic}); });
    // houses & trees
    for(let i=0;i<6;i++){ const x=-25+i*10; decor.push({kind:'house',x,z:-30,c:[0xFF5DA2,0x3B82F6,0xFFD23F,0x2EE6D6,0xFF8A3D,0xA78BFA][i]}); decor.push({kind:'tree',x:x+5,z:-26}); }
    for(let i=0;i<8;i++){ decor.push({kind:'tree',x:-33,z:-30+i*9}); decor.push({kind:'tree',x:33,z:-30+i*9}); }
    // roads
    add(0,.05,0,4,.1,70,0x64748B,'deco'); add(0,.05,0,70,.1,4,0x64748B,'deco');
    [[-10,0,-8],[10,0,8],[-10,0,8],[10,0,-8],[0,0,-16],[0,0,16],[-22,0,-22],[22,0,22]].forEach(a=>coin(a[0],a[2],a[1]));
  } else if(id==='treasure'){
    add(0,0,0,50,1,50,0xFDE68A,'start'); spawn={x:0,y:.6,z:-18,yaw:0};
    const rocks=[[-16,1.5,-10,5],[14,2,-8,4],[18,3,6,4],[-18,2.5,8,5],[0,2,14,4],[-8,1.5,18,4],[9,3.5,16,3],[-4,1,-6,3]];
    rocks.forEach((r,i)=>add(r[0],r[1],r[2],r[3],r[1]*2,r[3],[0x94A3B8,0x64748B,0x78716C][i%3],'plat'));
    // chests (on rocks and sand)
    [[-16,3,-10],[14,4,-8],[18,6,6],[-18,5,8],[0,4,14],[9,7,16],[20,.5,-20],[-21,.5,20]].forEach(c=>P.push({x:c[0],y:c[1],z:c[2],w:1.2,h:.9,d:.9,c:0xB45309,kind:'chest'}));
    [[-10,.5,-2],[6,.5,-14],[12,.5,2],[-6,.5,10],[4,.5,20],[-20,.5,-20],[20,.5,20],[0,.5,-8]].forEach(a=>coin(a[0],a[2],a[1]-.5));
    for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; decor.push({kind:'palm',x:Math.cos(a)*23,z:Math.sin(a)*23}); }
    [[0,.2,24],[6,.2,22]].forEach(a=>add(a[0],a[1],a[2],2.4,.4,2.4,0x2EE6D6,'bounce'));
    decor.push({kind:'shark',r:30},{kind:'shark',r:34});
  } else if(id==='tag'){
    add(0,0,0,60,1,60,0x86EFAC,'start'); spawn={x:0,y:.6,z:0,yaw:0};
    const walls=[[-15,-15,8,1.2],[15,-15,1.2,8],[15,15,8,1.2],[-15,15,1.2,8],[0,-22,10,1.2],[0,22,10,1.2],[-22,0,1.2,10],[22,0,1.2,10],[8,6,4,4],[-8,-6,4,4]];
    walls.forEach((w,i)=>add(w[0],1.25,w[1],w[2],2.5,w[3],[0xA78BFA,0xFF5DA2,0x3B82F6,0xFF8A3D][i%4],'plat'));
    [[8,3,6],[-8,3,-6],[0,0,0]].forEach(a=>coin(a[0],a[2],a[1]));
    [[-24,.2,-24],[24,.2,24],[24,.2,-24],[-24,.2,24]].forEach(a=>add(a[0],a[1],a[2],2.4,.4,2.4,0xFFD23F,'boost'));
    [[0,.2,-12],[0,.2,12]].forEach(a=>add(a[0],a[1],a[2],2.4,.4,2.4,0x2EE6D6,'bounce'));
    for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; decor.push({kind:'tree',x:Math.cos(a)*27,z:Math.sin(a)*27}); }
  } else if(id==='skyrace'){
    add(0,0,0,8,1,10,C.g,'start'); const cols=[C.b,C.p,C.t,C.r,C.o];
    let z=8,y=0; for(let i=0;i<22;i++){ const kind=i%6===5?'check':'plat'; const w=i%4===3?3:5; add(0,y,z,w,1,6,kind==='check'?C.g:cols[i%5],kind);
      if(i%3===1) add(0,y+.55,z,2.2,.1,2.2,0xFFD23F,'boost'); if(i%5===4){ add(0,y+.55,z+2,2.2,.1,2.2,0x2EE6D6,'bounce'); y+=3; z+=10; } else { z+=8; if(i%2) y+=1; }
      if(i%2===0) coin(0,z-4,y); }
    add(0,y,z+3,10,1,10,C.y,'finish');
  } else if(id==='c1'){ // Level 1 — First Steps (easy obby)
    add(0,0,0,8,1,8,C.g,'start'); for(let i=1;i<=6;i++){ add((i%2?-1.5:1.5),0,i*4+4,4,1,3,[C.b,C.p,C.t][i%3]); coin((i%2?-1.5:1.5),i*4+4); } add(0,0,34,6,1,6,C.g,'check'); for(let i=1;i<=4;i++) add(0,i*.8,36+i*4,3.5,1,3,C.o); add(0,4,56,8,1,8,C.y,'finish');
  } else if(id==='c2'){ // Level 2 — Coin Garden (timed)
    add(0,0,0,30,1,30,C.g,'start'); [[-10,1,-10,3],[10,1,10,3],[-10,2,10,3],[10,2,-10,3],[0,3,0,3]].forEach((b,i)=>{ add(b[0],b[1],b[2],b[3],1,b[3],[C.b,C.p,C.t,C.r,C.o][i]); coin(b[0],b[2],b[1]); }); [[-5,0],[5,0],[0,-5],[0,5],[-13,0],[13,0],[0,-13],[0,13],[-6,6],[6,-6]].forEach(a=>coin(a[0],a[1],0)); for(let i=0;i<8;i++){ const a=i/8*6.28; decor.push({kind:'tree',x:Math.cos(a)*14,z:Math.sin(a)*14}); }
  } else if(id==='c3'){ // Level 3 — Traffic Dash (cross 4 roads)
    add(0,0,0,70,1,60,0x86EFAC,'start'); spawn={x:0,y:.6,z:-26,yaw:0};
    [-14,-4,6,16].forEach((z,i)=>{ add(0,.05,z,70,.1,6,0x475569,'deco'); const dir=i%2?-1:1; for(let k=0;k<3;k++) cars.push({x:-30+k*22+(i*7),z:z+(i%2?1.2:-1.2),dir,speed:5+i*1.5+k*.4,c:[0xEF4444,0xFFD23F,0x3B82F6,0xF97316,0xA855F7][(i+k)%5],range:36}); });
    add(0,0,1,8,1.02,3,C.g,'check'); add(0,0,11,8,1.02,3,C.g,'check'); [[0,-9],[6,-9],[-6,1],[0,11],[6,21]].forEach(a=>coin(a[0],a[1],0)); add(0,0,24,12,1.02,6,C.y,'finish');
  } else if(id==='c4'){ // Level 4 — Dash Runner (auto-run, 3 lanes, dodge)
    add(0,0,150,10,1,310,0x1F2B5B,'start'); spawn={x:0,y:.6,z:0,yaw:0}; for(let z=14;z<290;z+=8+((z*7)%9)){ const lane=((z*13)%3)-1; obstacles.push({x:lane*3,z,t:(z%2?'barrel':'box'),c:[0xEF4444,0xF97316,0xA855F7][(z/8|0)%3]}); if(z%24<8) coin(((lane+2)%3-1)*3,z+4,0); } add(0,0,300,10,1,10,C.y,'finish'); for(let i=0;i<30;i++){ decor.push({kind:'tree',x:i%2?8:-8,z:i*10}); }
  } else if(id==='c5'){ // Level 5 — Monster Arena (fight 4 monsters)
    add(0,0,0,40,1,40,0xFCA5A5,'start'); [[-10,1.25,-10,3],[10,1.25,10,3],[0,1.25,0,4]].forEach(b=>add(b[0],b[1],b[2],b[3],2.5,b[3],C.p)); monsters.push({x:-15,z:-15,hp:3},{x:15,z:-15,hp:3},{x:15,z:15,hp:4},{x:-15,z:15,hp:4}); [[-6,0],[6,0],[0,-6],[0,6]].forEach(a=>coin(a[0],a[1],0)); for(let i=0;i<10;i++){ const a=i/10*6.28; decor.push({kind:'tree',x:Math.cos(a)*19,z:Math.sin(a)*19}); }
  } else if(id==='c6'){ // Level 6 — Lava Bridges (harder obby, moving platforms)
    add(0,0,0,8,1,8,C.g,'start'); add(0,0,8,1.6,1,8,C.o); add(0,0,16,3,1,3,C.b); add(0,0,22,3,1,3,C.y,'plat',{axis:'x',range:4,speed:1.6}); add(0,0,28,3,1,3,C.b); add(0,0,34,6,1,6,C.g,'check'); add(3,1,40,3,1,3,C.t); add(-3,2,46,3,1,3,C.t); add(3,3,52,3,1,3,C.t); add(0,4,58,3,1,3,C.y,'plat',{axis:'z',range:3,speed:1.3}); add(0,4,66,6,1,6,C.g,'check'); add(0,4.4,70,2.4,.4,2.4,0x2EE6D6,'bounce'); add(0,9,78,4,1,4,C.p); add(0,9,86,10,1,10,C.y,'finish'); [[0,8],[0,16],[0,28],[3,40,1],[-3,46,2],[3,52,3],[0,78,9]].forEach(a=>coin(a[0],a[1],a[2]));
  } else if(id==='c7'){ // Level 7 — Rush Hour (traffic + runner mix: roads with faster cars)
    add(0,0,0,80,1,80,0x86EFAC,'start'); spawn={x:0,y:.6,z:-36,yaw:0}; [-26,-16,-6,4,14,24].forEach((z,i)=>{ add(0,.05,z,80,.1,6,0x475569,'deco'); const dir=i%2?-1:1; for(let k=0;k<3;k++) cars.push({x:-35+k*26+i*5,z:z+(i%2?1.2:-1.2),dir,speed:7+i*1.2+k*.5,c:[0xEF4444,0xFFD23F,0x3B82F6,0xF97316,0xA855F7,0x10B981][(i+k)%6],range:40}); }); add(0,0,-11,8,1.02,3,C.g,'check'); add(0,0,9,8,1.02,3,C.g,'check'); [[0,-21],[5,-11],[-5,-1],[0,9],[5,19]].forEach(a=>coin(a[0],a[1],0)); add(0,0,32,12,1.02,6,C.y,'finish');
  } else if(id==='c8'){ // Level 8 — Tower Storm (tower with monsters at the base? → tall tower, more gaps)
    add(0,0,0,10,1,10,C.g,'start'); add(0,16,0,1.4,32,1.4,C.s,'wall'); spawn={x:0,y:.5,z:-4,yaw:.66}; const cols=[C.b,C.p,C.t,C.r,C.o]; for(let i=1;i<=38;i++){ const a=i*.55,r=6.6,x=+(Math.cos(a)*r).toFixed(2),z=+(Math.sin(a)*r).toFixed(2),y=i*.9; const chk=i%13===0; add(x,y,z,chk?3.6:2.2,1,chk?3.6:2.2,chk?C.g:cols[i%5],chk?'check':'plat'); if(i%4===0) coin(x,z,y); } add(0,36,0,9,1,9,C.y,'finish');
  } else if(id==='c9'){ // Level 9 — Boss Fight
    add(0,0,0,44,1,44,0xFDE68A,'start'); [[-12,1.25,-12,4],[12,1.25,12,4],[-12,1.25,12,4],[12,1.25,-12,4]].forEach(b=>add(b[0],b[1],b[2],b[3],2.5,b[3],C.r)); monsters.push({x:0,z:14,hp:12,boss:true},{x:-16,z:-16,hp:2},{x:16,z:-16,hp:2}); [[-8,0],[8,0],[0,-8],[0,8],[-18,0],[18,0]].forEach(a=>coin(a[0],a[1],0)); [[-20,.2,-20],[20,.2,20]].forEach(a=>add(a[0],a[1],a[2],2.4,.4,2.4,0xFFD23F,'boost'));
  } else if(id==='c10'){ // Level 10 — Grand Finale (falling floor + sky race combo: long race with pads)
    add(0,0,0,8,1,10,C.g,'start'); const cols=[C.b,C.p,C.t,C.r,C.o]; let z=8,y=0; for(let i=0;i<30;i++){ const kind=i%7===6?'check':'plat'; const w=i%3===2?2.4:4; add((i%4===1?2:i%4===3?-2:0),y,z,w,1,5,kind==='check'?C.g:cols[i%5],kind); if(i%4===0) add((i%4===1?2:i%4===3?-2:0),y+.55,z,2,.1,2,0xFFD23F,'boost'); if(i%6===5){ add(0,y+.55,z+1.5,2.2,.1,2.2,0x2EE6D6,'bounce'); y+=3.5; z+=11; } else { z+=7.5; y+= i%2?1.2:0; } if(i%2===0) coin(0,z-3,y); } add(0,y,z+3,12,1,12,C.y,'finish');
  } else if(id==='custom'&&data){
    (data.blocks||[]).forEach(b=>add(b.x+.5,b.y+.5,b.z+.5,1,1,1,b.c||C.b,b.kind==='finish'?'finish':b.kind==='check'?'check':'plat'));
    (data.coins||[]).forEach(c=>coins.push({x:c.x+.5,y:c.y+1.5,z:c.z+.5}));
    const st=data.start||{x:0,y:0,z:0}; spawn={x:st.x+.5,y:st.y+1.5,z:st.z+.5,yaw:0};
    if(!P.length) add(0,0,0,6,1,6,C.g,'start');
  }
  return {P,coins,portals,decor,spawn,cars,obstacles,monsters};
}
