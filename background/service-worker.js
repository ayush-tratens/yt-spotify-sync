import { generateVerifier, generateChallenge } from "./pkce.js";

const CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";
const SCOPES = "user-modify-playback-state user-read-playback-state";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

async function saveTokens({ access_token, refresh_token, expires_in }) {
  const expires_at = Date.now() + expires_in * 1000;
  await chrome.storage.local.set({ access_token, refresh_token, expires_at });
  await chrome.alarms.create("token_refresh", { when: expires_at - 60000 });
}

async function refreshTokens() {
  const { refresh_token } = await chrome.storage.local.get("refresh_token");
  if (!refresh_token) return;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token, client_id: CLIENT_ID }),
  });
  if (!res.ok) return;
  const data = await res.json();
  await saveTokens({ ...data, refresh_token: data.refresh_token ?? refresh_token });
}

async function getValidToken() {
  const { access_token, expires_at } = await chrome.storage.local.get(["access_token", "expires_at"]);
  if (!access_token) return null;
  if (Date.now() >= expires_at - 5000) await refreshTokens();
  return (await chrome.storage.local.get("access_token")).access_token;
}

async function spotifyPause() {
  const token = await getValidToken();
  if (!token) return;
  await fetch(`${API_BASE}/me/player/pause`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
}

async function spotifyResume() {
  const token = await getValidToken();
  if (!token) return;
  const res = await fetch(`${API_BASE}/me/player`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res || res.status === 204 || !res.ok) return;
  const data = await res.json();
  if (!data.is_playing) await fetch(`${API_BASE}/me/player/play`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
}

async function checkYouTube() {
  const tabs = await chrome.tabs.query({ url: "*://www.youtube.com/*" });
  if (!tabs.length) return;
  const results = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => {
      const v = document.querySelector("video");
      return v ? { paused: v.paused, ended: v.ended } : null;
    }
  });
  if (!results?.[0]?.result) return;
  const { paused, ended } = results[0].result;
  const { lastState } = await chrome.storage.local.get("lastState");
  if (!paused && lastState !== "playing") {
    await chrome.storage.local.set({ lastState: "playing" });
    await spotifyPause();
  } else if (paused && !ended && lastState !== "paused") {
    await chrome.storage.local.set({ lastState: "paused" });
    await spotifyResume();
  }
}

async function startAuthFlow() {
  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  await chrome.storage.session.set({ pkce_verifier: verifier });
  const redirectURL = chrome.identity.getRedirectURL("callback");
  const params = new URLSearchParams({
    client_id: CLIENT_ID, response_type: "code", redirect_uri: redirectURL,
    scope: SCOPES, code_challenge_method: "S256", code_challenge: challenge,
  });
  let responseUrl;
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({
      url: `https://accounts.spotify.com/authorize?${params}`, interactive: true,
    });
  } catch { return; }
  const code = new URL(responseUrl).searchParams.get("code");
  if (!code) return;
  const { pkce_verifier } = await chrome.storage.session.get("pkce_verifier");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code", code, redirect_uri: redirectURL,
      client_id: CLIENT_ID, code_verifier: pkce_verifier,
    }),
  });
  if (!res.ok) return;
  await saveTokens(await res.json());
  await chrome.storage.local.set({ authed: true });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "token_refresh") await refreshTokens();
  if (alarm.name === "yt_poll") await checkYouTube();
});

chrome.alarms.create("yt_poll", { periodInMinutes: 0.1 });

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url?.includes("youtube.com")) {
    await checkYouTube();
  }
});

chrome.tabs.onActivated.addListener(async () => {
  const tabs = await chrome.tabs.query({ url: "*://www.youtube.com/*" });
  if (tabs.length) await checkYouTube();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === "AUTH_START") await startAuthFlow();
    sendResponse({ ok: true });
  })();
  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "yt-sync") return;
  port.onMessage.addListener(async (msg) => {
    if (msg.type === "YT_PLAYING") await spotifyPause();
    else if (msg.type === "YT_PAUSED") await spotifyResume();
  });
});

setInterval(() => chrome.storage.local.get("authed"), 25000);