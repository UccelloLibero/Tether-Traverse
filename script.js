import { handlePlayerMovement, addGroundedMotion, initPlayers } from './players.js';
import { climber1, climber2} from './players.js';
import { loadLevel1 } from './levels/level1.js';
import { loadLevel2 } from './levels/level2.js';

// Game Setup
let scene, camera, renderer;
let rope;
let platforms = [];
let keys = {};
let mobileKeys = { left: false, right: false, jump: false };
let ropeMesh;
let gearItems = [];

// Game Flags
let gameStarted = false;
let gamePaused = false;
let isNightClimb = false;
let nightProgress = 0;

// Detect mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Game constants
const gravity = -0.015;
const jumpPower = 0.35;
const moveSpeed = 0.1;
const maxRopeLength = 4;
const pullStrength = 0.08;

// Game state
const state = {
  c1: { vy: 0, grounded: true, x: -2, y: 0 },
  c2: { vy: 0, grounded: true, x: 2, y: 0 },
  water: 2.0,
  snacks: 10,
  tools: [],
  elevation: 5400,
  level: 0
};

// Level data
const levels = [
  { x: 0, name: "Paradise Trailhead", elevation: 5400, waterUse: 0, snackUse: 0 },
  { x: 15, name: "Panorama Point", elevation: 6800, waterUse: 0.5, snackUse: 2, gear: ["headlamp", "helmet"], message: "Take a break! Tatoosh Range views." },
  { x: 30, name: "Pebble Creek", elevation: 7200, waterUse: 0.5, snackUse: 2, gear: ["axe", "beacon"], message: "Rest stop before snowfields." },
  { x: 50, name: "Muir Snowfield", elevation: 8500, waterUse: 0.5, snackUse: 2, gear: ["crampons", "parka", "harness"], message: "Snow trek begins!" },
  { x: 70, name: "Camp Muir", elevation: 10080, waterUse: 0.5, snackUse: 2, message: "Camp Muir reached. Prepare for night!", isCamp: true },
  { x: 90, name: "Cathedral Gap", elevation: 11000, waterUse: 0.25, snackUse: 1, night: true, message: "Cross Cathedral Gap." },
  { x: 110, name: "Ingraham Flats", elevation: 11500, waterUse: 0.25, snackUse: 1, night: true, message: "Over Ingraham Glacier!" },
  { x: 130, name: "Disappointment Cleaver", elevation: 12300, waterUse: 0.25, snackUse: 1, night: true, message: "The Cleaver awaits!" },
  { x: 150, name: "High Break", elevation: 13500, waterUse: 0.25, snackUse: 1, night: true, message: "Final break. Dawn ahead!" },
  { x: 170, name: "Columbia Crest", elevation: 14410, waterUse: 0, snackUse: 0, night: true, message: "SUMMIT! You made it!" }
];

// Init
function initGame() {
  const loader = new THREE.TextureLoader()
    loader.load('assets/MountRainier.jpg', texture => {
    scene.background = texture;
  });
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0x87CEEB);

  initPlayers(scene, loader);

  camera = new THREE.OrthographicCamera(
    window.innerWidth / -100, window.innerWidth / 100,
    window.innerHeight / 100, window.innerHeight / -100,
    0.1, 1000
  );
  camera.position.z = 10;

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gameCanvas"), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  // Ground
  const ground = new THREE.Mesh(new THREE.BoxGeometry(300, 1, 1), new THREE.MeshBasicMaterial({ color: 0x898989 }));
  ground.position.y = -5.67;
  scene.add(ground);
  platforms.push({ mesh: ground, y: -5 });

  // Platforms from levels
  function createPlatform(x, y, w = 5, h = 0.5) {
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 1),
      new THREE.MeshBasicMaterial({ color: 0x556B2F })
    );
    platform.position.set(x, y, 0);
    scene.add(platform);
    platforms.push({ mesh: platform, y: y + h / 2, x: x });
  }

  // Load levels with platforms
  loadLevel1(createPlatform);
  const campTexture = new THREE.TextureLoader().load('assets/camp-muir.png');
  const camp = new THREE.Sprite(new THREE.SpriteMaterial({ map: campTexture, transparent: true }));
  camp.scale.set(6, 3, 1);
  camp.position.set(214, 25.5, 0);
  scene.add(camp);

  // Camp Muir text 
  const campText = document.createElement("div");
  campText.textContent = "Camp Muir";
  campText.style.position = "absolute";
  campText.style.color = "white";
  campText.style.fontSize = "2em";
  campText.style.top = "10%";
  campText.style.left = "50%";
  campText.style.transform = "translateX(-50%)";
  campText.style.textShadow = "0 0 6px black";
  campText.style.display = "none"; // Hidden until Camp Muir is reached
  campText.id = "campText";
  document.body.appendChild(campText);

  loadLevel2(createPlatform);

  // Rope (Thick and orange using TubeGeometry)
  const ropePath = new THREE.CatmullRomCurve3([
    climber1.position.clone(),
    climber2.position.clone()
  ]);
  const ropeGeometry = new THREE.TubeGeometry(ropePath, 20, 0.02, 8, false); // rope thickness = 0.02
  // ropeMesh.geometry = new THREE.TubeGeometry(newCurve, 20, 0.02, 8, false); // thickness = 0.02
  const ropeMaterial = new THREE.MeshBasicMaterial({ color: 0xff5800 });
  ropeMesh = new THREE.Mesh(ropeGeometry, ropeMaterial);
  scene.add(ropeMesh);
  ropeMesh.position.z = -0.1; // Slightly behind climbers

  updateGearHUD();
}

// Start Game
document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("landingPage").style.display = "none";
  document.getElementById("hud").classList.remove("hidden");
  if (isMobile) document.getElementById("mobileControls").style.display = "flex";
  gameStarted = true;
  initGame();
  animate();
});

// Input Events
document.addEventListener("keydown", e => { keys[e.code] = true; });
document.addEventListener("keyup", e => { keys[e.code] = false; });

["mobileLeft", "mobileRight", "mobileJump"].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener("touchstart", () => { mobileKeys[id.replace("mobile", "").toLowerCase()] = true; });
    btn.addEventListener("touchend", () => { mobileKeys[id.replace("mobile", "").toLowerCase()] = false; });
  }
});

// Animate
function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted || gamePaused) return;

  // Player movement
  handlePlayerMovement(state, keys, mobileKeys, climber1, climber2, isMobile);

  // Gravity
  state.c1.vy += gravity;
  state.c2.vy += gravity;

  climber1.position.x = state.c1.x;
  climber1.position.y += state.c1.vy;

  climber2.position.x = state.c2.x;
  climber2.position.y += state.c2.vy;

  // Collision
  state.c1.grounded = checkCollision(climber1, state.c1);
  state.c2.grounded = checkCollision(climber2, state.c2);

  // Rope physics and rendering
  handleRopePhysics();
  updateRope();
  updateCamera();

  // Grounded motion
  addGroundedMotion(climber1, state.c1.grounded);
  addGroundedMotion(climber2, state.c2.grounded, Math.PI);

  // Detect gear pickup
  gearItems.filter(({ sprite, name}) => {
    const dx = climber1.position.x - sprite.position.x;
    const dy = climber1.position.y - sprite.position.y;
    if (Math.sqrt(dx * dx + dy * dy) < 1.2) {
      if (!state.tools.includes(name)) {
        state.tools.push(name);
        updateGearHUD();
        flashScreen(); // light up screen on pickup
      }
      scene.remove(sprite);
      return false; // remove from gearItems array
    }
    return true; // keep in gearItems array
  });

  // Animate gear sway and scale
  gearItems.forEach(({ sprite }) => {
    const t = Date.now() * 0.003;
    sprite.position.x += Math.sin(t) * 0.002;
    sprite.scale.set(1.2 + Math.sin(t * 2) * 0.05, 1.2 + Math.cos(t * 2) * 0.05, 1);
  });

  // Update Camp Muir text visibility
  if (state.level >= 4 && !gamePaused) { // Camp Muir level
    document.getElementById("campText").style.display = "block";
    setTimeout(() => {
      fadeOutAndPause("Camp Muir reached. Time to rest and get ready for the summit!");
    }, 3000); // Show for 3 seconds
  }

  // Climber1 is rendered above climber2
  climber1.renderOrder = 2;
  climber2.renderOrder = 1;

  // Update scene render order
  scene.remove(climber1);
  scene.remove(climber2);
  scene.add(climber2); // Drawn first
  scene.add(climber1); // Drawn last

  // Draw the scene
  renderer.render(scene, camera);
}

// Camera follow
function updateCamera() {
  const centerX = (climber1.position.x + climber2.position.x) / 2;
  const centerY = (climber1.position.y + climber2.position.y) / 2 + 2;
  camera.position.x += (centerX - camera.position.x) * 0.05;
  camera.position.y += (centerY - camera.position.y) * 0.05;
}

// Collision
function checkCollision(climber, stateObj) {
  let grounded = false;
  const r = 0.4;

  platforms.forEach(p => {
    const plat = p.mesh;
    const top = p.y;
    const w = plat.geometry.parameters.width / 2;

    if (
      Math.abs(climber.position.x - plat.position.x) < w + r &&
      climber.position.y - r <= top &&
      climber.position.y - r > top - 0.5 &&
      stateObj.vy <= 0
    ) {
      // Bounce on landing
      if (Math.abs(stateObj.vy) > 0.1) {
        stateObj.vy = -stateObj.vy * 0.3; // bounce with damping
      } else {
        stateObj.vy = 0;
        grounded = true;
      }

      climber.position.y = top + r;

      if (p.level && p.level === state.level + 1) {
        triggerLevel(p.level);
      }
    }
  });

  return grounded;
}

// Trigger Level
function triggerLevel(index) {
  state.level = index;
  const level = levels[index];
  state.elevation = level.elevation;
  state.water = Math.max(0, state.water - level.waterUse);
  state.snacks = Math.max(0, state.snacks - level.snackUse);

  // Gear handling
  if (level.gear) {
  level.gear.forEach(item => {
    if (!state.tools.includes(item)) {
      state.tools.push(item);
    }
  });
  updateGearHUD();
}

  document.getElementById("currentLocation").textContent = level.name;
  document.getElementById("nextLocation").textContent = levels[index + 1]?.name || "None";
  document.getElementById("waterCount").textContent = state.water.toFixed(1);
  document.getElementById("snacksCount").textContent = state.snacks;

  if (level.message) {
    document.getElementById("levelTitle").textContent = level.name;
    document.getElementById("levelText").textContent = level.message;
    document.getElementById("overlay").classList.remove("hidden");
    gamePaused = true;
  }
}

// Rope drawing
function updateRope() {
  const ropePoints = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const pos = new THREE.Vector3().lerpVectors(climber1.position, climber2.position, t);
    pos.y -= Math.sin(t * Math.PI) * 0.3;  // add gentle sag
    ropePoints.push(pos);
  }

  const newCurve = new THREE.CatmullRomCurve3(ropePoints);
  ropeMesh.geometry.dispose();
  ropeMesh.geometry = new THREE.TubeGeometry(newCurve, 20, 0.01, 8, false);
}

// Rope physics
function handleRopePhysics() {
  const dx = climber1.position.x - climber2.position.x;
  const dy = climber1.position.y - climber2.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Climber 2 always follows Climber 1
  if (state.c2.x > state.c1.x - 0.2) {
    state.c2.x = state.c1.x - 0.2;
    
    // Bounce back slightly for realism
    state.c2.x -= 0.02; 
  }

  if (dist > maxRopeLength) {
    const t = Date.now() * 0.002;
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;
    const jiggleStrength = 0.5;
    const frequency = 12;
    const decay = 1.0;

    // Determine which climber is being pulled (farthest from midpoint)
    const dxMid = (climber1.position.x + climber2.position.x) / 2;
    const dyMid = (climber1.position.y + climber2.position.y) / 2;

    const dist1 = Math.hypot(climber1.position.x - dxMid, climber1.position.y - dyMid);
    const dist2 = Math.hypot(climber2.position.x - dxMid, climber2.position.y - dyMid);

    if (dist2 > dist1) {
      // Climber 2 is being pulled → apply jiggle
      const jiggleX = Math.cos(perpAngle) * Math.sin(t * frequency) * jiggleStrength * decay;
      const jiggleY = Math.sin(perpAngle) * Math.cos(t * frequency * 0.8) * jiggleStrength * decay;
      climber2.position.x += jiggleX;
      climber2.position.y += jiggleY;
    }

    // Rope correction:
    if (isMobile) {
      state.c2.x += Math.cos(angle) * pullStrength;
      climber2.position.y += Math.sin(angle) * pullStrength;
    } else {
      // Pull both climbers inward toward midpoint
      state.c1.x = dxMid + Math.cos(angle) * maxRopeLength / 2;
      state.c2.x = dxMid - Math.cos(angle) * maxRopeLength / 2;

      climber1.position.y = dyMid + Math.sin(angle) * maxRopeLength / 2;
      climber2.position.y = dyMid - Math.sin(angle) * maxRopeLength / 2;
    }
  }
}

function updateGearHUD() {
  const list = document.getElementById("toolsList");
  list.innerHTML = "";

  state.tools.forEach(tool => {
    const img = document.createElement("img");
    img.src = `assets/icons/${tool}.png`;
    img.alt = tool;
    img.title = tool; // Tooltip on hover
    img.style.width = "18px";
    img.style.height = "18px";
    img.style.margin = "0 6px";
    img.style.verticalAlign = "middle";
    img.style.cursor = "pointer"; // Pointer cursor for interactivity
    list.appendChild(img);
  });
}

// Function to place collectible gear
export function createGear(x, y, name) {
  const texture = new THREE.TextureLoader().load(`assets/icons/${name}.png`);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const gearSprite = new THREE.Sprite(material);
  gearSprite.position.set(x, y + 1.2, 0);
  gearSprite.scale.set(0.6, 0.6, 1);
  gearSprite.name = name; // Store gear name for later

  scene.add(gearSprite);
  gearItems.push({ sprite: gearSprite, name});
}

// Flash screen on gear pickup
function flashScreen() {
  const flash = document.createElement("div");
  flash.style.position = "absolute";
  flash.style.top = "0";
  flash.style.left = "0";
  flash.style.width = "100%";
  flash.style.height = "100%";
  flash.style.backgroundColor = "white";
  flash.style.opacity = "0.7";
  flash.style.zIndex = "999";
  flash.style.transition = "opacity 0.4s ease-out";
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(flash);
    }, 400); // Match transition duration
  }, 150);
}

// Fade out and pause game
function fadeOutAndPause(message) {
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "black";
  overlay.style.opacity = "0";
  overlay.style.zIndex = "999";
  overlay.style.transition = "opacity 1.5s ease-in-out";
  document.body.appendChild(overlay);
  setTimeout(() => overlay.style.opacity = "0.9", 100); // Start fade in

  setTimeout(() => {
    document.getElementById("overlay").classList.remove("hidden");
    document.getElementById("levelTitle").textContent = "Camp Muir";
    document.getElementById("levelText").textContent = message;
    gamePaused = true;
  }, 2000); // Wait for fade in to complete
}

// Resize
window.addEventListener("resize", () => {
  camera.left = window.innerWidth / -100;
  camera.right = window.innerWidth / 100;
  camera.top = window.innerHeight / 100;
  camera.bottom = window.innerHeight / -100;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
