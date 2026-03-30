import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import AccountsManager from './components/AccountsManager';
import AIInput from './components/AIInput';
import BackupRestore from './components/BackupRestore';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

import { useAccounts } from './hooks/useAccounts';
import { useTransactions } from './hooks/useTransactions';
import { useStats } from './hooks/useStats';

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ready, setReady] = useState(false);

  const { accounts, addAccount, updateAccount, deleteAccount, refresh: refreshAccounts } = useAccounts();
  const { transactions, addTransaction, deleteTransaction, refresh: refreshTransactions } = useTransactions();
  const stats = useStats(); // busca diretamente do Supabase

  useEffect(() => {
    // Carrega tudo em paralelo e só mostra a UI quando os três terminarem
    Promise.all([
      refreshAccounts(),
      refreshTransactions(),
      stats.refresh(),
    ]).then(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshAccounts(),
      refreshTransactions(),
      stats.refresh(),
    ]);
  }, [refreshAccounts, refreshTransactions, stats.refresh]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center flex-col gap-3">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Sincronizando dados...</p>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard stats={stats} accounts={accounts} />}
      {activeTab === 'transactions' && (
        <TransactionList
          transactions={transactions}
          accounts={accounts}
          onDelete={deleteTransaction}
          onAdd={addTransaction}
          onRefresh={refreshAll}
        />
      )}
      {activeTab === 'accounts' && (
        <AccountsManager
          accounts={accounts}
          onAdd={addAccount}
          onUpdate={updateAccount}
          onDelete={deleteAccount}
        />
      )}
      {activeTab === 'ai' && (
        <AIInput
          accounts={accounts}
          onAddTransaction={addTransaction}
          onRefresh={refreshAll}
        />
      )}
      {activeTab === 'backup' && <BackupRestore onRefresh={refreshAll} />}
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainApp />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
