import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import db from '../db/database';
import { useAuth } from '../contexts/AuthContext';

export function useSync() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncData = useCallback(async () => {
    if (!user || !isOnline || isSyncing) return;
    setIsSyncing(true);

    try {
      // 1. PUSH local changes to Supabase
      const pendingAccounts = await db.accounts.where('sync_status').equals('pending').toArray();
      const pendingTransactions = await db.transactions.where('sync_status').equals('pending').toArray();

      if (pendingAccounts.length > 0) {
        const { error } = await supabase.from('accounts').upsert(
          pendingAccounts.map(({ sync_status, ...rest }) => rest)
        );
        if (!error) {
          await db.accounts.bulkPut(pendingAccounts.map(a => ({ ...a, sync_status: 'synced' })));
        }
      }

      if (pendingTransactions.length > 0) {
        const { error } = await supabase.from('transactions').upsert(
          pendingTransactions.map(({ sync_status, ...rest }) => rest)
        );
        if (!error) {
          await db.transactions.bulkPut(pendingTransactions.map(t => ({ ...t, sync_status: 'synced' })));
        }
      }

      // 2. PULL remote changes from Supabase
      const { data: remoteAccounts, error: errA } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (!errA && remoteAccounts) {
        await db.transaction('rw', db.accounts, async () => {
          const localAccounts = Object.fromEntries(
            (await db.accounts.toArray()).map(a => [a.id, a])
          );
          
          for (const ra of remoteAccounts) {
            const la = localAccounts[ra.id];
            // If local is pending, we don't overwrite it yet to avoid losing offline changes
            if (!la || la.sync_status !== 'pending') {
              await db.accounts.put({ ...ra, sync_status: 'synced' });
            }
          }
        });
      }

      const { data: remoteTransactions, error: errT } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (!errT && remoteTransactions) {
        await db.transaction('rw', db.transactions, async () => {
          const localTxs = Object.fromEntries(
            (await db.transactions.toArray()).map(t => [t.id, t])
          );
          
          for (const rt of remoteTransactions) {
            const lt = localTxs[rt.id];
            if (!lt || lt.sync_status !== 'pending') {
              await db.transactions.put({ ...rt, sync_status: 'synced' });
            }
          }
        });
      }

    } catch (err) {
      console.error('Falha na sincronização:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isOnline]);

  // Sync on mount and online event
  useEffect(() => {
    syncData();
  }, [syncData, isOnline]);

  return { isOnline, isSyncing, syncData };
}
