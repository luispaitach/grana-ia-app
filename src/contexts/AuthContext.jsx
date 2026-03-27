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

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    
    // Create default accounts for new user globally
    if (data?.user) {
      const now = new Date().toISOString();
      const accountsToCreate = defaultAccounts.map(acc => ({
        ...acc,
        id: uuidv4(),
        user_id: data.user.id,
        sync_status: 'pending',
        updated_at: now
      }));
      await db.accounts.bulkAdd(accountsToCreate);
    }
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // On login, clear the local dexie DB to avoid merging old user's data
    // Then the sync logic will pull the fresh data from Supabase.
    if (!error && data?.user?.id !== user?.id) {
      await db.accounts.clear();
      await db.transactions.clear();
    }
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await db.accounts.clear();
    await db.transactions.clear();
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const value = {
    session,
    user,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
