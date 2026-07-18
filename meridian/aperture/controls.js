'use strict';

// First-person control pass 02.
// Camera-relative movement, vertical look, sensitivity and inversion settings,
// radial controller dead zones, and acceleration/deceleration.
const CONTROL_DEFAULTS={mouseSensitivity:0.0024,controllerSensitivity:2.15,deadZone:0.16,invertX:false,invertY:false};
const controlSettings=loadControlSettings();
state.player.pitch=Number.isFinite(state.player.pitch)?state.player.pitch:0;
state.motion=state.motion||{x:0,z:0};
let pointerHintUntil=0;

function loadControlSettings(){
  try{return {...CONTROL_DEFAULTS,...JSON.parse(localStorage.getItem('highSunControlSettings')||'{}')}}catch{return {...CONTROL_DEFAULTS}}
}
function saveControlSettings(){localStorage.setItem('highSunControlSettings',JSON.stringify(controlSettings))}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function axisDeadZone(value,deadZone){
  const a=Math.abs(value);
  if(a<=deadZone)return 0;
  return Math.sign(value)*(a-deadZone)/(1-deadZone);
}

// Replace the coarse fixed-dead-zone reader from the first prototype.
window.gamepad=function gamepad(){
  const pads=navigator.getGamepads?.()||[];
  const p=pads[0];
  if(!p)return {mx:0,my:0,lx:0,ly:0,sun:false,door:false};
  return{
    mx:axisDeadZone(p.axes[0]||0,controlSettings.deadZone),
    my:axisDeadZone(p.axes[1]||0,controlSettings.deadZone),
    lx:axisDeadZone(p.axes[2]||0,controlSettings.deadZone),
    ly:axisDeadZone(p.axes[3]||0,controlSettings.deadZone),
    sun:!!p.buttons[0]?.pressed,
    door:!!p.buttons[1]?.pressed
  };
};

// Camera pitch is applied after the horizontal yaw transform.
window.worldToCamera=function worldToCamera(x,y,z){
  const dx=x-state.player.x,dz=z-state.player.z;
  const sy=Math.sin(-state.player.yaw),cy=Math.cos(-state.player.yaw);
  const rx=dx*cy-dz*sy,rz=dx*sy+dz*cy;
  const pitch=state.player.pitch||0,sp=Math.sin(pitch),cp=Math.cos(pitch);
  return{x:rx,y:y*cp-rz*sp,z:y*sp+rz*cp};
};

// Mouse look now owns both axes. The original one-axis listener was removed.
document.addEventListener('mousemove',event=>{
  if(document.pointerLockElement!==canvas||!state.running||state.control>=0)return;
  const ix=controlSettings.invertX?-1:1;
  const iy=controlSettings.invertY?-1:1;
  state.player.yaw=norm(state.player.yaw+event.movementX*controlSettings.mouseSensitivity*ix);
  state.player.pitch=clamp(state.player.pitch-event.movementY*controlSettings.mouseSensitivity*iy,-1.02,1.02);
});

// Touch look keeps the existing horizontal handler and adds vertical camera pitch.
let controlTouchId=null,lastTouchY=0;
lookPad.addEventListener('pointerdown',event=>{controlTouchId=event.pointerId;lastTouchY=event.clientY});
lookPad.addEventListener('pointermove',event=>{
  if(event.pointerId!==controlTouchId||state.control>=0)return;
  const dy=event.clientY-lastTouchY;
  const iy=controlSettings.invertY?-1:1;
  state.player.pitch=clamp(state.player.pitch-dy*0.006*iy,-1.02,1.02);
  lastTouchY=event.clientY;
});
lookPad.addEventListener('pointerup',event=>{if(event.pointerId===controlTouchId)controlTouchId=null});

window.update=function update(dt){
  const gp=gamepad();
  if(gp.sun&&!lastSun)act();
  if(gp.door&&!lastDoor)leaveConsole();
  lastSun=gp.sun;
  lastDoor=gp.door;

  if(state.control>=0){
    let turn=0;
    if(state.keys.ArrowLeft||state.keys.KeyA)turn-=1;
    if(state.keys.ArrowRight||state.keys.KeyD)turn+=1;
    turn+=gp.mx+state.touch.mx;
    state.rings[state.control]=norm(state.rings[state.control]+turn*dt*1.45);
    const deg=clamp(norm(state.rings[state.control]-target)/Math.PI*70,-70,70);
    dialNeedle.style.transform=`rotate(${deg}deg)`;
    consoleStatus.textContent=Math.abs(deg)<6?'SIGNAL CENTERED · PRESS SUN TO LOCK':'ROTATE UNTIL THE SIGNAL CENTERS';
    return;
  }

  let forward=0,strafe=0,keyboardLook=0;
  if(state.keys.KeyW||state.keys.ArrowUp)forward+=1;
  if(state.keys.KeyS||state.keys.ArrowDown)forward-=1;
  if(state.keys.KeyA)strafe-=1;
  if(state.keys.KeyD)strafe+=1;
  if(state.keys.ArrowLeft)keyboardLook-=1;
  if(state.keys.ArrowRight)keyboardLook+=1;
  forward+=-gp.my-state.touch.my;
  strafe+=gp.mx+state.touch.mx;

  const ix=controlSettings.invertX?-1:1;
  const iy=controlSettings.invertY?-1:1;
  state.player.yaw=norm(state.player.yaw+(keyboardLook*1.9+gp.lx*controlSettings.controllerSensitivity*ix)*dt);
  state.player.pitch=clamp(state.player.pitch-gp.ly*controlSettings.controllerSensitivity*iy*dt,-1.02,1.02);

  const inputLength=Math.hypot(forward,strafe);
  if(inputLength>1){forward/=inputLength;strafe/=inputLength}

  const speed=2.55,sy=Math.sin(state.player.yaw),cy=Math.cos(state.player.yaw);
  const desiredX=(-sy*forward+cy*strafe)*speed;
  const desiredZ=(cy*forward+sy*strafe)*speed;
  const responsiveness=inputLength>.01?10.5:15.5;
  const blend=1-Math.exp(-responsiveness*dt);
  state.motion.x+=(desiredX-state.motion.x)*blend;
  state.motion.z+=(desiredZ-state.motion.z)*blend;
  if(inputLength<=.01&&Math.hypot(state.motion.x,state.motion.z)<.015)state.motion.x=state.motion.z=0;

  const nx=state.player.x+state.motion.x*dt;
  const nz=state.player.z+state.motion.z*dt;
  if(Math.hypot(nx,nz)<7.45){state.player.x=nx;state.player.z=nz}
  else{state.motion.x*=.2;state.motion.z*=.2}

  const c=nearestConsole();
  if(c&&!state.locked[c.i]){
    prompt.textContent=`SUN · ENGAGE RING ${['I','II','III'][c.i]} CONSOLE`;
    prompt.classList.remove('hidden');
  }else if(nearExit()&&state.locked.every(Boolean)){
    prompt.textContent='SUN · ENTER OBSERVATION PASSAGE';
    prompt.classList.remove('hidden');
  }else if(document.pointerLockElement!==canvas&&matchMedia('(pointer:fine)').matches&&performance.now()<pointerHintUntil){
    prompt.textContent='CLICK TO RECAPTURE MOUSE LOOK';
    prompt.classList.remove('hidden');
  }else prompt.classList.add('hidden');

  const locked=state.locked.filter(Boolean).length;
  ringReadout.textContent=`RINGS ${locked}/3`;
  state.core+=(locked/3-state.core)*Math.min(1,dt*2);
  state.door+=(locked===3?1:0-state.door)*Math.min(1,dt*1.4);
  objective.textContent=locked<3?'RESTORE THE THREE ALIGNMENT RINGS':'THE OBSERVATION PASSAGE IS OPEN';
};

// Preserve the base console close behavior, then guide the player back into mouse look.
const baseLeaveConsole=window.leaveConsole;
window.leaveConsole=function leaveConsole(){
  const wasOpen=state.control>=0;
  baseLeaveConsole();
  if(wasOpen&&state.running&&matchMedia('(pointer:fine)').matches){
    pointerHintUntil=performance.now()+3500;
    try{const result=canvas.requestPointerLock?.();result?.catch?.(()=>{})}catch{}
  }
};

const settingsBtn=document.getElementById('settingsBtn');
const settingsPanel=document.getElementById('settingsPanel');
const settingsClose=document.getElementById('settingsClose');
const mouseSensitivity=document.getElementById('mouseSensitivity');
const controllerSensitivity=document.getElementById('controllerSensitivity');
const controllerDeadZone=document.getElementById('controllerDeadZone');
const invertX=document.getElementById('invertX');
const invertY=document.getElementById('invertY');
const mouseSensitivityValue=document.getElementById('mouseSensitivityValue');
const controllerSensitivityValue=document.getElementById('controllerSensitivityValue');
const controllerDeadZoneValue=document.getElementById('controllerDeadZoneValue');

function syncSettingsUI(){
  if(!settingsPanel)return;
  mouseSensitivity.value=controlSettings.mouseSensitivity;
  controllerSensitivity.value=controlSettings.controllerSensitivity;
  controllerDeadZone.value=controlSettings.deadZone;
  invertX.checked=controlSettings.invertX;
  invertY.checked=controlSettings.invertY;
  mouseSensitivityValue.textContent=Number(controlSettings.mouseSensitivity).toFixed(4);
  controllerSensitivityValue.textContent=Number(controlSettings.controllerSensitivity).toFixed(2);
  controllerDeadZoneValue.textContent=Math.round(controlSettings.deadZone*100)+'%';
}
function openSettings(){
  if(!settingsPanel)return;
  document.exitPointerLock?.();
  settingsPanel.classList.remove('hidden');
  syncSettingsUI();
}
function closeSettings(){
  if(!settingsPanel)return;
  settingsPanel.classList.add('hidden');
  pointerHintUntil=performance.now()+3500;
}
function bindRange(element,key,valueElement,format){
  element?.addEventListener('input',()=>{
    controlSettings[key]=Number(element.value);
    valueElement.textContent=format(controlSettings[key]);
    saveControlSettings();
  });
}
settingsBtn?.addEventListener('click',openSettings);
settingsClose?.addEventListener('click',closeSettings);
bindRange(mouseSensitivity,'mouseSensitivity',mouseSensitivityValue,v=>v.toFixed(4));
bindRange(controllerSensitivity,'controllerSensitivity',controllerSensitivityValue,v=>v.toFixed(2));
bindRange(controllerDeadZone,'deadZone',controllerDeadZoneValue,v=>Math.round(v*100)+'%');
invertX?.addEventListener('change',()=>{controlSettings.invertX=invertX.checked;saveControlSettings()});
invertY?.addEventListener('change',()=>{controlSettings.invertY=invertY.checked;saveControlSettings()});
document.addEventListener('keydown',event=>{
  if(event.code==='KeyO'&&!event.repeat){settingsPanel?.classList.contains('hidden')?openSettings():closeSettings()}
});
syncSettingsUI();
