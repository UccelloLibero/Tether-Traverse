// Mobile follow mode: the player steers climber 1; climber 2 is roped at a
// fixed spacing and jumps at the same moment (the jump button presses both
// players' jump keys). If climber 2 comes up short with nothing to land on
// (over a gap, or below the next ledge), the rope catches it and hauls it up
// level with climber 1 until there's ground under it again.

import { LEVEL1_GROUND_END_X } from "./platforms.js";

export const FOLLOW_DIST = 1.8;  // horizontal gap; with HANG_LIMIT keeps spacing within 1–3 m
const HANG_LIMIT = 1.5;          // furthest climber 2 can hang below climber 1
const HAUL_SPEED = 7;            // units/sec climber 2 is pulled up
const CLIMBER_R = 0.4;           // matches collision.js / player standing offset

export function resetFollowTrail() {
  // Nothing to reset: the follower is positioned fresh every frame.
}

// Highest y a climber could stand at under x, at or below maxY (or -Infinity)
function standingHeightBelow(state, x, maxY) {
  let best = -Infinity;
  for (const p of state.platforms || []) {
    const standY = p.y + CLIMBER_R;
    if (standY <= maxY && Math.abs(x - p.mesh.position.x) < p.width / 2 + CLIMBER_R) {
      best = Math.max(best, standY);
    }
  }
  // Floors that aren't in the platform list
  if (state.currentLevel === 1 && x < LEVEL1_GROUND_END_X && -4.5 <= maxY) best = Math.max(best, -4.5);
  if (state.currentLevel === 2 && x < 216 && 20 <= maxY) best = Math.max(best, 20);
  return best;
}

export function updateFollower(state, climber2, dt = 0.016) {
  const c1 = state.c1;
  const c2 = state.c2;

  // Fixed horizontal spacing
  c2.x = c1.x - FOLLOW_DIST;

  // The rope never lets climber 2 drop more than HANG_LIMIT below climber 1
  if (c2.y < c1.y - HANG_LIMIT) {
    c2.y = c1.y - HANG_LIMIT;
    if (c2.vy < 0) c2.vy = 0;
  }

  // Leader standing, follower in the air with nothing within rope reach to land
  // on: haul it up level with the leader and hold it there
  if (c1.grounded && !c2.grounded) {
    const landing = standingHeightBelow(state, c2.x, c2.y + 0.05);
    if (landing < c1.y - HANG_LIMIT) {
      c2.y = Math.min(c1.y, c2.y + HAUL_SPEED * dt);
      c2.vy = 0;
    }
  }

  climber2.position.x = c2.x;
  climber2.position.y = c2.y;
}
