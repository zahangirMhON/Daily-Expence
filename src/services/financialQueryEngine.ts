import { Account, Category, Person, Transaction, Budget, Reminder, FinancialHealthMetrics, MonthlyCategoryStats } from '../types';
import { formatCurrency, formatNumber, formatDate, Language } from '../i18n';
import { parseBengaliNumber } from '../utils/accounting';

export interface AIActionContextButton {
  label: string;
  action: string;
  payload?: any;
  icon?: string;
}

export interface AIQueryResult {
  intent: string;
  headline: string;
  answerText: string;
  dataBreakdown?: { label: string; value: string; sub?: string }[];
  comparisonText?: string;
  actionButtons?: AIActionContextButton[];
  isDirectCalculation: boolean;
}

/**
 * Intelligent Local Financial Query & Intent Evaluation Engine
 * Answers natural language queries mathematically from live memory database without hallucination
 */
export function solveFinancialQuery(
  query: string,
  context: {
    accounts: Account[];
    transactions: Transaction[];
    people: Person[];
    categories: Category[];
    budgets: Budget[];
    reminders: Reminder[];
    metrics: FinancialHealthMetrics;
    categoryStats: MonthlyCategoryStats[];
    currentMonth?: string; // YYYY-MM
    lang?: Language;
  }
): AIQueryResult | null {
  const q = query.toLowerCase().trim();
  const lang = context.lang || 'bn';
  const now = new Date();
  const currentMonthStr = context.currentMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Safe arrays
  const safeTx = Array.isArray(context.transactions) ? context.transactions : [];
  const safePeople = Array.isArray(context.people) ? context.people : [];
  const safeCats = Array.isArray(context.categories) ? context.categories : [];
  const safeBudgets = Array.isArray(context.budgets) ? context.budgets : [];
  const safeReminders = Array.isArray(context.reminders) ? context.reminders : [];

  // Previous month string
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];

  const currentMonthTx = safeTx.filter(
    (t) => t && t.date && t.date.startsWith(currentMonthStr) && t.status !== 'pending'
  );
  const prevMonthTx = safeTx.filter(
    (t) => t && t.date && t.date.startsWith(prevMonthStr) && t.status !== 'pending'
  );

  // 1. Food / Dining / Bazaar Spending Query
  // “এই মাসে খাবারের পিছনে কত খরচ হয়েছে?”, “খাবারে কত খরচ”, “food expense”
  if (
    q.includes('খাবার') ||
    q.includes('খাবারে') ||
    q.includes('খাবার খরচ') ||
    q.includes('ফুড') ||
    q.includes('food') ||
    q.includes('বাজার') ||
    q.includes('মুদি') ||
    q.includes('রেস্তোরাঁ')
  ) {
    const isBazaarSpecific = q.includes('বাজার') && !q.includes('খাবার');
    const targetCatIds = isBazaarSpecific
      ? ['cat_exp_grocery']
      : ['cat_exp_food', 'cat_exp_grocery'];

    const matchedTx = currentMonthTx.filter(
      (t) =>
        (t.categoryId && targetCatIds.includes(t.categoryId)) ||
        t.description.toLowerCase().includes('খাবার') ||
        t.description.toLowerCase().includes('বাজার') ||
        t.description.toLowerCase().includes('রেস্তোরাঁ') ||
        t.description.toLowerCase().includes('নাস্তা')
    );

    const totalSpent = matchedTx.reduce((acc, t) => acc + (t.type === 'expense' || t.type === 'credit_purchase' ? t.amount : 0), 0);

    // Group by sub-categories or descriptions
    const breakdownMap = new Map<string, number>();
    matchedTx.forEach((t) => {
      const key = t.subcategory || t.description || (lang === 'bn' ? 'সাধারণ খাদ্য' : 'General Food');
      breakdownMap.set(key, (breakdownMap.get(key) || 0) + t.amount);
    });

    const breakdownItems = Array.from(breakdownMap.entries())
      .map(([label, val]) => ({
        label,
        value: formatCurrency(val, lang),
      }))
      .slice(0, 5);

    // Comparison with last month
    const prevSpent = prevMonthTx
      .filter((t) => targetCatIds.includes(t.categoryId || ''))
      .reduce((acc, t) => acc + (t.type === 'expense' || t.type === 'credit_purchase' ? t.amount : 0), 0);

    const diff = totalSpent - prevSpent;
    let comparison = '';
    if (prevSpent > 0) {
      if (diff > 0) {
        comparison = lang === 'bn'
          ? `গত মাসের তুলনায় এই খাতে ${formatCurrency(diff, lang)} বেশি খরচ হয়েছে।`
          : `You spent ${formatCurrency(diff, lang)} more than last month on this.`;
      } else if (diff < 0) {
        comparison = lang === 'bn'
          ? `গত মাসের তুলনায় এই খাতে ${formatCurrency(Math.abs(diff), lang)} সাশ্রয় হয়েছে।`
          : `You saved ${formatCurrency(Math.abs(diff), lang)} compared to last month.`;
      } else {
        comparison = lang === 'bn' ? 'গত মাসের খরচের সমান।' : 'Same spending as last month.';
      }
    }

    const titleBn = isBazaarSpecific ? 'বাজার ও মুদি সামগ্রী ব্যয়' : 'খাবার ও রেস্তোরাঁ সংক্রান্ত মোট ব্যয়';
    const titleEn = isBazaarSpecific ? 'Grocery & Bazaar Expenses' : 'Total Food & Dining Expenses';

    return {
      intent: 'category_expense_food',
      headline: lang === 'bn' ? `${titleBn}: ${formatCurrency(totalSpent, lang)}` : `${titleEn}: ${formatCurrency(totalSpent, lang)}`,
      answerText: lang === 'bn'
        ? `এই মাসে খাদ্য ও নিত্যপ্রয়োজনীয় খাতে মোট ${formatCurrency(totalSpent, lang)} ব্যয় হয়েছে। নিচে বিস্তারিত বিবরণ দেওয়া হলো:`
        : `You have spent a total of ${formatCurrency(totalSpent, lang)} on food & groceries this month:`,
      dataBreakdown: breakdownItems,
      comparisonText: comparison,
      actionButtons: [
        { label: lang === 'bn' ? 'বিস্তারিত লেনদেন' : 'View Transactions', action: 'NAV_TRANSACTIONS', payload: { categoryId: 'cat_exp_food' } },
        { label: lang === 'bn' ? 'এই মাসের রিপোর্ট' : 'Monthly Report', action: 'NAV_REPORTS' },
        { label: lang === 'bn' ? 'বাজেট সেট করুন' : 'Set Budget', action: 'NAV_BUDGET', payload: { categoryId: 'cat_exp_food' } },
      ],
      isDirectCalculation: true,
    };
  }

  // 2. Receivables / Who owes me money
  // “কার কাছে আমার কত টাকা পাওনা?”, “কার কাছ থেকে টাকা পাওয়ার কথা আছে?”, “পাওনা টাকা”, “who owes me”
  if (
    q.includes('পাওনা') ||
    q.includes('টাকা পাবো') ||
    q.includes('পাওয়ার কথা') ||
    q.includes('ধার দিয়েছি') ||
    q.includes('receivable') ||
    q.includes('who owes me')
  ) {
    const debtors = context.people.filter((p) => (p.currentReceivable || 0) > 0);
    const totalRec = debtors.reduce((acc, p) => acc + p.currentReceivable, 0);

    const breakdown = debtors.map((p) => ({
      label: p.name,
      value: formatCurrency(p.currentReceivable, lang),
      sub: p.phone ? `${p.phone}` : undefined,
    }));

    return {
      intent: 'receivables_list',
      headline: lang === 'bn' ? `মোট পাওনা টাকা: ${formatCurrency(totalRec, lang)}` : `Total Receivables: ${formatCurrency(totalRec, lang)}`,
      answerText: debtors.length > 0
        ? lang === 'bn'
          ? `আপনার মোট ${formatNumber(debtors.length, lang)} জনের কাছে ${formatCurrency(totalRec, lang)} পাওনা রয়েছে:`
          : `You have ${debtors.length} active debtors totaling ${formatCurrency(totalRec, lang)}:`
        : lang === 'bn'
        ? 'বর্তমানে কারো কাছে আপনার কোনো টাকা পাওনা নেই।'
        : 'You have no outstanding receivables.',
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'নতুন টাকা গ্রহণ যোগ করুন' : 'Record Received Money', action: 'OPEN_RECEIVE_MODAL' },
        { label: lang === 'bn' ? 'দেনা-পাওনা খতিয়ান' : 'Debts & Loans Ledger', action: 'NAV_PEOPLE' },
      ],
      isDirectCalculation: true,
    };
  }

  // 3. Payables / Who do I owe money to
  // “আমি কাকে টাকা দিতে হবে?”, “কার কাছে দেনা আছে?”, “আমার দেনা কত?”, “who do i owe”
  if (
    q.includes('কাকে টাকা দিতে হবে') ||
    q.includes('দেনা') ||
    q.includes('শোধ করতে হবে') ||
    q.includes('payable') ||
    q.includes('who i owe')
  ) {
    const creditors = context.people.filter((p) => (p.currentPayable || 0) > 0);
    const totalPay = creditors.reduce((acc, p) => acc + p.currentPayable, 0);

    const breakdown = creditors.map((p) => ({
      label: p.name,
      value: formatCurrency(p.currentPayable, lang),
    }));

    return {
      intent: 'payables_list',
      headline: lang === 'bn' ? `মোট দেনা টাকা: ${formatCurrency(totalPay, lang)}` : `Total Payables: ${formatCurrency(totalPay, lang)}`,
      answerText: creditors.length > 0
        ? lang === 'bn'
          ? `আপনার মোট ${formatNumber(creditors.length, lang)} জনের কাছে ${formatCurrency(totalPay, lang)} দেনা রয়েছে:`
          : `You owe ${creditors.length} people totaling ${formatCurrency(totalPay, lang)}:`
        : lang === 'bn'
        ? 'বর্তমানে আপনার কারো কাছে কোনো দেনা নেই।'
        : 'You currently have zero payables.',
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'টাকা পরিশোধ যোগ করুন' : 'Record Repayment', action: 'OPEN_PAY_MODAL' },
        { label: lang === 'bn' ? 'দেনা-পাওনা খতিয়ান' : 'Debts & Loans Ledger', action: 'NAV_PEOPLE' },
      ],
      isDirectCalculation: true,
    };
  }

  // 4. Upcoming Bills in Next 7 Days / Overdue Bills
  // “আগামী ৭ দিনে কোন কোন বিল দিতে হবে?”, “কোন কোন বিল এখনো দেওয়া হয়নি?”, “আসন্ন বিল”, “upcoming bills”
  if (
    q.includes('আগামী') ||
    q.includes('বিল দিতে হবে') ||
    q.includes('বিল এখনো দেওয়া হয়নি') ||
    q.includes('বকেয়া বিল') ||
    q.includes('রিমাইন্ডার') ||
    q.includes('upcoming bills') ||
    q.includes('bills due')
  ) {
    const pendingBills = context.reminders.filter((r) => r.status === 'pending');
    const totalPendingAmt = pendingBills.reduce((acc, r) => acc + r.amount, 0);

    const breakdown = pendingBills.map((r) => ({
      label: r.title,
      value: formatCurrency(r.amount, lang),
      sub: `${lang === 'bn' ? 'তারিখ:' : 'Due:'} ${formatDate(r.dueDate, lang)}`,
    }));

    return {
      intent: 'upcoming_bills',
      headline: lang === 'bn' ? `আসন্ন বকেয়া বিল: ${formatCurrency(totalPendingAmt, lang)}` : `Pending Bills: ${formatCurrency(totalPendingAmt, lang)}`,
      answerText: pendingBills.length > 0
        ? lang === 'bn'
          ? `আপনার ${formatNumber(pendingBills.length, lang)}টি বিল পরিশোধের জন্য অপেক্ষমান আছে:`
          : `You have ${pendingBills.length} pending bill reminders:`
        : lang === 'bn'
        ? 'এই মুহূর্তে কোনো বকেয়া বিল রিমাইন্ডার নেই।'
        : 'All bills are up to date! No pending reminders.',
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'বিল পরিশোধ করুন' : 'Pay Bills', action: 'NAV_BUDGET' },
        { label: lang === 'bn' ? 'নতুন বিল যোগ করুন' : 'Add Bill Reminder', action: 'OPEN_ADD_REMINDER' },
      ],
      isDirectCalculation: true,
    };
  }

  // 5. Total Balance & Assets / Cash + Bank
  // “আমার কাছে এখন মোট কত টাকা আছে?”, “আমার Cash আর Bank মিলিয়ে মোট কত?”, “মোট সম্পদ কত?”, “total balance”
  if (
    q.includes('মোট কত টাকা আছে') ||
    q.includes('মোট ব্যালেন্স') ||
    q.includes('cash আর bank') ||
    q.includes('ক্যাশ আর ব্যাংক') ||
    q.includes('মোট সম্পদ') ||
    q.includes('সব অ্যাকাউন্ট মিলিয়ে') ||
    q.includes('net worth') ||
    q.includes('total balance')
  ) {
    const m = context?.metrics || {
      totalCash: 0,
      totalBank: 0,
      totalMobileWallet: 0,
      totalCreditOutstanding: 0,
      totalPayable: 0,
      totalReceivable: 0,
      netWorth: 0,
    };
    const totalCash = m.totalCash || 0;
    const totalBank = m.totalBank || 0;
    const totalMobile = m.totalMobileWallet || 0;
    const totalLiabilities = (m.totalCreditOutstanding || 0) + (m.totalPayable || 0);
    const netWorth = m.netWorth || 0;

    const breakdown = [
      { label: lang === 'bn' ? 'নগদ ক্যাশ (Cash in Hand)' : 'Cash in Hand', value: formatCurrency(totalCash, lang) },
      { label: lang === 'bn' ? 'ব্যাংক ব্যালেন্স (Bank A/C)' : 'Bank Balances', value: formatCurrency(totalBank, lang) },
      { label: lang === 'bn' ? 'মোবাইল ওয়ালেট (bKash/Nagad)' : 'Mobile Wallets', value: formatCurrency(totalMobile, lang) },
      { label: lang === 'bn' ? 'পাওনা টাকা (Receivables)' : 'Total Receivables', value: formatCurrency(context.metrics.totalReceivable, lang) },
      { label: lang === 'bn' ? 'মোট দায় ও দেনা' : 'Liabilities & Dues', value: `-${formatCurrency(totalLiabilities, lang)}` },
    ];

    return {
      intent: 'total_net_worth',
      headline: lang === 'bn' ? `মোট নীট সম্পদ: ${formatCurrency(netWorth, lang)}` : `Net Liquid Assets: ${formatCurrency(netWorth, lang)}`,
      answerText: lang === 'bn'
        ? `আপনার সব অ্যাকাউন্ট ও ওয়ালেট মিলিয়ে মোট কার্যকর ব্যালেন্স ${formatCurrency(totalCash + totalBank + totalMobile, lang)} এবং নীট সম্পদ ${formatCurrency(netWorth, lang)}।`
        : `Your combined liquid balance is ${formatCurrency(totalCash + totalBank + totalMobile, lang)} and net worth is ${formatCurrency(netWorth, lang)}.`,
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'হিসাব ও ওয়ালেট দেখুন' : 'View Accounts', action: 'NAV_ACCOUNTS' },
        { label: lang === 'bn' ? 'টাকা স্থানান্তর' : 'Transfer Money', action: 'OPEN_TRANSFER_MODAL' },
      ],
      isDirectCalculation: true,
    };
  }

  // 6. Credit Card Due
  // “ক্রেডিট কার্ডে কত টাকা বাকি?”, “ক্রেডিট কার্ড বিল”, “credit card due”
  if (
    q.includes('ক্রেডিট কার্ড') ||
    q.includes('কার্ডে কত বাকি') ||
    q.includes('credit card') ||
    q.includes('card due')
  ) {
    const cardAccs = context.accounts.filter((a) => a.type === 'credit_card');
    const totalDue = cardAccs.reduce((acc, a) => acc + a.balance, 0);
    const totalAvailable = cardAccs.reduce((acc, a) => acc + (a.availableCredit || 0), 0);

    const breakdown = cardAccs.map((c) => ({
      label: c.nameBn || c.name,
      value: formatCurrency(c.balance, lang),
      sub: `${lang === 'bn' ? 'অবশিষ্ট লিমিট:' : 'Available:'} ${formatCurrency(c.availableCredit || 0, lang)}`,
    }));

    return {
      intent: 'credit_card_due',
      headline: lang === 'bn' ? `ক্রেডিট কার্ড মোট বকেয়া: ${formatCurrency(totalDue, lang)}` : `Credit Card Due: ${formatCurrency(totalDue, lang)}`,
      answerText: lang === 'bn'
        ? `আপনার ক্রেডিট কার্ডে বর্তমান বকেয়া বিল ${formatCurrency(totalDue, lang)} এবং ব্যবহারযোগ্য লিমিট ${formatCurrency(totalAvailable, lang)} রয়েছে।`
        : `Your total credit card outstanding is ${formatCurrency(totalDue, lang)} with ${formatCurrency(totalAvailable, lang)} available limit.`,
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'কার্ড বিল পরিশোধ করুন' : 'Pay Card Bill', action: 'OPEN_PAY_CARD_MODAL' },
        { label: lang === 'bn' ? 'অ্যাকাউন্ট ভিউ' : 'View Accounts', action: 'NAV_ACCOUNTS' },
      ],
      isDirectCalculation: true,
    };
  }

  // 7. Today's Expense
  // “আজকে আমি মোট কত টাকা খরচ করেছি?”, “আজকের খরচ”, “today expense”
  if (
    q.includes('আজকে') ||
    q.includes('আজকের খরচ') ||
    q.includes('today expense') ||
    q.includes('spent today')
  ) {
    const todayTx = safeTx.filter(
      (t) => t && t.date === todayStr && (t.type === 'expense' || t.type === 'credit_purchase') && t.status !== 'pending'
    );
    const totalToday = todayTx.reduce((acc, t) => acc + t.amount, 0);

    const breakdown = todayTx.map((t) => ({
      label: t.description || t.subcategory || (lang === 'bn' ? 'খরচ' : 'Expense'),
      value: formatCurrency(t.amount, lang),
      sub: t.paymentMethod || t.time,
    }));

    return {
      intent: 'today_expense',
      headline: lang === 'bn' ? `আজকের মোট ব্যয়: ${formatCurrency(totalToday, lang)}` : `Today's Expense: ${formatCurrency(totalToday, lang)}`,
      answerText: todayTx.length > 0
        ? lang === 'bn'
          ? `আজকে আপনি ${formatNumber(todayTx.length, lang)}টি লেনদেনে মোট ${formatCurrency(totalToday, lang)} খরচ করেছেন:`
          : `You have recorded ${todayTx.length} expenses today totaling ${formatCurrency(totalToday, lang)}:`
        : lang === 'bn'
        ? 'আজকে এখনও পর্যন্ত কোনো খরচের লেনদেন রেকর্ড করা হয়নি।'
        : 'No expenses recorded for today yet.',
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'নতুন লেনদেন যোগ' : 'Add Transaction', action: 'OPEN_ADD_TX_MODAL' },
        { label: lang === 'bn' ? 'লেনদেন খতিয়ান' : 'View Ledger', action: 'NAV_TRANSACTIONS' },
      ],
      isDirectCalculation: true,
    };
  }

  // 8. Month Income & Expense Summary
  // “এই মাসে আমার আয় কত এবং ব্যয় কত?”, “এই মাসের হিসাব”, “monthly income and expense”
  if (
    (q.includes('আয় কত') && q.includes('ব্যয় কত')) ||
    q.includes('এই মাসের আয়') ||
    q.includes('এই মাসের খরচ') ||
    q.includes('মাসিক হিসাব')
  ) {
    const income = context.metrics.monthIncome;
    const expense = context.metrics.monthExpense;
    const savings = context.metrics.monthSavings;
    const rate = context.metrics.savingsRate;

    const breakdown = [
      { label: lang === 'bn' ? 'মোট আয় (Income)' : 'Total Income', value: formatCurrency(income, lang) },
      { label: lang === 'bn' ? 'মোট ব্যয় (Expense)' : 'Total Expense', value: formatCurrency(expense, lang) },
      { label: lang === 'bn' ? 'নীট সঞ্চয় (Savings)' : 'Net Savings', value: formatCurrency(savings, lang) },
      { label: lang === 'bn' ? 'সঞ্চয়ের হার' : 'Savings Rate', value: `${formatNumber(Math.round(rate), lang)}%` },
    ];

    return {
      intent: 'monthly_summary',
      headline: lang === 'bn' ? `এই মাসের সঞ্চয়: ${formatCurrency(savings, lang)}` : `Monthly Net Savings: ${formatCurrency(savings, lang)}`,
      answerText: lang === 'bn'
        ? `এই মাসে আপনার মোট আয় ${formatCurrency(income, lang)} এবং মোট ব্যয় ${formatCurrency(expense, lang)}। আপনার সঞ্চয়ের হার ${formatNumber(Math.round(rate), lang)}%।`
        : `This month, your total income is ${formatCurrency(income, lang)} and expenses are ${formatCurrency(expense, lang)}. Savings rate is ${Math.round(rate)}%.`,
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'মাসিক রিপোর্ট দেখুন' : 'View Monthly Report', action: 'NAV_REPORTS' },
        { label: lang === 'bn' ? 'বাজেট পরিচালনা' : 'Manage Budget', action: 'NAV_BUDGET' },
      ],
      isDirectCalculation: true,
    };
  }

  // 9. Budget Exceeded / Usage
  // “এই মাসে আমার বাজেট কোথায় বেশি ব্যবহার হয়েছে?”, “বাজেট কত বাকি”, “budget usage”
  if (
    q.includes('বাজেট') ||
    q.includes('budget')
  ) {
    const exceeded = context.categoryStats.filter((c) => (c.budgetUsedPercentage || 0) > 100);
    const nearLimit = context.categoryStats.filter(
      (c) => (c.budgetUsedPercentage || 0) >= 80 && (c.budgetUsedPercentage || 0) <= 100
    );

    const breakdown = context.categoryStats
      .filter((c) => c.budgetAllocated && c.budgetAllocated > 0)
      .map((c) => ({
        label: c.categoryNameBn || c.categoryName,
        value: `${formatCurrency(c.amount, lang)} / ${formatCurrency(c.budgetAllocated || 0, lang)}`,
        sub: `${formatNumber(Math.round(c.budgetUsedPercentage || 0), lang)}% ${lang === 'bn' ? 'ব্যবহার' : 'used'}`,
      }));

    return {
      intent: 'budget_status',
      headline: exceeded.length > 0
        ? lang === 'bn'
          ? `সতর্কতা: ${formatNumber(exceeded.length, lang)}টি খাতে বাজেট অতিক্রম করেছে!`
          : `Alert: ${exceeded.length} categories exceeded budget!`
        : lang === 'bn'
        ? 'বাজেট নিয়ন্ত্রণে আছে!'
        : 'All budgets are on track!',
      answerText: exceeded.length > 0
        ? lang === 'bn'
          ? `নিম্নলিখিত খাতগুলোতে নির্ধারিত বাজেটের চেয়ে বেশি ব্যয় হয়েছে:`
          : `The following categories have exceeded their allocated monthly budget limits:`
        : lang === 'bn'
        ? 'আপনার সমস্ত খরচের খাত নির্ধারিত বাজেট সীমার ভেতরে রয়েছে।'
        : 'All category expenses are well within their allocated thresholds.',
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'বাজেট সমন্বয় করুন' : 'Adjust Budgets', action: 'NAV_BUDGET' },
        { label: lang === 'bn' ? 'খরচের রিপোর্ট' : 'Expense Reports', action: 'NAV_REPORTS' },
      ],
      isDirectCalculation: true,
    };
  }

  // 10. Savings Target / Advice Query
  // “আমি যদি আগামী মাসে ১০ হাজার টাকা সঞ্চয় করতে চাই তাহলে কোথায় খরচ কমানো উচিত?”
  if (
    q.includes('সঞ্চয় করতে চাই') ||
    q.includes('খরচ কমানো') ||
    q.includes('savings advice') ||
    q.includes('save money')
  ) {
    const topExp = [...context.categoryStats]
      .filter((c) => c.categoryId !== 'cat_exp_rent') // rent is fixed
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const breakdown = topExp.map((c) => ({
      label: c.categoryNameBn || c.categoryName,
      value: formatCurrency(c.amount, lang),
      sub: lang === 'bn' ? `২০% কমালে সাশ্রয় হবে ${formatCurrency(c.amount * 0.2, lang)}` : `20% cut saves ${formatCurrency(c.amount * 0.2, lang)}`,
    }));

    return {
      intent: 'savings_advice',
      headline: lang === 'bn' ? 'এআই সঞ্চয় পরামর্শ ও বাজেট পরিকল্পনা' : 'AI Savings Guidance & Plan',
      answerText: lang === 'bn'
        ? `আপনার চলতি মাসের ব্যয়ের প্যাটার্ন অনুযায়ী এই ৩টি পরিবর্তনশীল খাতে নিয়ন্ত্রণ এনে সহজেই সঞ্চয় বাড়ানো সম্ভব:`
        : `Based on your recent transaction history, reducing spend in these 3 flexible categories will maximize savings:`,
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'বাজেট সেট করুন' : 'Set Budgets', action: 'NAV_BUDGET' },
        { label: lang === 'bn' ? 'পূর্ণাঙ্গ রিপোর্ট দেখুন' : 'View Full Report', action: 'NAV_REPORTS' },
      ],
      isDirectCalculation: true,
    };
  }

  // 11. Highest Balance Account
  // “আমার সবচেয়ে বেশি টাকা কোন অ্যাকাউন্টে আছে?”
  if (
    q.includes('সবচেয়ে বেশি টাকা') ||
    q.includes('কোন অ্যাকাউন্টে') ||
    q.includes('highest balance')
  ) {
    const nonCredit = context.accounts.filter((a) => a.type !== 'credit_card');
    const sorted = [...nonCredit].sort((a, b) => b.balance - a.balance);
    const topAcc = sorted[0];

    return {
      intent: 'top_account',
      headline: topAcc
        ? `${topAcc.nameBn || topAcc.name}: ${formatCurrency(topAcc.balance, lang)}`
        : 'No accounts found',
      answerText: topAcc
        ? lang === 'bn'
          ? `আপনার সবচেয়ে বেশি ব্যালেন্স রয়েছে "${topAcc.nameBn || topAcc.name}" অ্যাকাউন্টে (${formatCurrency(topAcc.balance, lang)})।`
          : `Your highest balance account is "${topAcc.name}" with ${formatCurrency(topAcc.balance, lang)}.`
        : 'No active accounts found.',
      actionButtons: [{ label: lang === 'bn' ? 'হিসাব ও ওয়ালেট' : 'View Accounts', action: 'NAV_ACCOUNTS' }],
      isDirectCalculation: true,
    };
  }

  // 12. Search specific Person by Name
  // “রাকিবকে শেষ কবে টাকা দিয়েছিলাম?”, “রাকিব”
  const matchedPerson = safePeople.find((p) => p && p.name && q.includes(p.name.toLowerCase()));
  if (matchedPerson) {
    const pTx = safeTx
      .filter((t) => t && t.personId === matchedPerson.id)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const breakdown = [
      { label: lang === 'bn' ? 'মোট ধার দেওয়া' : 'Total Given', value: formatCurrency(matchedPerson.totalGiven, lang) },
      { label: lang === 'bn' ? 'মোট ফেরত পাওয়া' : 'Total Received', value: formatCurrency(matchedPerson.totalReceived, lang) },
      { label: lang === 'bn' ? 'বর্তমান পাওনা' : 'Current Receivable', value: formatCurrency(matchedPerson.currentReceivable, lang) },
    ];

    const lastTx = pTx[0];
    const lastTxText = lastTx
      ? lang === 'bn'
        ? `সর্বশেষ লেনদেন: ${formatDate(lastTx.date, lang)} তারিখে ${formatCurrency(lastTx.amount, lang)} (${lastTx.description})।`
        : `Last transaction: ${formatDate(lastTx.date, lang)} for ${formatCurrency(lastTx.amount, lang)} (${lastTx.description}).`
      : '';

    return {
      intent: 'person_khotiyan',
      headline: `${matchedPerson.name} — ${lang === 'bn' ? 'পাওনা স্থিতি:' : 'Receivable:'} ${formatCurrency(matchedPerson.currentReceivable, lang)}`,
      answerText: `${matchedPerson.name} এর সাথে মোট লেনদেনের সারাংশ: ${lastTxText}`,
      dataBreakdown: breakdown,
      actionButtons: [
        { label: lang === 'bn' ? 'টাকা গ্রহণ যোগ' : 'Receive Payment', action: 'OPEN_RECEIVE_MODAL', payload: { personId: matchedPerson.id } },
        { label: lang === 'bn' ? 'সম্পূর্ণ খতিয়ান' : 'View Ledger', action: 'NAV_PEOPLE', payload: { personId: matchedPerson.id } },
      ],
      isDirectCalculation: true,
    };
  }

  return null;
}
