// Deterministic lift eligibility and destination selection. No WebGL dependency.
export const TOWER_FLOORS=6;
export const LIFT_RANGE=2.7;
export function nearLift(x,z){
 return Number.isFinite(x)&&Number.isFinite(z)&&
   Math.hypot(x,z+10.4)<=LIFT_RANGE;
}
export function chooseLiftFloor(current,target,count=TOWER_FLOORS){
 if(!Number.isInteger(count)||count<2||count>40||
    !Number.isInteger(current)||current<0||current>=count||
    !Number.isInteger(target)||target<0||target>=count)
  throw new RangeError('Invalid lift floor selection');
 return {target,changed:target!==current};
}
