import React, { useEffect, useState } from 'react';
import browser from 'webextension-polyfill';
import { getMessages } from '../lib/idb';

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  createdAt: number;
  readAt?: number;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);

  useEffect(() => {
    async function load() {
      const msgs = await getMessages('friend');
      setMessages(msgs);
    }
    load();
    const listener = (msg: { type: string; payload?: Message; from?: string }) => {
      if (msg.type === 'message' && msg.payload) {
        const payload = msg.payload;
        setMessages((m) => [...m, payload]);
      }
      if (msg.type === 'typing') {
        setPeerTyping(true);
        setTimeout(() => setPeerTyping(false), 1000);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (typing) {
      browser.runtime.sendMessage({ type: 'typing', from: 'me' });
    }
  }, [typing]);

  const send = () => {
    const payload = {
      id: crypto.randomUUID(),
      from: 'me',
      to: 'friend',
      body: input,
      createdAt: Date.now()
    };
    browser.runtime.sendMessage({ type: 'send-message', payload });
    setMessages((m) => [...m, payload]);
    setInput('');
    setTyping(false);
  };

  return (
    <div style={{ padding: 16, width: 300 }}>
      <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 4 }}>
            <strong>{m.from === 'me' ? 'Me' : 'Friend'}:</strong> {m.body}
          </div>
        ))}
        {peerTyping && (
          <div>
            <em>Friend typing...</em>
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
