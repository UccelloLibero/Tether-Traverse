import { animateGearItems, createGear, detectGearPickup } from "../utils/gear.js";
import { createGround, createPlatform } from "../utils/platforms.js";
import { checkCollision } from "../utils/collision.js";
import { climber1, climber2, initPlayersLevel2, updatePlayerLevel2 } from "../players/level2players.js";
import { updateGearHUD, flashScreen } from "../ui/hud.js";
import { handleBreakpoints } from "../utils/breakpoints.js";
import { createLevel2Lights } from "../players/level2players.js";
import { updateHeadLampLighting } from "../players/level2players.js";
import { updatePlayerLevel1 } from "../players/level1players.js";

let localPlatforms = [];

export function initLevel2(state) {
    const scene = state.scene;
    const loader = new THREE.TextureLoader();

    loader.load("assets/mount-rainier-level2.jpg", texture => {
        scene.background = texture;
    });

    initPlayersLevel2(scene);

    scene.add(climber1);
    scene.add(climber2);

    state.climber1 = climber1;
    state.climber2 = climber2;  

    scene.add(state.rope);

    localPlatforms = [];
    state.platforms = localPlatforms;

    createLevel2Lights(scene, climber1, climber2);

    createGround(scene, localPlatforms);
    loadLevel2(state.scene, localPlatforms);
}

export function updateLevel2(state, climber1) {
    animateGearItems();

    detectGearPickup(climber1, state, state.scene, updateGearHUD, flashScreen);

    state.c1.grounded = checkCollision(climber1, state.c1, localPlatforms);
    state.c2.grounded = checkCollision(climber2, state.c2, localPlatforms);

    updatePlayerLevel2(state);

    updateHeadLampLighting(state.climber1, state.climber2, true, state.climber1.position.x);

    // Handle responsive breakpoints
    // handleBreakpoints(state);
}

export function cleanupLevel2(state) {
    localPlatforms.forEach(p => {
        state.scene.remove(p.mesh);
    });
    localPlatforms = [];
}

export function loadLevel2(scene, platforms) {
    // Manually place 40 platforms for Level 2 (Camp Muir to Summit)
    createPlatform(scene, platforms, 214, 19, 5, 0.5, true); // Camp Muir start
    createPlatform(scene, platforms, 220, 20, 5, 0.5, true);
    createPlatform(scene, platforms, 226, 21, 5, 0.5, true);
    createPlatform(scene, platforms, 232, 22, 5, 0.5, true);
    createPlatform(scene, platforms, 238, 23, 5, 0.5, true);
    createPlatform(scene, platforms, 244, 24, 5, 0.5, true);
    createPlatform(scene, platforms, 250, 25, 5, 0.5, true);
    createPlatform(scene, platforms, 256, 26, 5, 0.5, true);
    createPlatform(scene, platforms, 262, 27, 5, 0.5, true);
    createPlatform(scene, platforms, 268, 28, 5, 0.5, true);
    createPlatform(scene, platforms, 274, 29, 5, 0.5, true);
    createPlatform(scene, platforms, 280, 30, 5, 0.5, true);
    createPlatform(scene, platforms, 286, 31, 5, 0.5, true);
    createPlatform(scene, platforms, 292, 32, 5, 0.5, true); // Cathedral Gap surprise Parka gear pick up
    createGear(scene, 292, 32, "parka");
    createPlatform(scene, platforms, 298, 33, 5, 0.5, true);
    createPlatform(scene, platforms, 304, 34, 5, 0.5, true); 
    createPlatform(scene, platforms, 310, 35, 5, 0.5, true);
    createPlatform(scene, platforms, 316, 36, 5, 0.5, true);
    createPlatform(scene, platforms, 322, 37, 5, 0.5, true);
    createPlatform(scene, platforms, 328, 38, 5, 0.5, true); // Inghram Flats water and snack break
    createPlatform(scene, platforms, 334, 39, 5, 0.5, true);
    createPlatform(scene, platforms, 340, 40, 5, 0.5, true);
    createPlatform(scene, platforms, 346, 41, 5, 0.5, true);
    createPlatform(scene, platforms, 352, 42, 5, 0.5, true);
    createPlatform(scene, platforms, 358, 43, 5, 0.5, true);
    createPlatform(scene, platforms, 364, 44, 5, 0.5, true);
    createPlatform(scene, platforms, 370, 45, 5, 0.5, true);
    createPlatform(scene, platforms, 376, 46); // Disappointment Cleaver water and snack break
    createPlatform(scene, platforms, 382, 47);
    createPlatform(scene, platforms, 388, 48);
    createPlatform(scene, platforms, 394, 49);
    createPlatform(scene, platforms, 400, 50);
    createPlatform(scene, platforms, 406, 51);
    createPlatform(scene, platforms, 412, 52);
    createPlatform(scene, platforms, 418, 53); // High Point Break
    createPlatform(scene, platforms, 424, 54);
    createPlatform(scene, platforms, 430, 55);
    createPlatform(scene, platforms, 436, 56);
    createPlatform(scene, platforms, 442, 57);
    createPlatform(scene, platforms, 448, 58);
    createPlatform(scene, platforms, 454, 59);
    createPlatform(scene, platforms, 460, 60); // Summit
}
