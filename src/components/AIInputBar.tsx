import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Wand2, Loader2, HelpCircle } from 'lucide-react';
import { Language, t } from '../i18n';

interface AIInputBarProps {
  onParsePrompt: (prompt: string) => Promise<void>;
  isLoading: boolean;
  compact?: boolean;
  lang?: Language;
  onAskQuestion?: (question: string) => void;
}

export const AIInputBar: React.FC<AIInputBarProps> = ({
  onParsePrompt,
  isLoading,
  compact = false,
  lang = 'bn',
  onAskQuestion,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [activeLang, setActiveLang] = useState<'bn-BD' | 'en-US'>(lang === 'bn' ? 'bn-BD' : 'en-US');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setActiveLang(lang === 'bn' ? 'bn-BD' : 'en-US');
  }, [lang]);

  // Quick suggestion chips
  const samplePromptsBn = [
    'আজ বাজারে ৮৫০ টাকা খরচ করেছি',
    'আজ ৫০০০ টাকা বেতন পেলাম ব্র্যাক ব্যাংকে',
    'রাকিবকে ৩০০০ টাকা ধার দিলাম',
    'রাকিব ১০০০ টাকা ফেরত দিয়েছে',
    'বিকাশে ২০০০ টাকা জমা করলাম',
    'ক্রেডিট কার্ড দিয়ে ৫০০০ টাকার বাজার করেছি',
    'এই মাসে খাবারে কত খরচ হলো?',
    'কার কাছে কত টাকা পাওনা?',
    'আমার কাছে মোট কত টাকা আছে?',
  ];

  const samplePromptsEn = [
    'Spent 850 tk on groceries today',
    'Received 50,000 tk salary in BRAC Bank',
    'Lent 3,000 tk to Rakib',
    'Rakib returned 1,000 tk',
    'Deposited 2,000 tk in bKash',
    'Paid 5,000 tk shopping with Credit Card',
    'How much did I spend on food this month?',
    'Who owes me money and how much?',
    'What is my total net balance?',
  ];

  const samplePrompts = lang === 'bn' ? samplePromptsBn : samplePromptsEn;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = activeLang;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setPrompt(transcript);
      };
      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [activeLang]);

  const toggleListening = () => {
    if (!speechSupported) {
      alert(lang === 'bn' ? 'আপনার ব্রাউজারে স্পিচ রিকগনিশন সমর্থন করে না।' : 'Speech recognition not supported in your browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = activeLang;
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const isQuestion = (text: string) => {
    const q = text.toLowerCase().trim();
    return (
      q.endsWith('?') ||
      q.includes('কত') ||
      q.includes('কার কাছে') ||
      q.includes('কোথায়') ||
      q.includes('কিভাবে') ||
      q.includes('how much') ||
      q.includes('who owes') ||
      q.includes('what is') ||
      q.includes('total balance')
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    if (isQuestion(prompt) && onAskQuestion) {
      onAskQuestion(prompt);
      setPrompt('');
      return;
    }

    onParsePrompt(prompt);
  };

  const handleChipClick = (text: string) => {
    setPrompt(text);
    if (isQuestion(text) && onAskQuestion) {
      onAskQuestion(text);
    } else {
      onParsePrompt(text);
    }
  };

  return (
    <div className={`w-full rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-xl shadow-emerald-950/20 transition-all ${compact ? 'p-3' : 'p-4 sm:p-5'}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{lang === 'bn' ? 'AI স্মার্ট হিসাব ও প্রশ্ন' : 'AI Smart Finance Input'}</span>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Voice & Text
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setActiveLang('bn-BD')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
              activeLang === 'bn-BD' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            বাংলা
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('en-US')}
            className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
              activeLang === 'en-US' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            id="ai-prompt-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder={
              isListening
                ? lang === 'bn' ? 'কথা বলুন... AI শুনছে...' : 'Listening... please speak...'
                : lang === 'bn'
                ? 'হিসাব লিখুন বা প্রশ্ন করুন: "আজ বাজারে ৮৫০ টাকা খরচ" অথবা "এই মাসে খাবারে কত খরচ হলো?"'
                : 'Type expense or ask question: "Spent 850 tk on bazaar" or "How much spent on food?"'
            }
            className={`w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pl-4 pr-24 text-sm text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
              isListening ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-950/10' : ''
            }`}
          />

          <div className="absolute right-2 flex items-center space-x-1.5">
            <button
              id="ai-mic-btn"
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              title={isListening ? 'Stop' : 'Voice Input'}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/50'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <button
              id="ai-submit-btn"
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 font-semibold text-slate-950 transition-all hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 shadow-md shadow-emerald-500/20"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isListening && (
          <div className="mt-2 flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/20 animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>
                {lang === 'bn'
                  ? `ভয়েস ইনপুট সক্রিয় (${activeLang === 'bn-BD' ? 'বাংলা' : 'English'}) — স্পষ্ট করে বলুন`
                  : `Voice Input Active (${activeLang === 'bn-BD' ? 'Bangla' : 'English'}) — Speak clearly`}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className="text-[11px] underline hover:text-white font-semibold"
            >
              {lang === 'bn' ? 'থামান' : 'Stop'}
            </button>
          </div>
        )}
      </form>

      {/* Suggested Quick Prompt Chips */}
      {!compact && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Wand2 className="h-3 w-3 text-emerald-400" />
              <span>{lang === 'bn' ? 'ক্লিক করে সরাসরি টেস্ট করুন:' : 'Click to test directly:'}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 max-h-24 scrollbar-thin">
            {samplePrompts.map((sp, idx) => {
              const isQ = isQuestion(sp);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChipClick(sp)}
                  disabled={isLoading}
                  className={`rounded-xl border px-2.5 py-1 text-xs transition-all text-left whitespace-nowrap flex items-center gap-1 ${
                    isQ
                      ? 'border-purple-500/30 bg-purple-950/30 text-purple-200 hover:bg-purple-900/40 hover:border-purple-400'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300'
                  }`}
                >
                  {isQ && <HelpCircle className="h-3 w-3 text-purple-400 shrink-0" />}
                  <span>{sp}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
