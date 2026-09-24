import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Transaction, Category } from '../types';
import { formatCurrency, formatNumber, Language, t } from '../i18n';

interface DailySpending30DaysChartProps {
  transactions: Transaction[];
  categories?: Category[];
  lang?: Language;
}

export const DailySpending30DaysChart: React.FC<DailySpending30DaysChartProps> = ({
  transactions = [],
  categories = [],
  lang = 'bn',
}) => {
  const [viewMode, setViewMode] = useState<'expense' | 'both'>('expense');

  // Compute 30 days data
  const { chartData, metrics, peakDay, topCategories30Days } = useMemo(() => {
    const now = new Date();
    const daysList: {
      dateStr: string;
      label: string;
      fullDateStr: string;
      expense: number;
      income: number;
      net: number;
      txCount: number;
      categoriesMap: Record<string, number>;
    }[] = [];

    let totalExpense = 0;
    let totalIncome = 0;
    let maxExpense = 0;
    let peakDayInfo = { dateStr: '', label: '', amount: 0 };
    const globalCatSpend: Record<string, number> = {};

    // Group transactions by date
    const txByDate: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      if (tx.status !== 'pending' && tx.date) {
        if (!txByDate[tx.date]) txByDate[tx.date] = [];
        txByDate[tx.date].push(tx);
      }
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dayNum = d.getDate();
      const monthNum = d.getMonth() + 1;

      const label =
        lang === 'bn'
          ? `${formatNumber(dayNum, 'bn')}/${formatNumber(monthNum, 'bn')}`
          : `${dayNum}/${monthNum}`;

      const fullDateStr = d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        day: 'numeric',
        month: 'short',
      });

      let dayExp = 0;
      let dayInc = 0;
      let count = 0;
      const dayCatMap: Record<string, number> = {};

      const dayTxs = txByDate[dateStr] || [];
      dayTxs.forEach((tx) => {
        count++;
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'expense' || tx.type === 'credit_purchase') {
          dayExp += amt;
          if (tx.categoryId) {
            dayCatMap[tx.categoryId] = (dayCatMap[tx.categoryId] || 0) + amt;
            globalCatSpend[tx.categoryId] = (globalCatSpend[tx.categoryId] || 0) + amt;
          }
        } else if (tx.type === 'income') {
          dayInc += amt;
        } else if (tx.type === 'refund') {
          dayExp = Math.max(0, dayExp - amt);
        }
      });

      totalExpense += dayExp;
      totalIncome += dayInc;

      if (dayExp > maxExpense) {
        maxExpense = dayExp;
        peakDayInfo = {
          dateStr,
          label: fullDateStr,
          amount: dayExp,
        };
      }

      daysList.push({
        dateStr,
        label,
        fullDateStr,
        expense: dayExp,
        income: dayInc,
        net: dayInc - dayExp,
        txCount: count,
        categoriesMap: dayCatMap,
      });
    }

    const avgDailyExpense = Math.round(totalExpense / 30);

    // Map top 3 categories in 30 days
    const catMap = new Map(categories.map((c) => [c.id, c]));
    const topCats = Object.entries(globalCatSpend)
      .map(([catId, amount]) => {
        const cat = catMap.get(catId);
        return {
          id: catId,
          name: lang === 'bn' ? cat?.nameBn || cat?.name || 'অন্যান্য' : cat?.name || 'Other',
          amount,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    return {
      chartData: daysList,
      metrics: {
        totalExpense,
        totalIncome,
        avgDailyExpense,
        netSavings: totalIncome - totalExpense,
      },
      peakDay: peakDayInfo,
      topCategories30Days: topCats,
    };
  }, [transactions, categories, lang]);

  // Category map for tooltip
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {lang === 'bn' ? 'গত ৩০ দিনের দৈনিক ব্যয়ের ট্রেন্ড' : 'Daily Spending Trend (Last 30 Days)'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'bn'
              ? 'দৈনিক খরচের ওঠা-নামা, সর্বোচ্চ ব্যয়ের দিন এবং গড়ে কত টাকা খরচ হচ্ছে তার স্পষ্ট বিশ্লেষণ'
              : 'Day-by-day expense fluctuation, peak spending spikes, and daily run-rate insights'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode('expense')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              viewMode === 'expense'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'শুধু ব্যয় লাইন' : 'Expense Only'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              viewMode === 'both'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lang === 'bn' ? 'আয় ও ব্যয়' : 'Income & Expense'}
          </button>
        </div>
      </div>

      {/* Quick Insight KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total 30-Day Expense */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? '৩০ দিনের মোট ব্যয়' : '30-Day Total Expense'}
          </span>
          <span className="text-base sm:text-lg font-black text-rose-400 mt-0.5 block">
            {formatCurrency(metrics.totalExpense, lang)}
          </span>
        </div>

        {/* Daily Average Expense */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'দৈনিক গড় ব্যয়' : 'Daily Average Run-Rate'}
          </span>
          <span className="text-base sm:text-lg font-black text-amber-400 mt-0.5 block">
            {formatCurrency(metrics.avgDailyExpense, lang)}
            <span className="text-[10px] font-normal text-slate-500 ml-1">
              /{lang === 'bn' ? 'দিন' : 'day'}
            </span>
          </span>
        </div>

        {/* Peak Expense Day */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'সর্বোচ্চ ব্যয়ের দিন' : 'Highest Spending Peak'}
          </span>
          <div className="mt-0.5 flex items-baseline gap-1.5 truncate">
            <span className="text-base sm:text-lg font-black text-rose-300">
              {formatCurrency(peakDay.amount, lang)}
            </span>
            {peakDay.label && (
              <span className="text-[10px] font-medium text-slate-400 truncate">
                ({peakDay.label})
              </span>
            )}
          </div>
        </div>

        {/* 30-Day Net Balance */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? '৩০ দিনের নিট সঞ্চয়' : '30-Day Net Balance'}
          </span>
          <span
            className={`text-base sm:text-lg font-black mt-0.5 block ${
              metrics.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(metrics.netSavings, lang, { showSign: true })}
          </span>
        </div>
      </div>

      {/* Recharts Line Chart */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 12, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval={Math.ceil(chartData.length / 8)}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              tickFormatter={(val) => {
                if (val >= 1000) return `${Math.round(val / 1000)}k`;
                return `${val}`;
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-2xl border border-slate-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[170px]">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span className="font-bold text-white flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>{data.fullDateStr}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatNumber(data.txCount, lang)} {lang === 'bn' ? 'টি লেনদেন' : 'tx'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-rose-400 font-bold">
                        <span>{lang === 'bn' ? 'দৈনিক ব্যয়:' : 'Daily Expense:'}</span>
                        <span>{formatCurrency(data.expense, lang)}</span>
                      </div>

                      {viewMode === 'both' && (
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>{lang === 'bn' ? 'দৈনিক আয়:' : 'Daily Income:'}</span>
                          <span>{formatCurrency(data.income, lang)}</span>
                        </div>
                      )}
                    </div>

                    {/* Breakdown of categories on that day */}
                    {Object.keys(data.categoriesMap || {}).length > 0 && (
                      <div className="pt-1.5 border-t border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {lang === 'bn' ? 'সেকশন ভিত্তিক খরচ:' : 'Sections:'}
                        </span>
                        {Object.entries(data.categoriesMap)
                          .slice(0, 3)
                          .map(([catId, amount]) => {
                            const cat = catMap.get(catId);
                            const name = lang === 'bn' ? cat?.nameBn || cat?.name || 'অন্যান্য' : cat?.name || 'Other';
                            return (
                              <div key={catId} className="flex items-center justify-between text-[11px] text-slate-300">
                                <span className="truncate max-w-[100px]">{name}</span>
                                <span className="font-semibold text-rose-300">
                                  {formatCurrency(Number(amount), lang)}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Average Reference Line */}
            {metrics.avgDailyExpense > 0 && (
              <ReferenceLine
                y={metrics.avgDailyExpense}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
            )}

            {/* Main Daily Expense Line */}
            <Line
              type="monotone"
              dataKey="expense"
              name={lang === 'bn' ? 'দৈনিক ব্যয়' : 'Expense'}
              stroke="#f43f5e"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
            />

            {/* Optional Income Line */}
            {viewMode === 'both' && (
              <Line
                type="monotone"
                dataKey="income"
                name={lang === 'bn' ? 'দৈনিক আয়' : 'Income'}
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Average Marker Note */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
            <span className="h-2 w-2 rounded-full bg-rose-500"></span>
            <span>{lang === 'bn' ? 'দৈনিক ব্যয় (Expense)' : 'Daily Spending'}</span>
          </span>
          {viewMode === 'both' && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>{lang === 'bn' ? 'দৈনিক আয় (Income)' : 'Daily Income'}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 text-amber-400/80">
            <span className="h-0.5 w-3 bg-amber-400"></span>
            <span>
              {lang === 'bn' ? 'গড় ব্যয়:' : 'Average:'} {formatCurrency(metrics.avgDailyExpense, lang)}
            </span>
          </span>
        </div>

        {topCategories30Days.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{lang === 'bn' ? 'শীর্ষ খাত:' : 'Top sections:'}</span>
            {topCategories30Days.map((c) => (
              <span
                key={c.id}
                className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-300"
              >
                {c.name}: {formatCurrency(c.amount, lang)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
