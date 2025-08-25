import browser from 'webextension-polyfill';
import { putMessage } from '../lib/idb';

const SIGNAL_URL = import.meta.env.VITE_SIGNALING_URL || 'ws://localhost:8080';
let ws: WebSocket | null = null;
let roomId: string | null = null;

function connect() {
  ws = new WebSocket(SIGNAL_URL);
  ws.onopen = () => {
    if (roomId) {
      ws?.send(JSON.stringify({ type: 'join-room', room: roomId }));
    }
  };
  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'room-created' || data.type === 'room-joined') {
      roomId = data.room;
      browser.runtime.sendMessage({ type: data.type, room: data.room });
      return;
    }
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
    if (data.type === 'error') {
      browser.runtime.sendMessage({ type: 'error', message: data.message });
    }
  };
  ws.onclose = () => {
    setTimeout(connect, 1000);
  };
}

connect();

browser.runtime.onMessage.addListener(
  async (msg: { type: string; payload?: Parameters<typeof putMessage>[0]; from?: string; id?: string; room?: string }) => {
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
      case 'create-room':
        ws?.send(JSON.stringify({ type: 'create-room' }));
        break;
      case 'join-room':
        ws?.send(JSON.stringify({ type: 'join-room', room: msg.room }));
        break;
      default:
        break;
    }
  }
);
