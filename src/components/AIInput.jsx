import { useState } from 'react';
import { Sparkles, Send, Check, X, AlertCircle } from 'lucide-react';
import { parseAIInput } from '../utils/aiParser';
import { categories } from '../utils/categories';
import { formatCurrency } from '../utils/formatters';

export default function AIInput({ accounts, onAddTransaction, onRefresh }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  const handleAnalyze = () => {
    if (!text.trim()) return;
    const result = parseAIInput(text, accounts);
    // If no account detected, use first account as default
    if (!result.accountId && accounts.length > 0) {
      result.accountId = accounts[0].id;
      result.accountAutoSelected = true;
    }
    setPreview(result);
    setStatus(null);
  };

  const handleConfirm = async () => {
    if (!preview) return;
    try {
      await onAddTransaction({
        type: preview.type,
        amount: preview.amount,
        category: preview.category,
        description: preview.description,
        accountId: preview.accountId,
        date: preview.date,
      });
      setStatus('success');
      setText('');
      setTimeout(() => {
        setPreview(null);
        setStatus(null);
        onRefresh?.();
      }, 1500);
    } catch {
      setStatus('error');
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setStatus(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const getAccountName = (id) => {
    const acc = accounts.find(a => a.id === id);
    return acc ? `${acc.icon} ${acc.name}` : '—';
  };

  const getCategoryDisplay = (catId) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? `${cat.icon} ${cat.name}` : '📌 Outros';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Sparkles size={16} />
        </div>
        <div>
          <h2 className="text-xl font-bold">Lançamento por IA</h2>
          <p className="text-xs text-gray-500">Descreva a transação em linguagem natural</p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-gray-800/40 backdrop-blur rounded-2xl border border-gray-700/40 overflow-hidden">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ex: "Paguei 50 reais no Nubank almoço" ou "Recebi salário 3500 no Itaú"'
          rows={3}
          className="w-full bg-transparent px-5 pt-4 pb-2 text-sm text-gray-200 outline-none resize-none placeholder:text-gray-600"
        />
        <div className="flex justify-between items-center px-5 pb-3">
          <p className="text-[10px] text-gray-600">Enter para analisar • Shift+Enter para nova linha</p>
          <button
            onClick={handleAnalyze}
            disabled={!text.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-medium hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={14} /> Analisar
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className={`bg-gray-800/60 backdrop-blur rounded-2xl p-5 border animate-in slide-in-from-top-2 ${
          status === 'success' ? 'border-emerald-500/40' : status === 'error' ? 'border-red-500/40' : 'border-violet-500/30'
        }`}>
          {status === 'success' ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <Check size={20} /> <span className="font-medium">Transação salva com sucesso!</span>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-1.5">
                <Sparkles size={14} /> Resultado da Análise
              </h3>

              {preview.confidence === 'low' && (
                <div className="flex items-center gap-2 text-amber-400 text-xs mb-3 bg-amber-400/10 rounded-lg px-3 py-2">
                  <AlertCircle size={14} />
                  Não consegui identificar o valor. Verifique antes de confirmar.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <PreviewField label="Tipo" value={preview.type === 'income' ? '📈 Receita' : '📉 Despesa'} />
                <PreviewField label="Valor" value={formatCurrency(preview.amount)} highlight={preview.type === 'income' ? 'text-emerald-400' : 'text-red-400'} />
                <PreviewField label="Categoria" value={getCategoryDisplay(preview.category)} />
                <PreviewField label="Conta" value={getAccountName(preview.accountId)} note={preview.accountAutoSelected ? '(auto)' : ''} />
              </div>

              {/* Editable account if auto-selected */}
              {preview.accountAutoSelected && (
                <div className="mt-3 pt-3 border-t border-gray-700/40">
                  <label className="text-xs text-gray-500 font-medium">Alterar conta:</label>
                  <select
                    value={preview.accountId}
                    onChange={e => setPreview(p => ({ ...p, accountId: Number(e.target.value), accountAutoSelected: false }))}
                    className="ml-2 bg-gray-900/60 border border-gray-700/40 rounded-lg px-2 py-1 text-sm text-gray-300 outline-none"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition-all"
                >
                  <Check size={14} /> Confirmar
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl bg-gray-700/40 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Examples */}
      <div className="bg-gray-800/20 rounded-2xl p-4 border border-gray-800/40">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Exemplos</p>
        <div className="space-y-1.5">
          {[
            'Paguei 50 reais no Nubank almoço',
            'Uber 25,90 no PicPay',
            'Recebi salário 4500 no Itaú',
            'Netflix 44,90',
            'Mercado 320 reais Nubank',
          ].map((ex, i) => (
            <button
              key={i}
              onClick={() => setText(ex)}
              className="block w-full text-left text-xs text-gray-500 hover:text-violet-400 transition-colors px-2 py-1 rounded hover:bg-violet-500/5"
            >
              "{ex}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewField({ label, value, highlight, note }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`font-medium mt-0.5 ${highlight || 'text-gray-200'}`}>
        {value} {note && <span className="text-gray-600 text-[10px]">{note}</span>}
      </p>
    </div>
  );
}
