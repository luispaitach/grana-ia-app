import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

const defaultAccounts = [
  { name: 'Nubank', color: '#7f77dd', icon: '💜', initialBalance: 0, limit: 5000 },
  { name: 'Itaú', color: '#1D9E75', icon: '🧡', initialBalance: 0, limit: 10000 },
  { name: 'PicPay', color: '#EF9F27', icon: '💚', initialBalance: 0, limit: 3000 },
];

async function flushPendingToSupabase(userId) {
  try {
    const pendingAccounts = await db.accounts
      .where('sync_status').equals('pending')
      .filter(a => a.user_id === userId)
      .toArray();

    for (const acc of pendingAccounts) {
      const { initialBalance, sync_status, ...rest } = acc;
      const payload = { ...rest, initial_balance: initialBalance ?? 0 };
      const { error } = await supabase.from('accounts').upsert(payload);
      if (!error) await db.accounts.update(acc.id, { sync_status: 'synced' });
    }

    const pendingTxns = await db.transactions
      .where('sync_status').equals('pending')
      .filter(t => t.user_id === userId)
      .toArray();

    for (const txn of pendingTxns) {
      const { accountId, sync_status, ...rest } = txn;
      const payload = { ...rest, account_id: accountId };
      const { error } = await supabase.from('transactions').upsert(payload);
      if (!error) await db.transactions.update(txn.id, { sync_status: 'synced' });
    }
  } catch (e) {
    console.warn('Flush de pendentes falhou:', e);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('Erro ao buscar sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
    if (error) throw error;

    if (data?.user) {
      const now = new Date().toISOString();
      const accountsToCreate = defaultAccounts.map(acc => ({
        id: uuidv4(),
        user_id: data.user.id,
        name: acc.name,
        color: acc.color,
        icon: acc.icon,
        updated_at: now,
      }));

      for (const acc of accountsToCreate) {
        const { error: insErr } = await supabase.from('accounts').insert(acc);
        await db.accounts.add({
          ...acc,
          initialBalance: 0,
          sync_status: insErr ? 'pending' : 'synced',
        });
      }
    }

    return data;
  };

  const signIn = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) throw error;

    // 🔥 Sempre limpa o banco de dados local após um login explícito bem sucedido.
    // Isso garante que alterações (como deletar transações) feitas em outros dispositivos
    // não reapareçam por estarem "presas" no cache Dexie.
    await db.accounts.clear();
    await db.transactions.clear();

    return data;
  };

  const signOut = async () => {
    // Flush dos pendentes antes de invalidar a sessão
    if (user?.id) await flushPendingToSupabase(user.id);

    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Falha no signOut pelo Supabase (talvez offline), limpando cache local.", e);
    }

    // 🔥 Incondicionalmente limpa o banco na ação de logout.
    await db.accounts.clear();
    await db.transactions.clear();
  };

  const resetPassword = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) throw error;
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
