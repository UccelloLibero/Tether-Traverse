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

    // createGround(scene, localPlatforms);
    // Place hut just BEFORE first level 2 platform (first platform at x=214, y≈19.5)
    createCampMuirHutL2(state.scene, 210, 21);
    loadLevel2(state.scene, localPlatforms);

    // Safety: remove any leftover Level 1 decorative hut if still attached
    const strayHut = scene.getObjectByName("CampMuirHut"); // only if we decide to name it later
    if (strayHut && strayHut.parent) scene.remove(strayHut);

    // Ensure HUD shows refreshed supplies (defensive)
    const wc = document.getElementById("waterCount");
    if (wc && typeof state.water !== "undefined") wc.textContent = state.water.toFixed(1);
    const sc = document.getElementById("snacksCount");
    if (sc && typeof state.snacks !== "undefined") sc.textContent = state.snacks;
    const camp = document.getElementById("campSupplies");
    if (camp && typeof state.water !== "undefined" && typeof state.snacks !== "undefined") {
        camp.textContent = `💧 ${state.water.toFixed(1)} | 🍎 ${state.snacks}`;
    }
}

export function updateLevel2(state, climber1, dt) {
    animateGearItems();

    detectGearPickup(climber1, state, state.scene, updateGearHUD, flashScreen);

    state.c1.grounded = checkCollision(climber1, state.c1, localPlatforms, state);
    state.c2.grounded = checkCollision(climber2, state.c2, localPlatforms, state);

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
    createPlatform(scene, platforms, 190, 17, 2.5, 0.5); // Platform leading to Camp Muir
    createPlatform(scene, platforms, 200, 19, 6, 0.5); // Wider Camp Muir platform
    // Manually place 40 platforms for Level 2 (Camp Muir to Summit)
    createPlatform(scene, platforms, 214, 19.5, 9, 0.5, true); // Camp Muir start
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

// Decorative Camp Muir Hut for Level 2 (visual only, behind players)
function createCampMuirHutL2(scene, x, y) {
    const group = new THREE.Group();

    const width = 6;
    const height = 3;
    const facadeGeo = new THREE.PlaneGeometry(width, height, 48, 24);
    const pos = facadeGeo.attributes.position;
    const halfW = width / 2;
    const halfH = height / 2;

    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const edgeX = Math.pow(Math.min(1, Math.abs(vx) / halfW), 1.25);
        const edgeY = Math.pow(Math.min(1, Math.abs(vy) / halfH), 1.25);
        const edgeMix = Math.max(edgeX, edgeY);
        if (edgeMix > 0.6) {
            const wobble =
                Math.sin(vx * 2.4 + vy * 1.1) * 0.08 +
                Math.cos(vy * 3.0 - vx * 0.9) * 0.06;
            pos.setX(i, vx + (vx / halfW) * wobble * 0.45);
            pos.setY(i, vy + (vy / halfH) * wobble * 0.45);
        }
    }
    pos.needsUpdate = true;

    const facadeMat = new THREE.MeshStandardMaterial({
        color: 0xb5b5b5,
        roughness: 0.9,
        metalness: 0.04
    });
    const facade = new THREE.Mesh(facadeGeo, facadeMat);
    group.add(facade);

    const back = facade.clone();
    back.position.z = -0.25;
    back.material = facadeMat.clone();
    back.material.color.set(0x9a9a9a);
    group.add(back);

    const roofGeo = new THREE.ConeGeometry(width * 0.62, 1.15, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x5b371b, roughness: 0.85 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, height / 2 + 0.55, -0.12);
    group.add(roof);

    // Sign
    const canvas = document.createElement("canvas");
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1b1b1b";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font = "bold 100px 'Fira Sans', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 5;
    ctx.fillStyle = "#FFD35A";
    ctx.strokeText("Camp Muir", canvas.width/2, canvas.height/2);
    ctx.fillText("Camp Muir", canvas.width/2, canvas.height/2);
    const signTex = new THREE.CanvasTexture(canvas);
    const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 1.35),
        new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
    );
    sign.position.set(0, 0.6, 0.02);
    group.add(sign);

    facade.material.emissive = new THREE.Color(0x101010);
    back.material.emissive = new THREE.Color(0x060606);

    group.position.set(x, y, -2); // z = -2 to render BEHIND players/platforms
    scene.add(group);
}
