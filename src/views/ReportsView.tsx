import React, { useState } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Transaction, Category, Account, Person, FinancialHealthMetrics, MonthlyCategoryStats } from '../types';
import {
  formatCurrency,
  formatNumber,
  getCategoryName,
  getAccountName,
  Language,
  t,
} from '../i18n';
import { exportToExcel, exportToCSV, exportMonthlyPDF } from '../services/exportService';

interface ReportsViewProps {
  metrics: FinancialHealthMetrics;
  categoryStats: MonthlyCategoryStats[];
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  people: Person[];
  lang?: Language;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#F43F5E', '#6366F1'];

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  categoryStats,
  transactions,
  categories,
  accounts,
  people,
  lang = 'bn',
}) => {
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);

  const safeTx = Array.isArray(transactions) ? transactions : [];
  const safeCats = Array.isArray(categories) ? categories : [];
  const safeAccs = Array.isArray(accounts) ? accounts : [];
  const safePeople = Array.isArray(people) ? people : [];
  const safeCatStats = Array.isArray(categoryStats) ? categoryStats : [];

  // Month-filtered transactions
  const monthTransactions = safeTx.filter((t) => t && t.date && t.date.startsWith(selectedMonth));

  // Category breakdown for charts
  const catSpendingMap = new Map<string, number>();
  let totalMonthExpense = 0;
  let totalMonthIncome = 0;

  for (const tx of monthTransactions) {
    if (tx.type === 'expense' || tx.type === 'credit_purchase') {
      totalMonthExpense += tx.amount;
      const catId = tx.categoryId || 'other';
      catSpendingMap.set(catId, (catSpendingMap.get(catId) || 0) + tx.amount);
    } else if (tx.type === 'income') {
      totalMonthIncome += tx.amount;
    }
  }

  const pieData = Array.from(catSpendingMap.entries())
    .map(([catId, amount], idx) => {
      const cat = categories.find((c) => c.id === catId);
      const name = cat ? getCategoryName(cat, lang) : (lang === 'bn' ? 'অন্যান্য' : 'Other');
      const pct = totalMonthExpense > 0 ? (amount / totalMonthExpense) * 100 : 0;
      return {
        name,
        value: amount,
        percentage: pct,
        color: cat?.color || COLORS[idx % COLORS.length],
      };
    })
    .sort((a, b) => b.value - a.value);

  // Account spending breakdown
  const accountSpendingMap = new Map<string, number>();
  for (const t of monthTransactions) {
    if (t.type === 'expense' || t.type === 'credit_purchase') {
      const acc = accounts.find((a) => a.id === t.accountId);
      const accName = acc ? getAccountName(acc, lang) : 'Account';
      accountSpendingMap.set(accName, (accountSpendingMap.get(accName) || 0) + t.amount);
    }
  }

  const accountBarData = Array.from(accountSpendingMap.entries()).map(([name, amount]) => ({
    name,
    amount,
  }));

  const monthSavings = totalMonthIncome - totalMonthExpense;
  const savingsRate = totalMonthIncome > 0 ? Math.max(0, (monthSavings / totalMonthIncome) * 100) : 0;

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header & Export controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('rep.title', lang)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t('rep.subtitle', lang)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
          />

          {/* Export to Excel */}
          <button
            onClick={() => exportToExcel(monthTransactions, categories, accounts, people)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Excel</span>
          </button>

          {/* Export to PDF */}
          <button
            onClick={() => exportMonthlyPDF(selectedMonth, metrics, monthTransactions, categories, accounts)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t('rep.exportPdf', lang)}</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">{t('dash.monthIncome', lang)}</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2">
            {formatCurrency(totalMonthIncome, lang)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {selectedMonth} {lang === 'bn' ? 'মাসের মোট অর্জিত আয়' : 'Total monthly income'}
          </p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">{t('dash.monthExpense', lang)}</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
            {formatCurrency(totalMonthExpense, lang)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {selectedMonth} {lang === 'bn' ? 'মাসের মোট মোট ব্যয়' : 'Total monthly expenditure'}
          </p>
        </div>

        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <span className="text-xs font-semibold text-slate-400">{t('dash.monthSavings', lang)}</span>
          <p className={`text-2xl sm:text-3xl font-black mt-2 ${monthSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(monthSavings, lang, { showSign: true })}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('dash.savingsRate', lang)}: <strong className="text-white">{formatNumber(Math.round(savingsRate), lang)}%</strong>
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <PieIcon className="h-4 w-4 text-emerald-400" />
              <span>{t('rep.categoryBreakdown', lang)}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {lang === 'bn' ? 'ক্যাটাগরি ভিত্তিক খরচের শতকরা বিভাজন' : 'Expense distribution by category'}
            </p>

            {pieData.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                {t('dash.noTransactions', lang)}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="h-56 w-56 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [formatCurrency(Number(val) || 0, lang), '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2 w-full max-h-56 overflow-y-auto pr-1">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 truncate">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-white">{formatCurrency(item.value, lang)}</span>
                        <span className="text-[10px] text-slate-500 ml-1">({formatNumber(Math.round(item.percentage), lang)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Spending Bar Chart */}
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span>{t('rep.accountBreakdown', lang)}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {lang === 'bn' ? 'কোন অ্যাকাউন্ট থেকে কত টাকা ব্যয় হয়েছে' : 'Total expenses from each account'}
            </p>

            {accountBarData.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                {t('dash.noTransactions', lang)}
              </div>
            ) : (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accountBarData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val) || 0, lang), 'খরচ']}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
