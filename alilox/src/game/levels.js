// Level definitions: platforms {x,y,z,w,h,d,c,kind,mv} and coins {x,y,z}
const C={g:0x4ADE80,b:0x3B82F6,p:0xA78BFA,o:0xFF8A3D,t:0x2EE6D6,y:0xFFD23F,r:0xFF5DA2,w:0xF1F5F9,s:0x475569};
export function level(id,data){
  const P=[],coins=[],portals=[],decor=[]; const add=(x,y,z,w,h,d,c,kind,mv)=>P.push({x,y,z,w,h,d,c,kind:kind||'plat',mv}); const coin=(x,z,y)=>coins.push({x,z,y:(y||0)+1.5});
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
  } else if(id==='custom'&&data){
    (data.blocks||[]).forEach(b=>add(b.x+.5,b.y+.5,b.z+.5,1,1,1,b.c||C.b,b.kind==='finish'?'finish':b.kind==='check'?'check':'plat'));
    (data.coins||[]).forEach(c=>coins.push({x:c.x+.5,y:c.y+1.5,z:c.z+.5}));
    const st=data.start||{x:0,y:0,z:0}; spawn={x:st.x+.5,y:st.y+1.5,z:st.z+.5,yaw:0};
    if(!P.length) add(0,0,0,6,1,6,C.g,'start');
  }
  return {P,coins,portals,decor,spawn};
}
