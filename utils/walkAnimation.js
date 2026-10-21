// Walk cycle for the climber sprites, made by gently warping the existing art
// (like puppet animation) instead of separate drawn frames:
//   - legs: the area below the hips bends so each boot steps forward and lifts
//   - arms: the mitten areas at the sides swing opposite to the legs
//   - body: bobs with each step and waddles side to side like a penguin
// Jumping tucks the feet and lifts the arms; standing still eases back to the
// original drawing.

const COLS = 16;
const ROWS = 24;
const STEP_LENGTH = 0.9; // world units travelled per full left+right step cycle

// Where things are in each sprite, as fractions of the image (v: 0 = bottom)
export const RIG_LEVEL1 = { legTop: 0.22, footBottom: 0.08, armV: 0.33 };
export const RIG_LEVEL2 = { legTop: 0.27, footBottom: 0.04, armV: 0.36 };

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Swap the climber's flat plane for a finer one that can bend
export function makeWalkable(mesh, rig) {
  // Measure the plane rather than reading geometry.parameters: a cloned
  // geometry (climber 2) doesn't keep .parameters in this three.js version
  mesh.geometry.computeBoundingBox();
  const box = mesh.geometry.boundingBox;
  const width = box.max.x - box.min.x;
  const height = box.max.y - box.min.y;
  const geometry = new THREE.PlaneGeometry(width, height, COLS, ROWS);
  mesh.geometry.dispose();
  mesh.geometry = geometry;

  const base = geometry.attributes.position.array.slice();
  mesh.userData.walk = {
    rig,
    width,
    height,
    base,
    phase: 0,
    amount: 0, // 0 = standing pose, 1 = full stride
    air: 0,    // 0 = on the ground, 1 = mid-jump pose
    lastX: mesh.position.x,
  };
}

export function updateWalk(mesh, stateObj, dt) {
  const w = mesh && mesh.userData.walk;
  if (!w) return;

  const dx = mesh.position.x - w.lastX;
  w.lastX = mesh.position.x;

  const grounded = !!stateObj.grounded;
  const moving = grounded && Math.abs(dx) > 0.0005 && Math.abs(dx) < 0.5; // ignore teleports

  if (moving) w.phase += (Math.abs(dx) / STEP_LENGTH) * Math.PI * 2;

  // Ease between poses so starts/stops/landings don't snap
  const ease = 1 - Math.exp(-dt * 12);
  w.amount += ((moving ? 1 : 0) - w.amount) * ease;
  w.air += ((grounded ? 0 : 1) - w.air) * ease;

  const { rig, width, height, base } = w;
  const pos = mesh.geometry.attributes.position;
  const arr = pos.array;

  const s = Math.sin(w.phase);
  const c = Math.cos(w.phase);
  const stride = 0.05 * w.amount;          // how far a boot swings forward/back
  const lift = 0.11 * w.amount;            // how high the stepping boot rises
  const armSwing = 0.07 * w.amount;
  const bob = Math.abs(s) * 0.035 * w.amount;
  const waddle = s * 0.05 * w.amount;      // radians of side-to-side lean
  const tuck = 0.07 * w.air;               // feet pulled up while jumping
  const armRaise = 0.06 * w.air;

  const pivotY = -height / 2 + rig.footBottom * height;
  const cosW = Math.cos(waddle);
  const sinW = Math.sin(waddle);

  for (let i = 0; i < arr.length; i += 3) {
    let x = base[i];
    let y = base[i + 1];
    const u = x / width + 0.5;
    const v = y / height + 0.5;

    // Which leg/arm this point belongs to: -1 left, +1 right, blended near the middle
    const side = smoothstep(0.42, 0.58, u) * 2 - 1;

    // Legs: weight 0 at the hips, 1 at the boots
    const legW = 1 - smoothstep(rig.footBottom + 0.04, rig.legTop, v);
    if (legW > 0) {
      const leftLift = Math.max(0, c);
      const rightLift = Math.max(0, -c);
      const sideLift = side < 0 ? leftLift : rightLift;
      x += -side * s * stride * legW;
      y += (sideLift * lift + tuck) * legW;
    }

    // Arms: the outer edges around mitten height swing opposite the legs
    const armW =
      smoothstep(0.22, 0.4, Math.abs(u - 0.5)) *
      (1 - smoothstep(0.06, 0.16, Math.abs(v - rig.armV)));
    if (armW > 0) {
      x += side * s * armSwing * armW;
      y += armRaise * armW;
    }

    // Whole body: lean around the feet, then bob
    const ry = y - pivotY;
    const rx = x * cosW - ry * sinW;
    const ryRot = x * sinW + ry * cosW;
    arr[i] = rx;
    arr[i + 1] = ryRot + pivotY + bob;
  }

  pos.needsUpdate = true;
}
