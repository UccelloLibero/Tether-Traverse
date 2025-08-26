// import { THREE } from '../utils/three.js';
import { checkCollision } from "../utils/collision.js";

export let climber1Right, climber1Left, climber2Right, climber2Left;

export let climber1Light, climber2Light;

export let climber1 = null;
export let climber2 = null;

const loader = new THREE.TextureLoader();

export function initPlayersLevel2(scene) {

    if (climber1) scene.remove(climber1);
    if (climber2) scene.remove(climber2);

    const planeGeometry = new THREE.PlaneGeometry(1, 1.5);

    climber1Right = loader.load('assets/climbers/climber1-level2-right.png');
    climber1Left = loader.load('assets/climbers/climber1-level2-left.png');
    climber2Right = loader.load('assets/climbers/climber2-level2-right.png');
    climber2Left = loader.load('assets/climbers/climber2-level2-left.png');

    const climber1Material = new THREE.MeshLambertMaterial({ map: climber1Right, transparent: true });
    climber1 = new THREE.Mesh(planeGeometry, climber1Material);
    climber1.position.set(214, 23, 0); // Start position at Camp Muir for summit push
    scene.add(climber1);

    const climber2Material = new THREE.MeshLambertMaterial({ map: climber2Right, transparent: true });
    climber2 = new THREE.Mesh(planeGeometry.clone(), climber2Material);
    climber2.position.set(212, 23, 0);
    scene.add(climber2);
}

export function updatePlayerLevel2(state, dt = 0.016) {
    // Alpine tighter jump: 11^2 / (2*20) ≈ 3.0 units apex
    const H_SPEED = 1.8;
    const JUMP_SPEED = 11;      // reduced from 16 (too floaty)
    const GRAVITY = -20;
    const START_CLAMP_X_MAX = 216; // only keep initial ground safety near spawn
    const keys = state.keys;

    // Shared facing
    if (keys["ArrowLeft"] || keys["KeyA"]) state.facing = "left";
    else if (keys["ArrowRight"] || keys["KeyD"]) state.facing = "right";

    // Horizontal
    if (keys["ArrowLeft"]) state.c1.x -= H_SPEED * dt;
    else if (keys["ArrowRight"]) state.c1.x += H_SPEED * dt;
    if (keys["KeyA"]) state.c2.x -= H_SPEED * dt;
    else if (keys["KeyD"]) state.c2.x += H_SPEED * dt;

    // Gravity / integrate
    state.c1.vy += GRAVITY * dt;
    state.c2.vy += GRAVITY * dt;
    state.c1.y += state.c1.vy * dt;
    state.c2.y += state.c2.vy * dt;

    // Collision (platforms)
    const platformY1 = checkCollision(state.climber1, state.c1, state.platforms, state);
    if (platformY1 !== null) { 
        state.c1.y = platformY1 + 0.4; 
        state.c1.vy = 0; 
        state.c1.grounded = true; 
    } else {
        // ONLY clamp to spawn ground while still near spawn (prevents initial drop-through)
        if (state.c1.x < START_CLAMP_X_MAX && state.c1.y <= 20) {
            state.c1.y = 20;
            state.c1.vy = 0;
            state.c1.grounded = true;
        } else {
            state.c1.grounded = false; // allow real falling into void
        }
    }

    const platformY2 = checkCollision(state.climber2, state.c2, state.platforms, state);
    if (platformY2 !== null) { 
        state.c2.y = platformY2 + 0.4; 
        state.c2.vy = 0; 
        state.c2.grounded = true; 
    } else {
        if (state.c2.x < START_CLAMP_X_MAX && state.c2.y <= 20) {
            state.c2.y = 20;
            state.c2.vy = 0;
            state.c2.grounded = true;
        } else {
            state.c2.grounded = false;
        }
    }

    // Jump
    if (keys["ArrowUp"] && state.c1.grounded) { state.c1.vy = JUMP_SPEED; state.c1.grounded = false; }
    if (keys["KeyW"] && state.c2.grounded) { state.c2.vy = JUMP_SPEED; state.c2.grounded = false; }

    // Mesh positions
    climber1.position.x = state.c1.x; climber1.position.y = state.c1.y;
    climber2.position.x = state.c2.x; climber2.position.y = state.c2.y;

    // Unified facing textures
    if (state.facing === "left") {
        climber1.material.map = climber1Left;
        climber2.material.map = climber2Left;
    } else {
        climber1.material.map = climber1Right;
        climber2.material.map = climber2Right;
    }
    climber1.material.needsUpdate = true;
    climber2.material.needsUpdate = true;
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
            const newIntensity = Math.max(0, Math.min(1.5, 5 * (1 - progress))); // Fade from 5 to 0
            climber1Light.intensity = newIntensity;
            climber2Light.intensity = newIntensity;
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