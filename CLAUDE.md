# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Overview

## Crocro — Cross‑Browser Chat Extension

A cross-browser chat extension (Firefox & Chrome) that enables real-time messaging between two friends, designed to feel instantaneous when the popup is open, and reliably up‑to‑date when it’s closed. This is a browser extension built with React + TypeScript + Vite. The extension uses Manifest V3 and includes both a popup interface and background service worker and builds with one codebase for Chrome + Firefox.

## Architecture

```
/crocro
  /extension
    manifest.json
    /vendor/webextension-polyfill.min.js
    /background
      sw.js
      idb.js
      crypto.js
      api.js
    /popup
      index.html
      main.tsx
      App.tsx
      styles.css
  /server
    server.ts
    db.ts
    ws.ts
    package.json
```

### Manifest (MV3, Chrome & Firefox‑friendly)

```json
{
  "manifest_version": 3,
  "name": "Crocro – Chat",
  "version": "0.1.0",
  "description": "Private, minimal chat between two friends.",
  "action": { "default_popup": "popup/index.html", "default_title": "Crocro" },
  "background": { "service_worker": "background/sw.js", "type": "module" },
  "permissions": ["storage", "alarms", "notifications"],
  "host_permissions": ["https://api.crocro.chat/*"],
  "icons": {
    "16": "icons/16.png",
    "48": "icons/48.png",
    "128": "icons/128.png"
  },
  "options_ui": { "page": "popup/index.html", "open_in_tab": true }
}
```

## Approach (High‑Impact Summary)

- One codebase, two stores using WebExtensions + webextension-polyfill to normalize chrome._ vs browser._.

- Realtime when active, efficient when idle: WebSocket while the popup is open; background service worker runs polling via alarms (e.g., every 30s) to fetch new messages when closed. This avoids brittle background sockets and push quirks across browsers.

- Simple backend: REST for auth/pairing/history; WebSocket for presence/typing/live messages. Persistent store (SQLite/Postgres) + a messages table keyed by a shared room ID.

- Local-first UX: cache in IndexedDB; optimistic send; show delivery/seen states after server acks.

- Private by default: per‑pair key exchange (X25519) and symmetric message encryption (XSalsa20‑Poly1305) so the backend only relays ciphertext.

- Minimal permissions: storage, alarms, notifications, and host permissions for your API.

## Milestones (Step‑by‑Step)

1. Scaffold extension (MV3) + popup UI (React via Vite) to render chats with your style guide (light/dark, 14px+ fonts, smooth scroll, 300ms‑max animations).

2. Background service worker: schedule alarm, fetch /pull?since=..., write to IndexedDB, badge count, show notification.

3. Backend (Node + Express + ws): rooms, REST /pair, /send, /pull; WebSocket channel room:{id} for live events.

4. Wire realtime: popup opens → connect WS; optimistic send → server ack → update delivery state; typing/presence via WS.

5. E2E encryption: generate keypairs at first run; exchange public keys during pairing; encrypt on send, decrypt on receive; store only ciphertext server‑side.

6. Polish: micro‑interactions, skeleton loaders, accessibility, store packaging (Chrome Web Store, AMO).

## Development Commands

- `npm run dev`: Start development server with HMR
- `npm run build`: Build extension for production (TypeScript compilation + Vite build)
- `npm run lint`: Run ESLint on all files
- `npm run preview`: Preview production build

## Extension Structure

- Manifest V3 with service worker background script
- Storage permission enabled for data persistence
- Popup action with custom HTML interface
- Message passing between popup and background script established

### Design Principles

- Brand style guide in `/context/style-guide.md`
- When making visual (front-end, UI/UX) changes, always refer to this file for guidance
