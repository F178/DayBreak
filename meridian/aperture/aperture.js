'use strict';

const canvas=document.getElementById('view');
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const boot=$('boot'),hud=$('hud'),crosshair=$('crosshair'),prompt=$('prompt'),panel=$('consolePanel'),complete=$('complete');
const startBtn=$('startBtn'),restartBtn=$('restartBtn'),fullscreenBtn=$('fullscreenBtn'),touchToggle=$('touchToggle');
const objective=$('objective'),ringReadout=$('ringReadout'),memory=$('memory'),consoleTitle=$('consoleTitle'),consoleStatus=$('consoleStatus'),dialNeedle=$('dialNeedle');

const C={void:'#050606',bone:'#e9e4d8',ash:'#8c8c86',amber:'#e9a81a',red:'#ba3d32'};
const TAU=Math.PI*2;
const state={running:false,complete:false,control:-1,last:0,time:0,keys:{},touch:{mx:0,my:0,lx:0,ly:0},player:{x:0,z:6.3,yaw:Math.PI,pitch:0},rings:[2.1,-1.5,1.35],locked:[false,false,false],core:0,door:0};
const consoles=[0,TAU/3,TAU*2/3].map((a,i)=>({i,x:Math.sin(a)*5.4,z:Math.cos(a)*5.4,a}));
const target=0;

function norm(a){a%=TAU;if(a>Math.PI)a-=TAU;if(a<-Math.PI)a+=TAU;return a}
function resize(){const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(innerWidth*d);canvas.height=Math.round(innerHeight*d);canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize);resize();

function save(){localStorage.setItem('highSunAperture',JSON.stringify({locked:state.locked,complete:state.complete}))}
function load(){try{const s=JSON.parse(localStorage.getItem('highSunAperture')||'null');if(s?.complete)memory.textContent='LIGHT MEMORY · FIRST LIGHT RECORDED'}catch{}}
load();

function start(){boot.classList.remove('active');complete.classList.remove('active');hud.classList.remove('hidden');crosshair.classList.remove('hidden');$('help').classList.remove('hidden');state.running=true;state.last=performance.now();requestAnimationFrame(loop);if(matchMedia('(pointer:fine)').matches)canvas.requestPointerLock?.()}
function reset(){Object.assign(state.player,{x:0,z:6.3,yaw:Math.PI,pitch:0});state.rings=[2.1,-1.5,1.35];state.locked=[false,false,false];state.core=0;state.door=0;state.control=-1;state.complete=false;objective.textContent='RESTORE THE THREE ALIGNMENT RINGS';complete.classList.remove('active');hud.classList.remove('hidden');crosshair.classList.remove('hidden');state.running=true;state.last=performance.now();save();requestAnimationFrame(loop)}
startBtn.onclick=start;restartBtn.onclick=reset;
fullscreenBtn.onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.();
touchToggle.onclick=()=>$('touch').classList.toggle('hidden');
canvas.onclick=()=>{if(state.running&&state.control<0&&matchMedia('(pointer:fine)').matches)canvas.requestPointerLock?.()};

// Mouse look is implemented by controls.js so both axes and settings share one path.
document.addEventListener('keydown',e=>{state.keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if((e.code==='Enter'||e.code==='KeyE'||e.code==='Space')&&!e.repeat)act();if(e.code==='Escape')leaveConsole()});
document.addEventListener('keyup',e=>state.keys[e.code]=false);

function gamepad(){const pads=navigator.getGamepads?.()||[];const p=pads[0];if(!p)return {mx:0,my:0,lx:0,ly:0,sun:false,door:false};return{mx:Math.abs(p.axes[0])>.15?p.axes[0]:0,my:Math.abs(p.axes[1])>.15?p.axes[1]:0,lx:Math.abs(p.axes[2])>.15?p.axes[2]:0,ly:Math.abs(p.axes[3])>.15?p.axes[3]:0,sun:!!p.buttons[0]?.pressed,door:!!p.buttons[1]?.pressed}}
let lastSun=false,lastDoor=false;

function nearestConsole(){let best=null,bd=999;for(const c of consoles){const d=Math.hypot(state.player.x-c.x,state.player.z-c.z);if(d<bd){bd=d;best=c}}return bd<1.45?best:null}
function nearExit(){return Math.hypot(state.player.x,state.player.z+7.1)<1.25}
function act(){if(!state.running)return;if(state.control>=0){const i=state.control;const err=Math.abs(norm(state.rings[i]-target));if(err<.13){state.rings[i]=target;state.locked[i]=true;consoleStatus.textContent='RING LOCKED · SIGNAL STABLE';tone(760,.16);setTimeout(leaveConsole,420);save()}else{consoleStatus.textContent='ALIGNMENT REJECTED · CENTER THE NEEDLE';tone(140,.12)}return}const c=nearestConsole();if(c&&!state.locked[c.i])enterConsole(c.i);else if(nearExit()&&state.locked.every(Boolean))finish()}
function enterConsole(i){state.control=i;panel.classList.remove('hidden');crosshair.classList.add('hidden');prompt.classList.add('hidden');consoleTitle.textContent=`RING ${['I','II','III'][i]}`;consoleStatus.textContent='ROTATE UNTIL THE SIGNAL CENTERS';document.exitPointerLock?.()}
function leaveConsole(){if(state.control<0)return;state.control=-1;panel.classList.add('hidden');crosshair.classList.remove('hidden')}
function finish(){state.complete=true;state.running=false;state.core=1;state.door=1;hud.classList.add('hidden');crosshair.classList.add('hidden');prompt.classList.add('hidden');complete.classList.add('active');memory.textContent='LIGHT MEMORY · FIRST LIGHT RECORDED';save();tone(523,.12);setTimeout(()=>tone(659,.12),130);setTimeout(()=>tone(784,.25),270)}

let ac;
function tone(freq,dur){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=freq;o.type='sine';g.gain.setValueAtTime(.0001,ac.currentTime);g.gain.exponentialRampToValueAtTime(.09,ac.currentTime+.015);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+dur+.02)}catch{}}

function update(dt){const gp=gamepad();if(gp.sun&&!lastSun)act();if(gp.door&&!lastDoor)leaveConsole();lastSun=gp.sun;lastDoor=gp.door;
  if(state.control>=0){let turn=0;if(state.keys.ArrowLeft||state.keys.KeyA)turn-=1;if(state.keys.ArrowRight||state.keys.KeyD)turn+=1;turn+=gp.mx+state.touch.mx;state.rings[state.control]=norm(state.rings[state.control]+turn*dt*1.45);const deg=Math.max(-70,Math.min(70,norm(state.rings[state.control]-target)/Math.PI*70));dialNeedle.style.transform=`rotate(${deg}deg)`;consoleStatus.textContent=Math.abs(deg)<6?'SIGNAL CENTERED · PRESS SUN TO LOCK':'ROTATE UNTIL THE SIGNAL CENTERS';return}
  let forward=0,strafe=0,look=0;if(state.keys.KeyW||state.keys.ArrowUp)forward+=1;if(state.keys.KeyS||state.keys.ArrowDown)forward-=1;if(state.keys.KeyA)strafe-=1;if(state.keys.KeyD)strafe+=1;if(state.keys.ArrowLeft)look-=1;if(state.keys.ArrowRight)look+=1;forward+=-gp.my-state.touch.my;strafe+=gp.mx+state.touch.mx;look+=gp.lx;state.player.yaw=norm(state.player.yaw+look*dt*1.9);
  // Camera-relative first-person movement: W always follows the crosshair,
  // while A/D remain perpendicular to the current view direction.
  const inputLength=Math.hypot(forward,strafe);if(inputLength>1){forward/=inputLength;strafe/=inputLength}
  const speed=2.55,sy=Math.sin(state.player.yaw),cy=Math.cos(state.player.yaw);
  const forwardX=-sy,forwardZ=cy,rightX=cy,rightZ=sy;
  let nx=state.player.x+(forwardX*forward+rightX*strafe)*speed*dt;
  let nz=state.player.z+(forwardZ*forward+rightZ*strafe)*speed*dt;
  const r=Math.hypot(nx,nz);if(r<7.45){state.player.x=nx;state.player.z=nz}
  const c=nearestConsole();if(c&&!state.locked[c.i]){prompt.textContent=`SUN · ENGAGE RING ${['I','II','III'][c.i]} CONSOLE`;prompt.classList.remove('hidden')}else if(nearExit()&&state.locked.every(Boolean)){prompt.textContent='SUN · ENTER OBSERVATION PASSAGE';prompt.classList.remove('hidden')}else prompt.classList.add('hidden');
  const locked=state.locked.filter(Boolean).length;ringReadout.textContent=`RINGS ${locked}/3`;state.core+=(locked/3-state.core)*Math.min(1,dt*2);state.door+=(locked===3?1:0-state.door)*Math.min(1,dt*1.4);objective.textContent=locked<3?'RESTORE THE THREE ALIGNMENT RINGS':'THE OBSERVATION PASSAGE IS OPEN';
}

function worldToCamera(x,y,z){const dx=x-state.player.x,dz=z-state.player.z;const s=Math.sin(-state.player.yaw),c=Math.cos(-state.player.yaw);return{x:dx*c-dz*s,y,z:dx*s+dz*c}}
function project(p){if(p.z<=.08)return null;const f=Math.min(innerWidth,innerHeight)*.92;return{x:innerWidth/2+p.x/p.z*f,y:innerHeight*.54-p.y/p.z*f,s:f/p.z}}
function poly(points,fill,stroke){const pp=points.map(p=>project(worldToCamera(...p)));if(pp.some(p=>!p))return;ctx.beginPath();pp.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function line(a,b,color,width=1){const pa=project(worldToCamera(...a)),pb=project(worldToCamera(...b));if(!pa||!pb)return;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke()}
function billboard(x,y,z,w,h,fill,stroke){const p=worldToCamera(x,y,z),q=project(p);if(!q)return;const ww=w*q.s,hh=h*q.s;ctx.fillStyle=fill;ctx.fillRect(q.x-ww/2,q.y-hh,ww,hh);if(stroke){ctx.strokeStyle=stroke;ctx.strokeRect(q.x-ww/2,q.y-hh,ww,hh)}}

function draw(){const w=innerWidth,h=innerHeight;const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#080a0b');g.addColorStop(.55,'#121314');g.addColorStop(1,'#050606');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.lineWidth=1;
  for(let r=1;r<=7;r++){const pts=[];for(let i=0;i<=48;i++){const a=i/48*TAU;pts.push([Math.sin(a)*r,0,Math.cos(a)*r])}for(let i=1;i<pts.length;i++)line(pts[i-1],pts[i],'rgba(233,228,216,.08)')}
  for(let i=0;i<24;i++){const a=i/24*TAU;line([0,0,0],[Math.sin(a)*7.5,0,Math.cos(a)*7.5],i%6===0?'rgba(233,168,26,.18)':'rgba(233,228,216,.07)')}
  for(let i=0;i<48;i++){const a=i/48*TAU,b=(i+1)/48*TAU;const p1=[Math.sin(a)*7.7,0,Math.cos(a)*7.7],p2=[Math.sin(b)*7.7,0,Math.cos(b)*7.7];poly([p1,p2,[p2[0],3.8,p2[2]],[p1[0],3.8,p1[2]]],i%8===0?'rgba(233,168,26,.025)':'rgba(233,228,216,.018)','rgba(233,228,216,.055)')}
  billboard(0,0,-7.62,2.2,3.1,state.locked.every(Boolean)?`rgba(233,168,26,${.08+.2*state.door})`:'#030404',state.locked.every(Boolean)?C.amber:'rgba(233,228,216,.18)');
  for(const c of consoles){billboard(c.x,.15,c.z,1.05,1.35,state.locked[c.i]?'rgba(233,168,26,.13)':'rgba(14,17,18,.96)',state.locked[c.i]?C.amber:'rgba(233,228,216,.28)');const p=project(worldToCamera(c.x,1.05,c.z));if(p){ctx.fillStyle=state.locked[c.i]?C.amber:C.bone;ctx.font=`${Math.max(10,16*p.s/80)}px ui-monospace`;ctx.textAlign='center';ctx.fillText(['I','II','III'][c.i],p.x,p.y)}}
  billboard(0,.05,0,1.0,2.6,'rgba(9,11,12,.96)','rgba(233,228,216,.22)');const core=project(worldToCamera(0,2.35,0));if(core){const rr=Math.max(5,18*core.s/80);ctx.fillStyle=`rgba(233,168,26,${.28+.72*state.core})`;ctx.shadowColor=C.amber;ctx.shadowBlur=30*state.core;ctx.beginPath();ctx.arc(core.x,core.y,rr,0,TAU);ctx.fill();ctx.shadowBlur=0}
  state.rings.forEach((rot,ri)=>{const rad=1.45+ri*.48,y=1.55+ri*.23;for(let i=0;i<48;i++){const a=i/48*TAU+rot,b=(i+1)/48*TAU+rot;const ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);const p1=[ca*rad,y+sa*.34,sa*rad*.38],p2=[cb*rad,y+sb*.34,sb*rad*.38];line(p1,p2,state.locked[ri]?C.amber:'rgba(233,228,216,.33)',state.locked[ri]?2:1)}const node=[Math.cos(rot)*rad,y+Math.sin(rot)*.34,Math.sin(rot)*rad*.38];const p=project(worldToCamera(...node));if(p){ctx.fillStyle=C.amber;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2,5*p.s/80),0,TAU);ctx.fill()}});
  state.locked.forEach((on,i)=>{if(on){const c=consoles[i];line([c.x,1.0,c.z],[0,2.35,0],`rgba(233,168,26,${.25+.45*Math.sin(state.time*3+i)**2})`,2)}});
  const vg=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.2,w/2,h/2,Math.max(w,h)*.72);vg.addColorStop(0,'transparent');vg.addColorStop(1,'rgba(0,0,0,.72)');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(233,168,26,.035)';ctx.fillRect(0,(state.time*40)%h,w,1);
}

function loop(now){if(!state.running)return;const dt=Math.min(.033,(now-state.last)/1000||0);state.last=now;state.time+=dt;update(dt);draw();requestAnimationFrame(loop)}

const movePad=$('movePad'),nub=movePad.querySelector('i'),lookPad=$('lookPad');let moveId=null,lookId=null,lastLookX=0;
function padMove(e){const r=movePad.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),m=Math.min(45,Math.hypot(x,y)),a=Math.atan2(y,x);state.touch.mx=Math.cos(a)*m/45;state.touch.my=Math.sin(a)*m/45;nub.style.transform=`translate(calc(-50% + ${Math.cos(a)*m}px),calc(-50% + ${Math.sin(a)*m}px))`}
movePad.addEventListener('pointerdown',e=>{moveId=e.pointerId;movePad.setPointerCapture(e.pointerId);padMove(e)});movePad.addEventListener('pointermove',e=>{if(e.pointerId===moveId)padMove(e)});movePad.addEventListener('pointerup',e=>{if(e.pointerId===moveId){moveId=null;state.touch.mx=state.touch.my=0;nub.style.transform='translate(-50%,-50%)'}});
lookPad.addEventListener('pointerdown',e=>{lookId=e.pointerId;lastLookX=e.clientX;lookPad.setPointerCapture(e.pointerId)});lookPad.addEventListener('pointermove',e=>{if(e.pointerId===lookId&&state.control<0){state.player.yaw=norm(state.player.yaw+(e.clientX-lastLookX)*.006);lastLookX=e.clientX}});lookPad.addEventListener('pointerup',e=>{if(e.pointerId===lookId)lookId=null});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',()=>b.dataset.action==='sun'?act():leaveConsole()));
if(matchMedia('(pointer:coarse)').matches)$('touch').classList.remove('hidden');
