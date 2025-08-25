import browser from 'webextension-polyfill';
import { putMessage } from '../lib/idb';

const SIGNAL_URL = import.meta.env.VITE_SIGNALING_URL || 'ws://localhost:8080';
let ws: WebSocket | null = null;

function connect() {
  ws = new WebSocket(SIGNAL_URL);
  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
      await putMessage(data.payload);
      browser.runtime.sendMessage({ type: 'message', payload: data.payload });
    }
    if (data.type === 'typing') {
      browser.runtime.sendMessage({ type: 'typing', from: data.from });
    }
    if (data.type === 'read') {
      browser.runtime.sendMessage({ type: 'read', id: data.id });
    }
  };
  ws.onclose = () => {
    setTimeout(connect, 1000);
  };
}

connect();

browser.runtime.onMessage.addListener(async (msg: { type: string; payload?: Parameters<typeof putMessage>[0]; from?: string; id?: string }) => {
  switch (msg.type) {
    case 'send-message':
      ws?.send(JSON.stringify({ type: 'message', payload: msg.payload }));
      await putMessage(msg.payload!);
      break;
    case 'typing':
      ws?.send(JSON.stringify({ type: 'typing', from: msg.from }));
      break;
    case 'read':
      ws?.send(JSON.stringify({ type: 'read', id: msg.id }));
      break;
    default:
      break;
  }
});
