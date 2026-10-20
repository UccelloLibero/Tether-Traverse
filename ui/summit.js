import { sharedState } from "../play/state.js";
import { getRopeStats, MIN_SAFE_DISTANCE, maxRopeLength } from "../utils/rope.js";
import { showMobileControls } from "./mobileControls.js";

// Summit ending:
//   1. Zoom in on the rope team standing on Columbia Crest
//   2. Hold on them with a title card
//   3. Pull back wide to reveal the climb below
//   4. Show the rope-spacing results with snowfall and Play Again / Main Menu

let running = false;
let rafId = null;
let timers = [];

const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function later(fn, ms) {
  timers.push(setTimeout(fn, ms));
}

// Zoom so `units` world units fit vertically, whatever the screen size
function zoomToFit(camera, units) {
  return (camera.top - camera.bottom) / units;
}

function tweenCamera(to, duration, onDone) {
  const camera = sharedState.camera;
  const from = { x: camera.position.x, y: camera.position.y, zoom: camera.zoom };
  const start = performance.now();

  function step(now) {
    if (!running) return;
    const t = Math.min(1, (now - start) / duration);
    const e = easeInOut(t);
    camera.position.x = from.x + (to.x - from.x) * e;
    camera.position.y = from.y + (to.y - from.y) * e;
    camera.zoom = from.zoom + (to.zoom - from.zoom) * e;
    camera.updateProjectionMatrix();
    sharedState.renderer.render(sharedState.scene, camera);

    if (t < 1) rafId = requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  rafId = requestAnimationFrame(step);
}

function rating(pct) {
  if (pct >= 85) return "Textbook rope team. Your guide would be proud!";
  if (pct >= 65) return "Solid teamwork. A little more rope discipline next time.";
  if (pct >= 40) return "You made it, but that rope was a little wild.";
  return "You survived... but that rope was a hazard. Mind your spacing!";
}

function showTitle(container) {
  const title = document.createElement("div");
  title.className = "summit-title";
  title.innerHTML = `<span>Columbia Crest</span><small>14,410 ft · Summit of Mount Rainier</small>`;
  container.appendChild(title);
  return title;
}

function addSnow(container, total = 50) {
  const flakes = document.createElement("div");
  flakes.className = "overlay-snowflakes";
  for (let i = 0; i < total; i++) {
    const flake = document.createElement("div");
    flake.className = "snowflake";
    flake.textContent = "❄️";
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.animationDelay = `${(Math.random() * 3).toFixed(2)}s`;
    flake.style.animationDuration = `${(4 + Math.random() * 6).toFixed(2)}s`;
    flake.style.animationIterationCount = "infinite";
    flakes.appendChild(flake);
  }
  container.appendChild(flakes);
}

function showResults(container) {
  const s = getRopeStats();
  const card = document.createElement("div");
  card.className = "summit-card";
  card.innerHTML = `
    <h2>You reached the summit!</h2>
    <p class="summit-sub">Rope spacing for the whole climb</p>

    <div class="summit-score">
      <span class="summit-score-num">${s.safePct}%</span>
      <span class="summit-score-label">ideal spacing (${MIN_SAFE_DISTANCE}–${maxRopeLength} m)</span>
    </div>

    <div class="spacing-bar" role="img"
         aria-label="Ideal ${s.safePct}%, too close ${s.tooClosePct}%, too far ${s.tooFarPct}%">
      <span class="seg ideal" style="width:${s.safePct}%"></span>
      <span class="seg close" style="width:${s.tooClosePct}%"></span>
      <span class="seg far" style="width:${s.tooFarPct}%"></span>
    </div>

    <ul class="spacing-legend">
      <li><i class="ideal"></i>Ideal <b>${s.safePct}%</b></li>
      <li><i class="close"></i>Too close <b>${s.tooClosePct}%</b></li>
      <li><i class="far"></i>Too far <b>${s.tooFarPct}%</b></li>
    </ul>
    <p class="summit-not-ideal">Not ideal overall: <b>${s.tooClosePct + s.tooFarPct}%</b> of the climb</p>

    <p class="summit-rating">${rating(s.safePct)}</p>

    <div class="summit-actions">
      <button id="summitPlayAgain">Climb Again</button>
      <button id="summitMenu">Main Menu</button>
    </div>
    <p class="summit-thanks">Thank you for playing Tether Traverse!</p>
  `;
  container.appendChild(card);

  card.querySelector("#summitPlayAgain").onclick = () => {
    stopSummit();
    showMobileControls(true);
    window.restartGame();
  };
  card.querySelector("#summitMenu").onclick = () => {
    stopSummit();
    window.exitToLanding();
  };
}

export function startSummitSequence() {
  if (running) return;
  const { camera, renderer, scene, climber1: c1, climber2: c2 } = sharedState;
  if (!camera || !renderer || !scene || !c1 || !c2) return;

  running = true;
  sharedState.gamePaused = true; // freeze physics; we render the cinematic ourselves
  showMobileControls(false);
  if (sharedState.ropeDistanceLabel) sharedState.ropeDistanceLabel.style.display = "none";

  // Close any checkpoint pop-up still open from High Break
  document.getElementById("overlay")?.classList.add("hidden");

  const container = document.getElementById("summitCelebration");
  container.innerHTML = "";
  container.classList.remove("hidden");

  const midX = (c1.position.x + c2.position.x) / 2;
  const midY = (c1.position.y + c2.position.y) / 2;

  // 1. Push in close on the climbers (~6 world units tall on screen)
  tweenCamera({ x: midX, y: midY + 0.6, zoom: zoomToFit(camera, 6) }, 1800, () => {
    // 2. Hold on the summit moment
    const title = showTitle(container);
    later(() => {
      title.classList.add("fade-out");
      // 3. Pull back wide, down and to the left, to show the route they climbed
      tweenCamera({ x: midX - 10, y: midY - 6, zoom: zoomToFit(camera, 30) }, 2800, () => {
        // 4. Results
        addSnow(container);
        showResults(container);
      });
    }, 1800);
  });
}

// Cancel the ending (Play Again, Main Menu, or a fresh game) and clear its UI
export function stopSummit() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  timers.forEach(clearTimeout);
  timers = [];

  const container = document.getElementById("summitCelebration");
  if (container) {
    container.innerHTML = "";
    container.classList.add("hidden");
  }
  if (sharedState.ropeDistanceLabel) sharedState.ropeDistanceLabel.style.display = "";
}
