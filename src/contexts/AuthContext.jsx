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
  const [loading, setLoading] = useState(true); // Controla o estado de verificação inicial

  useEffect(() => {
    // Busca a sessão atual quando o app inicializa
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

    // Fica escutando mudanças de auth (login, logout, etc)
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
    
    // Cria 3 contas padrão para o usuário assim que registrar
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
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    // Limpa o Dexie local caso seja um usuário diferente logando
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
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
    if (error) throw error;
  };

  const value = {
    session,
    user,
    loading, // Exposto para usarmos no ProtectedRoute
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  // Importante: Passamos os children sempre, o bloqueio real será no ProtectedRoute
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
