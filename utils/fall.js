export function checkFall(state, climber1, climber2) {
  const avgY = (climber1.position.y + climber2.position.y) / 2;

  const fallThreshold = -4.5;
  const gameOverThreshold = -50;

  if (state.justResetFall) return;

  if (state.currentLevel === 1 && avgY < fallThreshold) {
    state.justResetFall = true;
    resetToLastPlatform(state, climber1, climber2);
    showFallOverlay("You slipped!", "Back to a safer spot.");
    setTimeout(() => (state.justResetFall = false), 1000);
  }

  if (state.currentLevel === 2 && avgY < gameOverThreshold) {
    state.justResetFall = true;
    triggerGameOver();
    showFallOverlay("Fell into a crevasse!", "No safe way out.");
    setTimeout(() => (state.justResetFall = false), 1000);
  }
}

function resetToLastPlatform(state, climber1, climber2) {
  const last = state.lastSafePlatform;
  if (!last) return;

  climber1.position.set(last.x - 0.5, last.y + 1.5, 0);
  climber2.position.set(last.x + 0.5, last.y + 1.5, 0);

  state.c1.vy = 0;
  state.c2.vy = 0;
}

function showFallOverlay(title, message) {
  const overlay = document.getElementById("fall-overlay");
  overlay.classList.remove("hidden");
  document.getElementById("fall-title").textContent = title;
  document.getElementById("fall-message").textContent = message;

  setTimeout(() => overlay.classList.add("hidden"), 3000);
}

function triggerGameOver() {
  sharedState.gamePaused = true;
  document.getElementById("gameOverScreen").classList.remove("hidden");

  document.getElementById("playAgainBtn").onclick = () => {
    sharedState.currentLevel = 1;
    sharedState.lastSafePlatform = null;
    sharedState.gear = {};
    sharedState.snacks = 3;
    sharedState.water = 3;
    document.getElementById("gameOverScreen").classList.add("hidden");
    startGame(); // clean restart
  };

  document.getElementById("exitBtn").onclick = () => {
    window.location.href = "index.html";
  };
}