import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
  Receipt,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Transaction, Category, Account } from '../types';
import { formatCurrency, formatNumber, Language, t } from '../i18n';

interface CalendarSpendingViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  lang?: Language;
  onOpenAddModal?: (initial?: Partial<Transaction>) => void;
  onEditTx?: (tx: Transaction) => void;
}

export const CalendarSpendingView: React.FC<CalendarSpendingViewProps> = ({
  transactions = [],
  categories = [],
  accounts = [],
  lang = 'bn',
  onOpenAddModal,
  onEditTx,
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayDateStr, setSelectedDayDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Group transactions for the current month by YYYY-MM-DD
  const { monthTransactionsByDate, monthStats } = useMemo(() => {
    const byDate: Record<
      string,
      {
        totalExpense: number;
        totalIncome: number;
        categoriesMap: Record<string, number>;
        txs: Transaction[];
      }
    > = {};

    let totalMonthExpense = 0;
    let totalMonthIncome = 0;
    let activeSpendingDays = 0;

    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    transactions.forEach((tx) => {
      if (tx.status !== 'pending' && tx.date && tx.date.startsWith(monthPrefix)) {
        if (!byDate[tx.date]) {
          byDate[tx.date] = {
            totalExpense: 0,
            totalIncome: 0,
            categoriesMap: {},
            txs: [],
          };
        }

        byDate[tx.date].txs.push(tx);
        const amt = Number(tx.amount) || 0;

        if (tx.type === 'expense' || tx.type === 'credit_purchase') {
          byDate[tx.date].totalExpense += amt;
          totalMonthExpense += amt;
          if (tx.categoryId) {
            byDate[tx.date].categoriesMap[tx.categoryId] =
              (byDate[tx.date].categoriesMap[tx.categoryId] || 0) + amt;
          }
        } else if (tx.type === 'income') {
          byDate[tx.date].totalIncome += amt;
          totalMonthIncome += amt;
        } else if (tx.type === 'refund') {
          byDate[tx.date].totalExpense = Math.max(0, byDate[tx.date].totalExpense - amt);
          totalMonthExpense = Math.max(0, totalMonthExpense - amt);
        }
      }
    });

    Object.values(byDate).forEach((day) => {
      if (day.totalExpense > 0) activeSpendingDays++;
    });

    return {
      monthTransactionsByDate: byDate,
      monthStats: {
        totalExpense: totalMonthExpense,
        totalIncome: totalMonthIncome,
        activeSpendingDays,
        net: totalMonthIncome - totalMonthExpense,
      },
    };
  }, [transactions, year, month]);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayDateStr(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayDateStr(null);
  };

  const setThisMonth = () => {
    setCurrentDate(new Date());
    setSelectedDayDateStr(null);
  };

  // Calendar cells generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = totalDaysInPrevMonth - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month filler days to complete grid (42 cells or 35 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month]);

  // Bengali Month & Weekday labels
  const monthNamesBn = [
    'জানুয়ারি',
    'ফেব্রুয়ারি',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
  ];
  const monthName =
    lang === 'bn'
      ? `${monthNamesBn[month]} ${formatNumber(year, 'bn')}`
      : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const weekDayLabels =
    lang === 'bn'
      ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Detail view for selected day
  const selectedDayData = selectedDayDateStr
    ? monthTransactionsByDate[selectedDayDateStr] || {
        totalExpense: 0,
        totalIncome: 0,
        categoriesMap: {},
        txs: [],
      }
    : null;

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-6 shadow-xl space-y-5">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {lang === 'bn' ? 'ক্যালেন্ডার ভিউ: কোন দিন কোন সেকশনে খরচ' : 'Daily Calendar: Spending by Section'}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'bn'
              ? 'ক্যালেন্ডারের তারিখে ক্লিক করে প্রতিদিনের সেকশন ভিত্তিক খরচ, আয় ও বিস্তারিত ভাউচার দেখুন'
              : 'Click any day in the calendar to inspect daily section breakdowns, vouchers, and transactions'}
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="text-xs sm:text-sm font-bold text-slate-200 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 min-w-[130px] text-center">
            {monthName}
          </span>

          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={setThisMonth}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 transition-all"
          >
            {lang === 'bn' ? 'চলতি মাস' : 'Current'}
          </button>
        </div>
      </div>

      {/* Month Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'এ মাসের মোট ব্যয়' : 'Month Expense'}
          </span>
          <span className="text-sm sm:text-base font-black text-rose-400 mt-0.5 block">
            {formatCurrency(monthStats.totalExpense, lang)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'এ মাসের মোট আয়' : 'Month Income'}
          </span>
          <span className="text-sm sm:text-base font-black text-emerald-400 mt-0.5 block">
            {formatCurrency(monthStats.totalIncome, lang)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'খরচ হয়েছে কত দিন' : 'Spending Days'}
          </span>
          <span className="text-sm sm:text-base font-black text-amber-400 mt-0.5 block">
            {formatNumber(monthStats.activeSpendingDays, lang)} {lang === 'bn' ? 'দিন' : 'days'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 block">
            {lang === 'bn' ? 'চলতি নিট সঞ্চয়' : 'Month Net Savings'}
          </span>
          <span
            className={`text-sm sm:text-base font-black mt-0.5 block ${
              monthStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(monthStats.net, lang, { showSign: true })}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/50">
        {/* Weekday Header */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/90 text-center py-2 text-xs font-bold text-slate-400">
          {weekDayLabels.map((lbl, idx) => (
            <div
              key={lbl}
              className={`${idx === 5 || idx === 6 ? 'text-amber-400/80' : 'text-slate-400'}`}
            >
              {lbl}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/60 text-xs">
          {calendarDays.map((d) => {
            const dayData = monthTransactionsByDate[d.dateStr];
            const hasExpense = dayData && dayData.totalExpense > 0;
            const hasIncome = dayData && dayData.totalIncome > 0;
            const isSelected = selectedDayDateStr === d.dateStr;

            // Get top category spent on this day
            const catEntries = dayData ? Object.entries(dayData.categoriesMap) : [];
            const topCategory =
              catEntries.length > 0
                ? catEntries.sort((a, b) => Number(b[1]) - Number(a[1]))[0]
                : null;
            const topCatObj = topCategory ? catMap.get(topCategory[0]) : null;

            return (
              <div
                key={d.dateStr}
                onClick={() => {
                  if (d.isCurrentMonth) {
                    setSelectedDayDateStr(isSelected ? null : d.dateStr);
                  }
                }}
                className={`min-h-[78px] sm:min-h-[92px] p-1.5 sm:p-2 flex flex-col justify-between transition-all cursor-pointer relative group ${
                  !d.isCurrentMonth
                    ? 'opacity-25 bg-slate-950/20 cursor-default pointer-events-none'
                    : isSelected
                    ? 'bg-emerald-500/10 ring-2 ring-emerald-400 z-10'
                    : d.isToday
                    ? 'bg-blue-500/5 hover:bg-slate-800/60'
                    : 'bg-slate-950/40 hover:bg-slate-800/40'
                }`}
              >
                {/* Date header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      d.isToday
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : isSelected
                        ? 'bg-white text-slate-950'
                        : 'text-slate-300'
                    }`}
                  >
                    {formatNumber(d.dayNumber, lang)}
                  </span>

                  {/* Badges for income/tx count */}
                  <div className="flex items-center gap-1">
                    {hasIncome && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                        title={lang === 'bn' ? 'আয় হয়েছে' : 'Income received'}
                      ></span>
                    )}
                    {dayData && dayData.txs.length > 0 && (
                      <span className="text-[9px] text-slate-500 hidden sm:inline">
                        {formatNumber(dayData.txs.length, lang)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Expense Amount & Section Chips */}
                <div className="mt-1 space-y-0.5">
                  {hasExpense ? (
                    <>
                      <p className="text-[11px] sm:text-xs font-black text-rose-400 leading-tight truncate">
                        {formatCurrency(dayData.totalExpense, lang)}
                      </p>

                      {/* Top Category Section Badge */}
                      {topCatObj && (
                        <div
                          className="px-1 py-0.5 rounded text-[9px] font-semibold truncate max-w-full flex items-center gap-0.5 border"
                          style={{
                            backgroundColor: `${topCatObj.color || '#f43f5e'}18`,
                            color: topCatObj.color || '#fb7185',
                            borderColor: `${topCatObj.color || '#f43f5e'}30`,
                          }}
                        >
                          <span className="truncate">
                            {lang === 'bn'
                              ? topCatObj.nameBn || topCatObj.name
                              : topCatObj.name}
                          </span>
                        </div>
                      )}

                      {/* More sections indicator if > 1 category */}
                      {catEntries.length > 1 && (
                        <span className="text-[9px] text-slate-500 font-medium block">
                          +{formatNumber(catEntries.length - 1, lang)}{' '}
                          {lang === 'bn' ? 'খাত' : 'more'}
                        </span>
                      )}
                    </>
                  ) : hasIncome ? (
                    <p className="text-[10px] font-bold text-emerald-400 leading-tight">
                      +{formatCurrency(dayData.totalIncome, lang)}
                    </p>
                  ) : (
                    <span className="text-[10px] text-slate-700 hidden sm:block">
                      {d.isCurrentMonth ? '-' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Drill-down Inspector */}
      {selectedDayDateStr && selectedDayData && (
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xs">
                {selectedDayDateStr.split('-')[2]}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {new Date(selectedDayDateStr).toLocaleDateString(
                    lang === 'bn' ? 'bn-BD' : 'en-US',
                    {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </h4>
                <div className="flex items-center gap-3 text-xs mt-0.5">
                  <span className="text-rose-400 font-semibold">
                    {lang === 'bn' ? 'মোট ব্যয়:' : 'Expense:'}{' '}
                    {formatCurrency(selectedDayData.totalExpense, lang)}
                  </span>
                  {selectedDayData.totalIncome > 0 && (
                    <span className="text-emerald-400 font-semibold">
                      {lang === 'bn' ? 'মোট আয়:' : 'Income:'}{' '}
                      {formatCurrency(selectedDayData.totalIncome, lang)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddModal && (
                <button
                  type="button"
                  onClick={() => onOpenAddModal({ date: selectedDayDateStr })}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {lang === 'bn' ? 'এই দিনে হিসাব যোগ' : 'Add Tx'}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDayDateStr(null)}
                className="p-1.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Section Wise Breakdown for this Selected Day */}
          {Object.keys(selectedDayData.categoriesMap).length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                <span>
                  {lang === 'bn' ? 'এই দিনের সেকশন/খাত ভিত্তিক খরচ:' : 'Sections spent today:'}
                </span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(selectedDayData.categoriesMap).map(([catId, amount]) => {
                  const cat = catMap.get(catId);
                  const name =
                    lang === 'bn' ? cat?.nameBn || cat?.name || 'অন্যান্য' : cat?.name || 'Other';
                  return (
                    <div
                      key={catId}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat?.color || '#f43f5e' }}
                        ></span>
                        <span className="text-xs text-slate-300 truncate">{name}</span>
                      </div>
                      <span className="text-xs font-bold text-rose-400 shrink-0">
                        {formatCurrency(Number(amount), lang)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transactions List for this day */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                {lang === 'bn' ? 'লেনদেনের তালিকা:' : 'Transactions:'} (
                {formatNumber(selectedDayData.txs.length, lang)})
              </span>
            </span>

            {selectedDayData.txs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                {lang === 'bn'
                  ? 'এই তারিখে কোনো সম্পন্ন লেনদেন নেই।'
                  : 'No transactions recorded on this day.'}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {selectedDayData.txs.map((tx) => {
                  const cat = tx.categoryId ? catMap.get(tx.categoryId) : null;
                  const acc = accMap.get(tx.accountId);
                  const isExp = tx.type === 'expense' || tx.type === 'credit_purchase';
                  const isInc = tx.type === 'income';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => onEditTx && onEditTx(tx)}
                      className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                          style={{
                            backgroundColor: `${cat?.color || '#64748b'}20`,
                            color: cat?.color || '#94a3b8',
                          }}
                        >
                          {cat?.icon || '💳'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {tx.description ||
                              (lang === 'bn'
                                ? cat?.nameBn || 'লেনদেন'
                                : cat?.name || 'Transaction')}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {acc && <span>{acc.nameBn || acc.name}</span>}
                            {tx.time && <span>• {tx.time}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-bold ${
                            isExp ? 'text-rose-400' : isInc ? 'text-emerald-400' : 'text-blue-400'
                          }`}
                        >
                          {isExp ? '-' : isInc ? '+' : ''}
                          {formatCurrency(tx.amount, lang)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
