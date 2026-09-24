import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Trash2,
  Copy,
  Tag,
  CreditCard,
  User,
  Calendar,
  Clock,
  FileText,
  ArrowRightLeft,
  DollarSign,
} from 'lucide-react';
import { Transaction, TransactionType, Account, Category, Person } from '../types';
import {
  formatCurrency,
  getCategoryName,
  getAccountName,
  getTransactionTypeName,
  Language,
  t,
} from '../i18n';
import { parseBengaliNumber } from '../utils/accounting';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  initialData?: Partial<Transaction> | null;
  accounts: Account[];
  categories: Category[];
  people: Person[];
  lang?: Language;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  initialData,
  accounts,
  categories,
  people,
  lang = 'bn',
}) => {
  const isEditing = !!initialData?.id;
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [amountStr, setAmountStr] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [personId, setPersonId] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDate);
  const [time, setTime] = useState<string>(defaultTime);
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<'completed' | 'pending' | 'cleared'>('completed');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setAmountStr(initialData.amount ? String(initialData.amount) : '');
      setType(initialData.type || 'expense');
      setCategoryId(initialData.categoryId || '');
      setSubcategory(initialData.subcategory || '');
      setAccountId(initialData.accountId || accounts[0]?.id || '');
      setToAccountId(initialData.toAccountId || '');
      setPersonId(initialData.personId || '');
      setDate(initialData.date || defaultDate);
      setTime(initialData.time || defaultTime);
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.status || 'completed');
    } else {
      setAmountStr('');
      setType('expense');
      setCategoryId(categories.find((c) => c.type === 'expense')?.id || '');
      setSubcategory('');
      setAccountId(accounts[0]?.id || '');
      setToAccountId('');
      setPersonId('');
      setDate(defaultDate);
      setTime(defaultTime);
      setDescription('');
      setNotes('');
      setStatus('completed');
    }
  }, [initialData, accounts, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseBengaliNumber(amountStr);
    if (amount <= 0 || !accountId) return;

    onSave({
      id: initialData?.id,
      amount,
      type,
      categoryId: type === 'transfer' ? undefined : categoryId || undefined,
      subcategory: subcategory.trim() || undefined,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      personId:
        type === 'money_given' || type === 'money_received' || type === 'loan_given' || type === 'loan_taken'
          ? personId
          : undefined,
      date,
      time,
      description: description.trim() || (lang === 'bn' ? 'লেনদেন' : 'Transaction'),
      notes: notes.trim() || undefined,
      status,
      timestamp: new Date(`${date}T${time || '12:00'}:00`).getTime() || Date.now(),
    });

    onClose();
  };

  const isTransfer = type === 'transfer';
  const isPersonRequired =
    type === 'money_given' || type === 'money_received' || type === 'loan_given' || type === 'loan_taken';

  const transactionTypes: { type: TransactionType; label: string }[] = [
    { type: 'expense', label: t('tx.typeExpense', lang) },
    { type: 'income', label: t('tx.typeIncome', lang) },
    { type: 'transfer', label: t('tx.typeTransfer', lang) },
    { type: 'money_given', label: t('tx.typeMoneyGiven', lang) },
    { type: 'money_received', label: t('tx.typeMoneyReceived', lang) },
    { type: 'credit_purchase', label: t('tx.typeCreditPurchase', lang) },
    { type: 'credit_payment', label: t('tx.typeCreditPayment', lang) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-white">
            {isEditing ? t('modal.editTx', lang) : t('modal.newTx', lang)}
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              {t('tx.filterType', lang)}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {transactionTypes.map((tt) => (
                <button
                  key={tt.type}
                  type="button"
                  onClick={() => setType(tt.type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    type === tt.type
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                {t('tx.amount', lang)}
              </label>
              <input
                type="text"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="৮৫০"
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-base font-black text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                {t('tx.description', lang)}
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={lang === 'bn' ? 'যেমন: কাঁচাবাজার' : 'e.g. Grocery'}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Accounts: Source & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                {isTransfer ? t('acc.sourceAccount', lang) : t('tx.account', lang)}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {getAccountName(a, lang)} ({formatCurrency(a.balance, lang)})
                  </option>
                ))}
              </select>
            </div>

            {isTransfer ? (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('acc.destAccount', lang)}
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">{lang === 'bn' ? 'গন্তব্য অ্যাকাউন্ট নির্বাচন করুন' : 'Select Target Account'}</option>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {getAccountName(a, lang)} ({formatCurrency(a.balance, lang)})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('tx.category', lang)}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">{lang === 'bn' ? 'ক্যাটাগরি নির্বাচন করুন' : 'Select Category'}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCategoryName(c, lang)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Person Selection (for loans / lena-dena) */}
          {isPersonRequired && (
            <div>
              <label className="block text-xs font-semibold text-amber-400 mb-1.5">
                {t('tx.person', lang)}
              </label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-amber-500/40 text-sm text-white focus:border-amber-400 focus:outline-none"
                required
              >
                <option value="">{lang === 'bn' ? 'ব্যক্তি নির্বাচন করুন' : 'Select Person'}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.phoneNumber ? `(${p.phoneNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                {t('tx.date', lang)}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                {lang === 'bn' ? 'সময়' : 'Time'}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              {lang === 'bn' ? 'নোট / অতিরিক্ত তথ্য' : 'Notes / Additional Info'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === 'bn' ? 'ঐচ্ছিক নোট...' : 'Optional notes...'}
              className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            {isEditing && onDelete && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-400 font-bold">
                    {lang === 'bn' ? 'মুছে ফেলবেন?' : 'Confirm delete?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(initialData.id!);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 shadow-md shadow-rose-500/20"
                  >
                    {lang === 'bn' ? 'হ্যাঁ, ডিলিট' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                  >
                    {lang === 'bn' ? 'না' : 'No'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-xs font-bold transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}</span>
                </button>
              )
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                {t('action.cancel', lang)}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all"
              >
                {t('action.save', lang)}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
