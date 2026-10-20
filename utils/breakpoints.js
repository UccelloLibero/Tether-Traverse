import { fadeOutAndPause } from "../play/game.js";
import { updateHUDStats } from "../ui/hud.js";
import { startLevel2 } from "../play/game.js";
import { triggerOverlay } from "../ui/overlays.js";
import { startSummitSequence } from "../ui/summit.js";

export const breakpoints = [
    { x: 0, name: "Paradise Trailhead", elevation: 5400, waterUse: 0, snackUse: 0 },
  { x: 34, name: "Panorama Point", elevation: 6800, waterUse: 0.5, snackUse: 200, message: "Take a break! Tatoosh Range views." },
  { x: 82, name: "Pebble Creek", elevation: 7200, waterUse: 0.5, snackUse: 200, message: "Rest stop before snowfields." },
  { x: 142, name: "Muir Snowfield", elevation: 8500, waterUse: 0.5, snackUse: 200, message: "Snow trek begins!" },
//   { x: 214, name: "Camp Muir", elevation: 10080, waterUse: 0.5, snackUse: 2, message: "Camp Muir reached. Prepare for night!", isCamp: true },
  { x: 229, name: "Cathedral Gap", elevation: 11000, waterUse: 0.5, snackUse: 200, night: true, message: "Cross Cathedral Gap." },
  { x: 304, name: "Ingraham Flats", elevation: 11500, waterUse: 0.5, snackUse: 200, night: true, message: "Over Ingraham Glacier!" },
  { x: 376, name: "Disappointment Cleaver", elevation: 12300, waterUse: 0.5, snackUse: 200, night: true, message: "The Cleaver awaits!" },
  { x: 418, name: "High Break", elevation: 13500, waterUse: 0.5, snackUse: 200, night: true, message: "Final break. And final push to the summit!" },
  { x: 460, name: "Columbia Crest", elevation: 14410, waterUse: 0, snackUse: 0, night: true, message: "SUMMIT! You made it!" }
];

let triggerBreakpoints = new Set();


// Height of the checkpoint's platform top (highest platform spanning that x),
// or -Infinity if the checkpoint has no platform (e.g. the trailhead).
export function checkpointHeight(state, x) {
  let top = -Infinity;
  for (const p of state.platforms || []) {
    if (Math.abs(p.x - x) <= p.width / 2) top = Math.max(top, p.y);
  }
  return top;
}

// A checkpoint counts only once it's reached horizontally AND vertically,
// i.e. you're at (or above) its platform, not walking underneath it.
export function reachedCheckpoint(climber, state, x) {
  return (
    climber.position.x >= x &&
    climber.position.y >= checkpointHeight(state, x) - 0.05
  );
}

export function handleBreakpoints(climber1, state) {
  for (const bp of breakpoints) {
    if (!triggerBreakpoints.has(bp.x) && reachedCheckpoint(climber1, state, bp.x)) {
      triggerBreakpoints.add(bp.x);

      state.snacks -= bp.snackUse || 0;
      state.water -= bp.waterUse || 0;

      updateHUDStats(state, bp, breakpoints);

      // Special cases first (skip generic fadeOut for these)
      if (bp.isCamp) {
        state.gamePaused = true;
        triggerOverlay("Camp Muir Reached", bp.message, () => {
          startLevel2();
        });
        continue;
      }

      if (bp.name === "Columbia Crest") {
        // Summit ending only runs on Level 2
        if (state.currentLevel === 2) startSummitSequence();
        continue;
      }

      // Generic breakpoint overlay (unified)
      if (bp.message) {
        triggerOverlay(`${bp.name} (${bp.elevation} ft)`, bp.message);
      }
    }
  }
}

export function resetBreakpoints() {
    triggerBreakpoints.clear();
}