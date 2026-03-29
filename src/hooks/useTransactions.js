import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Normaliza snake_case do Supabase → camelCase usado no código e no Dexie
function fromSupabase(txn) {
  const { account_id, ...rest } = txn;
  return {
    ...rest,
    accountId: account_id ?? txn.accountId,
    sync_status: 'synced',
  };
}

export function useTransactions(filterAccountId = null) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!error && data) {
        await db.transaction('rw', db.transactions, async () => {
          const pending = await db.transactions.where('sync_status').equals('pending').toArray();
          const pendingIds = new Set(pending.map(p => p.id));

          const toPut = data
            .filter(d => !pendingIds.has(d.id))
            .map(fromSupabase); // normaliza account_id → accountId

          await db.transactions.bulkPut(toPut);
        });
      }
    } catch (e) {
      console.warn('Modo offline: usando cache IndexedDB.', e);
    }

    // Leitura do Dexie com ordenação correta em memória
    let all = await db.transactions
      .where('user_id')
      .equals(user.id)
      .toArray();

    all = all.sort((a, b) => new Date(b.date) - new Date(a.date));

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
      date: transaction.date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let syncStatus = 'pending';

    // Converte accountId → account_id para o Supabase (snake_case)
    const { accountId, ...rest } = newTransaction;
    const supabasePayload = { ...rest, account_id: accountId };

    try {
      const { data: inserted, error } = await supabase
        .from('transactions')
        .insert([supabasePayload])
        .select();

      if (!error && inserted?.length > 0) {
        syncStatus = 'synced';
      } else {
        console.error('Insert falhou ou RLS bloqueou:', error, inserted);
      }
    } catch (e) {
      console.warn('Modo offline. Transação salva localmente e enviada depois.');
    }

    // Salva no Dexie com accountId (camelCase) — consistente com os índices
    await db.transactions.add({ ...newTransaction, sync_status: syncStatus });
    await loadTransactions();
  };

  const updateTransaction = async (id, changes) => {
    if (!user) return;

    const updatedFields = {
      ...changes,
      updated_at: new Date().toISOString(),
    };

    let syncStatus = 'pending';

    const { accountId, ...restFields } = updatedFields;
    const supabaseFields = accountId
      ? { ...restFields, account_id: accountId }
      : restFields;

    try {
      const { error } = await supabase
        .from('transactions')
        .update(supabaseFields)
        .eq('id', id)
        .eq('user_id', user.id);

      if (!error) {
        syncStatus = 'synced';
      } else {
        console.error('Erro Supabase Update:', error);
      }
    } catch (e) {
      console.warn('Modo offline. Atualização salva localmente.');
    }

    await db.transactions.update(id, { ...updatedFields, sync_status: syncStatus });
    await loadTransactions();
  };

  const deleteTransaction = async (id) => {
    if (!user) return;

    try {
      await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
    } catch (e) {
      console.warn('Modo offline ao excluir. Deletado apenas localmente.');
    }

    await db.transactions.delete(id);
    await loadTransactions();
  };

  return { transactions, loading, addTransaction, deleteTransaction, updateTransaction, refresh: loadTransactions };
}