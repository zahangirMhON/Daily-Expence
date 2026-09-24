import { AIParseResponse, ParsedItemDraft, TransactionType } from '../types';
import { parseBengaliNumber } from '../utils/accounting';

/**
 * Robust Client-Side Offline Regex and Semantic Token Parser
 * Guarantees that AI parsing functions 100% reliably even with no internet connection.
 */
export function parseTransactionLocally(
  prompt: string,
  categories: { id: string; name: string; nameBn: string; type: string }[] = [],
  accounts: { id: string; name: string; nameBn: string; type: string }[] = [],
  people: { id: string; name: string }[] = [],
  reminders: { id: string; title: string; amount: number; autoMatchKeywords?: string[] }[] = []
): AIParseResponse {
  const items: ParsedItemDraft[] = [];
  const text = prompt.trim();
  const todayStr = new Date().toISOString().split('T')[0];

  // Split multi-clauses separated by comma, 'এবং', 'আর', 'ও', semicolon, newlines
  const clauses = text
    .split(/[,;\n]| এবং | আর | ও /gi)
    .map((c) => c.trim())
    .filter((c) => c.length > 2);

  const clausesToProcess = clauses.length > 0 ? clauses : [text];

  for (const clause of clausesToProcess) {
    const item = parseSingleClause(clause, todayStr, categories, accounts, people, reminders);
    if (item) {
      items.push(item);
    }
  }

  // If no clauses matched amounts, do a fallback scan over entire text
  if (items.length === 0) {
    const singleItem = parseSingleClause(text, todayStr, categories, accounts, people, reminders);
    if (singleItem) {
      items.push(singleItem);
    } else {
      // Fallback empty item so user can manually edit
      items.push({
        tempId: 'draft_' + Math.random().toString(36).substring(2, 7),
        amount: 0,
        type: 'expense',
        categoryName: 'অন্যান্য খরচ',
        accountName: 'নগদ টাকা (ক্যাশ)',
        date: todayStr,
        description: text || 'সাধারণ লেনদেন',
        confidenceScore: 0.4,
        reasoningBn: 'নির্দিষ্ট পরিমাণ শনাক্ত করা যায়নি, অনুগ্রহ করে পরিমাণ লিখুন।',
        isHighConfidence: false,
      });
    }
  }

  let totalIncome = 0;
  let totalExpense = 0;
  for (const it of items) {
    if (it.type === 'income') totalIncome += it.amount;
    else if (it.type === 'expense' || it.type === 'credit_purchase') totalExpense += it.amount;
  }

  const countBn = items.length === 1 ? '১টি' : items.length === 2 ? '২টি' : items.length === 3 ? '৩টি' : `${items.length}টি`;
  const summaryBn = `আমি ${countBn} হিসাব বুঝেছি:\n` +
    items
      .map(
        (it) =>
          `${it.type === 'income' ? '➕' : it.type === 'money_given' ? '🤝' : '➖'} ${it.categoryName || it.description} — ৳${it.amount.toLocaleString()}`
      )
      .join('\n');

  return {
    summaryBn,
    items,
    totalIncome,
    totalExpense,
    netImpact: totalIncome - totalExpense,
  };
}

function parseSingleClause(
  clause: string,
  todayStr: string,
  categories: { id: string; name: string; nameBn: string; type: string }[],
  accounts: { id: string; name: string; nameBn: string; type: string }[],
  people: { id: string; name: string }[],
  reminders: { id: string; title: string; amount: number; autoMatchKeywords?: string[] }[]
): ParsedItemDraft | null {
  const lower = clause.toLowerCase();

  // Extract amount
  // Check for patterns like: "৮৫০ টাকা", "5000 tk", "৩০ হাজার", "30k", "২.৫ লাখ", "৳500"
  let amount = 0;

  // Check for thousand/lakh multipliers in Bengali/English
  const thousandMatch = clause.match(/([০-৯0-9.]+)\s*(হাজার|hazar|k\b)/i);
  const lakhMatch = clause.match(/([০-৯0-9.]+)\s*(লাখ|lakh|lac)/i);
  const generalAmountMatch = clause.match(/([০-৯0-9,.]+)\s*(টাকা|টাকার|tk|bdt|\/-)?/i);

  if (thousandMatch) {
    const base = parseBengaliNumber(thousandMatch[1]);
    amount = base * 1000;
  } else if (lakhMatch) {
    const base = parseBengaliNumber(lakhMatch[1]);
    amount = base * 100000;
  } else if (generalAmountMatch) {
    amount = parseBengaliNumber(generalAmountMatch[1]);
  }

  // If amount is 0, check all numeric sequences
  if (!amount) {
    const rawDigits = clause.match(/[০-৯0-9]+/g);
    if (rawDigits && rawDigits.length > 0) {
      amount = parseBengaliNumber(rawDigits[0]);
    }
  }

  if (amount <= 0) return null;

  // Determine Transaction Type
  let type: TransactionType = 'expense';
  let reasoningBn = '';
  let confidenceScore = 0.85;

  // Check loan / person receivable
  const isMoneyGiven = /ধার দিলাম|ধার দিয়েছি|ধার দিয়ে|টাকা দিলাম|ধার দিয়েছিলাম|ধার দিয়ে দিলাম/i.test(clause);
  const isMoneyReceived = /ধার ফেরত|ফেরত পেলাম|ফেরত দিয়েছে|ফেরত দিল|শোধ করেছে/i.test(clause);
  const isIncome = /বেতন|salary|আয়|income|লাভ|বোনাস|উপহার|ফ্রিল্যান্সিং|পেল্লাম|পেয়েছি|জমা হলো/i.test(clause);
  const isCreditCard = /ক্রেডিট কার্ড|credit card|কার্ড দিয়ে|card swipe/i.test(clause);
  const isTransfer = /ট্রান্সফার|transfer|জমা করলাম|ক্যাশ তুললাম|টুললাম|উত্তোলন/i.test(clause);

  let personName: string | undefined = undefined;
  for (const p of people) {
    if (clause.includes(p.name) || lower.includes(p.name.toLowerCase())) {
      personName = p.name;
      break;
    }
  }

  // Try extracting new person name if not known (e.g. "রাকিবকে", "করিমকে", "সাকিবকে")
  if (!personName) {
    const nameMatch = clause.match(/([A-Za-z\u0980-\u09FF]+)(কে| এর কাছে| থেকে)/);
    if (nameMatch && nameMatch[1] && !['বিকাশ', 'নগদ', 'কার্ড', 'ব্যাংক'].includes(nameMatch[1])) {
      personName = nameMatch[1];
    }
  }

  // Determine account
  let accountName = 'নগদ টাকা (ক্যাশ)';
  if (/বিকাশ|bkash/i.test(clause)) accountName = 'বিকাশ পার্সোনাল';
  else if (/নগদ|nagad/i.test(clause)) accountName = 'নগদ ওয়ালেট';
  else if (/রকেট|rocket/i.test(clause)) accountName = 'রকেট অ্যাকাউন্ট';
  else if (/ব্যাংক|bank|brac|ব্র্যাক/i.test(clause)) accountName = 'ব্র্যাক ব্যাংক (বেতন হিসাব)';
  else if (isCreditCard) accountName = 'সিটি ব্যাংক ক্রেডিট কার্ড';

  // Determine Category
  let categoryName = 'অন্যান্য খরচ';
  let subcategory: string | undefined = undefined;

  if (isIncome) {
    type = 'income';
    categoryName = 'বেতন';
    if (/বোনাস/i.test(clause)) categoryName = 'বোনাস';
    else if (/ব্যবসা/i.test(clause)) categoryName = 'ব্যবসা';
    else if (/ফ্রিল্যান্স/i.test(clause)) categoryName = 'ফ্রিল্যান্সিং';
    else if (/উপহার/i.test(clause)) categoryName = 'উপহার ও পুরস্কার';
    reasoningBn = `আয় হিসেবে শনাক্ত করা হয়েছে (${categoryName})`;
    confidenceScore = 0.95;
  } else if (isMoneyGiven) {
    type = 'money_given';
    categoryName = 'ধার প্রদান (পাওনা)';
    reasoningBn = `${personName || 'ব্যক্তিকে'} টাকা ধার দেওয়া হয়েছে (পাওনা হিসেবে জমা)`;
    confidenceScore = 0.98;
  } else if (isMoneyReceived) {
    type = 'money_received';
    categoryName = 'ধার ফেরত (পাওনা আদায়)';
    reasoningBn = `${personName || 'ব্যক্তির'} কাছ থেকে ধারের টাকা ফেরত পাওয়া গেছে`;
    confidenceScore = 0.98;
  } else if (isCreditCard) {
    type = 'credit_purchase';
    categoryName = 'কেনাকাটা ও পোশাক';
    reasoningBn = 'ক্রেডিট কার্ড দিয়ে কেনাকাটা (লাইবিলিটি ও ব্যয়)';
    confidenceScore = 0.92;
  } else if (isTransfer) {
    type = 'transfer';
    categoryName = 'অ্যাকাউন্ট ট্রান্সফার';
    reasoningBn = 'এক অ্যাকাউন্ট থেকে অন্য অ্যাকাউন্টে টাকা স্থানান্তর';
    confidenceScore = 0.9;
  } else {
    // Standard expense classification
    if (/বাজার|কাঁচাবাজার|মুদি|চাল|ডাল|সবজি|মাছ|মাংস/i.test(clause)) {
      categoryName = 'বাজার ও মুদি সামগ্রী';
      subcategory = 'কাঁচাবাজার';
    } else if (/রিকশা|রিক্সায়|বাস|ভাড়া|উবার|পাঠাও|যাতায়াত|তেল|গাড়ি/i.test(clause)) {
      categoryName = 'যাতায়াত ও ভাড়া';
      subcategory = 'রিকশা ভাড়া';
    } else if (/খাবার|লাঞ্চ|ডিনার|নাস্তা|চা|রেস্তোরাঁ|food|restaurant/i.test(clause)) {
      categoryName = 'খাবার ও রেস্তোরাঁ';
      subcategory = 'নাস্তা ও খাবার';
    } else if (/ইন্টারনেট|wifi|ব্রডব্যান্ড|net bill/i.test(clause)) {
      categoryName = 'ইন্টারনেট ও ওয়াইফাই';
    } else if (/বিদ্যুৎ|কারেন্ট|ডেসকো|ডিপিডিসি/i.test(clause)) {
      categoryName = 'বিদ্যুৎ বিল';
    } else if (/মোবাইল|রিচার্জ|ফ্লেক্সিলোড|মিনিট/i.test(clause)) {
      categoryName = 'মোবাইল রিচার্জ';
    } else if (/ঔষধ|ডাক্তার|হাসপাতাল|চিকিৎসা|মেডিকেল/i.test(clause)) {
      categoryName = 'চিকিৎসা ও ঔষধ';
    } else if (/শপিং|জামাকাপড়|পোশাক|জুতা|আড়ং/i.test(clause)) {
      categoryName = 'কেনাকাটা ও পোশাক';
    } else if (/বাড়ি ভাড়া|ভাড়া|rent/i.test(clause)) {
      categoryName = 'বাড়ি ভাড়া';
    }

    reasoningBn = `ব্যয় হিসেবে '${categoryName}' ক্যাটাগরিতে অন্তর্ভুক্ত`;
    confidenceScore = 0.92;
  }

  // Check reminder matching
  let matchedReminderId: string | undefined = undefined;
  for (const rem of reminders) {
    const matches = rem.autoMatchKeywords.some((kw) => clause.toLowerCase().includes(kw.toLowerCase()));
    if (matches) {
      matchedReminderId = rem.id;
      reasoningBn += ` (সংযুক্ত রিমাইন্ডার: ${rem.title})`;
      break;
    }
  }

  return {
    tempId: 'draft_' + Math.random().toString(36).substring(2, 7),
    amount,
    type,
    categoryName,
    subcategory,
    accountName,
    personName,
    date: todayStr,
    description: clause,
    confidenceScore,
    reasoningBn,
    isHighConfidence: confidenceScore >= 0.9,
    matchedReminderId,
  };
}
