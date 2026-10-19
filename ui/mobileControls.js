import { sharedState } from "../play/state.js";

// Each on-screen button presses BOTH players' keys, so one person can play on
// a phone: the climbers move and jump together as a roped team.
const KEY_MAP = {
  left:  ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  jump:  ["ArrowUp", "KeyW"],
};

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
  const next = new Set();
  for (const t of e.touches) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const btn = el && el.closest("#mobileControls [data-dir]");
    if (btn) next.add(btn.dataset.dir);
  }
  applyPressed(next);
}

export function initMobileControls({ onPause, onToggleSound }) {
  if (!isTouchDevice) return;
  document.body.classList.add("touch");

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
    soundBtn.classList.toggle("muted");
    soundBtn.textContent = soundBtn.classList.contains("muted") ? "🔇" : "🔊";
  });

  // Don't leave a climber running if the app is backgrounded mid-press
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseMobileKeys();
  });
}

export function showMobileControls(show) {
  document.body.classList.toggle("playing", show);
  if (!show) releaseMobileKeys();
}
