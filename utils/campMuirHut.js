// Camp Muir stone shelter (decorative only), shared by Level 1 and Level 2.
// Painted once onto a canvas: gray stone walls, corrugated metal roof with a
// dusting of snow, wooden door, stovepipe, and an NPS-style sign with elevation.

const CANVAS_W = 1120;
const CANVAS_H = 800;
const WORLD_W = 7; // world units wide; height keeps the canvas aspect ratio
const WORLD_H = WORLD_W * (CANVAS_H / CANVAS_W);
const GROUND_Y = 780; // canvas y where the hut meets the ground

// Small seeded RNG so the stones look the same every time
function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStoneWall(ctx, x0, y0, x1, y1) {
  const rand = rng(1080);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip();

  // Mortar
  ctx.fillStyle = "#4f5357";
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

  // Irregular courses of stone
  let y = y0;
  let row = 0;
  while (y < y1) {
    const rowH = 34 + rand() * 18;
    let x = x0 - (row % 2 ? 40 : 0) - rand() * 30;
    while (x < x1) {
      const w = 55 + rand() * 70;
      const shade = 52 + Math.floor(rand() * 22); // lightness %
      const sx = x + 3, sy = y + 3, sw = w - 6, sh = rowH - 6;
      roundRect(ctx, sx, sy, sw, sh, 9);
      ctx.fillStyle = `hsl(210, 5%, ${shade}%)`;
      ctx.fill();
      // Light top edge, shadowed bottom edge for a chiseled look
      ctx.fillStyle = "rgba(255,255,255,0.13)";
      ctx.fillRect(sx + 6, sy + 2, sw - 12, 4);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(sx + 6, sy + sh - 6, sw - 12, 4);
      x += w;
    }
    y += rowH;
    row++;
  }

  // Shadow under the roof eaves
  const shadow = ctx.createLinearGradient(0, y0, 0, y0 + 70);
  shadow.addColorStop(0, "rgba(0,0,0,0.55)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(x0, y0, x1 - x0, 70);
  ctx.restore();
}

function drawMetalRoof(ctx, left, right, eaveY, peakX, peakY) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, eaveY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(right, eaveY);
  ctx.closePath();
  ctx.clip();

  // Brushed steel base
  const base = ctx.createLinearGradient(0, peakY, 0, eaveY);
  base.addColorStop(0, "#b9c1c8");
  base.addColorStop(1, "#7b858e");
  ctx.fillStyle = base;
  ctx.fillRect(left, peakY, right - left, eaveY - peakY);

  // Corrugated ribs
  for (let x = left; x < right; x += 22) {
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(x, peakY, 5, eaveY - peakY);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x + 11, peakY, 4, eaveY - peakY);
  }

  // Sheen across the panels
  const sheen = ctx.createLinearGradient(left, peakY, right, eaveY);
  sheen.addColorStop(0.25, "rgba(255,255,255,0)");
  sheen.addColorStop(0.45, "rgba(255,255,255,0.18)");
  sheen.addColorStop(0.6, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(left, peakY, right - left, eaveY - peakY);
  ctx.restore();

  // Trim along the edges and eave
  ctx.strokeStyle = "#3f464c";
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(left, eaveY);
  ctx.lineTo(peakX, peakY);
  ctx.lineTo(right, eaveY);
  ctx.stroke();
  ctx.fillStyle = "#3f464c";
  ctx.fillRect(left, eaveY - 4, right - left, 12);

  // Snow along the ridge
  const rand = rng(77);
  ctx.fillStyle = "#f4f7ff";
  for (let t = 0; t <= 1; t += 0.035) {
    for (const [ex, ey] of [[left, eaveY], [right, eaveY]]) {
      const x = peakX + (ex - peakX) * t * 0.85;
      const y = peakY + (ey - peakY) * t * 0.85;
      ctx.beginPath();
      ctx.arc(x, y + 4, 9 + rand() * 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSign(ctx, x, y, w, h) {
  // Posts
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(x + 28, y + h - 10, 16, GROUND_Y - (y + h) + 14);
  ctx.fillRect(x + w - 44, y + h - 10, 16, GROUND_Y - (y + h) + 14);

  // Board with NPS-brown wood and routed cream lettering
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = "#5b3a22";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#3a2414";
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 2;
  for (let gy = y + 14; gy < y + h - 8; gy += 11) {
    ctx.beginPath();
    ctx.moveTo(x + 10, gy);
    ctx.lineTo(x + w - 10, gy + 2);
    ctx.stroke();
  }

  ctx.fillStyle = "#f3e6c4";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let size = 46;
  ctx.font = `bold ${size}px "Fira Sans", sans-serif`;
  while (ctx.measureText("CAMP MUIR").width > w - 30 && size > 20) {
    size -= 2;
    ctx.font = `bold ${size}px "Fira Sans", sans-serif`;
  }
  ctx.fillText("CAMP MUIR", x + w / 2, y + h * 0.38);

  ctx.font = `600 26px "Fira Sans", sans-serif`;
  ctx.fillText("ELEV. 10,188 FT", x + w / 2, y + h * 0.74);
}

function paintHut(ctx) {
  const wallL = 60, wallR = 760, wallTop = 400;

  drawStoneWall(ctx, wallL, wallTop, wallR, GROUND_Y);

  // Window: dark glass with a warm glow and wooden frame
  const win = { x: 160, y: 485, w: 140, h: 100 };
  const glow = ctx.createLinearGradient(0, win.y, 0, win.y + win.h);
  glow.addColorStop(0, "#f7c56a");
  glow.addColorStop(1, "#b5762e");
  ctx.fillStyle = glow;
  ctx.fillRect(win.x, win.y, win.w, win.h);
  ctx.strokeStyle = "#4a3020";
  ctx.lineWidth = 10;
  ctx.strokeRect(win.x, win.y, win.w, win.h);
  ctx.beginPath();
  ctx.moveTo(win.x + win.w / 2, win.y);
  ctx.lineTo(win.x + win.w / 2, win.y + win.h);
  ctx.moveTo(win.x, win.y + win.h / 2);
  ctx.lineTo(win.x + win.w, win.y + win.h / 2);
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#6b6f73";
  ctx.fillRect(win.x - 12, win.y + win.h + 4, win.w + 24, 12); // stone sill

  // Wooden door with metal hinges and handle
  const door = { x: 470, y: 585, w: 115, h: GROUND_Y - 585 };
  ctx.fillStyle = "#6b4529";
  ctx.fillRect(door.x, door.y, door.w, door.h);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 3;
  for (let px = door.x + 23; px < door.x + door.w; px += 23) {
    ctx.beginPath();
    ctx.moveTo(px, door.y);
    ctx.lineTo(px, door.y + door.h);
    ctx.stroke();
  }
  ctx.strokeStyle = "#3a2414";
  ctx.lineWidth = 8;
  ctx.strokeRect(door.x, door.y, door.w, door.h);
  ctx.fillStyle = "#2d3236";
  ctx.fillRect(door.x + 8, door.y + 30, 40, 10);
  ctx.fillRect(door.x + 8, door.y + door.h - 45, 40, 10);
  ctx.beginPath();
  ctx.arc(door.x + door.w - 20, door.y + door.h / 2, 7, 0, Math.PI * 2);
  ctx.fill();

  // Stovepipe (drawn before the roof so the roof overlaps its base)
  ctx.fillStyle = "#30363b";
  ctx.fillRect(600, 225, 30, 90);
  ctx.fillRect(592, 215, 46, 14);

  drawMetalRoof(ctx, 30, 790, 412, 410, 190);

  // Snow drifts at the base
  const rand = rng(5);
  ctx.fillStyle = "#eef2fb";
  for (let x = 20; x < CANVAS_W; x += 34) {
    ctx.beginPath();
    ctx.ellipse(x, GROUND_Y + 8, 34 + rand() * 20, 14 + rand() * 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSign(ctx, 810, 560, 290, 140);
}

// Places the hut so its base sits at `baseY` (a platform top), centered on `x`.
export function createCampMuirHut(scene, x, baseY, z = -1) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d");

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const paint = () => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    paintHut(ctx);
    texture.needsUpdate = true;
  };
  paint();
  // Repaint once web fonts are ready so the sign uses Fira Sans
  document.fonts?.ready.then(paint);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_W, WORLD_H),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true })
  );
  // Line the canvas ground (GROUND_Y) up with the platform top
  const groundOffset = (GROUND_Y / CANVAS_H - 0.5) * WORLD_H;
  mesh.position.set(x, baseY + groundOffset, z);
  mesh.name = "CampMuirHut";
  scene.add(mesh);
  return mesh;
}
