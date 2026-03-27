import { useState } from 'react';
import { categories } from '../utils/categories';

export default function TransactionForm({ accounts, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    category: 'outros',
    description: '',
    accountId: accounts[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    onSubmit({
      ...form,
      amount: parseFloat(form.amount),
      accountId: Number(form.accountId),
      date: new Date(form.date).toISOString(),
    });
    setForm(prev => ({ ...prev, amount: '', description: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur rounded-2xl p-5 border border-gray-700/40 space-y-4 animate-in slide-in-from-top-2">
      {/* Type toggle */}
      <div className="flex rounded-xl overflow-hidden border border-gray-700/40">
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, type: 'expense' }))}
          className={`flex-1 py-2.5 text-sm font-medium transition-all ${
            form.type === 'expense'
              ? 'bg-red-500/20 text-red-400 border-r border-gray-700/40'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Despesa
        </button>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, type: 'income' }))}
          className={`flex-1 py-2.5 text-sm font-medium transition-all ${
            form.type === 'income'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Receita
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Amount */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Valor</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="0,00"
            className="w-full mt-1 bg-gray-900/60 border border-gray-700/40 rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/50 transition-colors"
            required
          />
        </div>
        {/* Date */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Data</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full mt-1 bg-gray-900/60 border border-gray-700/40 rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-gray-500 font-medium">Descrição</label>
        <input
          type="text"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Ex: Almoço no restaurante"
          className="w-full mt-1 bg-gray-900/60 border border-gray-700/40 rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/50 transition-colors"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Category */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Categoria</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full mt-1 bg-gray-900/60 border border-gray-700/40 rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/50 transition-colors"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
        {/* Account */}
        <div>
          <label className="text-xs text-gray-500 font-medium">Conta</label>
          <select
            value={form.accountId}
            onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
            className="w-full mt-1 bg-gray-900/60 border border-gray-700/40 rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/50 transition-colors"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-medium hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl bg-gray-700/40 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
