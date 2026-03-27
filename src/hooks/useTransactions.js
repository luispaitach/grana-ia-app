import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useTransactions(filterAccountId = null) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    
    try {
      // 1. Prioriza buscar transações diretamente do Supabase
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
        
      if (!error && data) {
        // Atualiza o cache local Dexie com o que veio do servidor
        await db.transaction('rw', db.transactions, async () => {
          // Mantém as transações locais que ainda não subiram (pending)
          const pending = await db.transactions.where('sync_status').equals('pending').toArray();
          const pendingIds = new Set(pending.map(p => p.id));
          
          const toPut = data
            .filter(d => !pendingIds.has(d.id))
            .map(d => ({ ...d, sync_status: 'synced' }));
            
          await db.transactions.bulkPut(toPut);
        });
      }
    } catch (e) {
      console.warn('Modo offline: Falha ao buscar Supabase. Usando cache IndexedDB.', e);
    }

    // 2. Carrega para a UI sempre a partir do Dexie (dados mais rápidos e combinados)
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
      date: transaction.date || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let syncStatus = 'pending';

    try {
      // Tenta enviar diretamente pro Supabase na hora
      const { error } = await supabase.from('transactions').insert([newTransaction]);
      if (!error) {
        syncStatus = 'synced';
      } else {
        console.error('Erro Supabase Insert:', error);
      }
    } catch (e) {
      console.warn('Modo offline. Transação salva localmente e enviada depois.');
    }

    // Salva no Dexie (Cache Local) garantindo persistência imediata
    await db.transactions.add({ ...newTransaction, sync_status: syncStatus });
    await loadTransactions();
  };

  const updateTransaction = async (id, changes) => {
    if (!user) return;
    
    const updatedFields = {
      ...changes,
      updated_at: new Date().toISOString()
    };

    let syncStatus = 'pending';

    try {
      const { error } = await supabase
        .from('transactions')
        .update(updatedFields)
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
      // Exclui do banco em nuvem
      await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    } catch (e) {
      console.warn('Modo offline ao excluir. Deletado apenas localmente.');
    }

    // Exclui do cache local
    await db.transactions.delete(id);
    await loadTransactions();
  };

  return { transactions, loading, addTransaction, deleteTransaction, updateTransaction, refresh: loadTransactions };
}
