import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  SlidersHorizontal,
  X,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  ChevronDown,
  PieChart,
  Receipt,
  Layers,
  Edit2,
  Trash2,
  Copy,
  Download,
} from 'lucide-react';
import { Transaction, Category, Account, TransactionType } from '../types';
import { formatCurrency, formatNumber, formatDate, Language, t } from '../i18n';

interface CustomDateRangeSearchProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  lang?: Language;
  onEditTx?: (tx: Transaction) => void;
  onDeleteTx?: (id: string) => void;
  onDuplicateTx?: (id: string) => void;
}

export const CustomDateRangeSearch: React.FC<CustomDateRangeSearchProps> = ({
  transactions = [],
  categories = [],
  accounts = [],
  lang = 'bn',
  onEditTx,
  onDeleteTx,
  onDuplicateTx,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Quick preset keys
  type PresetKey =
    | '1_5'
    | '6_10'
    | '11_20'
    | '21_end'
    | '1_15'
    | 'full_month'
    | 'last_30_days'
    | 'custom';

  const [activePreset, setActivePreset] = useState<PresetKey>('1_5');

  // Custom date bounds (YYYY-MM-DD)
  const [startDate, setStartDate] = useState<string>(`${monthPrefix}-01`);
  const [endDate, setEndDate] = useState<string>(`${monthPrefix}-05`);

  // Additional custom search parameters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Handle Preset selection
  const applyPreset = (preset: PresetKey) => {
    setActivePreset(preset);
    switch (preset) {
      case '1_5':
        setStartDate(`${monthPrefix}-01`);
        setEndDate(`${monthPrefix}-05`);
        break;
      case '6_10':
        setStartDate(`${monthPrefix}-06`);
        setEndDate(`${monthPrefix}-10`);
        break;
      case '11_20':
        setStartDate(`${monthPrefix}-11`);
        setEndDate(`${monthPrefix}-20`);
        break;
      case '21_end':
        setStartDate(`${monthPrefix}-21`);
        setEndDate(`${monthPrefix}-${String(daysInMonth).padStart(2, '0')}`);
        break;
      case '1_15':
        setStartDate(`${monthPrefix}-01`);
        setEndDate(`${monthPrefix}-15`);
        break;
      case 'full_month':
        setStartDate(`${monthPrefix}-01`);
        setEndDate(`${monthPrefix}-${String(daysInMonth).padStart(2, '0')}`);
        break;
      case 'last_30_days': {
        const d30 = new Date(now.getTime() - 29 * 86400000);
        setStartDate(d30.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
        break;
      }
      case 'custom':
        // Keep current dates
        break;
    }
  };

  // Filter transactions based on custom configuration
  const { filteredTransactions, summary, categoryBreakdown } = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const catSpentMap: Record<string, { amount: number; count: number }> = {};

    const filtered = transactions.filter((tx) => {
      if (tx.status === 'pending') return false;

      // Date Range Filter
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // Category Filter
      if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;

      // Account Filter
      if (
        selectedAccount !== 'all' &&
        tx.accountId !== selectedAccount &&
        tx.toAccountId !== selectedAccount
      ) {
        return false;
      }

      // Type Filter
      if (selectedType !== 'all') {
        if (selectedType === 'expense' && tx.type !== 'expense' && tx.type !== 'credit_purchase') {
          return false;
        }
        if (selectedType === 'income' && tx.type !== 'income') return false;
        if (selectedType === 'transfer' && tx.type !== 'transfer') return false;
      }

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const note = (tx.notes || '').toLowerCase();
        const cat = tx.categoryId ? catMap.get(tx.categoryId) : null;
        const catName = (cat?.name || '').toLowerCase();
        const catNameBn = (cat?.nameBn || '').toLowerCase();
        const acc = accMap.get(tx.accountId);
        const accName = (acc?.name || '').toLowerCase();
        const accNameBn = (acc?.nameBn || '').toLowerCase();

        const matches =
          desc.includes(q) ||
          note.includes(q) ||
          catName.includes(q) ||
          catNameBn.includes(q) ||
          accName.includes(q) ||
          accNameBn.includes(q);

        if (!matches) return false;
      }

      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        totalIncome += amt;
      } else if (tx.type === 'expense' || tx.type === 'credit_purchase') {
        totalExpense += amt;
        const cId = tx.categoryId || 'uncategorized';
        if (!catSpentMap[cId]) catSpentMap[cId] = { amount: 0, count: 0 };
        catSpentMap[cId].amount += amt;
        catSpentMap[cId].count++;
      } else if (tx.type === 'refund') {
        totalExpense = Math.max(0, totalExpense - amt);
      }

      return true;
    });

    // Sort by date/time descending
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // Build category breakdown sorted by amount
    const catList = Object.entries(catSpentMap)
      .map(([cId, val]) => {
        const cat = catMap.get(cId);
        const name =
          lang === 'bn'
            ? cat?.nameBn || cat?.name || 'সাধারণ / বিবিধ'
            : cat?.name || 'General / Other';
        const pct = totalExpense > 0 ? (val.amount / totalExpense) * 100 : 0;
        return {
          id: cId,
          name,
          color: cat?.color || '#94a3b8',
          icon: cat?.icon || '📦',
          amount: val.amount,
          count: val.count,
          percentage: pct,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      filteredTransactions: filtered,
      summary: {
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        txCount: filtered.length,
      },
      categoryBreakdown: catList,
    };
  }, [
    transactions,
    startDate,
    endDate,
    selectedCategory,
    selectedAccount,
    selectedType,
    searchQuery,
    catMap,
    accMap,
    lang,
  ]);

  // Formatted date label
  const rangeDisplayLabel = useMemo(() => {
    if (activePreset === '1_5') {
      return lang === 'bn' ? 'চলতি মাসের ১ থেকে ৫ তারিখের হিসাব' : '1st to 5th of Current Month';
    }
    if (activePreset === '6_10') {
      return lang === 'bn' ? 'চলতি মাসের ৬ থেকে ১০ তারিখের হিসাব' : '6th to 10th of Current Month';
    }
    if (activePreset === '11_20') {
      return lang === 'bn' ? 'চলতি মাসের ১১ থেকে ২০ তারিখের হিসাব' : '11th to 20th of Current Month';
    }
    if (activePreset === '21_end') {
      return lang === 'bn' ? 'চলতি মাসের ২১ থেকে শেষ তারিখের হিসাব' : '21st to End of Current Month';
    }
    if (activePreset === '1_15') {
      return lang === 'bn' ? 'চলতি মাসের ১ থেকে ১৫ তারিখের হিসাব' : '1st to 15th of Current Month';
    }
    if (activePreset === 'full_month') {
      return lang === 'bn' ? 'চলতি সম্পূর্ণ মাসের হিসাব' : 'Full Current Month';
    }
    if (activePreset === 'last_30_days') {
      return lang === 'bn' ? 'গত ৩০ দিনের সার্বিক হিসাব' : 'Last 30 Days';
    }
    return `${formatDate(startDate, lang)} - ${formatDate(endDate, lang)}`;
  }, [activePreset, startDate, endDate, lang]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {lang === 'bn'
                ? 'কাস্টম তারিখ ও ফিল্টার সার্চ কনফিগারেশন'
                : 'Custom Date Range & Search Configuration'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'bn'
              ? '১-৫ তারিখ বা যেকোনো নির্দিষ্ট তারিখের কোন কোন জায়গায় খরচ হয়েছে, আয়-ব্যয় ও নিট সঞ্চয় তাৎক্ষণিক দেখুন'
              : 'Configure 1st-5th or custom date ranges to see where money went, income, expenses, and savings'}
          </p>
        </div>

        {/* Range Label Badge */}
        <div className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold text-xs self-start sm:self-auto">
          {rangeDisplayLabel}
        </div>
      </div>

      {/* Preset Quick Range Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 block">
          {lang === 'bn' ? 'তারিখের রেঞ্জ নির্বাচন করুন (Presets):' : 'Select Date Range Preset:'}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-5 Quick Button (Specially Requested) */}
          <button
            type="button"
            onClick={() => applyPreset('1_5')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activePreset === '1_5'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5 text-amber-300" />
            <span>{lang === 'bn' ? '১ - ৫ তারিখ' : '1st - 5th'}</span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset('6_10')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === '6_10'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {lang === 'bn' ? '৬ - ১০ তারিখ' : '6th - 10th'}
          </button>

          <button
            type="button"
            onClick={() => applyPreset('11_20')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === '11_20'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {lang === 'bn' ? '১১ - ২০ তারিখ' : '11th - 20th'}
          </button>

          <button
            type="button"
            onClick={() => applyPreset('21_end')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === '21_end'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {lang === 'bn' ? '২১ - শেষ তারিখ' : '21st - End'}
          </button>

          <button
            type="button"
            onClick={() => applyPreset('1_15')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === '1_15'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {lang === 'bn' ? '১ - ১৫ তারিখ' : '1st - 15th'}
          </button>

          <button
            type="button"
            onClick={() => applyPreset('full_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'full_month'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'চলতি পুরো মাস' : 'Full Month'}
          </button>

          <button
            type="button"
            onClick={() => applyPreset('last_30_days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'last_30_days'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'গত ৩০ দিন' : 'Last 30 Days'}
          </button>

          <button
            type="button"
            onClick={() => applyPreset('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePreset === 'custom'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'ম্যানুয়াল তারিখ নির্ধারণ' : 'Custom Dates'}
          </button>
        </div>
      </div>

      {/* Date Range Inputs & Custom Search Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
        {/* Start Date */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
            {lang === 'bn' ? 'শুরুর তারিখ:' : 'Start Date:'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setActivePreset('custom');
            }}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
            {lang === 'bn' ? 'শেষের তারিখ:' : 'End Date:'}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setActivePreset('custom');
            }}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category / Section Filter */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
            {lang === 'bn' ? 'খরচের সেকশন / খাত:' : 'Category / Section:'}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">{lang === 'bn' ? 'সকল সেকশন / খাত' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {lang === 'bn' ? c.nameBn || c.name : c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Account Filter */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
            {lang === 'bn' ? 'অ্যাকাউন্ট / ব্যাংক:' : 'Account / Wallet:'}
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">{lang === 'bn' ? 'সকল অ্যাকাউন্ট' : 'All Accounts'}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nameBn || a.name} ({a.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Free-text Keyword Search Bar & Type Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'কাস্টম বিবরণ, দোকানের নাম বা নোট দিয়ে খুঁজুন...'
                : 'Search by description, shop or note...'
            }
            className="w-full pl-10 pr-9 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Transaction Type Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs w-full sm:w-auto justify-between sm:justify-start">
          {[
            { key: 'all', labelBn: 'সব', labelEn: 'All' },
            { key: 'expense', labelBn: 'ব্যয়', labelEn: 'Expense' },
            { key: 'income', labelBn: 'আয়', labelEn: 'Income' },
            { key: 'transfer', labelBn: 'ট্রান্সফার', labelEn: 'Transfer' },
          ].map((tItem) => (
            <button
              key={tItem.key}
              type="button"
              onClick={() => setSelectedType(tItem.key)}
              className={`px-3 py-1 rounded-xl font-semibold transition-all ${
                selectedType === tItem.key
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'bn' ? tItem.labelBn : tItem.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Financial Results Summary for this Custom Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'নির্বাচিত সময়ের মোট ব্যয়' : 'Range Total Expense'}
          </span>
          <span className="text-base sm:text-lg font-black text-rose-400 mt-0.5 block">
            {formatCurrency(summary.totalExpense, lang)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'নির্বাচিত সময়ের মোট আয়' : 'Range Total Income'}
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 block">
            {formatCurrency(summary.totalIncome, lang)}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'নিট সঞ্চয় / স্থিতি' : 'Net Range Balance'}
          </span>
          <span
            className={`text-base sm:text-lg font-black mt-0.5 block ${
              summary.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(summary.netSavings, lang, { showSign: true })}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'মোট লেনদেন সংখ্যা' : 'Transactions Found'}
          </span>
          <span className="text-base sm:text-lg font-black text-blue-400 mt-0.5 block">
            {formatNumber(summary.txCount, lang)} {lang === 'bn' ? 'টি' : ''}
          </span>
        </div>
      </div>

      {/* Section / Category Breakdown ("কোন কোন জায়গায় খরচ হয়েছে") */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400" />
            <span>
              {lang === 'bn'
                ? 'এই সময়ে কোন কোন সেকশনে/খাতে কত টাকা খরচ হয়েছে:'
                : 'Spending Breakdown by Category in this Range:'}
            </span>
          </h4>
          <span className="text-xs font-semibold text-slate-400">
            {formatNumber(categoryBreakdown.length, lang)} {lang === 'bn' ? 'টি খাত' : 'categories'}
          </span>
        </div>

        {categoryBreakdown.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            {lang === 'bn'
              ? 'নির্বাচিত সময়ে কোনো ব্যয়ের লেনদেন নেই।'
              : 'No expenses recorded in this custom range.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {categoryBreakdown.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{item.icon}</span>
                    <span className="text-xs font-bold text-slate-200 truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-rose-400 shrink-0">
                    {formatCurrency(item.amount, lang)}
                  </span>
                </div>

                {/* Progress bar and stats */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(5, item.percentage))}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {formatNumber(item.count, lang)} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
                    </span>
                    <span className="font-semibold text-slate-300">
                      {formatNumber(Math.round(item.percentage), lang)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtered Transactions List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-400" />
            <span>
              {lang === 'bn'
                ? 'ফিল্টারকৃত লেনদেনের বিস্তারিত তালিকা:'
                : 'Detailed Transactions List:'}
            </span>
          </h4>
          <span className="text-xs text-slate-400 font-medium">
            {formatNumber(filteredTransactions.length, lang)} {lang === 'bn' ? 'টি হিসাব' : 'items'}
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 space-y-1">
            <p className="text-xs font-medium">
              {lang === 'bn'
                ? 'এই কাস্টম ফিল্টারে কোনো লেনদেন খুঁজে পাওয়া যায়নি।'
                : 'No transactions found matching this custom range and filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredTransactions.map((tx) => {
              const cat = tx.categoryId ? catMap.get(tx.categoryId) : null;
              const acc = accMap.get(tx.accountId);
              const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : null;
              const isExp = tx.type === 'expense' || tx.type === 'credit_purchase';
              const isInc = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                      style={{
                        backgroundColor: `${cat?.color || '#64748b'}20`,
                        color: cat?.color || '#94a3b8',
                      }}
                    >
                      {cat?.icon || '💳'}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {tx.description ||
                          (lang === 'bn' ? cat?.nameBn || 'লেনদেন' : cat?.name || 'Transaction')}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-semibold text-slate-300">
                          {formatDate(tx.date, lang)}
                        </span>
                        {tx.time && <span>• {tx.time}</span>}
                        {acc && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {acc.nameBn || acc.name}
                          </span>
                        )}
                        {isTransfer && toAcc && (
                          <span className="text-emerald-400">
                            → {toAcc.nameBn || toAcc.name}
                          </span>
                        )}
                        {cat && (
                          <span className="text-slate-400">
                            ({lang === 'bn' ? cat.nameBn || cat.name : cat.name})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-xs sm:text-sm font-black block ${
                          isExp
                            ? 'text-rose-400'
                            : isInc
                            ? 'text-emerald-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {isExp ? '-' : isInc ? '+' : ''}
                        {formatCurrency(tx.amount, lang)}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {onEditTx && (
                        <button
                          type="button"
                          onClick={() => onEditTx(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                          title={lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDuplicateTx && (
                        <button
                          type="button"
                          onClick={() => onDuplicateTx(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                          title={lang === 'bn' ? 'কপি করুন' : 'Duplicate'}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDeleteTx && (
                        <button
                          type="button"
                          onClick={() => onDeleteTx(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
