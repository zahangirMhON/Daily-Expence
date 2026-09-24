import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  ExternalLink,
  Tag,
  Palette,
  Eye,
  BarChart2,
  Globe,
  Sliders,
  Flame,
  Award,
  Layers,
} from 'lucide-react';
import { PromotionConfig, PromotionTheme } from '../types';
import { PROMOTION_PRESETS, DEFAULT_PROMOTION_CONFIG } from '../data/defaults';
import { PromotionBanner } from './PromotionBanner';
import { Language, formatNumber } from '../i18n';

interface PromotionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PromotionConfig;
  onSave: (updated: PromotionConfig) => void;
  onResetStats?: () => void;
  lang?: Language;
}

const THEME_OPTIONS: { id: PromotionTheme; nameBn: string; nameEn: string; icon: string; previewColor: string }[] = [
  {
    id: 'royal_gold',
    nameBn: '🥇 রয়েল গোল্ড (Royal Gold)',
    nameEn: 'Royal Gold',
    icon: '🥇',
    previewColor: 'from-amber-600 to-yellow-500 border-amber-400',
  },
  {
    id: 'emerald_green',
    nameBn: '💎 এমারেল্ড গ্রিন (Emerald Green)',
    nameEn: 'Emerald Green',
    icon: '💎',
    previewColor: 'from-emerald-600 to-teal-500 border-emerald-400',
  },
  {
    id: 'royal_blue',
    nameBn: '🌌 রয়্যাল ব্লু (Royal Blue)',
    nameEn: 'Royal Blue',
    icon: '🌌',
    previewColor: 'from-blue-600 to-cyan-500 border-blue-400',
  },
  {
    id: 'deep_purple',
    nameBn: '🔮 মিস্টিক পার্পল (Mystic Purple)',
    nameEn: 'Mystic Purple',
    icon: '🔮',
    previewColor: 'from-purple-600 to-fuchsia-500 border-purple-400',
  },
  {
    id: 'ruby_red',
    nameBn: '🌹 রুবি রেড (Ruby Red)',
    nameEn: 'Ruby Red',
    icon: '🌹',
    previewColor: 'from-rose-600 to-red-500 border-rose-400',
  },
  {
    id: 'midnight_dark',
    nameBn: '🌙 প্রিমিয়াম ডার্ক (Midnight Luxury)',
    nameEn: 'Midnight Luxury',
    icon: '🌙',
    previewColor: 'from-slate-700 to-slate-900 border-slate-500',
  },
  {
    id: 'cyber_neon',
    nameBn: '⚡ সাইবার নিয়ন (Cyber Neon)',
    nameEn: 'Cyber Neon',
    icon: '⚡',
    previewColor: 'from-teal-400 to-emerald-500 border-teal-300',
  },
];

const PRESET_BADGES = [
  'স্পন্সরড',
  'অফিসিয়াল পার্টনার',
  'বিশেষ অফার',
  'ফিচার্ড প্রমোশন',
  'হট ডিল 🔥',
  'এক্সক্লুসিভ',
];

export const PromotionSettingsModal: React.FC<PromotionSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onResetStats,
  lang = 'bn',
}) => {
  const [formData, setFormData] = useState<PromotionConfig>(config);
  const [activeTab, setActiveTab] = useState<'content' | 'theme' | 'analytics'>('content');

  useEffect(() => {
    if (isOpen) {
      setFormData(config);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetConfig: Partial<PromotionConfig>) => {
    setFormData((prev) => ({
      ...prev,
      ...presetConfig,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleResetToDefault = () => {
    if (confirm(lang === 'bn' ? 'আপনি কি ডিফল্ট প্রমোশন তথ্যে ফিরে যেতে চান?' : 'Reset to default promotion details?')) {
      setFormData({
        ...DEFAULT_PROMOTION_CONFIG,
        impressions: formData.impressions,
        clicks: formData.clicks,
      });
    }
  };

  const ctr =
    (formData.impressions || 0) > 0
      ? (((formData.clicks || 0) / (formData.impressions || 1)) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {lang === 'bn' ? 'ওয়েবসাইট প্রমোশন ব্যানার কনফিগারেশন' : 'Website Promotion Banner Settings'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'হোমস্ক্রিনের উপরের প্রমোশনাল ব্যানার কাস্টমাইজ করুন'
                  : 'Customize promotional banner shown at the top of Home'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-amber-400" />
              {lang === 'bn' ? 'লাইভ প্রিভিউ (হোমস্ক্রিনে যেমন দেখাবে):' : 'Live Preview:'}
            </span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                formData.enabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {formData.enabled
                ? lang === 'bn'
                  ? '● হোমস্ক্রিনে চালু'
                  : '● Enabled'
                : lang === 'bn'
                ? '○ লুকানো আছে'
                : '○ Disabled'}
            </span>
          </div>

          <div className="border border-slate-800 rounded-3xl p-1 bg-slate-950">
            <PromotionBanner
              config={formData}
              lang={lang}
              isDismissible={false}
              className="!shadow-none"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-5 bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'content'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{lang === 'bn' ? 'তথ্য ও বিবরণ' : 'Content & Copy'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'theme'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>{lang === 'bn' ? 'কালার থিম' : 'Color Themes'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>{lang === 'bn' ? 'অ্যানালিটিক্স ও টেমপ্লেট' : 'Analytics & Presets'}</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-4">
          {/* Master Enable/Disable Switch */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-950/70 p-4 border border-slate-800">
            <div>
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <span>{lang === 'bn' ? 'হোমস্ক্রিনে প্রদর্শন স্থিতি' : 'Display on Home Screen'}</span>
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                {formData.enabled
                  ? lang === 'bn'
                    ? 'চালু রয়েছে: হোমস্ক্রিনের উপরে ব্যানারটি দেখানো হবে'
                    : 'Active: Banner is displayed at the top of the home screen'
                  : lang === 'bn'
                    ? 'বন্ধ রয়েছে: হোমস্ক্রিনে ব্যানারটি প্রদর্শন করা হবে না'
                    : 'Inactive: Banner is currently hidden'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formData.enabled ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  formData.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Row: Website Name & Badge Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Website Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'ওয়েবসাইটের নাম (Website Name)' : 'Website Name'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.websiteName}
                      onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                      placeholder="e.g. ai"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Promotion Tag / Badge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'প্রমোশন ট্যাগ / ব্যাজ (Ad Tag / Badge)' : 'Ad Tag / Badge'}
                  </label>
                  <input
                    type="text"
                    value={formData.badgeTag}
                    onChange={(e) => setFormData({ ...formData, badgeTag: e.target.value })}
                    placeholder={lang === 'bn' ? 'যেমন: স্পন্সরড / অফিসিয়াল পার্টনার' : 'Sponsored / Partner'}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Badge Suggestions */}
              <div>
                <span className="text-[11px] text-slate-400 mr-2">
                  {lang === 'bn' ? 'দ্রুত ট্যাগ বাছাই করুন:' : 'Quick tags:'}
                </span>
                <div className="inline-flex flex-wrap gap-1.5 mt-1">
                  {PRESET_BADGES.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFormData({ ...formData, badgeTag: tag })}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                        formData.badgeTag === tag
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headline / Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিজ্ঞাপন শিরোনাম (Headline / Title)' : 'Headline / Title'}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: সহজ কুরআন ও হাদিস পাঠের সমৃদ্ধ অনলাইন প্ল্যাটফর্ম'
                      : 'e.g. Rich Online Platform for Quran and Hadith'
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিজ্ঞাপন বিবরণ (Description - আকর্ষণীয় ২-১ লাইনের বিবরণ)' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={
                    lang === 'bn'
                      ? 'ওয়েবসাইট সম্পর্কে আকর্ষণীয় ২-১ লাইনের বিবরণ...'
                      : 'Attractive 1-2 line description about your platform...'
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Website URL & CTA Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'ওয়েবসাইট লিংক (Website URL - কাস্টম লিংক)' : 'Website URL'}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.websiteUrl}
                      onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://example.com"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                    {formData.websiteUrl && (
                      <a
                        href={formData.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-2 text-slate-400 hover:text-amber-400 text-xs flex items-center gap-0.5"
                        title={lang === 'bn' ? 'লিংক চেক করুন' : 'Test link'}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'বাটন টেক্সট (CTA Text)' : 'Button CTA Text'}
                  </label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder={lang === 'bn' ? 'ওয়েবসাইটে যান →' : 'Visit Website →'}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Extra Features: Promo Code & Open in New Tab */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'বিশেষ প্রোমো / কুপন কোড (ঐচ্ছিক)' : 'Promo Code (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.promoCode || ''}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                    placeholder="e.g. DEEN2026"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-amber-300 placeholder-slate-500 focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800 self-end">
                  <span className="text-xs text-slate-300">
                    {lang === 'bn' ? 'নতুন ট্যাবে খুলুন (New Tab)' : 'Open in new tab'}
                  </span>
                  <input
                    type="checkbox"
                    checked={formData.openInNewTab !== false}
                    onChange={(e) => setFormData({ ...formData, openInNewTab: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                {lang === 'bn' ? 'ব্যানার কালার থিম নির্বাচন করুন:' : 'Select Banner Color Theme:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = formData.colorTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, colorTheme: theme.id })}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-slate-850 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-7 w-7 rounded-xl bg-gradient-to-br ${theme.previewColor} border flex items-center justify-center text-sm shadow-md`}
                        >
                          {theme.icon}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {lang === 'bn' ? theme.nameBn : theme.nameEn}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {theme.id === 'royal_gold' ? (lang === 'bn' ? '🥇 মূল প্রস্তাবিত থিম' : 'Featured Theme') : ''}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4">
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 text-center">
                  <span className="text-[11px] text-slate-400 block">
                    {lang === 'bn' ? 'মোট ভিউ' : 'Impressions'}
                  </span>
                  <span className="text-lg font-bold text-slate-200">
                    {formatNumber(formData.impressions || 0, lang)}
                  </span>
                </div>
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 text-center">
                  <span className="text-[11px] text-slate-400 block">
                    {lang === 'bn' ? 'মোট ক্লিক' : 'Clicks'}
                  </span>
                  <span className="text-lg font-bold text-amber-400">
                    {formatNumber(formData.clicks || 0, lang)}
                  </span>
                </div>
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 text-center">
                  <span className="text-[11px] text-slate-400 block">
                    {lang === 'bn' ? 'CTR পারফরম্যান্স' : 'Click Rate'}
                  </span>
                  <span className="text-lg font-bold text-emerald-400">{ctr}%</span>
                </div>
              </div>

              {onResetStats && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onResetStats}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>{lang === 'bn' ? 'অ্যানালিটিক্স কাউন্টার রিসেট করুন' : 'Reset analytics counter'}</span>
                  </button>
                </div>
              )}

              {/* Ready-to-use Presets */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-400" />
                  {lang === 'bn' ? 'এক ক্লিকে প্রিসেট লোড করুন:' : 'Load Ready Presets:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PROMOTION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.config)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-all text-xs text-slate-200 hover:bg-slate-800/60"
                    >
                      <span>{preset.nameBn}</span>
                      <span className="text-[10px] text-amber-400 font-medium">
                        {lang === 'bn' ? 'প্রয়োগ করুন →' : 'Apply →'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4 bg-slate-950/70">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{lang === 'bn' ? 'ডিফল্ট মান' : 'Reset Defaults'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
            >
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center space-x-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-yellow-300 shadow-md shadow-amber-500/25 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
