import { openDB, DBSchema } from 'idb';

interface CrocroDB extends DBSchema {
  messages: {
    key: string;
    value: {
      id: string;
      from: string;
      room: string;
      body: string;
      createdAt: number;
      ackAt?: number;
      readAt?: number;
    };
    indexes: { 'by-room': string };
  };
}

const dbPromise = openDB<CrocroDB>('crocro', 2, {
  upgrade(db) {
    const store = db.objectStoreNames.contains('messages')
      ? db.transaction('messages', 'readwrite').objectStore('messages')
      : db.createObjectStore('messages', { keyPath: 'id' });
    const objectStore = store as unknown as IDBObjectStore;
    if (objectStore.indexNames.contains('by-room')) {
      objectStore.deleteIndex('by-room');
    }
    objectStore.createIndex('by-room', 'room');
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
