import { useState } from 'react';
import { Trash2, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { categories } from '../utils/categories';
import TransactionForm from './TransactionForm';

export default function TransactionList({ transactions, accounts, onDelete, onAdd, onRefresh }) {
  const [filterAccount, setFilterAccount] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const filtered = filterAccount === 'all'
    ? transactions
    : transactions.filter(t => t.accountId === Number(filterAccount));

  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? acc.name : '—';
  };

  const getAccountColor = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc?.color || '#6B7280';
  };

  const getCategoryIcon = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.icon || '📌';
  };

  const handleAdd = async (transaction) => {
    await onAdd(transaction);
    setShowForm(false);
    onRefresh?.();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Transações</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl px-3 py-2 border border-gray-700/40">
            <Filter size={14} className="text-gray-500" />
            <select
              value={filterAccount}
              onChange={e => setFilterAccount(e.target.value)}
              className="bg-transparent text-sm text-gray-300 outline-none cursor-pointer"
            >
              <option value="all">Todas as contas</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-medium hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20"
          >
            + Nova
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <TransactionForm accounts={accounts} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-2">📊</p>
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          filtered.map(tx => (
            <div
              key={tx.id}
              className="flex items-center gap-3 bg-gray-800/40 backdrop-blur rounded-xl p-4 border border-gray-700/30 hover:border-gray-600/40 transition-all group"
            >
              <div className="text-2xl">{getCategoryIcon(tx.category)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{tx.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: getAccountColor(tx.accountId) + '20', color: getAccountColor(tx.accountId) }}
                  >
                    {getAccountName(tx.accountId)}
                  </span>
                  <span className="text-[10px] text-gray-500">{formatDate(tx.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className={`flex items-center gap-1 font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    onDelete(tx.id);
                    onRefresh?.();
                  }}
                  className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
