import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  X,
  ShieldCheck,
  Upload,
  CloudDownload,
  History,
  CheckCircle2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Language, formatNumber } from '../i18n';
import { Account, Transaction } from '../types';

interface ResetRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToZero: (options?: { keepAccounts?: boolean }) => void;
  onRestoreLastReset?: () => void;
  onImportJSON?: (jsonStr: string) => void;
  onRestoreCloud?: () => Promise<void>;
  hasLastResetBackup?: boolean;
  lastResetBackupInfo?: { timestamp: number; txCount: number; accountsCount: number } | null;
  accounts?: Account[];
  transactions?: Transaction[];
  isCloudUser?: boolean;
  lang?: Language;
}

export const ResetRestoreModal: React.FC<ResetRestoreModalProps> = ({
  isOpen,
  onClose,
  onResetToZero,
  onRestoreLastReset,
  onImportJSON,
  onRestoreCloud,
  hasLastResetBackup = false,
  lastResetBackupInfo,
  accounts = [],
  transactions = [],
  isCloudUser = false,
  lang = 'bn',
}) => {
  const [keepAccounts, setKeepAccounts] = useState(true);
  const [activeTab, setActiveTab] = useState<'reset' | 'restore'>('reset');
  const [isRestoringCloud, setIsRestoringCloud] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportJSON) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        onImportJSON(content);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  const handleCloudRestoreClick = async () => {
    if (!onRestoreCloud) return;
    setIsRestoringCloud(true);
    try {
      await onRestoreCloud();
      onClose();
    } finally {
      setIsRestoringCloud(false);
    }
  };

  const formattedBackupTime = lastResetBackupInfo?.timestamp
    ? new Date(lastResetBackupInfo.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl shadow-rose-950/20 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {lang === 'bn' ? 'সকল ব্যালেন্স শূন্য ও ডেটা রিসেট' : 'Reset to Zero & Restore'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'সকল ব্যাংক হিসাব শূন্য (৳০) থেকে শুরু ও রিস্টোর করার অপশন'
                  : 'Start all bank balances from 0 & access restore options'}
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

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('reset')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'reset'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{lang === 'bn' ? 'ব্যালেন্স শূন্য ও রিসেট' : 'Reset to 0 Balance'}</span>
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'restore'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>{lang === 'bn' ? 'রিস্টোর অপশন (Restore)' : 'Restore Options'}</span>
            {hasLastResetBackup && (
              <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* TAB 1: RESET TO ZERO */}
        {activeTab === 'reset' && (
          <div className="space-y-4">
            {/* Warning & Info Card */}
            <div className="rounded-2xl bg-rose-950/20 border border-rose-900/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'আপনি কি সমস্ত ব্যাংক ব্যালেন্স শূন্য থেকে শুরু করতে চান?'
                    : 'Do you want to reset all bank balances to zero?'}
                </span>
              </div>
              <ul className="text-[12px] text-slate-300 space-y-1 list-disc list-inside pl-1 leading-relaxed">
                <li>
                  {lang === 'bn'
                    ? 'ক্যাশ, ব্যাংক, বিকাশ, নগদ সহ সব হিসাবের ব্যালেন্স ৳০ হয়ে যাবে।'
                    : 'All cash, bank, bKash, and Nagad account balances will be set to ৳0.'}
                </li>
                <li>
                  {lang === 'bn'
                    ? 'পূর্ববর্তী সকল লেনদেন তালিকা ও ক্যাটাগরি হিসাব পরিষ্কার হবে।'
                    : 'All previous transaction history and category summaries will be cleared.'}
                </li>
                <li>
                  {lang === 'bn'
                    ? 'কোনো ডেটা স্থায়ীভাবে হারানোর ভয় নেই — স্বয়ংক্রিয়ভাবে রিস্টোর ব্যাকআপ রাখা হবে।'
                    : 'No permanent data loss — an automatic backup will be preserved for instant restore.'}
                </li>
              </ul>
            </div>

            {/* Account Options */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-2.5">
              <span className="text-xs font-bold text-slate-300 block">
                {lang === 'bn' ? 'অ্যাকাউন্ট রিসেট ধরণ নির্বাচন করুন:' : 'Select Account Reset Mode:'}
              </span>

              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="reset_mode"
                  checked={keepAccounts}
                  onChange={() => setKeepAccounts(true)}
                  className="mt-0.5 text-rose-500 focus:ring-rose-500 bg-slate-950 border-slate-700"
                />
                <div className="text-xs">
                  <p className="font-bold text-white">
                    {lang === 'bn'
                      ? `বর্তমান অ্যাকাউন্টগুলো রেখে ব্যালেন্স ৳০ করুন (${formatNumber(accounts.length, lang)} টি)`
                      : `Keep custom accounts & reset balance to ৳0 (${accounts.length} accounts)`}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'আপনার কাস্টম ব্যাংক ও অ্যাকাউন্টের নাম অপরিবর্তিত থাকবে, কিন্তু শুরু হবে শূন্য টাকা থেকে।'
                      : 'Account names & types remain intact, only balances and transactions reset to zero.'}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="reset_mode"
                  checked={!keepAccounts}
                  onChange={() => setKeepAccounts(false)}
                  className="mt-0.5 text-rose-500 focus:ring-rose-500 bg-slate-950 border-slate-700"
                />
                <div className="text-xs">
                  <p className="font-bold text-white">
                    {lang === 'bn' ? 'সম্পূর্ণ ডিফল্ট ফ্যাক্টরি রিসেট (সকল ব্যালেন্স ৳০)' : 'Full Factory Reset (Clean 0 Balances)'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === 'bn'
                      ? 'ডিফল্ট অ্যাকাউন্ট সেট (ক্যাশ, বিকাশ, নগদ, ব্যাংক) সহ সম্পূর্ণ শূন্য অবস্থা।'
                      : 'Resets to default accounts set (Cash, bKash, Nagad, Bank) with 0 balances.'}
                  </p>
                </div>
              </label>
            </div>

            {/* Reset Action Button */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetToZero({ keepAccounts });
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-rose-950/50 flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{lang === 'bn' ? 'হ্যাঁ, ব্যালেন্স শূন্য করুন' : 'Confirm Reset to 0'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: RESTORE OPTIONS */}
        {activeTab === 'restore' && (
          <div className="space-y-4">
            {/* 1. Restore from last reset backup */}
            {hasLastResetBackup ? (
              <div className="rounded-2xl bg-emerald-950/20 border border-emerald-500/30 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {lang === 'bn' ? 'রিসেট পূর্বের স্বয়ংক্রিয় ব্যাকআপ' : 'Pre-Reset Auto Backup'}
                      </h4>
                      <p className="text-[11px] text-emerald-400 font-medium">
                        {formattedBackupTime}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                    {lang === 'bn' ? 'উপলব্ধ' : 'Available'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 flex items-center gap-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <span>
                    {lang === 'bn' ? 'লেনদেন:' : 'Transactions:'}{' '}
                    <strong className="text-white">{formatNumber(lastResetBackupInfo?.txCount || 0, lang)}</strong>
                  </span>
                  <span>
                    {lang === 'bn' ? 'অ্যাকাউন্ট:' : 'Accounts:'}{' '}
                    <strong className="text-white">{formatNumber(lastResetBackupInfo?.accountsCount || 0, lang)}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onRestoreLastReset) onRestoreLastReset();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  <History className="h-4 w-4" />
                  <span>{lang === 'bn' ? 'এই ব্যাকআপ থেকে রিস্টোর করুন' : 'Restore Pre-Reset Data'}</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 text-center text-xs text-slate-400 space-y-1">
                <History className="h-6 w-6 text-slate-600 mx-auto" />
                <p>{lang === 'bn' ? 'এখনও কোনো রিসেট ব্যাকআপ সংরক্ষিত হয়নি।' : 'No local reset backup snapshot available.'}</p>
                <p className="text-[11px] text-slate-500">
                  {lang === 'bn' ? 'রিসেট করার সাথে সাথে এখানে রিস্টোর অপশন যুক্ত হবে।' : 'Once you reset, an undo snapshot will appear here.'}
                </p>
              </div>
            )}

            {/* 2. File Upload Restore */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {lang === 'bn' ? 'JSON ব্যাকআপ ফাইল থেকে রিস্টোর' : 'Restore from JSON File'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'bn' ? 'পূর্বে ডাউনলোড করা JSON ফাইল সিলেক্ট করে সমস্ত ডেটা রিস্টোর করুন' : 'Select a downloaded JSON file to restore all ledger records'}
                  </p>
                </div>
              </div>

              <label className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                <Upload className="h-4 w-4" />
                <span>{lang === 'bn' ? 'ফাইল নির্বাচন করে রিস্টোর করুন' : 'Choose File to Restore'}</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* 3. Cloud Restore if user is authenticated */}
            {isCloudUser && onRestoreCloud && (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <CloudDownload className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {lang === 'bn' ? 'ক্লাউড থেকে রিস্টোর (Google/Firebase)' : 'Restore from Cloud'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'bn' ? 'ক্লাউড সার্ভারে সিঙ্ক থাকা সর্বশেষ ডেটা ফিরিয়ে আনুন' : 'Pull latest synced financial data from Cloud Firestore'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloudRestoreClick}
                  disabled={isRestoringCloud}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <CloudDownload className="h-4 w-4" />
                  <span>
                    {isRestoringCloud
                      ? lang === 'bn' ? 'ক্লাউড থেকে রিস্টোর হচ্ছে...' : 'Restoring from cloud...'
                      : lang === 'bn' ? 'ক্লাউড ব্যাকআপ রিস্টোর করুন' : 'Restore from Cloud'}
                  </span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-400 hover:text-white transition-all"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
