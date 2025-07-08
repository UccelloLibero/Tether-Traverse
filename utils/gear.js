// import { THREE } from '../utils/three.js';


export const gearItems = [];

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

export function detectGearPickup(player, state, scene, updateGearHUD, flashScreen) {
    return gearItems.filter(({ sprite, name }) => {
        if (!sprite || !player?.position) return true; // defensive

        const dx = player.position.x - sprite.position.x;
        const dy = player.position.y - sprite.position.y;

        const dist = Math.sqrt(dx * dx + dy * dy); // 

        if (dist < 1.2) {
            if (!state.tools.includes(name)) {
                state.tools.push(name);
                updateGearHUD();
                flashScreen();
            }
            scene.remove(sprite);
            return false; // remove
        }
        return true; // keep
    });
}

export function animateGearItems() {
    const t = Date.now() * 0.003;
    gearItems.forEach(({ sprite }) => {
        sprite.position.x += Math.sin(t) * 0.002;
        sprite.scale.set(0.8 + Math.sin(t * 2) * 0.05, 1.2 + Math.cos(t * 2) * 0.05, 1);
    });
}