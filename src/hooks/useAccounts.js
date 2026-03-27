import { useState, useEffect, useCallback } from 'react';
import db from '../db/database';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    const data = await db.accounts.toArray();
    setAccounts(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const addAccount = async (account) => {
    await db.accounts.add(account);
    await loadAccounts();
  };

  const updateAccount = async (id, changes) => {
    await db.accounts.update(id, changes);
    await loadAccounts();
  };

  const deleteAccount = async (id) => {
    await db.accounts.delete(id);
    await db.transactions.where('accountId').equals(id).delete();
    await loadAccounts();
  };

  return { accounts, loading, addAccount, updateAccount, deleteAccount, refresh: loadAccounts };
}
