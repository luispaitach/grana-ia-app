import Dexie from 'dexie';

export const db = new Dexie('GranaIA');

db.version(2).stores({
  accounts: 'id, user_id, sync_status, name',
  transactions: 'id, user_id, sync_status, accountId, type, category, date',
});

export default db;
