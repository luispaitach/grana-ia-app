import { useState, useEffect, useCallback } from 'react';
import db from '../db/database';
import { getCurrentMonthRange } from '../utils/formatters';
import { categories } from '../utils/categories';
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

  const computeStats = useCallback(async () => {
    if (!user) return;
    const accounts = await db.accounts.where('user_id').equals(user.id).toArray();
    const allTransactions = await db.transactions.where('user_id').equals(user.id).toArray();
    const { start, end } = getCurrentMonthRange();

    // Compute balance per account
    const accountBalances = accounts.map(acc => {
      const txs = allTransactions.filter(t => t.accountId === acc.id);
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const balance = (acc.initialBalance || 0) + income - expense;
      return { ...acc, balance, income, expense };
    });

    const totalBalance = accountBalances.reduce((s, a) => s + a.balance, 0);

    // Month totals
    const monthTxs = allTransactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
    const monthExpenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const monthIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

    // Top category this month
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
        topCategory = { ...cat, amount };
      }
    }

    // Category breakdown for chart
    const categoryBreakdown = categories
      .map(cat => ({
        ...cat,
        amount: catMap[cat.id] || 0,
      }))
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Balance history (last 30 days)
    const sortedTxs = [...allTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const balanceHistory = [];
    let runningTotal = accounts.reduce((s, a) => s + (a.initialBalance || 0), 0);
    const dayMap = {};

    sortedTxs.forEach(t => {
      const day = new Date(t.date).toISOString().split('T')[0];
      if (t.type === 'income') runningTotal += t.amount;
      else runningTotal -= t.amount;
      dayMap[day] = runningTotal;
    });

    // Fill in the last 30 days
    const today = new Date();
    let lastKnown = accounts.reduce((s, a) => s + (a.initialBalance || 0), 0);
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

  useEffect(() => {
    computeStats();
  }, [computeStats]);

  return { ...stats, refresh: computeStats };
}
