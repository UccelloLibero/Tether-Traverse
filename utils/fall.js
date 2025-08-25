export function checkFall(state, climber1, climber2) {
  // Record a safe platform ONLY when both are grounded (reduces jitter saves)
  if (state.c1?.grounded && state.c2?.grounded) {
    const safeY = Math.max(climber1.position.y, climber2.position.y);
    const safeX = (climber1.position.x + climber2.position.x) / 2;
    if (!state.lastSafePlatform || safeY >= state.lastSafePlatform.y - 0.01) {
      state.lastSafePlatform = { x: safeX, y: safeY };
    }
  }

  if (state.justResetFall || !state.lastSafePlatform) return;

  const avgY = (climber1.position.y + climber2.position.y) / 2;
  const fallDistance = state.lastSafePlatform.y - avgY;

  const LEVEL1_RESET_DISTANCE = 4;
  const LEVEL2_GAMEOVER_DISTANCE = 12;

  if (state.currentLevel === 1 && fallDistance > LEVEL1_RESET_DISTANCE) {
    state.justResetFall = true;
    smoothResetToLastPlatform(state, climber1, climber2);
    return;
  }

  if (state.currentLevel === 2 && fallDistance > LEVEL2_GAMEOVER_DISTANCE) {
    state.justResetFall = true;
    triggerGameOver(state);
    showFallOverlay("Fell into a crevasse!", "No safe way out.");
    state.skipFrame = true;
    setTimeout(() => (state.justResetFall = false), 800);
  }
}

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

function showFallOverlay(title, message) {
  const overlay = document.getElementById("fall-overlay");
  if (!overlay) return;
  overlay.classList.remove("hidden");
  const t = document.getElementById("fall-title");
  const m = document.getElementById("fall-message");
  if (t) t.textContent = title;
  if (m) m.textContent = message;
  setTimeout(() => overlay.classList.add("hidden"), 2200);
}

function triggerGameOver(state) {
  state.gamePaused = true;
  const screen = document.getElementById("gameOverScreen");
  if (!screen) return;
  screen.classList.remove("hidden");

  const playAgain = document.getElementById("playAgainBtn");
  const exit = document.getElementById("exitBtn");

  if (playAgain) {
    playAgain.onclick = () => {
      state.currentLevel = 1;
      state.lastSafePlatform = null;
      state.tools = [];
      state.snacks = 10;
      state.water = 2.0;
      screen.classList.add("hidden");
      window.location.reload();
    };
  }
  if (exit) {
    exit.onclick = () => {
      window.location.href = "index.html";
    };
  }
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