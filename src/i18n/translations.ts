export type Language = 'bn' | 'en';
export type ThemeMode = 'dark' | 'light' | 'system';

export interface Translations {
  [key: string]: string;
  // Navigation
  'nav.dashboard': string;
  'nav.transactions': string;
  'nav.aiAssistant': string;
  'nav.accounts': string;
  'nav.people': string;
  'nav.budget': string;
  'nav.reports': string;
  'nav.settings': string;
  'nav.spreadsheet': string;
  'nav.globalSearch': string;
  'nav.quickAdd': string;
  'nav.income': string;
  'nav.expense': string;
  'nav.cash': string;
  'nav.bank': string;
  'nav.mobileBanking': string;
  'nav.cards': string;
  'nav.receivable': string;
  'nav.payable': string;
  'nav.reminders': string;
  'nav.analytics': string;

  // General Actions
  'action.save': string;
  'action.cancel': string;
  'action.edit': string;
  'action.delete': string;
  'action.add': string;
  'action.search': string;
  'action.filter': string;
  'action.export': string;
  'action.download': string;
  'action.confirm': string;
  'action.back': string;
  'action.viewDetails': string;
  'action.viewAll': string;
  'action.settle': string;
  'action.transfer': string;
  'action.payBill': string;
  'action.reset': string;
  'action.close': string;
  'action.copy': string;
  'action.share': string;
  'action.print': string;
  'action.apply': string;
  'action.refresh': string;
  'action.clear': string;

  // Financial Metrics & Dashboard
  'dash.title': string;
  'dash.subtitle': string;
  'dash.todayIncome': string;
  'dash.todayExpense': string;
  'dash.todayNet': string;
  'dash.monthIncome': string;
  'dash.monthExpense': string;
  'dash.monthSavings': string;
  'dash.savingsRate': string;
  'dash.netWorth': string;
  'dash.totalAssets': string;
  'dash.totalLiabilities': string;
  'dash.totalCash': string;
  'dash.totalBank': string;
  'dash.totalMobile': string;
  'dash.totalCreditDue': string;
  'dash.totalReceivable': string;
  'dash.totalPayable': string;
  'dash.recentTransactions': string;
  'dash.pendingReminders': string;
  'dash.flowTrend': string;
  'dash.quickActions': string;
  'dash.noReminders': string;
  'dash.noTransactions': string;
  'dash.financialHealth': string;
  'dash.aiInsights': string;

  // Transactions View
  'tx.title': string;
  'tx.subtitle': string;
  'tx.newBtn': string;
  'tx.timelineView': string;
  'tx.tableView': string;
  'tx.searchPlaceholder': string;
  'tx.filterType': string;
  'tx.filterAccount': string;
  'tx.filterCategory': string;
  'tx.filterAll': string;
  'tx.typeIncome': string;
  'tx.typeExpense': string;
  'tx.typeTransfer': string;
  'tx.typeMoneyGiven': string;
  'tx.typeMoneyReceived': string;
  'tx.typeCreditPurchase': string;
  'tx.typeCreditPayment': string;
  'tx.typeRefund': string;
  'tx.date': string;
  'tx.time': string;
  'tx.account': string;
  'tx.toAccount': string;
  'tx.category': string;
  'tx.amount': string;
  'tx.description': string;
  'tx.notes': string;
  'tx.person': string;
  'tx.status': string;
  'tx.statusCompleted': string;
  'tx.statusPending': string;
  'tx.actions': string;
  'tx.noResults': string;
  'tx.deleteConfirm': string;
  'tx.duplicate': string;
  'tx.summaryTotal': string;
  'tx.showingCount': string;

  // Accounts View
  'acc.title': string;
  'acc.subtitle': string;
  'acc.addBtn': string;
  'acc.transferBtn': string;
  'acc.payCardBtn': string;
  'acc.availableLimit': string;
  'acc.totalOutstanding': string;
  'acc.sourceAccount': string;
  'acc.destAccount': string;
  'acc.transferAmount': string;
  'acc.transferFee': string;
  'acc.transferSuccess': string;
  'acc.cardPaymentSuccess': string;
  'acc.typeCash': string;
  'acc.typeBank': string;
  'acc.typeBkash': string;
  'acc.typeNagad': string;
  'acc.typeRocket': string;
  'acc.typeCreditCard': string;
  'acc.typeDebitCard': string;
  'acc.accountNumber': string;
  'acc.balance': string;
  'acc.cardLimit': string;

  // People & Debt
  'people.title': string;
  'people.subtitle': string;
  'people.addBtn': string;
  'people.totalReceivable': string;
  'people.totalPayable': string;
  'people.receiveBtn': string;
  'people.payBtn': string;
  'people.history': string;
  'people.totalGiven': string;
  'people.totalReceived': string;
  'people.totalBorrowed': string;
  'people.totalRepaid': string;
  'people.currentReceivable': string;
  'people.currentPayable': string;
  'people.noPeople': string;
  'people.personName': string;
  'people.phone': string;
  'people.settleSuccess': string;

  // Budget & Bills
  'budget.title': string;
  'budget.subtitle': string;
  'budget.setLimit': string;
  'budget.monthlyLimit': string;
  'budget.spent': string;
  'budget.remaining': string;
  'budget.overLimit': string;
  'budget.nearLimit': string;
  'budget.onTrack': string;
  'budget.addReminder': string;
  'budget.remTitle': string;
  'budget.dueDate': string;
  'budget.markPaid': string;
  'budget.paidSuccess': string;
  'budget.recurringBills': string;
  'budget.billReminders': string;
  'budget.frequency': string;
  'budget.statusPaid': string;
  'budget.statusPending': string;

  // Reports View
  'rep.title': string;
  'rep.subtitle': string;
  'rep.monthSelect': string;
  'rep.statement': string;
  'rep.categoryDistribution': string;
  'rep.accountOutflow': string;
  'rep.exportPDF': string;
  'rep.exportExcel': string;
  'rep.exportCSV': string;
  'rep.healthScore': string;
  'rep.aiDoctor': string;
  'rep.topSpending': string;
  'rep.wasteAlerts': string;
  'rep.savingsTips': string;
  'rep.overview': string;
  'rep.netSavings': string;

  // AI Assistant
  'ai.title': string;
  'ai.subtitle': string;
  'ai.inputPlaceholder': string;
  'ai.askBtn': string;
  'ai.voiceRecord': string;
  'ai.listening': string;
  'ai.stopListening': string;
  'ai.quickPrompts': string;
  'ai.contextActions': string;
  'ai.analyzing': string;
  'ai.confidence': string;
  'ai.parsedItems': string;
  'ai.confirmAdd': string;
  'ai.autoAddNotice': string;
  'ai.exactCalcNotice': string;

  // Settings View
  'set.title': string;
  'set.subtitle': string;
  'set.language': string;
  'set.bnLang': string;
  'set.enLang': string;
  'set.appearance': string;
  'set.lightMode': string;
  'set.darkMode': string;
  'set.systemMode': string;
  'set.security': string;
  'set.pinSecurity': string;
  'set.pinActive': string;
  'set.pinInactive': string;
  'set.setPin': string;
  'set.disablePin': string;
  'set.enterNewPin': string;
  'set.autoAdd': string;
  'set.autoAddDesc': string;
  'set.cloudSync': string;
  'set.cloudSyncDesc': string;
  'set.deviceId': string;
  'set.backupBtn': string;
  'set.restoreBtn': string;
  'set.lastBackup': string;
  'set.exportJSON': string;
  'set.exportJSONDesc': string;
  'set.downloadJSON': string;
  'set.importJSON': string;
  'set.resetDB': string;
  'set.resetDBDesc': string;
  'set.resetBtn': string;
  'set.resetConfirm': string;

  // Global Search
  'search.title': string;
  'search.placeholder': string;
  'search.peopleResults': string;
  'search.categoryResults': string;
  'search.txResults': string;
  'search.accountResults': string;
  'search.noResults': string;
  'search.recentSearches': string;

  // Modals & Toasts
  'modal.addTx': string;
  'modal.editTx': string;
  'modal.addAcc': string;
  'modal.addPerson': string;
  'modal.transfer': string;
  'modal.payCard': string;
  'modal.setBudget': string;
  'modal.addReminder': string;
  'toast.saved': string;
  'toast.deleted': string;
  'toast.updated': string;
  'toast.error': string;
}

export const translations: Record<Language, Translations> = {
  bn: {
    'dash.viewAll': 'সব দেখুন',
    'app.name': 'আমার হিসাব',
    'people.addPersonBtn': 'নতুন ব্যক্তি যোগ করুন',
    'people.searchPlaceholder': 'নাম বা ফোন নম্বর দিয়ে খুঁজুন...',
    'people.historyBtn': 'লেনদেনের ইতিহাস',
    'people.receivable': 'পাওনা',
    'people.payable': 'দেনা',
    'people.settled': 'সম্পূর্ণ নিষ্পত্তিকৃত',
    'people.name': 'নাম',
    'people.relationship': 'সম্পর্ক',
    'budget.tabBudgets': 'মাসিক বাজেট',
    'budget.tabRecurring': 'পুনরাবৃত্ত খরচ',
    'budget.tabReminders': 'বিল রিমাইন্ডার',
    'budget.totalBudget': 'মোট বাজেট',
    'budget.totalSpent': 'মোট খরচ',
    'budget.addRecurring': 'পুনরাবৃত্ত খরচ যোগ',
    'budget.dueDay': 'পরিশোধের তারিখ',
    'rep.exportPdf': 'পিডিএফ রিপোর্ট',
    'rep.categoryBreakdown': 'ক্যাটাগরি অনুযায়ী খরচ',
    'rep.accountBreakdown': 'অ্যাকাউন্ট অনুযায়ী লেনদেন',
    'set.langTitle': 'ভাষা (Language)',
    'set.themeTitle': 'অ্যাপ থিম (Theme)',
    'set.themeDark': 'ডার্ক মোড',
    'set.themeLight': 'লাইট মোড',
    'set.themeSystem': 'সিস্টেম থিম',
    'set.pinTitle': '৪-সংখ্যার সিকিউরিটি পিন',
    'set.pinEnabled': 'পিন লক সক্রিয়',
    'set.pinDisabled': 'পিন লক নিষ্ক্রিয়',
    'set.enablePin': 'পিন সেট করুন',
    'set.jsonBackup': 'অফলাইন ব্যাকআপ ও রিস্টোর',
    'set.jsonBackupDesc': 'ডিভাইসে JSON ব্যাকআপ ফাইল সেভ করুন অথবা রিস্টোর করুন',
    'set.exportJson': 'JSON ডাউনলোড',
    'set.importJson': 'JSON আপলোড',
    'set.resetDb': 'সব ডেটা মুছে ফেলুন',
    'set.resetDbDesc': 'সকল লোকাল লেনদেন ও তথ্য রিসেট করুন',
    'ai.tabHealth': 'আর্থিক স্বাস্থ্য',
    'ai.tabAdvisor': 'স্মার্ট এআই পরামর্শ',
    'ai.healthScore': 'আর্থিক স্বাস্থ্য স্কোর',
    'ai.reanalyzeBtn': 'পুনরায় বিশ্লেষণ',
    'ai.spendingInsights': 'ব্যয়ের বিশ্লেষণ',
    'ai.wasteWarnings': 'অপ্রয়োজনীয় খরচের সতর্কতা',
    'ai.savingsAdvice': 'সঞ্চয়ের পরামর্শ',
    // Navigation
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.transactions': 'লেনদেন',
    'nav.aiAssistant': 'এআই সহকারী',
    'nav.accounts': 'হিসাব ও ওয়ালেট',
    'nav.people': 'দেনা-পাওনা',
    'nav.budget': 'বাজেট ও বিল',
    'nav.reports': 'রিপোর্ট ও বিশ্লেষণ',
    'nav.settings': 'সেটিংস',
    'nav.spreadsheet': 'ডেটা শিট',
    'nav.globalSearch': 'অনুসন্ধান',
    'nav.quickAdd': 'নতুন লেনদেন',
    'nav.income': 'আয়',
    'nav.expense': 'ব্যয়',
    'nav.cash': 'নগদ ক্যাশ',
    'nav.bank': 'ব্যাংক',
    'nav.mobileBanking': 'মোবাইল ব্যাংকিং',
    'nav.cards': 'কার্ড',
    'nav.receivable': 'পাওনা',
    'nav.payable': 'দেনা',
    'nav.reminders': 'বিল রিমাইন্ডার',
    'nav.analytics': 'বিশ্লেষণ',

    // Actions
    'action.save': 'সংরক্ষণ করুন',
    'action.cancel': 'বাতিল',
    'action.edit': 'সম্পাদনা',
    'action.delete': 'মুছুন',
    'action.add': 'যোগ করুন',
    'action.search': 'অনুসন্ধান',
    'action.filter': 'ফিল্টার',
    'action.export': 'এক্সপোর্ট',
    'action.download': 'ডাউনলোড',
    'action.confirm': 'নিশ্চিত করুন',
    'action.back': 'ফিরে যান',
    'action.viewDetails': 'বিস্তারিত দেখুন',
    'action.viewAll': 'সব দেখুন',
    'action.settle': 'নিষ্পত্তি',
    'action.transfer': 'স্থানান্তর',
    'action.payBill': 'বিল পরিশোধ',
    'action.reset': 'রিসেট',
    'action.close': 'বন্ধ করুন',
    'action.copy': 'কপি করুন',
    'action.share': 'শেয়ার করুন',
    'action.print': 'প্রিন্ট করুন',
    'action.apply': 'প্রয়োগ করুন',
    'action.refresh': 'রিফ্রেশ',
    'action.clear': 'পরিষ্কার করুন',

    // Dashboard
    'dash.title': 'আর্থিক ড্যাশবোর্ড',
    'dash.subtitle': 'আপনার দৈনন্দিন আয়-ব্যয়, ব্যালেন্স এবং পাওনার সার্বিক হিসাব',
    'dash.todayIncome': 'আজকের আয়',
    'dash.todayExpense': 'আজকের ব্যয়',
    'dash.todayNet': 'আজকের নীট স্থিতি',
    'dash.monthIncome': 'এই মাসের মোট আয়',
    'dash.monthExpense': 'এই মাসের মোট ব্যয়',
    'dash.monthSavings': 'এই মাসের নীট সঞ্চয়',
    'dash.savingsRate': 'সঞ্চয়ের হার',
    'dash.netWorth': 'মোট সম্পদ (Net Worth)',
    'dash.totalAssets': 'মোট মোট সম্পদ',
    'dash.totalLiabilities': 'মোট দায় ও দেনা',
    'dash.totalCash': 'হাতে থাকা নগদ ক্যাশ',
    'dash.totalBank': 'ব্যাংক স্থিতি',
    'dash.totalMobile': 'মোবাইল ওয়ালেট',
    'dash.totalCreditDue': 'ক্রেডিট কার্ড বকেয়া',
    'dash.totalReceivable': 'মোট পাওনা (পাবো)',
    'dash.totalPayable': 'মোট দেনা (দেবো)',
    'dash.recentTransactions': 'সাম্প্রতিক লেনদেন',
    'dash.pendingReminders': 'আসন্ন বিল ও রিমাইন্ডার',
    'dash.flowTrend': 'গত ৭ দিনের নগদ প্রবাহ',
    'dash.quickActions': 'দ্রুত কাজ',
    'dash.noReminders': 'কোনো বকেয়া বিল রিমাইন্ডার নেই!',
    'dash.noTransactions': 'এখনও কোনো লেনদেন রেকর্ড করা হয়নি',
    'dash.financialHealth': 'আর্থিক স্বাস্থ্য স্কোর',
    'dash.aiInsights': 'এআই পর্যালোচনা ও অন্তর্দৃষ্টি',

    // Transactions
    'tx.title': 'লেনদেন ও খতিয়ান',
    'tx.subtitle': 'সমস্ত আয়, ব্যয়, স্থানান্তর এবং ধার-দেনার বিস্তারিত হিসাবপত্র',
    'tx.newBtn': 'নতুন লেনদেন যোগ',
    'tx.timelineView': 'টাইমলাইন ভিউ',
    'tx.tableView': 'শিট / টেবিল ভিউ',
    'tx.searchPlaceholder': 'বিবরণ, খাত, অ্যাকাউন্ট বা নোট অনুসন্ধান করুন...',
    'tx.filterType': 'লেনদেনের ধরন',
    'tx.filterAccount': 'অ্যাকাউন্ট',
    'tx.filterCategory': 'ক্যাটাগরি',
    'tx.filterAll': 'সকল',
    'tx.typeIncome': 'আয়',
    'tx.typeExpense': 'ব্যয়',
    'tx.typeTransfer': 'স্থানান্তর',
    'tx.typeMoneyGiven': 'ধার প্রদান (পাওনা)',
    'tx.typeMoneyReceived': 'ধার ফেরত পাওয়া',
    'tx.typeCreditPurchase': 'কার্ড কেনাকাটা',
    'tx.typeCreditPayment': 'কার্ড বিল পরিশোধ',
    'tx.typeRefund': 'রিফান্ড / ফেরত',
    'tx.date': 'তারিখ',
    'tx.time': 'সময়',
    'tx.account': 'হিসাব / অ্যাকাউন্ট',
    'tx.toAccount': 'গন্তব্য অ্যাকাউন্ট',
    'tx.category': 'খাত / ক্যাটাগরি',
    'tx.amount': 'পরিমাণ',
    'tx.description': 'বিবরণ',
    'tx.notes': 'নোট',
    'tx.person': 'সংশ্লিষ্ট ব্যক্তি',
    'tx.status': 'স্ট্যাটাস',
    'tx.statusCompleted': 'সম্পন্ন',
    'tx.statusPending': 'অপেক্ষমান',
    'tx.actions': 'অ্যাকশন',
    'tx.noResults': 'কোনো লেনদেন পাওয়া যায়নি',
    'tx.deleteConfirm': 'আপনি কি নিশ্চিতভাবে এই লেনদেনটি মুছে ফেলতে চান?',
    'tx.duplicate': 'অনুরূপ তৈরি',
    'tx.summaryTotal': 'মোট লেনদেন সংখ্যা',
    'tx.showingCount': 'দেখানো হচ্ছে',

    // Accounts
    'acc.title': 'অ্যাকাউন্ট ও ওয়ালেট',
    'acc.subtitle': 'নগদ ক্যাশ, ব্যাংক, বিকাশ, নগদ এবং ক্রেডিট কার্ডের ব্যালেন্স পরিচালনা',
    'acc.addBtn': 'নতুন অ্যাকাউন্ট',
    'acc.transferBtn': 'টাকা স্থানান্তর',
    'acc.payCardBtn': 'কার্ড বিল পরিশোধ',
    'acc.availableLimit': 'ব্যবহারযোগ্য ক্রেডিট লিমিট',
    'acc.totalOutstanding': 'বর্তমান বকেয়া বিল',
    'acc.sourceAccount': 'উৎস অ্যাকাউন্ট',
    'acc.destAccount': 'গন্তব্য অ্যাকাউন্ট',
    'acc.transferAmount': 'স্থানান্তরের পরিমাণ',
    'acc.transferFee': 'চার্জ / ফি (যদি থাকে)',
    'acc.transferSuccess': 'টাকা স্থানান্তর সফল হয়েছে!',
    'acc.cardPaymentSuccess': 'ক্রেডিট কার্ড বিল পরিশোধ সফল হয়েছে!',
    'acc.typeCash': 'নগদ ক্যাশ',
    'acc.typeBank': 'ব্যাংক হিসাব',
    'acc.typeBkash': 'বিকাশ',
    'acc.typeNagad': 'নগদ',
    'acc.typeRocket': 'রকেট',
    'acc.typeCreditCard': 'ক্রেডিট কার্ড',
    'acc.typeDebitCard': 'ডেবিট কার্ড',
    'acc.accountNumber': 'অ্যাকাউন্ট নম্বর',
    'acc.balance': 'বর্তমান স্থিতি',
    'acc.cardLimit': 'মোট ক্রেডিট লিমিট',

    // People & Debt
    'people.title': 'দেনা-পাওনা ও ধার দেনা',
    'people.subtitle': 'ব্যক্তিভিত্তিক দেনা ও পাওনা টাকার হিসাব এবং নিষ্পত্তির ইতিহাস',
    'people.addBtn': 'নতুন ব্যক্তি যোগ',
    'people.totalReceivable': 'অন্যদের কাছে মোট পাওনা',
    'people.totalPayable': 'অন্যদেরকে মোট দেনা',
    'people.receiveBtn': 'টাকা গ্রহণ / আদায়',
    'people.payBtn': 'টাকা পরিশোধ',
    'people.history': 'লেনদেনের খতিয়ান',
    'people.totalGiven': 'মোট দেওয়া হয়েছে',
    'people.totalReceived': 'মোট ফেরত পেয়েছি',
    'people.totalBorrowed': 'মোট নিয়েছি',
    'people.totalRepaid': 'মোট শোধ করেছি',
    'people.currentReceivable': 'এখনও পাবো',
    'people.currentPayable': 'এখনও দেবো',
    'people.noPeople': 'কোনো ব্যক্তির ধার-দেনা রেকর্ড নেই',
    'people.personName': 'ব্যক্তির নাম',
    'people.phone': 'মোবাইল নম্বর',
    'people.settleSuccess': 'লেনদেন সফলভাবে রেকর্ড ও ব্যালেন্স সমন্বয় হয়েছে!',

    // Budget & Bills
    'budget.title': 'বাজেট ও বিল রিমাইন্ডার',
    'budget.subtitle': 'খাতভিত্তিক মাসিক ব্যয়ের সীমা এবং পুনরাবৃত্ত বিল ট্র্যাকিং',
    'budget.setLimit': 'বাজেট সীমা নির্ধারণ',
    'budget.monthlyLimit': 'মাসিক বরাদ্দকৃত সীমা',
    'budget.spent': 'ব্যয় হয়েছে',
    'budget.remaining': 'অবশিষ্ট আছে',
    'budget.overLimit': 'বাজেট অতিক্রম করেছে!',
    'budget.nearLimit': 'সীমার কাছাকাছি (৮০%+)',
    'budget.onTrack': 'নিয়ন্ত্রণে আছে',
    'budget.addReminder': 'নতুন বিল রিমাইন্ডার',
    'budget.remTitle': 'বিলের শিরোনাম',
    'budget.dueDate': 'পরিশোধের শেষ তারিখ',
    'budget.markPaid': 'পরিশোধ সম্পন্ন',
    'budget.paidSuccess': 'বিল পরিশোধ সম্পন্ন হিসেবে রেকর্ড হয়েছে!',
    'budget.recurringBills': 'পুনরাবৃত্ত খরচ',
    'budget.billReminders': 'আসন্ন বিলের তালিকা',
    'budget.frequency': 'পুনরাবৃত্তির সময়সীমা',
    'budget.statusPaid': 'পরিশোধিত',
    'budget.statusPending': 'বকেয়া',

    // Reports
    'rep.title': 'আর্থিক রিপোর্ট ও বিশ্লেষণ',
    'rep.subtitle': 'মাসিক হিসাব বিবরণী, খাতভিত্তিক চার্ট এবং অফলাইন এক্সপোর্ট সুবিধা',
    'rep.monthSelect': 'মাসের হিসাব নির্বাচন করুন',
    'rep.statement': 'আয়-ব্যয় আর্থিক বিবরণী',
    'rep.categoryDistribution': 'খাতভিত্তিক ব্যয় বণ্টন',
    'rep.accountOutflow': 'অ্যাকাউন্টভিত্তিক বহির্গমন',
    'rep.exportPDF': 'পিডিএফ রিপোর্ট (PDF)',
    'rep.exportExcel': 'এক্সেল শিট (.XLSX)',
    'rep.exportCSV': 'সিএসভি ডাটা (.CSV)',
    'rep.healthScore': 'আর্থিক স্বাস্থ্য স্কোর',
    'rep.aiDoctor': 'এআই আর্থিক পরামর্শদাতা',
    'rep.topSpending': 'সর্বোচ্চ খরচের খাতসমূহ',
    'rep.wasteAlerts': 'অপ্রয়োজনীয় ব্যয়ের সতর্কতা',
    'rep.savingsTips': 'সঞ্চয় বাড়ানোর উপায়',
    'rep.overview': 'সামগ্রিক মূল্যায়ন',
    'rep.netSavings': 'নীট উদ্বৃত্ত / সঞ্চয়',

    // AI Assistant
    'ai.title': 'এআই আর্থিক সহকারী ও হিসাবরক্ষক',
    'ai.subtitle': 'আপনার লাইভ ডাটাবেসের তথ্যের ওপর ভিত্তি করে নিখুঁত উত্তর ও বিশ্লেষণ',
    'ai.inputPlaceholder': 'যেকোনো হিসাব লিখুন বা প্রশ্ন করুন (যেমন: এই মাসে খাবারে কত খরচ হলো?)...',
    'ai.askBtn': 'জিজ্ঞাসা করুন',
    'ai.voiceRecord': 'মুখে বলুন',
    'ai.listening': 'শুনছি... আপনার হিসাব বলুন',
    'ai.stopListening': 'রেকর্ডিং সম্পন্ন',
    'ai.quickPrompts': 'জনপ্রিয় প্রশ্নসমূহ',
    'ai.contextActions': 'দ্রুত অ্যাকশন',
    'ai.analyzing': 'এআই ডাটাবেস বিশ্লেষণ করছে...',
    'ai.confidence': 'নিশ্চয়তা স্কোর',
    'ai.parsedItems': 'শনাক্তকৃত এন্ট্রি সমূহ',
    'ai.confirmAdd': 'হিসাবে যুক্ত করুন',
    'ai.autoAddNotice': 'স্বয়ংক্রিয় সেভ সক্রিয়',
    'ai.exactCalcNotice': 'সরাসরি লাইভ খতিয়ান ও ডাটাবেস থেকে গণনা করা হয়েছে',

    // Settings
    'set.title': 'অ্যাপ সেটিংস ও কনফিগারেশন',
    'set.subtitle': 'ভাষা, থিম, নিরাপত্তা পিন, ক্লাউড ব্যাকআপ এবং ডাটাবেস ব্যবস্থাপনা',
    'set.language': 'ভাষা (Language)',
    'set.bnLang': 'বাংলা 🇧🇩',
    'set.enLang': 'English 🇬🇧',
    'set.appearance': 'প্রদর্শন ও থিম (Appearance)',
    'set.lightMode': 'হালকা মোড (Light)',
    'set.darkMode': 'ডার্ক মোড (Dark)',
    'set.systemMode': 'সিস্টেম অনুযায়ী (System)',
    'set.security': 'নিরাপত্তা ও পিন লক',
    'set.pinSecurity': 'অ্যাপ পিন সুরক্ষা (PIN Security)',
    'set.pinActive': '৪-ডিজিটের পিন সুরক্ষা সক্রিয় আছে',
    'set.pinInactive': 'পিন সুরক্ষা বন্ধ আছে',
    'set.setPin': 'নতুন পিন সেট করুন',
    'set.disablePin': 'পিন বন্ধ করুন',
    'set.enterNewPin': '৪ ডিজিটের পিন কোড দিন',
    'set.autoAdd': 'অটো-অ্যাড মোড (Auto Add)',
    'set.autoAddDesc': '৯০%+ নিশ্চিত ভয়েস ও টেক্সট এন্ট্রি কনফার্মেশন ছাড়াই সেভ হবে',
    'set.cloudSync': 'ক্লাউড সিঙ্ক ও ব্যাকআপ (Offline-First)',
    'set.cloudSyncDesc': 'ক্লাউড সার্ভারের সাথে ব্যাকআপ সিনক্রোনাইজেশন',
    'set.deviceId': 'ডিভাইস আইডি',
    'set.backupBtn': 'ক্লাউডে ব্যাকআপ নিন',
    'set.restoreBtn': 'ক্লাউড থেকে রিস্টোর করুন',
    'set.lastBackup': 'সর্বশেষ ব্যাকআপ',
    'set.exportJSON': 'সম্পূর্ণ ডাটাবেস ব্যাকআপ (JSON)',
    'set.exportJSONDesc': 'আপনার সমস্ত আর্থিক হিসাব ও খতিয়ান ফাইল হিসেবে সংরক্ষণ করুন',
    'set.downloadJSON': 'ব্যাকআপ ফাইল ডাউনলোড',
    'set.importJSON': 'JSON ফাইল ইমপোর্ট করুন',
    'set.resetDB': 'ডাটাবেস রিসেট (Factory Reset)',
    'set.resetDBDesc': 'সমস্ত তথ্য মুছে প্রাথমিক নমুনা ডেটায় ফিরে যাবে',
    'set.resetBtn': 'ডাটাবেস রিসেট করুন',
    'set.resetConfirm': 'আপনি কি সমস্ত ডাটা মুছে প্রাথমিক অবস্থায় ফিরে যেতে চান?',

    // Global Search
    'search.title': 'স্মার্ট গ্লোবাল সার্চ',
    'search.placeholder': 'ব্যক্তি, খাত, অ্যাকাউন্ট বা নোট অনুসন্ধান করুন...',
    'search.peopleResults': 'সংশ্লিষ্ট ব্যক্তি ও দেনা-পাওনা',
    'search.categoryResults': 'খাতভিত্তিক লেনদেনের তথ্য',
    'search.txResults': 'মিল পাওয়া লেনদেনসমূহ',
    'search.accountResults': 'অ্যাকাউন্টসমূহ',
    'search.noResults': 'কোনো মিল পাওয়া যায়নি',
    'search.recentSearches': 'সাম্প্রতিক অনুসন্ধান',

    // Modals & Toasts
    'modal.addTx': 'নতুন লেনদেন তৈরি করুন',
    'modal.editTx': 'লেনদেন সম্পাদনা করুন',
    'modal.addAcc': 'নতুন অ্যাকাউন্ট যোগ করুন',
    'modal.addPerson': 'নতুন ব্যক্তির হিসাব তৈরি করুন',
    'modal.transfer': 'টাকা স্থানান্তর করুন',
    'modal.payCard': 'ক্রেডিট কার্ডের বকেয়া বিল পরিশোধ',
    'modal.setBudget': 'বাজেট নির্ধারণ করুন',
    'modal.addReminder': 'নতুন বিল রিমাইন্ডার যোগ করুন',
    'toast.saved': 'সফলভাবে সংরক্ষিত হয়েছে!',
    'toast.deleted': 'সফলভাবে মুছে ফেলা হয়েছে!',
    'toast.updated': 'সফলভাবে আপডেট হয়েছে!',
    'toast.error': 'একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
  },

  en: {
    'dash.viewAll': 'View All',
    'app.name': 'Amar Hisab',
    'people.addPersonBtn': 'Add Person',
    'people.searchPlaceholder': 'Search by name or phone...',
    'people.historyBtn': 'Transaction History',
    'people.receivable': 'Receivable',
    'people.payable': 'Payable',
    'people.settled': 'Fully Settled',
    'people.name': 'Name',
    'people.relationship': 'Relationship',
    'budget.tabBudgets': 'Monthly Budgets',
    'budget.tabRecurring': 'Recurring Bills',
    'budget.tabReminders': 'Bill Reminders',
    'budget.totalBudget': 'Total Budget',
    'budget.totalSpent': 'Total Spent',
    'budget.addRecurring': 'Add Recurring Bill',
    'budget.dueDay': 'Due Date',
    'rep.exportPdf': 'PDF Report',
    'rep.categoryBreakdown': 'Category Breakdown',
    'rep.accountBreakdown': 'Account Breakdown',
    'set.langTitle': 'Language Selection',
    'set.themeTitle': 'App Theme',
    'set.themeDark': 'Dark Mode',
    'set.themeLight': 'Light Mode',
    'set.themeSystem': 'System Default',
    'set.pinTitle': '4-Digit Security PIN',
    'set.pinEnabled': 'PIN Lock Active',
    'set.pinDisabled': 'PIN Lock Inactive',
    'set.enablePin': 'Set PIN',
    'set.jsonBackup': 'Offline Backup & Restore',
    'set.jsonBackupDesc': 'Save or restore backup JSON file locally',
    'set.exportJson': 'Download JSON',
    'set.importJson': 'Upload JSON',
    'set.resetDb': 'Reset All Data',
    'set.resetDbDesc': 'Reset all local transactions and information',
    'ai.tabHealth': 'Financial Health',
    'ai.tabAdvisor': 'AI Advisor',
    'ai.healthScore': 'Health Score',
    'ai.reanalyzeBtn': 'Re-analyze',
    'ai.spendingInsights': 'Spending Insights',
    'ai.wasteWarnings': 'Waste Alerts',
    'ai.savingsAdvice': 'Savings Advice',
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.aiAssistant': 'AI Assistant',
    'nav.accounts': 'Accounts & Wallets',
    'nav.people': 'Debts & Loans',
    'nav.budget': 'Budget & Bills',
    'nav.reports': 'Reports & Analytics',
    'nav.settings': 'Settings',
    'nav.spreadsheet': 'Data Sheet',
    'nav.globalSearch': 'Search',
    'nav.quickAdd': 'Add Transaction',
    'nav.income': 'Income',
    'nav.expense': 'Expense',
    'nav.cash': 'Cash',
    'nav.bank': 'Bank',
    'nav.mobileBanking': 'Mobile Banking',
    'nav.cards': 'Cards',
    'nav.receivable': 'Receivables',
    'nav.payable': 'Payables',
    'nav.reminders': 'Bill Reminders',
    'nav.analytics': 'Analytics',

    // Actions
    'action.save': 'Save Changes',
    'action.cancel': 'Cancel',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.add': 'Add New',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.export': 'Export',
    'action.download': 'Download',
    'action.confirm': 'Confirm',
    'action.back': 'Go Back',
    'action.viewDetails': 'View Details',
    'action.viewAll': 'View All',
    'action.settle': 'Settle',
    'action.transfer': 'Transfer',
    'action.payBill': 'Pay Bill',
    'action.reset': 'Reset',
    'action.close': 'Close',
    'action.copy': 'Copy',
    'action.share': 'Share',
    'action.print': 'Print',
    'action.apply': 'Apply',
    'action.refresh': 'Refresh',
    'action.clear': 'Clear',

    // Dashboard
    'dash.title': 'Financial Dashboard',
    'dash.subtitle': 'Real-time overview of daily income, expenses, accounts, and debts',
    'dash.todayIncome': "Today's Income",
    'dash.todayExpense': "Today's Expense",
    'dash.todayNet': "Today's Net Flow",
    'dash.monthIncome': 'Total Monthly Income',
    'dash.monthExpense': 'Total Monthly Expenses',
    'dash.monthSavings': 'Net Monthly Savings',
    'dash.savingsRate': 'Savings Rate',
    'dash.netWorth': 'Net Worth',
    'dash.totalAssets': 'Total Assets',
    'dash.totalLiabilities': 'Total Liabilities',
    'dash.totalCash': 'Cash in Hand',
    'dash.totalBank': 'Bank Balances',
    'dash.totalMobile': 'Mobile Wallets',
    'dash.totalCreditDue': 'Credit Card Outstanding',
    'dash.totalReceivable': 'Total Receivables (Owed to Me)',
    'dash.totalPayable': 'Total Payables (I Owe Others)',
    'dash.recentTransactions': 'Recent Transactions',
    'dash.pendingReminders': 'Upcoming Bills & Reminders',
    'dash.flowTrend': '7-Day Cash Flow Trend',
    'dash.quickActions': 'Quick Actions',
    'dash.noReminders': 'No pending bills or reminders!',
    'dash.noTransactions': 'No transactions recorded yet',
    'dash.financialHealth': 'Financial Health Score',
    'dash.aiInsights': 'AI Financial Insights',

    // Transactions
    'tx.title': 'Transactions & Ledger',
    'tx.subtitle': 'Comprehensive history of all income, expenses, transfers, and loans',
    'tx.newBtn': 'New Transaction',
    'tx.timelineView': 'Timeline View',
    'tx.tableView': 'Sheet / Table View',
    'tx.searchPlaceholder': 'Search description, category, account or note...',
    'tx.filterType': 'Transaction Type',
    'tx.filterAccount': 'Account',
    'tx.filterCategory': 'Category',
    'tx.filterAll': 'All',
    'tx.typeIncome': 'Income',
    'tx.typeExpense': 'Expense',
    'tx.typeTransfer': 'Transfer',
    'tx.typeMoneyGiven': 'Loan Given (Receivable)',
    'tx.typeMoneyReceived': 'Loan Repaid (Received)',
    'tx.typeCreditPurchase': 'Card Purchase',
    'tx.typeCreditPayment': 'Card Bill Payment',
    'tx.typeRefund': 'Refund',
    'tx.date': 'Date',
    'tx.time': 'Time',
    'tx.account': 'Source Account',
    'tx.toAccount': 'Destination Account',
    'tx.category': 'Category',
    'tx.amount': 'Amount',
    'tx.description': 'Description',
    'tx.notes': 'Notes',
    'tx.person': 'Related Person',
    'tx.status': 'Status',
    'tx.statusCompleted': 'Completed',
    'tx.statusPending': 'Pending',
    'tx.actions': 'Actions',
    'tx.noResults': 'No transactions found',
    'tx.deleteConfirm': 'Are you sure you want to delete this transaction?',
    'tx.duplicate': 'Duplicate',
    'tx.summaryTotal': 'Total Transactions',
    'tx.showingCount': 'Showing',

    // Accounts
    'acc.title': 'Accounts & Wallets',
    'acc.subtitle': 'Manage Cash, Bank accounts, bKash, Nagad, and Credit Cards',
    'acc.addBtn': 'Add Account',
    'acc.transferBtn': 'Transfer Money',
    'acc.payCardBtn': 'Pay Card Bill',
    'acc.availableLimit': 'Available Credit Limit',
    'acc.totalOutstanding': 'Current Outstanding Due',
    'acc.sourceAccount': 'Source Account',
    'acc.destAccount': 'Destination Account',
    'acc.transferAmount': 'Transfer Amount',
    'acc.transferFee': 'Fee / Charge (if any)',
    'acc.transferSuccess': 'Money transferred successfully!',
    'acc.cardPaymentSuccess': 'Credit card bill paid successfully!',
    'acc.typeCash': 'Cash in Hand',
    'acc.typeBank': 'Bank Account',
    'acc.typeBkash': 'bKash Wallet',
    'acc.typeNagad': 'Nagad Wallet',
    'acc.typeRocket': 'Rocket Wallet',
    'acc.typeCreditCard': 'Credit Card',
    'acc.typeDebitCard': 'Debit Card',
    'acc.accountNumber': 'Account Number',
    'acc.balance': 'Current Balance',
    'acc.cardLimit': 'Credit Limit',

    // People & Debt
    'people.title': 'Debts & Receivables',
    'people.subtitle': 'Track money lent to or borrowed from individuals and settlement history',
    'people.addBtn': 'Add Person',
    'people.totalReceivable': 'Total Receivables (Owed to Me)',
    'people.totalPayable': 'Total Payables (I Owe Others)',
    'people.receiveBtn': 'Receive Money',
    'people.payBtn': 'Pay Debt',
    'people.history': 'Ledger History',
    'people.totalGiven': 'Total Given',
    'people.totalReceived': 'Total Received',
    'people.totalBorrowed': 'Total Borrowed',
    'people.totalRepaid': 'Total Repaid',
    'people.currentReceivable': 'Still Receivable',
    'people.currentPayable': 'Still Payable',
    'people.noPeople': 'No debt records found',
    'people.personName': 'Person Name',
    'people.phone': 'Phone Number',
    'people.settleSuccess': 'Settlement transaction recorded successfully!',

    // Budget & Bills
    'budget.title': 'Budget & Bill Reminders',
    'budget.subtitle': 'Category-wise monthly spending caps and recurring utility bills',
    'budget.setLimit': 'Set Budget Limit',
    'budget.monthlyLimit': 'Allocated Monthly Limit',
    'budget.spent': 'Spent',
    'budget.remaining': 'Remaining',
    'budget.overLimit': 'Over Budget!',
    'budget.nearLimit': 'Near Limit (80%+)',
    'budget.onTrack': 'On Track',
    'budget.addReminder': 'Add Bill Reminder',
    'budget.remTitle': 'Bill Title',
    'budget.dueDate': 'Payment Due Date',
    'budget.markPaid': 'Mark as Paid',
    'budget.paidSuccess': 'Bill recorded as paid!',
    'budget.recurringBills': 'Recurring Expenses',
    'budget.billReminders': 'Upcoming Bill Reminders',
    'budget.frequency': 'Frequency',
    'budget.statusPaid': 'Paid',
    'budget.statusPending': 'Pending',

    // Reports
    'rep.title': 'Reports & Analytics',
    'rep.subtitle': 'Monthly statements, category breakdowns, and export utilities',
    'rep.monthSelect': 'Select Statement Month',
    'rep.statement': 'Financial Statement',
    'rep.categoryDistribution': 'Expense by Category',
    'rep.accountOutflow': 'Account Outflow',
    'rep.exportPDF': 'PDF Report (.PDF)',
    'rep.exportExcel': 'Excel Sheet (.XLSX)',
    'rep.exportCSV': 'CSV Data (.CSV)',
    'rep.healthScore': 'Financial Health Score',
    'rep.aiDoctor': 'AI Financial Doctor',
    'rep.topSpending': 'Top Spending Categories',
    'rep.wasteAlerts': 'Spending & Waste Alerts',
    'rep.savingsTips': 'Savings Recommendations',
    'rep.overview': 'Executive Summary',
    'rep.netSavings': 'Net Savings',

    // AI Assistant
    'ai.title': 'AI Financial Accountant',
    'ai.subtitle': 'Accurate answers, calculations, and insights powered by your live ledger',
    'ai.inputPlaceholder': 'Type any expense or question (e.g. How much did I spend on groceries?)...',
    'ai.askBtn': 'Ask AI',
    'ai.voiceRecord': 'Voice Input',
    'ai.listening': 'Listening... please speak',
    'ai.stopListening': 'Done Recording',
    'ai.quickPrompts': 'Popular Questions',
    'ai.contextActions': 'Quick Actions',
    'ai.analyzing': 'AI is analyzing your database...',
    'ai.confidence': 'Confidence Score',
    'ai.parsedItems': 'Identified Entries',
    'ai.confirmAdd': 'Add to Ledger',
    'ai.autoAddNotice': 'Auto-Add Enabled',
    'ai.exactCalcNotice': 'Calculated directly from active ledger database',

    // Settings
    'set.title': 'App Settings & Security',
    'set.subtitle': 'Language, theme, PIN protection, cloud sync and database tools',
    'set.language': 'Language',
    'set.bnLang': 'বাংলা 🇧🇩',
    'set.enLang': 'English 🇬🇧',
    'set.appearance': 'Appearance & Theme',
    'set.lightMode': 'Light Mode',
    'set.darkMode': 'Dark Mode',
    'set.systemMode': 'System Default',
    'set.security': 'Security & Protection',
    'set.pinSecurity': 'PIN Lock Security',
    'set.pinActive': '4-digit PIN protection is ACTIVE',
    'set.pinInactive': 'PIN protection is OFF',
    'set.setPin': 'Set New PIN',
    'set.disablePin': 'Disable PIN',
    'set.enterNewPin': 'Enter 4-digit PIN code',
    'set.autoAdd': 'Auto-Add Mode',
    'set.autoAddDesc': 'Automatically save 90%+ confident voice & text entries without confirmation',
    'set.cloudSync': 'Cloud Sync & Backup (Offline-First)',
    'set.cloudSyncDesc': 'Synchronize backups securely with cloud storage',
    'set.deviceId': 'Device ID',
    'set.backupBtn': 'Backup to Cloud',
    'set.restoreBtn': 'Restore from Cloud',
    'set.lastBackup': 'Last Cloud Backup',
    'set.exportJSON': 'Full Database Backup (JSON)',
    'set.exportJSONDesc': 'Download a portable JSON file containing your complete financial history',
    'set.downloadJSON': 'Download JSON File',
    'set.importJSON': 'Import JSON Backup',
    'set.resetDB': 'Reset Database (Factory Reset)',
    'set.resetDBDesc': 'Clear all custom transactions and restore default sample data',
    'set.resetBtn': 'Reset Everything',
    'set.resetConfirm': 'Are you sure you want to erase all data and reset to initial state?',

    // Global Search
    'search.title': 'Smart Global Search',
    'search.placeholder': 'Search person, category, account or note...',
    'search.peopleResults': 'Matching People & Debts',
    'search.categoryResults': 'Category Totals & Spending',
    'search.txResults': 'Matching Transactions',
    'search.accountResults': 'Accounts',
    'search.noResults': 'No matching records found',
    'search.recentSearches': 'Recent Searches',

    // Modals & Toasts
    'modal.addTx': 'Record New Transaction',
    'modal.editTx': 'Edit Transaction',
    'modal.addAcc': 'Add New Account',
    'modal.addPerson': 'Add Person Record',
    'modal.transfer': 'Transfer Funds',
    'modal.payCard': 'Pay Credit Card Bill',
    'modal.setBudget': 'Configure Category Budget',
    'modal.addReminder': 'Add Bill Reminder',
    'toast.saved': 'Successfully saved!',
    'toast.deleted': 'Successfully deleted!',
    'toast.updated': 'Successfully updated!',
    'toast.error': 'An error occurred. Please try again.',
  },
};
