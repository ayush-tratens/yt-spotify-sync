const statusEl = document.getElementById("status");
const authBtn = document.getElementById("auth-btn");

async function init() {
  const { authed } = await chrome.storage.local.get("authed");
  if (authed) {
    statusEl.textContent = "Connected — syncing active";
    statusEl.classList.add("connected");
    authBtn.textContent = "Reconnect";
  } else {
    statusEl.textContent = "Not connected";
    authBtn.textContent = "Connect Spotify";
  }
}

authBtn.addEventListener("click", async () => {
  authBtn.disabled = true;
  authBtn.textContent = "Connecting…";
  await chrome.runtime.sendMessage({ type: "AUTH_START" });
  await init();
  authBtn.disabled = false;
});

init();
