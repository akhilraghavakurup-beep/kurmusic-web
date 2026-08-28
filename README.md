# Kur Music Web 🎵

> Next-Generation Streaming Music Player with JioSaavn Catalog, Lossless Audio Streaming, and Apple CarPlay / Lockscreen / Bluetooth Controls.

Hosted on **GitHub Pages** with automated **GitHub Actions CI/CD**.

---

## ✨ Features

- 🎧 **Direct Lossless Audio Streaming** — Streams direct high-definition audio (320kbps / 160kbps / 96kbps) from Akamai CDN with zero server bandwidth.
- 🚗 **Apple CarPlay & Lockscreen Controls** — Full integration with W3C MediaSession API: steering wheel Next/Prev buttons, dashboard progress scrubber, and lockscreen media notifications.
- 📱 **iPhone & Laptop Background Playback** — Plays continuously when minimized, screen locked, or switching tabs on both mobile (iOS Safari/Chrome) and desktop.
- 🎨 **Spotify & JioSaavn Web Aesthetics** — Beautiful glassmorphic UI with dynamic ambient backdrop glows, responsive 3-column desktop layout, and mobile bottom navigation with expandable player.
- 🔍 **Real-Time Music Discovery** — Search songs, albums, playlists, and artists with instant debouncing and category filters.
- 📜 **Queue & Synchronized Lyrics** — Up Next queue management with drag-and-drop / jump-to-song, plus dynamic lyrics display.
- 🚀 **GitHub Pages Deployment** — Pure static SPA with `404.html` deep-link routing and automated GitHub Actions workflow on every push.

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/akhilraghavakurup-beep/kurmusic-web.git
cd kurmusic-web

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

---

## 🌐 Deploy to GitHub Pages

This repository is configured with `.github/workflows/deploy.yml`:
1. Push changes to the `main` branch.
2. In GitHub Repository Settings -> **Pages**:
   - Source: **GitHub Actions**
3. The site will automatically build and deploy to:
   `https://akhilraghavakurup-beep.github.io/kurmusic-web/`
