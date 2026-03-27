import { TrendingUp, TrendingDown, Wallet, Tag } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import BalanceChart from './BalanceChart';
import CategoryChart from './CategoryChart';

export default function Dashboard({ stats, accounts }) {
  const { totalBalance, monthExpenses, monthIncome, topCategory, accountBalances, balanceHistory, categoryBreakdown } = stats;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Wallet size={18} />}
          label="Saldo Total"
          value={formatCurrency(totalBalance)}
          gradient="from-violet-500 to-fuchsia-500"
          textColor={totalBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}
        />
        <StatCard
          icon={<TrendingDown size={18} />}
          label="Gastos do Mês"
          value={formatCurrency(monthExpenses)}
          gradient="from-red-500 to-orange-500"
          textColor="text-red-400"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Receitas do Mês"
          value={formatCurrency(monthIncome)}
          gradient="from-emerald-500 to-teal-500"
          textColor="text-emerald-400"
        />
        <StatCard
          icon={<Tag size={18} />}
          label="Maior Categoria"
          value={topCategory ? `${topCategory.icon} ${topCategory.name}` : '—'}
          subValue={topCategory ? formatCurrency(topCategory.amount) : ''}
          gradient="from-amber-500 to-orange-500"
          textColor="text-amber-400"
        />
      </div>

      {/* Account Balances */}
      <div className="bg-gray-800/40 backdrop-blur rounded-2xl p-5 border border-gray-700/40">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Saldo por Conta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {accountBalances.map(acc => (
            <div
              key={acc.id}
              className="flex items-center gap-3 bg-gray-900/60 rounded-xl p-4 border border-gray-700/30 hover:border-gray-600/50 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: acc.color + '20', color: acc.color }}
              >
                {acc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-400 truncate">{acc.name}</p>
                <p className={`text-lg font-bold ${acc.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(acc.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800/40 backdrop-blur rounded-2xl p-5 border border-gray-700/40">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Evolução do Saldo (30 dias)</h3>
          <BalanceChart data={balanceHistory} />
        </div>
        <div className="bg-gray-800/40 backdrop-blur rounded-2xl p-5 border border-gray-700/40">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Gastos por Categoria</h3>
          <CategoryChart data={categoryBreakdown} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, gradient, textColor }) {
  return (
    <div className="bg-gray-800/40 backdrop-blur rounded-2xl p-4 border border-gray-700/40 hover:border-gray-600/50 transition-all duration-300 group">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-bold mt-1 ${textColor || 'text-gray-100'}`}>{value}</p>
      {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
    </div>
  );
}
