import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function toSupabase(account) {
  const { initialBalance, sync_status, ...rest } = account;
  return {
    ...rest,
    initial_balance: initialBalance ?? 0,
  };
}

function fromSupabase(account) {
  const { initial_balance, ...rest } = account;
  return {
    ...rest,
    initialBalance: Number(initial_balance) ?? 0,
    sync_status: 'synced',
  };
}

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Retorna os dados diretamente em vez de depender do setState
  // para que o App.jsx possa aguardar os dados reais do Supabase
  const loadAccounts = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        await db.transaction('rw', db.accounts, async () => {
          const pending = await db.accounts.where('sync_status').equals('pending').toArray();
          const pendingIds = new Set(pending.map(p => p.id));
          const toPut = data
            .filter(d => !pendingIds.has(d.id))
            .map(fromSupabase);
          await db.accounts.bulkPut(toPut);
        });
      }
    } catch (e) {
      console.warn('Modo offline: usando cache IndexedDB.', e);
    }

    const localData = await db.accounts.where('user_id').equals(user.id).toArray();
    setAccounts(localData);
    setLoading(false);
    return localData; // retorna os dados para o Promise.all do App.jsx
  }, [user]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const addAccount = async (account) => {
    if (!user) return;
    const newAccount = {
      ...account,
      id: uuidv4(),
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };
    let syncStatus = 'pending';
    try {
      const { data: inserted, error } = await supabase
        .from('accounts')
        .insert([toSupabase(newAccount)])
        .select();
      if (!error && inserted?.length > 0) {
        syncStatus = 'synced';
      } else {
        console.error('Erro Supabase Insert de Conta:', error, inserted);
      }
    } catch (e) {
      console.warn('Modo offline. Conta criada apenas no cache.');
    }
    await db.accounts.add({ ...newAccount, sync_status: syncStatus });
    await loadAccounts();
  };

  const updateAccount = async (id, changes) => {
    if (!user) return;
    const updatedFields = {
      ...changes,
      updated_at: new Date().toISOString(),
    };
    let syncStatus = 'pending';
    try {
      const { error } = await supabase
        .from('accounts')
        .update(toSupabase(updatedFields))
        .eq('id', id)
        .eq('user_id', user.id);
      if (!error) {
        syncStatus = 'synced';
      } else {
        console.error('Erro Supabase Update Conta:', error);
      }
    } catch (e) {
      console.warn('Modo offline. Conta atualizada apenas no cache.');
    }
    await db.accounts.update(id, { ...updatedFields, sync_status: syncStatus });
    await loadAccounts();
  };

  const deleteAccount = async (id) => {
    if (!user) return;
    try {
      await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id);
      await supabase.from('transactions').delete().eq('account_id', id).eq('user_id', user.id);
    } catch (e) {
      console.warn('Modo offline. Deletando apenas no cache Dexie.');
    }
    await db.accounts.delete(id);
    await db.transactions.where('accountId').equals(id).delete();
    await loadAccounts();
  };

  return { accounts, loading, addAccount, updateAccount, deleteAccount, refresh: loadAccounts };
}