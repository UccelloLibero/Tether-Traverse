export function createGround(scene, platforms) {
    const geometry = new THREE.BoxGeometry(300, 1, 1, 64, 1, 1);
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

    platforms.push({ mesh: ground, y: -5 });
}

export function createPlatform(scene, platforms, x, y, w = 5, h = 0.5, withLight = false) {
    // Add segments to support vertex manipulation
    const geometry = new THREE.BoxGeometry(w, h, 1, 16, 1, 1); 
    const position = geometry.attributes.position;

    // Apply sine wave to top surface
    for (let i = 0; i < position.count; i++) {
        const vertexY = position.getY(i);
        const vertexX = position.getX(i);
        const vertexZ = position.getZ(i);

        // Slight curve only to the top face (positive Y values)
        if (vertexY > 0) {
            const wave = Math.sin(vertexX * Math.PI * 2) * 0.05 + Math.cos(vertexZ * Math.PI * 2) * 0.05;
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

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    mesh.receiveShadow = true;

    scene.add(mesh);

    platforms.push({ mesh, x, y: y + h / 2, width: w, height: h });

    if (withLight) {
        const light = new THREE.PointLight(0xffffff, 0.5, 10);
        light.position.set(x, y + 1.5, 1);
        scene.add(light);
    }

    return mesh;
}