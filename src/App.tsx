import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from './services/db';
import {
  Transaction,
  Account,
  Category,
  Person,
  Budget,
  RecurringExpense,
  Reminder,
  UserSettings,
  FinancialHealthMetrics,
  MonthlyCategoryStats,
  AIParseResponse,
  ParsedItemDraft,
  PromotionConfig,
} from './types';
import { parseFinancialPrompt, askAIAssistant } from './services/aiService';
import { Navigation, NavTab } from './components/Navigation';
import { AIConfirmationModal } from './components/AIConfirmationModal';
import { TransactionModal } from './components/TransactionModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SecurityLockScreen } from './components/SecurityLockScreen';
import { PromotionSettingsModal } from './components/PromotionSettingsModal';
import { HomeView } from './views/HomeView';
import { TransactionsView } from './views/TransactionsView';
import { AccountsView } from './views/AccountsView';
import { PeopleView } from './views/PeopleView';
import { BudgetView } from './views/BudgetView';
import { ReportsView } from './views/ReportsView';
import { AIAssistantView } from './views/AIAssistantView';
import { SettingsView } from './views/SettingsView';
import { Language, ThemeMode, t, formatCurrency } from './i18n';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import {
  auth,
  signInWithGoogle,
  logOut,
  syncFinanceToFirestore,
  fetchFinanceFromFirestore,
  FirebaseUser,
} from './services/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Firebase Auth & Cloud Sync state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Core database states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [settings, setSettings] = useState<UserSettings>(db.getSettings());
  const [metrics, setMetrics] = useState<FinancialHealthMetrics>(db.getFinancialMetrics());
  const [categoryStats, setCategoryStats] = useState<MonthlyCategoryStats[]>([]);
  const [promotionConfig, setPromotionConfig] = useState<PromotionConfig>(() => db.getPromotionConfig());
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Language & Theme
  const [lang, setLang] = useState<Language>(settings.language || 'bn');
  const [theme, setTheme] = useState<ThemeMode>(settings.theme || 'dark');

  // AI and Modal states
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiParseResponse, setAiParseResponse] = useState<AIParseResponse | null>(null);
  const [currentRawPrompt, setCurrentRawPrompt] = useState<string>('');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Partial<Transaction> | null>(null);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<{
    title: string;
    desc?: string;
    type?: 'success' | 'info';
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const showToast = (
    title: string,
    desc?: string,
    type: 'success' | 'info' = 'success',
    actionLabel?: string,
    onAction?: () => void
  ) => {
    setToastMsg({ title, desc, type, actionLabel, onAction });
    setTimeout(() => setToastMsg(null), actionLabel ? 5500 : 3500);
  };

  // Sync state from LocalDatabaseService
  const refreshData = useCallback(() => {
    setTransactions(db.getTransactions());
    setAccounts(db.getAccounts());
    setCategories(db.getCategories());
    setPeople(db.getPeople());
    setBudgets(db.getBudgets());
    setRecurringExpenses(db.getRecurringExpenses());
    setReminders(db.getReminders());
    const currentSettings = db.getSettings();
    setSettings(currentSettings);
    setMetrics(db.getFinancialMetrics());
    const currentMonthKey = new Date().toISOString().substring(0, 7);
    setCategoryStats(db.getMonthlyCategoryStats(currentMonthKey));
    setPromotionConfig(db.getPromotionConfig());
    if (currentSettings.language) setLang(currentSettings.language);
    if (currentSettings.theme) setTheme(currentSettings.theme);
  }, []);

  useEffect(() => {
    refreshData();
    const currentSettings = db.getSettings();
    if (!currentSettings.isPinProtected) {
      setIsUnlocked(true);
    }
  }, [refreshData]);

  // Handle Theme switching on document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // System mode
      const isSysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSysDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    db.updateSettings({ language: newLang });
    refreshData();
  };

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    db.updateSettings({ theme: newTheme });
    refreshData();
  };

  // Cloud Sync trigger whenever data updates
  const triggerAutoSync = useCallback(
    (targetUser?: FirebaseUser | null) => {
      const u = targetUser !== undefined ? targetUser : currentUser;
      if (u) {
        try {
          const payload = JSON.parse(db.exportFullDatabaseJSON());
          syncFinanceToFirestore(u.uid, payload).catch((err) => {
            console.warn('Auto cloud sync notice:', err);
          });
        } catch (e) {
          console.warn('Sync serialization error:', e);
        }
      }
    },
    [currentUser]
  );

  // Ensure all demo data is completely wiped on first mount
  useEffect(() => {
    db.purgeAllDemoData();
    refreshData();
  }, []);

  // Listen to Firebase Google Authentication changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsSyncing(true);
        try {
          const remoteData = await fetchFinanceFromFirestore(user.uid);
          if (remoteData) {
            // Purge demo transactions/people from remote storage if any existed
            const sanitizedTransactions = (remoteData.transactions || []).filter(
              (t: any) => t.id && !t.id.startsWith('tx_init')
            );
            const sanitizedPeople = (remoteData.people || []).filter(
              (p: any) => !['person_rakib', 'person_tanvir', 'person_shaheed'].includes(p.id)
            );
            const sanitizedBudgets = (remoteData.budgets || []).filter((b: any) => !b.id.startsWith('b_'));
            const sanitizedRecurring = (remoteData.recurring || []).filter((r: any) => !r.id.startsWith('rec_'));
            const sanitizedReminders = (remoteData.reminders || []).filter((r: any) => !r.id.startsWith('rem_'));

            if (sanitizedTransactions.length > 0 || sanitizedPeople.length > 0) {
              const cleanData = {
                ...remoteData,
                transactions: sanitizedTransactions,
                people: sanitizedPeople,
                budgets: sanitizedBudgets,
                recurring: sanitizedRecurring,
                reminders: sanitizedReminders,
              };
              db.importFullDatabaseJSON(JSON.stringify(cleanData));
              db.purgeAllDemoData();
              refreshData();
              showToast(
                lang === 'bn' ? 'ফায়ারবেস ক্লাউড থেকে ডেটা লোড হয়েছে!' : 'Synced from Firebase Cloud!',
                lang === 'bn'
                  ? `${user.displayName || user.email || 'ব্যবহারকারী'} এর অ্যাকাউন্ট সক্রিয়`
                  : `Account active for ${user.displayName || user.email || 'User'}`
              );
            } else {
              // Remote had only demo records or was empty: start fresh with zero demo data
              db.purgeAllDemoData();
              refreshData();
              const payload = JSON.parse(db.exportFullDatabaseJSON());
              await syncFinanceToFirestore(user.uid, payload);
              showToast(
                lang === 'bn' ? 'নতুন ফ্রেশ অ্যাকাউন্ট তৈরি হয়েছে' : 'Fresh account ready',
                lang === 'bn' ? 'সকল ডেমো তথ্য মুছে ফেলা হয়েছে, ইনপুট করা হিসাব সংরক্ষিত থাকবে' : 'Zero demo data, ready for your entries'
              );
            }
          } else {
            // First time login: ensure local db is completely purged of demo data, then initialize cloud!
            db.purgeAllDemoData();
            refreshData();
            const payload = JSON.parse(db.exportFullDatabaseJSON());
            await syncFinanceToFirestore(user.uid, payload);
            showToast(
              lang === 'bn' ? 'গুগল অ্যাকাউন্টে ফ্রেশ ডেটাবেস তৈরি হয়েছে!' : 'Fresh database created in Google Account!',
              lang === 'bn' ? 'সকল ডেমো তথ্য ছাড়া ফ্রেশ হিসাব শুরু হয়েছে' : 'Ready for your inputs'
            );
          }
        } catch (err) {
          console.error('Initial cloud sync error:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, [refreshData, lang]);

  // Automatic debounced cloud backup whenever ledger data updates
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (currentUser && !isSyncing) {
      const timer = setTimeout(() => {
        triggerAutoSync();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [transactions, accounts, people, budgets, reminders, currentUser, isSyncing, triggerAutoSync]);

  const handleLoginGoogle = async () => {
    try {
      setIsSyncing(true);
      const user = await signInWithGoogle();
      if (user) {
        showToast(
          lang === 'bn' ? 'গুগল লগইন সফল হয়েছে!' : 'Signed in with Google!',
          user.displayName || user.email || ''
        );
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      alert(lang === 'bn' ? 'গুগল লগইন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Google login failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      showToast(lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে' : 'Signed out');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleManualSync = async () => {
    if (!currentUser) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে প্রথমে গুগল দিয়ে লগইন করুন' : 'Please sign in with Google first');
      return;
    }
    setIsSyncing(true);
    try {
      const payload = JSON.parse(db.exportFullDatabaseJSON());
      const success = await syncFinanceToFirestore(currentUser.uid, payload);
      if (success) {
        showToast(
          lang === 'bn' ? 'ক্লাউডে সফলভাবে সেভ হয়েছে!' : 'Successfully backed up to Firebase!',
          lang === 'bn' ? 'সকল লেনদেন ও ব্যালেন্স সুরক্ষিত' : 'All transactions and balances secured'
        );
      } else {
        throw new Error('Sync failed');
      }
    } catch (err: any) {
      alert(err.message || 'Backup failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualRestore = async () => {
    if (!currentUser) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে প্রথমে গুগল দিয়ে লগইন করুন' : 'Please sign in with Google first');
      return;
    }
    setIsSyncing(true);
    try {
      const remote = await fetchFinanceFromFirestore(currentUser.uid);
      if (remote) {
        db.importFullDatabaseJSON(JSON.stringify(remote));
        refreshData();
        showToast(
          lang === 'bn' ? 'ক্লাউড থেকে রিস্টোর সম্পন্ন হয়েছে!' : 'Restored from Firebase Cloud!',
          lang === 'bn' ? 'সর্বশেষ ডেটা সফলভাবে লোড হয়েছে' : 'Latest data loaded'
        );
      } else {
        alert(lang === 'bn' ? 'ক্লাউডে কোনো সংরক্ষিত ডেটা পাওয়া যায়নি' : 'No cloud backup found');
      }
    } catch (err: any) {
      alert(err.message || 'Restore failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle AI Prompt Parsing from Home or Topbar
  const handleParsePrompt = async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsLoadingAI(true);
    setCurrentRawPrompt(prompt);

    try {
      const response = await parseFinancialPrompt(prompt, {
        accounts,
        categories,
        people,
        reminders,
      });

      // Always show review/confirmation modal so user verifies category, description, and duplicates before saving
      setAiParseResponse(response);
    } catch (error) {
      console.error('AI parse error:', error);
      showToast(
        lang === 'bn' ? 'এআই পার্সিং ত্রুটি' : 'AI Parse Error',
        lang === 'bn' ? 'অনুগ্রহ করে আবার চেষ্টা করুন' : 'Please try again',
        'info'
      );
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Handle when user asks a question in the AI bar
  const handleAskQuestion = (question: string) => {
    setActiveTab('ai-assistant');
  };

  // Confirm and commit AI items to database
  const handleConfirmAIItems = (confirmedItems: ParsedItemDraft[]) => {
    try {
      if (!confirmedItems || confirmedItems.length === 0) {
        setAiParseResponse(null);
        return;
      }
      db.addParsedTransactions(confirmedItems);
      setAiParseResponse(null);
      refreshData();
      triggerAutoSync();
      showToast(
        lang === 'bn' ? 'হিসাব সফলভাবে সংরক্ষিত হয়েছে!' : 'Transactions recorded!',
        lang === 'bn' ? `${confirmedItems.length}টি লেনদেন সফলভাবে যুক্ত হয়েছে` : `${confirmedItems.length} entries added`
      );
    } catch (err: any) {
      alert(err.message || 'Error recording transaction');
    }
  };

  const handleEditAIItem = (item: ParsedItemDraft) => {
    setAiParseResponse(null);
    setEditingTx({
      amount: item.amount,
      type: item.type,
      categoryId: item.categoryId,
      subcategory: item.subcategory,
      accountId: item.accountId || accounts[0]?.id,
      personId: item.personId,
      date: item.date,
      description: item.description,
    });
    setIsTxModalOpen(true);
  };

  // Manual Transaction Operations
  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    if (txData.id) {
      db.updateTransaction(txData.id, txData);
      showToast(lang === 'bn' ? 'লেনদেন সফলভাবে হালনাগাদ করা হয়েছে' : 'Transaction updated successfully');
    } else {
      db.addTransaction(txData as any);
      showToast(lang === 'bn' ? 'নতুন লেনদেন সফলভাবে যুক্ত হয়েছে' : 'Transaction added successfully');
    }
    refreshData();
    triggerAutoSync();
    setIsTxModalOpen(false);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    db.deleteTransaction(id);
    refreshData();
    triggerAutoSync();
    showToast(
      lang === 'bn' ? 'লেনদেন মুছে ফেলা হয়েছে' : 'Transaction deleted',
      tx ? `"${tx.description}" (${formatCurrency(tx.amount, lang)})` : undefined,
      'info',
      lang === 'bn' ? 'পূর্বাবস্থায় ফেরান' : 'Undo',
      tx
        ? () => {
            db.addTransaction(tx);
            refreshData();
            triggerAutoSync();
            showToast(lang === 'bn' ? 'লেনদেন পুনরুদ্ধার করা হয়েছে' : 'Transaction restored');
          }
        : undefined
    );
  };

  const handleDuplicateTransaction = (id: string) => {
    const source = transactions.find((t) => t.id === id);
    if (source) {
      const { id: _, ...rest } = source;
      const now = new Date();
      db.addTransaction({
        ...rest,
        date: now.toISOString().split('T')[0],
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        timestamp: Date.now(),
        description: `${source.description} (${lang === 'bn' ? 'কপি' : 'copy'})`,
      });
      refreshData();
      showToast(lang === 'bn' ? 'লেনদেন ডুপ্লিকেট করা হয়েছে' : 'Transaction duplicated');
    }
  };

  // Account Operations
  const handleAddAccount = (acc: Omit<Account, 'id'>) => {
    db.addAccount(acc);
    refreshData();
    showToast(lang === 'bn' ? 'নতুন অ্যাকাউন্ট যুক্ত করা হয়েছে' : 'Account created');
  };

  const handleUpdateAccount = (id: string, updates: Partial<Account>) => {
    db.updateAccount(id, updates);
    refreshData();
    showToast(lang === 'bn' ? 'অ্যাকাউন্ট হালনাগাদ করা হয়েছে' : 'Account updated');
  };

  const handleDeleteAccount = (id: string) => {
    db.deleteAccount(id);
    refreshData();
    showToast(lang === 'bn' ? 'অ্যাকাউন্ট মুছে ফেলা হয়েছে' : 'Account deleted');
  };

  const handleTransfer = (fromId: string, toId: string, amount: number, note?: string) => {
    try {
      db.transferBetweenAccounts(fromId, toId, amount, note);
      refreshData();
      triggerAutoSync();
      showToast(lang === 'bn' ? 'টাকা সফলভাবে স্থানান্তর হয়েছে!' : 'Transfer completed!');
    } catch (err: any) {
      showToast(err.message || 'Transfer failed');
    }
  };

  const handlePayCreditBill = (fromAccountId: string, creditAccountId: string, amount: number) => {
    try {
      db.transferBetweenAccounts(
        fromAccountId,
        creditAccountId,
        amount,
        lang === 'bn' ? 'ক্রেডিট কার্ড বিল পরিশোধ' : 'Credit Card Bill Payment'
      );
      refreshData();
      triggerAutoSync();
      showToast(lang === 'bn' ? 'ক্রেডিট কার্ডের বিল সফলভাবে পরিশোধ করা হয়েছে' : 'Credit card bill paid');
    } catch (err: any) {
      showToast(err.message || 'Payment failed');
    }
  };

  // Person / Loan Operations
  const handleAddPerson = (p: Omit<Person, 'id' | 'createdAt'>) => {
    db.addPerson(p);
    refreshData();
    triggerAutoSync();
    showToast(lang === 'bn' ? 'নতুন ব্যক্তি যুক্ত করা হয়েছে' : 'Person added');
  };

  const handleUpdatePerson = (person: Person) => {
    db.updatePerson(person.id, person);
    refreshData();
    triggerAutoSync();
    showToast(lang === 'bn' ? 'ব্যক্তির তথ্য আপডেট করা হয়েছে' : 'Person updated');
  };

  const handleDeletePerson = (personId: string) => {
    db.deletePerson(personId);
    refreshData();
    triggerAutoSync();
    showToast(lang === 'bn' ? 'ব্যক্তি তালিকা থেকে মুছে ফেলা হয়েছে' : 'Person deleted');
  };

  const handleRecordLoan = (
    personId: string,
    type: 'money_given' | 'money_received',
    amount: number,
    accountId: string,
    note?: string,
    dueDate?: string
  ) => {
    try {
      db.recordPersonLoan(personId, type, amount, accountId, note, dueDate);
      refreshData();
      triggerAutoSync();
      showToast(lang === 'bn' ? 'ধার / পাওনা হিসাব আপডেট করা হয়েছে' : 'Loan recorded');
    } catch (err: any) {
      showToast(err.message || 'Loan record failed');
    }
  };

  const handleSettleLoan = (personId: string, amount: number, accountId: string, note?: string) => {
    try {
      db.settlePersonBalance(personId, amount, accountId, note);
      refreshData();
      triggerAutoSync();
      showToast(lang === 'bn' ? 'পাওনা / দেনা নিষ্পত্তি করা হয়েছে' : 'Settlement recorded');
    } catch (err: any) {
      showToast(err.message || 'Settlement failed');
    }
  };

  const handleRecordLoanPayment = (
    personId: string,
    amount: number,
    type: 'money_received' | 'money_given',
    accountId: string,
    notes?: string
  ) => {
    handleSettleLoan(personId, amount, accountId, notes);
  };

  // Budget & Recurring & Reminder Operations
  const handleUpdateBudget = (categoryId: string, monthlyLimit: number) => {
    db.setCategoryBudget(categoryId, monthlyLimit);
    refreshData();
    showToast(lang === 'bn' ? 'বাজেট লিমিট আপডেট করা হয়েছে' : 'Budget limit updated');
  };

  const handlePayRecurring = (rec: RecurringExpense) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    db.addTransaction({
      amount: rec.amount,
      type: 'expense',
      categoryId: rec.categoryId || 'cat_expense_bills',
      accountId: rec.accountId || accounts[0]?.id || 'acc_cash',
      date: new Date().toISOString().split('T')[0],
      time: timeStr,
      description: `${rec.title} (${lang === 'bn' ? 'পুনরাবৃত্ত বিল' : 'Recurring Bill'})`,
      timestamp: Date.now(),
      status: 'completed',
    });
    refreshData();
    showToast(lang === 'bn' ? `${rec.title} বিল পরিশোধ রেকর্ড করা হয়েছে` : `${rec.title} marked as paid`);
  };

  const handleFulfillReminder = (rem: Reminder) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    db.updateReminder(rem.id, { status: 'paid' });
    db.addTransaction({
      amount: rem.amount,
      type: 'expense',
      categoryId: rem.categoryId || 'cat_expense_bills',
      accountId: rem.accountId || accounts[0]?.id || 'acc_cash',
      date: new Date().toISOString().split('T')[0],
      time: timeStr,
      description: `${rem.title} (${lang === 'bn' ? 'রিমাইন্ডার বিল পরিশোধ' : 'Reminder Paid'})`,
      timestamp: Date.now(),
      status: 'completed',
    });
    refreshData();
    showToast(lang === 'bn' ? `${rem.title} পরিশোধ সম্পন্ন হয়েছে!` : `${rem.title} marked paid!`);
  };

  // Backup & Reset DB
  const handleExportJSON = () => {
    const jsonStr = db.exportFullDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-masik-hisab-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(lang === 'bn' ? 'JSON ব্যাকআপ ডাউনলোড হয়েছে' : 'JSON Backup downloaded');
  };

  const [hasLastResetBackup, setHasLastResetBackup] = useState<boolean>(() => db.hasLastResetBackup());
  const [lastResetBackupInfo, setLastResetBackupInfo] = useState(() => db.getLastResetBackupInfo());

  const handleImportJSON = (jsonStr: string) => {
    const success = db.importFullDatabaseJSON(jsonStr);
    if (success) {
      refreshData();
      setHasLastResetBackup(db.hasLastResetBackup());
      setLastResetBackupInfo(db.getLastResetBackupInfo());
      showToast(lang === 'bn' ? 'ডেটা সফলভাবে রিস্টোর হয়েছে!' : 'Data restored successfully!');
    } else {
      alert(lang === 'bn' ? 'অবৈধ ব্যাকআপ ফাইল!' : 'Invalid backup file');
    }
  };

  const handleResetToZero = (options?: { keepAccounts?: boolean }) => {
    try {
      db.resetDatabase(options);
      refreshData();
      setHasLastResetBackup(db.hasLastResetBackup());
      setLastResetBackupInfo(db.getLastResetBackupInfo());
      triggerAutoSync();
      showToast(
        lang === 'bn' ? 'সকল ব্যাংক ব্যালেন্স শূন্য ও ডেটা রিসেট হয়েছে!' : 'All balances reset to zero and data cleared!',
        lang === 'bn' ? 'প্রয়োজনে যে কোনো সময় আগের তথ্য রিস্টোর করতে পারবেন' : 'You can undo / restore data from backup anytime',
        'info',
        lang === 'bn' ? 'আগের ডেটা ফেরান' : 'Undo Reset',
        handleRestoreLastReset
      );
    } catch (err: any) {
      showToast(err.message || 'Reset failed');
    }
  };

  const handleRestoreLastReset = () => {
    try {
      const success = db.restoreFromLastReset();
      if (success) {
        refreshData();
        triggerAutoSync();
        setHasLastResetBackup(db.hasLastResetBackup());
        setLastResetBackupInfo(db.getLastResetBackupInfo());
        showToast(
          lang === 'bn' ? 'পূর্ববর্তী ডেটা সফলভাবে রিস্টোর হয়েছে!' : 'Data restored successfully!',
          lang === 'bn' ? 'সকল ব্যাংক ব্যালেন্স ও লেনদেন ফিরিয়ে আনা হয়েছে' : 'All accounts and transactions recovered'
        );
      } else {
        showToast(lang === 'bn' ? 'কোনো রিস্টোর ব্যাকআপ পাওয়া যায়নি' : 'No restore backup found');
      }
    } catch (err: any) {
      showToast(err.message || 'Restore failed');
    }
  };

  const handleResetDB = () => {
    handleResetToZero({ keepAccounts: false });
  };

  // Promotion Management
  const handleUpdatePromotionConfig = (updated: PromotionConfig) => {
    const saved = db.updatePromotionConfig(updated);
    setPromotionConfig(saved);
    triggerAutoSync();
    showToast(lang === 'bn' ? 'প্রমোশন ব্যানার সেটিংস সংরক্ষিত হয়েছে!' : 'Promotion settings saved!');
  };

  const handleRecordPromotionClick = () => {
    db.recordPromotionClick();
    setPromotionConfig(db.getPromotionConfig());
  };

  const handleRecordPromotionImpression = () => {
    db.recordPromotionImpression();
  };

  const handleResetPromotionStats = () => {
    db.resetPromotionStats();
    setPromotionConfig(db.getPromotionConfig());
    showToast(lang === 'bn' ? 'অ্যানালিটিক্স কাউন্টার রিসেট হয়েছে' : 'Analytics reset');
  };

  // Security Screen Lock
  if (!isUnlocked && settings.isPinProtected) {
    return (
      <SecurityLockScreen
        storedPinHash={settings.pinHash}
        onUnlock={() => setIsUnlocked(true)}
        appName={t('app.name', lang)}
        lang={lang}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 antialiased">
      {/* Responsive Navigation Header & Mobile Dock */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onTabChange={setActiveTab}
        onOpenQuickAdd={() => {
          setEditingTx(null);
          setIsTxModalOpen(true);
        }}
        onOpenAddModal={() => {
          setEditingTx(null);
          setIsTxModalOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        pendingRemindersCount={reminders.filter((r) => r.status === 'pending').length}
        lang={lang}
        onToggleLang={() => handleSetLang(lang === 'bn' ? 'en' : 'bn')}
        theme={theme}
        onToggleTheme={() => handleSetTheme(theme === 'dark' ? 'light' : 'dark')}
        currentUser={currentUser}
        isSyncing={isSyncing}
        onLoginGoogle={handleLoginGoogle}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-3 sm:px-6 lg:px-8 pt-4 pb-24 lg:pb-12 max-w-7xl w-full mx-auto">
        {activeTab === 'home' && (
          <HomeView
            metrics={metrics}
            categoryStats={categoryStats}
            transactions={transactions}
            recentTransactions={transactions}
            accounts={accounts}
            people={people}
            reminders={reminders}
            budgets={budgets}
            categories={categories}
            onParsePrompt={handleParsePrompt}
            onAskQuestion={handleAskQuestion}
            isLoadingAI={isLoadingAI}
            onOpenAddModal={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenEditModal={(tx) => {
              setEditingTx(tx);
              setIsTxModalOpen(true);
            }}
            onEditTx={(tx) => {
              setEditingTx(tx);
              setIsTxModalOpen(true);
            }}
            onDeleteTx={handleDeleteTransaction}
            onDuplicateTx={handleDuplicateTransaction}
            lang={lang}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            people={people}
            onOpenEditModal={(tx) => {
              setEditingTx(tx);
              setIsTxModalOpen(true);
            }}
            onEdit={(tx) => {
              setEditingTx(tx);
              setIsTxModalOpen(true);
            }}
            onEditTx={(tx) => {
              setEditingTx(tx);
              setIsTxModalOpen(true);
            }}
            onDelete={handleDeleteTransaction}
            onDeleteTx={handleDeleteTransaction}
            onDuplicate={handleDuplicateTransaction}
            onDuplicateTx={handleDuplicateTransaction}
            onOpenAddModal={() => {
              setEditingTx(null);
              setIsTxModalOpen(true);
            }}
            lang={lang}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            metrics={metrics}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
            onTransfer={handleTransfer}
            onPayCreditBill={handlePayCreditBill}
            onResetToZero={handleResetToZero}
            onRestoreLastReset={handleRestoreLastReset}
            onImportJSON={handleImportJSON}
            onRestoreCloud={currentUser ? handleManualRestore : undefined}
            hasLastResetBackup={hasLastResetBackup}
            lastResetBackupInfo={lastResetBackupInfo}
            transactions={transactions}
            isCloudUser={!!currentUser}
            lang={lang}
          />
        )}

        {activeTab === 'people' && (
          <PeopleView
            people={people}
            transactions={transactions}
            accounts={accounts}
            onAddPerson={handleAddPerson}
            onUpdatePerson={handleUpdatePerson}
            onDeletePerson={handleDeletePerson}
            onRecordLoan={handleRecordLoan}
            onSettleLoan={handleSettleLoan}
            onRecordLoanPayment={handleRecordLoanPayment}
            lang={lang}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            budgets={budgets}
            categoryStats={categoryStats}
            categories={categories}
            recurringExpenses={recurringExpenses}
            reminders={reminders}
            onUpdateBudget={handleUpdateBudget}
            onAddRecurring={(rec) => {
              db.addRecurringExpense(rec);
              refreshData();
              showToast(lang === 'bn' ? 'পুনরাবৃত্ত খরচ যুক্ত করা হয়েছে' : 'Recurring expense added');
            }}
            onPayRecurring={handlePayRecurring}
            onAddReminder={(rem) => {
              db.addReminder(rem);
              refreshData();
              showToast(lang === 'bn' ? 'রিমাইন্ডার সেট করা হয়েছে!' : 'Reminder created');
            }}
            onFulfillReminder={handleFulfillReminder}
            lang={lang}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            metrics={metrics}
            categoryStats={categoryStats}
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            people={people}
            lang={lang}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <AIAssistantView
            metrics={metrics}
            categoryStats={categoryStats}
            budgets={budgets}
            transactions={transactions}
            accounts={accounts}
            people={people}
            reminders={reminders}
            lang={lang}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(newS) => {
              db.updateSettings(newS);
              refreshData();
              triggerAutoSync();
            }}
            onExportJSON={handleExportJSON}
            onImportJSON={(jsonStr) => {
              handleImportJSON(jsonStr);
              triggerAutoSync();
            }}
            onResetDB={() => {
              handleResetToZero();
              triggerAutoSync();
            }}
            onResetToZero={handleResetToZero}
            onRestoreLastReset={handleRestoreLastReset}
            hasLastResetBackup={hasLastResetBackup}
            lastResetBackupInfo={lastResetBackupInfo}
            accounts={accounts}
            transactions={transactions}
            lang={lang}
            onSetLang={handleSetLang}
            theme={theme}
            onSetTheme={handleSetTheme}
            currentUser={currentUser}
            isSyncing={isSyncing}
            onLoginGoogle={handleLoginGoogle}
            onLogout={handleLogout}
            onManualSync={handleManualSync}
            onManualRestore={handleManualRestore}
          />
        )}
      </main>

      {/* Global Search Modal */}
      {isSearchOpen && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          people={people}
          reminders={reminders}
          onSelectTransaction={(tx) => {
            setEditingTx(tx);
            setIsTxModalOpen(true);
            setIsSearchOpen(false);
          }}
          onSelectAccount={(acc) => {
            setActiveTab('accounts');
            setIsSearchOpen(false);
          }}
          onSelectPerson={(person) => {
            setActiveTab('people');
            setIsSearchOpen(false);
          }}
          lang={lang}
        />
      )}

      {/* AI Confirmation Modal */}
      {aiParseResponse && (
        <AIConfirmationModal
          parseResponse={aiParseResponse}
          rawPrompt={currentRawPrompt}
          accounts={accounts}
          categories={categories}
          people={people}
          existingTransactions={transactions}
          autoAddEnabled={settings.autoAddHighConfidence}
          onToggleAutoAdd={(val) => {
            db.updateSettings({ autoAddHighConfidence: val });
            refreshData();
          }}
          onConfirm={handleConfirmAIItems}
          onEditItem={handleEditAIItem}
          onCancel={() => setAiParseResponse(null)}
          lang={lang}
        />
      )}

      {/* Manual Add / Edit Transaction Modal */}
      {isTxModalOpen && (
        <TransactionModal
          isOpen={isTxModalOpen}
          initialData={editingTx}
          accounts={accounts}
          categories={categories}
          people={people}
          onClose={() => setIsTxModalOpen(false)}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
          onDuplicate={handleDuplicateTransaction}
          lang={lang}
        />
      )}

      {/* Toast Notification Alert */}
      {toastMsg && (
        <div className="fixed bottom-16 lg:bottom-6 right-4 z-50 flex items-center space-x-3 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-md animate-slide-up max-w-sm">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{toastMsg.title}</p>
            {toastMsg.desc && <p className="text-[11px] text-slate-400 truncate">{toastMsg.desc}</p>}
          </div>
          {toastMsg.actionLabel && toastMsg.onAction && (
            <button
              onClick={() => {
                toastMsg.onAction?.();
                setToastMsg(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shrink-0 shadow"
            >
              {toastMsg.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
