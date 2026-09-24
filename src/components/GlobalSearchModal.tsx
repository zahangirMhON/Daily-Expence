import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  User,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Wallet,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Account, Category, Person, Transaction } from '../types';
import { formatCurrency, formatDate, getCategoryName, getAccountName, Language, t } from '../i18n';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  people: Person[];
  lang: Language;
  onSelectTransaction?: (tx: Transaction) => void;
  onSelectPerson?: (person: Person) => void;
  onSelectCategory?: (cat: Category) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  accounts,
  people,
  lang,
  onSelectTransaction,
  onSelectPerson,
  onSelectCategory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const safeCats = Array.isArray(categories) ? categories : [];
  const safeAccs = Array.isArray(accounts) ? accounts : [];
  const safePeople = Array.isArray(people) ? people : [];
  const safeTx = Array.isArray(transactions) ? transactions : [];

  const catMap = useMemo(() => new Map(safeCats.map((c) => [c.id, c])), [safeCats]);
  const accMap = useMemo(() => new Map(safeAccs.map((a) => [a.id, a])), [safeAccs]);

  // Results calculation
  const results = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return { matchingPeople: [], matchingCategories: [], matchingTx: [] };

    // 1. People
    const matchingPeople = safePeople.filter(
      (p) =>
        p &&
        (p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)))
    );

    // 2. Categories
    const matchingCategories = safeCats.filter(
      (c) =>
        c &&
        (c.name.toLowerCase().includes(q) ||
        (c.nameBn && c.nameBn.toLowerCase().includes(q)) ||
        (c.subcategories && c.subcategories.some((s) => s.toLowerCase().includes(q))))
    );

    // 3. Transactions
    const matchingTx = safeTx
      .filter((t) => {
        if (!t) return false;
        const cat = t.categoryId ? catMap.get(t.categoryId) : undefined;
        const acc = accMap.get(t.accountId);
        return (
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.subcategory && t.subcategory.toLowerCase().includes(q)) ||
          (cat && ((cat.name && cat.name.toLowerCase().includes(q)) || (cat.nameBn && cat.nameBn.toLowerCase().includes(q)))) ||
          (acc && ((acc.name && acc.name.toLowerCase().includes(q)) || (acc.nameBn && acc.nameBn.toLowerCase().includes(q)))) ||
          String(t.amount || '').includes(q)
        );
      })
      .slice(0, 15);

    return { matchingPeople, matchingCategories, matchingTx };
  }, [searchTerm, safePeople, safeCats, safeTx, catMap, accMap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/50">
          <Search className="h-5 w-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'রাকিব, বাজার, রেস্তোরাঁ, বিকাশ বা যেকোনো নোট লিখুন...'
                : 'Search Rakib, Groceries, bKash, or any note...'
            }
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base font-medium focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 space-y-6 flex-1 custom-scrollbar">
          {!searchTerm ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-sm font-medium">
                {lang === 'bn'
                  ? 'যেকোনো ব্যক্তি, ক্যাটাগরি, লেনদেন বা বিবরণ খুঁজে পেতে টাইপ করুন'
                  : 'Type to search any person, category, transaction, or description'}
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['রাকিব', 'বাজার', 'রেস্তোরাঁ', 'বেতন', 'বিদ্যুৎ বিল', 'বিকাশ'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setSearchTerm(chip)}
                    className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ) : results.matchingPeople.length === 0 &&
            results.matchingCategories.length === 0 &&
            results.matchingTx.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-semibold text-slate-300">
                {lang === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No matching results found'}
              </p>
              <p className="text-xs text-slate-500">
                {lang === 'bn'
                  ? 'ভিন্ন কোনো কীওয়ার্ড দিয়ে চেষ্টা করুন'
                  : 'Try searching with a different keyword'}
              </p>
            </div>
          ) : (
            <>
              {/* 1. Matching People */}
              {results.matchingPeople.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-purple-400" />
                    <span>{lang === 'bn' ? 'সংশ্লিষ্ট ব্যক্তি ও দেনা-পাওনা' : 'Matching People & Debts'}</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.matchingPeople.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectPerson?.(p);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 hover:bg-purple-950/20 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-bold text-white">{p.name}</p>
                          <p className="text-xs text-slate-400">{p.phone || 'কোনো নম্বর নেই'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-emerald-400">
                            {lang === 'bn' ? 'পাওনা:' : 'Receivable:'} {formatCurrency(p.currentReceivable || 0, lang)}
                          </p>
                          {p.currentPayable > 0 && (
                            <p className="text-[11px] font-semibold text-rose-400">
                              {lang === 'bn' ? 'দেনা:' : 'Payable:'} {formatCurrency(p.currentPayable, lang)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Matching Categories */}
              {results.matchingCategories.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'bn' ? 'ক্যাটাগরি ও খাত' : 'Matching Categories'}</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {results.matchingCategories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectCategory?.(c);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-emerald-950/20 flex items-center gap-2 text-xs font-medium text-slate-200 transition-all"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span>{getCategoryName(c, lang)}</span>
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Matching Transactions */}
              {results.matchingTx.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-blue-400" />
                    <span>
                      {lang === 'bn' ? 'লেনদেনসমূহ' : 'Matching Transactions'} ({results.matchingTx.length})
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {results.matchingTx.map((tx) => {
                      const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
                      const acc = accMap.get(tx.accountId);
                      const isExpense = tx.type === 'expense' || tx.type === 'credit_purchase';
                      const isIncome = tx.type === 'income';

                      return (
                        <div
                          key={tx.id}
                          onClick={() => {
                            onSelectTransaction?.(tx);
                            onClose();
                          }}
                          className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 cursor-pointer transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isIncome
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : isExpense
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}
                            >
                              {isIncome ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">
                                {tx.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>{formatDate(tx.date, lang)}</span>
                                <span>•</span>
                                <span>{getCategoryName(cat, lang)}</span>
                                <span>•</span>
                                <span>{getAccountName(acc, lang)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p
                              className={`text-sm font-bold ${
                                isIncome
                                  ? 'text-emerald-400'
                                  : isExpense
                                  ? 'text-rose-400'
                                  : 'text-blue-400'
                              }`}
                            >
                              {formatCurrency(tx.amount, lang, { showSign: true })}
                            </p>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                              {tx.status === 'completed'
                                ? lang === 'bn'
                                  ? 'সম্পন্ন'
                                  : 'Completed'
                                : lang === 'bn'
                                ? 'অপেক্ষমান'
                                : 'Pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
