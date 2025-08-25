import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(data.toString());
      }
    }
  });
});

console.log('Signaling server running on ws://localhost:8080');
