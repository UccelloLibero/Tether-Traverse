// Level 2 night climb: the screen starts dark with a headlamp circle around each
// climber. As they gain altitude the circles widen and the darkness lifts until
// it's full daylight by Disappointment Cleaver (sunrise).

const NIGHT_START_Y = 20;   // Camp Muir platform height
const SUNRISE_Y = 46;       // Disappointment Cleaver platform height
const MAX_DARKNESS = 0.92;
const BEAM_START = 2.2;     // headlamp radius in world units at Camp Muir

const NIGHT_RGB = [4, 6, 22];   // deep night blue
const DAWN_RGB = [52, 26, 48];  // purple-pink just before sunrise

const smoothstep = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

// 1 = full night, 0 = full daylight, based on the climbers' average height
export function getNightAmount(climber1, climber2) {
  const avgY = (climber1.position.y + climber2.position.y) / 2;
  const t = Math.min(1, Math.max(0, (avgY - NIGHT_START_Y) / (SUNRISE_Y - NIGHT_START_Y)));
  return 1 - smoothstep(t);
}

function getCanvas() {
  const canvas = document.getElementById("nightOverlay");
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return canvas;
}

export function clearNightSky() {
  const canvas = document.getElementById("nightOverlay");
  if (!canvas) return;
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.opacity = "0";
}

export function updateNightSky(state, climber1, climber2) {
  if (state.currentLevel !== 2 || !state.isNightClimb) {
    clearNightSky();
    return;
  }

  const night = getNightAmount(climber1, climber2);
  if (night <= 0.01) {
    clearNightSky();
    return;
  }

  const canvas = getCanvas();
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  const camera = state.camera;
  camera.updateMatrixWorld();

  // Screen pixels per world unit (accounts for phone zoom-out and camera zoom)
  const pxPerUnit = (w / (camera.right - camera.left)) * camera.zoom;
  const day = 1 - night;

  // Beams widen with altitude until they cover the whole screen
  const screenDiag = Math.hypot(w, h) / pxPerUnit;
  const beamRadius = lerp(BEAM_START, screenDiag, day * day) * pxPerUnit;

  // Darkness lifts and shifts from night blue toward dawn colors
  const alpha = MAX_DARKNESS * night;
  const rgb = NIGHT_RGB.map((c, i) => Math.round(lerp(c, DAWN_RGB[i], day)));

  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  ctx.fillRect(0, 0, w, h);

  // Cut a soft headlamp circle around each climber
  ctx.globalCompositeOperation = "destination-out";
  for (const climber of [climber1, climber2]) {
    const p = climber.position.clone().project(camera);
    const x = (p.x + 1) * 0.5 * w;
    const y = (-p.y + 1) * 0.5 * h;
    const g = ctx.createRadialGradient(x, y, beamRadius * 0.25, x, y, beamRadius);
    g.addColorStop(0, "rgba(0, 0, 0, 1)");
    g.addColorStop(0.6, "rgba(0, 0, 0, 0.6)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, beamRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";

  canvas.style.opacity = "1";
}
