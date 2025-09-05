import { createPlatform } from "../utils/platforms.js";
import { checkCollision } from "../utils/collision.js";
import { sharedState} from "../play/state.js";
import { initHUD, updateGearHUD, flashScreen } from "../ui/hud.js";
import { createGear, detectGearPickup, animateGearItems, gearItems } from "../utils/gear.js";
import { initLevel1, updateLevel1, cleanupLevel1 } from "../levels/level1.js";
import { initLevel2, updateLevel2, cleanupLevel2 } from "../levels/level2.js";
import { createLevel2Lights, updateHeadLampLighting } from "../players/level2players.js";
import { cleanupPlayersLevel1, climber1 as climber1Level1, climber2 as climber2Level1 } from "../players/level1players.js";
import { climber1 as climber1Level2, climber2 as climber2Level2 } from "../players/level2players.js";
import { handleBreakpoints } from "../utils/breakpoints.js";
import { updatePlayerLevel1 } from "../players/level1players.js";
import { updatePlayerLevel2 } from "../players/level2players.js";
import { initRope, updateRope, handleRopePhysics, getRopeDistanceSamples, cleanupRope } from "../utils/rope.js";
import { initMusic, toggleMusic } from "../utils/music.js";
import { checkFall } from "../utils/fall.js";



let animationId;
let lastTime = performance.now();

// Detect mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const pullStrength = 0.05;
const maxRopeLength = 3; // was 2.5

sharedState.reachedCampMuir = false;


// Game entry point
export function startGame() {
    initScene();
    initMusic(sharedState.camera); // Initialize background music
    initHUD();
    initLevel1(sharedState);
    initRope(sharedState.scene, climber1Level1, climber2Level1); // Initialize rope for level 1
    animate();
}

function initScene() {
    sharedState.scene = new THREE.Scene();
    sharedState.platforms = []; // Initialize platforms array

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 10, 10);
    sharedState.scene.add(directionalLight);

    // Ambient light to soften shadows
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2); 
    sharedState.scene.add(ambientLight);

    sharedState.camera = new THREE.OrthographicCamera(
        window.innerWidth / -100, window.innerWidth / 100,
        window.innerHeight / 100, window.innerHeight / -100,
        0.1, 1000
    );
    sharedState.camera.position.z = 10;

    sharedState.renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById("gameCanvas"),
        antialias: true
     });

    sharedState.renderer.setSize(window.innerWidth, window.innerHeight);


    window.addEventListener("resize", () => {
        sharedState.camera.left = window.innerWidth / -100;
        sharedState.camera.right = window.innerWidth / 100;
        sharedState.camera.top = window.innerHeight / 100;
        sharedState.camera.bottom = window.innerHeight / -100;
        sharedState.camera.updateProjectionMatrix();
        sharedState.renderer.setSize(window.innerWidth, window.innerHeight);
    }); 
}


// Call after Camp Muir screen
export function startLevel2() {
    cleanupLevel1(sharedState); // remove Level 1 elements
    cleanupPlayersLevel1(sharedState.scene); // remove Level 1 climbers

    sharedState.c1 = { x: 214, y: 23, vy: 0, grounded: false };
    sharedState.c2 = { x: 212, y: 23, vy: 0, grounded: false };
    // Reset fall tracking so level 2 doesn't insta-trigger game over
    sharedState.lastSafePlatform = null;
    sharedState.justResetFall = false;
    sharedState.level2StartTime = performance.now();
    // Remove any lingering fall fade overlay from level 1
    const fade = document.getElementById("fallFadeOverlay");
    if (fade) fade.remove();

    sharedState.keys = {};
    sharedState.tools = []; // Reset tools for Level 2

    // Reset supplies for Level 2
    sharedState.water = 2.0; // Reset water for Level 2
    sharedState.snacks = 1000; // Reset snacks for Level 2

    // Update HUD (defensive DOM checks)
    const wc = document.getElementById("waterCount");
    if (wc) wc.textContent = sharedState.water.toFixed(1);
    const sc = document.getElementById("snacksCount");
    if (sc) sc.textContent = sharedState.snacks;
    const camp = document.getElementById("campSupplies");
    if (camp) camp.textContent = `💧 ${sharedState.water.toFixed(1)} | 🍎 ${sharedState.snacks}`;

    // fadeToLevel2Background("assets/mount-rainier-level2.jpg"); // Fade in new background

    initLevel2(sharedState);
    sharedState.currentLevel = 2;
    sharedState.gamePaused = false;
    sharedState.isNightClimb = true; // Set night climb state for level 2
    createLevel2Lights(sharedState.scene, climber1Level2, climber2Level2); // Create lights for climbers

    cleanupRope(sharedState.scene); // Remove old rope

    initRope(sharedState.scene, climber1Level2, climber2Level2); // New rope for Level 2

    updateHeadLampLighting(climber1Level2, climber2Level2, sharedState.isNightClimb, climber1Level2.position.x);

    animate(); // resume the loop now
}


// Main animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp to avoid huge jumps
    lastTime = now;

    const renderer = sharedState.renderer; 
    renderer.autoClear = true; // Clear the renderer automatically
    renderer.clear();

    if (sharedState.gamePaused) return;


    // Pick climbers per level
    const climber1 = sharedState.currentLevel === 1 ? climber1Level1 : climber1Level2;
    const climber2 = sharedState.currentLevel === 1 ? climber2Level1 : climber2Level2;

    if (!climber1 || !climber1.position || !climber2 || !climber2.position) return;

    if (sharedState.currentLevel === 1) {
        updateLevel1(sharedState, climber1, dt);
        updatePlayerLevel1(sharedState, dt);
    } else if (sharedState.currentLevel === 2) {
        updateLevel2(sharedState, climber1, dt);
        updatePlayerLevel2(sharedState, dt);

        updateHeadLampLighting(climber1, climber2, sharedState.isNightClimb, climber1.position.x);
    }

    checkFall(sharedState, climber1, climber2);

    // If we just reset this frame, skip rope physics & continue minimal render
    if (sharedState.skipFrame) {
        sharedState.skipFrame = false;
        updateCamera(sharedState.camera, climber1, climber2);
        sharedState.renderer.render(sharedState.scene, sharedState.camera);
        return;
    }

    // Check for Camp Muir platform (x = 214) trigger
    if (sharedState.currentLevel === 1 && climber1.position.x >= 214 && !sharedState.reachedCampMuir) {
        sharedState.reachedCampMuir = true;
        sharedState.gamePaused = true;
        showCampMuirOverlay();
        return; // halt animation loop until Level 2
    }

    
    handleBreakpoints(climber1, sharedState);

    handleRopePhysics(sharedState, climber1, climber2, isMobile, pullStrength, maxRopeLength, dt);
    updateRope(climber1, climber2, sharedState.camera);
    updateRopeDistanceUI(climber1, climber2); // <— new

    updateCamera(sharedState.camera, climber1, climber2);
    detectGearPickup(climber1, sharedState, sharedState.scene, updateGearHUD, flashScreen);

    updateGearHUD(sharedState.tools);

    // Sunrise simulation for level 2
    if (sharedState.currentLevel === 2 && sharedState.isNightClimb) {
        const fadeStart = 214;
        const fadeEnd = 376;
        const currentX = climber1.position.x || 0; // Use climber 1's as main reference or fallback to 0

        if (currentX >= fadeStart && currentX <= fadeEnd) {
            const progress = (currentX - fadeStart) / (fadeEnd - fadeStart);
            const newOpacity = 0.5 * (1 - progress); // Fade from 0.5 to 0
            document.getElementById("nightOverlay").style.opacity = newOpacity;
        }

        if (currentX > fadeEnd) {
            document.getElementById("nightOverlay").style.opacity = 0; // Fully transparent after fade
        }
    }

    sharedState.renderer.clearDepth();  // Clears depth between frames
    sharedState.renderer.clear();

    sharedState.renderer.render(sharedState.scene, sharedState.camera);

}

function fadeToLevel2Background(texturePath) {
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "black";
    overlay.style.opacity = "1";
    overlay.style.transition = "opacity 2s ease-out";
    overlay.style.zIndex = "999"; // Ensure it is above other elements
    document.body.appendChild(overlay);

    setTimeout(() => {
        const loader = new THREE.TextureLoader();
        loader.load(texturePath, (texture) => {
            sharedState.scene.background = texture;
        });
        overlay.style.opacity = "0"; // Fade out the overlay
    }, 500); // Wait for 0.5 seconds before starting the fade

}

export function fadeOutAndPause(title, message) {
    const overlay = document.getElementById("overlay");
    overlay.classList.remove("hidden");
    document.getElementById("levelTitle").textContent = title;
    document.getElementById("levelText").textContent = message;

    setTimeout(() => {
        overlay.classList.add("hidden");
    }, 4000);
}

function showCampMuirOverlay() {
  const overlay = document.getElementById("campMuirOverlay");
  overlay.classList.remove("hidden");

  document.getElementById("startLevel2Btn").onclick = () => {
    overlay.classList.add("hidden");
    startLevel2(); 
  };
}

// Stop the game and cancel animation
export function stopGame() {
    sharedState.gamePaused = true;
    cancelAnimationFrame(animationId);
    
    // Cleanup scene
    while (sharedState.scene.children.length > 0) {
        sharedState.scene.remove(sharedState.scene.children[0]);
    }
    
    // Reset state
    sharedState.currentLevel = 1;
    sharedState.gamePaused = false;
    
    // Reset camera position
    sharedState.camera.position.set(0, 0, 10);
    
    // Reset HUD
    initHUD(sharedState);
}

// Pause the game and show pause menu
export function pauseGame() {
    sharedState.gamePaused = true;
    document.getElementById("pauseMenu").style.display = "flex";
}

// Resume the game from pause menu
export function resumeGame() {
    sharedState.gamePaused = false;
    document.getElementById("pauseMenu").style.display = "none";
    animate(); // Resume animation loop
}

// REPLACE old restartGame (that used window.location.reload) with soft restart:
export function restartGame() {
    // Stop current loop
    if (animationId) cancelAnimationFrame(animationId);

    // Hide overlays
    const go = document.getElementById("gameOverScreen");
    if (go) go.classList.add("hidden");
    const pause = document.getElementById("pauseMenu");
    if (pause) pause.style.display = "none";

    // Remove rope distance label
    if (sharedState.ropeDistanceLabel) {
        sharedState.ropeDistanceLabel.remove();
        sharedState.ropeDistanceLabel = null;
    }

    // Clear scene
    if (sharedState.scene) {
        while (sharedState.scene.children.length) {
            const obj = sharedState.scene.children.pop();
            if (obj.geometry) obj.geometry.dispose?.();
            if (obj.material) {
                if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
                else obj.material.dispose?.();
            }
        }
    }

    // Reset state (mirror initial fresh start)
    sharedState.currentLevel = 1;
    sharedState.tools = [];
    sharedState.platforms = [];
    sharedState.c1 = { x: 0, y: 0, vy: 0, grounded: false };
    sharedState.c2 = { x: 0, y: 0, vy: 0, grounded: false };
    sharedState.keys = {};
    sharedState.water = 2.0;
    sharedState.snacks = 10;
    sharedState.justResetFall = false;
    sharedState.lastSafePlatform = null;
    sharedState.skipFrame = false;
    sharedState.fallTransitionActive = false;
    sharedState.lastTooCloseShown = 0;
    sharedState.facing = "right";
    sharedState.reachedCampMuir = false;
    sharedState.level2StartTime = 0;
    sharedState.isNightClimb = false;

    const night = document.getElementById("nightOverlay");
    if (night) night.style.opacity = 0;

    // Re-init core systems
    initScene();
    initHUD();
    initLevel1(sharedState);
    initRope(sharedState.scene, climber1Level1, climber2Level1);
    sharedState.gamePaused = false;
    lastTime = performance.now();
    animate();

    // Expose for Game Over (Level 2) reuse
    window.restartGame = restartGame;
}

// Ensure buttons are bound (add this block once; avoid duplicates)
(function bindMenuButtonsOnce() {
    const resumeBtn = document.getElementById("resumeBtn");
    if (resumeBtn && !resumeBtn._bound) {
        resumeBtn._bound = true;
        resumeBtn.addEventListener("click", resumeGame);
    }
    const restartBtn = document.getElementById("restartBtn");
    if (restartBtn && !restartBtn._bound) {
        restartBtn._bound = true;
        restartBtn.addEventListener("click", restartGame);
    }
    const playAgainBtn = document.getElementById("playAgainBtn");
    if (playAgainBtn && !playAgainBtn._bound) {
        playAgainBtn._bound = true;
        playAgainBtn.addEventListener("click", () => {
            const go = document.getElementById("gameOverScreen");
            if (go) go.classList.add("hidden");
            restartGame();
        });
    }
})();

// Camera
function updateCamera(camera, climber1, climber2) {
    const centerX = (climber1.position.x + climber2.position.x) / 2;
    const centerY = (climber1.position.y + climber2.position.y) / 2 + 2;
    camera.position.x += (centerX - camera.position.x) * 0.05; // Smoothly follow climbers
    camera.position.y += (centerY - camera.position.y) * 0.05; // Smoothly follow climbers
}

document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("landingPage").style.display = "none";
  startGame();
});


document.getElementById("resumeBtn").addEventListener("click", resumeGame);

// Tract keyboard input
window.addEventListener("keydown", e => {
    sharedState.keys[e.code] = true;
});
window.addEventListener("keyup", e => {
    sharedState.keys[e.code] = false;
});

// REMOVE old keydown listener that only handled music:
// document.addEventListener("keydown", (event) => {
//     const key = event.code;
//     if (key === "KeyM") {
//         toggleMusic();
//     }
// });

// Unified key handler (Escape + Music) with single-bind guard
if (!window._ttEscapeBound) {
    window._ttEscapeBound = true;
    document.addEventListener("keydown", (e) => {
        if (e.code === "Escape") {
            if (sharedState.gamePaused) {
                resumeGame();
            } else {
                pauseGame();
            }
        } else if (e.code === "KeyM") {
            toggleMusic();
        }
    });
}

document.getElementById("playAgainBtn").onclick = () => {
  document.getElementById("gameOverScreen").classList.add("hidden");
  restartGame(); 
};

document.getElementById("exitBtn").onclick = () => {
  const go = document.getElementById("gameOverScreen");
  if (go) go.classList.add("hidden");
  // Use unified exit handler
  if (window.exitToLanding) window.exitToLanding();
  else window.location.href = "#landingPage";
};

function updateRopeDistanceUI(c1, c2) {
    const dx = c1.position.x - c2.position.x;
    const dy = c1.position.y - c2.position.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    // Create label if needed
    if (!sharedState.ropeDistanceLabel) {
        const el = document.createElement("div");
        el.className = "rope-distance-label";
        document.body.appendChild(el);
        sharedState.ropeDistanceLabel = el;
    }

    // Round up to one decimal place
    const rounded = Math.ceil(dist * 10) / 10;
    sharedState.ropeDistanceLabel.textContent = `${rounded.toFixed(1)}m`;

    // Project midpoint to screen
    const mid = new THREE.Vector3(
        (c1.position.x + c2.position.x)/2,
        (c1.position.y + c2.position.y)/2,
        0
    );
    mid.project(sharedState.camera);
    const sx = (mid.x + 1) * 0.5 * window.innerWidth;
    const sy = (-mid.y + 1) * 0.5 * window.innerHeight;

    sharedState.ropeDistanceLabel.style.left = `${sx}px`;
    sharedState.ropeDistanceLabel.style.top  = `${sy}px`;

    // Too close hint
    if (dist < 1) {
        const now = performance.now();
        if (now - sharedState.lastTooCloseShown > 1400) {
            sharedState.lastTooCloseShown = now;
            const hint = document.createElement("div");
            hint.className = "too-close-hint";
            hint.textContent = "Too close...";
            hint.style.left = `${sx}px`;
            hint.style.top = `${sy}px`;
            document.body.appendChild(hint);
            setTimeout(() => {
                if (hint.parentNode) hint.parentNode.removeChild(hint);
            }, 1200);
        }
        sharedState.ropeDistanceLabel.style.background = "rgba(160,40,40,0.85)";
    } else if (dist >= maxRopeLength) {
        // New "Too far..." hint
        const now = performance.now();
        if (now - sharedState.lastTooFarShown > 1400) {
            sharedState.lastTooFarShown = now;
            const hint = document.createElement("div");
            hint.className = "too-close-hint"; // reuse style
            hint.textContent = "Too far...";
            hint.style.background = "rgba(200,120,20,0.9)";
            hint.style.left = `${sx}px`;
            hint.style.top = `${sy}px`;
            document.body.appendChild(hint);
            setTimeout(() => {
                if (hint.parentNode) hint.parentNode.removeChild(hint);
            }, 1200);
        }
        sharedState.ropeDistanceLabel.style.background = "rgba(200,120,20,0.85)";
    } else {
        sharedState.ropeDistanceLabel.style.background = "rgba(0,0,0,0.55)";
    }
}

// Expose a unified "exit to instructions" routine so all modules can reuse it.
// Stops the game, hides HUD/overlays and shows the landing/instructions.
export function exitToLanding() {
    // Ensure game loop is stopped and scene cleared
    stopGame();

    // Hide overlays and game UI
    const go = document.getElementById("gameOverScreen");
    if (go) go.classList.add("hidden");
    const pause = document.getElementById("pauseMenu");
    if (pause) pause.style.display = "none";
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.classList.add("hidden");

    // Show landing page and hide HUD
    const landing = document.getElementById("landingPage");
    if (landing) {
        // restore the original centered layout (landing uses flex in CSS)
        landing.style.display = "flex";
        landing.style.zIndex = "1000";
    }
    const hud = document.getElementById("hud");
    if (hud) hud.classList.add("hidden");

    // Reset hash for sensible browser state
    try { window.location.hash = "#landingPage"; } catch (e) { /* noop */ }
}
// make callable globally for modules that don't import this file
window.exitToLanding = exitToLanding;