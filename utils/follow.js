// Mobile follow mode: the player steers climber 1; climber 2 is roped at a
// fixed spacing and jumps at the same moment (the jump button presses both
// players' jump keys). Climber 2 lands on any real ground within a normal
// drop and hops up onto ledges climber 1 is standing on. Only over a gap with
// nothing safe below does the rope catch it and haul it up level with climber 1.

import { LEVEL1_GROUND_END_X } from "./platforms.js";
import { FOOT_HALF_WIDTH } from "./collision.js";

export const FOLLOW_DIST = 1.8;  // horizontal gap; with HANG_LIMIT keeps spacing within 1–3 m
const HANG_LIMIT = 1.5;          // furthest climber 2 can hang below climber 1
const HAUL_SPEED = 7;            // units/sec climber 2 is pulled up
const SAFE_DROP = 3.5;           // ground this far below climber 1 is fine to land on
const CLIMBER_R = 0.4;           // matches collision.js / player standing offset

export function resetFollowTrail() {
  // Nothing to reset: the follower is positioned fresh every frame.
}

// Highest y a climber could stand at under x, at or below maxY (or -Infinity)
function standingHeightBelow(state, x, maxY) {
  let best = -Infinity;
  for (const p of state.platforms || []) {
    const standY = p.y + CLIMBER_R;
    if (standY <= maxY && Math.abs(x - p.mesh.position.x) < p.width / 2 + FOOT_HALF_WIDTH) {
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

  if (!c2.grounded) {
    // Is there real ground under the follower within a normal step down?
    const ground = standingHeightBelow(state, c2.x, c2.y + 0.05);
    const safeGround = ground >= c1.y - SAFE_DROP;

    if (!safeGround) {
      // Nothing safe below (a gap): the rope catches climber 2...
      if (c2.y < c1.y - HANG_LIMIT) {
        c2.y = c1.y - HANG_LIMIT;
        if (c2.vy < 0) c2.vy = 0;
      }
      // ...and hauls it up level with climber 1 while climber 1 is standing
      if (c1.grounded && c2.y < c1.y) {
        c2.y = Math.min(c1.y, c2.y + HAUL_SPEED * dt);
        c2.vy = 0;
      }
    }
    // Otherwise let it drop and land on that ground normally
  } else if (c1.grounded) {
    // Standing below a ledge that climber 1 is on: hop up onto it
    const ledge = standingHeightBelow(state, c2.x, c1.y + 0.05);
    if (ledge > c2.y + 0.3) {
      c2.vy = state.currentLevel === 2 ? 11 : 12; // same jump as the players
      c2.grounded = false;
    }
  }

  climber2.position.x = c2.x;
  climber2.position.y = c2.y;
}
