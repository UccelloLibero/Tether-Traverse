import { createGear } from "../script.js";
// import { gamePaused, isFalling } from "../script.js";

export function loadLevel1(createPlatform) {
    // Manually place 35 platforms for Level 1 (Paradise to Camp Muir)
    createPlatform(4, -2);
    createPlatform(10, -1);
    createPlatform(16, 0);
    createPlatform(22, 0.5); // First gear pick up (headlamp and helmet)
    createGear(22, 0.5, "headlamp");
    createGear(23.5, 0.5, "helmet");
    createPlatform(28, 1);
    createPlatform(34, 2); // Snack and water
    createPlatform(40, 2.5);
    createPlatform(46, 3);
    createPlatform(52, 4);
    createPlatform(58, 4.5);      
    createPlatform(64, 5);
    createPlatform(70, 6); // Second gear pick up (ice axe)
    createGear(70, 6, "iceaxe");
    createPlatform(76, 7);
    createPlatform(82, 8); // Snack and water
    createPlatform(88, 8.5);
    createPlatform(94, 9);
    createPlatform(100, 10);
    createPlatform(106, 11); // Third gear pick up (crampons)
    createGear(106, 11, "crampons");
    createPlatform(112, 12);
    createPlatform(118, 13);
    createPlatform(124, 13.5); 
    createPlatform(130, 14.);
    createPlatform(136, 14.5);
    createPlatform(142, 15); // Snack and water
    createPlatform(148, 16);
    createPlatform(154, 17);
    createPlatform(160, 18); // Fourth gear pick up (harness)
    createGear(160, 18, "harness");
    createPlatform(166, 19);
    createPlatform(172, 19.5); // Fifth gear pick up (Avalanche Beacon)
    createGear(172, 19.5, "avalanchebeacon");
    createPlatform(178, 20);
    createPlatform(184, 20.5);
    createPlatform(190, 20.5); // Snack resupply for Summit day
    createPlatform(196, 21);
    createPlatform(202, 22);
    createPlatform(208, 22);
    createPlatform(214, 23); // Last platform at Camp Muir
    createPlatform(214, 23, 10, 0.5); // Longer platform for Camp Muir
}

// export function triggerFallRecovery(state, climber1, climber2, lastSafePosition) {
//     gamePaused = true; // Pause the game during recovery
//     isFalling = true;

//     const overlay = document.getElementById("overlay");
//     overlay.classList.remove("hidden");
//     document.getElementById("levelTitle").textContent = "You all are falling!";
//     document.getElementById("levelText").textContent = "You slipped off the edge! Resetting to the last safe place...";

//     setTimeout(() => {
//         // Reset climbers to last safe position
//         state.c1.x = lastSafePosition.x1;
//         state.c1.y = lastSafePosition.y1;
//         state.c1.vy = 0;

//         state.c2.x = lastSafePosition.x2;
//         state.c2.y = lastSafePosition.y2;
//         state.c2.vy = 0;

//         climber1.position.set(state.c1.x, state.c1.y, 0);
//         climber2.position.set(state.c2.x, state.c2.y, 0);

//         overlay.classList.add("hidden");
//         gamePaused = false; // Resume the game
//         isFalling = false; // Reset falling state
//     }, 3000); // 3 seconds delay for recovery
// }