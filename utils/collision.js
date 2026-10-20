// How far past a platform edge a climber's center can be and still stand on it.
// Small on purpose: it's roughly the width of their feet, so a climber whose
// body has stepped off the snow drops instead of hovering over the edge.
export const FOOT_HALF_WIDTH = 0.12;

export function checkCollision(climber, stateObj, platforms, state) {
  const r = 0.4; // vertical: distance from climber center to their feet

  for (const p of platforms) {
    const plat = p.mesh;
    const top = p.y;
    const w = plat.geometry.parameters.width / 2;

    const isAbove = climber.position.y - r > top - 0.5;
    const isFalling = stateObj.vy <= 0;
    const withinHorizontal = Math.abs(climber.position.x - plat.position.x) < w + FOOT_HALF_WIDTH;
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
