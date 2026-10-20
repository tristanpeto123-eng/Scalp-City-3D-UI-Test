import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const scene=new THREE.Scene();scene.background=new THREE.Color(0x91cbdc);scene.fog=new THREE.Fog(0x91cbdc,32,80);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,150);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;document.body.prepend(renderer.domElement);
const M=(c)=>new THREE.MeshStandardMaterial({color:c,roughness:.82,flatShading:true});const cream=M(0xf5e9c8),wall=M(0xf7d8a3),wood=M(0x9c6c51),blue=M(0x3f7e9c),teal=M(0x62bcb4),gold=M(0xf3bd5b),dark=M(0x344d61),green=M(0x73aa69),red=M(0xd76d5f),glass=new THREE.MeshStandardMaterial({color:0x8bd9e4,transparent:true,opacity:.44,roughness:.15});
function cube(p,w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
function cyl(p,r1,r2,h,m,x,y,z,n=10){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o}
function ball(p,r,m,x,y,z){const o=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),m);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o}
const floor=cube(scene,31,.7,30,cream,0,-.35,0);cube(scene,31,.4,2,wood,0,.15,14);cube(scene,31,7,.5,wall,0,3.5,-14.5);
for(const x of [-15,15]){cube(scene,.6,7,30,wall,x,3.5,0);for(let z=-11;z<=10;z+=5)cube(scene,.63,4.8,3.6,glass,x,3.4,z)}
for(const x of [-12,-6,0,6,12]){cube(scene,.55,7,.55,wood,x,3.5,-13.8);cube(scene,.55,7,.55,wood,x,3.5,13)}
for(const x of [-12,12])for(const z of [-11,11]){cyl(scene,.5,.7,2,wood,x,1,z);ball(scene,1.1,green,x,2.7,z);ball(scene,.8,green,x+.6,3.4,z-.4)}
// Gold elevator with obvious doors, frame and animated indicator.
cube(scene,5.7,5.9,.8,blue,0,3,-14.0);cube(scene,4.5,4.7,.25,gold,0,2.45,-13.5);
const leftDoor=cube(scene,2.12,4.3,.29,cream,-1.12,2.32,-13.28),rightDoor=cube(scene,2.12,4.3,.29,cream,1.12,2.32,-13.28);
cube(scene,5.6,.65,.9,gold,0,5.95,-13.9);cube(scene,1.1,.55,.2,teal,0,5.98,-13.38);
const liftSign=cube(scene,2.8,.48,.16,dark,0,6.65,-13.65);
// Central fountain and circular seating
cyl(scene,2.4,2.65,.45,blue,0,.24,1,16);cyl(scene,1.9,1.9,.17,teal,0,.55,1,16);cyl(scene,.35,.5,1.45,cream,0,1.3,1);ball(scene,.48,teal,0,2.18,1);
// Workstations at sides
const robots=[];
function robot(x,z,color){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
cyl(g,.48,.58,.18,dark,0,.13,0);cube(g,.75,.8,.55,color,0,.95,0);ball(g,.57,cream,0,1.78,0);
cube(g,.57,.21,.12,dark,0,1.79,.49);ball(g,.07,teal,-.16,1.8,.57);ball(g,.07,teal,.16,1.8,.57);
for(const sx of [-1,1]){cube(g,.22,.63,.25,color,sx*.57,.98,0);cube(g,.25,.5,.28,dark,sx*.23,.35,0)}
cube(g,2.4,.17,1.1,wood,0,.83,-1.35);for(const sx of [-1,1])cube(g,.12,.78,.12,dark,sx,.4,-1.7);
cube(g,1.45,.88,.13,dark,0,1.55,-1.7);cube(g,1.25,.68,.14,teal,0,1.55,-1.59);
robots.push({g,x,z});return g}
robot(-8,-7,blue);robot(8,-7,red);
for(const x of [-9,9]){cyl(scene,1.4,1.6,.32,wood,x,.15,6,10);ball(scene,.9,green,x,1.2,6)}
// Character
const player=new THREE.Group();scene.add(player);cube(player,.7,.92,.42,blue,0,1.15,0);ball(player,.31,cream,0,1.87,0);
for(const s of [-1,1]){cube(player,.22,.7,.25,dark,s*.19,.4,0);cube(player,.19,.72,.2,blue,s*.47,1.12,0)}
cube(player,.36,.1,.18,gold,0,2.22,0);
const state={x:0,z:9,yaw:0,pitch:.3,stickX:0,stickY:0},obstacles=[{x:0,z:1,r:3.3},{x:-8,z:-7,r:2.4},{x:8,z:-7,r:2.4}];
const joy=document.getElementById('joy'),knob=document.getElementById('knob');let jid=null;
function reset(){state.stickX=state.stickY=0;knob.style.transform='translate(0px,0px)'}
function moveStick(e){const r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,rad=45,k=Math.min(1,rad/(Math.hypot(dx,dy)||1));state.stickX=dx*k/rad;state.stickY=dy*k/rad;knob.style.transform='translate('+dx*k+'px,'+dy*k+'px)'}
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);moveStick(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)moveStick(e)});
for(const name of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(name,e=>{if(e.pointerId===jid){jid=null;reset()}});
const keys=new Set();addEventListener('keydown',e=>{keys.add(e.code);if(e.code==='KeyE')openLift()});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();reset()});
let drag=null;renderer.domElement.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;state.yaw-=(e.clientX-drag.x)*.006;state.pitch=Math.max(-.08,Math.min(.8,state.pitch+(e.clientY-drag.y)*.003));drag.x=e.clientX;drag.y=e.clientY});
for(const name of ['pointerup','pointercancel'])renderer.domElement.addEventListener(name,()=>drag=null);
const dialog=document.getElementById('dialog'),buttons=document.getElementById('floorButtons');
const destinations=['Main Atrium','Research Lab','Robot Academy',"Teacher's Office",'Operations','Trading Floor'];
destinations.forEach((name,i)=>{const b=document.createElement('button');b.textContent=(i===0?'G':i)+' · '+name;b.onclick=()=>{document.getElementById('dialogTitle').textContent='Floor '+(i||'G')+' · '+name;document.getElementById('dialogDesc').textContent=i===0?'You are already in the atrium.':'Concept only: full destination scenes are scheduled for later phases.'};buttons.append(b)});
function openLift(){dialog.hidden=false;document.getElementById('dialogTitle').textContent='Golden Lift';document.getElementById('dialogDesc').textContent='Select a floor. Destination scenes are not implemented in this concept.'}
document.getElementById('lift').onclick=openLift;document.getElementById('close').onclick=()=>dialog.hidden=true;
document.getElementById('interact').onclick=()=>{if(state.z< -9&&Math.abs(state.x)<4)openLift();else{dialog.hidden=false;document.getElementById('dialogTitle').textContent='Living Foundry';document.getElementById('dialogDesc').textContent='Explore the atrium and approach the golden lift. Robots are illustrative in this art test.'}};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
scene.add(new THREE.HemisphereLight(0xffffff,0x6d8490,2.8));const sun=new THREE.DirectionalLight(0xffe3aa,3.3);sun.position.set(-9,16,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;scene.add(sun);
const clock=new THREE.Clock();function tick(){requestAnimationFrame(tick);const dt=Math.min(.05,clock.getDelta());
if(dialog.hidden){let f=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)-state.stickY,s=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+state.stickX;
const length=Math.hypot(f,s);if(length>.06){f/=length;s/=length;const speed=3.9*dt*Math.min(1,length),dx=(s*Math.cos(state.yaw)-f*Math.sin(state.yaw))*speed,dz=(-f*Math.cos(state.yaw)-s*Math.sin(state.yaw))*speed;
const clear=(x,z)=>obstacles.every(o=>Math.hypot(o.x-x,o.z-z)>o.r);
if(Math.abs(state.x+dx)<13.6&&clear(state.x+dx,state.z))state.x+=dx;if(state.z+dz>-11.4&&state.z+dz<12.2&&clear(state.x,state.z+dz))state.z+=dz;player.rotation.y=Math.atan2(-dx,-dz)}}
player.position.set(state.x,0,state.z);const target=new THREE.Vector3(state.x,1.5,state.z),desired=target.clone().add(new THREE.Vector3(Math.sin(state.yaw)*5,2+Math.sin(state.pitch)*3,Math.cos(state.yaw)*5));
camera.position.lerp(desired,Math.min(1,dt*8));camera.lookAt(target);
const near=state.z< -8&&Math.abs(state.x)<4;document.getElementById('prompt').hidden=!near;
const t=performance.now()*.001;robots.forEach((r,i)=>{r.g.children[1].rotation.z=Math.sin(t*2+i)*.07});renderer.render(scene,camera)}
camera.position.set(0,4,14);tick();