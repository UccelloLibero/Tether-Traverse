export function checkCollision(climber, stateObj, platforms, state) {
  const r = 0.4;

  for (const p of platforms) {
    const plat = p.mesh;
    const top = p.y;
    const w = plat.geometry.parameters.width / 2;

    const isAbove = climber.position.y - r > top - 0.5;
    const isFalling = stateObj.vy <= 0;
    const withinHorizontal = Math.abs(climber.position.x - plat.position.x) < w + r;
    const touchingTop = climber.position.y - r <= top;

    if (withinHorizontal && touchingTop && isAbove && isFalling) {
        state.lastSafePlatform = {
        x: plat.position.x,
        y: top
      };
      state.currentPlatform = p.index || 0; // Store the index of the current platform
      return top; // Return the platform Y value
    }
  }

  return null; // No platform landed on
}