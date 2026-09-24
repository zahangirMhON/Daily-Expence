import {
  AIParseResponse,
  FinancialHealthMetrics,
  MonthlyCategoryStats,
  Budget,
  Account,
  Person,
  Reminder,
  Transaction,
  Category,
} from '../types';
import { parseTransactionLocally } from './offlineParser';
import { solveFinancialQuery, AIQueryResult } from './financialQueryEngine';
import { Language } from '../i18n';

export async function parseFinancialPrompt(
  prompt: string,
  context: {
    accounts: Account[];
    categories: Category[];
    people: Person[];
    reminders: Reminder[];
  }
): Promise<AIParseResponse> {
  try {
    const res = await fetch('/api/ai/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        accounts: context.accounts,
        categories: context.categories,
        people: context.people,
        reminders: context.reminders,
        currentDate: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        return data as AIParseResponse;
      }
    }
  } catch (err) {
    console.warn('Backend AI parser offline or unavailable, falling back to local engine:', err);
  }

  // Seamless offline fallback
  return parseTransactionLocally(
    prompt,
    context.categories,
    context.accounts,
    context.people,
    context.reminders
  );
}

export async function getMonthlyAIAnalysis(
  month: string,
  metrics: FinancialHealthMetrics,
  categoryStats: MonthlyCategoryStats[],
  budgets: Budget[],
  transactionsSample: Transaction[] = [],
  lang: Language = 'bn'
): Promise<{
  overviewBn: string;
  healthScore: number;
  topSpendingInsightsBn: string[];
  anomaliesAndWasteBn: string[];
  budgetScoreBn: string;
  savingsAdviceBn: string[];
}> {
  const safeTxSample = Array.isArray(transactionsSample) ? transactionsSample : [];
  const safeCatStats = Array.isArray(categoryStats) ? categoryStats : [];
  const safeBudgets = Array.isArray(budgets) ? budgets : [];

  try {
    const res = await fetch('/api/ai/monthly-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month,
        metrics,
        categoryStats: safeCatStats,
        budgets: safeBudgets,
        transactionsSample: safeTxSample.slice(0, 15),
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend monthly AI analysis error:', err);
  }

  // Local rule-based financial advice generator if offline
  const topCategories = [...categoryStats].sort((a, b) => b.amount - a.amount).slice(0, 3);
  const healthScore = Math.min(100, Math.max(30, Math.round((metrics.savingsRate || 0) * 1.5 + 40)));

  if (lang === 'en') {
    return {
      overviewBn: `This month, your total income is ৳${metrics.monthIncome.toLocaleString()} and expenses are ৳${metrics.monthExpense.toLocaleString()}. Current savings rate is ${metrics.savingsRate.toFixed(1)}%.`,
      healthScore,
      topSpendingInsightsBn: topCategories.map(
        (c) => `${c.categoryName}: ৳${c.amount.toLocaleString()} (${c.percentage.toFixed(1)}% of total)`
      ),
      anomaliesAndWasteBn: [
        'Trimming small dining & cafe expenses could save you around ৳2,000–৳3,000 monthly.',
        'Settle credit card balances within the grace period to avoid interest charges.',
      ],
      budgetScoreBn:
        categoryStats.some((c) => (c.budgetUsedPercentage || 0) > 100)
          ? 'Some categories exceeded budget limits. Consider adjusting next month’s limits.'
          : 'You are well within allocated budget limits across all categories. Great discipline!',
      savingsAdviceBn: [
        'Transfer at least 20% of your income to a dedicated emergency/savings account on payday.',
        'Set a weekly ceiling for groceries and bazaar shopping.',
        'Review recurring monthly bills and subscriptions.',
      ],
    };
  }

  return {
    overviewBn: `এই মাসে আপনার মোট আয় ৳${metrics.monthIncome.toLocaleString()} এবং মোট ব্যয় ৳${metrics.monthExpense.toLocaleString()}। আপনার বর্তমান সঞ্চয় হার ${metrics.savingsRate.toFixed(1)}%।`,
    healthScore,
    topSpendingInsightsBn: topCategories.map(
      (c) => `${c.categoryNameBn || c.categoryName}: ৳${c.amount.toLocaleString()} (${c.percentage.toFixed(1)}% ব্যয়)`
    ),
    anomaliesAndWasteBn: [
      'খাবার ও রেস্তোরাঁ খাতে অপ্রয়োজনীয় ছোট ছোট খরচ নিয়ন্ত্রণ করলে মাসে প্রায় ২,০০০-৩,০০০ টাকা সাশ্রয় সম্ভব।',
      'ক্রেডিট কার্ড ব্যবহারের ক্ষেত্রে ৩০ দিনের মধ্যে পরিশোধের চেষ্টা করুন যেন অতিরিক্ত সুদ চার্জ না হয়।',
    ],
    budgetScoreBn:
      categoryStats.some((c) => (c.budgetUsedPercentage || 0) > 100)
        ? 'কিছু ক্যাটাগরিতে বাজেটের অতিরিক্ত খরচ হয়েছে। পরবর্তী মাসের জন্য বাজেট পুনরায় নির্ধারণ করুন।'
        : 'আপনি বেশিরভাগ ক্যাটাগরিতে বাজেটের সীমার মধ্যে অবস্থান করছেন। চমৎকার শৃঙ্খলা!',
    savingsAdviceBn: [
      'মাসিক আয়ের অন্তত ২০% শুরুতেই আলাদা সেভিংস বা সঞ্চয় অ্যাকাউন্টে সরিয়ে রাখুন।',
      'বাজার ও মুদি খরচের জন্য প্রতি সপ্তাহে নির্দিষ্ট লিমিট মেনে কেনাকাটা করুন।',
      'অব্যবহৃত সাবস্ক্রিপশন বা অতিরিক্ত মোবাইল রিচার্জ মনিটর করুন।',
    ],
  };
}

export async function askAIAssistantDetailed(
  message: string,
  context: {
    accounts: Account[];
    recentTransactions: Transaction[];
    metrics: FinancialHealthMetrics;
    people: Person[];
    budgets: Budget[];
    reminders: Reminder[];
    categories: Category[];
    categoryStats: MonthlyCategoryStats[];
    lang?: Language;
  }
): Promise<AIQueryResult> {
  const lang = context.lang || 'bn';

  // 1. Direct mathematical solver first
  const solved = solveFinancialQuery(message, {
    accounts: context.accounts,
    transactions: context.recentTransactions,
    people: context.people,
    categories: context.categories,
    budgets: context.budgets,
    reminders: context.reminders,
    metrics: context.metrics,
    categoryStats: context.categoryStats,
    lang,
  });

  if (solved) {
    return solved;
  }

  // 2. Try Gemini API backend
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.reply) {
        return {
          intent: 'gemini_response',
          headline: lang === 'bn' ? 'এআই সহকারীর উত্তর' : 'AI Assistant Reply',
          answerText: data.reply,
          isDirectCalculation: false,
          actionButtons: [
            { label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', action: 'NAV_DASHBOARD' },
            { label: lang === 'bn' ? 'লেনদেন যোগ' : 'Add Transaction', action: 'OPEN_ADD_TX_MODAL' },
          ],
        };
      }
    }
  } catch (err) {
    console.warn('AI Chat API fallback:', err);
  }

  // 3. Robust generic financial synthesis fallback
  const headline = lang === 'bn' ? 'আর্থিক হিসাব পর্যালোচনা' : 'Financial Ledger Summary';
  const m = context?.metrics || {
    monthIncome: 0,
    monthExpense: 0,
    monthSavings: 0,
    totalCash: 0,
    totalBank: 0,
    totalReceivable: 0,
  };
  const answerText =
    lang === 'bn'
      ? `এই মাসে আপনার মোট আয় ৳${(m.monthIncome || 0).toLocaleString()} এবং মোট ব্যয় ৳${(m.monthExpense || 0).toLocaleString()}। আপনার বর্তমান সঞ্চয় ৳${(m.monthSavings || 0).toLocaleString()} এবং নগদ ও ব্যাংক ব্যালেন্স ৳${((m.totalCash || 0) + (m.totalBank || 0)).toLocaleString()}। আপনি নির্দিষ্ট ব্যক্তি, ক্যাটাগরি বা বিল সম্পর্কেও প্রশ্ন করতে পারেন।`
      : `This month, your income is ৳${(m.monthIncome || 0).toLocaleString()} and expenses are ৳${(m.monthExpense || 0).toLocaleString()}. Liquid balance is ৳${((m.totalCash || 0) + (m.totalBank || 0)).toLocaleString()}.`;

  return {
    intent: 'general_summary',
    headline,
    answerText,
    isDirectCalculation: true,
    dataBreakdown: [
      { label: lang === 'bn' ? 'নগদ ও ব্যাংক' : 'Cash & Bank', value: `৳${((m.totalCash || 0) + (m.totalBank || 0)).toLocaleString()}` },
      { label: lang === 'bn' ? 'মোট পাওনা' : 'Receivables', value: `৳${(m.totalReceivable || 0).toLocaleString()}` },
      { label: lang === 'bn' ? 'মাসিক সঞ্চয়' : 'Monthly Savings', value: `৳${(m.monthSavings || 0).toLocaleString()}` },
    ],
    actionButtons: [
      { label: lang === 'bn' ? 'রিপোর্ট দেখুন' : 'View Reports', action: 'NAV_REPORTS' },
      { label: lang === 'bn' ? 'নতুন লেনদেন' : 'Add Transaction', action: 'OPEN_ADD_TX_MODAL' },
    ],
  };
}

export async function askAIAssistant(
  message: string,
  context: {
    accounts: Account[];
    recentTransactions: Transaction[];
    metrics: FinancialHealthMetrics;
    people: Person[];
    budgets: Budget[];
    reminders: Reminder[];
    categories?: Category[];
    categoryStats?: MonthlyCategoryStats[];
    lang?: Language;
  }
): Promise<string> {
  const result = await askAIAssistantDetailed(message, {
    ...context,
    categories: context.categories || [],
    categoryStats: context.categoryStats || [],
  });
  return result.answerText;
}

export async function backupToCloud(deviceId: string, data: any): Promise<boolean> {
  try {
    const res = await fetch('/api/cloud-sync/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function restoreFromCloud(deviceId: string): Promise<any | null> {
  try {
    const res = await fetch('/api/cloud-sync/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {
    return null;
  }
  return null;
}
