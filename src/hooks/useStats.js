import { useState, useCallback } from 'react';
import { getCurrentMonthRange } from '../utils/formatters';
import { categories } from '../utils/categories';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthExpenses: 0,
    monthIncome: 0,
    topCategory: null,
    accountBalances: [],
    balanceHistory: [],
    categoryBreakdown: [],
  });

  const refresh = useCallback(async () => {
    if (!user) return;

    // Busca direto do Supabase — sem depender de estado de outros hooks
    const [{ data: accounts }, { data: transactions }] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*').eq('user_id', user.id),
    ]);

    if (!accounts || !transactions) return;

    // Normaliza campos
    const accs = accounts.map(a => ({
      ...a,
      initialBalance: Number(a.initial_balance) || 0,
    }));
    const txns = transactions.map(t => ({
      ...t,
      accountId: t.account_id,
      amount: Number(t.amount),
    }));

    const { start, end } = getCurrentMonthRange();

    const accountBalances = accs.map(acc => {
      const txs = txns.filter(t => t.accountId === acc.id);
      const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = acc.initialBalance + income - expense;
      return { ...acc, balance, income, expense };
    });

    const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0);

    const monthTxs = txns.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const monthExpenses = monthTxs
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const monthIncome = monthTxs
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);

    const catMap = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
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

    const sortedTxs = [...txns].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningTotal = accs.reduce((s, a) => s + a.initialBalance, 0);
    const dayMap = {};

    sortedTxs.forEach(t => {
      const day = new Date(t.date).toISOString().split('T')[0];
      if (t.type === 'income') runningTotal += t.amount;
      else runningTotal -= t.amount;
      dayMap[day] = runningTotal;
    });

    const today = new Date();
    let lastKnown = accs.reduce((s, a) => s + a.initialBalance, 0);
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
  }, [user]);

  return { ...stats, refresh };
}