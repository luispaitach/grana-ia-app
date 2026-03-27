import db from './database';

const defaultAccounts = [
  { name: 'Nubank', color: '#8B5CF6', icon: '💜', initialBalance: 0, limit: 5000 },
  { name: 'Itaú', color: '#F97316', icon: '🧡', initialBalance: 0, limit: 10000 },
  { name: 'PicPay', color: '#22C55E', icon: '💚', initialBalance: 0, limit: 3000 },
];

let seeded = false;

export async function seedDatabase() {
  if (seeded) return;
  seeded = true;
  await db.transaction('rw', db.accounts, async () => {
    const count = await db.accounts.count();
    if (count === 0) {
      await db.accounts.bulkAdd(defaultAccounts);
    }
  });
}
