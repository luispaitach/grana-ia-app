import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    if (!user) return;
    
    try {
      // 1. Prioriza buscar contas ativas direto do Supabase
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);
        
      if (!error && data) {
         // Salva dados baixados no cache Local
        await db.transaction('rw', db.accounts, async () => {
          const pending = await db.accounts.where('sync_status').equals('pending').toArray();
          const pendingIds = new Set(pending.map(p => p.id));
          
          const toPut = data
            .filter(d => !pendingIds.has(d.id))
            .map(d => ({ ...d, sync_status: 'synced' }));
            
          await db.accounts.bulkPut(toPut);
        });
      }
    } catch (e) {
      console.warn('Modo offline: Falha ao buscar Supabase. Usando contas do IndexedDB.', e);
    }

    // 2. Transmite dados da UI lendo do Dexie
    const localData = await db.accounts.where('user_id').equals(user.id).toArray();
    setAccounts(localData);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const addAccount = async (account) => {
    if (!user) return;
    const newAccount = {
      ...account,
      id: uuidv4(),
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    let syncStatus = 'pending';

    try {
      // Envia imediatamente para a nuvem
      const { error } = await supabase.from('accounts').insert([newAccount]);
      if (!error) {
        syncStatus = 'synced';
      } else {
        console.error('Erro Supabase Insert de Conta:', error);
      }
    } catch (e) {
      console.warn('Modo offline. Conta criada apenas no cache.');
    }

    // Salva no banco local com o status correto
    await db.accounts.add({ ...newAccount, sync_status: syncStatus });
    await loadAccounts();
  };

  const updateAccount = async (id, changes) => {
    if (!user) return;
    
    const updatedFields = {
      ...changes,
      updated_at: new Date().toISOString()
    };

    let syncStatus = 'pending';

    try {
      const { error } = await supabase
        .from('accounts')
        .update(updatedFields)
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (!error) {
        syncStatus = 'synced';
      } else {
        console.error('Erro Supabase Update Conta:', error);
      }
    } catch (e) {
      console.warn('Modo offline. Conta atualizada apenas no cache');
    }

    await db.accounts.update(id, { ...updatedFields, sync_status: syncStatus });
    await loadAccounts();
  };

  const deleteAccount = async (id) => {
    if (!user) return;
    
    try {
      await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id);
      await supabase.from('transactions').delete().eq('accountId', id).eq('user_id', user.id);
    } catch (e) {
       console.warn('Modo offline. Deletando dados apenas no cache Dexie');
    }

    await db.accounts.delete(id);
    await db.transactions.where('accountId').equals(id).delete();
    await loadAccounts();
  };

  return { accounts, loading, addAccount, updateAccount, deleteAccount, refresh: loadAccounts };
}
