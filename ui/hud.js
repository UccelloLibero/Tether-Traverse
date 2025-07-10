

export function initHUD() {
  document.getElementById("hud").classList.remove("hidden");
  document.getElementById("currentElevation").textContent = "5,400 ft";
  document.getElementById("currentLocation").textContent = "Paradise Trailhead";
  document.getElementById("nextLocation").textContent = "Panorama Point";
  document.getElementById("waterCount").textContent = "2.0";
  document.getElementById("snacksCount").textContent = "10";
  document.getElementById("toolsList").innerHTML = "";
}

export function updateGearHUD(tools) {
  const list = document.getElementById("toolsList");
  list.innerHTML = "";

  if (!Array.isArray(tools)) return;

  tools.forEach(tool => {
    const img = document.createElement("img");
    img.src = `assets/icons/${tool}.png`;
    img.alt = tool;
    img.title = tool;
    img.style.width = "18px";
    img.style.height = "18px";
    img.style.margin = "0 6px";
    img.style.verticalAlign = "middle";
    img.style.cursor = "pointer";
    list.appendChild(img);
  });
}

export function updateHUDStats(state, breakpoint, breakpoints) {
  document.getElementById("currentLocation").textContent = breakpoint.name;
  document.getElementById("currentElevation").textContent = `${breakpoint.elevation} ft`;
  document.getElementById("nextLocation").textContent =
    breakpoints.find(bp => bp.x > breakpoint.x)?.name || "Summit";
  document.getElementById("waterCount").textContent = state.water.toFixed(1);
  document.getElementById("snacksCount").textContent = state.snacks.toFixed(1);
}

export function flashScreen() {
  const flash = document.createElement("div");
  flash.style.position = "absolute";
  flash.style.top = "0";
  flash.style.left = "0";
  flash.style.width = "100%";
  flash.style.height = "100%";
  flash.style.backgroundColor = "#f5f5f5";
  flash.style.opacity = "0.7";
  flash.style.zIndex = "999";
  flash.style.transition = "opacity 0.4s ease-out";
  document.body.appendChild(flash);

  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(flash);
    }, 400); // Match transition duration
  }, 150);
}