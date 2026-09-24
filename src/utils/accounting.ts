import { Account, Category, Person, Transaction, Budget, FinancialHealthMetrics, MonthlyCategoryStats, MonthlyAccountStats } from '../types';

/**
 * Converts Bengali digits (০-৯) to English digits (0-9) and standardizes number parsing.
 */
export function parseBengaliNumber(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let str = String(val).trim();
  for (let i = 0; i < 10; i++) {
    str = str.replaceAll(bnDigits[i], String(i));
  }
  // Remove commas, currency symbols, and extra spaces
  str = str.replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a number in Bengali currency or English currency format.
 */
export function formatCurrency(
  amount: number,
  options: { symbol?: string; showPlus?: boolean; compact?: boolean; bnDigits?: boolean } = {}
): string {
  const { symbol = '৳', showPlus = false, compact = false, bnDigits = false } = options;
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted = '';
  if (compact && abs >= 10000000) {
    formatted = (abs / 10000000).toFixed(2) + ' Cr';
  } else if (compact && abs >= 100000) {
    formatted = (abs / 100000).toFixed(2) + ' Lakh';
  } else if (compact && abs >= 1000) {
    formatted = (abs / 1000).toFixed(1) + 'k';
  } else {
    formatted = abs.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }

  if (bnDigits) {
    const bnDigitsMap = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    formatted = formatted.replace(/[0-9]/g, (d) => bnDigitsMap[parseInt(d, 10)]);
  }

  const prefix = isNegative ? '-' : showPlus && amount > 0 ? '+' : '';
  return `${prefix}${symbol}${formatted}`;
}

/**
 * Converts English number to Bengali digits string
 */
export function toBengaliDigits(num: number | string): string {
  const bnDigitsMap = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigitsMap[parseInt(d, 10)]);
}

/**
 * Checks if transaction counts towards user's real Income
 */
export function isIncomeTransaction(tx: Transaction): boolean {
  return tx.type === 'income';
}

/**
 * Checks if transaction counts towards user's real Expense
 * Note: transfers, credit card payments, loans given/received do NOT count as standard expenses
 */
export function isExpenseTransaction(tx: Transaction): boolean {
  return tx.type === 'expense' || tx.type === 'credit_purchase';
}

/**
 * Recalculates live balances for all accounts and people based on base accounts and complete transaction ledger.
 */
export function recalculateLedgerState(
  initialAccounts: Account[] = [],
  initialPeople: Person[] = [],
  transactions: Transaction[] = []
): {
  recalculatedAccounts: Account[];
  recalculatedPeople: Person[];
} {
  const safeAccounts = Array.isArray(initialAccounts) ? initialAccounts : [];
  const safePeople = Array.isArray(initialPeople) ? initialPeople : [];
  const safeTx = Array.isArray(transactions) ? transactions : [];

  // Map accounts to track live balance
  const accountMap = new Map<string, Account>();
  safeAccounts.forEach((acc) => {
    // Start from account's explicit initial opening balance, or 0
    const opening = typeof acc.initialBalance === 'number' ? acc.initialBalance : (Number(acc.balance) || 0);
    accountMap.set(acc.id, {
      ...acc,
      initialBalance: opening,
      balance: opening,
      availableCredit:
        acc.type === 'credit_card' && acc.creditLimit
          ? Math.max(0, (acc.creditLimit || 0) - opening)
          : acc.creditLimit || 0,
    });
  });

  // Map people to track loan debts
  const personMap = new Map<string, Person>();
  safePeople.forEach((p) => {
    personMap.set(p.id, {
      ...p,
      totalGiven: 0,
      totalReceived: 0,
      currentReceivable: 0,
      totalBorrowed: 0,
      totalRepaid: 0,
      currentPayable: 0,
    });
  });

  // Sort chronologically
  const sortedTx = [...safeTx].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  for (const tx of sortedTx) {
    if (!tx || tx.status === 'pending') continue; // only completed/cleared affect live ledger

    const amount = Number(tx.amount) || 0;
    const sourceAcc = accountMap.get(tx.accountId);
    const destAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;
    const person = tx.personId ? personMap.get(tx.personId) : undefined;

    switch (tx.type) {
      case 'income':
      case 'deposit':
        if (sourceAcc) {
          sourceAcc.balance += amount;
        }
        break;

      case 'expense':
        if (sourceAcc) {
          if (sourceAcc.type === 'credit_card') {
            // Credit card expense increases outstanding liability
            sourceAcc.balance += amount;
            if (sourceAcc.creditLimit) {
              sourceAcc.availableCredit = Math.max(0, (sourceAcc.creditLimit || 0) - sourceAcc.balance);
            }
          } else {
            sourceAcc.balance -= amount;
          }
        }
        break;

      case 'credit_purchase':
        if (sourceAcc) {
          sourceAcc.balance += amount; // Increases outstanding bill
          if (sourceAcc.creditLimit) {
            sourceAcc.availableCredit = Math.max(0, (sourceAcc.creditLimit || 0) - sourceAcc.balance);
          }
        }
        break;

      case 'credit_payment':
        // Paying credit card: sourceAcc pays (bank/cash reduces), destAcc (credit card) outstanding reduces
        if (sourceAcc) {
          sourceAcc.balance -= amount;
        }
        if (destAcc && destAcc.type === 'credit_card') {
          destAcc.balance = Math.max(0, destAcc.balance - amount);
          if (destAcc.creditLimit) {
            destAcc.availableCredit = Math.min(destAcc.creditLimit, (destAcc.creditLimit || 0) - destAcc.balance);
          }
        } else if (sourceAcc && sourceAcc.type === 'credit_card') {
          // If source account itself was selected as the card being paid
          sourceAcc.balance = Math.max(0, sourceAcc.balance - amount);
          if (sourceAcc.creditLimit) {
            sourceAcc.availableCredit = Math.min(sourceAcc.creditLimit, (sourceAcc.creditLimit || 0) - sourceAcc.balance);
          }
        }
        break;

      case 'transfer':
      case 'withdrawal':
        if (sourceAcc) {
          sourceAcc.balance -= amount;
        }
        if (destAcc) {
          destAcc.balance += amount;
        }
        break;

      case 'debt_payment':
        // Explicit debt payment: money given to creditor reduces our cash and reduces our payable debt
        if (sourceAcc) {
          sourceAcc.balance -= amount;
        }
        if (person) {
          person.totalRepaid += amount;
          person.currentPayable = Math.max(0, person.totalBorrowed - person.totalRepaid);
        }
        break;

      case 'money_given':
      case 'receivable':
        // Money given to a person reduces cash/bank
        if (sourceAcc) {
          sourceAcc.balance -= amount;
        }
        if (person) {
          const isPayingDebt =
            (person.currentPayable > 0 && person.currentReceivable <= 0) ||
            tx.description?.includes('দেনা') ||
            tx.description?.includes('ধার শোধ') ||
            tx.description?.includes('পরিশোধ') ||
            tx.notes?.includes('দেনা') ||
            tx.notes?.includes('পরিশোধ');

          if (isPayingDebt) {
            person.totalRepaid += amount;
            person.currentPayable = Math.max(0, person.totalBorrowed - person.totalRepaid);
          } else {
            person.totalGiven += amount;
            person.currentReceivable = Math.max(0, person.totalGiven - person.totalReceived);
          }
        }
        break;

      case 'money_received':
        // Money received increases cash/bank
        if (sourceAcc) {
          sourceAcc.balance += amount;
        }
        if (person) {
          const isBorrowing =
            tx.description?.includes('ধার নিলাম') ||
            tx.description?.includes('ধার নেওয়া') ||
            tx.notes?.includes('ধার নিলাম');

          if (isBorrowing) {
            person.totalBorrowed += amount;
            person.currentPayable = Math.max(0, person.totalBorrowed - person.totalRepaid);
          } else {
            person.totalReceived += amount;
            person.currentReceivable = Math.max(0, person.totalGiven - person.totalReceived);
          }
        }
        break;

      case 'payable':
        // Money borrowed from someone increases our cash/bank and creates payable debt
        if (sourceAcc) {
          sourceAcc.balance += amount;
        }
        if (person) {
          person.totalBorrowed += amount;
          person.currentPayable = Math.max(0, person.totalBorrowed - person.totalRepaid);
        }
        break;

      case 'refund':
        // Refund gives money back to account
        if (sourceAcc) {
          if (sourceAcc.type === 'credit_card') {
            sourceAcc.balance = Math.max(0, sourceAcc.balance - amount);
          } else {
            sourceAcc.balance += amount;
          }
        }
        break;

      case 'adjustment':
        if (sourceAcc) {
          sourceAcc.balance += amount; // can be positive or negative
        }
        break;
    }
  }

  return {
    recalculatedAccounts: Array.from(accountMap.values()),
    recalculatedPeople: Array.from(personMap.values()),
  };
}

/**
 * Calculates current Financial Health Dashboard metrics
 */
export function calculateFinancialMetrics(
  accounts: Account[] = [],
  people: Person[] = [],
  transactions: Transaction[] = [],
  targetDate: Date = new Date()
): FinancialHealthMetrics {
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safePeople = Array.isArray(people) ? people : [];
  const safeTx = Array.isArray(transactions) ? transactions : [];

  const targetYear = targetDate.getFullYear();
  const targetMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
  const targetMonthStr = `${targetYear}-${targetMonth}`;
  const targetDayStr = targetDate.toISOString().split('T')[0];

  let todayIncome = 0;
  let todayExpense = 0;
  let monthIncome = 0;
  let monthExpense = 0;

  for (const tx of safeTx) {
    if (!tx || tx.status === 'pending') continue;
    const amount = Number(tx.amount) || 0;
    const txDate = tx.date || '';
    const txMonth = txDate.substring(0, 7);

    // Income
    if (tx.type === 'income') {
      if (txMonth === targetMonthStr) monthIncome += amount;
      if (txDate === targetDayStr) todayIncome += amount;
    }

    // Expense & Credit purchase
    if (tx.type === 'expense' || tx.type === 'credit_purchase') {
      if (txMonth === targetMonthStr) monthExpense += amount;
      if (txDate === targetDayStr) todayExpense += amount;
    }

    // Refund reduces expense
    if (tx.type === 'refund') {
      if (txMonth === targetMonthStr) monthExpense = Math.max(0, monthExpense - amount);
      if (txDate === targetDayStr) todayExpense = Math.max(0, todayExpense - amount);
    }
  }

  const todayNet = todayIncome - todayExpense;
  const monthSavings = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? Math.max(0, (monthSavings / monthIncome) * 100) : 0;

  let totalCash = 0;
  let totalBank = 0;
  let totalMobileWallet = 0;
  let totalCreditOutstanding = 0;

  for (const acc of safeAccounts) {
    if (!acc || acc.isArchived) continue;
    if (acc.type === 'cash') {
      totalCash += acc.balance || 0;
    } else if (acc.type === 'bank' || acc.type === 'debit_card') {
      totalBank += acc.balance || 0;
    } else if (acc.type === 'bkash' || acc.type === 'nagad' || acc.type === 'rocket' || acc.type === 'upay') {
      totalMobileWallet += acc.balance || 0;
    } else if (acc.type === 'credit_card') {
      totalCreditOutstanding += acc.balance || 0; // balance on credit card = outstanding
    } else {
      totalCash += acc.balance || 0;
    }
  }

  let totalReceivable = 0;
  let totalPayable = 0;
  for (const p of safePeople) {
    if (!p) continue;
    totalReceivable += p.currentReceivable || 0;
    totalPayable += p.currentPayable || 0;
  }

  // Net worth = (Cash + Bank + Mobile Wallets + Receivables) - (Credit Card Outstanding + Payables)
  const totalAssets = totalCash + totalBank + totalMobileWallet + totalReceivable;
  const totalLiabilities = totalCreditOutstanding + totalPayable;
  const netWorth = totalAssets - totalLiabilities;

  return {
    todayIncome,
    todayExpense,
    todayNet,
    monthIncome,
    monthExpense,
    monthSavings,
    savingsRate,
    totalCash,
    totalBank,
    totalMobileWallet,
    totalCreditOutstanding,
    totalReceivable,
    totalPayable,
    netWorth,
  };
}

/**
 * Calculates monthly breakdown per category including budget usage
 */
export function calculateMonthlyCategoryStats(
  transactions: Transaction[] = [],
  categories: Category[] = [],
  budgets: Budget[] = [],
  monthStr: string = new Date().toISOString().substring(0, 7) // YYYY-MM
): {
  expenseStats: MonthlyCategoryStats[];
  incomeStats: MonthlyCategoryStats[];
  totalExpense: number;
  totalIncome: number;
} {
  const safeTx = Array.isArray(transactions) ? transactions : [];
  const safeCats = Array.isArray(categories) ? categories : [];
  const safeBudgets = Array.isArray(budgets) ? budgets : [];

  const monthTx = safeTx.filter(
    (tx) => tx && tx.date && tx.date.startsWith(monthStr) && tx.status !== 'pending'
  );

  const categoryMap = new Map<string, Category>();
  safeCats.forEach((c) => {
    if (c) categoryMap.set(c.id, c);
  });

  const budgetMap = new Map<string, Budget>();
  safeBudgets
    .filter((b) => b && b.month === monthStr)
    .forEach((b) => budgetMap.set(b.categoryId, b));

  const expenseCategoryTotals = new Map<string, { amount: number; count: number }>();
  const incomeCategoryTotals = new Map<string, { amount: number; count: number }>();

  let totalExpense = 0;
  let totalIncome = 0;

  for (const tx of monthTx) {
    const amt = Number(tx.amount) || 0;
    const catId = tx.categoryId || 'cat_exp_other';

    if (tx.type === 'expense' || tx.type === 'credit_purchase') {
      totalExpense += amt;
      const current = expenseCategoryTotals.get(catId) || { amount: 0, count: 0 };
      expenseCategoryTotals.set(catId, {
        amount: current.amount + amt,
        count: current.count + 1,
      });
    } else if (tx.type === 'income') {
      totalIncome += amt;
      const current = incomeCategoryTotals.get(catId) || { amount: 0, count: 0 };
      incomeCategoryTotals.set(catId, {
        amount: current.amount + amt,
        count: current.count + 1,
      });
    } else if (tx.type === 'refund') {
      totalExpense = Math.max(0, totalExpense - amt);
      const current = expenseCategoryTotals.get(catId);
      if (current) {
        expenseCategoryTotals.set(catId, {
          amount: Math.max(0, current.amount - amt),
          count: current.count,
        });
      }
    }
  }

  const expenseStats: MonthlyCategoryStats[] = [];
  expenseCategoryTotals.forEach(({ amount, count }, catId) => {
    const cat = categoryMap.get(catId) || {
      id: catId,
      name: 'Other',
      nameBn: 'অন্যান্য',
      color: '#64748B',
      icon: 'HelpCircle',
    };
    const b = budgetMap.get(catId);
    const budgetAllocated = b ? b.allocatedAmount : undefined;
    const budgetUsedPercentage = budgetAllocated && budgetAllocated > 0
      ? (amount / budgetAllocated) * 100
      : undefined;

    expenseStats.push({
      categoryId: catId,
      categoryName: cat.name,
      categoryNameBn: cat.nameBn,
      color: cat.color,
      icon: cat.icon,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      budgetAllocated,
      budgetUsedPercentage,
      transactionCount: count,
    });
  });

  const incomeStats: MonthlyCategoryStats[] = [];
  incomeCategoryTotals.forEach(({ amount, count }, catId) => {
    const cat = categoryMap.get(catId) || {
      id: catId,
      name: 'Other Income',
      nameBn: 'অন্যান্য আয়',
      color: '#10B981',
      icon: 'PlusCircle',
    };

    incomeStats.push({
      categoryId: catId,
      categoryName: cat.name,
      categoryNameBn: cat.nameBn,
      color: cat.color,
      icon: cat.icon,
      amount,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
      transactionCount: count,
    });
  });

  expenseStats.sort((a, b) => b.amount - a.amount);
  incomeStats.sort((a, b) => b.amount - a.amount);

  return {
    expenseStats,
    incomeStats,
    totalExpense,
    totalIncome,
  };
}
