import { animateGearItems, createGear, detectGearPickup } from "../utils/gear.js";
import { createGround, createPlatform } from "../utils/platforms.js";
import { checkCollision } from "../utils/collision.js";
import { sharedState } from "../play/state.js";
import { climber1, climber2, initPlayersLevel1 } from "../players/level1players.js";
import { updateGearHUD, flashScreen } from "../ui/hud.js";
import { handleBreakpoints } from "../utils/breakpoints.js";

let localPlatforms = [];

export function initLevel1(state) {
    const scene = state.scene;
    const loader = new THREE.TextureLoader();

    loader.load("assets/mount-rainier.png", texture => {
        scene.background = texture;
    });

    initPlayersLevel1(scene);

    scene.add(climber1);
    scene.add(climber2);

    state.climber1 = climber1;
    state.climber2 = climber2;

    scene.add(state.rope);

    localPlatforms = [];
    state.platforms = localPlatforms;

    createGround(scene, localPlatforms);
    loadLevel1(state.scene, localPlatforms);

    console.log("Scene children after initLevel1:", scene.children);

}

export function updateLevel1(state, climber1) {
    animateGearItems();

    detectGearPickup(climber1, state, state.scene, updateGearHUD, flashScreen);

    state.c1.grounded = checkCollision(climber1, state.c1, localPlatforms);
    state.c2.grounded = checkCollision(climber2, state.c2, localPlatforms);

    // Handle responsive breakpoints
    // handleBreakpoints(state);
}

export function cleanupLevel1(state) {
    localPlatforms.forEach(p => {
        state.scene.remove(p.mesh);
    });
    localPlatforms = [];
}

export function loadLevel1(scene, platforms) {
    // Manually place 35 platforms for Level 1 (Paradise to Camp Muir)
    createPlatform(scene, platforms, 4, -2);
    createPlatform(scene, platforms, 10, -1);
    createPlatform(scene, platforms, 16, 0);
    createPlatform(scene, platforms, 22, 0.5); // First gear pick up (headlamp and helmet)
    createGear(scene, 22, 0.5, "headlamp");
    createGear(scene, 23.5, 0.5, "helmet");
    createPlatform(scene, platforms, 28, 1);
    createPlatform(scene, platforms, 34, 2); // Snack and water
    createPlatform(scene, platforms, 40, 2.5);
    createPlatform(scene, platforms, 46, 3);
    createPlatform(scene, platforms, 52, 4);
    createPlatform(scene, platforms, 58, 4.5);      
    createPlatform(scene, platforms, 64, 5);
    createPlatform(scene, platforms, 70, 6); // Second gear pick up (ice axe)
    createGear(scene, 70, 6, "iceaxe");
    createPlatform(scene, platforms, 76, 7);
    createPlatform(scene, platforms, 82, 8); // Snack and water
    createPlatform(scene, platforms, 88, 8.5);
    createPlatform(scene, platforms, 94, 9);
    createPlatform(scene, platforms, 100, 10);
    createPlatform(scene, platforms, 106, 11); // Third gear pick up (crampons)
    createGear(scene, 106, 11, "crampons");
    createPlatform(scene, platforms, 112, 12);
    createPlatform(scene, platforms, 118, 13);
    createPlatform(scene, platforms, 124, 13.5); 
    createPlatform(scene, platforms, 130, 14.);
    createPlatform(scene, platforms, 136, 14.5);
    createPlatform(scene, platforms, 142, 15); // Snack and water
    createPlatform(scene, platforms, 148, 16);
    createPlatform(scene, platforms, 154, 17);
    createPlatform(scene, platforms, 160, 18); // Fourth gear pick up (harness)
    createGear(scene, 160, 18, "harness");
    createPlatform(scene, platforms, 166, 19);
    createPlatform(scene, platforms, 172, 19.5); // Fifth gear pick up (Avalanche Beacon)
    createGear(scene, 172, 19.5, "avalanchebeacon");
    createPlatform(scene, platforms, 178, 20);
    createPlatform(scene, platforms, 184, 20.5);
    createPlatform(scene, platforms, 190, 20.5); // Snack resupply for Summit day
    createPlatform(scene, platforms, 196, 21);
    createPlatform(scene, platforms, 202, 22);
    createPlatform(scene, platforms, 208, 22);
    createPlatform(scene, platforms, 214, 23); // Last platform at Camp Muir
    createPlatform(scene, platforms, 214, 23, 10, 0.5); // Longer platform for Camp Muir
}

