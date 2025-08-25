import { openDB, DBSchema } from 'idb';

interface CrocroDB extends DBSchema {
  messages: {
    key: string;
    value: {
      id: string;
      from: string;
      to: string;
      body: string;
      createdAt: number;
      ackAt?: number;
      readAt?: number;
    };
    indexes: { 'by-room': string };
  };
}

const dbPromise = openDB<CrocroDB>('crocro', 1, {
  upgrade(db) {
    const store = db.createObjectStore('messages', {
      keyPath: 'id'
    });
    store.createIndex('by-room', 'to');
  }
});

export async function putMessage(msg: CrocroDB['messages']['value']) {
  const db = await dbPromise;
  await db.put('messages', msg);
}

export async function getMessages(room: string) {
  const db = await dbPromise;
  return db.getAllFromIndex('messages', 'by-room', room);
}
