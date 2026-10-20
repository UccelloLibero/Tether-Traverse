// Mobile follow mode: the player steers climber 1 and climber 2 retraces
// climber 1's exact path (every step and jump) a fixed distance behind, so the
// rope team always holds the ideal spacing.

export const FOLLOW_DIST = 2.0; // middle of the ideal 1–3 m rope spacing
const TELEPORT_DIST = 1.5;      // leader moved this far in one frame = reset/level change
const MIN_STEP = 0.03;          // record a new trail point after this much movement

// Leader's recent path, oldest → newest: { x, y, g (grounded) }
let trail = [];

export function resetFollowTrail() {
  trail = [];
}

function seedTrail(c1) {
  trail = [
    { x: c1.x - FOLLOW_DIST, y: c1.y, g: true },
    { x: c1.x, y: c1.y, g: !!c1.grounded },
  ];
}

export function updateFollower(state, climber2) {
  const c1 = state.c1;
  const c2 = state.c2;

  const last = trail[trail.length - 1];
  if (!last || Math.hypot(c1.x - last.x, c1.y - last.y) > TELEPORT_DIST) {
    // Start of a level, a fall reset, or a restart
    seedTrail(c1);
  } else {
    // Walking back left: drop path that is now ahead of the leader so the
    // follower backs up too instead of walking into them
    while (trail.length > 1 && trail[trail.length - 1].x > c1.x + 0.01) trail.pop();

    const tip = trail[trail.length - 1];
    if (Math.hypot(c1.x - tip.x, c1.y - tip.y) >= MIN_STEP) {
      trail.push({ x: c1.x, y: c1.y, g: !!c1.grounded });
    }
  }

  // Walk back along the path from the leader until FOLLOW_DIST is used up
  let remaining = FOLLOW_DIST;
  let prev = { x: c1.x, y: c1.y, g: !!c1.grounded };
  let spot = null;
  let cutIndex = 0;
  for (let i = trail.length - 1; i >= 0; i--) {
    const p = trail[i];
    const seg = Math.hypot(prev.x - p.x, prev.y - p.y);
    if (seg >= remaining) {
      const t = seg === 0 ? 0 : remaining / seg;
      spot = { x: prev.x + (p.x - prev.x) * t, y: prev.y + (p.y - prev.y) * t, g: p.g && prev.g };
      cutIndex = i;
      break;
    }
    remaining -= seg;
    prev = p;
  }

  if (!spot) {
    // Path too short (leader backed up past where we started): extend it
    // straight back from the oldest point
    const first = trail[0];
    spot = { x: first.x - remaining, y: first.y, g: first.g };
    trail.unshift({ ...spot });
  } else if (cutIndex > 0) {
    // Forget path the follower has already walked
    trail.splice(0, cutIndex);
  }

  c2.x = spot.x;
  c2.y = spot.y;
  c2.vy = 0;
  c2.grounded = spot.g;
  climber2.position.x = spot.x;
  climber2.position.y = spot.y;
}
