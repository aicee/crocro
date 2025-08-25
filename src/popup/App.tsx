import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { getMessages } from '../lib/idb';

interface Message {
  id: string;
  from: string;
  room: string;
  body: string;
  createdAt: number;
  readAt?: number;
}

export default function App() {
  const [room, setRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [myName, setMyName] = useState('Me');
  const [friendName, setFriendName] = useState('Friend');
  const [editingNames, setEditingNames] = useState(false);

  useEffect(() => {
    browser.storage.local.get(['myName', 'friendName']).then((res) => {
      if (res.myName) setMyName(res.myName as string);
      if (res.friendName) setFriendName(res.friendName as string);
    });
  }, []);

  useEffect(() => {
    browser.storage.local.set({ myName, friendName });
  }, [myName, friendName]);

  useEffect(() => {
    const listener = (msg: { type: string; payload?: Message; from?: string; room?: string }) => {
      if (msg.type === 'message' && msg.payload) {
        setMessages((m) => [...m, msg.payload!]);
      }
      if (msg.type === 'typing') {
        setPeerTyping(true);
        setTimeout(() => setPeerTyping(false), 1000);
      }
      if ((msg.type === 'room-created' || msg.type === 'room-joined') && msg.room) {
        setRoom(msg.room);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (room) {
      getMessages(room).then((msgs) => setMessages(msgs));
    }
  }, [room]);

  useEffect(() => {
    if (typing && room) {
      browser.runtime.sendMessage({ type: 'typing', from: 'me' });
    }
  }, [typing, room]);

  const send = () => {
    if (!room) return;
    const payload = {
      id: crypto.randomUUID(),
      from: 'me',
      room,
      body: input,
      createdAt: Date.now()
    };
    browser.runtime.sendMessage({ type: 'send-message', payload });
    setMessages((m) => [...m, payload]);
    setInput('');
    setTyping(false);
  };

  const createRoom = () => {
    browser.runtime.sendMessage({ type: 'create-room' });
  };

  const joinRoom = () => {
    if (joinCode.trim()) {
      browser.runtime.sendMessage({ type: 'join-room', room: joinCode.trim() });
    }
  };

  if (!room) {
    return (
      <div style={{ padding: 16, width: 300 }}>
        <input
          value={myName}
          onChange={(e) => setMyName(e.target.value)}
          placeholder="Your name"
          style={{ width: '100%', marginBottom: 8 }}
        />
        <input
          value={friendName}
          onChange={(e) => setFriendName(e.target.value)}
          placeholder="Friend's name"
          style={{ width: '100%', marginBottom: 8 }}
        />
        <button onClick={createRoom} style={{ width: '100%', marginBottom: 8 }}>
          Create Room
        </button>
        <div>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter code"
            style={{ width: '100%', marginBottom: 8 }}
          />
          <button onClick={joinRoom} style={{ width: '100%' }}>
            Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, width: 300 }}>
      <div style={{ marginBottom: 8 }}>Room code: {room}</div>
      <button
        onClick={() => setEditingNames((v) => !v)}
        style={{ width: '100%', marginBottom: 8 }}
      >
        {editingNames ? 'Done' : 'Edit Names'}
      </button>
      {editingNames && (
        <div style={{ marginBottom: 8 }}>
          <input
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            placeholder="Your name"
            style={{ width: '100%', marginBottom: 8 }}
          />
          <input
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="Friend's name"
            style={{ width: '100%' }}
          />
        </div>
      )}
      <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 4 }}>
            <strong>{m.from === 'me' ? myName : friendName}:</strong> {m.body}
          </div>
        ))}
        {peerTyping && (
          <div>
            <em>{friendName} typing...</em>
          </div>
        )}
      </div>
      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setTyping(true);
        }}
        onBlur={() =>
          browser.runtime.sendMessage({ type: 'read', id: messages[messages.length - 1]?.id })
        }
        style={{ width: '100%', marginBottom: 8 }}
      />
      <button onClick={send} disabled={!input.trim()} style={{ width: '100%' }}>
        Send
      </button>
    </div>
  );
}
