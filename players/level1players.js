// import { THREE } from '../utils/three.js';
import { checkCollision } from "../utils/collision.js";

export let climber1, climber2;
export let climber1Right, climber1Left, climber2Right, climber2Left;

const loader = new THREE.TextureLoader();

export function initPlayersLevel1(scene) {
    const planeGeometry = new THREE.PlaneGeometry(1, 1.5);

    climber1Right = loader.load('assets/climbers/climber1-right.png');
    climber1Left = loader.load('assets/climbers/climber1-left.png');
    climber2Right = loader.load('assets/climbers/climber2-right.png');
    climber2Left = loader.load('assets/climbers/climber2-left.png');

    const climber1Material = new THREE.MeshLambertMaterial({map: climber1Right, transparent: true});
    climber1 = new THREE.Mesh(planeGeometry, climber1Material);
    climber1.position.set(-1.5, -4.5, 0);
    scene.add(climber1);

    const climber2Material = new THREE.MeshLambertMaterial({ map: climber2Right, transparent: true });
    climber2 = new THREE.Mesh(planeGeometry.clone(), climber2Material);
    climber2.position.set(-7.5, -4.75, 0);
    scene.add(climber2);
}

export function updatePlayerLevel1(state, dt = 0.016) {
    // Tunable movement constants (time‑based):
    // Jump apex height ≈ (JUMP_SPEED^2) / (2 * |GRAVITY|)
    // With 12^2 / (2*18) = 144 / 36 = 4 units (≈ previous feel).
    const H_SPEED = 2;        // units / second
    const JUMP_SPEED = 12;     // was 6
    const GRAVITY = -18;      // was -20 (slightly lighter to extend airtime)
    const groundY = -4.5;
    const keys = state.keys;

    // Horizontal movement
    if (keys["ArrowLeft"]) {
        state.c1.x -= H_SPEED * dt;
        climber1.material.map = climber1Left;
    } else if (keys["ArrowRight"]) {
        state.c1.x += H_SPEED * dt;
        climber1.material.map = climber1Right;
    }

    if (keys["KeyA"]) {
        state.c2.x -= H_SPEED * dt;
        climber2.material.map = climber2Left;
    } else if (keys["KeyD"]) {
        state.c2.x += H_SPEED * dt;
        climber2.material.map = climber2Right;
    }

    // Gravity
    state.c1.vy += GRAVITY * dt;
    state.c2.vy += GRAVITY * dt;

    // Integrate
    state.c1.y += state.c1.vy * dt;
    state.c2.y += state.c2.vy * dt;

    // Collision detection 
    const platformY1 = checkCollision(climber1, state.c1, state.platforms, state);
    if (platformY1 !== null) {
        state.c1.y = platformY1 + 0.4; // snap to top of platform
        state.c1.vy = 0;
        state.c1.grounded = true;
    } else if (state.c1.y <= groundY) {
        state.c1.y = groundY;
        state.c1.vy = 0;
        state.c1.grounded = true;
    } else {
        state.c1.grounded = false;
    }

    const platformY2 = checkCollision(climber2, state.c2, state.platforms, state);
    if (platformY2 !== null) {
        state.c2.y = platformY2 + 0.4;
        state.c2.vy = 0;
        state.c2.grounded = true;
    } else if (state.c2.y <= groundY) {
        state.c2.y = groundY;
        state.c2.vy = 0;
        state.c2.grounded = true;
    } else {
        state.c2.grounded = false;
    }

    // Jumping 
    if (keys["ArrowUp"] && state.c1.grounded) {
        state.c1.vy = JUMP_SPEED;
        state.c1.grounded = false;
    }

    if (keys["KeyW"] && state.c2.grounded) {
        state.c2.vy = JUMP_SPEED;
        state.c2.grounded = false;
    }

    // Apply to meshes
    climber1.position.x = state.c1.x;
    climber1.position.y = state.c1.y;

    climber2.position.x = state.c2.x;
    climber2.position.y = state.c2.y;
}

export function cleanupPlayersLevel1(scene) {
    if (climber1 && climber1.parent) {
        climber1.geometry.dispose();
        climber1.material.dispose();
        scene.remove(climber1);
    }

    if (climber2 && climber2.parent) {
        climber2.geometry.dispose();
        climber2.material.dispose();
        scene.remove(climber2);
    }

    climber1 = null;
    climber2 = null;
}