import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.js';

interface PWAInstallBannerProps {
  lang: 'bn' | 'en';
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <aside aria-label={lang === 'bn' ? 'অ্যাপ ইনস্টল ব্যানার' : 'App installation banner'} className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white px-4 py-2.5 shadow-md border-b border-teal-700/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <p className="font-semibold text-xs sm:text-sm">
                {lang === 'bn' ? 'নোভা শপ মোবাইল অ্যাপ ইনস্টল করুন' : 'Install Nova Shop Mobile App'}
              </p>
              <p className="text-[11px] text-teal-200/80 hidden sm:block">
                {lang === 'bn'
                  ? 'দ্রুত অর্ডার ও সেরা শপিং অভিজ্ঞতার জন্য হোমস্ক্রিনে যুক্ত করুন।'
                  : 'Fast checkout, offline browsing, and instant notifications on your device.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={install}
                className="clay-btn-amber px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ইনস্টল' : 'Install'}</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                {lang === 'bn' ? 'আইফোন / আইপ্যাড ইনস্টল' : 'iOS Guide'}
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="text-teal-200 hover:text-white p-1 rounded-md transition"
              title={lang === 'bn' ? 'বন্ধ করুন' : 'Dismiss'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-700" />
                {lang === 'bn' ? 'আইফোনে অ্যাপ ইনস্টল পদ্ধতি' : 'Install on iPhone / iPad'}
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 py-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ১
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {lang === 'bn' ? 'সাফারি ব্রাউজারে Share বাটনে চাপ দিন' : 'Tap the Share icon in Safari'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 inline text-teal-600" />
                    {lang === 'bn' ? 'নিচের বারে শেয়ার আইকন দেখতে পাবেন' : 'Located at the bottom Safari bar'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ২
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {lang === 'bn' ? '"Add to Home Screen" অপশনে ট্যাপ করুন' : 'Select "Add to Home Screen"'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <PlusSquare className="w-3.5 h-3.5 inline text-teal-600" />
                    {lang === 'bn' ? 'একটু নিচে স্ক্রল করলেই পেয়ে যাবেন' : 'Scroll down the share sheet'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ৩
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {lang === 'bn' ? 'উপরের ডান কোণে "Add" চাপুন' : 'Tap "Add" in top right'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === 'bn' ? 'হোম স্ক্রিন থেকে সাধারণ অ্যাপের মতো ব্যবহার করুন।' : 'Nova Shop icon will appear on your Home Screen!'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="clay-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold mt-2"
            >
              {lang === 'bn' ? 'বুঝতে পেরেছি' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
