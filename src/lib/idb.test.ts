import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { putMessage, getMessages } from './idb';

describe('idb', () => {
  beforeEach(async () => {
    const db = await (await import('idb')).openDB('crocro', 2);
    await db.clear('messages');
  });

  it('stores and retrieves messages', async () => {
    const msg = {
      id: '1',
      from: 'me',
      room: 'room1',
      body: 'hi',
      createdAt: Date.now()
    };
    await putMessage(msg);
    const msgs = await getMessages('room1');
    expect(msgs.length).toBe(1);
    expect(msgs[0].body).toBe('hi');
  });
});
