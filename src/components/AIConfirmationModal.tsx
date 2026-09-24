import React, { useState, useMemo } from 'react';
import {
  Check,
  Edit3,
  X,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Trash2,
  Tag,
  CreditCard,
  User,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AIParseResponse, ParsedItemDraft, Account, Category, Person, Transaction } from '../types';
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

interface AIConfirmationModalProps {
  parseResponse: AIParseResponse;
  rawPrompt: string;
  accounts: Account[];
  categories: Category[];
  people: Person[];
  existingTransactions?: Transaction[];
  autoAddEnabled?: boolean;
  onToggleAutoAdd?: (val: boolean) => void;
  onConfirm: (confirmedItems: ParsedItemDraft[]) => void;
  onEditItem: (item: ParsedItemDraft) => void;
  onCancel: () => void;
  lang?: Language;
}

export const AIConfirmationModal: React.FC<AIConfirmationModalProps> = ({
  parseResponse,
  rawPrompt,
  accounts,
  categories,
  people,
  existingTransactions = [],
  autoAddEnabled = false,
  onToggleAutoAdd,
  onConfirm,
  onEditItem,
  onCancel,
  lang = 'bn',
}) => {
  // Initialize draft items with unique tempIds
  const [items, setItems] = useState<ParsedItemDraft[]>(() =>
    parseResponse.items.map((item, idx) => ({
      ...item,
      tempId: item.tempId || `draft_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    }))
  );

  // Set of selected item tempIds
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(parseResponse.items.map((_, idx) => `draft_${idx}_${Date.now()}`))
  );

  // Ensure initial selectedIds match actual initialized item tempIds
  React.useEffect(() => {
    setSelectedIds(new Set(items.map((it) => it.tempId)));
  }, []);

  // Update a specific field for a draft item
  const handleUpdateItemField = (tempId: string, field: keyof ParsedItemDraft, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.tempId === tempId ? { ...it, [field]: value } : it))
    );
  };

  // Remove / delete a draft item from the list
  const handleDeleteDraftItem = (tempId: string) => {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(tempId);
      return next;
    });
  };

  // Toggle selection for saving
  const handleToggleSelect = (tempId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tempId)) {
        next.delete(tempId);
      } else {
        next.add(tempId);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(new Set(items.map((it) => it.tempId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // Detect duplicate warnings for each draft item
  const duplicateWarnings = useMemo(() => {
    const warnings: Record<string, string> = {};

    items.forEach((item, idx) => {
      // 1. Check if same item appears multiple times in the current parsed batch
      const duplicateInBatch = items.filter(
        (other, otherIdx) =>
          otherIdx !== idx &&
          other.amount === item.amount &&
          (other.description.trim().toLowerCase() === item.description.trim().toLowerCase() ||
            other.categoryId === item.categoryId)
      );

      if (duplicateInBatch.length > 0) {
        warnings[item.tempId] =
          lang === 'bn'
            ? '⚠️ একই প্রম্পটে এই খরচটি একাধিকবার শনাক্ত হয়েছে! আপনি কি এটি বাদ দিতে চান?'
            : '⚠️ Duplicate detected within this prompt! Would you like to remove it?';
        return;
      }

      // 2. Check if a transaction with the same amount & date exists in the database
      const matchInDb = existingTransactions.find((tx) => {
        const amountMatch = Math.abs(tx.amount - item.amount) < 0.01;
        const dateMatch = tx.date === item.date;
        const descMatch =
          tx.description.toLowerCase().includes(item.description.toLowerCase()) ||
          item.description.toLowerCase().includes(tx.description.toLowerCase());
        const catMatch = item.categoryId && tx.categoryId === item.categoryId;
        return amountMatch && (dateMatch || descMatch || catMatch);
      });

      if (matchInDb) {
        warnings[item.tempId] =
          lang === 'bn'
            ? `⚠️ পূর্বে সংরক্ষিত লেনদেনের সাথে মিল রয়েছে: "${matchInDb.description}" (৳${formatNumber(matchInDb.amount, lang)})`
            : `⚠️ Matches existing transaction: "${matchInDb.description}" (${formatCurrency(matchInDb.amount, lang)})`;
      }
    });

    return warnings;
  }, [items, existingTransactions, lang]);

  // Selected items to be confirmed
  const selectedItems = useMemo(() => {
    return items.filter((it) => selectedIds.has(it.tempId));
  }, [items, selectedIds]);

  const totalExpense = useMemo(() => {
    return selectedItems
      .filter((it) => it.type === 'expense' || it.type === 'credit_purchase')
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  }, [selectedItems]);

  const totalIncome = useMemo(() => {
    return selectedItems
      .filter((it) => it.type === 'income')
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  }, [selectedItems]);

  const handleConfirmSelected = () => {
    if (selectedItems.length === 0) return;
    onConfirm(selectedItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl border border-emerald-500/30 bg-slate-900 shadow-2xl shadow-emerald-950/40 p-4 sm:p-6 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {lang === 'bn' ? 'হিসাব সেভ করার আগে মিলিয়ে নিন' : 'Review Before Saving'}
              </h3>
              <p className="text-xs text-emerald-400 font-medium">
                {lang === 'bn'
                  ? 'তুমি এইটা এইটা এই ক্যাটাগরি তে এই বিস্তারিত বর্ণনা দিয়ে যুক্ত হতে যাচ্ছে:'
                  : 'Review the following transactions before they are recorded:'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User's Original Prompt Display */}
        {rawPrompt && (
          <div className="my-3 rounded-2xl bg-slate-950/90 border border-slate-800 p-3 text-xs text-slate-300 flex items-start gap-2">
            <span className="font-bold text-emerald-400 shrink-0">
              {lang === 'bn' ? 'আপনার কথা/ইনপুট:' : 'Your input:'}
            </span>
            <span className="italic">"{rawPrompt}"</span>
          </div>
        )}

        {/* Action / Selection Bar */}
        <div className="flex items-center justify-between py-1 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>
              {lang === 'bn'
                ? `শনাক্তকৃত হিসাব: ${formatNumber(items.length, lang)}টি`
                : `Detected items: ${items.length}`}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">
              {lang === 'bn'
                ? `নির্বাচিত: ${formatNumber(selectedItems.length, lang)}টি`
                : `Selected: ${selectedItems.length}`}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="text-[11px] text-emerald-400 hover:underline"
            >
              {lang === 'bn' ? 'সব নির্বাচন' : 'Select All'}
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-[11px] text-slate-400 hover:underline"
            >
              {lang === 'bn' ? 'সব বাতিল' : 'Unselect All'}
            </button>
          </div>
        </div>

        {/* Parsed Items List */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-2">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              {lang === 'bn'
                ? 'কোনো হিসাব অবশিষ্ট নেই। সবগুলো বাদ দেওয়া হয়েছে।'
                : 'No items remaining. All items were removed.'}
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = selectedIds.has(item.tempId);
              const warning = duplicateWarnings[item.tempId];

              return (
                <div
                  key={item.tempId}
                  className={`rounded-2xl border transition-all p-4 space-y-3 shadow-md ${
                    isSelected
                      ? warning
                        ? 'border-amber-500/50 bg-slate-950/95 shadow-amber-950/20'
                        : 'border-slate-700/80 bg-slate-950/90'
                      : 'border-slate-800/60 bg-slate-950/40 opacity-60'
                  }`}
                >
                  {/* Top Bar: Checkbox, Number, Type, and Delete Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.tempId)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-400">
                        #{formatNumber(idx + 1, lang)}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.type === 'expense' || item.type === 'credit_purchase'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : item.type === 'income'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {getTransactionTypeName(item.type, lang)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        title={lang === 'bn' ? 'বিস্তারিত এডিট' : 'Full Edit'}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs flex items-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-blue-400" />
                        <span className="hidden sm:inline">{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDraftItem(item.tempId)}
                        title={lang === 'bn' ? 'বাদ দিন / ডিলিট' : 'Delete item'}
                        className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all text-xs flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{lang === 'bn' ? 'বাদ দিন' : 'Remove'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Duplicate Alert Banner if detected */}
                  {warning && (
                    <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>{warning}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraftItem(item.tempId)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500 hover:text-white font-bold text-[11px] shrink-0 transition-colors"
                      >
                        {lang === 'bn' ? 'ডুপ্লিকেট বাদ দিন' : 'Remove duplicate'}
                      </button>
                    </div>
                  )}

                  {/* Detailed Description & Amount (Main Fields) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Description - 2 cols on desktop */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {lang === 'bn' ? 'বিস্তারিত বর্ণনা / বিবরণ' : 'Description'}
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItemField(item.tempId, 'description', e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: বাজার খরচ, ওষুধ ক্রয়, রিকশা ইত্যাদি' : 'e.g. Grocery, Lunch'}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-medium text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Amount - 1 col */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {lang === 'bn' ? 'টাকার পরিমাণ (৳)' : 'Amount (৳)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={item.amount}
                          onChange={(e) =>
                            handleUpdateItemField(item.tempId, 'amount', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category, Account & Date Selection Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Category */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                        {t('tx.category', lang)}
                      </label>
                      <select
                        value={item.categoryId || ''}
                        onChange={(e) => handleUpdateItemField(item.tempId, 'categoryId', e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">-- {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'} --</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {getCategoryName(cat, lang)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Account */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                        {t('tx.account', lang)}
                      </label>
                      <select
                        value={item.accountId || accounts[0]?.id}
                        onChange={(e) => handleUpdateItemField(item.tempId, 'accountId', e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {getAccountName(acc, lang)} ({formatCurrency(acc.balance, lang)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                        {t('tx.date', lang)}
                      </label>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => handleUpdateItemField(item.tempId, 'date', e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Person Selector (if applicable) */}
                  {(item.type === 'money_given' ||
                    item.type === 'money_received' ||
                    item.type === 'loan_given' ||
                    item.type === 'loan_taken' ||
                    item.personName) && (
                    <div>
                      <label className="text-[10px] font-semibold text-amber-400 block mb-1">
                        {t('tx.person', lang)} ({item.personName || (lang === 'bn' ? 'ব্যক্তি' : 'Person')})
                      </label>
                      <select
                        value={item.personId || ''}
                        onChange={(e) => handleUpdateItemField(item.tempId, 'personId', e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-amber-500/40 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                      >
                        <option value="">
                          -- {item.personName || (lang === 'bn' ? 'নতুন ব্যক্তি' : 'New Person')} --
                        </option>
                        {people.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Controls */}
        <div className="border-t border-slate-800 pt-3.5 mt-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              {totalExpense > 0 && (
                <span className="text-rose-400 font-bold">
                  {lang === 'bn' ? 'মোট খরচ:' : 'Total Expense:'} {formatCurrency(totalExpense, lang)}
                </span>
              )}
              {totalIncome > 0 && (
                <span className="text-emerald-400 font-bold">
                  {lang === 'bn' ? 'মোট আয়:' : 'Total Income:'} {formatCurrency(totalIncome, lang)}
                </span>
              )}
            </div>

            {onToggleAutoAdd && (
              <label className="flex items-center space-x-2 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAddEnabled}
                  onChange={(e) => onToggleAutoAdd(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <span>{t('modal.autoAddHighConfidence', lang)}</span>
              </label>
            )}
          </div>

          <div className="flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {t('action.cancel', lang)}
            </button>
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleConfirmSelected}
              className="flex items-center space-x-1.5 rounded-2xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>
                {lang === 'bn'
                  ? `নিশ্চিত ও সেভ করুন (${formatNumber(selectedItems.length, lang)}টি)`
                  : `Confirm & Save (${selectedItems.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
