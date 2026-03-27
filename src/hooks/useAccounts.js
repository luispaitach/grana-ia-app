import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { useAuth } from '../contexts/AuthContext';

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    if (!user) return;
    const data = await db.accounts.where('user_id').equals(user.id).toArray();
    setAccounts(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const addAccount = async (account) => {
    if (!user) return;
    const newAccount = {
      ...account,
      id: uuidv4(),
      user_id: user.id,
      sync_status: 'pending',
      updated_at: new Date().toISOString()
    };
    await db.accounts.add(newAccount);
    await loadAccounts();
  };

  const updateAccount = async (id, changes) => {
    if (!user) return;
    await db.accounts.update(id, {
      ...changes,
      sync_status: 'pending',
      updated_at: new Date().toISOString()
    });
    await loadAccounts();
  };

  const deleteAccount = async (id) => {
    if (!user) return;
    // For sync we usually prefer soft-deletes (e.g., deleted_at). 
    // To keep it simple, we just delete locally. In a full production app, 
    // we would mark as deleted and push status to Supabase.
    await db.accounts.delete(id);
    await db.transactions.where('accountId').equals(id).delete();
    await loadAccounts();
  };

  return { accounts, loading, addAccount, updateAccount, deleteAccount, refresh: loadAccounts };
}
