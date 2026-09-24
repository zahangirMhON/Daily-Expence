import React, { useState } from 'react';
import {
  Home,
  Receipt,
  Wallet,
  Users,
  PieChart,
  BarChart3,
  Bot,
  Settings,
  Plus,
  Sparkles,
  Search,
  Languages,
  Sun,
  Moon,
  Cloud,
  CloudCheck,
  CheckCircle2,
  LogIn,
  LogOut,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { Language, ThemeMode, t } from '../i18n';
import { FirebaseUser } from '../services/firebase';

export type NavTab =
  | 'home'
  | 'transactions'
  | 'accounts'
  | 'people'
  | 'budget'
  | 'reports'
  | 'ai-assistant'
  | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab?: (tab: NavTab) => void;
  onTabChange?: (tab: NavTab) => void;
  onOpenQuickAdd?: () => void;
  onOpenAddModal?: () => void;
  onOpenSearch: () => void;
  pendingRemindersCount?: number;
  lang: Language;
  onToggleLang: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  currentUser?: FirebaseUser | null;
  isSyncing?: boolean;
  onLoginGoogle?: () => void;
  onLogout?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onTabChange,
  onOpenQuickAdd,
  onOpenAddModal,
  onOpenSearch,
  pendingRemindersCount = 0,
  lang,
  onToggleLang,
  theme = 'dark',
  onToggleTheme,
  currentUser,
  isSyncing = false,
  onLoginGoogle,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSelectTab = (tab: NavTab) => {
    if (typeof onSelectTab === 'function') {
      onSelectTab(tab);
    } else if (typeof onTabChange === 'function') {
      onTabChange(tab);
    }
  };

  const handleQuickAdd = () => {
    if (typeof onOpenQuickAdd === 'function') {
      onOpenQuickAdd();
    } else if (typeof onOpenAddModal === 'function') {
      onOpenAddModal();
    }
  };

  const mainNavItems = [
    { id: 'home', labelKey: 'nav.dashboard', icon: Home },
    { id: 'transactions', labelKey: 'nav.transactions', icon: Receipt },
    { id: 'accounts', labelKey: 'nav.accounts', icon: Wallet },
    { id: 'people', labelKey: 'nav.people', icon: Users },
    {
      id: 'budget',
      labelKey: 'nav.budget',
      icon: PieChart,
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined,
    },
    { id: 'reports', labelKey: 'nav.reports', icon: BarChart3 },
    { id: 'ai-assistant', labelKey: 'nav.aiAssistant', icon: Bot, isSpecial: true },
    { id: 'settings', labelKey: 'nav.settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Header Navigation */}
      <header className="hidden lg:flex sticky top-0 z-40 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            ৳
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight flex items-center gap-1.5">
              <span>{lang === 'bn' ? 'AI খরচ হিসাব' : 'AI Khoroch Hisab'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                {currentUser ? (lang === 'bn' ? 'ক্লাউড সিঙ্ক' : 'Cloud Sync') : 'Offline-First'}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {lang === 'bn'
                ? 'স্মার্ট পার্সোনাল ফাইন্যান্স ও ব্যালেন্স লেজার'
                : 'Smart Personal Finance & Balance Ledger'}
            </p>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = t(item.labelKey as any, lang);

            return (
              <button
                key={item.id}
                id={`nav-desktop-${item.id}`}
                onClick={() => handleSelectTab(item.id as NavTab)}
                className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? item.isSpecial
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive && !item.isSpecial ? 'text-emerald-400' : ''}`} />
                <span>{label}</span>
                {item.badge && (
                  <span className="h-4 min-w-[16px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Global Search, Language Toggle, Quick Add, Google Auth */}
        <div className="flex items-center space-x-2">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            title="Search (Ctrl + K)"
            className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>{lang === 'bn' ? 'অনুসন্ধান...' : 'Search...'}</span>
            <kbd className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              /
            </kbd>
          </button>

          {/* Language Switch */}
          <button
            onClick={onToggleLang}
            title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            className="flex items-center space-x-1 rounded-xl bg-slate-900 px-2.5 py-2 text-xs font-bold text-emerald-400 border border-slate-800 hover:bg-slate-800 transition-all"
          >
            <Languages className="h-3.5 w-3.5" />
            <span>{lang === 'bn' ? 'বাং' : 'EN'}</span>
          </button>

          {/* Theme Switch if provided */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 transition-all"
            >
              {theme === 'dark' ? <Moon className="h-3.5 w-3.5 text-amber-300" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
            </button>
          )}

          {/* Google Auth Status / Button */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 rounded-xl bg-slate-900 p-1.5 pr-2.5 border border-emerald-500/40 hover:border-emerald-400 transition-all"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="h-6 w-6 rounded-lg object-cover ring-1 ring-emerald-400/50"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden xl:block">
                  <div className="text-[11px] font-semibold text-white truncate max-w-[90px] leading-tight">
                    {currentUser.displayName || 'User'}
                  </div>
                  <div className="text-[9px] text-emerald-400 flex items-center gap-1">
                    {isSyncing ? (
                      <>
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        <span>{lang === 'bn' ? 'সিঙ্ক...' : 'Syncing'}</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                        <span>{lang === 'bn' ? 'সিঙ্কড' : 'Synced'}</span>
                      </>
                    )}
                  </div>
                </div>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-2xl shadow-black z-50">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{currentUser.displayName || 'User'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{lang === 'bn' ? 'Firebase সুরক্ষিত' : 'Firebase Secured'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleSelectTab('settings');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl mt-1 flex items-center gap-2"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>{lang === 'bn' ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings'}</span>
                  </button>
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl mt-0.5 flex items-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>{lang === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            onLoginGoogle && (
              <button
                onClick={onLoginGoogle}
                id="header-google-login-btn"
                className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/60 transition-all active:scale-95"
              >
                <Cloud className="h-3.5 w-3.5 text-emerald-400" />
                <span>{lang === 'bn' ? 'গুগল লগইন' : 'Google Login'}</span>
              </button>
            )
          )}

          {/* Quick manual add button */}
          <button
            onClick={onOpenQuickAdd}
            id="desktop-quick-add-btn"
            className="flex items-center space-x-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{t('nav.quickAdd', lang)}</span>
          </button>
        </div>
      </header>

      {/* Mobile Top App Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 px-3.5 py-2.5 backdrop-blur-xl">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-bold text-sm shadow-md">
            ৳
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              {lang === 'bn' ? 'AI খরচ হিসাব' : 'AI Khoroch Hisab'}
            </h1>
            <p className="text-[10px] text-emerald-400 font-medium">
              {currentUser ? (lang === 'bn' ? '🟢 ক্লাউড সিঙ্ক সক্রিয়' : '🟢 Cloud Synced') : (lang === 'bn' ? 'অফলাইন ও লাইভ লেজার' : 'Offline Live Ledger')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Global Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Google Auth Button on Mobile */}
          {currentUser ? (
            <button
              onClick={() => handleSelectTab('settings')}
              className="p-1 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300"
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="h-6 w-6 rounded-lg object-cover" />
              ) : (
                <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold text-[10px]">
                  {(currentUser.displayName || 'U')[0].toUpperCase()}
                </div>
              )}
            </button>
          ) : (
            onLoginGoogle && (
              <button
                onClick={onLoginGoogle}
                className="px-2 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 text-[10px] font-bold text-emerald-300"
              >
                {lang === 'bn' ? 'লগইন' : 'Login'}
              </button>
            )
          )}

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-emerald-400"
          >
            {lang === 'bn' ? 'বাং' : 'EN'}
          </button>

          {/* AI Assistant shortcut */}
          <button
            onClick={() => handleSelectTab('ai-assistant')}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ai-assistant'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI</span>
          </button>

          {/* Quick Add */}
          <button
            onClick={handleQuickAdd}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-90"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 px-1 py-1 backdrop-blur-2xl">
        <div className="grid grid-cols-6 gap-0.5">
          {[
            { id: 'home', labelKey: 'nav.dashboard', icon: Home },
            { id: 'transactions', labelKey: 'nav.transactions', icon: Receipt },
            { id: 'accounts', labelKey: 'nav.accounts', icon: Wallet },
            { id: 'people', labelKey: 'nav.people', icon: Users },
            {
              id: 'budget',
              labelKey: 'nav.budget',
              icon: PieChart,
              badge: pendingRemindersCount > 0 ? pendingRemindersCount : undefined,
            },
            { id: 'reports', labelKey: 'nav.reports', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const label = t(tab.labelKey as any, lang);

            return (
              <button
                key={tab.id}
                id={`mobile-nav-${tab.id}`}
                onClick={() => handleSelectTab(tab.id as NavTab)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                  isActive ? 'text-emerald-400 font-bold bg-slate-900/60' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2 h-3.5 min-w-[14px] px-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-slate-950 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 whitespace-nowrap truncate max-w-[54px]">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
