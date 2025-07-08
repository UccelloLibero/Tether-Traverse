export function checkCollision(climber, stateObj, platforms) {
  let grounded = false;
  const r = 0.4;

  platforms.forEach(p => {
    const plat = p.mesh;
    const top = p.y;
    const w = plat.geometry.parameters.width / 2;

    if (
      Math.abs(climber.position.x - plat.position.x) < w + r &&
      climber.position.y - r <= top &&
      climber.position.y - r > top - 0.5 &&
      stateObj.vy <= 0
    ) {
      // Bounce on landing
      if (Math.abs(stateObj.vy) > 0.1) {
        stateObj.vy = -stateObj.vy * 0.3;
      } else {
        stateObj.vy = 0;
        grounded = true;
      }

      climber.position.y = top + r;
    }
  });

  return grounded;
}