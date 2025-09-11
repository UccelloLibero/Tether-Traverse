import { sharedState } from "../play/state.js";

export function triggerOverlay(title, message, onContinue) {
  const overlay = document.getElementById("overlay");
  const levelTitle = document.getElementById("levelTitle");
  const levelText = document.getElementById("levelText");
  const continueBtn = document.getElementById("continueBtn");

  overlay.classList.remove("hidden");
  levelTitle.textContent = title;
  levelText.textContent = message;
  continueBtn.classList.remove("hidden");

  continueBtn.onclick = () => {
    overlay.classList.add("hidden");
    continueBtn.classList.add("hidden");
    if (onContinue) onContinue();
  };
}

// Replace DOM-only celebration with cinematic-capable version.
// If sharedState.scene/camera/renderer exist, perform a camera zoom on the players
// and render the scene during the zoom, then show the overlay message + snowflakes.
// Otherwise behave as before (DOM-only snowflakes).
export function startSummitCelebration(percent = 0) {
  if (startSummitCelebration._done) return;
  startSummitCelebration._done = true;

  const summitDiv = document.getElementById("summitCelebration");
  if (!summitDiv) return;

  // Helper to create snowflakes inside a container
  function createOverlaySnowflakes(container, total = 60) {
    let flakes = container.querySelector(".overlay-snowflakes");
    if (!flakes) {
      flakes = document.createElement("div");
      flakes.className = "overlay-snowflakes";
      flakes.style.position = "absolute";
      flakes.style.inset = "0";
      flakes.style.pointerEvents = "none";
      flakes.style.overflow = "hidden";
      container.appendChild(flakes);
    } else {
      flakes.innerHTML = "";
    }

    for (let i = 0; i < total; i++) {
      const flake = document.createElement("div");
      flake.className = "snowflake";
      flake.textContent = "❄️";
      const left = Math.random() * 100;
      const delay = (Math.random() * 1.2).toFixed(2);
      const duration = (3 + Math.random() * 6).toFixed(2);
      const size = (0.6 + Math.random() * 1.2).toFixed(2);
      const drift = (Math.random() * 120 - 60).toFixed(1);
      flake.style.position = "absolute";
      flake.style.left = `${left}%`;
      flake.style.top = `-6%`;
      flake.style.animationDelay = `${delay}s`;
      flake.style.animationDuration = `${duration}s`;
      flake.style.transform = `translateX(${drift}px) scale(${size})`;
      flake.style.fontSize = "clamp(16px, 2vw, 34px)";
      flakes.appendChild(flake);
    }
    return flakes;
  }

  function clearOverlaySnowflakes(container) {
    const flakes = (container || summitDiv).querySelector(".overlay-snowflakes");
    if (flakes && flakes.parentNode) flakes.parentNode.removeChild(flakes);
  }

  // Message text
  const celebratoryMsg = `Congratulations! You've reached the summit of Mount Rainier! Rope safety: ${percent}%. \nThank you for playing Tether Traverse!`;

  // If we have renderer + camera, do a short cinematic zoom first
  const state = typeof sharedState !== "undefined" ? sharedState : null;
  if (state && state.scene && state.camera && state.renderer) {
    const camera = state.camera;
    const renderer = state.renderer;
    const c1 = state.climber1 || null;
    const c2 = state.climber2 || null;

    // compute target center above climbers
    let targetX = camera.position.x;
    let targetY = camera.position.y;
    if (c1 && c2 && c1.position && c2.position) {
      targetX = (c1.position.x + c2.position.x) / 2;
      targetY = (c1.position.y + c2.position.y) / 2 + 1.2;
    }

    const startT = performance.now();
    const duration = 1400;
    const startX = camera.position.x;
    const startY = camera.position.y;
    const startZoom = camera.zoom || 1;
    const targetZoom = Math.max(1.6, startZoom * 1.8);
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function step(now) {
      const t = Math.min(1, (now - startT) / duration);
      const e = easeOut(t);
      camera.position.x = startX + (targetX - startX) * e;
      camera.position.y = startY + (targetY - startY) * e;
      camera.zoom = startZoom + (targetZoom - startZoom) * e;
      if (camera.updateProjectionMatrix) camera.updateProjectionMatrix();

      renderer.clear();
      renderer.render(state.scene, camera);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        // After zoom: show DOM overlay message and snowflakes
        summitDiv.classList.remove("hidden");
        summitDiv.innerHTML = "";
        const msg = document.createElement("div");
        msg.className = "celebration-message";
        msg.textContent = celebratoryMsg;
        summitDiv.appendChild(msg);

        createOverlaySnowflakes(summitDiv, 60);

        // remove flakes after ~9s and hide summitDiv after 12s
        setTimeout(() => clearOverlaySnowflakes(summitDiv), 9000);
        setTimeout(() => summitDiv.classList.add("hidden"), 12000);

        // final exit after 15s
        setTimeout(() => {
          if (window.exitToLanding) window.exitToLanding();
          else window.location.href = "#landingPage";
        }, 15000);
      }
    }
    requestAnimationFrame(step);
  } else {
    // DOM-only fallback: show message + flakes immediately
    summitDiv.classList.remove("hidden");
    summitDiv.innerHTML = "";
    const msg = document.createElement("div");
    msg.className = "celebration-message";
    msg.textContent = celebratoryMsg;
    summitDiv.appendChild(msg);

    createOverlaySnowflakes(summitDiv, 60);
    setTimeout(() => clearOverlaySnowflakes(summitDiv), 9000);
    setTimeout(() => {
      summitDiv.classList.add("hidden");
      if (window.exitToLanding) window.exitToLanding();
      else window.location.href = "#landingPage";
    }, 15000);
  }
}

// Make the celebration available globally for fallback usage
if (typeof window !== "undefined") window.startSummitCelebration = startSummitCelebration;
