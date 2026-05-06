# 🎵 YT Spotify Sync

> Automatically pause Spotify when you play a YouTube video — and resume it when you pause. No buttons, no fuss, just seamless focus.

![Version](https://img.shields.io/badge/version-1.0.0-green)
![Manifest](https://img.shields.io/badge/manifest-v3-blue)
![License](https://img.shields.io/badge/license-MIT-orange)
![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Brave%20%7C%20Edge-informational)

---

## ✨ What it does

| Action | Result |
|---|---|
| ▶️ Play a YouTube video | Spotify **pauses** automatically |
| ⏸️ Pause a YouTube video | Spotify **resumes** automatically |

No manual switching. No interruptions. Your music and videos stay perfectly in sync.

---

## 📋 Requirements

- A **Chromium-based browser** (Chrome, Brave, Edge, Opera, Vivaldi)
- A **Spotify Premium** account *(free tier cannot control playback via Spotify's API)*
- A **Spotify Developer App** (free to create, instructions below)

---

## 🚀 Installation

### Step 1 — Create a Spotify Developer App

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **Create app**
4. Fill in any name and description
5. Under **Redirect URIs** add a placeholder: `https://placeholder.com` (you'll replace this later)
6. Check **Web API** and agree to the terms
7. Click **Save**
8. Copy your **Client ID** from the app page

---

### Step 2 — Clone or Download the extension

```bash
git clone https://github.com/ayush-tratens/yt-spotify-sync.git
```

Or click **Code → Download ZIP** and extract it.

---

### Step 3 — Add your Client ID

Open `background/service-worker.js` and replace line 3:

```js
const CLIENT_ID = "YOUR_SPOTIFY_CLIENT_ID";
```

with your actual Client ID:

```js
const CLIENT_ID = "your_actual_client_id_here";
```

---

### Step 4 — Add placeholder icons

The extension needs icon files to load. Create or copy any PNG images and place them in the `icons/` folder with these exact names:

```
icons/
  icon16.png
  icon48.png
  icon128.png
```

Any PNG files will work — Chrome will scale them automatically.

---

### Step 5 — Load the extension in your browser

1. Open your browser and go to `chrome://extensions`
2. Toggle **Developer mode** ON (top-right corner)
3. Click **Load unpacked**
4. Select the `yt-spotify-sync` folder
5. The extension will appear in your extensions list

---

### Step 6 — Get your Redirect URI

1. On the extensions page, find **YT Spotify Sync**
2. Click **"service worker"** to open the DevTools console
3. In the Console tab, run:

```js
chrome.identity.getRedirectURL('callback')
```

4. Copy the URL it returns — it looks like:
```
https://youruniqueid.chromiumapp.org/callback
```

---

### Step 7 — Update Spotify Dashboard

1. Go back to your Spotify app on the developer dashboard
2. Click **Edit**
3. Under **Redirect URIs** — delete the placeholder and paste the URL from Step 6
4. Click **Add** → **Save**

---

### Step 8 — Connect and use!

1. Click the **YT Spotify Sync** icon in your browser toolbar
2. Click **Connect Spotify**
3. Log in and authorize the app
4. Status changes to **"Connected — syncing active"**
5. Play Spotify + open a YouTube video — magic happens ✨

---

## 📁 Project Structure

```
yt-spotify-sync/
├── manifest.json               # Extension config (MV3)
├── background/
│   ├── service-worker.js       # Token management + Spotify API + polling engine
│   └── pkce.js                 # PKCE auth helper (verifier, challenge, base64url)
├── content/
│   └── youtube.js              # YouTube video state detection
├── auth/
│   ├── callback.html           # OAuth redirect target
│   └── callback.js             # Closes the auth popup
├── popup/
│   ├── popup.html              # Extension popup UI
│   ├── popup.js                # Popup logic
│   └── popup.css               # Popup styling
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔐 How the Auth Flow Works

This extension uses **PKCE (Proof Key for Code Exchange)** — the most secure OAuth flow for public clients. No client secret is ever stored or transmitted.

```
1. Generate random PKCE verifier (32 bytes)
2. SHA-256 hash it → code challenge
3. Open Spotify /authorize via chrome.identity.launchWebAuthFlow
4. User logs in and approves
5. Exchange auth code + verifier for tokens
6. Store tokens in chrome.storage.local
7. Schedule silent refresh 60s before expiry via chrome.alarms
```

---

## ⚙️ How the Sync Works

Instead of relying on content script messaging (which can be blocked by some browsers), YT Spotify Sync uses a **direct polling approach**:

- Every ~6 seconds, the service worker uses `chrome.scripting` to read the YouTube video's play state directly
- Additionally triggers instantly when you open or switch to a YouTube tab
- Compares current state to last known state to avoid duplicate API calls
- Only resumes Spotify if it was actually paused by this extension

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| Extension won't load | Check `chrome://extensions` for the specific error |
| Auth popup closes immediately | Double-check the Redirect URI in Spotify dashboard matches exactly |
| Spotify doesn't pause | Make sure Spotify has an active device (something currently playing) |
| 403 error | Spotify Premium is required. After upgrading, wait a few hours for API access to activate |
| 404 No active device | Open Spotify on any device and start playing first |
| Changes not working | Go to `chrome://extensions` and click the reload ↺ button |

---

## 🌐 Browser Compatibility

| Browser | Supported |
|---|---|
| Google Chrome | ✅ |
| Brave | ✅ |
| Microsoft Edge | ✅ |
| Opera | ✅ |
| Vivaldi | ✅ |
| Firefox | ❌ (different extension API) |
| Safari | ❌ (different extension system) |

---

## 🔮 Planned Features

- [ ] Now Playing display in popup
- [ ] Enable/Disable toggle without disconnecting
- [ ] Delay before pausing (avoid accidental pauses)
- [ ] Ignore YouTube ads
- [ ] Volume ducking instead of full pause
- [ ] Multi YouTube tab support
- [ ] Firefox version

---

## ⚠️ Important Notes

- **Spotify Premium is required** — Spotify's API does not allow playback control on free accounts
- **Your Client ID is personal** — each user must create their own free Spotify Developer App
- This extension does **not** use any backend server — everything runs locally in your browser
- No data is collected or transmitted anywhere except directly to Spotify's official API

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<p align="center">Built with ❤️ for uninterrupted focus</p>
