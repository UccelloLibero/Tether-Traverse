import { sharedState } from "../play/state.js";

export function checkFall(state, climber1, climber2) {
      if (state.justResetFall) return; // cooldown active, skip fall check

    const avgY = (climber1.position.y + climber2.position.y) / 2;

    if (state.currentLevel === 1) {
        if (avgY < 8 && !isNearAnyPlatform(climber1, state.platforms) && !isNearAnyPlatform(climber2, state.platforms)) {
            resetToLastPlatform(state, climber1, climber2);
            state.justResetFall = true;
            setTimeout(() => {
                state.justResetFall = false;
            }, 500);
        }
    } else if (state.currentLevel === 2) {
        if (avgY < 21 && !isNearAnyPlatform(climber1, state.platforms) && !isNearAnyPlatform(climber2, state.platforms)) {
            triggerGameOver();
        }
    }
}

function resetToLastPlatform(state, climber1, climber2) {
    const lastPlatform = state.lastSafePlatform;

    if (lastPlatform) {
        const c1x = lastPlatform.x - 0.5;
        const c2x = lastPlatform.x + 0.5;
        const newY = lastPlatform.y + 1;

        // Directly move mesh
        climber1.position.set(c1x, newY, 0);
        climber2.position.set(c2x, newY, 0);

        // Force tiny vertical nudge to trigger falling again
        climber1.position.y += 0.01;
        climber2.position.y += 0.01;

        // Update physics state — set `vy` high enough to force falling
        state.c1.x = c1x;
        state.c1.y = newY;
        state.c1.vy = -0.6;
        state.c1.grounded = false;

        state.c2.x = c2x;
        state.c2.y = newY;
        state.c2.vy = -0.6;
        state.c2.grounded = false;
    }
}

function triggerGameOver() {
    sharedState.gamePaused = true;
    document.getElementById("gameOverScreen").classList.remove("hidden");
}

function isNearAnyPlatform(climber, platforms) {
  const bufferY = 0.4; // Vertical leniency
  const bufferX = 0.8; // Horizontal leniency

  for (const p of platforms) {
    const px = p.mesh.position.x;
    const py = p.mesh.position.y;
    const pw = p.mesh.geometry.parameters.width;

    const nearX = Math.abs(climber.position.x - px) < pw / 2 + bufferX;
    const nearY = climber.position.y > py && Math.abs(climber.position.y - py) < bufferY;

    if (nearX && nearY) return true;
  }

  return false;
}