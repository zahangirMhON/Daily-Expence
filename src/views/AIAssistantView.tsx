import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Award,
  ArrowRight,
} from 'lucide-react';
import { FinancialHealthMetrics, MonthlyCategoryStats, Budget, Transaction, Account, Person, Reminder } from '../types';
import { getMonthlyAIAnalysis, askAIAssistantDetailed } from '../services/aiService';
import {
  formatCurrency,
  formatNumber,
  Language,
  t,
} from '../i18n';

interface AIAssistantViewProps {
  metrics: FinancialHealthMetrics;
  categoryStats: MonthlyCategoryStats[];
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
  people: Person[];
  reminders: Reminder[];
  lang?: Language;
  onNavigate?: (tab: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  breakdown?: { label: string; amount: number }[];
  actionLink?: { label: string; tab: string };
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  metrics,
  categoryStats,
  budgets,
  transactions,
  accounts,
  people,
  reminders,
  lang = 'bn',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'chat'>('diagnosis');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<{
    overviewBn: string;
    healthScore: number;
    topSpendingInsightsBn: string[];
    anomaliesAndWasteBn: string[];
    budgetScoreBn: string;
    savingsAdviceBn: string[];
  } | null>(null);

  // Chatbot state
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text:
        lang === 'bn'
          ? 'আসসালামু আলাইকুম! আমি আপনার ব্যক্তিগত এআই আর্থিক সহকারী। আপনার আয়-ব্যয়, ধার-দেনা, বা বাজেট সম্পর্কিত যেকোনো প্রশ্ন করতে পারেন (যেমন: "এই মাসে খাবারে কত খরচ করেছি?", "কার কাছে কত টাকা পাওনা?")।'
          : 'Hello! I am your AI financial advisor. Ask me anything about your income, expenses, debts or budgets (e.g. "How much did I spend on food this month?", "Who owes me money?").',
      timestamp: Date.now(),
    },
  ]);

  // Load initial analysis if not present
  useEffect(() => {
    if (!analysisData && !isAnalyzing) {
      handleRunAnalysis();
    }
  }, []);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await getMonthlyAIAnalysis(
        metrics,
        categoryStats,
        budgets,
        transactions,
        accounts,
        people
      );
      setAnalysisData(res);
    } catch (err) {
      console.error('Failed to run AI analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery || chatInput).trim();
    if (!query || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await askAIAssistantDetailed(
        query,
        {
          accounts,
          categories: categoryStats.map((c) => ({
            id: c.categoryId,
            name: c.categoryName,
            nameBn: c.categoryNameBn || c.categoryName,
            icon: 'Tag',
            color: '#10b981',
            type: 'expense' as const,
            subcategories: [],
          })),
          people,
          recentTransactions: transactions,
          budgets,
          reminders,
          metrics,
          categoryStats,
          lang: lang === 'en' ? 'en' : 'bn',
        }
      );

      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: response.answerText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text:
          lang === 'bn'
            ? 'দুঃখিত, তথ্য প্রক্রিয়া করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Sorry, could not process request. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{t('ai.title', lang)}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Live Advisor
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {t('ai.subtitle', lang)}
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'diagnosis'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{t('ai.tabHealth', lang)}</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>{t('ai.tabAdvisor', lang)}</span>
          </button>
        </div>
      </div>

      {/* 1. Health Diagnosis Tab */}
      {activeTab === 'diagnosis' && (
        <div className="space-y-6">
          {/* Top Score Banner */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-slate-950">
                  <span className="text-2xl font-black text-emerald-400">
                    {analysisData ? formatNumber(analysisData.healthScore, lang) : '--'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  <span>{t('ai.healthScore', lang)}</span>
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  {analysisData ? analysisData.budgetScoreBn : lang === 'bn' ? 'আর্থিক স্বাস্থ্য স্কোর গণনা হচ্ছে...' : 'Calculating health score...'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  {analysisData?.overviewBn || (lang === 'bn' ? 'আপনার আয়-ব্যয় এবং সঞ্চয়ের অনুপাত পর্যালোচনা করা হচ্ছে।' : 'Analyzing your income, expenses, and savings ratio.')}
                </p>
              </div>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-700 border border-slate-700 flex items-center gap-2 shrink-0 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{t('ai.reanalyzeBtn', lang)}</span>
            </button>
          </div>

          {/* Diagnosis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Spending Insights */}
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
                <h4 className="text-sm font-bold text-white">{t('ai.spendingInsights', lang)}</h4>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                {analysisData?.topSpendingInsightsBn.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 leading-relaxed">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Waste & Risk Warnings */}
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                <h4 className="text-sm font-bold text-white">{t('ai.wasteWarnings', lang)}</h4>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                {analysisData?.anomaliesAndWasteBn.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 leading-relaxed">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Savings Advice */}
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Lightbulb className="h-5 w-5" />
                <h4 className="text-sm font-bold text-white">{t('ai.savingsAdvice', lang)}</h4>
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                {analysisData?.savingsAdviceBn.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 leading-relaxed">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Chatbot Tab */}
      {activeTab === 'chat' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl flex flex-col h-[650px] overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="h-8 w-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Structured breakdown if available */}
                  {msg.breakdown && msg.breakdown.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1">
                      {msg.breakdown.map((b, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-400">
                          <span>{b.label}</span>
                          <span className="font-bold text-white">{formatCurrency(b.amount, lang)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Direct action link */}
                  {msg.actionLink && onNavigate && (
                    <button
                      onClick={() => onNavigate(msg.actionLink?.tab)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
                    >
                      <span>{msg.actionLink.label}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 pl-11">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                <span>{lang === 'bn' ? 'AI হিসাব যাচাই করছে...' : 'Calculating financial answer...'}</span>
              </div>
            )}
          </div>

          {/* Quick Query Chips */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex gap-2 overflow-x-auto scrollbar-none">
            {[
              lang === 'bn' ? 'এই মাসে খাবারে কত খরচ?' : 'How much on food this month?',
              lang === 'bn' ? 'কার কাছে কত টাকা পাওনা?' : 'Who owes me money?',
              lang === 'bn' ? 'আমার মোট সম্পদ কত?' : 'What is my total net worth?',
              lang === 'bn' ? 'ক্রেডিট কার্ডের বকেয়া কত?' : 'What is my credit card due?',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(undefined, chip)}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-emerald-500/15 hover:text-emerald-300 border border-slate-700 text-xs text-slate-300 whitespace-nowrap transition-all"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'যেকোনো আর্থিক প্রশ্ন লিখুন (যেমন: "গত মাসে মোট খরচ কত ছিল?")...'
                  : 'Ask any financial question...'
              }
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isChatLoading}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 disabled:opacity-40 transition-all shadow-md shadow-emerald-500/20"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
