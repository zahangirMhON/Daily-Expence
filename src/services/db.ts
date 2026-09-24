import { Account, Category, Person, Transaction, Budget, RecurringExpense, Reminder, AppSettings, FinancialHealthMetrics, MonthlyCategoryStats, ParsedItemDraft, PromotionConfig } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, DEFAULT_APP_SETTINGS, DEFAULT_PROMOTION_CONFIG } from '../data/defaults';
import { recalculateLedgerState, calculateFinancialMetrics, calculateMonthlyCategoryStats } from '../utils/accounting';
import { syncFinanceToFirestore, fetchFinanceFromFirestore } from './firebase';

const DB_NAME = 'ai_masik_hisab_db';
const DB_VERSION = 1;

// Storage keys for localStorage fallback & fast cache
const KEYS = {
  TRANSACTIONS: 'amh_transactions',
  ACCOUNTS: 'amh_accounts',
  CATEGORIES: 'amh_categories',
  PEOPLE: 'amh_people',
  BUDGETS: 'amh_budgets',
  RECURRING: 'amh_recurring',
  REMINDERS: 'amh_reminders',
  SETTINGS: 'amh_settings',
  AI_LOGS: 'amh_ai_logs',
  PROMOTION: 'amh_promotion',
};

// Fresh initial data with NO demo content
export function generateInitialData() {
  const cleanAccounts = DEFAULT_ACCOUNTS.map((a) => ({
    ...a,
    initialBalance: 0,
    balance: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  return {
    accounts: cleanAccounts,
    categories: DEFAULT_CATEGORIES,
    people: [] as Person[],
    transactions: [] as Transaction[],
    budgets: [] as Budget[],
    recurring: [] as RecurringExpense[],
    reminders: [] as Reminder[],
    settings: DEFAULT_APP_SETTINGS,
    promotion: DEFAULT_PROMOTION_CONFIG,
  };
}

class LocalDatabaseService {
  private memoryCache: {
    accounts: Account[];
    categories: Category[];
    people: Person[];
    transactions: Transaction[];
    budgets: Budget[];
    recurring: RecurringExpense[];
    reminders: Reminder[];
    settings: AppSettings;
    promotion: PromotionConfig;
  } | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedTx = localStorage.getItem(KEYS.TRANSACTIONS);
      if (!storedTx) {
        const initial = generateInitialData();
        this.saveAll(initial);
        this.memoryCache = initial;
      } else {
        this.loadFromStorage();
      }
    } catch (e) {
      console.warn('Storage init failed, using memory state', e);
      this.memoryCache = generateInitialData();
    }
  }

  private loadFromStorage() {
    try {
      let transactions: Transaction[] = [];
      try {
        const raw = localStorage.getItem(KEYS.TRANSACTIONS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            transactions = parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to parse transactions, generating defaults', e);
      }

      let accounts: Account[] = [];
      try {
        const raw = localStorage.getItem(KEYS.ACCOUNTS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            accounts = parsed;
          }
        }
      } catch {
        // fallback
      }
      if (!accounts.length) accounts = DEFAULT_ACCOUNTS;

      let categories: Category[] = [];
      try {
        const raw = localStorage.getItem(KEYS.CATEGORIES);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            categories = parsed;
          }
        }
      } catch {
        // fallback
      }
      if (!categories.length) categories = DEFAULT_CATEGORIES;

      let people: Person[] = [];
      try {
        const raw = localStorage.getItem(KEYS.PEOPLE);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) people = parsed;
        }
      } catch {
        // fallback
      }

      let budgets: Budget[] = [];
      try {
        const raw = localStorage.getItem(KEYS.BUDGETS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) budgets = parsed;
        }
      } catch {
        // fallback
      }

      let recurring: RecurringExpense[] = [];
      try {
        const raw = localStorage.getItem(KEYS.RECURRING);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) recurring = parsed;
        }
      } catch {
        // fallback
      }

      let reminders: Reminder[] = [];
      try {
        const raw = localStorage.getItem(KEYS.REMINDERS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) reminders = parsed;
        }
      } catch {
        // fallback
      }

      let settings: AppSettings = DEFAULT_APP_SETTINGS;
      try {
        const raw = localStorage.getItem(KEYS.SETTINGS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            settings = { ...DEFAULT_APP_SETTINGS, ...parsed };
          }
        }
      } catch {
        // fallback
      }

      let promotion: PromotionConfig = DEFAULT_PROMOTION_CONFIG;
      try {
        const raw = localStorage.getItem(KEYS.PROMOTION);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            promotion = { ...DEFAULT_PROMOTION_CONFIG, ...parsed };
          }
        }
      } catch {
        // fallback
      }

      // Purge any legacy demo data from previous runs
      const hasDemoTx = transactions.some((t) => t.id && t.id.startsWith('tx_init'));
      const hasDemoPeople = people.some((p) =>
        ['person_rakib', 'person_tanvir', 'person_shaheed'].includes(p.id)
      );
      if (hasDemoTx || hasDemoPeople) {
        transactions = transactions.filter((t) => !t.id.startsWith('tx_init'));
        people = people.filter(
          (p) => !['person_rakib', 'person_tanvir', 'person_shaheed'].includes(p.id)
        );
        budgets = budgets.filter((b) => !b.id.startsWith('b_'));
        recurring = recurring.filter((r) => !r.id.startsWith('rec_'));
        reminders = reminders.filter((r) => !r.id.startsWith('rem_'));
        accounts = accounts.map((a) => {
          if (['acc_cash', 'acc_bkash', 'acc_nagad', 'acc_bank_brac', 'acc_credit_card'].includes(a.id)) {
            if ([2220, 6350, 4200, 21000, 8000].includes(a.initialBalance)) {
              return { ...a, initialBalance: 0, balance: 0 };
            }
          }
          return a;
        });
      }

      // If transactions array was empty or corrupted on fresh install, use seed
      if (!transactions.length && !localStorage.getItem(KEYS.TRANSACTIONS)) {
        this.memoryCache = generateInitialData();
        this.saveAll(this.memoryCache);
        return;
      }

      // Always ensure live balances are recalculated
      const { recalculatedAccounts, recalculatedPeople } = recalculateLedgerState(
        accounts,
        people,
        transactions
      );

      this.memoryCache = {
        transactions,
        accounts: recalculatedAccounts,
        categories,
        people: recalculatedPeople,
        budgets,
        recurring,
        reminders,
        settings,
        promotion,
      };
    } catch (e) {
      console.error('Error parsing local storage:', e);
      this.memoryCache = generateInitialData();
    }
  }

  private currentUserId: string | null = null;
  private syncDebounceTimer: any = null;

  public setCurrentUserId(userId: string | null) {
    this.currentUserId = userId;
    if (userId) {
      this.triggerCloudSync();
    }
  }

  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  public triggerCloudSync() {
    if (!this.currentUserId || !this.memoryCache) return;
    if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);
    
    this.syncDebounceTimer = setTimeout(async () => {
      try {
        if (!this.currentUserId || !this.memoryCache) return;
        await syncFinanceToFirestore(this.currentUserId, {
          accounts: this.memoryCache.accounts || [],
          transactions: this.memoryCache.transactions || [],
          categories: this.memoryCache.categories || [],
          people: this.memoryCache.people || [],
          budgets: this.memoryCache.budgets || [],
          recurring: this.memoryCache.recurring || [],
          reminders: this.memoryCache.reminders || [],
          settings: this.memoryCache.settings,
          promotion: this.memoryCache.promotion,
        });
      } catch (err) {
        console.warn('Background Firestore sync error:', err);
      }
    }, 1200);
  }

  public async syncWithCloud(): Promise<boolean> {
    if (!this.currentUserId || !this.memoryCache) return false;
    try {
      return await syncFinanceToFirestore(this.currentUserId, {
        accounts: this.memoryCache.accounts || [],
        transactions: this.memoryCache.transactions || [],
        categories: this.memoryCache.categories || [],
        people: this.memoryCache.people || [],
        budgets: this.memoryCache.budgets || [],
        recurring: this.memoryCache.recurring || [],
        reminders: this.memoryCache.reminders || [],
        settings: this.memoryCache.settings,
        promotion: this.memoryCache.promotion,
      });
    } catch (err) {
      console.error('Manual Firestore sync error:', err);
      return false;
    }
  }

  public async loadFromCloud(userId: string): Promise<boolean> {
    try {
      this.currentUserId = userId;
      const remoteData = await fetchFinanceFromFirestore(userId);
      if (remoteData && Array.isArray(remoteData.transactions) && remoteData.transactions.length > 0) {
        const { recalculatedAccounts, recalculatedPeople } = recalculateLedgerState(
          remoteData.accounts || this.getAccounts(),
          remoteData.people || this.getPeople(),
          remoteData.transactions
        );

        this.memoryCache = {
          transactions: remoteData.transactions,
          accounts: recalculatedAccounts,
          categories: remoteData.categories || this.getCategories(),
          people: recalculatedPeople,
          budgets: remoteData.budgets || this.getBudgets(),
          recurring: remoteData.recurring || this.getRecurring(),
          reminders: remoteData.reminders || this.getReminders(),
          settings: remoteData.settings || this.getSettings(),
          promotion: remoteData.promotion ? { ...DEFAULT_PROMOTION_CONFIG, ...remoteData.promotion } : this.getPromotionConfig(),
        };
        this.saveAll(this.memoryCache, false);
        return true;
      } else {
        // First time cloud user - sync current local data up to Firestore
        await this.syncWithCloud();
        return true;
      }
    } catch (err) {
      console.error('Load from Firestore error:', err);
      return false;
    }
  }

  private saveAll(data: NonNullable<typeof this.memoryCache>, triggerSync = true) {
    try {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data.transactions || []));
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(data.accounts || []));
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(data.categories || []));
      localStorage.setItem(KEYS.PEOPLE, JSON.stringify(data.people || []));
      localStorage.setItem(KEYS.BUDGETS, JSON.stringify(data.budgets || []));
      localStorage.setItem(KEYS.RECURRING, JSON.stringify(data.recurring || []));
      localStorage.setItem(KEYS.REMINDERS, JSON.stringify(data.reminders || []));
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings || DEFAULT_APP_SETTINGS));
      localStorage.setItem(KEYS.PROMOTION, JSON.stringify(data.promotion || DEFAULT_PROMOTION_CONFIG));

      if (triggerSync && this.currentUserId) {
        this.triggerCloudSync();
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // --- GETTERS ---
  public getAccounts(): Account[] {
    if (!this.memoryCache) this.init();
    return Array.isArray(this.memoryCache?.accounts) ? [...this.memoryCache.accounts] : [];
  }

  public getCategories(): Category[] {
    if (!this.memoryCache) this.init();
    return Array.isArray(this.memoryCache?.categories) ? [...this.memoryCache.categories] : [];
  }

  public getPeople(): Person[] {
    if (!this.memoryCache) this.init();
    return Array.isArray(this.memoryCache?.people) ? [...this.memoryCache.people] : [];
  }

  public getTransactions(): Transaction[] {
    if (!this.memoryCache) this.init();
    const txs = Array.isArray(this.memoryCache?.transactions) ? this.memoryCache.transactions : [];
    return [...txs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  public getBudgets(): Budget[] {
    if (!this.memoryCache) this.init();
    return Array.isArray(this.memoryCache?.budgets) ? [...this.memoryCache.budgets] : [];
  }

  public getRecurring(): RecurringExpense[] {
    if (!this.memoryCache) this.init();
    return Array.isArray(this.memoryCache?.recurring) ? [...this.memoryCache.recurring] : [];
  }

  public getRecurringExpenses(): RecurringExpense[] {
    return this.getRecurring();
  }

  public getReminders(): Reminder[] {
    if (!this.memoryCache) this.init();
    return Array.isArray(this.memoryCache?.reminders) ? [...this.memoryCache.reminders] : [];
  }

  public getSettings(): AppSettings {
    if (!this.memoryCache) this.init();
    return { ...(this.memoryCache?.settings || DEFAULT_APP_SETTINGS) };
  }

  public getFinancialMetrics(): FinancialHealthMetrics {
    if (!this.memoryCache) this.init();
    return calculateFinancialMetrics(
      this.memoryCache?.accounts || [],
      this.memoryCache?.people || [],
      this.memoryCache?.transactions || []
    );
  }

  public getMonthlyCategoryStats(monthStr = '2026-08'): MonthlyCategoryStats[] {
    if (!this.memoryCache) this.init();
    const stats = calculateMonthlyCategoryStats(
      this.memoryCache?.transactions || [],
      this.memoryCache?.categories || [],
      this.memoryCache?.budgets || [],
      monthStr
    );
    return stats.expenseStats;
  }

  // --- RECALCULATE STATE & SYNC ---
  private refreshBalances() {
    if (!this.memoryCache) return;
    const { recalculatedAccounts, recalculatedPeople } = recalculateLedgerState(
      this.memoryCache.accounts || [],
      this.memoryCache.people || [],
      this.memoryCache.transactions || []
    );
    this.memoryCache.accounts = recalculatedAccounts;
    this.memoryCache.people = recalculatedPeople;
    this.saveAll(this.memoryCache);
  }

  // --- TRANSACTIONS CRUD ---
  public addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Transaction {
    if (!this.memoryCache) this.init();
    const newTx: Transaction = {
      ...tx,
      id: tx.id || 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Auto-match and update reminder if applicable
    if (newTx.reminderId) {
      this.markReminderPaid(newTx.reminderId, newTx.id);
    } else {
      // Check auto match keywords against pending reminders
      this.checkAndFulfillReminders(newTx);
    }

    this.memoryCache!.transactions.unshift(newTx);
    this.refreshBalances();
    return newTx;
  }

  public updateTransaction(id: string, updates: Partial<Transaction>, reason?: string): Transaction | null {
    if (!this.memoryCache) this.init();
    const index = this.memoryCache!.transactions.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const oldTx = this.memoryCache!.transactions[index];
    const editLog = {
      timestamp: Date.now(),
      changedFields: Object.keys(updates),
      previousValues: { ...oldTx },
      reason,
    };

    const updatedTx: Transaction = {
      ...oldTx,
      ...updates,
      updatedAt: Date.now(),
      editHistory: [...(oldTx.editHistory || []), editLog],
    };

    this.memoryCache!.transactions[index] = updatedTx;
    this.refreshBalances();
    return updatedTx;
  }

  public deleteTransaction(id: string): boolean {
    if (!this.memoryCache) this.init();
    const prevCount = this.memoryCache!.transactions.length;
    this.memoryCache!.transactions = this.memoryCache!.transactions.filter((t) => t.id !== id);
    if (this.memoryCache!.transactions.length !== prevCount) {
      this.refreshBalances();
      return true;
    }
    return false;
  }

  public duplicateTransaction(id: string): Transaction | null {
    if (!this.memoryCache) this.init();
    const original = this.memoryCache!.transactions.find((t) => t.id === id);
    if (!original) return null;

    const now = new Date();
    const clone: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      ...original,
      date: now.toISOString().split('T')[0],
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      timestamp: Date.now(),
      description: `${original.description} (কপি)`,
      editHistory: [],
    };
    return this.addTransaction(clone);
  }

  // --- ACCOUNTS CRUD ---
  public addAccount(acc: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account {
    if (!this.memoryCache) this.init();
    const newAcc: Account = {
      ...acc,
      id: 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.memoryCache!.accounts.push(newAcc);
    this.refreshBalances();
    return newAcc;
  }

  public updateAccount(id: string, updates: Partial<Account>): Account | null {
    if (!this.memoryCache) this.init();
    const idx = this.memoryCache!.accounts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.memoryCache!.accounts[idx] = {
      ...this.memoryCache!.accounts[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    this.refreshBalances();
    return this.memoryCache!.accounts[idx];
  }

  public deleteAccount(id: string): boolean {
    if (!this.memoryCache) this.init();
    // Do not hard delete if transactions exist; archive it
    const hasTx = this.memoryCache!.transactions.some((t) => t.accountId === id || t.toAccountId === id);
    if (hasTx) {
      this.updateAccount(id, { isArchived: true });
      return true;
    }
    this.memoryCache!.accounts = this.memoryCache!.accounts.filter((a) => a.id !== id);
    this.refreshBalances();
    return true;
  }

  // --- PEOPLE (DENA-PAONA) CRUD ---
  public addPerson(p: Omit<Person, 'id' | 'totalGiven' | 'totalReceived' | 'currentReceivable' | 'totalBorrowed' | 'totalRepaid' | 'currentPayable' | 'createdAt' | 'updatedAt'>): Person {
    if (!this.memoryCache) this.init();
    const newPerson: Person = {
      ...p,
      id: 'person_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      totalGiven: 0,
      totalReceived: 0,
      currentReceivable: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      currentPayable: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.memoryCache!.people.push(newPerson);
    this.refreshBalances();
    return newPerson;
  }

  public updatePerson(id: string, updates: Partial<Person>): Person | null {
    if (!this.memoryCache) this.init();
    const idx = this.memoryCache!.people.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.memoryCache!.people[idx] = {
      ...this.memoryCache!.people[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    this.refreshBalances();
    return this.memoryCache!.people[idx];
  }

  public deletePerson(id: string): boolean {
    if (!this.memoryCache) this.init();
    const idx = this.memoryCache!.people.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.memoryCache!.people.splice(idx, 1);
    this.refreshBalances();
    return true;
  }

  // --- BUDGETS CRUD ---
  public setBudget(categoryId: string, month: string, allocatedAmount: number, warningThresholds = [70, 85, 100]): Budget {
    if (!this.memoryCache) this.init();
    const existingIdx = this.memoryCache!.budgets.findIndex((b) => b.categoryId === categoryId && b.month === month);
    if (existingIdx >= 0) {
      this.memoryCache!.budgets[existingIdx] = {
        ...this.memoryCache!.budgets[existingIdx],
        allocatedAmount,
        warningThresholds,
        updatedAt: Date.now(),
      };
      this.saveAll(this.memoryCache!);
      return this.memoryCache!.budgets[existingIdx];
    } else {
      const newBudget: Budget = {
        id: `budget_${categoryId}_${month}`,
        categoryId,
        month,
        allocatedAmount,
        warningThresholds,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      this.memoryCache!.budgets.push(newBudget);
      this.saveAll(this.memoryCache!);
      return newBudget;
    }
  }

  public deleteBudget(id: string): boolean {
    if (!this.memoryCache) this.init();
    this.memoryCache!.budgets = this.memoryCache!.budgets.filter((b) => b.id !== id);
    this.saveAll(this.memoryCache!);
    return true;
  }

  // --- RECURRING & REMINDERS ---
  public addRecurringExpense(rec: Omit<RecurringExpense, 'id' | 'createdAt'>): RecurringExpense {
    if (!this.memoryCache) this.init();
    const newRec: RecurringExpense = {
      ...rec,
      id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
    };
    this.memoryCache!.recurring.push(newRec);
    this.saveAll(this.memoryCache!);
    return newRec;
  }

  public updateRecurringExpense(id: string, updates: Partial<RecurringExpense>): RecurringExpense | null {
    if (!this.memoryCache) this.init();
    const idx = this.memoryCache!.recurring.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.memoryCache!.recurring[idx] = { ...this.memoryCache!.recurring[idx], ...updates };
    this.saveAll(this.memoryCache!);
    return this.memoryCache!.recurring[idx];
  }

  public deleteRecurringExpense(id: string): boolean {
    if (!this.memoryCache) this.init();
    this.memoryCache!.recurring = this.memoryCache!.recurring.filter((r) => r.id !== id);
    this.saveAll(this.memoryCache!);
    return true;
  }

  public addReminder(rem: Omit<Reminder, 'id' | 'createdAt'>): Reminder {
    if (!this.memoryCache) this.init();
    const newRem: Reminder = {
      ...rem,
      id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: Date.now(),
    };
    this.memoryCache!.reminders.push(newRem);
    this.saveAll(this.memoryCache!);
    return newRem;
  }

  public markReminderPaid(reminderId: string, relatedTransactionId?: string): boolean {
    if (!this.memoryCache) this.init();
    const reminder = this.memoryCache!.reminders.find((r) => r.id === reminderId);
    if (reminder) {
      reminder.status = 'paid';
      reminder.paidAt = Date.now();
      if (relatedTransactionId) reminder.relatedTransactionId = relatedTransactionId;
      this.saveAll(this.memoryCache!);
      return true;
    }
    return false;
  }

  private checkAndFulfillReminders(tx: Transaction) {
    if (!this.memoryCache) return;
    const descLower = (tx.description + ' ' + (tx.rawPrompt || '')).toLowerCase();
    for (const rem of this.memoryCache.reminders) {
      if (rem.status === 'pending') {
        const matches = rem.autoMatchKeywords.some((kw) => descLower.includes(kw.toLowerCase()));
        if (matches) {
          // If amounts are within 10% or keywords match closely
          rem.status = 'paid';
          rem.paidAt = Date.now();
          rem.relatedTransactionId = tx.id;
          break;
        }
      }
    }
  }

  public updateReminder(id: string, updates: Partial<Reminder>): Reminder | null {
    if (!this.memoryCache) this.init();
    const idx = this.memoryCache!.reminders.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.memoryCache!.reminders[idx] = { ...this.memoryCache!.reminders[idx], ...updates };
    this.saveAll(this.memoryCache!);
    return this.memoryCache!.reminders[idx];
  }

  public updateBudget(categoryId: string, monthlyLimit: number, month = '2026-08'): Budget {
    return this.setBudget(categoryId, month, monthlyLimit);
  }

  // --- CATEGORIES CRUD ---
  public addCategory(cat: Omit<Category, 'id'>): Category {
    if (!this.memoryCache) this.init();
    const newCat: Category = {
      ...cat,
      id: 'cat_custom_' + Date.now(),
      isCustom: true,
    };
    this.memoryCache!.categories.push(newCat);
    this.saveAll(this.memoryCache!);
    return newCat;
  }

  // --- SETTINGS CRUD ---
  public updateSettings(updates: Partial<AppSettings>): AppSettings {
    if (!this.memoryCache) this.init();
    this.memoryCache!.settings = {
      ...this.memoryCache!.settings,
      ...updates,
    };
    this.saveAll(this.memoryCache!);
    return this.memoryCache!.settings;
  }

  // --- PROMOTION CONFIG & STATS ---
  public getPromotionConfig(): PromotionConfig {
    if (!this.memoryCache) this.init();
    return this.memoryCache!.promotion || DEFAULT_PROMOTION_CONFIG;
  }

  public updatePromotionConfig(updates: Partial<PromotionConfig>): PromotionConfig {
    if (!this.memoryCache) this.init();
    this.memoryCache!.promotion = {
      ...(this.memoryCache!.promotion || DEFAULT_PROMOTION_CONFIG),
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveAll(this.memoryCache!);
    return this.memoryCache!.promotion;
  }

  public recordPromotionClick(): number {
    if (!this.memoryCache) this.init();
    const current = this.memoryCache!.promotion || DEFAULT_PROMOTION_CONFIG;
    const clicks = (current.clicks || 0) + 1;
    this.memoryCache!.promotion = {
      ...current,
      clicks,
      updatedAt: Date.now(),
    };
    this.saveAll(this.memoryCache!, false);
    return clicks;
  }

  public recordPromotionImpression(): number {
    if (!this.memoryCache) this.init();
    const current = this.memoryCache!.promotion || DEFAULT_PROMOTION_CONFIG;
    const impressions = (current.impressions || 0) + 1;
    this.memoryCache!.promotion = {
      ...current,
      impressions,
    };
    this.saveAll(this.memoryCache!, false);
    return impressions;
  }

  public resetPromotionStats(): void {
    if (!this.memoryCache) this.init();
    const current = this.memoryCache!.promotion || DEFAULT_PROMOTION_CONFIG;
    this.memoryCache!.promotion = {
      ...current,
      clicks: 0,
      impressions: 0,
      updatedAt: Date.now(),
    };
    this.saveAll(this.memoryCache!);
  }

  // --- BACKUP & RESTORE & EXPORT ---
  public exportCompleteBackup(): string {
    if (!this.memoryCache) this.init();
    const payload = {
      version: 1,
      appName: 'AI খরচ হিসাব',
      exportedAt: new Date().toISOString(),
      data: this.memoryCache,
    };
    return JSON.stringify(payload, null, 2);
  }

  public exportDatabaseJSON(): string {
    return this.exportCompleteBackup();
  }

  public importCompleteBackup(jsonString: string): boolean {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const data = parsed?.data || parsed;
      if (data && (Array.isArray(data.accounts) || Array.isArray(data.transactions))) {
        this.memoryCache = {
          accounts: Array.isArray(data.accounts) && data.accounts.length > 0 ? data.accounts : DEFAULT_ACCOUNTS,
          categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES,
          people: Array.isArray(data.people) ? data.people : [],
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
          budgets: Array.isArray(data.budgets) ? data.budgets : [],
          recurring: Array.isArray(data.recurring) ? data.recurring : [],
          reminders: Array.isArray(data.reminders) ? data.reminders : [],
          settings: data.settings ? { ...DEFAULT_APP_SETTINGS, ...data.settings } : DEFAULT_APP_SETTINGS,
          promotion: data.promotion ? { ...DEFAULT_PROMOTION_CONFIG, ...data.promotion } : (this.memoryCache?.promotion || DEFAULT_PROMOTION_CONFIG),
        };
        this.refreshBalances();
        this.saveAll(this.memoryCache);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  public importDatabaseJSON(jsonString: string): boolean {
    return this.importCompleteBackup(jsonString);
  }

  public resetAllData(options?: { keepAccounts?: boolean }): void {
    if (!this.memoryCache) this.init();

    // 1. Automatically snapshot existing data so the user can easily Restore anytime!
    try {
      if (this.memoryCache) {
        localStorage.setItem(
          'amh_last_reset_backup',
          JSON.stringify({
            timestamp: Date.now(),
            backup: this.memoryCache,
          })
        );
      }
    } catch (e) {
      console.warn('Could not save auto-reset backup', e);
    }

    // 2. Prepare clean state with ALL bank & wallet balances set strictly to 0
    let cleanAccounts: Account[];
    if (options?.keepAccounts && this.memoryCache?.accounts && this.memoryCache.accounts.length > 0) {
      // Keep existing custom accounts/bank names, but strictly zero out balances
      cleanAccounts = this.memoryCache.accounts.map((a) => ({
        ...a,
        initialBalance: 0,
        balance: 0,
        updatedAt: Date.now(),
      }));
    } else {
      // Reset to fresh default accounts with zero balance
      cleanAccounts = DEFAULT_ACCOUNTS.map((a) => ({
        ...a,
        initialBalance: 0,
        balance: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
    }

    const resetState = {
      accounts: cleanAccounts,
      categories: this.memoryCache?.categories?.length ? this.memoryCache.categories : DEFAULT_CATEGORIES,
      people: [] as Person[],
      transactions: [] as Transaction[],
      budgets: [] as Budget[],
      recurring: [] as RecurringExpense[],
      reminders: [] as Reminder[],
      settings: this.memoryCache?.settings || DEFAULT_APP_SETTINGS,
    };

    this.memoryCache = resetState;
    this.saveAll(resetState);
  }

  public hasLastResetBackup(): boolean {
    try {
      const raw = localStorage.getItem('amh_last_reset_backup');
      return !!raw;
    } catch {
      return false;
    }
  }

  public getLastResetBackupInfo(): { timestamp: number; txCount: number; accountsCount: number } | null {
    try {
      const raw = localStorage.getItem('amh_last_reset_backup');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        timestamp: parsed.timestamp || 0,
        txCount: parsed.backup?.transactions?.length || 0,
        accountsCount: parsed.backup?.accounts?.length || 0,
      };
    } catch {
      return null;
    }
  }

  public restoreFromLastReset(): boolean {
    try {
      const raw = localStorage.getItem('amh_last_reset_backup');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed?.backup) {
        return this.importCompleteBackup(JSON.stringify(parsed.backup));
      }
      return false;
    } catch (e) {
      console.error('Failed to restore from last reset backup:', e);
      return false;
    }
  }

  // --- CONVENIENCE HELPERS ---
  public addParsedTransactions(drafts: ParsedItemDraft[]): Transaction[] {
    const created: Transaction[] = [];
    for (const d of drafts) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      // Resolve category
      let catId = d.categoryId;
      if (!catId && d.categoryName) {
        const foundCat = this.memoryCache?.categories.find(
          (c) => c.name.toLowerCase() === d.categoryName.toLowerCase() || c.nameBn === d.categoryName
        );
        catId = foundCat ? foundCat.id : 'cat_expense_other';
      }

      // Resolve source account
      let accId = d.accountId;
      if (!accId && d.accountName) {
        const foundAcc = this.memoryCache?.accounts.find(
          (a) => a.name.toLowerCase().includes(d.accountName.toLowerCase()) || (a.nameBn && a.nameBn.includes(d.accountName))
        );
        accId = foundAcc ? foundAcc.id : 'acc_cash';
      }

      // Resolve destination account
      let toAccId = d.toAccountId;
      if (!toAccId && d.toAccountName) {
        const foundTo = this.memoryCache?.accounts.find(
          (a) => a.name.toLowerCase().includes(d.toAccountName!.toLowerCase()) || (a.nameBn && a.nameBn.includes(d.toAccountName!))
        );
        toAccId = foundTo ? foundTo.id : undefined;
      }

      // Resolve person
      let pId = d.personId;
      if (!pId && d.personName) {
        const foundPerson = this.memoryCache?.people.find(
          (p) => p.name.toLowerCase().includes(d.personName!.toLowerCase())
        );
        if (foundPerson) {
          pId = foundPerson.id;
        } else {
          const newP = this.addPerson({ name: d.personName });
          pId = newP.id;
        }
      }

      const tx = this.addTransaction({
        amount: d.amount,
        type: d.type,
        categoryId: catId || 'cat_expense_other',
        subcategory: d.subcategory,
        accountId: accId || 'acc_cash',
        toAccountId: toAccId,
        personId: pId,
        date: d.date || now.toISOString().split('T')[0],
        time: timeStr,
        timestamp: Date.now(),
        description: d.description,
        notes: d.notes,
        status: 'completed',
        confidenceScore: d.confidenceScore,
        reminderId: d.matchedReminderId,
      });
      created.push(tx);
    }
    return created;
  }

  public transferBetweenAccounts(fromAccountId: string, toAccountId: string, amount: number, notes?: string): Transaction {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return this.addTransaction({
      amount,
      type: 'transfer',
      accountId: fromAccountId,
      toAccountId,
      date: now.toISOString().split('T')[0],
      time: timeStr,
      timestamp: Date.now(),
      description: notes || 'অ্যাকাউন্ট ব্যালেন্স স্থানান্তর',
      notes,
      status: 'completed',
    });
  }

  public recordPersonLoan(
    personId: string,
    type: 'money_given' | 'money_received' | 'payable' | 'receivable',
    amount: number,
    accountId: string,
    notes?: string,
    dueDate?: string
  ): Transaction {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const txType = type === 'payable' ? 'money_received' : type === 'receivable' ? 'money_given' : type;

    return this.addTransaction({
      amount,
      type: txType,
      accountId,
      personId,
      date: now.toISOString().split('T')[0],
      time: timeStr,
      timestamp: Date.now(),
      description: notes || (txType === 'money_given' ? 'ধার দেওয়া হলো' : 'ধার নেওয়া হলো'),
      notes,
      status: 'completed',
    });
  }

  public settlePersonBalance(personId: string, amount: number, accountId: string, notes?: string): Transaction {
    const person = this.memoryCache?.people.find((p) => p.id === personId);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // If person has net receivable (we are owed), receive money
    const isReceivable = (person?.currentReceivable || 0) > 0;
    const txType = isReceivable ? 'money_received' : 'money_given';

    return this.addTransaction({
      amount,
      type: txType,
      accountId,
      personId,
      date: now.toISOString().split('T')[0],
      time: timeStr,
      timestamp: Date.now(),
      description: notes || `হিসাব নিষ্পত্তি (${person?.name || ''})`,
      notes,
      status: 'completed',
    });
  }

  public payCreditCardBill(fromAccountId: string, creditCardAccountId: string, amount: number, notes?: string): Transaction {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return this.addTransaction({
      amount,
      type: 'credit_payment',
      accountId: fromAccountId,
      toAccountId: creditCardAccountId,
      date: now.toISOString().split('T')[0],
      time: timeStr,
      timestamp: Date.now(),
      description: notes || 'সিটি ব্যাংক ক্রেডিট কার্ড বিল পরিশোধ',
      notes,
      status: 'completed',
    });
  }

  public recordPersonLoanPayment(
    personId: string,
    amount: number,
    type: 'money_received' | 'money_given',
    accountId: string,
    notes?: string
  ): Transaction {
    const person = this.memoryCache?.people.find((p) => p.id === personId);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const desc =
      notes ||
      (type === 'money_received'
        ? `${person?.name || ''} পাওনা টাকা ফেরত দিয়েছে`
        : `${person?.name || ''}-কে দেনা পরিশোধ করা হলো`);

    return this.addTransaction({
      amount,
      type,
      accountId,
      personId,
      date: now.toISOString().split('T')[0],
      time: timeStr,
      timestamp: Date.now(),
      description: desc,
      notes,
      status: 'completed',
    });
  }

  public setCategoryBudget(categoryId: string, monthlyLimit: number, month = new Date().toISOString().substring(0, 7)): Budget {
    return this.setBudget(categoryId, month, monthlyLimit);
  }

  public exportFullDatabaseJSON(): string {
    return this.exportCompleteBackup();
  }

  public importFullDatabaseJSON(jsonString: string): boolean {
    return this.importCompleteBackup(jsonString);
  }

  public purgeAllDemoData(): void {
    if (!this.memoryCache) this.init();
    this.memoryCache!.transactions = (this.memoryCache!.transactions || []).filter(
      (t) => t.id && !t.id.startsWith('tx_init')
    );
    this.memoryCache!.people = (this.memoryCache!.people || []).filter(
      (p) => !['person_rakib', 'person_tanvir', 'person_shaheed'].includes(p.id)
    );
    this.memoryCache!.budgets = (this.memoryCache!.budgets || []).filter((b) => !b.id.startsWith('b_'));
    this.memoryCache!.recurring = (this.memoryCache!.recurring || []).filter((r) => !r.id.startsWith('rec_'));
    this.memoryCache!.reminders = (this.memoryCache!.reminders || []).filter((r) => !r.id.startsWith('rem_'));
    this.memoryCache!.accounts = (this.memoryCache!.accounts || []).map((a) => {
      if (['acc_cash', 'acc_bkash', 'acc_nagad', 'acc_bank_brac', 'acc_credit_card'].includes(a.id)) {
        if ([2220, 6350, 4200, 21000, 8000].includes(a.initialBalance)) {
          return { ...a, initialBalance: 0, balance: 0 };
        }
      }
      return a;
    });
    this.refreshBalances();
    this.saveAll(this.memoryCache!);
  }

  public resetDatabase(options?: { keepAccounts?: boolean }): void {
    this.resetAllData(options);
  }
}

export const db = new LocalDatabaseService();
