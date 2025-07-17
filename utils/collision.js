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

    // Register landing only if player is falling onto the top of a platform
    if (withinHorizontal && touchingTop && isAbove && isFalling) {
      stateObj.grounded = true;
      return top; // Snap to this platform's top
    }
  }

  // No collision — player is mid-air or falling
  stateObj.grounded = false;
  return null;
}
