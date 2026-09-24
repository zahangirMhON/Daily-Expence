import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Table as TableIcon,
  List,
  Calendar,
  Tag,
  CreditCard,
  User,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Users,
} from 'lucide-react';
import { Transaction, Account, Category, Person, TransactionType } from '../types';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  getCategoryName,
  getAccountName,
  getTransactionTypeName,
  Language,
  t,
} from '../i18n';
import { exportToExcel, exportToCSV } from '../services/exportService';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  people: Person[];
  onOpenAddModal: () => void;
  onOpenEditModal?: (tx: Transaction) => void;
  onEdit?: (tx: Transaction) => void;
  onEditTx?: (tx: Transaction) => void;
  onDeleteTx?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDuplicateTx?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  lang?: Language;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  accounts,
  categories,
  people,
  onOpenAddModal,
  onOpenEditModal,
  onEdit,
  onEditTx,
  onDeleteTx,
  onDelete,
  onDuplicateTx,
  onDuplicate,
  lang = 'bn',
}) => {
  const handleEdit = onOpenEditModal || onEdit || onEditTx || (() => {});
  const handleDelete = onDeleteTx || onDelete || (() => {});
  const handleDuplicate = onDuplicateTx || onDuplicate || (() => {});

  const [viewMode, setViewMode] = useState<'timeline' | 'spreadsheet'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const safeTx = Array.isArray(transactions) ? transactions : [];
  const safeCats = Array.isArray(categories) ? categories : [];
  const safeAccs = Array.isArray(accounts) ? accounts : [];
  const safePeople = Array.isArray(people) ? people : [];

  const catMap = useMemo(() => new Map(safeCats.map((c) => [c.id, c])), [safeCats]);
  const accMap = useMemo(() => new Map(safeAccs.map((a) => [a.id, a])), [safeAccs]);
  const personMap = useMemo(() => new Map(safePeople.map((p) => [p.id, p])), [safePeople]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return safeTx
      .filter((t) => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;
        if (filterAccount !== 'all' && t.accountId !== filterAccount && t.toAccountId !== filterAccount)
          return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const descMatch = t.description.toLowerCase().includes(q);
          const notesMatch = (t.notes || '').toLowerCase().includes(q);
          const cat = t.categoryId ? catMap.get(t.categoryId) : undefined;
          const catMatch =
            cat &&
            (cat.name.toLowerCase().includes(q) || (cat.nameBn && cat.nameBn.toLowerCase().includes(q)));
          const acc = accMap.get(t.accountId);
          const accMatch =
            acc &&
            (acc.name.toLowerCase().includes(q) || (acc.nameBn && acc.nameBn.toLowerCase().includes(q)));
          const person = t.personId ? personMap.get(t.personId) : undefined;
          const personMatch = person && person.name.toLowerCase().includes(q);
          const amountMatch = String(t.amount).includes(q);

          if (!descMatch && !notesMatch && !catMatch && !accMatch && !personMatch && !amountMatch) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.timestamp - a.timestamp;
        if (sortBy === 'date-asc') return a.timestamp - b.timestamp;
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, filterType, filterCategory, filterAccount, searchQuery, sortBy, catMap, accMap, personMap]);

  // Group by Date for timeline view
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    filteredTransactions.forEach((tx) => {
      const list = map.get(tx.date) || [];
      list.push(tx);
      map.set(tx.date, list);
    });
    return Array.from(map.entries());
  }, [filteredTransactions]);

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense' || t.type === 'credit_purchase') return sum - t.amount;
      return sum;
    }, 0);
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header & View Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('tx.title', lang)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t('tx.subtitle', lang)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switch */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>{t('tx.timelineView', lang)}</span>
            </button>
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'spreadsheet'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>{t('tx.tableView', lang)}</span>
            </button>
          </div>

          {/* Export Buttons */}
          <button
            onClick={() => exportToExcel(filteredTransactions, categories, accounts, people)}
            title="Excel Export"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={() => exportToCSV(filteredTransactions, categories, accounts, people)}
            title="CSV Export"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* New Transaction Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{t('tx.newBtn', lang)}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('tx.searchPlaceholder', lang)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">{t('tx.filterType', lang)}: {t('tx.filterAll', lang)}</option>
              <option value="income">{t('tx.typeIncome', lang)}</option>
              <option value="expense">{t('tx.typeExpense', lang)}</option>
              <option value="transfer">{t('tx.typeTransfer', lang)}</option>
              <option value="money_given">{t('tx.typeMoneyGiven', lang)}</option>
              <option value="money_received">{t('tx.typeMoneyReceived', lang)}</option>
              <option value="credit_purchase">{t('tx.typeCreditPurchase', lang)}</option>
              <option value="credit_payment">{t('tx.typeCreditPayment', lang)}</option>
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 max-w-[150px] truncate"
            >
              <option value="all">{t('tx.filterCategory', lang)}: {t('tx.filterAll', lang)}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCategoryName(c, lang)}
                </option>
              ))}
            </select>

            {/* Account Filter */}
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500 max-w-[150px] truncate"
            >
              <option value="all">{t('tx.filterAccount', lang)}: {t('tx.filterAll', lang)}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {getAccountName(a, lang)}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="date-desc">{lang === 'bn' ? 'তারিখ (নতুন আগে)' : 'Date (Newest)'}</option>
              <option value="date-asc">{lang === 'bn' ? 'তারিখ (পুরানো আগে)' : 'Date (Oldest)'}</option>
              <option value="amount-desc">{lang === 'bn' ? 'টাকার পরিমাণ (বেশি)' : 'Amount (High to Low)'}</option>
              <option value="amount-asc">{lang === 'bn' ? 'টাকার পরিমাণ (কম)' : 'Amount (Low to High)'}</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Stats */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>
            {t('tx.showingCount', lang)}: <strong className="text-white">{formatNumber(filteredTransactions.length, lang)}</strong> {t('tx.summaryTotal', lang)}
          </span>
          <span>
            {lang === 'bn' ? 'নীট ক্যাশ প্রবাহ:' : 'Net Cash Flow:'}{' '}
            <strong className={totalFilteredAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {formatCurrency(totalFilteredAmount, lang, { showSign: true })}
            </strong>
          </span>
        </div>
      </div>

      {/* Main Content: Timeline vs Spreadsheet */}
      {filteredTransactions.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400 space-y-3">
          <Calendar className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-base font-semibold text-slate-300">{t('tx.noResults', lang)}</p>
          <p className="text-xs text-slate-500">
            {lang === 'bn' ? 'ফিল্টার পরিবর্তন করুন অথবা নতুন লেনদেন যোগ করুন' : 'Change filters or add a new transaction'}
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline View */
        <div className="space-y-6">
          {groupedByDate.map(([dateStr, txList]) => {
            const dayTotalIncome = txList
              .filter((t) => t.type === 'income')
              .reduce((sum, t) => sum + t.amount, 0);
            const dayTotalExpense = txList
              .filter((t) => t.type === 'expense' || t.type === 'credit_purchase')
              .reduce((sum, t) => sum + t.amount, 0);

            return (
              <div key={dateStr} className="space-y-2.5">
                {/* Date Header Badge */}
                <div className="sticky top-14 z-20 flex items-center justify-between bg-slate-950/90 py-1.5 px-3 rounded-2xl border border-slate-800/80 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{formatDate(dateStr, lang)}</span>
                    <span className="text-[11px] text-slate-400 font-medium">({formatNumber(txList.length, lang)} লেনদেন)</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-bold">
                    {dayTotalIncome > 0 && (
                      <span className="text-emerald-400">+{formatCurrency(dayTotalIncome, lang)}</span>
                    )}
                    {dayTotalExpense > 0 && (
                      <span className="text-rose-400">-{formatCurrency(dayTotalExpense, lang)}</span>
                    )}
                  </div>
                </div>

                {/* Day Transactions */}
                <div className="space-y-2">
                  {txList.map((tx) => {
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
                        className="group p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all flex items-center justify-between gap-3"
                      >
                        <div
                          onClick={() => handleEdit(tx)}
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                        >
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
                              <ArrowDownLeft className="h-5 w-5" />
                            ) : isMoneyGiven || isMoneyReceived ? (
                              <Users className="h-5 w-5" />
                            ) : isTransfer ? (
                              <ArrowRightLeft className="h-5 w-5" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{tx.description}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                              <span>{tx.time || '০০:০০'}</span>
                              <span>•</span>
                              <span>{getAccountName(acc, lang)}</span>
                              {toAcc && <span>→ {getAccountName(toAcc, lang)}</span>}
                              {cat && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-300">{getCategoryName(cat, lang)}</span>
                                </>
                              )}
                              {person && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-400 font-semibold">{person.name}</span>
                                </>
                              )}
                              {tx.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic text-slate-500 truncate max-w-[120px]">{tx.notes}</span>
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

                          {/* Action Buttons: Always visible, clean & touch-friendly */}
                          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            <button
                              onClick={() => handleDuplicate(tx.id)}
                              title={t('tx.duplicate', lang)}
                              className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(tx)}
                              title={t('action.edit', lang)}
                              className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all flex items-center gap-1"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline text-[11px] font-bold">{t('action.edit', lang)}</span>
                            </button>
                            <button
                              onClick={() => setDeletingTx(tx)}
                              title={t('action.delete', lang)}
                              className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all flex items-center gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline text-[11px] font-bold">{t('action.delete', lang)}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Spreadsheet / Data Table View */
        <div className="rounded-3xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">{t('tx.date', lang)}</th>
                  <th className="p-3.5">{t('tx.description', lang)}</th>
                  <th className="p-3.5">{t('tx.filterType', lang)}</th>
                  <th className="p-3.5">{t('tx.category', lang)}</th>
                  <th className="p-3.5">{t('tx.account', lang)}</th>
                  <th className="p-3.5">{t('tx.person', lang)}</th>
                  <th className="p-3.5 text-right">{t('tx.amount', lang)}</th>
                  <th className="p-3.5 text-center">{t('tx.actions', lang)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                {filteredTransactions.map((tx) => {
                  const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
                  const acc = accMap.get(tx.accountId);
                  const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : undefined;
                  const person = tx.personId ? personMap.get(tx.personId) : undefined;

                  const isIncome = tx.type === 'income';
                  const isExpense = tx.type === 'expense' || tx.type === 'credit_purchase';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 whitespace-nowrap text-slate-400">
                        {formatDate(tx.date, lang)}
                      </td>
                      <td className="p-3.5 font-semibold text-white max-w-[200px] truncate">
                        {tx.description}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {getTransactionTypeName(tx.type, lang)}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-300">
                        {getCategoryName(cat, lang)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-300">
                        {getAccountName(acc, lang)} {toAcc ? `→ ${getAccountName(toAcc, lang)}` : ''}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-amber-400">
                        {person ? person.name : '—'}
                      </td>
                      <td
                        className={`p-3.5 text-right font-bold whitespace-nowrap ${
                          isIncome ? 'text-emerald-400' : isExpense ? 'text-rose-400' : 'text-blue-300'
                        }`}
                      >
                        {formatCurrency(tx.amount, lang, { showSign: isIncome })}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(tx)}
                            title={t('action.edit', lang)}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingTx(tx)}
                            title={t('action.delete', lang)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
