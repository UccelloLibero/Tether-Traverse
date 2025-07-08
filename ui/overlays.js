export function triggerOverlay(title, message, onContinue) {
  const overlay = document.getElementById("overlay");
  const levelTitle = document.getElementById("levelTitle");
  const levelText = document.getElementById("levelText");
  const continueBtn = document.getElementById("continueBtn");

  overlay.classList.remove("hidden");
  levelTitle.textContent = title;
  levelText.textContent = message;
  continueBtn.classList.remove("hidden");

  continueBtn.onclick = () => {
    overlay.classList.add("hidden");
    continueBtn.classList.add("hidden");
    if (onContinue) onContinue();
  };
}

export function startSummitCelebration() {
  const summitDiv = document.getElementById("summitCelebration");
  summitDiv.classList.remove("hidden");
  summitDiv.innerHTML = "❄️ ❄️ ❄️ Summit Celebration! ❄️ ❄️ ❄️";
  summitDiv.classList.add("snowfall");
}
