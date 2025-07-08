export function createGround(scene, platforms) {
    const ground = new THREE.Mesh(
        new THREE.BoxGeometry(300, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x898989 })
    );

    ground.position.y = -5.67;
    scene.add(ground);
    platforms.push({ mesh:ground, y: -5 });
}

export function createPlatform(scene, platforms, x, y, w = 5, h = 0.5, withLight = false) {
    const geometry = new THREE.BoxGeometry(w, h, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x556B2F }); 
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, 0);
    mesh.receiveShadow = true;

    scene.add(mesh);

    platforms.push({ mesh, x, y: y + h/2, width: w, height: h});

    if (withLight) {
        const light = new THREE.PointLight(0xffffff, 0.5, 10);
        light.position.set(x, y + 1.5, 1);
        scene.add(light);
    }

    return mesh;
}