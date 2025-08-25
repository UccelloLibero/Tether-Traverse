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

export function startSummitCelebration(percent = 0) {
  if (startSummitCelebration._done) return; // prevent double trigger
  startSummitCelebration._done = true;

  const summitDiv = document.getElementById("summitCelebration");
  if (!summitDiv) return;

  summitDiv.classList.remove("hidden");
  summitDiv.innerHTML = ""; // clear any prior content

  // Message
  const msg = document.createElement("div");
  msg.className = "celebration-message";
  msg.textContent = `Congratulations! You've reached the summit of Mount Rainier! Rope safety: ${percent}%`;
  summitDiv.appendChild(msg);

  // Generate snowflakes
  const total = 60;
  for (let i = 0; i < total; i++) {
    const flake = document.createElement("div");
    flake.className = "snowflake";
    flake.textContent = "❄️";
    const delay = (Math.random() * 0.8).toFixed(2);
    const duration = (4 + Math.random() * 4).toFixed(2);
    const sizeScale = 0.6 + Math.random() * 0.9;
    const drift = (Math.random() * 40 - 20).toFixed(1);
    flake.style.left = `${Math.random() * 100}%`;
    flake.style.animationDuration = `${duration}s`;
    flake.style.animationDelay = `${delay}s`;
    flake.style.transform = `translateX(${drift}px) scale(${sizeScale})`;
    summitDiv.appendChild(flake);
  }

  // Auto hide after celebration
  setTimeout(() => {
    summitDiv.classList.add("hidden");
  }, 9000);
}
