import Dexie from 'dexie';

export const db = new Dexie('GranaIA');

db.version(1).stores({
  accounts: '++id, name',
  transactions: '++id, accountId, type, category, date',
});

export default db;
