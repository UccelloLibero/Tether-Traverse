// import { THREE } from '../utils/three.js';


export const gearItems = [];

const GEAR_NAMES = {
    headlamp: "Headlamp",
    helmet: "Helmet",
    iceaxe: "Ice Axe",
    crampons: "Crampons",
    harness: "Harness",
    avalanchebeacon: "Avalanche Beacon",
    parka: "Parka",
};

export function createGear(scene, x, y, name) {
    const texture = new THREE.TextureLoader().load(`assets/icons/${name}.png`);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const gearSprite = new THREE.Sprite(material);
    gearSprite.position.set(x, y + 1.2, 0);
    gearSprite.scale.set(0.6, 0.6, 1); // Change scale of the gear
    gearSprite.name = name;

    scene.add(gearSprite);
    gearItems.push({ sprite: gearSprite, name });
}

// Forget all gear (new game / new level) so old pickups can't re-trigger
export function resetGear() {
    gearItems.length = 0;
}

// "+ Ice Axe" label that rises from where the gear was and fades away
function showGearPickupLabel(sprite, name, camera) {
    const label = document.createElement("div");
    label.className = "gear-pickup";
    label.innerHTML = `<img src="assets/icons/${name}.png" alt=""><span>+ ${GEAR_NAMES[name] || name}</span>`;

    const p = sprite.position.clone().project(camera);
    label.style.left = `${(p.x + 1) * 0.5 * window.innerWidth}px`;
    label.style.top = `${(-p.y + 1) * 0.5 * window.innerHeight}px`;

    document.body.appendChild(label);
    label.addEventListener("animationend", () => label.remove());
}

export function detectGearPickup(player, state, scene, updateGearHUD, flashScreen) {
    for (let i = gearItems.length - 1; i >= 0; i--) {
        const { sprite, name } = gearItems[i];
        if (!sprite || !player?.position) continue; // defensive

        const dx = player.position.x - sprite.position.x;
        const dy = player.position.y - sprite.position.y;

        if (Math.sqrt(dx * dx + dy * dy) < 1.2) {
            if (!state.tools.includes(name)) {
                state.tools.push(name);
                updateGearHUD(state.tools);
                flashScreen();
                if (state.camera) showGearPickupLabel(sprite, name, state.camera);
            }
            scene.remove(sprite);
            gearItems.splice(i, 1); // picked up: stop checking it
        }
    }
}

export function animateGearItems() {
    const t = Date.now() * 0.003;
    gearItems.forEach(({ sprite }) => {
        sprite.position.x += Math.sin(t) * 0.002;
        sprite.scale.set(0.8 + Math.sin(t * 2) * 0.05, 1.2 + Math.cos(t * 2) * 0.05, 1);
    });
}