import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { useAuth } from '../contexts/AuthContext';

export function useTransactions(filterAccountId = null) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    let all = await db.transactions
      .where('user_id')
      .equals(user.id)
      .reverse()
      .sortBy('date');
      
    const filtered = filterAccountId
      ? all.filter(t => t.accountId === filterAccountId)
      : all;
    setTransactions(filtered);
    setLoading(false);
  }, [user, filterAccountId]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const addTransaction = async (transaction) => {
    if (!user) return;
    const newTransaction = {
      ...transaction,
      id: uuidv4(),
      user_id: user.id,
      sync_status: 'pending',
      date: transaction.date || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await db.transactions.add(newTransaction);
    await loadTransactions();
  };

  const updateTransaction = async (id, changes) => {
    if (!user) return;
    await db.transactions.update(id, {
      ...changes,
      sync_status: 'pending',
      updated_at: new Date().toISOString()
    });
    await loadTransactions();
  };

  const deleteTransaction = async (id) => {
    if (!user) return;
    await db.transactions.delete(id);
    await loadTransactions();
  };

  return { transactions, loading, addTransaction, deleteTransaction, updateTransaction, refresh: loadTransactions };
}
