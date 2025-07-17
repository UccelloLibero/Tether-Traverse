// // players.js
// export let climber1Right, climber1Left, climber2Right, climber2Left;
// export let climber1, climber2;

// export let isNightMode = false; // Global variable to track night mode
// export let climber1RightNight, climber1LeftNight, climber2RightNight, climber2LeftNight;

// const loader = new THREE.TextureLoader();

// export function initPlayers(scene, loader) {
//     const planeGeometry = new THREE.PlaneGeometry(1, 1.5);
//     const textureLoader = new THREE.TextureLoader();

//     // Climber 1
//     climber1Right = textureLoader.load('assets/climbers/climber1-right.png');
//     climber1Left = textureLoader.load('assets/climbers/climber1-left.png');
//     const climber1Material = new THREE.MeshLambertMaterial({ map: climber1Right, transparent: true });
//     climber1 = new THREE.Mesh(planeGeometry, climber1Material);
//     climber1.position.set(-1.5, -4.5, 0);
//     scene.add(climber1);

//     climber1RightNight = textureLoader.load('assets/climbers/climber1-level2-right.png');
//     climber1LeftNight  = textureLoader.load('assets/climbers/climber1-level2-left.png');

//     // Climber 2
//     climber2Right = textureLoader.load('assets/climbers/climber2-right.png');
//     climber2Left = textureLoader.load('assets/climbers/climber2-left.png');
//     const climber2Material = new THREE.MeshLambertMaterial({ map: climber2Right, transparent: true });
//     climber2 = new THREE.Mesh(planeGeometry.clone(), climber2Material);
//     climber2.position.set(-7.5, -4.75, 0);
//     scene.add(climber2);

//     climber2RightNight = textureLoader.load('assets/climbers/climber2-level2-right.png');
//     climber2LeftNight  = textureLoader.load('assets/climbers/climber2-level2-left.png');
// }

// export function handlePlayerMovement(state, keys, mobileKeys, climber1, climber2, isMobile) {
//     const moveSpeed = 0.1;
//     const jumpPower = 0.35;

//     const t = Date.now() * 0.003;
//     if (state.c1.grounded) {
//         climber1.position.x += Math.sin(t * 0.5) * 0.03;
//         climber1.position.y += Math.cos(t) * 0.01;
//     }
//     if (state.c2.grounded) {
//         climber2.position.x += Math.sin(t * 0.5 + Math.PI) * 0.03;
//         climber2.position.y += Math.cos(t + Math.PI) * 0.01;
//     }

//     if (isMobile) {
//         // Only Climber 1 is controlable on mobile
//         if (mobileKeys.left) {
//             state.c1.x -= moveSpeed;
//             climber1.material.map = isNightMode ? climber1LeftNight : climber1Left;
//             climber1.material.needsUpdate = true;
//         } else if (mobileKeys.right) {
//         state.c1.x += moveSpeed;
//         climber1.material.map = climber1Right; // Switch to right texture
//         }
//         if (mobileKeys.jump && state.c1.grounded) {
//         state.c1.vy = jumpPower;
//         state.c1.grounded = false;
//         }

//         // Climber 2 follows Climber 1 (mobile only)
//         state.c2.x += (state.c1.x - state.c2.x) * 0.05;

//     } else {
//         // Climber 1
//         if (keys["ArrowLeft"]) {
//             state.c1.x -= moveSpeed;
//             climber1.material.map = isNightMode ? climber1LeftNight : climber1Left; // Switch to left texture
//             climber1.material.needsUpdate = true;
//         } else if (keys["ArrowRight"]) {
//             state.c1.x += moveSpeed;
//             climber1.material.map = isNightMode ? climber1RightNight : climber1Right; // Switch to right texture
//             climber1.material.needsUpdate = true;
//         }
//         if (keys["ArrowUp"] && state.c1.grounded) {
//             state.c1.vy = jumpPower;
//             state.c1.grounded = false;
//         }

//         // Player 2
//         if (keys["KeyA"]) {
//             state.c2.x -= moveSpeed;
//             climber2.material.map = isNightMode ? climber2LeftNight: climber2Left; // Switch to left texture
//             climber2.material.needsUpdate = true;
//         } else if (keys["KeyD"]) {
//             state.c2.x += moveSpeed;
//             climber2.material.map = isNightMode ? climber2Right : climber2Right; // Switch to right texture
//             climber2.material.needsUpdate = true;
//         }
//         if (keys["KeyW"] && state.c2.grounded) {
//             state.c2.vy = jumpPower;
//             state.c2.grounded = false;
//         }
//     }
// }

// export function addGroundedMotion(climber, isGrounded, phaseShift = 0) {
//     const t = Date.now() * 0.003;
//     if (isGrounded) {
//         const wiggle = Math.sin(t + phaseShift) * 0.05; // Side to side wiggle
//         climber.position.x += wiggle; // lateral sway

//         const sway = Math.sin(t * 0.5 + phaseShift) * 0.02; // Gentle lean
//         climber.material.rotation = sway; // rotation like body sway
//     }
// }