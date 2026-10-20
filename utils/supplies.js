// Water and food for the whole climb (no refill at Camp Muir).
// Each level uses 1.25 L and 1,375 cal across its rest stops (see breakpoints.js),
// leaving exactly the descent reserve at the summit.

export const START_WATER_L = 3.0;
export const START_CAL = 3000;
export const DESCENT_WATER_L = 0.5;
export const DESCENT_CAL = 250;

export function formatWater(liters) {
  return String(Number(liters.toFixed(2))); // 3, 2.6, 1.75, 0.5
}

export function formatCal(cal) {
  return Math.round(cal).toLocaleString("en-US"); // 3,000
}

export function updateSuppliesHUD(state) {
  const water = document.getElementById("waterCount");
  const cal = document.getElementById("snacksCount");
  if (water) water.textContent = formatWater(state.water);
  if (cal) cal.textContent = formatCal(state.snacks);
}

export function resetSupplies(state) {
  state.water = START_WATER_L;
  state.snacks = START_CAL;
  updateSuppliesHUD(state);
}

export function useSupplies(state, waterL = 0, cal = 0) {
  // Work in mL to avoid floating point drift (e.g. 1.7500000000000002)
  state.water = Math.max(0, Math.round(state.water * 1000 - waterL * 1000) / 1000);
  state.snacks = Math.max(0, state.snacks - cal);
  updateSuppliesHUD(state);
}
