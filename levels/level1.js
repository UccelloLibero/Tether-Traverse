import { createGear } from "../script.js";

export function loadLevel1(createPlatform) {
    // Manually place 35 platforms for Level 1 (Paradise to Camp Muir)
    createPlatform(4, -2);
    createPlatform(10, -1);
    createPlatform(16, 0);
    createPlatform(22, 0.5); // First gear pick up (headlamp and helmet)
    createGear(22, 0.5, "headlamp");
    createGear(23, 0.5, "helmet");
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