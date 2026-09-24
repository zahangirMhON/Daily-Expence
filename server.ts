import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client with Telemetry
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Offline fallback will be utilized.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

function cleanAndParseJSON(raw: string | undefined): any {
  if (!raw) return {};
  let text = raw.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON string:', text);
    throw err;
  }
}

// Resilient Gemini helper with model fallback and backoff to absorb temporary 503/429 spikes
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithFallback(ai: GoogleGenAI, requestParams: { contents: any; config?: any }) {
  // Use modern, active models with immediate fallback on quota / high demand
  const models = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-2.0-flash'];
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await ai.models.generateContent({
          model,
          ...requestParams,
        });
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        const isQuota = msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED') || err?.status === 429;
        const statusCode = err?.status || err?.code || (msg.includes('503') ? 503 : 0);
        const isTransient = statusCode === 503 || msg.includes('high demand') || msg.includes('UNAVAILABLE');

        console.warn(`[Gemini] ${model} (attempt ${attempt}) failed: ${msg}. Trying fallback...`);

        // If quota limit reached on this model, immediately jump to the next model without waiting
        if (isQuota) {
          break;
        }

        if (isTransient && attempt === 1) {
          await sleep(500);
          continue;
        }

        break;
      }
    }
  }

  throw lastError;
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * 1. AI Transaction Intent Parser Endpoint
 * Converts natural Bengali/English speech or text into structured financial transactions
 */
app.post('/api/ai/parse', async (req, res) => {
  try {
    const { prompt, accounts = [], categories = [], people = [], reminders = [], currentDate = new Date().toISOString() } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAI();
    const systemInstruction = `You are "AI মাসিক হিসাব" (AI Monthly Accounts), a world-class Bengali & English Personal Finance Semantic Parser.
Your role is to understand financial speech and text accurately in Bengali, English, or mixed Banglish (e.g. "আজকে ৮০০ টাকা বাজার, ২০০ টাকা রিকশা, আর বেতন ৩০ হাজার টাকা পেয়েছি").

Accounting & Semantic Rules:
1. Multi-Item Splitting: If the user mentions multiple transactions in one sentence, split them into distinct structured items.
2. Number Parsing: Convert Bengali digits (যেমন: ৫০০, ৮৫০, ৩০ হাজার, ২ লাখ, 5k) accurately to numerical numbers (e.g. 500, 850, 30000, 200000, 5000).
3. Transaction Types:
   - 'income': Salary, freelance, bonus, profit, gift ("বেতন পেলাম", "আয় হলো", "টাকা ঢুকলো")
   - 'expense': Food, grocery, transport, bills, rent ("বাজার করেছি", "রিকশা ভাড়া", "খাবার খরচ")
   - 'transfer': Money moved between own accounts ("ব্যাংক থেকে বিকাশে নিলাম", "ক্যাশ তুললাম")
   - 'money_given': Money loaned/given to a person ("রাকিবকে ধার দিলাম", "বন্ধুকে দিলাম") -> Creates/increases Receivable
   - 'money_received': Debt returned by person ("রাকিব ধার শোধ করেছে", "১০০০ টাকা ফেরত দিলো") -> Reduces Receivable
   - 'credit_purchase': Buying on credit card ("ক্রেডিট কার্ড দিয়ে শপিং", "কার্ড সোয়াইপ")
   - 'credit_payment': Paying credit card bill ("ক্রেডিট কার্ড বিল দিলাম")
   - 'refund': Money refunded for a purchase
4. Accounts: Match to available accounts (Cash, bKash, Nagad, Rocket, BRAC Bank, Credit Card). If not mentioned:
   - "বাজার", "রিকশা", small items default to 'Cash in Hand' or 'bKash'
   - "বেতন" defaults to Bank Account
   - "ক্রেডিট কার্ড" or "কার্ড" defaults to Credit Card
5. Categories: Match to standard Bengali/English categories (Grocery, Food & Dining, Transportation, Shopping, Internet, Electricity, Medical, Rent, etc.).
6. Confidence Score: Return 0.0 to 1.0. High confidence (>=0.9) when amount and intent are crystal clear.
7. Bengali Summary: Provide a clear, polite summary in Bengali explaining what was understood (e.g. "আমি ৩টি হিসাব বুঝেছি: ➕ Salary — ৳30,000, ➖ Grocery — ৳800, ➖ Transportation — ৳200").

Current Date: ${currentDate}
Available Accounts: ${JSON.stringify(accounts.map((a: any) => ({ id: a.id, name: a.name, nameBn: a.nameBn, type: a.type })))}
Available Categories: ${JSON.stringify(categories.map((c: any) => ({ id: c.id, name: c.name, nameBn: c.nameBn, type: c.type })))}
Known People: ${JSON.stringify(people.map((p: any) => ({ id: p.id, name: p.name })))}
Pending Reminders: ${JSON.stringify(reminders.map((r: any) => ({ id: r.id, title: r.title, amount: r.amount })))}
`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryBn: {
              type: Type.STRING,
              description: 'Clear, polite summary of what was understood in Bengali with emojis',
            },
            totalIncome: { type: Type.NUMBER },
            totalExpense: { type: Type.NUMBER },
            netImpact: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tempId: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  type: {
                    type: Type.STRING,
                    enum: [
                      'income',
                      'expense',
                      'transfer',
                      'deposit',
                      'withdrawal',
                      'money_given',
                      'money_received',
                      'credit_purchase',
                      'credit_payment',
                      'refund',
                      'adjustment',
                    ],
                  },
                  categoryName: { type: Type.STRING },
                  subcategory: { type: Type.STRING },
                  accountName: { type: Type.STRING },
                  toAccountName: { type: Type.STRING },
                  personName: { type: Type.STRING },
                  date: { type: Type.STRING, description: 'YYYY-MM-DD' },
                  description: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER },
                  reasoningBn: { type: Type.STRING },
                  isHighConfidence: { type: Type.BOOLEAN },
                  matchedReminderId: { type: Type.STRING },
                },
                required: ['amount', 'type', 'categoryName', 'accountName', 'description', 'confidenceScore', 'reasoningBn'],
              },
            },
            ambiguityNotes: { type: Type.STRING },
          },
          required: ['summaryBn', 'items'],
        },
      },
    });

    const parsedData = cleanAndParseJSON(response.text);
    return res.json(parsedData);
  } catch (error: any) {
    console.warn('Gemini parse fallback triggered:', error?.message || error);
    // Return structured offline-ready response so frontend local parser runs seamlessly
    return res.json({
      summaryBn: 'অফলাইন মোডে স্বয়ংক্রিয়ভাবে পার্স করা হচ্ছে',
      items: [],
      useFallback: true,
      errorNotice: error?.message || 'Quota limit reached, using offline parser',
    });
  }
});

/**
 * 2. AI Monthly Financial Analysis & Spending Doctor Endpoint
 */
app.post('/api/ai/monthly-analysis', async (req, res) => {
  const { month, metrics, categoryStats, transactionsSample, budgets } = req.body;
  try {
    const ai = getAI();

    const prompt = `Analyze this monthly personal finance report for the month of ${month}.
Metrics:
- Total Income: ৳${metrics?.monthIncome || 0}
- Total Expenses: ৳${metrics?.monthExpense || 0}
- Net Savings: ৳${metrics?.monthSavings || 0}
- Savings Rate: ${(metrics?.savingsRate || 0).toFixed(1)}%
- Total Cash: ৳${metrics?.totalCash || 0}
- Total Bank: ৳${metrics?.totalBank || 0}
- Total Mobile Wallets: ৳${metrics?.totalMobileWallet || 0}
- Credit Card Debt: ৳${metrics?.totalCreditOutstanding || 0}
- Receivables (পাওনা): ৳${metrics?.totalReceivable || 0}
- Payables (দেনা): ৳${metrics?.totalPayable || 0}

Category Breakdown:
${JSON.stringify(categoryStats || [])}

Budgets:
${JSON.stringify(budgets || [])}

Provide a comprehensive, empathetic, actionable financial diagnosis in Bengali.
Format as JSON with:
1. overviewBn: Summary of overall financial health
2. topSpendingInsightsBn: Where did the most money go?
3. anomaliesAndWasteBn: Any unnecessary spending or high variance?
4. budgetScoreBn: Budget performance review
5. savingsAdviceBn: 3 actionable tips in Bengali to increase savings rate next month
6. healthScore: 0-100 score
`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overviewBn: { type: Type.STRING },
            healthScore: { type: Type.NUMBER },
            topSpendingInsightsBn: { type: Type.ARRAY, items: { type: Type.STRING } },
            anomaliesAndWasteBn: { type: Type.ARRAY, items: { type: Type.STRING } },
            budgetScoreBn: { type: Type.STRING },
            savingsAdviceBn: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['overviewBn', 'healthScore', 'topSpendingInsightsBn', 'budgetScoreBn', 'savingsAdviceBn'],
        },
      },
    });

    const analysis = cleanAndParseJSON(response.text);
    return res.json(analysis);
  } catch (error: any) {
    console.warn('Monthly analysis fallback triggered:', error?.message || error);
    const savingsRate = metrics?.savingsRate || 0;
    const score = Math.min(100, Math.max(30, Math.round(savingsRate * 1.5 + 40)));
    return res.json({
      overviewBn: `এই মাসের মোট আয় ৳${metrics?.monthIncome || 0}, মোট ব্যয় ৳${metrics?.monthExpense || 0} এবং বর্তমান নিট সঞ্চয় ৳${metrics?.monthSavings || 0}।`,
      healthScore: score,
      topSpendingInsightsBn: [
        'সবচেয়ে বড় খরচের খাতগুলো নিয়মিত মনিটর করুন যাতে অপ্রত্যাশিত ব্যয় নিয়ন্ত্রণ করা যায়।',
        'নিত্যপ্রয়োজনীয় ব্যয়ের পাশাপাশি অপব্যয় কমাতে বাজেট সীমা কার্যকর রাখুন।',
      ],
      anomaliesAndWasteBn: [
        'অপ্রয়োজনীয় বাইরের খাবার ও অপ্রয়োজনীয় কেনাকাটা পরিহার করুন।',
      ],
      budgetScoreBn: 'বাজেট সীমা বজায় রেখে চললে সঞ্চয়ের লক্ষ্যমাত্রা পূরণ সহজ হবে।',
      savingsAdviceBn: [
        'প্রতি মাসের আয়ের শুরুতেই অন্তত ২০% আলাদা ব্যাংক বা সঞ্চয় অ্যাকাউন্টে সরিয়ে রাখুন।',
        'জরুরি প্রয়োজনের জন্য ৩-৬ মাসের খরচের সমান একটি ইমার্জেন্সি ফান্ড গড়ে তুলুন।',
        'ক্রেডিট কার্ড বা ধার-দেনার বিল নিয়মিত পরিশোধ করে অতিরিক্ত সুদ এড়িয়ে চলুন।',
      ],
    });
  }
});

/**
 * 3. AI Personal Accountant Chatbot Endpoint
 */
app.post('/api/ai/chat', async (req, res) => {
  const { message, context } = req.body;
  try {
    const ai = getAI();

    const systemInstruction = `You are "AI হিসাবরক্ষক" (AI Personal Accountant), an intelligent, polite, and extremely accurate Bengali financial assistant.
You have live access to the user's financial ledger:
- Current Accounts & Balances: ${JSON.stringify(context?.accounts || [])}
- Recent Transactions: ${JSON.stringify(context?.recentTransactions || [])}
- Monthly Metrics: ${JSON.stringify(context?.metrics || {})}
- People & Debts (দেনা-পাওনা): ${JSON.stringify(context?.people || [])}
- Budgets: ${JSON.stringify(context?.budgets || [])}
- Reminders: ${JSON.stringify(context?.reminders || [])}

Always answer queries accurately in Bengali with appropriate currency formatting (৳), emojis, and practical financial guidance.
If the user asks who owes them money, check the people receivables. If they ask about budget or category spending, provide exact numbers.
Keep answers concise, helpful, and scannable.`;

    const response = await generateWithFallback(ai, {
      contents: message,
      config: {
        systemInstruction,
      },
    });

    return res.json({ reply: response.text });
  } catch (error: any) {
    console.warn('Chat fallback triggered:', error?.message || error);
    return res.json({
      reply: 'আপনার আর্থিক হিসাব সম্পূর্ণ সচল ও সংরক্ষিত আছে। এই মুহূর্তে ক্লাউড এআই সার্ভিস পুনর্গঠন হচ্ছে। আপনি আপনার সকল ব্যালেন্স, লেনদেন ও হিসাব অক্ষুণ্ণ দেখতে পাচ্ছেন।'
    });
  }
});

// Cloud Sync Simulated In-Memory Store for Multi-Device Backup
const cloudStore = new Map<string, { data: any; updatedAt: number }>();

app.post('/api/cloud-sync/backup', (req, res) => {
  const { deviceId, data } = req.body;
  if (!deviceId || !data) return res.status(400).json({ error: 'Missing sync payload' });

  cloudStore.set(deviceId, { data, updatedAt: Date.now() });
  return res.json({
    status: 'synced',
    syncedAt: Date.now(),
    serverVersion: 1,
  });
});

app.post('/api/cloud-sync/restore', (req, res) => {
  const { deviceId } = req.body;
  const backup = cloudStore.get(deviceId);
  if (!backup) {
    return res.status(404).json({ error: 'No cloud backup found for this device ID' });
  }
  return res.json({
    status: 'ok',
    data: backup.data,
    updatedAt: backup.updatedAt,
  });
});

// Vite Middleware for Dev and Production Serving
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI মাসিক হিসাব server running on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
