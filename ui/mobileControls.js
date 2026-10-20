import { sharedState } from "../play/state.js";

// On-screen buttons steer climber 1. Climber 2 is driven by follow mode
// (utils/follow.js), retracing climber 1's path at the ideal rope spacing.
const KEY_MAP = {
  left:  ["ArrowLeft"],
  right: ["ArrowRight"],
  jump:  ["ArrowUp"],
};

// Phones/tablets start in follow mode. Touching the on-screen controls turns it
// on; pressing a Player 2 key (A/D/W) turns it off for two-player keyboard play.
sharedState.followMode = window.matchMedia("(pointer: coarse)").matches;

export const isTouchDevice =
  window.matchMedia("(pointer: coarse)").matches ||
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0;

let pressed = new Set();

function applyPressed(next) {
  pressed = next;
  for (const [dir, codes] of Object.entries(KEY_MAP)) {
    const down = pressed.has(dir);
    codes.forEach(code => { sharedState.keys[code] = down; });
  }
  document.querySelectorAll("#mobileControls [data-dir]").forEach(btn => {
    btn.classList.toggle("pressed", pressed.has(btn.dataset.dir));
  });
}

export function releaseMobileKeys() {
  applyPressed(new Set());
}

// Work out which buttons are under every finger currently on the screen.
// This supports multi-touch (run + jump) and sliding a thumb between buttons.
function syncTouches(e) {
  e.preventDefault();
  sharedState.followMode = true;
  const next = new Set();
  for (const t of e.touches) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const btn = el && el.closest("#mobileControls [data-dir]");
    if (btn) next.add(btn.dataset.dir);
  }
  applyPressed(next);
}

export function initMobileControls({ onPause, onToggleSound, onPortraitWhilePlaying }) {
  if (!isTouchDevice) return;
  document.body.classList.add("touch");

  initRotatePrompt(onPortraitWhilePlaying);
  initFullscreenButton();

  const controls = document.getElementById("mobileControls");
  ["touchstart", "touchmove", "touchend", "touchcancel"].forEach(type => {
    controls.addEventListener(type, syncTouches, { passive: false });
  });

  document.getElementById("mobilePauseBtn").addEventListener("click", () => {
    releaseMobileKeys();
    onPause();
  });

  const soundBtn = document.getElementById("mobileSoundBtn");
  soundBtn.addEventListener("click", () => {
    onToggleSound();
    const muted = soundBtn.classList.toggle("muted");
    soundBtn.setAttribute("aria-pressed", String(muted));
    soundBtn.setAttribute("aria-label", muted ? "Sound off" : "Sound on");
  });

  // Don't leave a climber running if the app is backgrounded mid-press
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseMobileKeys();
  });
}

let labelTimer = null;

export function showMobileControls(show) {
  document.body.classList.toggle("playing", show);
  if (!show) releaseMobileKeys();

  // Name each button for the first few seconds of a climb, then fade the labels
  clearTimeout(labelTimer);
  document.body.classList.toggle("show-labels", show);
  if (show) labelTimer = setTimeout(() => document.body.classList.remove("show-labels"), 4500);
}

// ---- Landscape ----

const portraitQuery = window.matchMedia("(orientation: portrait)");

// Full-screen "turn your phone sideways" prompt, shown by CSS in portrait.
// "Play in portrait anyway" hides it for the rest of the session.
function initRotatePrompt(onPortraitWhilePlaying) {
  document.getElementById("rotateDismiss").addEventListener("click", () => {
    document.body.classList.add("rotate-dismissed");
  });

  // Rotating to portrait mid-climb pauses the game behind the prompt
  portraitQuery.addEventListener("change", e => {
    const playing = document.body.classList.contains("playing");
    const dismissed = document.body.classList.contains("rotate-dismissed");
    if (e.matches && playing && !dismissed) {
      releaseMobileKeys();
      onPortraitWhilePlaying();
    }
  });
}

// ---- Full screen ----

const canFullscreen = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const isStandalone =
  window.matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches ||
  navigator.standalone === true;

const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

function enterFullscreen() {
  const el = document.documentElement;
  const request = el.requestFullscreen
    ? el.requestFullscreen({ navigationUI: "hide" })
    : el.webkitRequestFullscreen?.();
  return Promise.resolve(request)
    .then(() => screen.orientation?.lock?.("landscape"))
    .catch(() => {});
}

function exitFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else document.webkitExitFullscreen?.();
}

// iPhone Safari has no fullscreen API; a home screen app is the only way
function showFullscreenTip() {
  if (document.querySelector(".fullscreen-tip")) return;
  const tip = document.createElement("div");
  tip.className = "fullscreen-tip";
  tip.textContent = "To play full screen on iPhone: tap Share, then \u201cAdd to Home Screen\u201d, and open Tether Traverse from your home screen.";
  document.body.appendChild(tip);
  setTimeout(() => (tip.style.opacity = "0"), 6000);
  setTimeout(() => tip.remove(), 6500);
}

function initFullscreenButton() {
  if (isStandalone) document.body.classList.add("standalone");

  document.getElementById("mobileFullscreenBtn").addEventListener("click", () => {
    if (!canFullscreen) showFullscreenTip();
    else if (fullscreenElement()) exitFullscreen();
    else enterFullscreen();
  });

  const sync = () => document.body.classList.toggle("is-fullscreen", !!fullscreenElement());
  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("webkitfullscreenchange", sync);
}

// On Start: go full screen and lock to landscape where the browser allows it
// (Android Chrome). Elsewhere the expand button explains the alternative.
export function requestLandscape() {
  if (!isTouchDevice || !canFullscreen || isStandalone) return;
  enterFullscreen();
}
