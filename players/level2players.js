// import { THREE } from '../utils/three.js';

export let climber1, climber2;
export let climber1Right, climber1Left, climber2Right, climber2Left;

export let climber1Light, climber2Light;

const loader = new THREE.TextureLoader();

export function initPlayersLevel2(scene) {
    const planeGeometry = new THREE.PlaneGeometry(1, 1.5);

    climber1Right = loader.load('assets/climbers/climber1-level2-right.png');
    climber1Left = loader.load('assets/climbers/climber1-level2-left.png');
    climber2Right = loader.load('assets/climbers/climber2-level2-right.png');
    climber2Left = loader.load('assets/climbers/climber2-level2-left.png');

    const climber1Material = new THREE.MeshLambertMaterial({ map: climber1Right, transparent: true });
    climber1 = new THREE.Mesh(planeGeometry, climber1Material);
    climber1.position.set(214,-2, 0); // Start position at Camp Muir for summit push
    scene.add(climber1);

    const climber2Material = new THREE.MeshLambertMaterial({ map: climber2Right, transparent: true });
    climber2 = new THREE.Mesh(planeGeometry.clone(), climber2Material);
    climber2.position.set(212, -2, 0);
    scene.add(climber2);
}

export function updatePlayerLevel2(state) {
    const moveSpeed = 0.1;
    const jumpPower = 0.35;
    const keys = state.keys;

    const t = Date.now() * 0.003;
    if (state.c1.grounded) {
        climber1.position.x += Math.sin(t * 0.5) * 0.03;
        climber1.position.y += Math.cos(t) * 0.01;
    }
    if (state.c2.grounded) {
        climber2.position.x += Math.sin(t * 0.5 + Math.PI) * 0.03;
        climber2.position.y += Math.cos(t + Math.PI) * 0.01;
    }

    // Climber 1 arrow keys
    if (keys["ArrowLeft"]) {
        state.c1.x -= moveSpeed;
        climber1.material.map = climber1Left; // Switch to left texture
    }
    else if (keys["ArrowRight"]) {
        state.c1.x += moveSpeed;
        climber1.material.map = climber1Right; // Switch to right texture
    }
    if (keys["ArrowUp"] && state.c1.grounded) {
        state.c1.vy = jumpPower;
        state.c1.grounded = false;
    }

    // Climber 2 WASD keys
    if (keys["KeyA"]) {
        state.c2.x -= moveSpeed;
        climber2.material.map = climber2Left; // Switch to left texture
    }
    else if (keys["KeyD"]) {
        state.c2.x += moveSpeed;
        climber2.material.map = climber2Right; // Switch to right texture
    }
    if (keys["KeyW"] && state.c2.grounded) {
        state.c2.vy = jumpPower;
        state.c2.grounded = false;
    }

    // Update climber positions
    climber1.position.x = state.c1.x;
    climber1.position.y = state.c1.y;
    climber2.position.x = state.c2.x;
    climber2.position.y = state.c2.y;
}

export function cleanupPlayersLevel2(scene) {
    scene.remove(climber1);
    scene.remove(climber2);
}

export function createLevel2Lights(scene, climber1, climber2) {
    climber1Light = new THREE.PointLight(0x88ffcc, 1.5, 5); // greenish light
    climber2Light = new THREE.PointLight(0xaa88ff, 1.5, 5); // purplish light

    climber1Light.position.set(climber1.position.x, climber1.position.y + 0.5, 1);
    climber2Light.position.set(climber2.position.x, climber2.position.y + 0.5, 1);

    scene.add(climber1Light);
    scene.add(climber2Light);
}

export function updateHeadLampLighting(climber1, climber2, isNightClimb, currentX) {
    if (!climber1Light || !climber2Light) return;

    const fadeStart = 214;
    const fadeEnd = 376;

    if (isNightClimb) {
        if (currentX >= fadeStart && currentX <= fadeEnd) {
            const progress = (currentX - fadeStart) / (fadeEnd - fadeStart);
            const newIntensity = 5 * (1 - progress); // Fade from 5 to 0
            climber1Light.intensity = intensity;
            climber2Light.intensity = intensity;
        } 
        else {
            climber1Light.intensity = 0;
            climber2Light.intensity = 0;
        }
    } else {
        climber1Light.intensity = 0; 
        climber2Light.intensity = 0; 
    }

    climber1Light.position.set(climber1.position.x, climber1.position.y + 0.5, 1);
    climber2Light.position.set(climber2.position.x, climber2.position.y + 0.5, 1);
}