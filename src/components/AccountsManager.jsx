import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function AccountsManager({ accounts, onAdd, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#8B5CF6', icon: '💰', initialBalance: 0, limit: 5000 });

  const handleSave = async () => {
    if (!form.name) return;
    if (editing) {
      await onUpdate(editing, { ...form, initialBalance: Number(form.initialBalance), limit: Number(form.limit) });
      setEditing(null);
    } else {
      await onAdd({ ...form, initialBalance: Number(form.initialBalance), limit: Number(form.limit) });
      setShowNew(false);
    }
    setForm({ name: '', color: '#8B5CF6', icon: '💰', initialBalance: 0, limit: 5000 });
  };

  const startEdit = (acc) => {
    setEditing(acc.id);
    setForm({ name: acc.name, color: acc.color, icon: acc.icon, initialBalance: acc.initialBalance || 0, limit: acc.limit || 0 });
    setShowNew(false);
  };

  const cancel = () => {
    setEditing(null);
    setShowNew(false);
    setForm({ name: '', color: '#8B5CF6', icon: '💰', initialBalance: 0, limit: 5000 });
  };

  const colorOptions = ['#8B5CF6', '#F97316', '#22C55E', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#F59E0B'];
  const iconOptions = ['💰', '💜', '🧡', '💚', '💙', '🏦', '💳', '🪙'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Contas</h2>
        <button
          onClick={() => { setShowNew(true); setEditing(null); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-medium hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus size={16} /> Nova Conta
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid gap-3">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-gray-800/40 backdrop-blur rounded-2xl p-5 border border-gray-700/40">
            {editing === acc.id ? (
              <AccountForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} colorOptions={colorOptions} iconOptions={iconOptions} />
            ) : (
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: acc.color + '20' }}
                >
                  {acc.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold" style={{ color: acc.color }}>{acc.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>Saldo inicial: {formatCurrency(acc.initialBalance || 0)}</span>
                    <span>Limite: {formatCurrency(acc.limit || 0)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(acc)} className="p-2 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-400/10 transition-all">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => onDelete(acc.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Account Form */}
      {showNew && (
        <div className="bg-gray-800/60 backdrop-blur rounded-2xl p-5 border border-violet-500/30 animate-in slide-in-from-top-2">
          <h3 className="font-semibold text-violet-400 mb-4">Nova Conta</h3>
          <AccountForm form={form} setForm={setForm} onSave={handleSave} onCancel={cancel} colorOptions={colorOptions} iconOptions={iconOptions} />
        </div>
      )}
    </div>
  );
}

function AccountForm({ form, setForm, onSave, onCancel, colorOptions, iconOptions }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 font-medium">Nome</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ex: Nubank"
            className="w-full mt-1 bg-gray-900/60 border border-gray-700/40 rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium">Saldo Inicial</label>
          <input
            type="number"
            value={form.initialBalance}
            onChange={e => setForm(f => ({ ...f, initialBalance: e.target.value }))}
            className="w-full mt-1 bg-gray-900/60 border border-gray-700/40 rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/50"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">Limite</label>
        <input
          type="number"
          value={form.limit}
          onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
          className="w-full mt-1 bg-gray-900/60 border border-gray-700/40 rounded-xl px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/50"
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">Cor</label>
        <div className="flex gap-2 mt-1">
          {colorOptions.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">Ícone</label>
        <div className="flex gap-2 mt-1">
          {iconOptions.map(ic => (
            <button
              key={ic}
              type="button"
              onClick={() => setForm(f => ({ ...f, icon: ic }))}
              className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                form.icon === ic ? 'bg-violet-500/30 ring-1 ring-violet-400 scale-110' : 'bg-gray-700/30 hover:bg-gray-700/50'
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-medium hover:from-violet-500 hover:to-fuchsia-500 transition-all">
          <Check size={14} /> Salvar
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-700/40 text-sm text-gray-400 hover:text-gray-200 transition-colors">
          <X size={14} /> Cancelar
        </button>
      </div>
    </div>
  );
}
