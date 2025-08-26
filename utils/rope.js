let ropeMesh;
let ropeDistanceSamples = [];

export const maxRopeLength = 3; // Maximum length of the rope

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

export function handleRopePhysics(state, climber1, climber2, isMobile, pullStrength, maxRopeLength, dt = 0.016) {
  const dx = climber1.position.x - climber2.position.x;
  const dy = climber1.position.y - climber2.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (state.c2.x > state.c1.x - 0.2) {
    state.c2.x = state.c1.x - 0.2;
  }

  if (dist > maxRopeLength) {
    const excess = dist - maxRopeLength;
    const nx = dx / dist;
    const ny = dy / dist;
    const correction = excess * 0.5; // split correction

    // Apply soft correction scaled by dt for smoothness
    state.c1.x -= nx * correction * (8 * dt);
    state.c2.x += nx * correction * (8 * dt);
    climber1.position.y -= ny * correction * (8 * dt);
    climber2.position.y += ny * correction * (8 * dt);
  }

  if (Math.random() < 0.1) {
    ropeDistanceSamples.push(dist);
  }
}

export function getRopeDistanceSamples() {
  return ropeDistanceSamples;
}

export function cleanupRope(scene) {
    if (ropeMesh) {
        scene.remove(ropeMesh);
        ropeMesh.geometry.dispose();
        ropeMesh.material.dispose();
        ropeMesh = null;
    }

    ropeDistanceSamples = []; // Clean any collected data for level 2
}