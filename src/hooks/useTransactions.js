import { useState, useEffect, useCallback } from 'react';
import db from '../db/database';

export function useTransactions(filterAccountId = null) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    let query = db.transactions.orderBy('date').reverse();
    const all = await query.toArray();
    const filtered = filterAccountId
      ? all.filter(t => t.accountId === filterAccountId)
      : all;
    setTransactions(filtered);
    setLoading(false);
  }, [filterAccountId]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const addTransaction = async (transaction) => {
    await db.transactions.add({
      ...transaction,
      date: transaction.date || new Date().toISOString(),
    });
    await loadTransactions();
  };

  const deleteTransaction = async (id) => {
    await db.transactions.delete(id);
    await loadTransactions();
  };

  const updateTransaction = async (id, changes) => {
    await db.transactions.update(id, changes);
    await loadTransactions();
  };

  return { transactions, loading, addTransaction, deleteTransaction, updateTransaction, refresh: loadTransactions };
}
