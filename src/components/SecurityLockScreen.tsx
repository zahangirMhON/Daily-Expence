import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck, KeyRound } from 'lucide-react';
import { formatNumber, Language, t } from '../i18n';

interface SecurityLockScreenProps {
  storedPinHash?: string;
  onUnlock: () => void;
  appName?: string;
  lang?: Language;
}

export const SecurityLockScreen: React.FC<SecurityLockScreenProps> = ({
  storedPinHash,
  onUnlock,
  appName = 'AI খরচ হিসাব',
  lang = 'bn',
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');

      if (nextPin.length === 4) {
        // Validate
        if (!storedPinHash || nextPin === storedPinHash) {
          setTimeout(() => {
            onUnlock();
          }, 150);
        } else {
          setError(lang === 'bn' ? 'ভুল পিন নম্বর! আবার চেষ্টা করুন।' : 'Incorrect PIN! Please try again.');
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 px-4 text-slate-100 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
          <Lock className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">{appName}</h2>
        <p className="text-sm text-slate-400 mb-6">{t('set.pinPrompt', lang)}</p>

        {/* PIN Indicators */}
        <div className="mb-8 flex justify-center space-x-4">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`h-4 w-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                    : 'border-2 border-slate-700 bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {error && <p className="mb-4 text-xs font-semibold text-rose-400 animate-bounce">{error}</p>}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              id={`pin-btn-${d}`}
              onClick={() => handleDigit(d)}
              className="flex h-14 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-800/60 text-xl font-semibold text-white transition-all active:scale-95 active:bg-emerald-600/30 hover:border-slate-700 hover:bg-slate-800"
            >
              <span>{formatNumber(d, lang)}</span>
              {lang === 'bn' && <span className="text-[10px] text-slate-400 ml-1">({d})</span>}
            </button>
          ))}
          <div className="flex items-center justify-center">
            <button
              onClick={() => {
                if (confirm(lang === 'bn' ? 'জরুরি আনলক করতে চান?' : 'Perform emergency unlock?')) {
                  onUnlock();
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              {lang === 'bn' ? 'সাহায্য' : 'Help'}
            </button>
          </div>
          <button
            id="pin-btn-0"
            onClick={() => handleDigit('0')}
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-800/60 text-xl font-semibold text-white transition-all active:scale-95 active:bg-emerald-600/30 hover:border-slate-700 hover:bg-slate-800"
          >
            <span>{formatNumber('0', lang)}</span>
            {lang === 'bn' && <span className="text-[10px] text-slate-400 ml-1">(0)</span>}
          </button>
          <button
            id="pin-btn-del"
            onClick={handleDelete}
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-800/40 text-slate-300 transition-all active:scale-95 active:bg-slate-700 hover:bg-slate-800"
          >
            <Delete className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
