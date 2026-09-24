import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Phone,
  History,
  Check,
  X,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Person, Transaction, Account } from '../types';
import {
  formatCurrency,
  formatDate,
  getAccountName,
  Language,
  t,
} from '../i18n';
import { parseBengaliNumber } from '../utils/accounting';

export interface PeopleViewProps {
  people: Person[];
  transactions: Transaction[];
  accounts: Account[];
  onAddPerson: (person: Omit<Person, 'id' | 'currentReceivable' | 'currentPayable' | 'totalGiven' | 'totalReceived'>) => void;
  onUpdatePerson?: (person: Person) => void;
  onDeletePerson?: (personId: string) => void;
  onRecordLoan?: (
    personId: string,
    type: 'money_given' | 'money_received',
    amount: number,
    accountId: string,
    note?: string,
    dueDate?: string
  ) => void;
  onSettleLoan?: (personId: string, amount: number, accountId: string, note?: string) => void;
  onRecordLoanPayment?: (
    personId: string,
    amount: number,
    type: 'money_received' | 'money_given',
    accountId: string,
    notes?: string
  ) => void;
  lang?: Language;
}

export const PeopleView: React.FC<PeopleViewProps> = ({
  people = [],
  transactions = [],
  accounts = [],
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onRecordLoan,
  onSettleLoan,
  onRecordLoanPayment,
  lang = 'bn',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Add person modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit person modal
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete confirmation modal
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

  // Settlement modal (আদায় বা দেনা পরিশোধ)
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [settlePerson, setSettlePerson] = useState<Person | null>(null);
  const [settleType, setSettleType] = useState<'money_received' | 'money_given'>('money_received');
  const [settleAmountStr, setSettleAmountStr] = useState('');
  const [settleAccountId, setSettleAccountId] = useState(accounts[0]?.id || '');
  const [settleNotes, setSettleNotes] = useState('');

  // New Loan Modal (ধার প্রদান বা গ্রহণ)
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanPerson, setLoanPerson] = useState<Person | null>(null);
  const [loanType, setLoanType] = useState<'money_given' | 'money_received'>('money_given');
  const [loanAmountStr, setLoanAmountStr] = useState('');
  const [loanAccountId, setLoanAccountId] = useState(accounts[0]?.id || '');
  const [loanDueDate, setLoanDueDate] = useState('');
  const [loanNotes, setLoanNotes] = useState('');

  const safePeople = Array.isArray(people) ? people : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeTx = Array.isArray(transactions) ? transactions : [];

  const defaultAccId = safeAccounts[0]?.id || 'acc_cash';

  const totalReceivable = safePeople.reduce((acc, p) => acc + (p.currentReceivable || 0), 0);
  const totalPayable = safePeople.reduce((acc, p) => acc + (p.currentPayable || 0), 0);

  const filteredPeople = safePeople.filter((p) => {
    if (!p) return false;
    if (filterDueOnly && (p.currentReceivable || 0) <= 0 && (p.currentPayable || 0) <= 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (p.name || '').toLowerCase().includes(q);
      const matchPhone = (p.phoneNumber || '').includes(q);
      return matchName || matchPhone;
    }
    return true;
  });

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (typeof onAddPerson === 'function') {
      onAddPerson({
        name: newName.trim(),
        phoneNumber: newPhone.trim() || undefined,
        relationship: newRelationship.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });
    }

    setIsAddOpen(false);
    setNewName('');
    setNewPhone('');
    setNewRelationship('');
    setNewNotes('');
  };

  const handleOpenEdit = (person: Person) => {
    setEditingPerson(person);
    setEditName(person.name);
    setEditPhone(person.phoneNumber || '');
    setEditRelationship(person.relationship || '');
    setEditNotes(person.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPerson || !editName.trim()) return;

    if (typeof onUpdatePerson === 'function') {
      onUpdatePerson({
        ...editingPerson,
        name: editName.trim(),
        phoneNumber: editPhone.trim() || undefined,
        relationship: editRelationship.trim() || undefined,
        notes: editNotes.trim() || undefined,
        updatedAt: Date.now(),
      });
    }

    setEditingPerson(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingPerson) return;
    if (typeof onDeletePerson === 'function') {
      onDeletePerson(deletingPerson.id);
    }
    setDeletingPerson(null);
  };

  const handleOpenLoan = (person: Person, defaultType: 'money_given' | 'money_received' = 'money_given') => {
    setLoanPerson(person);
    setLoanType(defaultType);
    setLoanAmountStr('');
    setLoanAccountId(safeAccounts[0]?.id || defaultAccId);
    setLoanDueDate('');
    setLoanNotes('');
    setIsLoanModalOpen(true);
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanPerson) return;
    const amt = parseBengaliNumber(loanAmountStr);
    if (isNaN(amt) || amt <= 0) return;

    const accId = loanAccountId || defaultAccId;

    if (typeof onRecordLoan === 'function') {
      onRecordLoan(loanPerson.id, loanType, amt, accId, loanNotes, loanDueDate);
    } else if (typeof onRecordLoanPayment === 'function') {
      onRecordLoanPayment(loanPerson.id, amt, loanType, accId, loanNotes);
    }

    setIsLoanModalOpen(false);
    setLoanPerson(null);
  };

  const handleOpenSettle = (person: Person, type: 'money_received' | 'money_given') => {
    setSettlePerson(person);
    setSettleType(type);
    const balance = type === 'money_received' ? person.currentReceivable : person.currentPayable;
    setSettleAmountStr(String(balance || ''));
    setSettleAccountId(safeAccounts[0]?.id || defaultAccId);
    setSettleNotes(
      type === 'money_received'
        ? lang === 'bn'
          ? `${person.name}-এর পাওনা টাকা আদায়`
          : `Collected from ${person.name}`
        : lang === 'bn'
        ? `${person.name}-কে দেনা টাকা পরিশোধ`
        : `Repaid debt to ${person.name}`
    );
    setIsSettleOpen(true);
  };

  const handleSaveSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlePerson) return;
    const amt = parseBengaliNumber(settleAmountStr);
    if (isNaN(amt) || amt <= 0) return;

    const accId = settleAccountId || defaultAccId;

    if (typeof onRecordLoanPayment === 'function') {
      onRecordLoanPayment(settlePerson.id, amt, settleType, accId, settleNotes);
    } else if (typeof onSettleLoan === 'function') {
      onSettleLoan(settlePerson.id, amt, accId, settleNotes);
    }

    setIsSettleOpen(false);
    setSettlePerson(null);
  };

  const getPersonTransactions = (personId: string) => {
    return safeTx
      .filter((t) => t && t.personId === personId)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('people.title', lang)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t('people.subtitle', lang)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t('people.addPersonBtn', lang)}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Paona (Receivable) */}
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t('dash.totalReceivable', lang)}</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-2">
            {formatCurrency(totalReceivable, lang)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'bn' ? 'অন্যরা আপনাকে এই টাকা ফেরত দেবে (পাওনা)' : 'Total money owed to you by others'}
          </p>
        </div>

        {/* Dena (Payable) */}
        <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/80 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">{t('dash.totalPayable', lang)}</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-400 mt-2">
            {formatCurrency(totalPayable, lang)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'bn' ? 'অন্যদের আপনাকে এই টাকা পরিশোধ করতে হবে (দেনা)' : 'Total money you owe to others'}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl bg-slate-900/80 p-3 border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('people.searchPlaceholder', lang)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          onClick={() => setFilterDueOnly(!filterDueOnly)}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            filterDueOnly
              ? 'bg-amber-500 text-slate-950'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {lang === 'bn' ? 'শুধুমাত্র বকেয়া হিসাব' : 'Due Only'}
        </button>
      </div>

      {/* People Grid or Empty State */}
      {filteredPeople.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-8 space-y-3">
          <Users className="h-12 w-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">
            {lang === 'bn' ? 'কোনো দেনা-পাওনা বা ব্যক্তির তথ্য নেই' : 'No People or Loan Records'}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {lang === 'bn'
              ? 'নতুন ব্যক্তি যুক্ত করতে উপরের "নতুন ব্যক্তি যোগ করুন" বাটনে ক্লিক করুন অথবা লেনদেন ইনপুটে কারও নাম লিখলে স্বয়ংক্রিয়ভাবে হিসাব তৈরি হবে।'
              : 'Click "Add Person" above or type a person\'s name in transaction input to start tracking debts and loans.'}
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 mt-2 shadow-lg shadow-emerald-500/20"
          >
            <UserPlus className="h-4 w-4" />
            <span>{t('people.addPersonBtn', lang)}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => {
            const isReceivable = (person.currentReceivable || 0) > 0;
            const isPayable = (person.currentPayable || 0) > 0;
            const isSettled = !isReceivable && !isPayable;

            return (
              <div
                key={person.id}
                className="p-5 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-white text-base border border-slate-700 shrink-0">
                        {person.name ? person.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white leading-snug">{person.name}</h4>
                        {person.phoneNumber && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-500" />
                            <span>{person.phoneNumber}</span>
                          </p>
                        )}
                        {person.relationship && (
                          <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium mt-1">
                            {person.relationship}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedPerson(person)}
                        title={t('people.historyBtn', lang)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <History className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(person)}
                        title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit Person'}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingPerson(person)}
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete Person'}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Balances */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{t('people.receivable', lang)}:</span>
                      <span className={`font-bold ${isReceivable ? 'text-amber-400 font-extrabold text-sm' : 'text-slate-500'}`}>
                        {formatCurrency(person.currentReceivable || 0, lang)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{t('people.payable', lang)}:</span>
                      <span className={`font-bold ${isPayable ? 'text-rose-400 font-extrabold text-sm' : 'text-slate-500'}`}>
                        {formatCurrency(person.currentPayable || 0, lang)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    {isReceivable && (
                      <button
                        onClick={() => handleOpenSettle(person, 'money_received')}
                        className="flex-1 py-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{t('people.receiveBtn', lang)}</span>
                      </button>
                    )}

                    {isPayable && (
                      <button
                        onClick={() => handleOpenSettle(person, 'money_given')}
                        className="flex-1 py-2 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500 hover:text-slate-950 transition-all flex items-center justify-center gap-1"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{t('people.payBtn', lang)}</span>
                      </button>
                    )}

                    {isSettled && (
                      <div className="flex-1 py-1.5 text-center text-[11px] text-emerald-400 font-semibold bg-emerald-950/20 rounded-xl border border-emerald-500/20">
                        ✓ {t('people.settled', lang)}
                      </div>
                    )}
                  </div>

                  {/* Give or Borrow Loan button for any person */}
                  <button
                    onClick={() => handleOpenLoan(person, 'money_given')}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{lang === 'bn' ? 'ধার দিন বা নিন' : 'Lend / Borrow'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Person Transaction History Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-emerald-400" />
                  <span>{selectedPerson.name} — {t('people.historyBtn', lang)}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('people.receivable', lang)}: <strong className="text-amber-400">{formatCurrency(selectedPerson.currentReceivable || 0, lang)}</strong> • {t('people.payable', lang)}: <strong className="text-rose-400">{formatCurrency(selectedPerson.currentPayable || 0, lang)}</strong>
                </p>
              </div>
              <button onClick={() => setSelectedPerson(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {getPersonTransactions(selectedPerson.id).length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {t('dash.noTransactions', lang)}
                </div>
              ) : (
                getPersonTransactions(selectedPerson.id).map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{tx.description || t(`tx.type${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}`, lang)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDate(tx.date, lang)} • {tx.time || ''}
                      </p>
                      {tx.notes && <p className="text-[10px] text-slate-500 italic mt-0.5">{tx.notes}</p>}
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        tx.type === 'money_given'
                          ? 'text-amber-400'
                          : tx.type === 'money_received'
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {tx.type === 'money_given' ? '- ' : '+ '}
                      {formatCurrency(tx.amount, lang)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPerson(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                {t('action.cancel', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                <span>{t('people.addPersonBtn', lang)}</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePerson} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('people.name', lang)} *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: আসিফ করিম' : 'e.g. Asif Karim'}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('people.relationship', lang)}
                </label>
                <input
                  type="text"
                  value={newRelationship}
                  onChange={(e) => setNewRelationship(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: বন্ধু, সহকর্মী, প্রতিবেশী' : 'e.g. Friend, Colleague'}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'নোট বা বিবরণ' : 'Notes'}
                </label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'অতিরিক্ত তথ্য (ঐচ্ছিক)' : 'Optional notes'}
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="w-1/2 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  {t('action.cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  {t('action.save', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Person Modal */}
      {editingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-emerald-400" />
                <span>{lang === 'bn' ? 'ব্যক্তির তথ্য সম্পাদন' : 'Edit Person'}</span>
              </h3>
              <button onClick={() => setEditingPerson(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('people.name', lang)} *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {t('people.relationship', lang)}
                </label>
                <input
                  type="text"
                  value={editRelationship}
                  onChange={(e) => setEditRelationship(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'নোট' : 'Notes'}
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPerson(null)}
                  className="w-1/2 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  {t('action.cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                >
                  {t('action.save', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-white">
                {lang === 'bn' ? 'ব্যক্তি মুছে ফেলার নিশ্চয়তা' : 'Confirm Delete'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? `আপনি কি নিশ্চিতভাবে "${deletingPerson.name}"-কে তালিকা থেকে মুছে ফেলতে চান?`
                : `Are you sure you want to remove "${deletingPerson.name}" from your people list?`}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPerson(null)}
                className="w-1/2 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                {t('action.cancel', lang)}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 rounded-2xl bg-rose-500 text-xs font-bold text-white hover:bg-rose-600 shadow-md shadow-rose-500/20"
              >
                {t('action.delete', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Loan Modal (ধার দেওয়া বা নেওয়া) */}
      {isLoanModalOpen && loanPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                <span>{loanPerson.name} — {lang === 'bn' ? 'ধার লেনদেন' : 'Record Loan'}</span>
              </h3>
              <button onClick={() => setIsLoanModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoan} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setLoanType('money_given')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    loanType === 'money_given'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'টাকা ধার দিলাম (পাওনা)' : 'Lent Money (Receivable)'}
                </button>
                <button
                  type="button"
                  onClick={() => setLoanType('money_received')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    loanType === 'money_received'
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'টাকা ধার নিলাম (দেনা)' : 'Borrowed Money (Payable)'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'টাকার পরিমাণ (টাকা)' : 'Amount'} *
                </label>
                <input
                  type="text"
                  value={loanAmountStr}
                  onChange={(e) => setLoanAmountStr(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'অ্যাকাউন্ট / ওয়ালেট' : 'Account'} *
                </label>
                <select
                  value={loanAccountId}
                  onChange={(e) => setLoanAccountId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {safeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {getAccountName(a, lang)} ({formatCurrency(a.balance, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'পরিশোধের সম্ভাব্য তারিখ (ঐচ্ছিক)' : 'Due Date (Optional)'}
                </label>
                <input
                  type="date"
                  value={loanDueDate}
                  onChange={(e) => setLoanDueDate(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'বিবরণ বা কারণ' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'জরুরি প্রয়োজনে / ব্যবসার কাজ' : 'Reason / note'}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  {t('action.cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  {t('action.confirm', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Modal (পাওনা আদায় বা দেনা পরিশোধ) */}
      {isSettleOpen && settlePerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {settleType === 'money_received' ? t('people.receiveBtn', lang) : t('people.payBtn', lang)}: {settlePerson.name}
              </h3>
              <button onClick={() => setIsSettleOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'পরিশোধের পরিমাণ' : 'Amount'} *
                </label>
                <input
                  type="text"
                  value={settleAmountStr}
                  onChange={(e) => setSettleAmountStr(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'অ্যাকাউন্ট নির্বাচন' : 'Select Account'} *
                </label>
                <select
                  value={settleAccountId}
                  onChange={(e) => setSettleAccountId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {safeAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {getAccountName(a, lang)} ({formatCurrency(a.balance, lang)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  {lang === 'bn' ? 'নোট' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSettleOpen(false)}
                  className="w-1/2 py-2.5 rounded-2xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  {t('action.cancel', lang)}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-2xl bg-emerald-500 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20"
                >
                  {t('action.confirm', lang)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
