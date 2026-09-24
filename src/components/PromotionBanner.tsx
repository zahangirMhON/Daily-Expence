import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Sparkles,
  Settings,
  X,
  Copy,
  Check,
  Award,
  Flame,
  Globe,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { PromotionConfig, PromotionTheme } from '../types';
import { Language } from '../i18n';

interface PromotionBannerProps {
  config: PromotionConfig;
  onOpenSettings?: () => void;
  onRecordClick?: () => void;
  onRecordImpression?: () => void;
  lang?: Language;
  className?: string;
  isDismissible?: boolean;
}

interface ThemeStyles {
  container: string;
  glow: string;
  badge: string;
  badgeDot: string;
  title: string;
  description: string;
  ctaButton: string;
  promoCodeBox: string;
  iconBg: string;
}

const THEME_STYLES: Record<PromotionTheme, ThemeStyles> = {
  royal_gold: {
    container:
      'border-amber-500/40 bg-gradient-to-br from-amber-950/80 via-slate-900 to-amber-950/60 shadow-xl shadow-amber-950/30',
    glow: 'from-amber-500/20 to-yellow-500/5',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    badgeDot: 'bg-amber-400 shadow-amber-400',
    title: 'text-amber-50',
    description: 'text-amber-200/80',
    ctaButton:
      'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-bold hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-500/25',
    promoCodeBox:
      'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20',
    iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  emerald_green: {
    container:
      'border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 via-slate-900 to-emerald-950/60 shadow-xl shadow-emerald-950/30',
    glow: 'from-emerald-500/20 to-teal-500/5',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    badgeDot: 'bg-emerald-400 shadow-emerald-400',
    title: 'text-emerald-50',
    description: 'text-emerald-200/80',
    ctaButton:
      'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-300 shadow-lg shadow-emerald-500/25',
    promoCodeBox:
      'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
    iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  royal_blue: {
    container:
      'border-blue-500/40 bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/60 shadow-xl shadow-blue-950/30',
    glow: 'from-blue-500/20 to-cyan-500/5',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    badgeDot: 'bg-cyan-400 shadow-cyan-400',
    title: 'text-blue-50',
    description: 'text-blue-200/80',
    ctaButton:
      'bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 text-slate-950 font-bold hover:from-blue-400 hover:to-cyan-300 shadow-lg shadow-blue-500/25',
    promoCodeBox:
      'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20',
    iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  deep_purple: {
    container:
      'border-purple-500/40 bg-gradient-to-br from-purple-950/80 via-slate-900 to-fuchsia-950/60 shadow-xl shadow-purple-950/30',
    glow: 'from-purple-500/20 to-pink-500/5',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    badgeDot: 'bg-purple-400 shadow-purple-400',
    title: 'text-purple-50',
    description: 'text-purple-200/80',
    ctaButton:
      'bg-gradient-to-r from-purple-500 via-purple-400 to-fuchsia-400 text-white font-bold hover:from-purple-400 hover:to-fuchsia-300 shadow-lg shadow-purple-500/25',
    promoCodeBox:
      'bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20',
    iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  ruby_red: {
    container:
      'border-rose-500/40 bg-gradient-to-br from-rose-950/80 via-slate-900 to-red-950/60 shadow-xl shadow-rose-950/30',
    glow: 'from-rose-500/20 to-orange-500/5',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    badgeDot: 'bg-rose-400 shadow-rose-400',
    title: 'text-rose-50',
    description: 'text-rose-200/80',
    ctaButton:
      'bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400 text-white font-bold hover:from-rose-400 hover:to-orange-300 shadow-lg shadow-rose-500/25',
    promoCodeBox:
      'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20',
    iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
  midnight_dark: {
    container:
      'border-slate-700 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-xl shadow-black/50',
    glow: 'from-slate-700/20 to-slate-800/5',
    badge: 'bg-slate-800 text-slate-200 border-slate-600',
    badgeDot: 'bg-slate-400 shadow-slate-400',
    title: 'text-slate-50',
    description: 'text-slate-300/80',
    ctaButton:
      'bg-white text-slate-950 font-bold hover:bg-slate-200 shadow-lg shadow-white/10',
    promoCodeBox:
      'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700',
    iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  cyber_neon: {
    container:
      'border-teal-400/50 bg-gradient-to-br from-slate-950 via-teal-950/50 to-slate-950 shadow-xl shadow-teal-950/40',
    glow: 'from-teal-400/20 to-emerald-400/10',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    badgeDot: 'bg-teal-400 shadow-teal-400',
    title: 'text-teal-50',
    description: 'text-teal-200/80',
    ctaButton:
      'bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 text-slate-950 font-bold hover:from-teal-300 hover:to-cyan-300 shadow-lg shadow-teal-400/30',
    promoCodeBox:
      'bg-teal-500/10 text-teal-300 border-teal-400/30 hover:bg-teal-500/20',
    iconBg: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
  },
};

export const PromotionBanner: React.FC<PromotionBannerProps> = ({
  config,
  onOpenSettings,
  onRecordClick,
  onRecordImpression,
  lang = 'bn',
  className = '',
  isDismissible = true,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);

  useEffect(() => {
    if (config.enabled && !isDismissed && onRecordImpression) {
      onRecordImpression();
    }
  }, [config.enabled, isDismissed]);

  if (!config.enabled || isDismissed) {
    return null;
  }

  const themeKey = (config.colorTheme in THEME_STYLES ? config.colorTheme : 'royal_gold') as PromotionTheme;
  const theme = THEME_STYLES[themeKey];

  const handleCtaClick = (e: React.MouseEvent) => {
    if (onRecordClick) {
      onRecordClick();
    }
    // Safely open website URL
    if (config.websiteUrl) {
      const target = config.openInNewTab ? '_blank' : '_self';
      window.open(config.websiteUrl, target, 'noopener,noreferrer');
    }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!config.promoCode) return;
    navigator.clipboard.writeText(config.promoCode);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2200);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-4 sm:p-5 transition-all duration-300 group ${theme.container} ${className}`}
    >
      {/* Subtle background ambient radial glow */}
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br ${theme.glow} blur-3xl opacity-75`}
      />
      <div
        className={`pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-gradient-to-tr ${theme.glow} blur-3xl opacity-50`}
      />

      {/* Top Bar: Badges, Website Name, and Action controls */}
      <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Promotion Badge Tag */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border shadow-sm ${theme.badge}`}
          >
            <span className={`h-2 w-2 rounded-full animate-pulse ${theme.badgeDot}`} />
            <Sparkles className="h-3.5 w-3.5" />
            <span>{config.badgeTag || (lang === 'bn' ? 'স্পন্সরড' : 'Sponsored')}</span>
          </div>

          {/* Website Name Pill */}
          {config.websiteName && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700/60 backdrop-blur-sm">
              <Globe className="h-3 w-3 text-slate-400" />
              <span>{config.websiteName}</span>
            </div>
          )}

          {/* Optional Promo Code Pill */}
          {config.promoCode && (
            <button
              type="button"
              onClick={handleCopyCode}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-mono font-bold border transition-all ${theme.promoCodeBox}`}
              title={lang === 'bn' ? 'কোড কপি করতে ক্লিক করুন' : 'Click to copy promo code'}
            >
              <Tag className="h-3 w-3" />
              <span>{config.promoCode}</span>
              {hasCopiedCode ? (
                <span className="flex items-center gap-0.5 text-[10px] font-sans font-semibold text-emerald-400">
                  <Check className="h-3 w-3" /> {lang === 'bn' ? 'কপিকৃত!' : 'Copied!'}
                </span>
              ) : (
                <Copy className="h-3 w-3 opacity-70" />
              )}
            </button>
          )}
        </div>

        {/* Quick action controls (Settings & Dismiss) */}
        <div className="flex items-center gap-1">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/80 border border-slate-700/50 transition-all text-xs"
              title={lang === 'bn' ? 'প্রমোশন ব্যানার সেটিংস' : 'Promotion Settings'}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          )}
          {isDismissible && (
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-800/60 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 border border-slate-700/50 transition-all text-xs"
              title={lang === 'bn' ? 'ব্যানারটি সাময়িকভাবে লুকান' : 'Dismiss banner'}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Headline, Description & CTA button */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="space-y-1.5 max-w-3xl">
          <h2
            className={`text-base sm:text-lg md:text-xl font-extrabold tracking-tight leading-snug flex items-center gap-2 ${theme.title}`}
          >
            <span>{config.title || (lang === 'bn' ? 'বিশেষ প্ল্যাটফর্ম প্রমোশন' : 'Featured Platform')}</span>
          </h2>
          {config.description && (
            <p className={`text-xs sm:text-sm font-normal leading-relaxed line-clamp-2 ${theme.description}`}>
              {config.description}
            </p>
          )}
        </div>

        {/* CTA Action Button */}
        <div className="flex-shrink-0 pt-1 md:pt-0">
          <button
            type="button"
            onClick={handleCtaClick}
            className={`inline-flex items-center justify-center space-x-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm transition-all duration-200 active:scale-95 group/btn ${theme.ctaButton}`}
          >
            <span>{config.ctaText || (lang === 'bn' ? 'ওয়েবসাইটে যান →' : 'Visit Website →')}</span>
            <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
