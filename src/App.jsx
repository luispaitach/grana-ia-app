import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
  const stats = useStats();

  // Load components after authentication
  useEffect(() => {
    refreshAccounts().then(() => setReady(true));
  }, [refreshAccounts]);

  const refreshAll = useCallback(() => {
    refreshAccounts();
    refreshTransactions();
    stats.refresh();
  }, [refreshAccounts, refreshTransactions, stats]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl font-bold animate-pulse text-white">
            G
          </div>
          <p className="text-gray-500 text-sm">Carregando dados seguros...</p>
        </div>
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
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainApp />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
