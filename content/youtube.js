window._ytSyncLoaded = true;

let currentVideo = null;
let port = null;

function connectPort() {
  try {
    port = chrome.runtime.connect({ name: "yt-sync" });
    port.onDisconnect.addListener(() => {
      port = null;
      setTimeout(connectPort, 1000);
    });
  } catch {
    setTimeout(connectPort, 1000);
  }
}

function send(type) {
  try {
    if (!port) connectPort();
    port.postMessage({ type });
  } catch {
    port = null;
    setTimeout(connectPort, 1000);
  }
}

function attachToVideo(video) {
  if (video._ytSyncAttached) return;
  video._ytSyncAttached = true;
  video.addEventListener("play", () => send("YT_PLAYING"));
  video.addEventListener("pause", () => {
    if (!video.ended) send("YT_PAUSED");
  });
}

function findAndAttach() {
  const video = document.querySelector("video");
  if (!video || video === currentVideo) return;
  currentVideo = video;
  attachToVideo(video);
}

connectPort();

const observer = new MutationObserver(() => findAndAttach());

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
  findAndAttach();
} else {
  document.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, { childList: true, subtree: true });
    findAndAttach();
  });
}