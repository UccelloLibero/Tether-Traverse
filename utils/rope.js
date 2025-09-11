let ropeMesh;
// ring buffer of recent distance samples (numbers)
let ropeDistanceSamples = [];
const MAX_SAMPLES = 300;
let lastSampleTime = 0;
const SAMPLE_INTERVAL_MS = 200; // ~5Hz sampling

// thresholds (can be tuned)
export const MIN_SAFE_DISTANCE = 1.0; // < this => "too close"
export const maxRopeLength = 3; // Maximum length of the rope (exported)
// Note: maxRopeLength also exported below for backward compatibility (kept name)

// internal helper to push sample into ring buffer
function pushSample(dist) {
  if (ropeDistanceSamples.length >= MAX_SAMPLES) {
    ropeDistanceSamples.shift();
  }
  ropeDistanceSamples.push(dist);
}

export function initRope(scene, climber1, climber2) {
  const ropePath = new THREE.CatmullRomCurve3([
    climber1.position.clone(),
    climber2.position.clone()
  ]);
  const ropeGeometry = new THREE.TubeGeometry(ropePath, 20, 0.02, 8, false);
  const ropeMaterial = new THREE.MeshBasicMaterial({ color: 0xff5800 });

  ropeMesh = new THREE.Mesh(ropeGeometry, ropeMaterial);
  ropeMesh.position.z = -0.1;
  scene.add(ropeMesh);
}

export function updateRope(climber1, climber2, camera) {
  if (!ropeMesh) return;

  const ropePoints = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const pos = new THREE.Vector3().lerpVectors(climber1.position, climber2.position, t);
    pos.y -= Math.sin(t * Math.PI) * 0.3;
    ropePoints.push(pos);
  }

  const newCurve = new THREE.CatmullRomCurve3(ropePoints);
  ropeMesh.geometry.dispose();
  ropeMesh.geometry = new THREE.TubeGeometry(newCurve, 20, 0.01, 8, false);
}

export function handleRopePhysics(state, climber1, climber2, isMobile, pullStrength, maxRopeLen = maxRopeLength, dt = 0.016) {
  const dx = climber1.position.x - climber2.position.x;
  const dy = climber1.position.y - climber2.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // prevent climber overlap
  if (state.c2.x > state.c1.x - 0.2) {
    state.c2.x = state.c1.x - 0.2;
  }

  // If rope over-extended, apply symmetric soft correction toward midpoint
  if (dist > maxRopeLen) {
    const excess = dist - maxRopeLen;
    const nx = dx / dist;
    const ny = dy / dist;
    const correction = excess * 0.5;

    // apply a smoother correction scaled by dt
    const factor = 6 * dt; // tuning constant
    state.c1.x -= nx * correction * factor;
    state.c2.x += nx * correction * factor;
    climber1.position.y -= ny * correction * factor;
    climber2.position.y += ny * correction * factor;
  } else if (dist < 0.6) {
    // if extremely close, gently push them apart a bit to reduce collision jitter
    const push = (0.6 - dist) * 0.25 * dt;
    state.c1.x -= (dx / dist || 0) * push;
    state.c2.x += (dx / dist || 0) * push;
  }

  // Periodic sampling (keeps recent history) for safety stats
  const now = performance.now();
  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = now;
    pushSample(dist);
  }
}

// Return raw distances (copy)
export function getRopeDistanceSamples() {
  return ropeDistanceSamples.slice();
}

// Return summary stats: counts of safe / too close / too far and total
export function getRopeStats() {
  const stats = { total: 0, safe: 0, tooClose: 0, tooFar: 0 };
  for (const d of ropeDistanceSamples) {
    stats.total++;
    if (d < MIN_SAFE_DISTANCE) stats.tooClose++;
    else if (d > maxRopeLength) stats.tooFar++;
    else stats.safe++;
  }
  return stats;
}

// Safe percentage: proportion of samples that are within [MIN_SAFE_DISTANCE, maxRopeLength]
export function getRopeSafetyPercent() {
  const s = getRopeStats();
  if (s.total === 0) return 0;
  return Math.round((s.safe / s.total) * 100);
}

export function cleanupRope(scene) {
    if (ropeMesh) {
        scene.remove(ropeMesh);
        ropeMesh.geometry.dispose();
        ropeMesh.material.dispose();
        ropeMesh = null;
    }

    ropeDistanceSamples = []; // Clean any collected data for level 2
    lastSampleTime = 0;
}