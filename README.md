# Crocro Extension

Crocro is a cross-browser chat extension for Chrome and Firefox. It provides a minimal real-time chat between two friends using a background service worker and a React popup.

## Development

1. Install dependencies:
   ```bash
   pnpm i
   ```
2. Start the signaling server:
   ```bash
   cd server && pnpm i && pnpm dev
   ```
3. Run the extension in development mode:
   ```bash
   pnpm dev
   ```
   Then load the generated `dist` folder as an unpacked extension in Chrome or Firefox.

## Building

```
pnpm build
```

Zips for Chrome and Firefox will be output in `dist`.

## Testing

Run lint, typecheck and unit tests:
```
pnpm lint && pnpm typecheck && pnpm test
```

## Usage

1. Open the Crocro extension popup.
2. Type your message and press **Send**.
3. The background keeps the chat connection alive even when the popup is closed.

To chat with a friend, both users should load the extension and connect to the same signaling server (`ws://localhost:8080` by default).
