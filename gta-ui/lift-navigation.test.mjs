import test from 'node:test';
import assert from 'node:assert/strict';
import {nearLift,chooseLiftFloor,TOWER_FLOORS} from './lift-navigation.mjs';
test('only physical doorway proximity allows E lift access',()=>{
 assert.equal(nearLift(0,-10.4),true);
 assert.equal(nearLift(2.71,-10.4),false);
 assert.equal(nearLift(0,5),false);
 assert.equal(nearLift(Infinity,-10.4),false);
});
test('floor navigation chooses exact valid destination, no forced next-floor skip',()=>{
 assert.equal(TOWER_FLOORS,6);
 assert.deepEqual(chooseLiftFloor(0,5),{target:5,changed:true});
 assert.deepEqual(chooseLiftFloor(5,0),{target:0,changed:true});
 assert.deepEqual(chooseLiftFloor(2,2),{target:2,changed:false});
 for(const idx of [-1,6,1.4,NaN])assert.throws(()=>chooseLiftFloor(0,idx),RangeError);
});
