const THREE = window.THREE;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -100, window.innerWidth / 100,
  window.innerHeight / 100, window.innerHeight / -100,
  0.1, 1000
);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gameCanvas"), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

const loader = new THREE.TextureLoader();
loader.load('MountRainier.jpg', texture => {
  scene.background = texture;
});

// Ground and Platforms
const ground = new THREE.Mesh(
  new THREE.BoxGeometry(200, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0x6e4b3a })
);
ground.position.y = -5;
scene.add(ground);

const platforms = [];
function createPlatform(x, y, w = 5, h = 0.5) {
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 1),
    new THREE.MeshBasicMaterial({ color: 0x556B2F })
  );
  platform.position.set(x, y, 0);
  scene.add(platform);
  platforms.push(platform);
}
createPlatform(4, -2);
createPlatform(9, 0);
createPlatform(14, 2);

// Players
const climberTexture = loader.load('https://threejs.org/examples/textures/sprite.png');
function createClimber(x) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: climberTexture }));
  sprite.scale.set(1, 1.5, 1);
  sprite.position.set(x, -4.5, 0);
  scene.add(sprite);
  return sprite;
}
const climber1 = createClimber(-2);
const climber2 = createClimber(2);

// Input
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// Resize
window.addEventListener('resize', () => {
  camera.left = window.innerWidth / -100;
  camera.right = window.innerWidth / 100;
  camera.top = window.innerHeight / 100;
  camera.bottom = window.innerHeight / -100;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// State
const gravity = -0.01;
const jumpPower = 0.25;
const maxJumpHeight = 2.5;
const speed = 0.1;
const tetherMaxDist = 4;
const state = {
  c1: {
    vy: 0, grounded: true, tools: ['SnackBar', 'SnackBar'], jumpBoost: false,
    jumpTimer: 0, startY: -4.5, water: 2
  },
  c2: {
    vy: 0, grounded: true, tools: [], jumpBoost: false,
    jumpTimer: 0, startY: -4.5, water: 0
  }
};

// Rope
const rope = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([climber1.position, climber2.position]),
  new THREE.LineBasicMaterial({ color: 0xffffff })
);
scene.add(rope);

// Tools
const tools = [
  { name: 'SnackBar', pos: new THREE.Vector3(-5, -4, 0), color: 0xffcc00 },
  { name: 'IceAxe', pos: new THREE.Vector3(5, -4, 0), color: 0x00ccff },
  { name: 'Crampons', pos: new THREE.Vector3(10, -4, 0), color: 0xffffff },
  { name: 'Headlamp', pos: new THREE.Vector3(15, -4, 0), color: 0xffff66 },
  { name: 'AnchorRope', pos: new THREE.Vector3(20, -4, 0), color: 0x888888 },
  { name: 'Water', pos: new THREE.Vector3(8, -4, 0), color: 0x3399ff }
];
tools.forEach(tool => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 0.2),
    new THREE.MeshBasicMaterial({ color: tool.color })
  );
  mesh.position.copy(tool.pos);
  scene.add(mesh);
  tool.mesh = mesh;
});

// Levels
let level = 0;
let lastBreak = 0;
const elevationBreaks = [
  { elevation: 7000, used: false },
  { elevation: 9000, used: false }
];
const levels = [
  { x: 0, title: "Paradise Trailhead", elevation: 5400, text: "Welcome to the base of Mount Rainier." },
  { x: 5, title: "Camp Muir", elevation: 7000, text: "Camp Muir: First break, tree line ends here." },
  { x: 10, title: "Ingraham Glacier", elevation: 9000, text: "Time for another water + snack break." },
  { x: 15, title: "Disappointment Cleaver", elevation: 11000, text: "Push through, you're almost there!" },
  { x: 20, title: "Summit Crater", elevation: 14410, text: "Congratulations! Summit reached." }
];

// Overlay
const overlay = document.getElementById("overlay");
const levelTitle = document.getElementById("levelTitle");
const levelText = document.getElementById("levelText");
const continueBtn = document.getElementById("continueBtn");
continueBtn.addEventListener("click", () => overlay.style.display = "none");

// Pickup
function checkPickup(climber, id) {
  tools.forEach(tool => {
    if (!tool.picked && climber.position.distanceTo(tool.pos) < 1.2) {
      const s = state[id];
      if (tool.name === "Water") s.water++;
      else s.tools.push(tool.name);
      tool.mesh.visible = false;
      tool.picked = true;
      if (tool.name === "SnackBar") {
        s.jumpBoost = true;
        s.jumpTimer = 300;
      }
    }
  });
}

// Animate
function animate() {
  requestAnimationFrame(animate);

  ["c1", "c2"].forEach((id, i) => {
    const c = i === 0 ? climber1 : climber2;
    const s = state[id];
    const l = i === 0 ? ["ArrowLeft", "ArrowRight", "ArrowUp"] : ["KeyA", "KeyD", "KeyW"];

    if ((keys[l[2]] || keys["Space"]) && s.grounded) {
      s.vy = s.jumpBoost ? jumpPower * 1.8 : jumpPower;
      s.grounded = false;
      s.startY = c.position.y;
    }

    if (!s.grounded && c.position.y - s.startY > maxJumpHeight) {
      s.vy = Math.min(s.vy, 0);
    }

    if (keys[l[0]]) c.position.x -= speed;
    if (keys[l[1]]) c.position.x += speed;

    s.vy += gravity;
    c.position.y += s.vy;

    if (c.position.y <= -4.5) {
      c.position.y = -4.5;
      s.vy = 0;
      s.grounded = true;
    }

    platforms.forEach(platform => {
      if (
        Math.abs(c.position.x - platform.position.x) < 2.5 &&
        c.position.y > platform.position.y &&
        c.position.y + s.vy <= platform.position.y + 0.5
      ) {
        c.position.y = platform.position.y + 0.75;
        s.vy = 0;
        s.grounded = true;
      }
    });

    checkPickup(c, id);
    if (s.jumpBoost && s.jumpTimer-- <= 0) s.jumpBoost = false;
  });

  // Rope pull
  const dx = climber1.position.x - climber2.position.x;
  const dy = climber1.position.y - climber2.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > tetherMaxDist) {
    const angle = Math.atan2(dy, dx);
    const pullStrength = 0.05;
    state.c2.vy += 0.01;
    climber2.position.x += Math.cos(angle) * pullStrength;
    climber2.position.y += Math.sin(angle) * pullStrength + Math.sin(Date.now() * 0.01) * 0.01;
  }

  // Break reminders
  elevationBreaks.forEach(breakpoint => {
    if (!breakpoint.used && levels[level]?.elevation >= breakpoint.elevation) {
      if (state.c1.water > 0 && state.c1.tools.includes("SnackBar")) {
        state.c1.water--;
        const index = state.c1.tools.indexOf("SnackBar");
        if (index !== -1) state.c1.tools.splice(index, 1);
        breakpoint.used = true;
        alert(`Break at ${breakpoint.elevation}ft: 1 water and 1 snack used.`);
      }
    }
  });

  if (climber2.position.y <= -4.5) {
    climber2.position.y = -4.5;
    state.c2.vy = 0;
    state.c2.grounded = true;
  }

  // Level transition
  if (level < levels.length && climber1.position.x >= levels[level].x) {
    levelTitle.textContent = levels[level].title;
    levelText.textContent = levels[level].text;
    overlay.classList.remove("hidden");
    level++;
  }

  rope.geometry.setFromPoints([climber1.position.clone(), climber2.position.clone()]);

  // UI
  const c1tools = state.c1.tools;
  document.getElementById("currentLocation").textContent = levels[Math.max(0, level - 1)]?.title || "Summit";
  document.getElementById("nextLocation").textContent = levels[level]?.title || "None";
  document.getElementById("hasAxe").textContent = c1tools.includes("IceAxe") ? "Yes" : "No";
  document.getElementById("snacksCount").textContent = c1tools.filter(t => t === "SnackBar").length;
  document.getElementById("hasCrampons").textContent = c1tools.includes("Crampons") ? "Yes" : "No";
  document.getElementById("hasHeadlamp").textContent = c1tools.includes("Headlamp") ? "Yes" : "No";
  document.getElementById("waterCount").textContent = state.c1.water;

  renderer.render(scene, camera);

  // Smooth diagonal camera movement
  const midX = (climber1.position.x + climber2.position.x) / 2;
  const midY = (climber1.position.y + climber2.position.y) / 2;
  const targetX = midX + 2;
  const targetY = midY + midX * 0.1;
  camera.position.x += (targetX - camera.position.x) * 0.05;
  camera.position.y += (targetY - camera.position.y) * 0.05;
}
animate();