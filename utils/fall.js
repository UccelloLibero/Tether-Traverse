export function checkFall(state, climber1, climber2) {
  // --- Early outs / gating ---
  if (state.gamePaused) return;
  if (state.justResetFall) return;

  // Suppress level 2 fall checks for first 1000ms (spawn settling)
  if (
    state.currentLevel === 2 &&
    performance.now() - state.level2StartTime < 1000
  )
    return;

  // Update last safe platform from any grounded climber (higher one wins)
  const c1Grounded = !!state.c1?.grounded;
  const c2Grounded = !!state.c2?.grounded;
  if (c1Grounded || c2Grounded) {
    const higher =
      climber1.position.y >= climber2.position.y ? climber1 : climber2;
    if (
      !state.lastSafePlatform ||
      higher.position.y >= state.lastSafePlatform.y - 0.05
    ) {
      state.lastSafePlatform = { x: higher.position.x, y: higher.position.y };
    }
  }

  const minY = Math.min(climber1.position.y, climber2.position.y);
  const avgY = (climber1.position.y + climber2.position.y) / 2;

  const haveRef = !!state.lastSafePlatform;
  const fallDistAvg = haveRef ? state.lastSafePlatform.y - avgY : 0;
  const fallDistMin = haveRef ? state.lastSafePlatform.y - minY : 0;

  // Tuning constants
  const LEVEL1_RESET_DISTANCE = 4;
  const LEVEL2_DROP_DISTANCE = 6;
  const LEVEL2_VOID_Y = 13; // lowered so actual void is reachable

  // Level 1 soft reset
  if (
    state.currentLevel === 1 &&
    haveRef &&
    fallDistAvg > LEVEL1_RESET_DISTANCE
  ) {
    state.justResetFall = true;
    smoothResetToLastPlatform(state, climber1, climber2);
    return;
  }

  // Level 2 hard game over
  if (state.currentLevel === 2) {
    const voidKill = minY < LEVEL2_VOID_Y; // fell into void space
    const dropKill = haveRef && fallDistMin > LEVEL2_DROP_DISTANCE;
    if (voidKill || dropKill) {
      // Prevent re-entry if screen already up
      const screen = document.getElementById("gameOverScreen");
      if (screen && !screen.classList.contains("hidden")) return;
      state.justResetFall = true;
      triggerGameOver(
        state,
        "You've fallen into a crevasse. This is the end for you, for now. But you can try to climb again."
      );
    }
  }
}

// (Keep resetToLastPlatform & smoothResetToLastPlatform for Level 1)
function resetToLastPlatform(state, climber1, climber2) {
  const last = state.lastSafePlatform;
  if (!last) return;

  // Place climbers slightly above safe platform center
  climber1.position.set(last.x - 0.5, last.y + 0.8, 0);
  climber2.position.set(last.x + 0.5, last.y + 0.8, 0);

  // Sync underlying physics state so next frame does not overwrite
  state.c1.x = climber1.position.x;
  state.c1.y = climber1.position.y;
  state.c2.x = climber2.position.x;
  state.c2.y = climber2.position.y;

  state.c1.vy = 0;
  state.c2.vy = 0;
  state.c1.grounded = true;
  state.c2.grounded = true;
}

function smoothResetToLastPlatform(state, climber1, climber2) {
  if (!state.lastSafePlatform || state.fallTransitionActive) return;
  state.fallTransitionActive = true;
  state.gamePaused = true;

  const overlay = getOrCreateFallFadeOverlay();

  // Fade to black
  requestAnimationFrame(() => {
    overlay.style.transition = "opacity 0.5s ease";
    overlay.style.opacity = "1";
  });

  // After fade out, reposition silently
  setTimeout(() => {
    resetToLastPlatform(state, climber1, climber2);
    state.skipFrame = true;
  }, 520);

  // Fade back in
  setTimeout(() => {
    overlay.style.opacity = "0";
  }, 900);

  // Cleanup & unpause
  setTimeout(() => {
    state.gamePaused = false;
    state.justResetFall = false;
    state.fallTransitionActive = false;
  }, 1500);
}

// (Optional: Level 1 fall overlay only)
function showFallOverlay(title, message) {
  // Level 2 no longer uses this; keep for Level 1 soft reset feedback if needed.
  const overlay = document.getElementById("fall-overlay");
  if (!overlay) return;
  overlay.classList.remove("hidden");
  const t = document.getElementById("fall-title");
  const m = document.getElementById("fall-message");
  if (t) t.textContent = title;
  if (m) m.textContent = message;
  overlay.style.zIndex = "1500";
  setTimeout(() => overlay.classList.add("hidden"), 1400);
}

function triggerGameOver(state, message = "Game Over") {
  // Clear dark fade / overlays that could mask Game Over
  hideFallFadeOverlay();
  const fade = document.getElementById("fallFadeOverlay");
  if (fade) fade.remove();
  const night = document.getElementById("nightOverlay");
  if (night) night.style.opacity = 0;

  state.gamePaused = true;

  const screen = document.getElementById("gameOverScreen");
  if (!screen) return;
  screen.style.zIndex = "3000";
  screen.classList.remove("hidden");

  const msgEl = document.getElementById("gameOverMessage");
  if (msgEl) msgEl.textContent = message;

  // Hook buttons (idempotent)
  const playAgain = document.getElementById("playAgainBtn");
  if (playAgain && !playAgain._softBound) {
    playAgain._softBound = true;
    playAgain.onclick = () => {
      const screen = document.getElementById("gameOverScreen");
      if (screen) screen.classList.add("hidden");
      if (window.restartGame) {
        window.restartGame();
      } else {
        // Fallback if restartGame not yet exposed
        window.location.reload();
      }
    };
  }

  const exit = document.getElementById("exitBtn");
  if (exit && !exit._exitBound) {
    exit._exitBound = true;
    exit.onclick = () => {
      window.location.href = "#landingPage";
      if (window.restartGame) window.restartGame();
    };
  }
}

// Existing fade helpers
function getOrCreateFallFadeOverlay() {
  let el = document.getElementById("fallFadeOverlay");
  if (!el) {
    el = document.createElement("div");
    el.id = "fallFadeOverlay";
    el.style.position = "fixed";
    el.style.inset = "0";
    el.style.background = "#000";
    el.style.opacity = "0";
    el.style.zIndex = "1500";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
  }
  return el;
}
function hideFallFadeOverlay() {
  const fade = document.getElementById("fallFadeOverlay");
  if (fade) {
    fade.style.opacity = "0";
    // remove after transition if any
    setTimeout(() => fade.parentNode && fade.parentNode.removeChild(fade), 600);
  }
}