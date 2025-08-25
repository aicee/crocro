import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const rooms = new Map();

function generateRoom() {
  return Math.random().toString(36).substring(2, 8);
}

wss.on('connection', (ws) => {
  let currentRoom = null;
  ws.on('message', (data) => {
    const message = data.toString();
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch {
      return;
    }
    switch (parsed.type) {
      case 'create-room': {
        const room = generateRoom();
        currentRoom = room;
        rooms.set(room, new Set([ws]));
        ws.send(JSON.stringify({ type: 'room-created', room }));
        break;
      }
      case 'join-room': {
        const room = parsed.room;
        const set = rooms.get(room);
        if (set) {
          currentRoom = room;
          set.add(ws);
          ws.send(JSON.stringify({ type: 'room-joined', room }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'room-not-found' }));
        }
        break;
      }
      default: {
        if (!currentRoom) return;
        const clients = rooms.get(currentRoom) || new Set();
        for (const client of clients) {
          if (client !== ws && client.readyState === client.OPEN) {
            client.send(message);
          }
        }
      }
    }
  });
  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const set = rooms.get(currentRoom);
      set.delete(ws);
      if (set.size === 0) rooms.delete(currentRoom);
    }
  });
});

console.log('Signaling server running on ws://localhost:8080');
