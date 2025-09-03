export function createGround(scene, platforms) {
    const geometry = new THREE.BoxGeometry(100, 1, 1, 64, 1, 1);
    const position = geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
        const vertexY = position.getY(i);
        const vertexX = position.getX(i);
        const vertexZ = position.getZ(i);

        // Apply subtle wave only to the top face
        if (vertexY > 0) {
            const wave = Math.sin(vertexX * Math.PI * 0.1) * 0.1 + Math.cos(vertexZ * 0.1) * 0.1;
            position.setY(i, vertexY + wave);
        }
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0xeeeeff, // bluish white
        roughness: 0.8,
        metalness: 0.1,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.position.y = -5.67;
    scene.add(ground);

    // platforms.push({ mesh: ground, y: -5 });
}

export function createPlatform(
  scene,
  platforms,
  x,
  y,
  w = 5,
  h = 0.5,
  withLight = false,
  cornerRadiusFactor = 0.55,   // 0–1: larger = flatter center (was 0.4, increased for more obvious rounding band)
  roundingStrength = 0.35      // 0–1: depth multiplier of corner drop (raise to intensify)
) {
  // More segments (width, height, depth) to allow a smooth profile
  const widthSegments = 48;
  const heightSegments = 2;
  const depthSegments = 24;
  const geometry = new THREE.BoxGeometry(w, h, 1, widthSegments, heightSegments, depthSegments);
  const pos = geometry.attributes.position;

  const halfW = w / 2;
  const halfD = 0.5; // depth = 1
  const innerRadius = cornerRadiusFactor; // normalized radius where drop begins
  const maxDrop = h * roundingStrength;   // absolute vertical drop at extreme edge/corner

  const clamp01 = v => Math.min(1, Math.max(0, v));
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);

    // Only sculpt the top face vertices (positive Y)
    if (vy > 0) {
      // --- 1. Original subtle surface wave (unchanged logic, slightly stronger for visibility) ---
      const wave =
        Math.sin(vx * Math.PI * 2) * 0.06 +
        Math.cos(vz * Math.PI * 2) * 0.06;

      // --- 2. Radial corner rounding drop ---
      // Normalized elliptical distance from center (0 center -> 1 edges/corners)
      const nx = vx / halfW;
      const nz = vz / halfD;
      const radial = Math.sqrt(nx * nx + nz * nz); // 0..>1
      // Start dropping after innerRadius
      const t = clamp01((radial - innerRadius) / (1 - innerRadius));
      // Ease & amplify near outer rim
      const dropFactor = easeOutCubic(t);
      const drop = dropFactor * maxDrop;

      pos.setY(i, vy + wave - drop);
    }
  }

  pos.needsUpdate = true;
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0xeeeeff,
    roughness: 0.8,
    metalness: 0.1
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);
  mesh.receiveShadow = true;
  scene.add(mesh);

  platforms.push({ mesh, x, y: y + h / 2, width: w, height: h });

  if (withLight) {
    const light = new THREE.PointLight(0xffffff, 0.6, 10);
    light.position.set(x, y + 1.5, 1);
    scene.add(light);
  }
  return mesh;
}