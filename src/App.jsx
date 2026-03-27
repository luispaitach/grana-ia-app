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

// Componente principal contendo as tabs do usuário autenticado
function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [ready, setReady] = useState(false);

  const { accounts, addAccount, updateAccount, deleteAccount, refresh: refreshAccounts } = useAccounts();
  const { transactions, addTransaction, deleteTransaction, refresh: refreshTransactions } = useTransactions();
  const stats = useStats();

  // Carrega os dados locais logo ao entrar na rota protegida
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
        <p className="text-gray-500 text-sm animate-pulse">Sincronizando dados...</p>
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

// Configuração principal das Rotas
export default function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider deve vir dentro do BrowserRouter se quiser usar hooks de navegação internamente no contexto */}
      <AuthProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Rotas Protegidas (Requer login via ProtectedRoute) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainApp />} />
            {/* Redirecionar /dashboard explicitamente para / */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
          </Route>

          {/* Fallback de rotas desconhecidas ou protegidas vai depender do ProtectedRoute, ou volta pro inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
