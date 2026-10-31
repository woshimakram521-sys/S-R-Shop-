import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Phone, 
  Truck, 
  ShieldCheck, 
  UserCheck, 
  Menu, 
  X, 
  Globe, 
  PackageCheck,
  Camera
} from 'lucide-react';
import type { Category, StoreSettings, User } from '../types.js';
import { BrandLogo } from './BrandLogo.js';

interface HeaderProps {
  lang: 'bn' | 'en';
  setLang: (lang: 'bn' | 'en') => void;
  settings: StoreSettings | null;
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenTrackOrder: () => void;
  onOpenResellerPortal: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAiImageSearch?: () => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  settings,
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
  cartCount,
  onOpenCart,
  onOpenTrackOrder,
  onOpenResellerPortal,
  onOpenAdminPanel,
  onOpenAiImageSearch,
  currentUser,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Announcement Bar - Red Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white text-[11px] sm:text-xs py-1.5 px-3 font-semibold shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>
              {lang === 'bn'
                ? '🚚 সারা দেশে ক্যাশ অন ডেলিভারি সুবিধা! ঢাকার ভেতরে ডেলিভারি চার্জ মাত্র ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা!'
                : '🚚 Cash on Delivery Nationwide! Inside Dhaka ৳80, Outside Dhaka ৳150!'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1 text-rose-100">
              <Phone className="w-3 h-3 text-white" />
              {settings?.contactPhone || '+880 1712-345678'}
            </span>
            <span className="text-rose-300">|</span>
            <button
              onClick={() => onOpenTrackOrder()}
              className="text-rose-100 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 text-white" />
              {lang === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}
            </button>
            <span className="text-rose-300">|</span>
            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="flex items-center gap-1 text-rose-100 hover:text-white transition font-medium cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button 
              onClick={() => {
                onSelectCategory('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <BrandLogo
                size="md"
                variant="full"
                shopName={settings?.shopName || 'Nova Shop'}
                banglaShopName={lang === 'bn' ? (settings?.banglaShopName || 'নোভা শপ') : (settings?.shopName || 'Nova Shop')}
                tagline={settings?.tagline || 'SHOPPING & RESELLER BD'}
              />
            </button>
          </div>

          {/* Desktop Search Bar with AI Image Search Camera Button */}
          <div className="flex-1 max-w-xl hidden md:flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পণ্য খুঁজুন..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-red-500 rounded-full outline-hidden transition shadow-inner"
              />
              {onOpenAiImageSearch && (
                <button
                  type="button"
                  onClick={onOpenAiImageSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-600 transition cursor-pointer"
                  title="ক্যামেরা দিয়ে পণ্য খুঁজুন"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onOpenAiImageSearch}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>AI সার্চ</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Reseller Portal Button */}
            <button
              onClick={onOpenResellerPortal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition shadow-2xs active:scale-95 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-rose-600" />
              <span>{lang === 'bn' ? 'রিসেলার জোন' : 'Reseller Zone'}</span>
            </button>

            {/* User status badge if logged in */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-1.5 bg-rose-50 text-rose-800 px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span className="font-medium truncate max-w-[100px]">{currentUser.name}</span>
                <button
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-600 text-[10px] ml-1 underline cursor-pointer"
                >
                  {lang === 'bn' ? 'লগআউট' : 'Logout'}
                </button>
              </div>
            )}

            {/* Shopping Bag Button (matching Screenshot 4) */}
            <button
              onClick={onOpenCart}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition shadow-2xs relative flex items-center gap-1.5 cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 text-rose-600" />
              <span className="hidden sm:inline text-xs font-bold">{lang === 'bn' ? 'ব্যাগ' : 'Cart'}</span>
              <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            </button>

            {/* Camera Quick Button (matching Screenshot 4) */}
            {onOpenAiImageSearch && (
              <button
                onClick={onOpenAiImageSearch}
                className="p-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition shadow-2xs cursor-pointer"
                title="AI Image Search"
              >
                <Camera className="w-5 h-5 text-rose-600" />
              </button>
            )}

            {/* Mobile Menu Hamburger (matching Screenshot 4) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Row with Camera Button & Red AI সার্চ Button (matching Screenshot 4) */}
        <div className="mt-2.5 md:hidden flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              className="w-full pl-9 pr-9 py-2 text-xs bg-slate-100 focus:bg-white border border-slate-200 focus:border-red-500 rounded-full outline-hidden transition shadow-inner"
            />
            {onOpenAiImageSearch && (
              <button
                type="button"
                onClick={onOpenAiImageSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-600 cursor-pointer"
                title="ক্যামেরা"
              >
                <Camera className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenAiImageSearch}
            className="px-3.5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-rose-600/25 active:scale-95 transition whitespace-nowrap cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AI সার্চ</span>
          </button>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-slate-200 space-y-2 pb-2">
            <button
              onClick={() => {
                onOpenResellerPortal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50 text-amber-900 font-semibold text-sm cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-700" />
                {lang === 'bn' ? 'রিসেলার জোন (লগইন ও রেজিস্ট্রেশন)' : 'Reseller Zone'}
              </span>
              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                {lang === 'bn' ? 'ইনভেস্টমেন্ট ছাড়া আয়' : 'Zero Capital'}
              </span>
            </button>

            <button
              onClick={() => {
                onOpenTrackOrder();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 font-medium text-sm cursor-pointer"
            >
              <PackageCheck className="w-4 h-4 text-teal-600" />
              {lang === 'bn' ? 'আপনার অর্ডার ট্র্যাক করুন' : 'Track Your Order'}
            </button>

            {onOpenAdminPanel && (
              <button
                onClick={() => {
                  onOpenAdminPanel();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm cursor-pointer shadow-xs hover:bg-slate-800 transition"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>{lang === 'bn' ? 'অ্যাডমিন কন্ট্রোল প্যানেল' : 'Admin Control Panel'}</span>
              </button>
            )}

            {currentUser && (
              <div className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{currentUser.name} ({currentUser.role})</span>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-rose-600 font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'লগআউট' : 'Logout'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Filter Bar */}
      <div className="border-t border-slate-100 bg-slate-50/70 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 min-w-max">
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-teal-700 text-white shadow-2xs font-semibold'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            {lang === 'bn' ? 'সকল কালেকশন' : 'All Products'}
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-teal-700 text-white shadow-2xs font-semibold'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              <span>{lang === 'bn' ? cat.banglaName : cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
