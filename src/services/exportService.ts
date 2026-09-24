import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Account, Category, Person, FinancialHealthMetrics } from '../types';

export function exportToExcel(
  transactions: Transaction[] = [],
  categories: Category[] = [],
  accounts: Account[] = [],
  people: Person[] = [],
  filename = 'Financial_Transactions_Report.xlsx'
) {
  const safeTx = Array.isArray(transactions) ? transactions : [];
  const safeCats = Array.isArray(categories) ? categories : [];
  const safeAccs = Array.isArray(accounts) ? accounts : [];
  const safePeople = Array.isArray(people) ? people : [];

  const catMap = new Map(safeCats.map((c) => [c.id, c.nameBn || c.name]));
  const accMap = new Map(safeAccs.map((a) => [a.id, a.nameBn || a.name]));
  const personMap = new Map(safePeople.map((p) => [p.id, p.name]));

  const rows = safeTx.map((t) => ({
    'ID': t.id,
    'তারিখ (Date)': t.date,
    'সময় (Time)': t.time || '',
    'বিবরণ (Description)': t.description,
    'ধরণ (Type)': getBengaliTypeName(t.type),
    'ক্যাটাগরি (Category)': catMap.get(t.categoryId || '') || t.categoryId || '',
    'সাব-ক্যাটাগরি (Subcategory)': t.subcategory || '',
    'অ্যাকাউন্ট (Account)': accMap.get(t.accountId) || t.accountId,
    'গন্তব্য অ্যাকাউন্ট (To Account)': t.toAccountId ? accMap.get(t.toAccountId) || t.toAccountId : '',
    'ব্যক্তি (Person)': t.personId ? personMap.get(t.personId) || t.personId : '',
    'পরিমাণ (Amount ৳)': t.amount,
    'স্ট্যাটাস (Status)': t.status,
    'নোটস (Notes)': t.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
  XLSX.writeFile(workbook, filename);
}

export function exportToCSV(
  transactions: Transaction[] = [],
  categories: Category[] = [],
  accounts: Account[] = [],
  people: Person[] = [],
  filename = 'Transactions_Ledger.csv'
) {
  const safeTx = Array.isArray(transactions) ? transactions : [];
  const safeCats = Array.isArray(categories) ? categories : [];
  const safeAccs = Array.isArray(accounts) ? accounts : [];
  const safePeople = Array.isArray(people) ? people : [];

  const catMap = new Map(safeCats.map((c) => [c.id, c.nameBn || c.name]));
  const accMap = new Map(safeAccs.map((a) => [a.id, a.nameBn || a.name]));
  const personMap = new Map(safePeople.map((p) => [p.id, p.name]));

  const headers = ['ID', 'Date', 'Time', 'Description', 'Type', 'Category', 'Subcategory', 'Account', 'Person', 'Amount_BDT', 'Status'];
  const csvRows = [headers.join(',')];

  for (const t of safeTx) {
    if (!t) continue;
    const row = [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.time || ''}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${t.type}"`,
      `"${(catMap.get(t.categoryId || '') || '').replace(/"/g, '""')}"`,
      `"${(t.subcategory || '').replace(/"/g, '""')}"`,
      `"${(accMap.get(t.accountId) || '').replace(/"/g, '""')}"`,
      `"${(personMap.get(t.personId || '') || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${t.status}"`,
    ];
    csvRows.push(row.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportMonthlyPDF(
  month: string,
  metrics: FinancialHealthMetrics,
  transactions: Transaction[] = [],
  categories: Category[] = [],
  accounts: Account[] = []
) {
  const safeTx = Array.isArray(transactions) ? transactions : [];
  const safeCats = Array.isArray(categories) ? categories : [];
  const safeAccs = Array.isArray(accounts) ? accounts : [];

  const doc = new jsPDF();
  const catMap = new Map(safeCats.map((c) => [c.id, c.name]));
  const accMap = new Map(safeAccs.map((a) => [a.id, a.name]));

  // Title & Header
  doc.setFontSize(18);
  doc.text('AI Masik Hisab - Monthly Financial Report', 14, 20);
  doc.setFontSize(11);
  doc.text(`Report Period: ${month}`, 14, 28);
  doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 34);

  // Summary Box
  const m = metrics || {
    monthIncome: 0,
    monthExpense: 0,
    monthSavings: 0,
    savingsRate: 0,
    totalCash: 0,
    totalBank: 0,
    totalMobileWallet: 0,
    totalReceivable: 0,
    totalCreditOutstanding: 0,
    totalPayable: 0,
  };
  doc.setFontSize(12);
  doc.text('Financial Summary:', 14, 46);
  doc.setFontSize(10);
  doc.text(`Total Monthly Income: BDT ${(m.monthIncome || 0).toLocaleString()}`, 14, 54);
  doc.text(`Total Monthly Expense: BDT ${(m.monthExpense || 0).toLocaleString()}`, 14, 60);
  doc.text(`Net Monthly Savings: BDT ${(m.monthSavings || 0).toLocaleString()} (${(m.savingsRate || 0).toFixed(1)}%)`, 14, 66);
  doc.text(`Total Cash & Bank: BDT ${((m.totalCash || 0) + (m.totalBank || 0) + (m.totalMobileWallet || 0)).toLocaleString()}`, 14, 72);
  doc.text(`Outstanding Receivables: BDT ${(m.totalReceivable || 0).toLocaleString()}`, 14, 78);
  doc.text(`Credit Card Debt / Payables: BDT ${((m.totalCreditOutstanding || 0) + (m.totalPayable || 0)).toLocaleString()}`, 14, 84);

  // Transactions Table
  const tableData = safeTx
    .filter((t) => t && t.date && t.date.startsWith(month))
    .slice(0, 40)
    .map((t) => [
      t.date,
      (t.description || '').substring(0, 30),
      (t.type || '').toUpperCase(),
      catMap.get(t.categoryId || '') || 'Other',
      accMap.get(t.accountId) || 'Account',
      `BDT ${Number(t.amount || 0).toLocaleString()}`,
    ]);

  autoTable(doc, {
    startY: 94,
    head: [['Date', 'Description', 'Type', 'Category', 'Account', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 8 },
  });

  doc.save(`${month}_Financial_Report.pdf`);
}

function getBengaliTypeName(type: string): string {
  switch (type) {
    case 'income':
      return 'আয় (Income)';
    case 'expense':
      return 'ব্যয় (Expense)';
    case 'transfer':
      return 'স্থানান্তর (Transfer)';
    case 'money_given':
      return 'ধার প্রদান (Receivable)';
    case 'money_received':
      return 'ধার ফেরত (Received)';
    case 'credit_purchase':
      return 'ক্রেডিট কার্ড ক্রয়';
    case 'credit_payment':
      return 'ক্রেডিট কার্ড বিল পরিশোধ';
    case 'refund':
      return 'রিফান্ড (Refund)';
    default:
      return type;
  }
}
