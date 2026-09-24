import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Edit2,
  Bell,
  RefreshCw,
  X,
  Check,
  Zap,
} from 'lucide-react';
import { Budget, Category, RecurringExpense, Reminder, MonthlyCategoryStats } from '../types';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeDate,
  getCategoryName,
  Language,
  t,
} from '../i18n';
import { parseBengaliNumber } from '../utils/accounting';

interface BudgetViewProps {
  budgets: Budget[];
  categoryStats: MonthlyCategoryStats[];
  categories: Category[];
  recurringExpenses: RecurringExpense[];
  reminders: Reminder[];
  onUpdateBudget: (categoryId: string, monthlyLimit: number) => void;
  onAddRecurring: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  onPayRecurring: (rec: RecurringExpense) => void;
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  onFulfillReminder: (rem: Reminder) => void;
  lang?: Language;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgets,
  categoryStats,
  categories,
  recurringExpenses,
  reminders,
  onUpdateBudget,
  onAddRecurring,
  onPayRecurring,
  onAddReminder,
  onFulfillReminder,
  lang = 'bn',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'budgets' | 'recurring' | 'reminders'>('budgets');

  // Budget edit state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [budgetLimitStr, setBudgetLimitStr] = useState('');

  // Add Recurring state
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recAmountStr, setRecAmountStr] = useState('');
  const [recCategoryId, setRecCategoryId] = useState(categories[0]?.id || '');
  const [recFrequency, setRecFrequency] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [recDueDay, setRecDueDay] = useState(5);

  // Add Reminder state
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remAmountStr, setRemAmountStr] = useState('');
  const [remDueDate, setRemDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [remCategoryId, setRemCategoryId] = useState(categories[0]?.id || '');

  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Calculate total budget vs total spent
  const totalBudget = budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0);
  const totalSpent = categoryStats.reduce((sum, cs) => sum + (cs.spent || 0), 0);

  const handleSaveBudget = (catId: string) => {
    const limit = parseBengaliNumber(budgetLimitStr);
    onUpdateBudget(catId, limit);
    setEditingCategoryId(null);
    setBudgetLimitStr('');
  };

  const handleCreateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseBengaliNumber(recAmountStr);
    if (!recTitle.trim() || amt <= 0) return;

    onAddRecurring({
      title: recTitle.trim(),
      amount: amt,
      categoryId: recCategoryId,
      frequency: recFrequency,
      dueDay: recDueDay,
      isActive: true,
    });

    setIsAddRecurringOpen(false);
    setRecTitle('');
    setRecAmountStr('');
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseBengaliNumber(remAmountStr);
    if (!remTitle.trim() || amt <= 0) return;

    onAddReminder({
      title: remTitle.trim(),
      amount: amt,
      dueDate: remDueDate,
      categoryId: remCategoryId || undefined,
      status: 'pending',
    });

    setIsAddReminderOpen(false);
    setRemTitle('');
    setRemAmountStr('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('budget.title', lang)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t('budget.subtitle', lang)}
          </p>
        </div>

        {/* Subtab Selector */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveSubTab('budgets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'budgets'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="h-3.5 w-3.5" />
            <span>{t('budget.tabBudgets', lang)}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('recurring')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'recurring'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{t('budget.tabRecurring', lang)}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('reminders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'reminders'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>{t('budget.tabReminders', lang)}</span>
          </button>
        </div>
      </div>

      {/* 1. Category Budgets Tab */}
      {activeSubTab === 'budgets' && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400">{t('budget.totalBudget', lang)}</span>
              <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                {formatCurrency(totalBudget, lang)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t('budget.totalSpent', lang)}: <strong className="text-rose-400">{formatCurrency(totalSpent, lang)}</strong> • {t('budget.remaining', lang)}:{' '}
                <strong className={totalBudget - totalSpent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {formatCurrency(Math.max(0, totalBudget - totalSpent), lang)}
                </strong>
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-semibold text-slate-400">{lang === 'bn' ? 'সামগ্রিক বাজেট ব্যবহার' : 'Overall Usage'}</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {totalBudget > 0 ? formatNumber(Math.round((totalSpent / totalBudget) * 100), lang) : 0}%
              </p>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories
              .filter((c) => c.type === 'expense')
              .map((cat) => {
                const stat = categoryStats.find((s) => s.categoryId === cat.id);
                const spent = stat ? stat.spent : 0;
                const budgetObj = budgets.find((b) => b.categoryId === cat.id);
                const limit = budgetObj?.monthlyLimit || 0;
                const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                const isOver = limit > 0 && spent > limit;
                const isNear = limit > 0 && percentage >= 80 && !isOver;

                return (
                  <div
                    key={cat.id}
                    className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-10 w-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-inner"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            ৳
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-tight">
                              {getCategoryName(cat, lang)}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {lang === 'bn' ? 'খরচ হয়েছে:' : 'Spent:'} {formatCurrency(spent, lang)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setEditingCategoryId(cat.id);
                            setBudgetLimitStr(limit ? String(limit) : '');
                          }}
                          className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className={isOver ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-slate-400'}>
                            {limit > 0 ? `${formatNumber(Math.round(percentage), lang)}%` : lang === 'bn' ? 'বাজেট নির্ধারণ করা নেই' : 'No limit set'}
                          </span>
                          <span className="text-slate-300">{formatCurrency(limit, lang)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOver ? 'bg-rose-500' : isNear ? 'bg-amber-400' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inline Edit Form */}
                    {editingCategoryId === cat.id && (
                      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
                        <input
                          type="text"
                          value={budgetLimitStr}
                          onChange={(e) => setBudgetLimitStr(e.target.value)}
                          placeholder="মাসিক লিমিট (টাকা)"
                          className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveBudget(cat.id)}
                          className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingCategoryId(null)}
                          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 2. Recurring Expenses Tab */}
      {activeSubTab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-400" />
              <span>{t('budget.tabRecurring', lang)}</span>
            </h3>
            <button
              onClick={() => setIsAddRecurringOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('budget.addRecurring', lang)}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurringExpenses.map((rec) => {
              const cat = catMap.get(rec.categoryId);
              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {rec.frequency.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xl font-black text-rose-400 mt-2">
                      {formatCurrency(rec.amount, lang)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t('budget.dueDay', lang)}: <strong>{formatNumber(rec.dueDay, lang)} {lang === 'bn' ? 'তারিখ' : 'th of month'}</strong> • {getCategoryName(cat, lang)}
                    </p>
                  </div>

                  <button
                    onClick={() => onPayRecurring(rec)}
                    className="mt-4 w-full py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{t('budget.markPaid', lang)}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Bills & Reminders Tab */}
      {activeSubTab === 'reminders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <span>{t('budget.tabReminders', lang)}</span>
            </h3>
            <button
              onClick={() => setIsAddReminderOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('budget.addReminder', lang)}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reminders.map((rem) => {
              const isPaid = rem.status === 'paid';
              return (
                <div
                  key={rem.id}
                  className={`p-5 rounded-3xl border shadow-xl flex flex-col justify-between ${
                    isPaid
                      ? 'border-slate-800/40 bg-slate-950/40 opacity-70'
                      : 'border-slate-800 bg-slate-900/90'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white truncate">{rem.title}</h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {rem.status}
                      </span>
                    </div>

                    <p className="text-xl font-black text-amber-400 mt-2">
                      {formatCurrency(rem.amount, lang)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>{formatRelativeDate(rem.dueDate, lang)} ({formatDate(rem.dueDate, lang)})</span>
                    </p>
                  </div>

                  {!isPaid && (
                    <button
                      onClick={() => onFulfillReminder(rem)}
                      className="mt-4 w-full py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{t('budget.markPaid', lang)}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Recurring Modal */}
      {isAddRecurringOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">{t('budget.addRecurring', lang)}</h3>
              <button onClick={() => setIsAddRecurringOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecurring} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'খরচের নাম' : 'Title'}
                </label>
                <input
                  type="text"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="যেমন: বাসা ভাড়া, ওয়াইফাই বিল"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}
                </label>
                <input
                  type="text"
                  value={recAmountStr}
                  onChange={(e) => setRecAmountStr(e.target.value)}
                  placeholder="৫০০০"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                  </label>
                  <select
                    value={recCategoryId}
                    onChange={(e) => setRecCategoryId(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getCategoryName(c, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    {t('budget.dueDay', lang)}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={recDueDay}
                    onChange={(e) => setRecDueDay(Number(e.target.value))}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRecurringOpen(false)}
                  className="w-1/2 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  {t('action.cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  {t('action.save', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {isAddReminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">{t('budget.addReminder', lang)}</h3>
              <button onClick={() => setIsAddReminderOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'রিমাইন্ডারের শিরোনাম' : 'Reminder Title'}
                </label>
                <input
                  type="text"
                  value={remTitle}
                  onChange={(e) => setRemTitle(e.target.value)}
                  placeholder="যেমন: ক্রেডিট কার্ড বিল পরিশোধ"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    {lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}
                  </label>
                  <input
                    type="text"
                    value={remAmountStr}
                    onChange={(e) => setRemAmountStr(e.target.value)}
                    placeholder="৩০০০"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    {lang === 'bn' ? 'পরিশোধের শেষ তারিখ' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={remDueDate}
                    onChange={(e) => setRemDueDate(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddReminderOpen(false)}
                  className="w-1/2 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  {t('action.cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  {t('action.save', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
