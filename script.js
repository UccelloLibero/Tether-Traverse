// Game Setup
let scene, camera, renderer;
let climber1, climber2, rope;
let platforms = [];
let keys = {};
let mobileKeys = { left: false, right: false, jump: false };
let ropeMesh;
let bgMesh;

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
  { x: 15, name: "Panorama Point", elevation: 6800, waterUse: 0.5, snackUse: 2, message: "Take a break! Tatoosh Range views." },
  { x: 30, name: "Pebble Creek", elevation: 7200, waterUse: 0.5, snackUse: 2, message: "Rest stop before snowfields." },
  { x: 50, name: "Muir Snowfield", elevation: 8500, waterUse: 0.5, snackUse: 2, message: "Snow trek begins!" },
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
    loader.load('MountRainier.jpg', texture => {
    scene.background = texture;
  });
  scene = new THREE.Scene();
  // scene.background = new THREE.Color(0x87CEEB);

  // const bgTexture = loader.load('MountRainier.jpg');
  // const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
  // bgTexture.wrapS = THREE.RepeatWrapping;
  // bgTexture.wrapT = THREE.RepeatWrapping;
  // bgTexture.repeat.set(1, 1); // Repeat vertically to create a parallax effect
  // bgTexture.needsUpdate = true;

  // const bgGeometry = new THREE.PlaneGeometry(50, 50); // Large enough to fill camera view
  // bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  // bgMesh.position.z = -10; // Send it behind all objects
  // scene.add(bgMesh);

  // const bgTexture = loader.load('MountRainier.jpg');
  // bgTexture.wrapS = THREE.RepeatWrapping;
  // bgTexture.wrapT = THREE.RepeatWrapping;
  // bgTexture.repeat.set(1, 1);

  // const bgMaterial = new THREE.MeshBasicMaterial({ map: bgTexture });
  // const bgGeometry = new THREE.PlaneGeometry(300, 2000);
  // bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
  // bgMesh.position.set(0, 0, -5);
  // scene.add(bgMesh);

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

  // Manually place 35 platforms for Level 1 (Paradise to Camp Muir)
  createPlatform(4, -2);
  createPlatform(10, -1.5);
  createPlatform(16, -1);
  createPlatform(22, -0.5);
  createPlatform(28, 0);
  createPlatform(34, 0.5);
  createPlatform(40, 1);
  createPlatform(46, 1.5);
  createPlatform(52, 2);
  createPlatform(58, 2.5);      
  createPlatform(64, 3);
  createPlatform(70, 3.5);
  createPlatform(76, 4);
  createPlatform(82, 4.5);
  createPlatform(88, 5);
  createPlatform(94, 5.5);
  createPlatform(100, 6);
  createPlatform(106, 6.5);
  createPlatform(112, 7);
  createPlatform(118, 7.5);
  createPlatform(124, 8);
  createPlatform(130, 8.5);
  createPlatform(136, 9);
  createPlatform(142, 10);
  createPlatform(148, 10.5);
  createPlatform(154, 11);
  createPlatform(160, 12);
  createPlatform(166, 12.5);
  createPlatform(172, 13);
  createPlatform(178, 14);
  createPlatform(184, 14.5);
  createPlatform(190, 15); 
  createPlatform(196, 16);
  createPlatform(202, 17);
  createPlatform(208, 18);
  createPlatform(214, 19);

  // Manually place 40 platforms for Level 2 (Camp Muir to Summit)
  createPlatform(220, 20);
  createPlatform(226, 21);
  createPlatform(232, 22);
  createPlatform(238, 23);
  createPlatform(244, 24);
  createPlatform(250, 25);
  createPlatform(256, 26);
  createPlatform(262, 27);
  createPlatform(268, 28);
  createPlatform(274, 29);
  createPlatform(280, 30);
  createPlatform(286, 31);
  createPlatform(292, 32);
  createPlatform(298, 33);
  createPlatform(304, 34);
  createPlatform(310, 35);
  createPlatform(316, 36);
  createPlatform(322, 37);
  createPlatform(328, 38);
  createPlatform(334, 39);
  createPlatform(340, 40);
  createPlatform(346, 41);
  createPlatform(352, 42);
  createPlatform(358, 43);
  createPlatform(364, 44);
  createPlatform(370, 45);
  createPlatform(376, 46);
  createPlatform(382, 47);
  createPlatform(388, 48);
  createPlatform(394, 49);
  createPlatform(400, 50);
  createPlatform(406, 51);
  createPlatform(412, 52);
  createPlatform(418, 53);
  createPlatform(424, 54);
  createPlatform(430, 55);
  createPlatform(436, 56);
  createPlatform(442, 57);
  createPlatform(448, 58);
  createPlatform(454, 59);
  createPlatform(460, 60);

  // Load textures for each climber
  // const loader = new THREE.TextureLoader();
  const climber1Texture = loader.load('climber1.png');
  const climber2Texture = loader.load('climber1.png');

  // Create climbers as sprites
  climber1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: climber1Texture, transparent: true }));
  climber1.scale.set(1, 1.5, 1);
  climber1.position.set(-2, -4.5, 0);
  scene.add(climber1);

  climber2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: climber2Texture, transparent: true }));
  climber2.scale.set(1, 1.5, 1);
  climber2.position.set(2, -4.75, 0);
  scene.add(climber2);

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

  // Movement
  if (isMobile) {
    // Move only climber1 on mobile
    if (mobileKeys.left) {
      state.c1.x -= moveSpeed;
      climber1.scale.x = -1;
    }
    if (mobileKeys.right) {
      state.c1.x += moveSpeed;
      climber1.scale.x = 1;
    }
    if (mobileKeys.jump && state.c1.grounded) {
      state.c1.vy = jumpPower;
      state.c1.grounded = false;
    }
    
    // Optional: make climber2 follow climber1 softly
    state.c2.x += (state.c1.x - state.c2.x) * 0.05;
  } else {
    if (keys["ArrowLeft"]) {
      state.c1.x -= moveSpeed;
      climber1.scale.x = -1; // ← face left
    }
    if (keys["ArrowRight"]) {
      state.c1.x += moveSpeed;
      climber1.scale.x = 1; // → face right
    }
    if (keys["Space"] && state.c1.grounded) {
      state.c1.vy = jumpPower;
      state.c1.grounded = false;
    }

    if (keys["KeyA"]) {
      state.c2.x -= moveSpeed;
      climber2.scale.x = -1; // ← face left
    }
    if (keys["KeyD"]) {
      state.c2.x += moveSpeed;
      climber2.scale.x = 1; // → face right
    }
    if (keys["KeyW"] && state.c2.grounded) {
      state.c2.vy = jumpPower;
      state.c2.grounded = false;
    }
  }

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

  // Rope physics
  handleRopePhysics();

  updateRope();
  updateCamera();

  // Add bounce and sway only when grounded
  const t = Date.now() * 0.003;
  if (state.c1.grounded) {
    // climber1.position.y += Math.sin(t) * 0.05; // Gentle bounce
    climber1.position.x += Math.sin(t * 0.5) * 0.03; // Sway left/right
    climber1.position.y += Math.cos(t) * 0.01; // Gentle bounce
  }
  if (state.c2.grounded) {
    // climber2.position.y += Math.sin(t + Math.PI) * 0.05; // Gentle bounce
    climber2.position.x += Math.sin(t * 0.5 + Math.PI) * 0.03; // Sway left/right
    climber2.position.y += Math.cos(t + Math.PI) * 0.01; // Gentle bounce
  }

  // Parallax background moves slower than camera
  // bgMesh.material.map.offset.x = camera.position.x * 0.001;
  // bgMesh.material.map.offset.y = camera.position.y * 0.0015; // scroll speed 

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

  if (dist > maxRopeLength) {
    const angle = Math.atan2(dy, dx);

    if (isMobile) {
      // Only pull c2
      state.c2.x += Math.cos(angle) * pullStrength;
      climber2.position.y += Math.sin(angle) * pullStrength;
      climber2.position.x += Math.sin(Date.now() * 0.01) * 0.02;
      climber2.position.y += Math.cos(Date.now() * 0.015) * 0.02;
    } else {
      // Pull both inward
      const mx = (climber1.position.x + climber2.position.x) / 2;
      const my = (climber1.position.y + climber2.position.y) / 2;
      state.c1.x = mx + Math.cos(angle) * maxRopeLength / 2;
      state.c2.x = mx - Math.cos(angle) * maxRopeLength / 2;
      climber1.position.y = my + Math.sin(angle) * maxRopeLength / 2;
      climber2.position.y = my - Math.sin(angle) * maxRopeLength / 2;
    }
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
