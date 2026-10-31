/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  PhoneCall, 
  ChevronRight, 
  CheckCircle, 
  HelpCircle,
  Package,
  Layers,
  UserCheck,
  ChevronDown,
  Home,
  TrendingUp,
  Search,
  Star,
  ExternalLink,
  ArrowRight,
  Shield,
  Lock,
} from 'lucide-react';
import type { 
  Product, 
  Category, 
  Banner, 
  DeliveryZone, 
  StoreSettings, 
  User, 
  Order 
} from './types.js';
import { api, getAuthToken, setAuthToken } from './api.js';
import { BrandLogo } from './components/BrandLogo.js';
import { Header } from './components/Header.js';
import { ProductCard } from './components/ProductCard.js';
import { ProductDetailPage } from './components/ProductDetailPage.js';
import { ProductDetailModal } from './components/ProductDetailModal.js';
import { CartDrawer, type CartItem } from './components/CartDrawer.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { OrderTrackModal } from './components/OrderTrackModal.js';
import { ResellerPortal } from './components/ResellerPortal.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { PWAInstallBanner } from './components/PWAInstallBanner.js';
import { AiImageSearchModal } from './components/AiImageSearchModal.js';

export default function App() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [aiImageSearchOpen, setAiImageSearchOpen] = useState(false);

  // Primary full-page dedicated view routing: 'store' | 'product' | 'reseller' | 'admin'
  const [currentView, setCurrentView] = useState<'store' | 'product' | 'reseller' | 'admin'>('store');

  // Modals & Drawers state for Storefront
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackOrderOpen, setTrackOrderOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string>('');

  // Cart State (Persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('novashop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-1');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('novashop_cart', JSON.stringify(cartItems));
    } catch (err) {
      console.error(err);
    }
  }, [cartItems]);

  // Load initial store data
  useEffect(() => {
    loadStoreData();
    checkCurrentUser();
  }, []);

  // Hash-based URL routing for shareable product links (#product-101) & views
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#product-')) {
        const prodId = hash.replace('#product-', '');
        const p = products.find((prod) => prod.id === prodId);
        if (p) {
          setSelectedProduct(p);
          setCurrentView('product');
        }
      } else if (hash === '#reseller') {
        setCurrentView('reseller');
      } else if (hash === '#admin') {
        setCurrentView('admin');
      } else if (hash === '' || hash === '#store') {
        if (currentView !== 'store') setCurrentView('store');
      }
    };

    if (products.length > 0) {
      handleHash();
    }
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [products]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setCurrentView('product');
    window.location.hash = `product-${p.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToStore = () => {
    setCurrentView('store');
    window.location.hash = '';
    setSelectedProduct(null);
  };

  const loadStoreData = async () => {
    try {
      const [setsRes, catsRes, bansRes, zonesRes, prodsRes] = await Promise.allSettled([
        api.getSettings(),
        api.getCategories(),
        api.getBanners(),
        api.getDeliveryZones(),
        api.getProducts(),
      ]);
      if (setsRes.status === 'fulfilled') setSettings(setsRes.value);
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value);
      if (bansRes.status === 'fulfilled') setBanners(bansRes.value);
      if (zonesRes.status === 'fulfilled') {
        setDeliveryZones(zonesRes.value);
        if (zonesRes.value.length > 0) {
          setSelectedZoneId(zonesRes.value[0].id);
        }
      }
      if (prodsRes.status === 'fulfilled') setProducts(prodsRes.value);
    } catch (err) {
      console.error('Error loading store data:', err);
    }
  };

  const checkCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const me = await api.getMe();
      setCurrentUser(me);
    } catch {
      setAuthToken(null);
      setCurrentUser(null);
    }
  };

  const handleRefreshProducts = async () => {
    try {
      const prods = await api.getProducts();
      setProducts(prods);
    } catch (err) {
      console.error('Failed to refresh products:', err);
    }
  };

  const handleRefreshSettings = async () => {
    try {
      const sets = await api.getSettings();
      setSettings(sets);
    } catch (err) {
      console.error('Failed to refresh settings:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    quantity = 1,
    selectedVariants: Record<string, string> = {}
  ) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, quantity, selectedVariants }];
      }
    });

    showToast(
      lang === 'bn'
        ? `"${product.banglaName || product.name}" কার্টে যুক্ত হয়েছে!`
        : `Added "${product.name}" to cart!`
    );
  };

  const handleDirectOrder = (
    product: Product,
    quantity = 1,
    selectedVariants: Record<string, string> = {}
  ) => {
    handleAddToCart(product, quantity, selectedVariants);
    setSelectedProduct(null);
    setCheckoutOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = quantity;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
    showToast(lang === 'bn' ? 'পণ্য কার্ট থেকে সরানো হয়েছে' : 'Item removed from cart');
  };

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.banglaName && p.banglaName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const featuredProducts = filteredProducts.filter((p) => p.isFeatured);
  const otherProducts = filteredProducts.filter((p) => !p.isFeatured);

  const faqList = [
    {
      qBn: 'আমি কীভাবে পণ্য অর্ডার করব?',
      qEn: 'How do I place an order?',
      aBn: 'আপনার পছন্দের পণ্যটি নির্বাচন করে "অর্ডার করুন" অথবা "কার্টে যোগ করুন" বাটনে ক্লিক করুন। নাম, ফোন নম্বর ও ডেলিভারি ঠিকানা পূরণ করে ক্যাশ অন ডেলিভারি অথবা বিকাশ/নগদে অর্ডার নিশ্চিত করুন। কোনো রেজিস্ট্রেশন বাধ্যতামূলক নয়।',
      aEn: 'Select your desired product, click "Buy Now" or "Add to Cart", fill in your delivery details, and confirm with Cash on Delivery or bKash/Nagad. No account is required.'
    },
    {
      qBn: 'ডেলিভারি চার্জ কত এবং কত দিনে ডেলিভারি পাব?',
      qEn: 'What is the delivery charge and estimated timeframe?',
      aBn: 'ঢাকা সিটির ভেতরে ডেলিভারি চার্জ মাত্র ৳৭০ (১-২ দিন), ঢাকার পার্শ্ববর্তী অঞ্চলে ৳১০০ (২-৩ দিন) এবং ঢাকার বাইরে সমগ্র বাংলাদেশে ৳১৩০ (৩-৫ দিন)।',
      aEn: 'Delivery inside Dhaka is ৳70 (1-2 days), Dhaka suburbs ৳100 (2-3 days), and outside Dhaka ৳130 (3-5 days).'
    },
    {
      qBn: 'নোভা শপ রিসেলার প্রোগ্রাম কী এবং কীভাবে ঘরে বসে আয় করব?',
      qEn: 'What is the Nova Reseller Program and how can I earn?',
      aBn: 'রিসেলার হিসেবে যুক্ত হয়ে আপনি আমাদের সকল পণ্য পাইকারি রেটে পাবেন। আপনি সোশ্যাল মিডিয়া বা পরিচিতদের কাছে নিজের নির্ধারিত লাভে বিক্রি করবেন। আপনি শুধু কাস্টমারের অর্ডার প্লেস করবেন, ডেলিভারি ও কালেকশন করবে নোভা শপ। প্রতি অর্ডারের মুনাফা আপনার ওয়ালেটে জমা হবে এবং বিকাশ/নগদে তুলতে পারবেন।',
      aEn: 'As a reseller, you get wholesale pricing, set your own selling price, and earn profit on every delivered order with automated bKash/Nagad payouts.'
    },
    {
      qBn: 'রিসেলার অর্ডারে অগ্রিম ডেলিভারি চার্জ কেন নেওয়া হয়?',
      qEn: 'Why is advance delivery payment mandatory for reseller orders?',
      aBn: 'ভুয়া অর্ডার ও পার্সেল রিটার্ন প্রতিরোধে প্রতিটি রিসেলার অর্ডারের ক্ষেত্রে ন্যূনতম ৳৫০ অগ্রিম ডেলিভারি চার্জ জমা নেওয়া হয়। অ্যাডমিন পেমেন্ট ভেরিফাই করার পরই পণ্য পাঠানো হয়।',
      aEn: 'To prevent fake bookings and return delivery losses, an advance delivery charge of at least ৳50 is mandatory before parcels are dispatched.'
    },
    {
      qBn: 'পণ্য পছন্দ না হলে বা কোনো ত্রুটি থাকলে কি রিটার্ন করা যাবে?',
      qEn: 'What is your product return policy?',
      aBn: 'ডেলিভারি ম্যানের উপস্থিতিতে পণ্য দেখে নিন। কোনো ত্রুটি বা সাইজ সমস্যা থাকলে দ্রুত আমাদের হেল্পলাইনে জানালে ৭ দিনের মধ্যে সহজ পরিবর্তন বা রিটার্ন সুবিধা পাবেন।',
      aEn: 'Check the package upon delivery. We offer an easy 7-day exchange or refund for verified manufacturer defects.'
    }
  ];

  // DEDICATED FULL-PAGE ROUTING
  // 1. FULL PRODUCT DETAILS PAGE (NOT A MODAL)
  if (currentView === 'product' && selectedProduct) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <PWAInstallBanner lang={lang} />
        <Header
          lang={lang}
          setLang={setLang}
          settings={settings}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            setSelectedCategory(slug);
            handleBackToStore();
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          onOpenCart={() => setCartOpen(true)}
          onOpenTrackOrder={() => setTrackOrderOpen(true)}
          onOpenResellerPortal={() => {
            setCurrentView('reseller');
            window.location.hash = 'reseller';
          }}
          onOpenAdminPanel={() => {
            setCurrentView('admin');
            window.location.hash = 'admin';
          }}
          currentUser={currentUser}
          onLogout={() => {
            setAuthToken(null);
            setCurrentUser(null);
          }}
        />

        <ProductDetailPage
          product={selectedProduct}
          allProducts={products}
          settings={settings}
          lang={lang}
          onBack={handleBackToStore}
          onAddToCart={(p, qty, vars) => handleAddToCart(p, qty, vars)}
          onDirectOrder={(p, qty, vars) => handleDirectOrder(p, qty, vars)}
          onSelectProduct={(p) => handleSelectProduct(p)}
        />

        {/* Floating WhatsApp Button (Section 18) */}
        {settings?.whatsappEnabled !== false && settings?.whatsappNumber && (
          <a
            href={`https://wa.me/${(settings.whatsappNumber || '').replace(/\D/g, '')}?text=${encodeURIComponent(`হ্যালো Nova Shop, আমি '${selectedProduct.name}' পণ্যটি সম্পর্কে জানতে চাচ্ছি।`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            title="WhatsApp Support"
          >
            <PhoneCall className="w-5 h-5" />
          </a>
        )}

        <CartDrawer
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onProceedCheckout={() => setCheckoutOpen(true)}
          deliveryZones={deliveryZones}
          selectedZoneId={selectedZoneId}
          onSelectZoneId={setSelectedZoneId}
          lang={lang}
        />

        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          cartItems={cartItems}
          deliveryZones={deliveryZones}
          selectedZoneId={selectedZoneId}
          settings={settings}
          lang={lang}
          onOrderSuccess={(order) => {
            setCartItems([]);
            localStorage.removeItem('novashop_cart');
          }}
          onTrackOrder={(orderId) => {
            setCheckoutOpen(false);
            setTrackedOrderId(orderId);
            setTrackOrderOpen(true);
          }}
        />

        <OrderTrackModal
          isOpen={trackOrderOpen}
          onClose={() => {
            setTrackOrderOpen(false);
            setTrackedOrderId('');
          }}
          initialOrderId={trackedOrderId}
          lang={lang}
        />
      </div>
    );
  }

  // 2. RESELLER DEDICATED PORTAL
  if (currentView === 'reseller') {
    return (
      <ResellerPortal
        isOpen={true}
        onClose={() => setCurrentView('store')}
        products={products}
        deliveryZones={deliveryZones}
        settings={settings}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        lang={lang}
      />
    );
  }

  if (currentView === 'admin') {
    return (
      <AdminDashboard
        isOpen={true}
        onClose={() => setCurrentView('store')}
        products={products}
        onRefreshProducts={handleRefreshProducts}
        deliveryZones={deliveryZones}
        settings={settings}
        onRefreshSettings={handleRefreshSettings}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        lang={lang}
      />
    );
  }

  // PUBLIC STOREFRONT VIEW
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 md:pb-0">
      {/* PWA Install Notification Bar */}
      <PWAInstallBanner lang={lang} />

      {/* Main Storefront Header */}
      <Header
        lang={lang}
        setLang={setLang}
        settings={settings}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(slug) => {
          setSelectedCategory(slug);
          const el = document.getElementById('products-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onOpenCart={() => setCartOpen(true)}
        onOpenTrackOrder={() => setTrackOrderOpen(true)}
        onOpenResellerPortal={() => setCurrentView('reseller')}
        onOpenAdminPanel={() => setCurrentView('admin')}
        onOpenAiImageSearch={() => setAiImageSearchOpen(true)}
        currentUser={currentUser}
        onLogout={() => {
          setAuthToken(null);
          setCurrentUser(null);
          showToast(lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে' : 'Logged out');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* HERO BANNER SLIDER / CARDS (Matching Screenshot 4) */}
        <section className="max-w-7xl mx-auto px-4 pt-3 sm:pt-6">
          <div className="relative rounded-3xl overflow-hidden min-h-[280px] sm:min-h-[350px] flex flex-col justify-end p-6 sm:p-10 shadow-xl bg-slate-950 text-white border border-slate-800">
            <div 
              className="absolute inset-0 opacity-40 bg-cover bg-center"
              style={{ backgroundImage: `url(${banners[0]?.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200'})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            {/* Slider arrows */}
            <button
              onClick={() => showToast('পূর্ববর্তী অফার')}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer transition z-20"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              onClick={() => showToast('পরবর্তী অফার')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center cursor-pointer transition z-20"
              aria-label="Next"
            >
              ›
            </button>

            <div className="relative z-10 max-w-xl space-y-2.5">
              <span className="inline-block px-3 py-1 rounded-full bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                মেগা অফার ⚡
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
                {lang === 'bn' ? (banners[0]?.banglaTitle || 'রিসেলারদের সুবর্ণ সুযোগ') : (banners[0]?.title || 'Reseller Golden Opportunity')}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-medium">
                {lang === 'bn'
                  ? (banners[0]?.banglaSubtitle || 'জিরো পুঁজিতে পাইকারি দামে পণ্য নিয়ে প্রতিদিন আকর্ষণীয় মুনাফা অর্জন করুন!')
                  : (banners[0]?.subtitle || 'Start your own e-commerce business with zero investment.')}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setCurrentView('reseller')}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 font-bold text-xs sm:text-sm text-white flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/30 transition active:scale-95"
                >
                  <span>{lang === 'bn' ? 'রিসেলার হতে ক্লিক করুন' : 'Become a Reseller'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTrackOrderOpen(true)}
                  className="bg-slate-900/80 hover:bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer"
                >
                  {lang === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order'}
                </button>
              </div>
            </div>

            {/* Pagination dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              <span className="w-4 h-1.5 rounded-full bg-red-600" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            </div>
          </div>
        </section>

        {/* CATEGORY QUICK CHIPS / CAROUSEL (Matching Screenshot 4) */}
        <section id="categories-section" className="max-w-7xl mx-auto px-4 pt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {lang === 'bn' ? 'ক্যাটাগরি সমূহ' : 'Categories'}
            </h2>
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{lang === 'bn' ? 'সব দেখুন' : 'View All'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-red-600 text-white shadow-md shadow-red-500/25'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🔥 {lang === 'bn' ? `সকল পণ্য (${products.length})` : `All Items (${products.length})`}
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.slug;
              const catCount = products.filter((p) => p.category === cat.slug).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-md shadow-red-500/25'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{lang === 'bn' ? cat.banglaName : cat.name} {catCount > 0 ? `(${catCount})` : ''}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <section id="products-section" className="max-w-7xl mx-auto px-4 pt-6 pb-12">
          {/* Featured / Bestsellers */}
          {featuredProducts.length > 0 && selectedCategory === 'all' && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {lang === 'bn' ? 'হট ও ট্রেন্ডিং কালেকশন' : 'Hot & Trending'}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    lang={lang}
                    isReseller={false}
                    onSelect={(p) => handleSelectProduct(p)}
                    onAddToCart={(p, e) => {
                      e.stopPropagation();
                      handleAddToCart(p);
                    }}
                    onDirectOrder={(p, e) => {
                      e.stopPropagation();
                      handleDirectOrder(p);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All / Filtered Products Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-800" />
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {selectedCategory === 'all'
                    ? (lang === 'bn' ? 'সকল প্রিমিয়াম পণ্য' : 'All Products')
                    : categories.find((c) => c.slug === selectedCategory)?.banglaName || 'পণ্য তালিকা'}
                </h3>
                <span className="text-xs text-slate-400 font-semibold">({filteredProducts.length})</span>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="clay-card bg-white rounded-3xl p-12 text-center text-slate-400 max-w-md mx-auto">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {lang === 'bn' ? 'কোনো পণ্য খুঁজে পাওয়া যায়নি' : 'No products found'}
                </p>
                <p className="text-xs text-slate-400">
                  {lang === 'bn' ? 'অনুসন্ধান বা ক্যাটাগরি ফিল্টার পরিবর্তন করে দেখুন।' : 'Try resetting your search or category filter.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-teal-900 text-white text-xs font-bold hover:bg-teal-800 transition cursor-pointer"
                >
                  {lang === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {(selectedCategory === 'all' && featuredProducts.length > 0 ? otherProducts : filteredProducts).map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      lang={lang}
                      isReseller={false}
                      onSelect={(p) => handleSelectProduct(p)}
                      onAddToCart={(p, e) => {
                        e.stopPropagation();
                        handleAddToCart(p);
                      }}
                      onDirectOrder={(p, e) => {
                        e.stopPropagation();
                        handleDirectOrder(p);
                      }}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {/* RESELLING PROMO CARD (Matching Screenshot 4) */}
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-xs">
                রিসেলিং সুযোগ 💼
              </span>
              <h3 className="text-xl sm:text-3xl font-black leading-tight">
                জিরো পুঁজিতে নিজের অনলাইন ব্যবসা শুরু করুন!
              </h3>
              <p className="text-xs sm:text-sm text-white/90 max-w-xl font-medium">
                পাইকারি দামে পণ্য নিয়ে আপনার নিজের নির্ধারিত মূল্যে বিক্রি করুন। ক্যাশ অন ডেলিভারি, প্যাকেজিং ও কাস্টমার কালেকশন করবে আমাদের শপ।
              </p>
            </div>
            <div className="z-10 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setCurrentView('reseller')}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-red-600 font-black text-sm hover:bg-slate-100 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>রিসেলার হতে ক্লিক করুন</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* BENEFITS / TRUST BADGES */}
        <section className="bg-slate-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-850 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {lang === 'bn' ? 'সারা দেশে দ্রুত হোম ডেলিভারি' : 'Nationwide Fast Delivery'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'ঢাকা ও সমগ্র বাংলাদেশে দ্রুততম ডেলিভারি ব্যবস্থা।' : 'Inside Dhaka 24-48 hrs, outside 3-5 days.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-850 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {lang === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD)' : 'Cash on Delivery'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'পণ্য হাতে পেয়ে মূল্য পরিশোধের শতভাগ নিশ্চয়তা।' : 'Check parcel at doorstep and pay.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-850 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {lang === 'bn' ? 'সহজ ৭ দিনের রিটার্ন পলিসি' : 'Easy 7-Day Returns'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'পণ্য ত্রুটিপূর্ণ হলে দ্রুত রিপ্লেসমেন্ট ও সমাধান।' : 'Hassle-free replacement for defects.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-850 border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">
                  {lang === 'bn' ? '২৪/৭ কাস্টমার হেল্পলাইন' : 'Dedicated Support'}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {settings?.contactPhone || '+880 1712-345678'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION IN BENGALI */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              {lang === 'bn' ? 'সাধারণ জিজ্ঞাসা (FAQ)' : 'Frequently Asked Questions'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'bn'
                ? 'নোভা শপ ও রিসেলার প্রোগ্রাম সম্পর্কিত সাধারণ প্রশ্নের উত্তর'
                : 'Common questions about ordering, delivery, and reseller policies.'}
            </p>
          </div>

          <div className="space-y-3">
            {faqList.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="clay-card bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="font-bold text-sm sm:text-base text-slate-800">
                      {lang === 'bn' ? faq.qBn : faq.qEn}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-teal-800' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {lang === 'bn' ? faq.aBn : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-12 pb-24 md:pb-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="sm" variant="badge" />
              <span className="text-base font-black text-white tracking-tight">
                {settings?.banglaShopName || 'নোভা শপ'}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {settings?.banglaTagline || 'বাংলাদেশের সেরা অনলাইন শপিং ও বিশ্বস্ত রিসেলার প্ল্যাটফর্ম।'}
            </p>
            <div className="text-[11px] text-slate-500">
              ট্রেড লাইসেন্স: {settings?.tradeLicense || 'TRAD/DNCC/029412/2026'}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              {lang === 'bn' ? 'প্রয়োজনীয় লিংক' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button
                  onClick={() => setTrackOrderOpen(true)}
                  className="hover:text-white transition cursor-pointer"
                >
                  {lang === 'bn' ? 'অর্ডার ট্র্যাকিং' : 'Track My Order'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('reseller')}
                  className="hover:text-white transition cursor-pointer"
                >
                  {lang === 'bn' ? 'রিসেলার প্রোগ্রাম ও রেজিস্ট্রেশন' : 'Reseller Program'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentView('admin')}
                  className="hover:text-white transition cursor-pointer"
                >
                  {lang === 'bn' ? 'অ্যাডমিন কন্ট্রোল পোর্টাল' : 'Admin Control Portal'}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Helpline */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              {lang === 'bn' ? 'যোগাযোগ ও সাপোর্ট' : 'Contact & Helpline'}
            </h4>
            <p className="text-white font-semibold flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-teal-400" />
              <span>{settings?.contactPhone || '+880 1712-345678'}</span>
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {settings?.address || 'House #42, Road #11, Sector #4, Uttara, Dhaka-1230, Bangladesh'}
            </p>
          </div>

          {/* Payment Gateways */}
          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              {lang === 'bn' ? 'সমর্থিত পেমেন্ট মাধ্যম' : 'Payment Methods'}
            </h4>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="bg-pink-900/60 text-pink-300 border border-pink-700/50 px-2 py-1 rounded font-bold">
                bKash বিকাশ
              </span>
              <span className="bg-orange-900/60 text-orange-300 border border-orange-700/50 px-2 py-1 rounded font-bold">
                Nagad নগদ
              </span>
              <span className="bg-purple-900/60 text-purple-300 border border-purple-700/50 px-2 py-1 rounded font-bold">
                Rocket রকেট
              </span>
              <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-2 py-1 rounded font-bold">
                Cash on Delivery
              </span>
            </div>
            <p className="text-[10px] text-slate-500 pt-1">
              সারা দেশে ক্যাশ অন ডেলিভারি এবং সুরক্ষিত মোবাইল ব্যাংকিং সুবিধা।
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} Nova Shop BD. All rights reserved. Built with pride for Bangladesh.
          </div>
          <button
            onClick={() => {
              setCurrentView('admin');
              window.location.hash = 'admin';
            }}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition text-[11px] cursor-pointer"
            title="Administrator Portal"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        </div>
      </footer>

      {/* Floating WhatsApp Button (Section 18) */}
      {settings?.whatsappEnabled !== false && settings?.whatsappNumber && (
        <a
          href={`https://wa.me/${(settings.whatsappNumber || '').replace(/\D/g, '')}?text=${encodeURIComponent('হ্যালো Nova Shop, আমি একটি পণ্য সম্পর্কে জানতে চাচ্ছি।')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          title="WhatsApp Support"
        >
          <PhoneCall className="w-5 h-5" />
        </a>
      )}

      {/* Mobile Bottom Navigation Bar for Storefront (Matching Screenshot 4) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setSelectedCategory('all');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="p-1 flex flex-col items-center gap-0.5 text-red-600 font-bold cursor-pointer"
        >
          <Home className="w-5 h-5 text-red-600" />
          <span className="text-[10px]">{lang === 'bn' ? 'হোম' : 'Home'}</span>
        </button>

        <a
          href="#products-section"
          className="p-1 flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px]">{lang === 'bn' ? 'পণ্য' : 'Products'}</span>
        </a>

        <button
          onClick={() => setCartOpen(true)}
          className="p-1 flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-900 cursor-pointer relative"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px]">{lang === 'bn' ? 'কার্ট' : 'Cart'}</span>
          {cartItems.length > 0 && (
            <span className="absolute -top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
              {cartItems.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>

        <button
          onClick={() => setTrackOrderOpen(true)}
          className="p-1 flex flex-col items-center gap-0.5 text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <Truck className="w-5 h-5" />
          <span className="text-[10px]">{lang === 'bn' ? 'ট্র্যাক' : 'Track'}</span>
        </button>

        <a
          href={`https://wa.me/${(settings?.whatsappNumber || '01712345678').replace(/\D/g, '')}?text=${encodeURIComponent('হ্যালো Nova Shop, আমি একটি পণ্য সম্পর্কে তথ্য জানতে চাচ্ছি।')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 flex flex-col items-center gap-0.5 text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
        >
          <PhoneCall className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px]">WhatsApp</span>
        </a>
      </nav>

      {/* ALL INTERACTIVE MODALS & DRAWERS */}
      <ProductDetailModal
        product={selectedProduct}
        allProducts={products}
        lang={lang}
        isReseller={false}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, qty, vars) => handleAddToCart(p, qty, vars)}
        onDirectOrder={(p, qty, vars) => handleDirectOrder(p, qty, vars)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onProceedCheckout={() => setCheckoutOpen(true)}
        deliveryZones={deliveryZones}
        selectedZoneId={selectedZoneId}
        onSelectZoneId={setSelectedZoneId}
        lang={lang}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cartItems}
        deliveryZones={deliveryZones}
        selectedZoneId={selectedZoneId}
        settings={settings}
        lang={lang}
        onOrderSuccess={(order) => {
          setCartItems([]);
          localStorage.removeItem('novashop_cart');
        }}
        onTrackOrder={(orderId) => {
          setCheckoutOpen(false);
          setTrackedOrderId(orderId);
          setTrackOrderOpen(true);
        }}
      />

      <OrderTrackModal
        isOpen={trackOrderOpen}
        onClose={() => {
          setTrackOrderOpen(false);
          setTrackedOrderId('');
        }}
        initialOrderId={trackedOrderId}
        lang={lang}
      />

      <AiImageSearchModal
        isOpen={aiImageSearchOpen}
        onClose={() => setAiImageSearchOpen(false)}
        lang={lang}
        onSelectProduct={(prod) => {
          handleSelectProduct(prod);
          setAiImageSearchOpen(false);
        }}
      />
    </div>
  );
}