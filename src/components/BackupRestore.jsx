import { useState, useRef } from 'react';
import { Download, Upload, Check, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database';
import { useAuth } from '../contexts/AuthContext';

export default function BackupRestore({ onRefresh }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const fileRef = useRef();

  const handleExport = async () => {
    try {
      const accounts = await db.accounts.where('user_id').equals(user.id).toArray();
      const transactions = await db.transactions.where('user_id').equals(user.id).toArray();
      const data = {
        version: 2,
        exportedAt: new Date().toISOString(),
        app: 'GranaIA',
        userId: user.id,
        accounts,
        transactions,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `granaia-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'Backup exportado com sucesso!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Erro ao exportar: ' + err.message });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.app !== 'GranaIA') {
        setStatus({ type: 'error', message: 'Arquivo não é um backup válido do GranaIA.' });
        return;
      }
      
      // Clear existing data for CURRENT USER only
      await db.accounts.where('user_id').equals(user.id).delete();
      await db.transactions.where('user_id').equals(user.id).delete();

      const now = new Date().toISOString();

      // Import
      if (data.accounts?.length) {
        const accountIdMap = {};
        const newAccounts = [];
        for (const acc of data.accounts) {
          const oldId = acc.id;
          const newId = uuidv4();
          accountIdMap[oldId] = newId;
          newAccounts.push({
            ...acc,
            id: newId,
            user_id: user.id, // Reassign to current user
            sync_status: 'pending',
            updated_at: now
          });
        }
        await db.accounts.bulkAdd(newAccounts);

        // Update transaction accountIds
        if (data.transactions?.length) {
          const txs = data.transactions.map(tx => {
            const { id, user_id, ...rest } = tx;
            return {
              ...rest,
              id: uuidv4(),
              user_id: user.id, // Reassign to current user
              sync_status: 'pending',
              accountId: accountIdMap[tx.accountId] || tx.accountId,
              updated_at: now
            };
          });
          await db.transactions.bulkAdd(txs);
        }
      }
      setStatus({ type: 'success', message: `Importado! Sincronizando no background...` });
      onRefresh?.();
    } catch (err) {
      setStatus({ type: 'error', message: 'Erro ao importar: ' + err.message });
    }
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Backup & Restauração</h2>

      {status && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2 ${
          status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {status.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export */}
        <div className="bg-gray-800/40 backdrop-blur rounded-2xl p-6 border border-gray-700/40 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
            <Download size={24} />
          </div>
          <h3 className="font-semibold text-gray-200 mb-1">Exportar Dados</h3>
          <p className="text-xs text-gray-500 mb-4">Salve uma cópia de todos os seus dados em formato JSON.</p>
          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-medium hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20"
          >
            Exportar JSON
          </button>
        </div>

        {/* Import */}
        <div className="bg-gray-800/40 backdrop-blur rounded-2xl p-6 border border-gray-700/40 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <Upload size={24} />
          </div>
          <h3 className="font-semibold text-gray-200 mb-1">Importar Dados</h3>
          <p className="text-xs text-gray-500 mb-4">Restaure dados de um arquivo. <span className="text-red-400">Isso apagará seus registros atuais!</span></p>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-medium hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20"
          >
            Importar JSON
          </button>
        </div>
      </div>
    </div>
  );
}
