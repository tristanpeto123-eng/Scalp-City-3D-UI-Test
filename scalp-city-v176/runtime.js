const SC_RADIUS=.38,SC_HEIGHT=1.75;
let scPhysics={walkables:[],obstacles:[]},scBasis=null,scBlockedMessage='',scCameraManualUntil=0,scNear=null;
let scAutoSprint=true,scThreshold=.82,scCameraTrack=true;
const scAvatars=new Map();
window.ScalpCityCollisionAPI={registerAvatar(id,p,radius=.38){scAvatars.set(String(id),{...p,radius})},updateAvatar(id,p){const a=scAvatars.get(String(id));if(a)Object.assign(a,p)},removeAvatar(id){scAvatars.delete(String(id))},count(){return scAvatars.size}};
function scStage(n){const s=n.toLowerCase(),m=s.match(/_l(\d{1,2})_/);return s.startsWith('school_')?'s'+Number(m?.[1]||0):s.startsWith('tower_')?'t'+Number(m?.[1]||0):s.startsWith('concourse_')?'concourse':'outside'}
function scAlignFacade(model){let count=0;const dv=new DataView(model.bin);
 for(const n of model.j.nodes){if(n.mesh===undefined||!(n.name||'').startsWith('Exterior_v1_3'))continue;
 for(const p of model.j.meshes[n.mesh].primitives){const a=model.j.accessors[p.attributes.POSITION];if(!a||a.componentType!==5126||a.count%8)continue;
 const bv=model.j.bufferViews[a.bufferView],stride=bv.byteStride||12,base=(bv.byteOffset||0)+(a.byteOffset||0);
 for(let i=0;i<a.count;i+=8){let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,z0=Infinity,z1=-Infinity;
 for(let k=0;k<8;k++){const j=base+(i+k)*stride,x=dv.getFloat32(j,true),y=dv.getFloat32(j+4,true),z=dv.getFloat32(j+8,true);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);z0=Math.min(z0,z);z1=Math.max(z1,z)}
 let shift=0;
 if(y1-y0<.55&&x1-x0>.12&&z1-z0>.1){
 if(x0>-45&&x1<2.3&&z0>.55&&z1<12.2){
 if(y0>-20.3&&y1<-19.27)shift=-19.04-y1;
 else if(y1<14.1&&y0>13.25)shift=13.04-y0;
 }else if(x0>10.5&&x1<31.5&&z0>.5&&z1<41&&y0>-16&&y1<-14.95)shift=-14.68-y1
 }
 if(Math.abs(shift)>.08&&Math.abs(shift)<1.2){for(let k=0;k<8;k++){let off=base+(i+k)*stride+4;dv.setFloat32(off,dv.getFloat32(off,true)+shift,true)}count++}
 }}}
 window.__scalpCityFacade={alignedComponents:count};return count
}
function scBuildPhysics(model){const p={walkables:[],obstacles:[]};
 for(const n of model.j.nodes){if(n.mesh===undefined)continue;const name=(n.name||'').toLowerCase(),dest=scStage(name);
 const floor=name.includes('_floor')&&!name.includes('accent')||name.endsWith('_slab')||name.includes('walkable shared floor');
 const solid=name.includes('_partition')&&!name.includes('edge')||name.endsWith('_wall')||name.includes('_counter')||name.includes('_shelf')||name.includes('_desk_top')||name.includes('_bench')||name.includes('_console');
 if(!floor&&!solid)continue;
 for(const prim of model.j.meshes[n.mesh].primitives){const attr=prim.attributes?.POSITION;if(attr===undefined)continue;const v=model.data(attr),stride=v.length%24===0?24:v.length;
 for(let off=0;off+23<v.length;off+=stride){let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,z0=Infinity,z1=-Infinity;
 for(let j=off;j<off+stride;j+=3){const x=v[j],y=v[j+2],z=-v[j+1];x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);z0=Math.min(z0,z);z1=Math.max(z1,z)}
 const b={x0,x1,y0,y1,z0,z1,dest,kind:name};
 if(floor&&x1-x0>.7&&z1-z0>.7)p.walkables.push(b);
 if(solid&&y1-y0>.15&&x1-x0>.08&&z1-z0>.08)p.obstacles.push(b)
 }}}
 scPhysics=p;window.__scalpCityPhysics={walkables:p.walkables.length,obstacles:p.obstacles.length};return p
}
function scFloor(x,z){const d=actorState.destination;if(d==='outside')return 0;
 const hits=scPhysics.walkables.filter(b=>b.dest===d&&x>b.x0+.07&&x<b.x1-.07&&z>b.z0+.07&&z<b.z1-.07);
 return hits.length?Math.max(...hits.map(b=>b.y1)):null
}
function scSnapFloor(){const y=scFloor(actorState.x,actorState.z);if(y!==null)actorState.y=y;return y!==null}
function scBounds(x,z){const d=actorState.destination,r=SC_RADIUS;
 if(d==='outside')return !(x>-46-r&&x<2+r&&z>-13-r&&z<19+r)&&!(x>10.4-r&&x<31.6+r&&z>-10.65-r&&z<14.65+r);
 if(d==='concourse')return x>1.98+r&&x<10.52-r&&z>2.5+r&&z<8.7-r;
 if(d.startsWith('s'))return x>-46+r&&x<2-r&&z>-13+r&&z<19-r;
 if(d.startsWith('t')){const t=d==='t10';return x>(t?11.4:10.4)+r&&x<(t?30.6:31.6)-r&&z>-(t?9.65:10.65)+r&&z<(t?13.65:14.65)-r}
 return false
}
function scBlocked(x,z){const d=actorState.destination,r=SC_RADIUS;
 if(!scBounds(x,z)){scBlockedMessage='Building boundary';return true}
 for(const b of scPhysics.obstacles){if(b.dest!==d||b.y1<actorState.y+.18||b.y0>actorState.y+SC_HEIGHT)continue;
 const px=Math.max(b.x0,Math.min(b.x1,x)),pz=Math.max(b.z0,Math.min(b.z1,z));
 if((x-px)**2+(z-pz)**2<r*r){scBlockedMessage='Wall or furniture';return true}}
 for(const a of scAvatars.values()){if(Math.abs(a.y-actorState.y)<1.5&&(x-a.x)**2+(z-a.z)**2<(r+a.radius)**2){scBlockedMessage='Other avatar';return true}}
 if(d!=='outside'&&scFloor(x,z)===null){scBlockedMessage='No floor';return true}
 scBlockedMessage='';return false
}
function scMove(dx,dz){let ok=false,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));
 for(let i=0;i<steps;i++){const x=dx/steps,z=dz/steps;if(!scBlocked(actorState.x+x,actorState.z+z)){actorState.x+=x;actorState.z+=z;ok=true;continue}
 if(!scBlocked(actorState.x+x,actorState.z)){actorState.x+=x;ok=true}
 if(!scBlocked(actorState.x,actorState.z+z)){actorState.z+=z;ok=true}}
 scSnapFloor();return ok
}
function scTeleport(dest){if(dest==='concourse'){actorState.destination='concourse';actorState.x=6.2;actorState.y=.18;actorState.z=5.4;actorState.cut=true;actorState.mode='follow';cams.dist=8;cams.target=[6.2,2,5.4];$('place').textContent='Shared Concourse';$('follow').classList.add('active');$('overview').classList.remove('active');scSnapFloor();setStatus()}
 else{$('floor').value=dest;teleport();scSnapFloor()}
 scBasis=null;scNear=null
}
function scHotspot(){const d=actorState.destination,p=actorState;
 let spots=d==='outside'?[[-22,20.8,'Enter School','s0'],[21,16.7,'Enter Trading Tower','t0']]:
 d==='concourse'?[[2.9,5.4,'Enter School','s0'],[9.6,5.4,'Enter Tower','t0']]:
 d==='s0'?[[1,5.4,'Open concourse door','concourse'],[-3.8,5.2,'Stairs to Training','s1']]:
 d==='s1'?[[-3.8,5.2,'Stairs to Assessment','s2']]:
 d==='s2'?[[-3.8,5.2,'Stairs to Training','s1']]:
 d.startsWith('t')?[[21.5,-7.2,'Use lift','lift'],...(d==='t0'?[[11.1,5.4,'Open concourse door','concourse']]:[])]:[];
 return spots.map(a=>({x:a[0],z:a[1],label:a[2],target:a[3],distance:Math.hypot(p.x-a[0],p.z-a[1])})).filter(a=>a.distance<3).sort((a,b)=>a.distance-b.distance)[0]||null
}
function scShowAction(){scNear=scHotspot();const b=$('interactAction');b.hidden=!scNear;b.textContent=scNear?'E · '+scNear.label:'';
 $('collisionInfo').textContent=$('showCollisionInfo').checked?(scBlockedMessage||scPhysics.walkables.length+' floor surfaces · '+scPhysics.obstacles.length+' colliders'):''}
function scInteract(){const a=scHotspot();if(!a)return;if(a.target==='lift'){$('liftChoice').value=actorState.destination;$('liftPanel').hidden=false}else scTeleport(a.target)}
$('interactAction').onclick=scInteract;
$('liftClose').onclick=()=>{$('liftPanel').hidden=true};
$('liftGo').onclick=()=>{const d=$('liftChoice').value;$('liftPanel').hidden=true;scTeleport(d)};
$('autoSprint').onchange=e=>scAutoSprint=e.target.checked;
$('sprintRadius').oninput=e=>{scThreshold=+e.target.value/100;$('sprintRadiusLabel').textContent=e.target.value+'%'};
$('cameraTrack').onchange=e=>scCameraTrack=e.target.checked;
$('showCollisionInfo').onchange=scShowAction;
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e'&&!e.repeat&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))scInteract()});
canvas.addEventListener('pointermove',()=>{if(pointer.down)scCameraManualUntil=performance.now()+1600});
function scControlMovement(dt){let lr=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'))+touchMove.x;
 let fw=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'))+touchMove.y,strength=Math.hypot(lr,fw);
 if(strength>.03){if(scBasis===null)scBasis=cams.yaw;lr/=strength;fw/=strength;
 const running=keys.has('shift')||runPress||scAutoSprint&&Math.hypot(touchMove.x,touchMove.y)>=scThreshold;
 const c=Math.cos(scBasis),s=Math.sin(scBasis),vx=lr*c-fw*s,vz=-lr*s-fw*c;
 scMove(vx*(running?6:2.7)*Math.min(1,strength)*dt,vz*(running?6:2.7)*Math.min(1,strength)*dt);
 actorState.turnTo=Math.atan2(vx,vz);actorState.anim=running?'run':'walk';manualAnimation=false
 }else{scBasis=null;if(!manualAnimation)actorState.anim='idle';scSnapFloor()}
 scShowAction();setStatus()
}
function scFollowCamera(dt){if(!scCameraTrack||actorState.mode!=='follow'||actorState.anim==='idle'||performance.now()<scCameraManualUntil)return;
 const wanted=actorState.dir+Math.PI,delta=Math.atan2(Math.sin(wanted-cams.yaw),Math.cos(wanted-cams.yaw));
 cams.yaw+=delta*(1-Math.exp(-dt*3.6))
}