import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Plus,
  Clock,
  Calendar,
  AlertCircle,
  CreditCard,
  Building2,
  Smartphone,
  ChevronRight,
  Receipt,
  CheckCircle2,
  ArrowRightLeft,
  Users,
  PieChart,
  BarChart3,
  ShieldCheck,
  Edit2,
  Trash2,
  Copy,
  LineChart as LineChartIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Account, Category, Person, Transaction, Reminder, FinancialHealthMetrics, PromotionConfig } from '../types';
import { AIInputBar } from '../components/AIInputBar';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { DailySpending30DaysChart } from '../components/DailySpending30DaysChart';
import { CalendarSpendingView } from '../components/CalendarSpendingView';
import { CustomDateRangeSearch } from '../components/CustomDateRangeSearch';
import { PromotionBanner } from '../components/PromotionBanner';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeDate,
  getCategoryName,
  getAccountName,
  getTransactionTypeName,
  Language,
  t,
} from '../i18n';

interface HomeViewProps {
  metrics: FinancialHealthMetrics;
  accounts: Account[];
  categories: Category[];
  people: Person[];
  transactions?: Transaction[];
  recentTransactions?: Transaction[];
  reminders: Reminder[];
  budgets?: any[];
  categoryStats?: any;
  onParsePrompt: (prompt: string) => Promise<void>;
  isLoadingAI: boolean;
  onOpenAddModal: (initial?: Partial<Transaction>) => void;
  onOpenEditModal?: (tx: Transaction) => void;
  onEditTx?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
  onDeleteTx?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicateTx?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onFulfillReminder?: (rem: Reminder) => void;
  onNavigate: (tab: any) => void;
  lang?: Language;
  onAskQuestion?: (q: string) => void;
  promotionConfig?: PromotionConfig;
  onOpenPromotionSettings?: () => void;
  onRecordPromotionClick?: () => void;
  onRecordPromotionImpression?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  metrics,
  accounts,
  categories,
  people,
  transactions,
  recentTransactions: propRecentTx,
  reminders,
  onParsePrompt,
  isLoadingAI,
  onOpenAddModal,
  onOpenEditModal,
  onEditTx,
  onEdit,
  onDeleteTx,
  onDelete,
  onDuplicateTx,
  onDuplicate,
  onFulfillReminder,
  onNavigate,
  lang = 'bn',
  onAskQuestion,
  promotionConfig,
  onOpenPromotionSettings,
  onRecordPromotionClick,
  onRecordPromotionImpression,
}) => {
  const handleEdit = onOpenEditModal || onEditTx || onEdit || (() => {});
  const handleDelete = onDeleteTx || onDelete || (() => {});
  const handleDuplicate = onDuplicateTx || onDuplicate || (() => {});

  const allTx = Array.isArray(transactions)
    ? transactions
    : Array.isArray(propRecentTx)
    ? propRecentTx
    : [];
  const safeTx = allTx;
  const safeCats = Array.isArray(categories) ? categories : [];
  const safeAccs = Array.isArray(accounts) ? accounts : [];
  const safePeople = Array.isArray(people) ? people : [];
  const safeReminders = Array.isArray(reminders) ? reminders : [];
  const [deletingTx, setDeletingTx] = React.useState<Transaction | null>(null);
  const [insightTab, setInsightTab] = React.useState<'trend_30' | 'calendar' | 'custom_search'>('trend_30');

  const catMap = new Map<string, Category>(safeCats.map((c) => [c.id, c]));
  const accMap = new Map<string, Account>(safeAccs.map((a) => [a.id, a]));
  const personMap = new Map<string, Person>(safePeople.map((p) => [p.id, p]));

  // 7 days trend chart data
  const chartData = prepareLast7DaysData(safeTx, lang);

  // Filter pending reminders
  const pendingReminders = safeReminders.filter((r) => r.status === 'pending').slice(0, 3);

  // Recent completed/active transactions
  const recentTransactions = [...safeTx]
    .filter((t) => t.status !== 'pending')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 8);

  const safeMetrics = metrics || {
    totalCash: 0,
    totalBank: 0,
    totalMobileWallet: 0,
    todayExpense: 0,
    todayIncome: 0,
    monthSavings: 0,
    savingsRate: 0,
    netWorth: 0,
    totalReceivable: 0,
    totalPayable: 0,
    monthExpense: 0,
    monthIncome: 0,
    totalCreditOutstanding: 0,
  };

  const totalCashBank = (safeMetrics.totalCash || 0) + (safeMetrics.totalBank || 0) + (safeMetrics.totalMobileWallet || 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto animate-fade-in">
      {/* 0. Website Promotion Banner (হোমস্ক্রিনের উপরে ব্যানার প্রদর্শন) */}
      {promotionConfig && promotionConfig.enabled && (
        <section className="animate-fade-in">
          <PromotionBanner
            config={promotionConfig}
            onOpenSettings={onOpenPromotionSettings}
            onRecordClick={onRecordPromotionClick}
            onRecordImpression={onRecordPromotionImpression}
            lang={lang}
          />
        </section>
      )}

      {/* 1. Top AI Natural Language & Voice Input Box */}
      <section>
        <AIInputBar
          onParsePrompt={onParsePrompt}
          isLoading={isLoadingAI}
          lang={lang}
          onAskQuestion={onAskQuestion}
        />
      </section>

      {/* 2. Today's Key Metrics Bar */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Expense */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {t('dash.todayExpense', lang)}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
              {formatCurrency(safeMetrics.todayExpense || 0, lang)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('dash.todayIncome', lang)}:</span>
            <span className="text-emerald-400 font-semibold">{formatCurrency(safeMetrics.todayIncome || 0, lang)}</span>
          </div>
        </div>

        {/* Monthly Net Savings */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {t('dash.monthSavings', lang)}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xl sm:text-2xl font-black tracking-tight ${(safeMetrics.monthSavings || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(safeMetrics.monthSavings || 0, lang, { showSign: true })}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('dash.savingsRate', lang)}:</span>
            <span className="text-emerald-400 font-semibold">{formatNumber(Math.round(safeMetrics.savingsRate || 0), lang)}%</span>
          </div>
        </div>

        {/* Liquid Balances (Cash + Bank + Wallets) */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {t('dash.totalAssets', lang)}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-blue-300 tracking-tight">
              {formatCurrency(totalCashBank, lang)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('dash.netWorth', lang)}:</span>
            <span className="text-emerald-400 font-semibold">{formatCurrency(safeMetrics.netWorth || 0, lang)}</span>
          </div>
        </div>

        {/* Total Receivables (Paona) */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {t('dash.totalReceivable', lang)}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
              {formatCurrency(safeMetrics.totalReceivable || 0, lang)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t('dash.totalPayable', lang)}:</span>
            <span className="text-rose-400 font-semibold">{formatCurrency(safeMetrics.totalPayable || 0, lang)}</span>
          </div>
        </div>
      </section>

      {/* 3. Account Wallets & Balances Row */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-400" />
            <span>{t('acc.title', lang)}</span>
          </h3>
          <button
            onClick={() => onNavigate('accounts')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>{t('action.viewAll', lang)}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {accounts.map((acc) => {
            const isCard = acc.type === 'credit_card';
            return (
              <div
                key={acc.id}
                onClick={() => onNavigate('accounts')}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="h-7 w-7 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                  >
                    {getAccountIcon(acc.type)}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {acc.type.toUpperCase()}
                  </span>
                </div>
                <div className="mt-2.5">
                  <p className="text-xs font-medium text-slate-400 truncate">{getAccountName(acc, lang)}</p>
                  <p className={`text-sm font-bold mt-0.5 ${isCard ? 'text-amber-400' : 'text-slate-100'}`}>
                    {formatCurrency(acc.balance, lang)}
                  </p>
                  {isCard && acc.availableCredit !== undefined && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {lang === 'bn' ? 'লিমিট:' : 'Limit:'} {formatCurrency(acc.availableCredit, lang)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Financial Insights Hub: 30-Day Line Chart, Calendar Spending, & Custom Date Range Search */}
      <section className="space-y-4">
        {/* Hub Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400 ml-1" />
            <span className="text-xs sm:text-sm font-bold text-white">
              {lang === 'bn' ? 'আর্থিক বিশ্লেষণ ও অন্তর্দৃষ্টি:' : 'Financial Insights & Analytics:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-xs">
            <button
              type="button"
              onClick={() => setInsightTab('trend_30')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                insightTab === 'trend_30'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LineChartIcon className="h-3.5 w-3.5" />
              <span>{lang === 'bn' ? '৩০ দিনের ট্রেন্ড' : '30-Day Trend'}</span>
            </button>

            <button
              type="button"
              onClick={() => setInsightTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                insightTab === 'calendar'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>{lang === 'bn' ? 'ক্যালেন্ডার ভিউ' : 'Calendar View'}</span>
            </button>

            <button
              type="button"
              onClick={() => setInsightTab('custom_search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                insightTab === 'custom_search'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{lang === 'bn' ? '১-৫ তারিখ ও কাস্টম ফিল্টার' : '1-5 Date & Custom'}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {insightTab === 'trend_30' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DailySpending30DaysChart
                transactions={safeTx}
                categories={safeCats}
                lang={lang}
              />
            </div>
            {/* Upcoming Bills & Reminders Card alongside */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>{t('dash.pendingReminders', lang)}</span>
                  </h3>
                  <button
                    onClick={() => onNavigate('budget')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>{t('action.viewAll', lang)}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {pendingReminders.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                      <p className="text-xs font-medium text-slate-300">{t('dash.noReminders', lang)}</p>
                    </div>
                  ) : (
                    pendingReminders.map((rem) => (
                      <div
                        key={rem.id}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{rem.title}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3 text-slate-500" />
                            <span>{formatRelativeDate(rem.dueDate, lang)}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-amber-400">{formatCurrency(rem.amount, lang)}</p>
                          <button
                            onClick={() => onFulfillReminder(rem)}
                            className="mt-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all"
                          >
                            {t('budget.markPaid', lang)}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>{lang === 'bn' ? 'বাজেট ভিউ' : 'Budget & Bills'}:</span>
                <button
                  onClick={() => onNavigate('budget')}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  {lang === 'bn' ? 'বাজেট সীমা দেখুন' : 'Manage Budgets'}
                </button>
              </div>
            </div>
          </div>
        )}

        {insightTab === 'calendar' && (
          <CalendarSpendingView
            transactions={safeTx}
            categories={safeCats}
            accounts={safeAccs}
            lang={lang}
            onOpenAddModal={onOpenAddModal}
            onEditTx={handleEdit}
          />
        )}

        {insightTab === 'custom_search' && (
          <CustomDateRangeSearch
            transactions={safeTx}
            categories={safeCats}
            accounts={safeAccs}
            lang={lang}
            onEditTx={handleEdit}
            onDeleteTx={handleDelete}
            onDuplicateTx={handleDuplicate}
          />
        )}
      </section>

      {/* 5. Recent Transactions List */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="h-4.5 w-4.5 text-emerald-400" />
              <span>{t('dash.recentTransactions', lang)}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'bn' ? 'সর্বশেষ এন্ট্রি ও ব্যালেন্স পরিবর্তনের তালিকা' : 'Latest financial entries and activity'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenAddModal()}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('nav.quickAdd', lang)}</span>
            </button>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all"
            >
              {t('action.viewAll', lang)}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Receipt className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium">{t('dash.noTransactions', lang)}</p>
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
              const acc = accMap.get(tx.accountId);
              const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : undefined;
              const person = tx.personId ? personMap.get(tx.personId) : undefined;

              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              const isMoneyGiven = tx.type === 'money_given';
              const isMoneyReceived = tx.type === 'money_received';
              const isExpense = tx.type === 'expense' || tx.type === 'credit_purchase';

              return (
                <div
                  key={tx.id}
                  onClick={() => handleEdit(tx)}
                  className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 cursor-pointer transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isMoneyGiven
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : isTransfer
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownRight className="h-5 w-5" />
                      ) : isMoneyGiven || isMoneyReceived ? (
                        <Users className="h-5 w-5" />
                      ) : isTransfer ? (
                        <ArrowRightLeft className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white truncate">{tx.description}</p>
                        {tx.confidenceScore && tx.confidenceScore >= 0.9 && (
                          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <Sparkles className="h-2.5 w-2.5" />
                            <span>AI</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span>{formatDate(tx.date, lang)}</span>
                        <span>•</span>
                        <span>{getAccountName(acc, lang)}</span>
                        {toAcc && <span>→ {getAccountName(toAcc, lang)}</span>}
                        {cat && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300 font-medium">{getCategoryName(cat, lang)}</span>
                          </>
                        )}
                        {person && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-medium">{person.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-sm sm:text-base font-bold ${
                          isIncome
                            ? 'text-emerald-400'
                            : isMoneyGiven
                            ? 'text-amber-400'
                            : isTransfer
                            ? 'text-blue-300'
                            : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(tx.amount, lang, { showSign: isIncome })}
                      </p>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        {getTransactionTypeName(tx.type, lang)}
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(tx);
                        }}
                        title={t('action.edit', lang)}
                        className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTx(tx);
                        }}
                        title={t('action.delete', lang)}
                        className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={() => {
          if (deletingTx) {
            handleDelete(deletingTx.id);
          }
        }}
        transaction={deletingTx}
        accounts={accounts}
        lang={lang}
      />
    </div>
  );
};

function getAccountIcon(type: string) {
  switch (type) {
    case 'cash':
      return <Wallet className="h-4 w-4" />;
    case 'bank':
    case 'debit_card':
      return <Building2 className="h-4 w-4" />;
    case 'credit_card':
      return <CreditCard className="h-4 w-4" />;
    case 'bkash':
    case 'nagad':
    case 'rocket':
    case 'upay':
      return <Smartphone className="h-4 w-4" />;
    default:
      return <Wallet className="h-4 w-4" />;
  }
}

function prepareLast7DaysData(transactions: Transaction[], lang: Language | string = 'bn') {
  const result: { date: string; income: number; expense: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const label =
      lang === 'bn'
        ? `${formatNumber(day, 'bn')}/${formatNumber(month, 'bn')}`
        : `${day}/${month}`;

    let inc = 0;
    let exp = 0;

    for (const tx of transactions) {
      if (tx.date === dateStr && tx.status !== 'pending') {
        if (tx.type === 'income') inc += Number(tx.amount) || 0;
        if (tx.type === 'expense' || tx.type === 'credit_purchase') exp += Number(tx.amount) || 0;
        if (tx.type === 'refund') exp = Math.max(0, exp - (Number(tx.amount) || 0));
      }
    }

    result.push({ date: label, income: inc, expense: exp });
  }

  return result;
}
