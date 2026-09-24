import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Transaction, Account } from '../types';
import { formatCurrency, formatDate, getAccountName, Language, t } from '../i18n';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: Transaction | null;
  accounts?: Account[];
  lang?: Language;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  accounts = [],
  lang = 'bn',
}) => {
  if (!isOpen || !transaction) return null;

  const acc = accounts.find((a) => a.id === transaction.accountId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-5 sm:p-6 shadow-2xl shadow-rose-950/30 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'bn' ? 'লেনদেন মুছে ফেলতে চান?' : 'Delete Transaction?'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn' ? 'মুছে ফেললে ব্যালেন্স স্বয়ংক্রিয়ভাবে আপডেট হবে' : 'Balances will be recalculated automatically'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'বিবরণ:' : 'Description:'}</span>
            <span className="font-bold text-white max-w-[200px] truncate">{transaction.description}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'পরিমাণ:' : 'Amount:'}</span>
            <span className="font-bold text-rose-400 text-sm">
              {formatCurrency(transaction.amount, lang)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">{lang === 'bn' ? 'তারিখ:' : 'Date:'}</span>
            <span className="text-slate-300">{formatDate(transaction.date, lang)}</span>
          </div>
          {acc && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{lang === 'bn' ? 'অ্যাকাউন্ট:' : 'Account:'}</span>
              <span className="text-slate-300">{getAccountName(acc, lang)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-800 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            {t('action.cancel', lang)}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center space-x-1.5 rounded-2xl bg-rose-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
          >
            <Trash2 className="h-4 w-4" />
            <span>{lang === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
