import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const $=id=>document.getElementById(id);
export const FLOORS=[
{name:'Mission Control',role:'Operations hub',accent:0xd9bd8b,stations:[['Director','System overview','mission',-6,-4],['Research','Strategy coordination','lab',6,-4]]},
{name:'Research Lab',role:'Historical strategy research',accent:0x7ac5d0,stations:[['Researcher','Strategy validation','lab',-6,-4],['NEO','Pattern memory','neo',6,-4]]},
{name:'Robot Academy',role:'Training classrooms',accent:0xb9a4f2,stations:[['Pupil','Training illustration','academy',-6,-4],['Tutor','Lesson review','teacher',6,-4]]},
{name:"Teacher's Office",role:'Independent examination',accent:0x82d9ca,stations:[['Teacher','Evidence review','teacher',-6,-4],['Checker','Verification','teacher',6,-4]]},
{name:'Trading Floor',role:'Paper-gated verification only',accent:0xe0aa78,stations:[['Risk Desk','No real-money order controls','paper',-6,-4],['Evidence Desk','Published records','monitor',6,-4]]},
{name:'Operations',role:'Scheduler and telemetry',accent:0x89c7ee,stations:[['Training Monitor','Saved measurements','monitor',-6,-4],['Replay','Historical 5m candles','replay',6,-4]]}
];
let floor=0,paused=false,scene,camera,renderer,stage,avatar,clock,ready=false;
const obstacles=[],stations=[],keys=new Set(),stick={x:0,y:0};
const player=new THREE.Vector3(0,0,5),look={yaw:0,pitch:.27},ray=new THREE.Raycaster();
const mat=(c,r=.8)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:.12});
const materials={floor:mat(0x4d5152),wall:mat(0x8c9294),trim:mat(0x2a343c),wood:mat(0x7c6250),glass:new THREE.MeshStandardMaterial({color:0xa6c4c8,transparent:true,opacity:.28,side:THREE.DoubleSide}),skin:mat(0xc7a17c),shirt:mat(0x283845),trousers:mat(0x24272e)};
function block(parent,w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o;}
function makeAvatar(){avatar=new THREE.Group();scene.add(avatar);
block(avatar,.62,.8,.34,materials.shirt,0,1.18,0);
const head=new THREE.Mesh(new THREE.SphereGeometry(.23,12,10),materials.skin);head.position.y=1.82;avatar.add(head);
for(const side of [-1,1]){block(avatar,.19,.72,.22,materials.trousers,side*.17,.43,0);block(avatar,.18,.68,.2,materials.shirt,side*.42,1.14,0);}
block(avatar,.64,.09,.32,materials.trim,0,.84,0);
avatar.position.copy(player);
}
function room(){
stage=new THREE.Group();scene.add(stage);obstacles.length=0;stations.length=0;
const accent=mat(FLOORS[floor].accent,.4);
block(stage,25,.4,25,materials.floor,0,-.2,0);
block(stage,25,4,.3,materials.wall,0,2,12.4);
for(const x of [-12.4,12.4]){block(stage,.3,4,25,materials.wall,x,2,0);for(let z=-9;z<11;z+=5)block(stage,.35,2.9,3.6,materials.glass,x,2.05,z);}
block(stage,10,4,.35,materials.wall,-7.5,2,-12.4);block(stage,10,4,.35,materials.wall,7.5,2,-12.4);
block(stage,3.8,3.4,.35,materials.trim,0,1.7,-12.25);
block(stage,.08,3,.4,accent,0,1.6,-11.99);
for(const x of [-10,10]){block(stage,.6,4,.6,materials.trim,x,2,-10);block(stage,.6,4,.6,materials.trim,x,2,10);}
for(const [name,role,app,x,z] of FLOORS[floor].stations){
const group=new THREE.Group();group.position.set(x,0,z);group.userData.station={name,role,app};
block(group,3,.15,1.2,materials.wood,0,.9,0);
for(const side of [-1.3,1.3])block(group,.12,.85,.12,materials.trim,side,.42,0);
block(group,1.5,.9,.1,materials.trim,0,1.52,-.35);
block(group,1.3,.7,.12,accent,0,1.52,-.27);
const bot=block(group,.55,.7,.4,materials.trim,0,1.28,1.05);
const botHead=new THREE.Mesh(new THREE.SphereGeometry(.27,10,8),accent);botHead.position.set(0,1.84,1.05);group.add(botHead);
stage.add(group);stations.push({group,head:botHead,name,role,app,x,z});obstacles.push({x,z,r:2.1});
}
for(const x of [-9,0,9]){const light=new THREE.PointLight(0xffe7c3,13,12);light.position.set(x,3.5,2);stage.add(light);}
const placard=document.createElement('canvas');placard.width=1024;placard.height=128;
const c=placard.getContext('2d');c.fillStyle='#222b32';c.fillRect(0,0,1024,128);c.fillStyle='#f2e7d4';c.font='bold 54px sans-serif';c.fillText(FLOORS[floor].name.toUpperCase(),38,82);
const tex=new THREE.CanvasTexture(placard);tex.colorSpace=THREE.SRGBColorSpace;
const sign=new THREE.Mesh(new THREE.PlaneGeometry(7,.875),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));sign.position.set(0,3.1,12.18);sign.rotation.y=Math.PI;stage.add(sign);
}
function teleport(index){if(!Number.isInteger(index)||index<0||index>=FLOORS.length)return;
floor=index;if(stage){scene.remove(stage);stage.traverse(o=>{o.geometry?.dispose?.();if(o.material&&!Object.values(materials).includes(o.material)){const a=Array.isArray(o.material)?o.material:[o.material];a.forEach(m=>{m.map?.dispose?.();m.dispose?.();});}});}
player.set(0,0,5);look.yaw=0;look.pitch=.27;stick.x=stick.y=0;resetStick();keys.clear();room();hud();cameraUpdate(1);
}
window.ScalpWorld={floors:FLOORS,teleport};
function hud(){const f=FLOORS[floor];$('floorIndex').textContent='FLOOR '+String(floor+1).padStart(2,'0')+' / 06';$('floorName').textContent=f.name;$('floorRole').textContent=f.role;
$('liftTarget').textContent='Next: '+FLOORS[(floor+1)%FLOORS.length].name;$('robotInfo').hidden=true;
document.querySelectorAll('#floorMenu button').forEach((b,i)=>b.setAttribute('aria-current',String(i===floor)));
window.dispatchEvent(new CustomEvent('scalp:floor',{detail:{index:floor,name:f.name}}));}
function resetStick(){stick.x=stick.y=0;const k=$('joystickKnob');if(k)k.style.transform='translate(0px,0px)';}
function cameraUpdate(alpha){const target=new THREE.Vector3(player.x,1.35,player.z);
const back=new THREE.Vector3(Math.sin(look.yaw)*Math.cos(look.pitch),Math.sin(look.pitch),Math.cos(look.yaw)*Math.cos(look.pitch));
const desired=target.clone().addScaledVector(back,4.5);
desired.x=Math.max(-11.4,Math.min(11.4,desired.x));desired.z=Math.max(-11.3,Math.min(11.3,desired.z));
camera.position.lerp(desired,alpha);camera.lookAt(target);}
function tick(){requestAnimationFrame(tick);if(!ready)return;
const dt=Math.min(clock.getDelta(),.05);
if(!paused){let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-stick.y;
let side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+stick.x;
const magnitude=Math.hypot(forward,side),strength=Math.min(1,magnitude);
if(strength>.06){forward/=magnitude;side/=magnitude;
const speed=(keys.has('ShiftLeft')?5:3.2)*strength*dt;
const dx=(side*Math.cos(look.yaw)-forward*Math.sin(look.yaw))*speed;
const dz=(-forward*Math.cos(look.yaw)-side*Math.sin(look.yaw))*speed;
const clear=(x,z)=>obstacles.every(o=>Math.hypot(o.x-x,o.z-z)>o.r);
if(Math.abs(player.x+dx)<11.6&&clear(player.x+dx,player.z))player.x+=dx;
if(player.z+dz>-10.8&&player.z+dz<11.4&&clear(player.x,player.z+dz))player.z+=dz;
avatar.rotation.y=Math.atan2(-dx,-dz);avatar.position.copy(player);
const t=performance.now()*.011;avatar.children.slice(1).forEach((p,i)=>{if(i>=1&&i<=4)p.rotation.x=Math.sin(t+i*Math.PI)*.2*strength;});
}
if(keys.has('ArrowLeft'))look.yaw+=dt*1.4;if(keys.has('ArrowRight'))look.yaw-=dt*1.4;
cameraUpdate(Math.min(1,dt*9));
$('liftPrompt').hidden=Math.hypot(player.x,player.z+10.4)>2.7;
}
renderer.render(scene,camera);
}
function inspect(e){const rect=$('world').getBoundingClientRect(),mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
ray.setFromCamera(mouse,camera);const hits=ray.intersectObjects(stations.map(s=>s.group),true);
if(!hits.length||hits[0].distance>12)return;let n=hits[0].object;while(n&&!n.userData.station)n=n.parent;if(!n)return;
const {name,role,app}=n.userData.station;$('robotLabel').textContent='ILLUSTRATIVE STATION';$('robotName').textContent=name;$('robotDescription').textContent=role+'. Animation is not evidence of running computation.';
$('robotInfo').hidden=false;$('robotOpen').onclick=()=>window.dispatchEvent(new CustomEvent('scalp:open-app',{detail:{app}}));}
function events(){
window.addEventListener('resize',()=>{if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false);});
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
if(e.code==='KeyP'&&!e.repeat)$('phoneToggle').click();
if(e.code==='KeyE'&&!$('liftPrompt').hidden&&!e.repeat)teleport((floor+1)%FLOORS.length);
if(e.code==='Escape'){$('robotInfo').hidden=true;$('floorMenu').hidden=true;}
if(/^(Key[WASD]|Arrow(Up|Down|Left|Right)|ShiftLeft)$/.test(e.code)){keys.add(e.code);e.preventDefault();}
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();resetStick();});
const base=$('joystickBase'),knob=$('joystickKnob');let pointer=null;
function move(e){const r=base.getBoundingClientRect(),radius=r.width*.34,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2;
const scale=Math.min(1,radius/(Math.hypot(dx,dy)||1));stick.x=dx*scale/radius;stick.y=dy*scale/radius;knob.style.transform='translate('+dx*scale+'px,'+dy*scale+'px)';}
base.addEventListener('pointerdown',e=>{e.preventDefault();pointer=e.pointerId;base.setPointerCapture(e.pointerId);move(e);});
base.addEventListener('pointermove',e=>{if(e.pointerId===pointer)move(e);});
function release(e){if(e.pointerId!==pointer)return;pointer=null;resetStick();}
for(const ev of ['pointerup','pointercancel','lostpointercapture'])base.addEventListener(ev,release);
let drag=null,moved=false;const canvas=$('world');
canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};moved=false;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||paused)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;
look.yaw-=dx*.005;look.pitch=Math.max(-.12,Math.min(.65,look.pitch+dy*.003));drag.x=e.clientX;drag.y=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;drag=null;if(!moved&&!paused)inspect(e);});
$('closeInfo').onclick=()=>$('robotInfo').hidden=true;
$('liftButton').onclick=()=>teleport((floor+1)%FLOORS.length);
$('floorsToggle').onclick=()=>{const m=$('floorMenu');m.hidden=!m.hidden;$('floorsToggle').setAttribute('aria-expanded',String(!m.hidden));};
FLOORS.forEach((f,i)=>{const b=document.createElement('button');b.textContent=String(i+1).padStart(2,'0')+' · '+f.name+' ↗';b.onclick=()=>teleport(i);$('floorMenu').append(b);});
window.addEventListener('scalp:phone-state',e=>{paused=Boolean(e.detail?.open);keys.clear();resetStick();});
}
try{
scene=new THREE.Scene();scene.background=new THREE.Color(0x7b96a5);scene.fog=new THREE.Fog(0x7b96a5,24,85);
camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,100);
renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
scene.add(new THREE.HemisphereLight(0xe5f1ff,0x52606b,2.3));
const sun=new THREE.DirectionalLight(0xffdfb1,2.5);sun.position.set(-7,13,9);scene.add(sun);
makeAvatar();room();cameraUpdate(1);events();hud();clock=new THREE.Clock();ready=true;requestAnimationFrame(tick);
}catch(error){console.error('V2 scene unavailable',error);$('fallback').hidden=false;$('fallback').querySelector('p').textContent='3D rendering failed; phone apps remain available.';}
