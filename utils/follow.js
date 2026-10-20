// Mobile follow mode: the player steers climber 1 and climber 2 walks the same
// route a fixed horizontal distance behind, making each jump from the same spot
// a moment later, so the pair stays side by side instead of stacking up.

export const FOLLOW_DIST = 2.0; // horizontal gap: middle of the ideal 1–3 m spacing
const TELEPORT_DIST = 1.5;      // leader moved this far in one frame = reset/level change
const MIN_STEP = 0.03;          // record a new trail point after this much movement

// Leader's recent path, oldest → newest: { x, y, g (grounded) }. x never
// decreases along the trail (points ahead are dropped when walking back).
let trail = [];

export function resetFollowTrail() {
  trail = [];
}

export function updateFollower(state, climber2) {
  const c1 = state.c1;
  const c2 = state.c2;

  const last = trail[trail.length - 1];
  if (last && Math.hypot(c1.x - last.x, c1.y - last.y) > TELEPORT_DIST) {
    trail = []; // fall reset, restart, or new level
  }

  if (trail.length === 0) {
    // Wait until the leader is standing (e.g. after dropping in at level start),
    // then line the follower up on the same ground. Until then climber 2 just
    // uses its own physics.
    if (!c1.grounded) return;
    trail = [
      { x: c1.x - FOLLOW_DIST, y: c1.y, g: true },
      { x: c1.x, y: c1.y, g: true },
    ];
  } else {
    // Walking back left: drop path that is now ahead of the leader
    while (trail.length > 1 && trail[trail.length - 1].x > c1.x + 0.01) trail.pop();

    const tip = trail[trail.length - 1];
    if (Math.hypot(c1.x - tip.x, c1.y - tip.y) >= MIN_STEP) {
      trail.push({ x: c1.x, y: c1.y, g: !!c1.grounded });
    }
  }

  // Follower stands where the leader was when it was FOLLOW_DIST further left
  const targetX = c1.x - FOLLOW_DIST;
  let spot;
  if (trail[0].x > targetX) {
    // Leader backed up past the start of the path: extend it on the same ground
    spot = { x: targetX, y: trail[0].y, g: trail[0].g };
    trail.unshift({ ...spot });
  } else {
    let i = trail.length - 1;
    while (trail[i].x > targetX) i--;
    const a = trail[i];
    const b = trail[i + 1] || a;
    const t = b.x === a.x ? 1 : (targetX - a.x) / (b.x - a.x);
    // Same x can appear twice (a jump straight up); take the later point
    spot = { x: targetX, y: a.y + (b.y - a.y) * t, g: t < 0.5 ? a.g : b.g };
    if (i > 0) trail.splice(0, i); // forget path the follower has passed
  }

  c2.x = spot.x;
  c2.y = spot.y;
  c2.vy = 0;
  c2.grounded = spot.g;
  climber2.position.x = spot.x;
  climber2.position.y = spot.y;
}
