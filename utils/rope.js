let ropeMesh;
let ropeDistanceSamples = [];

export const maxRopeLength = 2.5; // Maximum length of the rope

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

export function handleRopePhysics(state, climber1, climber2, isMobile, pullStrength, maxRopeLength) {
  const dx = climber1.position.x - climber2.position.x;
  const dy = climber1.position.y - climber2.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (state.c2.x > state.c1.x - 0.2) {
    state.c2.x = state.c1.x - 0.2;
    state.c2.x -= 0.02;
  }

  if (dist > maxRopeLength) {
    const t = Date.now() * 0.002;
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;
    const jiggleStrength = 0.5;
    const frequency = 12;
    const decay = 1.0;

    const dxMid = (climber1.position.x + climber2.position.x) / 2;
    const dyMid = (climber1.position.y + climber2.position.y) / 2;

    const dist1 = Math.hypot(climber1.position.x - dxMid, climber1.position.y - dyMid);
    const dist2 = Math.hypot(climber2.position.x - dxMid, climber2.position.y - dyMid);

    if (dist2 > dist1) {
      const jiggleX = Math.cos(perpAngle) * Math.sin(t * frequency) * jiggleStrength * decay;
      const jiggleY = Math.sin(perpAngle) * Math.cos(t * frequency * 0.8) * jiggleStrength * decay;
      climber2.position.x += jiggleX;
      climber2.position.y += jiggleY;
    }

    if (isMobile) {
      state.c2.x += Math.cos(angle) * pullStrength;
      climber2.position.y += Math.sin(angle) * pullStrength;
    } else {
      state.c1.x = dxMid + Math.cos(angle) * maxRopeLength / 2;
      state.c2.x = dxMid - Math.cos(angle) * maxRopeLength / 2;
      climber1.position.y = dyMid + Math.sin(angle) * maxRopeLength / 2;
      climber2.position.y = dyMid - Math.sin(angle) * maxRopeLength / 2;
    }
  }

  if (Math.random() < 0.1) {
    ropeDistanceSamples.push(dist);
  }
}

export function getRopeDistanceSamples() {
  return ropeDistanceSamples;
}