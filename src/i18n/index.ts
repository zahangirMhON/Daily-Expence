import { Language, ThemeMode, translations, Translations } from './translations';
import { Account, Category, TransactionType, AccountType } from '../types';

export * from './translations';

/**
 * Lookup translated string with fallback
 */
export function t(key: string, lang: Language | string = 'bn'): string {
  const validLang: Language = lang === 'en' ? 'en' : 'bn';
  const dict = translations[validLang] || translations.bn;
  return (dict as any)[key] || (translations.bn as any)[key] || key;
}

/**
 * Format numbers with Bengali or English digit strings
 */
export function formatNumber(num: number | string, lang: Language | string = 'bn'): string {
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsed)) return typeof num === 'string' ? num : '0';

  const validLang: Language = lang === 'en' ? 'en' : 'bn';
  const enFormatted = Math.abs(parsed).toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (validLang === 'en') return enFormatted;

  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return enFormatted.replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

/**
 * Format Currency according to language (৳/BDT)
 */
export function formatCurrency(
  amount: number,
  lang: Language | string = 'bn',
  options: { showSign?: boolean; compact?: boolean; symbol?: string } = {}
): string {
  const validLang: Language = lang === 'en' ? 'en' : 'bn';
  const { showSign = false, compact = false, symbol = '৳' } = options;
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted = '';
  if (compact && abs >= 10000000) {
    const cr = (abs / 10000000).toFixed(2);
    formatted = validLang === 'bn' ? `${formatNumber(parseFloat(cr), 'bn')} কোটি` : `${cr} Cr`;
  } else if (compact && abs >= 100000) {
    const lakh = (abs / 100000).toFixed(2);
    formatted = validLang === 'bn' ? `${formatNumber(parseFloat(lakh), 'bn')} লাখ` : `${lakh} Lakh`;
  } else if (compact && abs >= 1000) {
    const k = (abs / 1000).toFixed(1);
    formatted = validLang === 'bn' ? `${formatNumber(parseFloat(k), 'bn')} হাজার` : `${k}k`;
  } else {
    formatted = formatNumber(abs, validLang);
  }

  const sign = isNegative ? '-' : showSign && amount > 0 ? '+' : '';
  return `${sign}${symbol}${formatted}`;
}

/**
 * Format date string (YYYY-MM-DD) into full readable date
 */
export function formatDate(dateStr: string, lang: Language | string = 'bn'): string {
  if (!dateStr) return '';
  const validLang: Language = lang === 'en' ? 'en' : 'bn';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    if (isNaN(dateObj.getTime())) return dateStr;

    if (validLang === 'bn') {
      const bnMonths = [
        'জানুয়ারি',
        'ফেব্রুয়ারি',
        'মার্চ',
        'এপ্রিল',
        'মে',
        'জুন',
        'জুলাই',
        'আগস্ট',
        'সেপ্টেম্বর',
        'অক্টোবর',
        'নভেম্বর',
        'ডিসেম্বর',
      ];
      return `${formatNumber(day, 'bn')} ${bnMonths[month - 1]}, ${formatNumber(year, 'bn')}`;
    }

    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format month string (YYYY-MM)
 */
export function formatMonth(monthStr: string, lang: Language | string = 'bn'): string {
  if (!monthStr) return '';
  const validLang: Language = lang === 'en' ? 'en' : 'bn';
  try {
    const [year, month] = monthStr.split('-').map(Number);
    if (validLang === 'bn') {
      const bnMonths = [
        'জানুয়ারি',
        'ফেব্রুয়ারি',
        'মার্চ',
        'এপ্রিল',
        'মে',
        'জুন',
        'জুলাই',
        'আগস্ট',
        'সেপ্টেম্বর',
        'অক্টোবর',
        'নভেম্বর',
        'ডিসেম্বর',
      ];
      return `${bnMonths[month - 1]} ${formatNumber(year, 'bn')}`;
    }
    const dateObj = new Date(year, month - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return monthStr;
  }
}

/**
 * Format relative date (Today, Yesterday, Tomorrow)
 */
export function formatRelativeDate(dateStr: string, lang: Language | string = 'bn'): string {
  const validLang: Language = lang === 'en' ? 'en' : 'bn';
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  if (dateStr === today) {
    return validLang === 'bn' ? 'আজ' : 'Today';
  }
  if (dateStr === yesterday) {
    return validLang === 'bn' ? 'গতকাল' : 'Yesterday';
  }
  if (dateStr === tomorrow) {
    return validLang === 'bn' ? 'আগামীকাল' : 'Tomorrow';
  }

  return formatDate(dateStr, validLang);
}

/**
 * Get Category Display Name
 */
export function getCategoryName(cat: Category | undefined, lang: Language | string = 'bn'): string {
  if (!cat) return lang === 'bn' ? 'অন্যান্য' : 'Other';
  return lang === 'bn' ? cat.nameBn || cat.name : cat.name;
}

/**
 * Get Account Display Name
 */
export function getAccountName(acc: Account | undefined, lang: Language | string = 'bn'): string {
  if (!acc) return lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account';
  return lang === 'bn' ? acc.nameBn || acc.name : acc.name;
}

/**
 * Get Transaction Type Display Name
 */
export function getTransactionTypeName(type: TransactionType | string, lang: Language | string = 'bn'): string {
  const mapBn: Record<string, string> = {
    income: 'আয়',
    expense: 'ব্যয়',
    transfer: 'স্থানান্তর',
    deposit: 'জমা',
    withdrawal: 'উত্তোলন',
    money_given: 'ধার প্রদান',
    money_received: 'ধার গ্রহণ',
    receivable: 'পাওনা',
    payable: 'দেনা',
    credit_purchase: 'কার্ড খরচ',
    credit_payment: 'কার্ড বিল পরিশোধ',
    refund: 'ফেরত',
    adjustment: 'সমন্বয়',
  };

  const mapEn: Record<string, string> = {
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    money_given: 'Loan Given',
    money_received: 'Loan Taken',
    receivable: 'Receivable',
    payable: 'Payable',
    credit_purchase: 'Card Purchase',
    credit_payment: 'Card Payment',
    refund: 'Refund',
    adjustment: 'Adjustment',
  };

  return lang === 'en' ? mapEn[type] || type : mapBn[type] || type;
}

/**
 * Get Account Type Display Name
 */
export function getAccountTypeName(type: AccountType | string, lang: Language | string = 'bn'): string {
  const mapBn: Record<string, string> = {
    cash: 'নগদ ক্যাশ',
    bank: 'ব্যাংক হিসাব',
    bkash: 'বিকাশ (bKash)',
    nagad: 'নগদ (Nagad)',
    rocket: 'রকেট (Rocket)',
    upay: 'উপায় (Upay)',
    debit_card: 'ডেবিট কার্ড',
    credit_card: 'ক্রেডিট কার্ড',
    custom: 'কাস্টম অ্যাকাউন্ট',
  };

  const mapEn: Record<string, string> = {
    cash: 'Cash',
    bank: 'Bank Account',
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
    upay: 'Upay',
    debit_card: 'Debit Card',
    credit_card: 'Credit Card',
    custom: 'Custom Account',
  };

  return lang === 'en' ? mapEn[type] || type : mapBn[type] || type;
}
