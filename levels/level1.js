import { animateGearItems, createGear, detectGearPickup } from "../utils/gear.js";
import { createGround, createPlatform } from "../utils/platforms.js";
import { checkCollision } from "../utils/collision.js";
import { sharedState } from "../play/state.js";
import { climber1, climber2, initPlayersLevel1 } from "../players/level1players.js";
import { updateGearHUD, flashScreen } from "../ui/hud.js";
import { handleBreakpoints } from "../utils/breakpoints.js";

let localPlatforms = [];
let campMuirHut = null; // track decorative hut

export function initLevel1(state) {
    const scene = state.scene;
    const loader = new THREE.TextureLoader();

    loader.load("assets/MountRainier.jpg", texture => {
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

    state.c1.grounded = checkCollision(climber1, state.c1, localPlatforms, state);
    state.c2.grounded = checkCollision(climber2, state.c2, localPlatforms, state);

    // Handle responsive breakpoints
    // handleBreakpoints(state);
}

export function cleanupLevel1(state) {
    localPlatforms.forEach(p => {
        state.scene.remove(p.mesh);
    });
    localPlatforms = [];
    // Remove decorative hut if present
    if (campMuirHut && campMuirHut.parent) {
        state.scene.remove(campMuirHut);
        campMuirHut.traverse(o => {
            if (o.geometry) o.geometry.dispose?.();
            if (o.material) o.material.dispose?.();
        });
    }
    campMuirHut = null;
}

// Decorative Camp Muir Hut (visual only)
function createCampMuirHut(scene, x, y) {
    const group = new THREE.Group();

    // Hut facade (wavy rectangle)
    const width = 6;
    const height = 3;
    const facadeGeo = new THREE.PlaneGeometry(width, height, 48, 24);
    const pos = facadeGeo.attributes.position;
    const halfW = width / 2;
    const halfH = height / 2;

    for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);

        // Border factor (0 at center, 1 near any edge)
        const edgeX = Math.pow(Math.min(1, Math.abs(vx) / halfW), 1.2);
        const edgeY = Math.pow(Math.min(1, Math.abs(vy) / halfH), 1.2);
        const edgeMix = Math.max(edgeX, edgeY);

        if (edgeMix > 0.65) {
            // Apply sinusoidal wobble near edges
            const wobble =
                Math.sin(vx * 2.2 + vy * 1.3) * 0.08 +
                Math.cos(vy * 3.1 - vx * 0.7) * 0.06;
            pos.setX(i, vx + (vx / halfW) * wobble * 0.4);
            pos.setY(i, vy + (vy / halfH) * wobble * 0.4);
        }
    }
    pos.needsUpdate = true;

    const facadeMat = new THREE.MeshStandardMaterial({
        color: 0xbebebe,
        roughness: 0.85,
        metalness: 0.05
    });
    const facade = new THREE.Mesh(facadeGeo, facadeMat);
    facade.position.set(0, 0, 0);
    group.add(facade);

    // Slight thickness (simple back plane)
    const back = facade.clone();
    back.position.z = -0.3;
    back.material = facadeMat.clone();
    back.material.color.set(0x9e9e9e);
    group.add(back);

    // Roof (simple wedge)
    const roofGeo = new THREE.ConeGeometry(width * 0.62, 1.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({
        color: 0x453a3c,
        roughness: 0.9
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, height / 2 + 0.6, -0.15);
    group.add(roof);

    // Sign (canvas texture)
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#7c7b7bff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 96px 'Fira Sans', sans-serif";
    ctx.fillStyle = "#FF6426";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "#FBFCFF";
    ctx.lineWidth = 4;
    ctx.strokeText("Camp Muir", canvas.width / 2, canvas.height / 2);
    ctx.fillText("Camp Muir", canvas.width / 2, canvas.height / 2);

    const signTex = new THREE.CanvasTexture(canvas);
    signTex.anisotropy = 4;
    const signMat = new THREE.MeshBasicMaterial({ map: signTex, transparent: true });
    const signGeo = new THREE.PlaneGeometry(3.6, 1.4, 1, 1);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 0.7, 0.01);
    group.add(sign);

    // Subtle emissive glow on facade for visibility
    facade.material.emissive = new THREE.Color(0x111111);
    back.material.emissive = new THREE.Color(0x080808);

    group.position.set(x, y, 0);
    group.traverse(o => { o.castShadow = false; o.receiveShadow = true; });
    scene.add(group);
    return group; // return so caller can store reference
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
    createPlatform(scene, platforms, 208, 22, 2.5, 0.5);
    createPlatform(scene, platforms, 214, 23, 2.5, 0.5); // Last platform at Camp Muir
    createPlatform(scene, platforms, 214, 23, 10, 0.5); // Longer platform for Camp Muir

    // Decorative hut just beyond Camp Muir
    campMuirHut = createCampMuirHut(scene, 222, 24.5);
}

