import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentMonthRange } from '../utils/formatters';
import { categories } from '../utils/categories';

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

  // Usa ref para comparar se os dados realmente mudaram (evita loops infinitos)
  const prevKey = useRef('');

  useEffect(() => {
    // Gera uma chave baseada no conteúdo real dos dados
    // Só recomputa se accounts ou transactions mudaram de verdade
    const key = `${accounts.length}:${transactions.length}:${transactions.reduce((s, t) => s + Number(t.amount), 0)}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    const { start, end } = getCurrentMonthRange();

    const accountBalances = accounts.map(acc => {
      const txs = transactions.filter(t => t.accountId === acc.id);
      const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      const balance = (Number(acc.initialBalance) || 0) + income - expense;
      return { ...acc, balance, income, expense };
    });

    const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0);

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

    const categoryBreakdown = categories
      .map(cat => ({ ...cat, amount: catMap[cat.id] || 0 }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const sortedTxs = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningTotal = accounts.reduce((s, a) => s + (Number(a.initialBalance) || 0), 0);
    const dayMap = {};

    sortedTxs.forEach(t => {
      const day = new Date(t.date).toISOString().split('T')[0];
      if (t.type === 'income') runningTotal += Number(t.amount);
      else runningTotal -= Number(t.amount);
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
  }, [accounts, transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    prevKey.current = ''; // força recomputação no próximo render
  }, []);

  return { ...stats, refresh };
}