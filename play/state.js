export const sharedState = {
    scene: null,
    camera: null,
    renderer: null,
    gamePaused: false,
    currentLevel: 1,
    tools: [],
    platforms: [],
    c1: {
        x: 0,
        y: 0,
        vy: 0,
        grounded: false
    },
    c2: {
        x: 0,
        y: 0,
        vy: 0,
        grounded: false
    },
    isNightClimb: false,
    keys: {},
    water: 2.0,
    snacks: 10,
    justResetFall: false,
    lastSafePlatform: null,   // track last safe landing spot
    skipFrame: false,         // skip heavy physics (rope) for 1 frame after reset
    fallTransitionActive: false, // smooth fall reset in progress
};