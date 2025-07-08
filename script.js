
import { handlePlayerMovement, addGroundedMotion, initPlayers } from './players.js';
import { climber1, climber2} from './players.js';
import { loadLevel1 } from './levels/level1.js';
import { loadLevel2 } from './levels/level2.js';
import { isNightMode } from "./players.js"; 

// Game Setup
let scene, camera, renderer;
let rope;
let platforms = [];
let keys = {};
let mobileKeys = { left: false, right: false, jump: false };
let ropeMesh;
let gearItems = [];
let ropeDistanceSamples = [];
let ropeDistanceLabel = null;

// Game Flags
let gameStarted = false;
let gamePaused = false;
let isNightClimb = false;
let nightProgress = 0;
let campMuirReached = false;
let climber1Light, climber2Light;

// Detect mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Game constants
const gravity = -0.015;
const jumpPower = 0.35;
const moveSpeed = 0.1;
const maxRopeLength = 3;
const pullStrength = 0.08;

// Game state
const state = {
  c1: { vy: 0, grounded: true, x: -2, y: 0 },
  c2: { vy: 0, grounded: true, x: 2, y: 0 },
  water: 2.0,
  snacks: 10,
  tools: [],
  elevation: 5400,
  breakTriggered: new Set()
};

// Level data
const breakpoints = [
  { x: 0, name: "Paradise Trailhead", elevation: 5400, waterUse: 0, snackUse: 0 },
  { x: 34, name: "Panorama Point", elevation: 6800, waterUse: 0.5, snackUse: 2, message: "Take a break! Tatoosh Range views." },
  { x: 82, name: "Pebble Creek", elevation: 7200, waterUse: 0.5, snackUse: 2, message: "Rest stop before snowfields." },
  { x: 142, name: "Muir Snowfield", elevation: 8500, waterUse: 0.5, snackUse: 2, message: "Snow trek begins!" },
  { x: 214, name: "Camp Muir", elevation: 10080, waterUse: 0.5, snackUse: 2, message: "Camp Muir reached. Prepare for night!", isCamp: true },
  { x: 229, name: "Cathedral Gap", elevation: 11000, waterUse: 0.25, snackUse: 1, night: true, message: "Cross Cathedral Gap." },
  { x: 304, name: "Ingraham Flats", elevation: 11500, waterUse: 0.25, snackUse: 1, night: true, message: "Over Ingraham Glacier!" },
  { x: 376, name: "Disappointment Cleaver", elevation: 12300, waterUse: 0.25, snackUse: 1, night: true, message: "The Cleaver awaits!" },
  { x: 418, name: "High Break", elevation: 13500, waterUse: 0.25, snackUse: 1, night: true, message: "Final break. Dawn ahead!" },
  { x: 460, name: "Columbia Crest", elevation: 14410, waterUse: 0, snackUse: 0, night: true, message: "SUMMIT! You made it!" }
];

document.getElementById("startNightClimbBtn").addEventListener("click", () => {
  const screen = document.getElementById("campMuirScreen");
  screen.style.opacity = "1";
  screen.style.transition = "opacity 0.5s ease-out";
  screen.style.opacity = "0";

  setTimeout(() => {
    screen.style.display = "none";
    gamePaused = false;
  }, 500); // Match transition duration
});

// Init
function initGame() {
  const loader = new THREE.TextureLoader()
    loader.load('assets/mount-rainier.png', texture => {
    scene.background = texture;
  });
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0x87CEEB);

  initPlayers(scene, loader);

  // Add lights
  climber1Light = new THREE.PointLight(0x88ffcc, 1.5, 5); // greenish halo
  climber2Light = new THREE.PointLight(0xaa88ff, 1.5, 5); // purplish halo

  climber1Light.position.set(climber1.position.x, climber1.position.y + 0.5, 1);
  climber2Light.position.set(climber2.position.x, climber2.position.y + 0.5, 1);

  scene.add(climber1Light);
  scene.add(climber2Light);

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
  camp.scale.set(3, 3, 1);
  camp.position.set(214, 25);
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

const pauseMenu = document.getElementById('pauseMenu');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
let isPaused = false;

function togglePause() {
  isPaused = !isPaused;
  gamePaused = isPaused; // Update gamePaused state
  pauseMenu.style.display = isPaused ? 'flex' : 'none';
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") togglePause();
});

resumeBtn.addEventListener("click", () => togglePause());

restartBtn.addEventListener("click", () => {
  location.reload();
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

  breakpoints.forEach(bp => {
    const dx = climber1.position.x - bp.x;
    if (Math.abs(dx) < 0.5 && !state.breakTriggered.has(bp.x)) {
      state.breakTriggered.add(bp.x);
      triggerLevel(bp);
    }
  });

  // Rope physics and rendering
  handleRopePhysics();
  updateRope();

  // Update camera to follow climbers
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
    sprite.scale.set(0.8 + Math.sin(t * 2) * 0.05, 1.2 + Math.cos(t * 2) * 0.05, 1);
  });

  if (isNightClimb) {
    const fadeStart = 214; // Camp Muir
    const fadeEnd = 376;   // Disappointment Cleaver
    const currentX = climber1.position.x;

    if (currentX >= fadeStart && currentX <= fadeEnd) {
      const progress = (currentX - fadeStart) / (fadeEnd - fadeStart);
      const newOpacity = 0.5 * (1 - progress);
      document.getElementById("nightOverlay").style.opacity = newOpacity.toFixed(2);
    }

    if (currentX > fadeEnd) {
      document.getElementById("nightOverlay").style.opacity = "0"; // Full daylight
    }
  }

  // Climber1 is rendered above climber2
  climber1.renderOrder = 2;
  climber2.renderOrder = 1;

  // Update scene render order
  scene.remove(climber1);
  scene.remove(climber2);
  scene.add(climber2); // Drawn first
  scene.add(climber1); // Drawn last

  // Light behavior during night climb
  updateNightClimbLighting();

  // Update lights position
  climber1Light.position.set(climber1.position.x, climber1.position.y + 0.5, 1);
  climber2Light.position.set(climber2.position.x, climber2.position.y + 0.5, 1);

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
    }
  });

  return grounded;
}

// Trigger Level
function triggerLevel(breakpoint) {
  state.elevation = breakpoint.elevation;
  state.water = Math.max(0, state.water - (breakpoint.waterUse || 0));
  state.snacks = Math.max(0, state.snacks - (breakpoint.snackUse || 0));

  // Update gear if provided
  if (breakpoint.gear) {
    breakpoint.gear.forEach(item => {
      if (!state.tools.includes(item)) {
        state.tools.push(item);
        flashScreen();
      }
    });
    updateGearHUD();
  }

  if (breakpoint.name === "Camp Muir") {
    isNightClimb = true; // START the night climb here
    document.getElementById("nightOverlay").style.opacity = "0.85";

    document.getElementById("levelTitle").textContent = "Camp Muir";
    document.getElementById("levelText").textContent = "Camp Muir reached! Time to rest and get ready for the summit!\n💧-0.5 ⚡️-2";

    document.getElementById("overlay").classList.remove("hidden");
    gamePaused = true;

    // Begin fade after showing message
    setTimeout(() => {
      document.getElementById("overlay").classList.add("hidden");
      fadeOutAndPause("Camp Muir reached! Time to rest and get ready for the summit!")
    }, 4000);
  }

  if (breakpoint.name === "Disappointment Cleaver") {
    document.getElementById("nightOverlay").style.opacity = "0.3"; // Let in the light
    showFloatingMessage("Daylight emerging over the cleaver!");
    }

  if (breakpoint.name === "Columbia Crest") {
    document.getElementById("nightOverlay").style.opacity = "0"; // Full daylight
    // showFloatingMessage("Sunrise at the Summit!");

    const withinRange = ropeDistanceSamples.filter(d => d <= maxRopeLength).length;
    const percentSafe = ((withinRange / ropeDistanceSamples.length) * 100).toFixed(0);

    document.getElementById("overlay").classList.remove("hidden");
    document.getElementById("levelTitle").textContent = "Columbia Crest Summit";
    document.getElementById("levelText").textContent =
      `Congratulations, you reached the summit of Mount Rainier! Rope management success: ${percentSafe}% of the time you kept a safe distance.`;

    gamePaused = true;

  }

  // Update HUD
  document.getElementById("currentLocation").textContent = breakpoint.name;
  document.getElementById("currentElevation").textContent = `${breakpoint.elevation} ft`;
  document.getElementById("nextLocation").textContent =
    breakpoints.find(bp => bp.x > breakpoint.x)?.name || "Summit";
  document.getElementById("waterCount").textContent = state.water.toFixed(1);
  document.getElementById("snacksCount").textContent = state.snacks;

  // Show overlay
  if (breakpoint.message) {
    document.getElementById("levelTitle").textContent = breakpoint.name;
    document.getElementById("levelText").textContent =
      `${breakpoint.message}\n💧-${breakpoint.waterUse || 0} ⚡️-${breakpoint.snackUse || 0}`;
    document.getElementById("overlay").classList.remove("hidden");

    gamePaused = true;

    // Auto-unpause after a delay
    setTimeout(() => {
      document.getElementById("overlay").classList.add("hidden");
      gamePaused = false;
    }, 4500); // 4.5 seconds delay
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


  showRopeDistance();

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

  // Every 10 frames or so (reduce sampling frequency)
  if (Math.random() < 0.1) {
    const dx = climber1.position.x - climber2.position.x;
    const dy = climber1.position.y - climber2.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    ropeDistanceSamples.push(dist);
  }
}

function showRopeDistance(x, y) {
  if (!ropeDistanceLabel) {
    ropeDistanceLabel = document.createElement("div");
    ropeDistanceLabel.style.position = "absolute";
    ropeDistanceLabel.style.color = "#fff";
    ropeDistanceLabel.style.fontSize = "0.75em";
    ropeDistanceLabel.style.textShadow = "0 0 4px black";
    ropeDistanceLabel.style.pointerEvents = "none";
    ropeDistanceLabel.style.zIndex = "10";
    document.body.appendChild(ropeDistanceLabel);
  }

  const dx = climber1.position.x - climber2.position.x;
  const dy = climber1.position.y - climber2.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const midpoint = new THREE.Vector3(
    (climber1.position.x + climber2.position.x) / 2,
    (climber1.position.y + climber2.position.y) / 2 + 0.6,
    0
  );

  const vector = midpoint.clone().project(camera);
  const screenX = (vector.x + 1) / 2 * window.innerWidth;
  const screenY = (-vector.y + 1) / 2 * window.innerHeight;

  ropeDistanceLabel.style.left = `${screenX}px`;
  ropeDistanceLabel.style.top = `${screenY}px`;
  ropeDistanceLabel.textContent = `${dist.toFixed(2)}m`;
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

// Floating message 
function showFloatingMessage(text) {
  const msg = document.createElement("div");
  msg.className = "floatingMessage";
  msg.textContent = text;
  document.body.appendChild(msg);

  // Remove after a few seconds
  setTimeout(() => {
    msg.style.opacity = "0"; // Fade out
    setTimeout(() => document.body.removeChild(msg), 1000); // Remove after fade out
  }, 3000);
}

// Fade out and pause game
function fadeOutAndPause(message) {
  let circle = document.getElementById("circleFadeOverlay");
  if (!circle) {
    circle = document.createElement("div");
    circle.id = "circleFadeOverlay";
    circle.style.position = "fixed";
    circle.style.top = "50%";
    circle.style.left = "50%";
    circle.style.width = "100px";
    circle.style.height = "100px";
    circle.style.backgroundColor = "black";
    circle.style.borderRadius = "50%";
    circle.style.transform = "translate(-50%, -50%) scale(0)";
    circle.style.transformOrigin = "center";
    circle.style.transition = "transform 2s ease-in-out";
    circle.style.zIndex = "1000";
    circle.style.display = "none";
    document.body.appendChild(circle);
  }
  
  setTimeout(() => {
    circle.style.transform = "scale(5)";
  }, 50);

  setTimeout(() => {
    document.getElementById("campMuirScreen").style.display = "flex";  // Show overlay
    updateCampMuirStats(); 
    gamePaused = true;
  }, 2500);  // After circle completes
}

// Update Camp Muir stats and visuals and prepare level 2
function updateCampMuirStats() {
  // Replenish water/snacks
  state.water = 2.0;
  state.snacks = 10;

  // Clear collected gear
  state.tools = [];

  isNightMode = true; // Set night mode for level 2

  // Update supply count
  document.getElementById("campSupplies").textContent = `💧 ${state.water.toFixed(1)} | ⚡️ ${state.snacks}`;

  // Replace climber textures to reflect new gear (e.g., heavier coats, helmets)
  const loader = new THREE.TextureLoader();
  const climber1Texture = loader.load("assets/climbers/climber1-level2.png");
  const climber2Texture = loader.load("assets/climbers/climber2-level2.png");

  climber1.material.map = climber1Texture;
  climber1.material.needsUpdate = true;

  climber2.material.map = climber2Texture;
  climber2.material.needsUpdate = true; 

  // Update background to night version
  loader.load('assets/mount-rainier-level2.jpg', texture => {
    scene.background = texture;
  });

  isNightClimb = true;
  document.getElementById("nightOverlay").style.opacity = "0.75"; // Set initial darkness

  updateGearHUD(); // Ensure tools persist in HUD
}

// Start level two
function startLevel2() {
  currentLevel = 2;
  clearPlatforms(); // Remove level 1 platforms
  loadLevel2();
}

// Helper function for lighting during night climb
function updateNightClimbLighting() {
  if (isNightClimb) {
    const fadeStart = 214; // Camp Muir
    const fadeEnd = 376;   // Disappointment Cleaver
    const x = climber1.position.x;

    if (x >= fadeStart && x <= fadeEnd) {
      // Fade in light intensity as we pass Camp Muir
      const progress = (x - fadeStart) / (fadeEnd - fadeStart);
      const intensity = 5 * (1 - progress); // Starts bright, fades out
      climber1Light.intensity = intensity;
      climber2Light.intensity = intensity;
    } else {
      // Before Camp Muir or after Cleaver: lights off
      climber1Light.intensity = 0;
      climber2Light.intensity = 0;
    }
  } else {
    // During daytime: no lights
    climber1Light.intensity = 0;
    climber2Light.intensity = 0;
  }
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