import { useState, useEffect, useCallback } from 'react';
import { getCurrentMonthRange } from '../utils/formatters';
import { categories } from '../utils/categories';

// Recebe accounts e transactions diretamente dos hooks pai
// Recomputa automaticamente via useEffect quando os dados mudam
export function useStats(accounts = [], transactions = []) {
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthExpenses: 0,
    monthIncome: 0,
    topCategory: null,
    accountBalances: [],
    balanceHistory: [],
    categoryBreakdown: [],
  });

  const computeStats = useCallback(() => {
    const { start, end } = getCurrentMonthRange();

    // Saldo por conta
    const accountBalances = accounts.map(acc => {
      const txs = transactions.filter(t => t.accountId === acc.id);
      const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const balance = (Number(acc.initialBalance) || 0) + income - expense;
      return { ...acc, balance, income, expense };
    });

    const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0);

    // Totais do mês
    const monthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
    const monthExpenses = monthTxs
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);
    const monthIncome = monthTxs
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0);

    // Categoria com maior gasto no mês
    const catMap = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    });

    let topCategory = null;
    let topAmount = 0;
    for (const [catId, amount] of Object.entries(catMap)) {
      if (amount > topAmount) {
        topAmount = amount;
        const cat = categories.find(c => c.id === catId);
        topCategory = cat ? { ...cat, amount } : { id: catId, name: catId, icon: '📌', amount };
      }
    }

    // Breakdown por categoria para o gráfico
    const categoryBreakdown = categories
      .map(cat => ({ ...cat, amount: catMap[cat.id] || 0 }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Histórico de saldo (últimos 30 dias)
    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningTotal = accounts.reduce((s, a) => s + (Number(a.initialBalance) || 0), 0);
    const dayMap = {};

    sortedTxs.forEach(t => {
      const day = new Date(t.date).toISOString().split('T')[0];
      if (t.type === 'income')   runningTotal += Number(t.amount);
      else                        runningTotal -= Number(t.amount);
      dayMap[day] = runningTotal;
    });

    const today = new Date();
    let lastKnown = accounts.reduce((s, a) => s + (Number(a.initialBalance) || 0), 0);
    const balanceHistory = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (dayMap[key] !== undefined) lastKnown = dayMap[key];
      balanceHistory.push({ date: key, balance: lastKnown });
    }

    setStats({
      totalBalance,
      monthExpenses,
      monthIncome,
      topCategory,
      accountBalances,
      balanceHistory,
      categoryBreakdown,
    });
  }, [accounts, transactions]); // recomputa sempre que os dados mudarem

  useEffect(() => {
    computeStats();
  }, [computeStats]);

  return { ...stats, refresh: computeStats };
}