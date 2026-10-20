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
import { handleBreakpoints, resetBreakpoints, reachedCheckpoint } from "../utils/breakpoints.js";
import { updatePlayerLevel1 } from "../players/level1players.js";
import { updatePlayerLevel2 } from "../players/level2players.js";
import { initRope, updateRope, handleRopePhysics, cleanupRope, resetRopeStats } from "../utils/rope.js";
import { initMusic, toggleMusic } from "../utils/music.js";
import { stopSummit } from "../ui/summit.js";
import { updateNightSky, clearNightSky } from "../ui/nightSky.js";
import { checkFall } from "../utils/fall.js";
import { initMobileControls, showMobileControls, releaseMobileKeys, isTouchDevice, requestLandscape } from "../ui/mobileControls.js";
import { updateFollower, resetFollowTrail } from "../utils/follow.js";



let animationId;
let lastTime = performance.now();

// Detect mobile
const isMobile = isTouchDevice;

const pullStrength = 0.05;
const maxRopeLength = 3; // was 2.5

sharedState.reachedCampMuir = false;


// Game entry point
export function startGame() {
    resetGameState();
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

    sharedState.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    sharedState.camera.position.z = 10;

    sharedState.renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById("gameCanvas"),
        antialias: true
     });

    sharedState.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    fitViewport();

    if (!window._ttResizeBound) {
        window._ttResizeBound = true;
        window.addEventListener("resize", fitViewport);
        window.addEventListener("orientationchange", () => setTimeout(fitViewport, 200));
    }
}

// Desktop shows 50px per world unit. Small screens (phones) zoom out so at least
// ~18 x 9 world units stay visible and upcoming platforms aren't off-screen.
function fitViewport() {
    const { camera, renderer } = sharedState;
    if (!camera || !renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pxPerUnit = Math.min(50, w / 18, h / 9);
    camera.left = -w / (2 * pxPerUnit);
    camera.right = w / (2 * pxPerUnit);
    camera.top = h / (2 * pxPerUnit);
    camera.bottom = -h / (2 * pxPerUnit);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
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
    sharedState.snacks = Math.floor(1000); // Reset snacks for Level 2

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

    startLoop(); // resume the loop now
}


// (Re)start the loop without stacking a second requestAnimationFrame chain.
// The loop keeps ticking while paused, so calling animate() directly would double it.
function startLoop() {
    if (animationId) cancelAnimationFrame(animationId);
    lastTime = performance.now();
    animate();
}

// Main animation loop
function animate() {
    animationId = requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp to avoid huge jumps
    lastTime = now;

    // While paused, leave the last frame on screen (pause menu, fall fade, and
    // the summit cinematic, which renders on its own).
    if (sharedState.gamePaused) return;

    const renderer = sharedState.renderer; 
    renderer.autoClear = true; // Clear the renderer automatically
    renderer.clear();


    // Pick climbers per level
    const climber1 = sharedState.currentLevel === 1 ? climber1Level1 : climber1Level2;
    const climber2 = sharedState.currentLevel === 1 ? climber2Level1 : climber2Level2;

    if (!climber1 || !climber1.position || !climber2 || !climber2.position) return;

    if (sharedState.currentLevel === 1) {
        updateLevel1(sharedState, climber1, dt);
        updatePlayerLevel1(sharedState, dt);
        if (sharedState.followMode) updateFollower(sharedState, climber2);
    } else if (sharedState.currentLevel === 2) {
        updateLevel2(sharedState, climber1, dt);
        updatePlayerLevel2(sharedState, dt);
        if (sharedState.followMode) updateFollower(sharedState, climber2);

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
    if (sharedState.currentLevel === 1 && reachedCheckpoint(climber1, sharedState, 214) && !sharedState.reachedCampMuir) {
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

    // Night climb for level 2: headlamp circles that widen into daylight with altitude
    updateNightSky(sharedState, climber1, climber2);

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
    releaseMobileKeys();
    document.getElementById("pauseMenu").style.display = "flex";
}

// Resume the game from pause menu
export function resumeGame() {
    sharedState.gamePaused = false;
    document.getElementById("pauseMenu").style.display = "none";
    startLoop(); // Resume animation loop
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

    resetGameState();

    // Re-init core systems
    initScene();
    initHUD();
    initLevel1(sharedState);
    initRope(sharedState.scene, climber1Level1, climber2Level1);
    sharedState.gamePaused = false;
    lastTime = performance.now();
    animate();
}
// Expose for Game Over (Level 2) reuse
window.restartGame = restartGame;

// Reset everything a run can change, so a new game (Play Again, or Exit then
// Start) never inherits a stuck death flag, Camp Muir flag, or used checkpoints.
function resetGameState() {
    sharedState.currentLevel = 1;
    sharedState.tools = [];
    sharedState.platforms = [];
    sharedState.c1 = { x: 0, y: 0, vy: 0, grounded: false };
    sharedState.c2 = { x: 0, y: 0, vy: 0, grounded: false };
    sharedState.keys = {};
    sharedState.water = 2.0;
    sharedState.snacks = Math.floor(1000);
    sharedState.justResetFall = false;
    sharedState.lastSafePlatform = null;
    sharedState.skipFrame = false;
    sharedState.fallTransitionActive = false;
    sharedState.lastTooCloseShown = 0;
    sharedState.facing = "right";
    sharedState.reachedCampMuir = false;
    sharedState.level2StartTime = 0;
    sharedState.isNightClimb = false;

    sharedState.lastTooFarShown = 0;
    sharedState.gamePaused = false;

    resetBreakpoints();
    resetRopeStats();
    resetFollowTrail();
    stopSummit();

    const fade = document.getElementById("fallFadeOverlay");
    if (fade) fade.remove();
    clearNightSky();
}

// Escape / mobile pause: only toggles the pause menu. Ignored while the game is
// halted for something else (Game Over, Camp Muir, fall reset, summit).
function togglePause() {
    const pauseMenuOpen = document.getElementById("pauseMenu").style.display === "flex";
    if (pauseMenuOpen) resumeGame();
    else if (!sharedState.gamePaused) pauseGame();
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
    // Keep climbers a little below center to show the route above. On short
    // (phone landscape) screens use a smaller offset so they stay clear of the
    // thumb controls.
    const viewHeight = (camera.top - camera.bottom) / camera.zoom;
    const centerY = (climber1.position.y + climber2.position.y) / 2 + Math.min(2, viewHeight * 0.15);
    camera.position.x += (centerX - camera.position.x) * 0.05; // Smoothly follow climbers
    camera.position.y += (centerY - camera.position.y) * 0.05; // Smoothly follow climbers
}

document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("landingPage").style.display = "none";
  requestLandscape();
  showMobileControls(true);
  startGame();
});


initMobileControls({
    onPause: togglePause,
    onPortraitWhilePlaying: () => { if (!sharedState.gamePaused) pauseGame(); },
    onToggleSound: toggleMusic,
});

// Tract keyboard input
window.addEventListener("keydown", e => {
    sharedState.keys[e.code] = true;
    // A Player 2 key means two people on a keyboard: stop auto-following
    if (e.code === "KeyA" || e.code === "KeyD" || e.code === "KeyW") sharedState.followMode = false;
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
            togglePause();
        } else if (e.code === "KeyM") {
            toggleMusic();
        }
    });
}


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
    stopSummit();
    // Ensure game loop is stopped and scene cleared
    stopGame();

    // Hide overlays and game UI
    const go = document.getElementById("gameOverScreen");
    if (go) go.classList.add("hidden");
    const pause = document.getElementById("pauseMenu");
    if (pause) pause.style.display = "none";
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.classList.add("hidden");

    showMobileControls(false);

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
