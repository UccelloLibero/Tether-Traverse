import { fadeOutAndPause } from "../play/game.js";
import { updateHUDStats } from "../ui/hud.js";
import { startLevel2 } from "../play/game.js";
import { triggerOverlay } from "../ui/overlays.js";
import { getRopeSafetyPercent, getRopeStats, maxRopeLength } from "./rope.js";

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


export function handleBreakpoints(climber1, state) {
  const playerX = climber1.position.x;

  for (const bp of breakpoints) {
    if (!triggerBreakpoints.has(bp.x) && playerX >= bp.x) {
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
        // Only trigger the summit cinematic when we're on Level 2 (so it runs at x=460 on L2)
        if (state && state.currentLevel === 2) {
          const percent = getRopeSafetyPercent();
          // Directly start the cinematic + celebration (startSummitSequence handles camera + celebration)
          if (window.startSummitSequence) {
            window.startSummitSequence(percent);
          } else if (window.startSummitCelebration) {
            // defensive fallback: DOM-only celebration then exit
            window.startSummitCelebration(percent);
            setTimeout(() => {
              if (window.exitToLanding) window.exitToLanding();
              else window.location.href = "#landingPage";
            }, 15000);
          } else {
            // last-resort auto-exit after 15s
            setTimeout(() => {
              if (window.exitToLanding) window.exitToLanding();
              else window.location.href = "#landingPage";
            }, 15000);
          }
        }
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