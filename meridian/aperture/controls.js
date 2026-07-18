'use strict';

// First-person control pass 01.
// Movement is camera-relative: forward always follows the crosshair,
// and strafing remains perpendicular to the current view direction.
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
    const deg=Math.max(-70,Math.min(70,norm(state.rings[state.control]-target)/Math.PI*70));
    dialNeedle.style.transform=`rotate(${deg}deg)`;
    consoleStatus.textContent=Math.abs(deg)<6?'SIGNAL CENTERED · PRESS SUN TO LOCK':'ROTATE UNTIL THE SIGNAL CENTERS';
    return;
  }

  let forward=0,strafe=0,look=0;
  if(state.keys.KeyW||state.keys.ArrowUp)forward+=1;
  if(state.keys.KeyS||state.keys.ArrowDown)forward-=1;
  if(state.keys.KeyA)strafe-=1;
  if(state.keys.KeyD)strafe+=1;
  if(state.keys.ArrowLeft)look-=1;
  if(state.keys.ArrowRight)look+=1;
  forward+=-gp.my-state.touch.my;
  strafe+=gp.mx+state.touch.mx;
  look+=gp.lx;
  state.player.yaw=norm(state.player.yaw+look*dt*1.9);

  // Prevent diagonal movement from being faster than straight movement.
  const inputLength=Math.hypot(forward,strafe);
  if(inputLength>1){forward/=inputLength;strafe/=inputLength}

  const speed=2.55;
  const sy=Math.sin(state.player.yaw),cy=Math.cos(state.player.yaw);
  const forwardX=-sy,forwardZ=cy;
  const rightX=cy,rightZ=sy;
  const nx=state.player.x+(forwardX*forward+rightX*strafe)*speed*dt;
  const nz=state.player.z+(forwardZ*forward+rightZ*strafe)*speed*dt;
  if(Math.hypot(nx,nz)<7.45){state.player.x=nx;state.player.z=nz}

  const c=nearestConsole();
  if(c&&!state.locked[c.i]){
    prompt.textContent=`SUN · ENGAGE RING ${['I','II','III'][c.i]} CONSOLE`;
    prompt.classList.remove('hidden');
  }else if(nearExit()&&state.locked.every(Boolean)){
    prompt.textContent='SUN · ENTER OBSERVATION PASSAGE';
    prompt.classList.remove('hidden');
  }else prompt.classList.add('hidden');

  const locked=state.locked.filter(Boolean).length;
  ringReadout.textContent=`RINGS ${locked}/3`;
  state.core+=(locked/3-state.core)*Math.min(1,dt*2);
  state.door+=(locked===3?1:0-state.door)*Math.min(1,dt*1.4);
  objective.textContent=locked<3?'RESTORE THE THREE ALIGNMENT RINGS':'THE OBSERVATION PASSAGE IS OPEN';
};
