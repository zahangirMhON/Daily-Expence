import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  CreditCard,
  Smartphone,
  Plus,
  ArrowRightLeft,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Check,
  X,
  CreditCard as CardIcon,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { Account, AccountType, Transaction, FinancialHealthMetrics } from '../types';
import { ResetRestoreModal } from '../components/ResetRestoreModal';
import {
  formatCurrency,
  formatNumber,
  getAccountName,
  getAccountTypeName,
  Language,
  t,
} from '../i18n';
import { parseBengaliNumber } from '../utils/accounting';

interface AccountsViewProps {
  accounts: Account[];
  metrics?: FinancialHealthMetrics;
  onAddAccount: (acc: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateAccount: (id: string, updates: Partial<Account>) => void;
  onDeleteAccount: (id: string) => void;
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, description: string, fee?: number) => void;
  onPayCreditBill?: (fromAccountId: string, creditAccountId: string, amount: number) => void;
  onResetToZero?: (options?: { keepAccounts?: boolean }) => void;
  onRestoreLastReset?: () => void;
  onImportJSON?: (jsonStr: string) => void;
  onRestoreCloud?: () => Promise<void>;
  hasLastResetBackup?: boolean;
  lastResetBackupInfo?: { timestamp: number; txCount: number; accountsCount: number } | null;
  transactions?: Transaction[];
  isCloudUser?: boolean;
  lang?: Language;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  metrics,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onTransfer,
  onPayCreditBill,
  onResetToZero,
  onRestoreLastReset,
  onImportJSON,
  onRestoreCloud,
  hasLastResetBackup = false,
  lastResetBackupInfo,
  transactions = [],
  isCloudUser = false,
  lang = 'bn',
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isCreditPayOpen, setIsCreditPayOpen] = useState(false);
  const [isResetRestoreOpen, setIsResetRestoreOpen] = useState(false);

  // Transfer Form State
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferDesc, setTransferDesc] = useState(lang === 'bn' ? 'অ্যাকাউন্ট ব্যালেন্স স্থানান্তর' : 'Account balance transfer');

  // Credit Card Bill Form State
  const [creditCardId, setCreditCardId] = useState('');
  const [payFromId, setPayFromId] = useState('');
  const [creditAmountStr, setCreditAmountStr] = useState('');

  // Add / Edit Account Form State
  const [accName, setAccName] = useState('');
  const [accNameBn, setAccNameBn] = useState('');
  const [accType, setAccType] = useState<AccountType>('bank');
  const [accBalanceStr, setAccBalanceStr] = useState('0');
  const [accNumber, setAccNumber] = useState('');
  const [accLimitStr, setAccLimitStr] = useState('');
  const [accColor, setAccColor] = useState('#10b981');

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setAccName('');
    setAccNameBn('');
    setAccType('bank');
    setAccBalanceStr('0');
    setAccNumber('');
    setAccLimitStr('');
    setAccColor('#10b981');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccNameBn(acc.nameBn || acc.name);
    setAccType(acc.type);
    setAccBalanceStr(String(acc.balance));
    setAccNumber(acc.accountNumber || '');
    setAccLimitStr(acc.creditLimit ? String(acc.creditLimit) : '');
    setAccColor(acc.color || '#10b981');
    setIsAddOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;

    const balance = parseBengaliNumber(accBalanceStr);
    const creditLimit = accType === 'credit_card' ? parseBengaliNumber(accLimitStr) : undefined;
    const availableCredit =
      accType === 'credit_card' && creditLimit ? Math.max(0, creditLimit - balance) : undefined;

    if (editingAccount) {
      onUpdateAccount(editingAccount.id, {
        name: accName,
        nameBn: accNameBn || accName,
        type: accType,
        balance,
        accountNumber: accNumber || undefined,
        creditLimit,
        availableCredit,
        color: accColor,
      });
    } else {
      onAddAccount({
        name: accName,
        nameBn: accNameBn || accName,
        type: accType,
        balance,
        accountNumber: accNumber || undefined,
        creditLimit,
        availableCredit,
        color: accColor,
        iconName: getAccountDefaultIcon(accType),
      });
    }

    setIsAddOpen(false);
  };

  const handleDoTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseBengaliNumber(transferAmountStr);
    if (!transferFrom || !transferTo || amt <= 0 || transferFrom === transferTo) return;

    onTransfer(transferFrom, transferTo, amt, transferDesc || (lang === 'bn' ? 'ব্যালেন্স স্থানান্তর' : 'Balance Transfer'));
    setIsTransferOpen(false);
    setTransferAmountStr('');
  };

  const handleDoPayCredit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseBengaliNumber(creditAmountStr);
    if (!payFromId || !creditCardId || isNaN(amt) || amt <= 0) return;

    if (typeof onPayCreditBill === 'function') {
      onPayCreditBill(payFromId, creditCardId, amt);
    } else if (typeof onTransfer === 'function') {
      onTransfer(payFromId, creditCardId, amt, lang === 'bn' ? 'ক্রেডিট কার্ড বিল পরিশোধ' : 'Credit card bill payment');
    }
    setIsCreditPayOpen(false);
    setCreditAmountStr('');
  };

  const safeMetrics = metrics || {
    totalCash: 0,
    totalBank: 0,
    totalMobileWallet: 0,
    totalCreditOutstanding: 0,
    netWorth: 0,
    totalReceivable: 0,
    totalPayable: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthSavings: 0,
    savingsRate: 0,
    todayExpense: 0,
    todayIncome: 0,
  };

  const totalAssets = metrics?.totalCash !== undefined
    ? (safeMetrics.totalCash || 0) + (safeMetrics.totalBank || 0) + (safeMetrics.totalMobileWallet || 0)
    : accounts
        .filter((a) => a.type !== 'credit_card')
        .reduce((sum, a) => sum + (a.balance || 0), 0);
  const creditCards = accounts.filter((a) => a.type === 'credit_card');
  const liquidAccounts = accounts.filter((a) => a.type !== 'credit_card');

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('acc.title', lang)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t('acc.subtitle', lang)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onResetToZero && (
            <button
              onClick={() => setIsResetRestoreOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all"
              title={lang === 'bn' ? 'সকল ব্যাংক ব্যালেন্স শূন্য থেকে শুরু করতে সকল ডেটা মুছুন ও রিস্টোর অপশন' : 'Reset all balances to 0 & restore options'}
            >
              <RotateCcw className="h-4 w-4 text-rose-400" />
              <span>{lang === 'bn' ? 'ব্যালেন্স শূন্য ও রিসেট' : 'Reset to 0'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (liquidAccounts.length >= 2) {
                setTransferFrom(liquidAccounts[0].id);
                setTransferTo(liquidAccounts[1].id);
              }
              setIsTransferOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-blue-400 hover:bg-slate-800 hover:border-slate-700 transition-all"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>{t('acc.transferBtn', lang)}</span>
          </button>

          {creditCards.length > 0 && (
            <button
              onClick={() => {
                setCreditCardId(creditCards[0].id);
                if (liquidAccounts.length > 0) setPayFromId(liquidAccounts[0].id);
                setCreditAmountStr(String(creditCards[0].balance));
                setIsCreditPayOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400 hover:bg-slate-800 hover:border-slate-700 transition-all"
            >
              <CardIcon className="h-4 w-4" />
              <span>{t('acc.payCardBtn', lang)}</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{t('acc.addBtn', lang)}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t('dash.totalAssets', lang)}</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-300 mt-2">{formatCurrency(totalAssets, lang)}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {lang === 'bn' ? 'নগদ, ব্যাংক ও মোবাইল ওয়ালেটের যোগফল' : 'Sum of Cash, Bank & Mobile Wallets'}
          </p>
        </div>

        <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t('dash.totalCreditDue', lang)}</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">
            {formatCurrency(safeMetrics.totalCreditOutstanding || 0, lang)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {lang === 'bn' ? 'ক্রেডিট কার্ডের মোট বকেয়া দায়' : 'Total Credit Card Liabilities'}
          </p>
        </div>

        <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t('dash.netWorth', lang)}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{formatCurrency(safeMetrics.netWorth || 0, lang)}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {lang === 'bn' ? 'সম্পদ মাইনাস সমস্ত দায় ও দেনা' : 'Assets minus total liabilities'}
          </p>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isCard = acc.type === 'credit_card';

          return (
            <div
              key={acc.id}
              className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-2xl flex items-center justify-center font-bold text-base shadow-inner"
                      style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                    >
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white leading-snug">
                        {getAccountName(acc, lang)}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {getAccountTypeName(acc.type, lang)}
                        {acc.accountNumber ? ` • ${acc.accountNumber}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      title={t('action.edit', lang)}
                      className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`${t('action.delete', lang)}: ${getAccountName(acc, lang)}?`)) {
                          onDeleteAccount(acc.id);
                        }
                      }}
                      title={t('action.delete', lang)}
                      className="p-1.5 rounded-xl bg-slate-800 text-rose-400 hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balance section */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-end justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">
                      {isCard ? t('acc.totalOutstanding', lang) : t('acc.balance', lang)}
                    </span>
                    <p
                      className={`text-2xl font-black tracking-tight mt-0.5 ${
                        isCard ? 'text-rose-400' : 'text-slate-100'
                      }`}
                    >
                      {formatCurrency(acc.balance, lang)}
                    </p>
                  </div>

                  {isCard && acc.availableCredit !== undefined && (
                    <div className="text-right">
                      <span className="text-[11px] font-semibold text-emerald-400">
                        {t('acc.availableLimit', lang)}
                      </span>
                      <p className="text-sm font-bold text-emerald-300">
                        {formatCurrency(acc.availableCredit, lang)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Limit Progress bar */}
              {isCard && acc.creditLimit && acc.creditLimit > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1">
                    <span>{lang === 'bn' ? 'ব্যবহৃত লিমিট:' : 'Used Limit:'} {formatNumber(Math.round((acc.balance / acc.creditLimit) * 100), lang)}%</span>
                    <span>{formatCurrency(acc.creditLimit, lang)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(5, (acc.balance / acc.creditLimit) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-blue-400" />
                <span>{t('modal.transfer', lang)}</span>
              </h3>
              <button onClick={() => setIsTransferOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDoTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('acc.sourceAccount', lang)}
                </label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  {liquidAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {getAccountName(a, lang)} ({formatCurrency(a.balance, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('acc.destAccount', lang)}
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  {liquidAccounts
                    .filter((a) => a.id !== transferFrom)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {getAccountName(a, lang)} ({formatCurrency(a.balance, lang)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('acc.transferAmount', lang)}
                </label>
                <input
                  type="text"
                  value={transferAmountStr}
                  onChange={(e) => setTransferAmountStr(e.target.value)}
                  placeholder="৫০০"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('tx.description', lang)}
                </label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="w-1/2 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  {t('action.cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  {t('action.confirm', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Card Bill Modal */}
      {isCreditPayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CardIcon className="h-5 w-5 text-amber-400" />
                <span>{t('modal.payCard', lang)}</span>
              </h3>
              <button onClick={() => setIsCreditPayOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDoPayCredit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'পরিশোধের উৎস অ্যাকাউন্ট' : 'Payment Source Account'}
                </label>
                <select
                  value={payFromId}
                  onChange={(e) => setPayFromId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  {liquidAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {getAccountName(a, lang)} ({formatCurrency(a.balance, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'টার্গেট ক্রেডিট কার্ড' : 'Target Credit Card'}
                </label>
                <select
                  value={creditCardId}
                  onChange={(e) => {
                    setCreditCardId(e.target.value);
                    const sel = creditCards.find((c) => c.id === e.target.value);
                    if (sel) setCreditAmountStr(String(sel.balance));
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  {creditCards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getAccountName(c, lang)} ({t('acc.totalOutstanding', lang)}: {formatCurrency(c.balance, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'পরিশোধের পরিমাণ' : 'Payment Amount'}
                </label>
                <input
                  type="text"
                  value={creditAmountStr}
                  onChange={(e) => setCreditAmountStr(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreditPayOpen(false)}
                  className="w-1/2 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  {t('action.cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  {t('action.confirm', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Account Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingAccount ? t('action.edit', lang) : t('modal.addAcc', lang)}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'অ্যাকাউন্টের নাম (বাংলা)' : 'Account Name (Bengali)'}
                </label>
                <input
                  type="text"
                  value={accNameBn}
                  onChange={(e) => setAccNameBn(e.target.value)}
                  placeholder="যেমন: ব্র্যাক ব্যাংক, বিকাশ ওয়ালেট"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'নাম (English)' : 'Name (English)'}
                </label>
                <input
                  type="text"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  placeholder="e.g. BRAC Bank A/C"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    {lang === 'bn' ? 'অ্যাকাউন্টের ধরন' : 'Account Type'}
                  </label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as AccountType)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                  >
                    <option value="bank">{t('acc.typeBank', lang)}</option>
                    <option value="cash">{t('acc.typeCash', lang)}</option>
                    <option value="bkash">{t('acc.typeBkash', lang)}</option>
                    <option value="nagad">{t('acc.typeNagad', lang)}</option>
                    <option value="rocket">{t('acc.typeRocket', lang)}</option>
                    <option value="credit_card">{t('acc.typeCreditCard', lang)}</option>
                    <option value="debit_card">{t('acc.typeDebitCard', lang)}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    {accType === 'credit_card' ? t('acc.totalOutstanding', lang) : t('acc.balance', lang)}
                  </label>
                  <input
                    type="text"
                    value={accBalanceStr}
                    onChange={(e) => setAccBalanceStr(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  />
                </div>
              </div>

              {accType === 'credit_card' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    {t('acc.cardLimit', lang)}
                  </label>
                  <input
                    type="text"
                    value={accLimitStr}
                    onChange={(e) => setAccLimitStr(e.target.value)}
                    placeholder="১০০০০০"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('acc.accountNumber', lang)}
                </label>
                <input
                  type="text"
                  value={accNumber}
                  onChange={(e) => setAccNumber(e.target.value)}
                  placeholder="**** 1234"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
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

      {/* Reset & Restore Modal */}
      {onResetToZero && (
        <ResetRestoreModal
          isOpen={isResetRestoreOpen}
          onClose={() => setIsResetRestoreOpen(false)}
          onResetToZero={onResetToZero}
          onRestoreLastReset={onRestoreLastReset}
          onImportJSON={onImportJSON}
          onRestoreCloud={onRestoreCloud}
          hasLastResetBackup={hasLastResetBackup}
          lastResetBackupInfo={lastResetBackupInfo}
          accounts={accounts}
          transactions={transactions}
          isCloudUser={isCloudUser}
          lang={lang}
        />
      )}
    </div>
  );
};

function getAccountIcon(type: string) {
  switch (type) {
    case 'cash':
      return <Wallet className="h-5 w-5" />;
    case 'bank':
    case 'debit_card':
      return <Building2 className="h-5 w-5" />;
    case 'credit_card':
      return <CreditCard className="h-5 w-5" />;
    case 'bkash':
    case 'nagad':
    case 'rocket':
    case 'upay':
      return <Smartphone className="h-5 w-5" />;
    default:
      return <Wallet className="h-5 w-5" />;
  }
}

function getAccountDefaultIcon(type: AccountType): string {
  switch (type) {
    case 'cash':
      return 'Wallet';
    case 'bank':
      return 'Building2';
    case 'credit_card':
      return 'CreditCard';
    case 'bkash':
    case 'nagad':
    case 'rocket':
      return 'Smartphone';
    default:
      return 'Wallet';
  }
}
