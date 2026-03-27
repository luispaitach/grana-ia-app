import { useState } from 'react';
import { LayoutDashboard, ArrowLeftRight, Landmark, Sparkles, Download } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transações', icon: ArrowLeftRight },
  { id: 'accounts', label: 'Contas', icon: Landmark },
  { id: 'ai', label: 'IA', icon: Sparkles },
  { id: 'backup', label: 'Backup', icon: Download },
];

export default function Layout({ activeTab, onTabChange, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/80 border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg font-bold shadow-lg shadow-violet-500/20">
              G
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              GranaIA
            </h1>
          </div>
          <span className="text-xs text-gray-500 hidden sm:block">Finanças pessoais inteligentes</span>
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
