import React, { useState } from 'react';
import {
  Settings,
  Lock,
  Cloud,
  CloudUpload,
  CloudDownload,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Check,
  Smartphone,
  Database,
  Globe,
  Info,
  CheckCircle2,
  Sparkles,
  Languages,
  Moon,
  Sun,
  Laptop,
  Volume2,
  LogIn,
  LogOut,
  User as UserIcon,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { UserSettings, Account, Transaction, PromotionConfig } from '../types';
import { FirebaseUser } from '../services/firebase';
import { Language, ThemeMode, t, formatNumber } from '../i18n';
import { ResetRestoreModal } from '../components/ResetRestoreModal';
import { PromotionSettingsModal } from '../components/PromotionSettingsModal';
import { PromotionBanner } from '../components/PromotionBanner';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  onResetDB: () => void;
  onResetToZero?: (options?: { keepAccounts?: boolean }) => void;
  onRestoreLastReset?: () => void;
  hasLastResetBackup?: boolean;
  lastResetBackupInfo?: { timestamp: number; txCount: number; accountsCount: number } | null;
  accounts?: Account[];
  transactions?: Transaction[];
  lang?: Language;
  onSetLang?: (l: Language) => void;
  theme?: ThemeMode;
  onSetTheme?: (th: ThemeMode) => void;
  currentUser?: FirebaseUser | null;
  isSyncing?: boolean;
  onLoginGoogle?: () => Promise<void>;
  onLogout?: () => Promise<void>;
  onManualSync?: () => Promise<void>;
  onManualRestore?: () => Promise<void>;
  promotionConfig?: PromotionConfig;
  onUpdatePromotionConfig?: (updated: PromotionConfig) => void;
  onResetPromotionStats?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportJSON,
  onImportJSON,
  onResetDB,
  onResetToZero,
  onRestoreLastReset,
  hasLastResetBackup = false,
  lastResetBackupInfo,
  accounts = [],
  transactions = [],
  lang = 'bn',
  onSetLang,
  theme = 'dark',
  onSetTheme,
  currentUser,
  isSyncing = false,
  onLoginGoogle,
  onLogout,
  onManualSync,
  onManualRestore,
  promotionConfig,
  onUpdatePromotionConfig,
  onResetPromotionStats,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isLocalSyncing, setIsLocalSyncing] = useState(false);

  const handleSavePin = () => {
    if (pinInput.length !== 4) {
      alert(lang === 'bn' ? 'দয়া করে ৪ ডিজিটের পিন দিন' : 'Please enter a 4-digit PIN');
      return;
    }
    onUpdateSettings({ isPinProtected: true, pinHash: pinInput });
    setIsSettingPin(false);
    setPinInput('');
  };

  const handleDisablePin = () => {
    if (
      confirm(
        lang === 'bn'
          ? 'আপনি কি অ্যাপের পিন লক নিষ্ক্রিয় করতে চান?'
          : 'Are you sure you want to disable the PIN lock?'
      )
    ) {
      onUpdateSettings({ isPinProtected: false, pinHash: undefined });
    }
  };

  const handleCloudBackup = async () => {
    if (onManualSync) {
      setIsLocalSyncing(true);
      setSyncStatus(lang === 'bn' ? 'Firestore ক্লাউডে ব্যাকআপ হচ্ছে...' : 'Backing up to Firestore...');
      try {
        await onManualSync();
        setSyncStatus(lang === 'bn' ? 'ক্লাউড ব্যাকআপ সফল হয়েছে!' : 'Cloud backup successful!');
      } catch {
        setSyncStatus(lang === 'bn' ? 'ব্যাকআপ ব্যর্থ হয়েছে।' : 'Backup failed.');
      } finally {
        setIsLocalSyncing(false);
        setTimeout(() => setSyncStatus(''), 4000);
      }
    }
  };

  const handleCloudRestore = async () => {
    if (
      !confirm(
        lang === 'bn'
          ? 'ক্লাউড থেকে রিস্টোর করলে বর্তমান লোকাল ডেটা আপডেট হবে। আপনি কি নিশ্চিত?'
          : 'Restoring will sync existing local data with cloud. Continue?'
      )
    ) {
      return;
    }

    if (onManualRestore) {
      setIsLocalSyncing(true);
      setSyncStatus(lang === 'bn' ? 'Firestore ক্লাউড থেকে রিস্টোর হচ্ছে...' : 'Restoring from Firestore...');
      try {
        await onManualRestore();
        setSyncStatus(lang === 'bn' ? 'রিস্টোর সম্পন্ন হয়েছে!' : 'Restore complete!');
      } catch {
        setSyncStatus(lang === 'bn' ? 'রিস্টোর ব্যর্থ হয়েছে।' : 'Restore failed.');
      } finally {
        setIsLocalSyncing(false);
        setTimeout(() => setSyncStatus(''), 4000);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          onImportJSON(content);
          alert(lang === 'bn' ? 'ডেটা সফলভাবে ইমপোর্ট হয়েছে!' : 'Data imported successfully!');
        } catch {
          alert(lang === 'bn' ? 'অবৈধ ব্যাকআপ ফাইল!' : 'Invalid backup file!');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          <span>{t('set.title', lang)}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          {t('set.subtitle', lang)}
        </p>
      </div>

      {/* 1. Language & Display Theme Preferences */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Globe className="h-4 w-4 text-emerald-400" />
          <span>{t('set.langTitle', lang)} & {t('set.themeTitle', lang)}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              {t('set.langTitle', lang)}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onSetLang) onSetLang('bn');
                  onUpdateSettings({ language: 'bn' });
                }}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  lang === 'bn'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>বাংলা (ডিফল্ট)</span>
                {lang === 'bn' && <Check className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSetLang) onSetLang('en');
                  onUpdateSettings({ language: 'en' });
                }}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                  lang === 'en'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>English</span>
                {lang === 'en' && <Check className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              {t('set.themeTitle', lang)}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onSetTheme) onSetTheme('dark');
                  onUpdateSettings({ theme: 'dark' });
                }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  theme === 'dark'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>{t('set.themeDark', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSetTheme) onSetTheme('light');
                  onUpdateSettings({ theme: 'light' });
                }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  theme === 'light'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>{t('set.themeLight', lang)}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSetTheme) onSetTheme('system');
                  onUpdateSettings({ theme: 'system' });
                }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  theme === 'system'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Laptop className="h-3.5 w-3.5" />
                <span>{t('set.themeSystem', lang)}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Website Promotion Banner Configuration Card */}
      {promotionConfig && (
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900/90 to-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'bn' ? 'ওয়েবসাইট প্রমোশন ব্যানার' : 'Website Promotion Banner'}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      promotionConfig.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {promotionConfig.enabled
                      ? lang === 'bn'
                        ? 'হোমস্ক্রিনে চালু'
                        : 'Active on Home'
                      : lang === 'bn'
                      ? 'লুকানো'
                      : 'Hidden'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'হোমস্ক্রিনের উপরে স্পন্সরড বা অফিশিয়াল পার্টনার ব্যানার প্রদর্শন ও কাস্টমাইজেশন'
                    : 'Manage promotional announcement banner shown at the top of Home view'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Enable/Disable Toggle */}
              {onUpdatePromotionConfig && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePromotionConfig({
                      ...promotionConfig,
                      enabled: !promotionConfig.enabled,
                    })
                  }
                  className={`flex items-center space-x-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold border transition-all ${
                    promotionConfig.enabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                  }`}
                >
                  <span>
                    {promotionConfig.enabled
                      ? lang === 'bn'
                        ? 'প্রদর্শন বন্ধ করুন'
                        : 'Disable Banner'
                      : lang === 'bn'
                      ? 'হোমস্ক্রিনে চালু করুন'
                      : 'Enable on Home'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPromoModalOpen(true)}
                className="flex items-center space-x-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-yellow-300 shadow-md shadow-amber-500/25 transition-all"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>{lang === 'bn' ? 'ব্যানার এডিট ও সেটিংস' : 'Edit Banner'}</span>
              </button>
            </div>
          </div>

          {/* Current Banner Summary & Mini Preview */}
          <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-300">
                  {promotionConfig.websiteName ? `${promotionConfig.websiteName} • ` : ''}
                  {promotionConfig.badgeTag}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400 font-medium truncate max-w-xs">
                  {promotionConfig.title}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>
                  {lang === 'bn' ? 'ভিউ:' : 'Views:'}{' '}
                  <strong className="text-slate-200">{formatNumber(promotionConfig.impressions || 0, lang)}</strong>
                </span>
                <span>
                  {lang === 'bn' ? 'ক্লিক:' : 'Clicks:'}{' '}
                  <strong className="text-amber-400">{formatNumber(promotionConfig.clicks || 0, lang)}</strong>
                </span>
              </div>
            </div>

            {/* Embedded Live Preview */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <PromotionBanner
                config={promotionConfig}
                onOpenSettings={() => setIsPromoModalOpen(true)}
                lang={lang}
                isDismissible={false}
                className="!shadow-none !border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Security & PIN Lock */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('set.pinTitle', lang)}</h3>
              <p className="text-xs text-slate-400">
                {settings.isPinProtected ? t('set.pinEnabled', lang) : t('set.pinDisabled', lang)}
              </p>
            </div>
          </div>

          <div>
            {settings.isPinProtected ? (
              <button
                onClick={handleDisablePin}
                className="rounded-2xl border border-rose-800/40 bg-rose-950/20 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40"
              >
                {t('set.disablePin', lang)}
              </button>
            ) : (
              <button
                onClick={() => setIsSettingPin(true)}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
              >
                {t('set.enablePin', lang)}
              </button>
            )}
          </div>
        </div>

        {isSettingPin && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              {lang === 'bn' ? '৪ ডিজিটের নতুন পিন কোড দিন' : 'Enter 4-digit PIN Code'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="****"
                className="w-32 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-center text-lg font-bold tracking-widest text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={handleSavePin}
                className="rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
              >
                {t('action.confirm', lang)}
              </button>
              <button
                onClick={() => setIsSettingPin(false)}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300"
              >
                {t('action.cancel', lang)}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. AI Automation & Threshold Settings */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t('set.autoAdd', lang)}</h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? '৯০%+ নিশ্চিত এন্ট্রিগুলো কনফার্মেশন ছাড়া সরাসরি সেভ হবে'
                  : 'Auto save 90%+ confident entries without manual modal confirmation'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onUpdateSettings({ autoAddHighConfidence: !settings.autoAddHighConfidence })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoAddHighConfidence ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autoAddHighConfidence ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4. Google Account & Firestore Cloud Synchronization */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {lang === 'bn' ? 'গুগল অ্যাকাউন্ট ও ফায়ারবেস ক্লাউড ডেটাবেস' : 'Google Account & Firestore Cloud Sync'}
                </h3>
                {currentUser && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {lang === 'bn' ? 'সংযুক্ত' : 'Connected'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'গুগল লগইনের মাধ্যমে আপনার সমস্ত লেনদেন, অ্যাকাউন্ট ও দেনা-পাওনা ক্লাউডে নিরাপদ রাখুন'
                  : 'Secure your transactions, accounts & loans across devices with Google Authentication'}
              </p>
            </div>
          </div>

          <div>
            {currentUser ? (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center space-x-1.5 rounded-2xl border border-rose-800/40 bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{lang === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLoginGoogle}
                disabled={isSyncing}
                className="flex items-center space-x-2 rounded-2xl bg-white hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{lang === 'bn' ? 'গুগল দিয়ে লগইন করুন' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* User Card if Logged In */}
        {currentUser && (
          <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="h-11 w-11 rounded-full object-cover border-2 border-emerald-500/50"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.displayName || 'Google User'}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                {lang === 'bn' ? 'ফায়ারবেস ক্লাউডে ডেটা নিয়মিত ব্যাকআপ হচ্ছে' : 'Active Firestore real-time sync'}
              </p>
            </div>
          </div>
        )}

        {/* Offline-First Badge */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/70">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>
            {lang === 'bn'
              ? 'অফলাইন প্রথম প্রযুক্তি: ইন্টারনেট না থাকলেও আপনার সমস্ত ডেমো ও নতুন হিসাব ব্রাউজারে সংরক্ষিত থাকবে।'
              : 'Offline-First architecture: Local data is safely retained even without an active internet connection.'}
          </span>
        </div>

        {syncStatus && (
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-300 font-medium flex items-center gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${isLocalSyncing ? 'animate-spin' : ''}`} />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* Sync Controls */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleCloudBackup}
            disabled={!currentUser || isSyncing || isLocalSyncing}
            className="flex items-center space-x-1.5 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 disabled:opacity-40 transition-all active:scale-95"
          >
            {isLocalSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CloudUpload className="h-4 w-4" />
            )}
            <span>{lang === 'bn' ? 'ক্লাউডে সেভ করুন' : 'Push to Firestore'}</span>
          </button>

          <button
            type="button"
            onClick={handleCloudRestore}
            disabled={!currentUser || isSyncing || isLocalSyncing}
            className="flex items-center space-x-1.5 rounded-2xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 disabled:opacity-40 transition-all active:scale-95"
          >
            <CloudDownload className="h-4 w-4" />
            <span>{lang === 'bn' ? 'ক্লাউড থেকে রিস্টোর' : 'Pull from Firestore'}</span>
          </button>
        </div>
      </div>

      {/* 5. Local File Export & Import (JSON) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{t('set.jsonBackup', lang)}</h3>
            <p className="text-xs text-slate-400">{t('set.jsonBackupDesc', lang)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={onExportJSON}
            className="flex items-center space-x-1.5 rounded-2xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            <span>{t('set.exportJson', lang)}</span>
          </button>

          <label className="flex items-center space-x-1.5 rounded-2xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>{t('set.importJson', lang)}</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* 6. Reset Database & Zero Balances */}
      <div className="rounded-3xl border border-rose-900/30 bg-slate-900/90 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-400">
              {lang === 'bn' ? 'সকল ব্যালেন্স শূন্য ও ডেটা রিসেট' : t('set.resetDb', lang)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'সকল ব্যাংক হিসাবের ব্যালেন্স ৳০ থেকে শুরু করতে সমস্ত পূর্বের ডেটা মুছে ফেলুন ও রিস্টোর করুন'
                : 'Reset all bank & wallet balances to ৳0, clear history with restore options'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {hasLastResetBackup && onRestoreLastReset && (
              <button
                type="button"
                onClick={onRestoreLastReset}
                className="flex items-center space-x-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition-all"
                title={lang === 'bn' ? 'রিসেট পূর্বের ব্যাকআপ থেকে ডেটা পুনরুদ্ধার করুন' : 'Restore from pre-reset backup'}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{lang === 'bn' ? 'আগের ডেটা ফিরিয়ে আনুন (Restore)' : 'Undo / Restore'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{lang === 'bn' ? 'ব্যালেন্স শূন্য ও রিসেট অপশন' : t('action.reset', lang)}</span>
            </button>
          </div>
        </div>

        {hasLastResetBackup && lastResetBackupInfo && (
          <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">
              {lang === 'bn' ? 'সর্বশেষ রিসেট পূর্বের সংরক্ষিত ব্যাকআপ:' : 'Last pre-reset backup available:'}{' '}
              <strong className="text-slate-200">
                {new Date(lastResetBackupInfo.timestamp).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </strong>
            </span>
            <span className="text-emerald-400 font-medium">
              {lang === 'bn'
                ? `${formatNumber(lastResetBackupInfo.txCount, lang)} টি লেনদেন সংরক্ষিত আছে`
                : `${lastResetBackupInfo.txCount} transactions preserved`}
            </span>
          </div>
        )}
      </div>

      {/* Reset & Restore Modal */}
      {onResetToZero && (
        <ResetRestoreModal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          onResetToZero={onResetToZero}
          onRestoreLastReset={onRestoreLastReset}
          onImportJSON={onImportJSON}
          onRestoreCloud={onManualRestore}
          hasLastResetBackup={hasLastResetBackup}
          lastResetBackupInfo={lastResetBackupInfo}
          accounts={accounts}
          transactions={transactions}
          isCloudUser={!!currentUser}
          lang={lang}
        />
      )}

      {/* Promotion Banner Settings Modal */}
      {promotionConfig && onUpdatePromotionConfig && (
        <PromotionSettingsModal
          isOpen={isPromoModalOpen}
          onClose={() => setIsPromoModalOpen(false)}
          config={promotionConfig}
          onSave={(updated) => {
            onUpdatePromotionConfig(updated);
            setIsPromoModalOpen(false);
          }}
          onResetStats={onResetPromotionStats}
          lang={lang}
        />
      )}
    </div>
  );
};
