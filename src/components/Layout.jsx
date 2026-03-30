import { useState } from 'react';
import { LayoutDashboard, ArrowLeftRight, Landmark, Sparkles, Download, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../hooks/useSync';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
  { id: 'accounts', label: 'Contas', icon: Landmark },
  { id: 'ai', label: 'IA', icon: Sparkles },
  { id: 'backup', label: 'Backup', icon: Download },
];

export default function Layout({ activeTab, onTabChange, onSyncComplete, children }) {
  const { user, signOut } = useAuth();
  const { isOnline, isSyncing } = useSync(onSyncComplete);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg font-bold shadow-lg shadow-violet-500/20 text-white">
              G
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent hidden sm:block">
              GranaIA
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border ${
              isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'} ${isSyncing ? 'animate-pulse' : ''}`} />
              {isOnline ? (isSyncing ? 'Sincronizando...' : 'Online') : 'Offline'}
            </div>
            {user && (
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
                <User size={14} className="text-violet-400" />
                <span className="text-xs text-gray-300 font-medium truncate max-w-[120px] sm:max-w-[200px]">
                  {user.email}
                </span>
                <div className="w-px h-3 bg-gray-700 mx-1"></div>
                <button 
                  onClick={signOut}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Sair da conta"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 backdrop-blur-xl bg-gray-900/90 border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center py-2.5 gap-1 transition-all duration-200 ${
                  active
                    ? 'text-violet-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{tab.label}</span>
                {active && (
                  <div className="absolute top-0 w-8 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
