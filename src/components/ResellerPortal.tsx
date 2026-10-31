import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Copy, 
  Check, 
  ShieldAlert, 
  Package, 
  ArrowRight,
  LogOut,
  CreditCard,
  Share2,
  Users,
  Wallet,
  ArrowLeft,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import type { DeliveryZone, Order, Product, StoreSettings, User, ReferralCommission, WithdrawalRequest } from '../types.js';
import { api, setAuthToken } from '../api.js';

interface ResellerPortalProps {
  isOpen?: boolean;
  onClose: () => void;
  products: Product[];
  deliveryZones: DeliveryZone[];
  settings: StoreSettings | null;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  lang: 'bn' | 'en';
}

export const ResellerPortal: React.FC<ResellerPortalProps> = ({
  isOpen = true,
  onClose,
  products,
  deliveryZones,
  settings,
  currentUser,
  setCurrentUser,
  lang,
}) => {
  // All hooks MUST be declared unconditionally at the very top
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');
  const [regTxId, setRegTxId] = useState('');
  const [regSenderPhone, setRegSenderPhone] = useState('');
  const [regMethod, setRegMethod] = useState<'bkash' | 'nagad'>('bkash');

  // Reseller portal navigation state
  const [activeTab, setActiveTab] = useState<'catalog' | 'new-order' | 'my-orders' | 'referrals' | 'wallet' | 'stats'>('catalog');
  const [resellerOrders, setResellerOrders] = useState<Order[]>([]);
  const [resellerStats, setResellerStats] = useState<any>(null);
  const [referralsData, setReferralsData] = useState<{
    referralCode?: string;
    referralEnabled: boolean;
    commissionAmountPerReferral: number;
    discountMode: string;
    discountValue: number;
    commissionBalance: number;
    pendingCommission: number;
    totalReferredCount: number;
    activeReferredCount: number;
    commissions: ReferralCommission[];
  } | null>(null);
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reseller Order Builder State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderSellingPrice, setOrderSellingPrice] = useState<number>(0);
  const [orderVariants, setOrderVariants] = useState<Record<string, string>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Advance Payment State
  const minAdvanceRequired = settings?.minResellerAdvance || 50;
  const [advancePaidAmount, setAdvancePaidAmount] = useState<number>(minAdvanceRequired);
  const [advanceMethod, setAdvanceMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [advanceSenderPhone, setAdvanceSenderPhone] = useState('');
  const [advanceTxId, setAdvanceTxId] = useState('');
  const [copiedPayment, setCopiedPayment] = useState(false);
  const [copiedRefCode, setCopiedRefCode] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  // Profit Calculator Modal / Drawer State
  const [calcProduct, setCalcProduct] = useState<Product | null>(null);
  const [calcSellingPrice, setCalcSellingPrice] = useState<number>(0);
  const [calcQuantity, setCalcQuantity] = useState<number>(1);

  // Search & Filter in Catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('all');

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState<number>(settings?.minWithdrawalAmount || 500);
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad'>('bkash');
  const [withdrawNumber, setWithdrawNumber] = useState('');

  // Initializations
  useEffect(() => {
    if (deliveryZones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(deliveryZones[0].id);
    }
    if (settings?.minResellerAdvance) {
      setAdvancePaidAmount(settings.minResellerAdvance);
    }
  }, [deliveryZones, settings]);

  const isReseller = currentUser?.role === 'reseller';
  const isApproved = isReseller && currentUser?.status === 'active';
  const isPending = isReseller && currentUser?.status === 'pending_approval';

  const loadResellerData = async () => {
    if (!isApproved) return;
    setLoading(true);
    try {
      const [ordersData, statsData, refData, wdrData] = await Promise.all([
        api.getResellerOrders(),
        api.getResellerStats(),
        api.getResellerReferrals(),
        api.getResellerWithdrawals(),
      ]);
      setResellerOrders(ordersData);
      setResellerStats(statsData);
      setReferralsData(refData);
      setWithdrawalsList(wdrData);
    } catch (err: any) {
      console.error('Error fetching reseller data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isApproved) {
      loadResellerData();
    }
  }, [isApproved, activeTab]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.login({ email: loginEmail, password: loginPassword });
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setSuccessMsg(lang === 'bn' ? 'সফলভাবে লগইন হয়েছে!' : 'Login successful!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.registerReseller({
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        businessName: regBusinessName,
        referralCode: regReferralCode.trim() || undefined,
        registrationMethod: regMethod,
        registrationSenderPhone: regSenderPhone,
        registrationTxId: regTxId.trim(),
      });
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setSuccessMsg(
        lang === 'bn'
          ? 'রেজিস্ট্রেশন সম্পন্ন হয়েছে! অ্যাডমিন কর্তৃক পেমেন্ট যাচাইয়ের পর অ্যাকাউন্ট সক্রিয় হবে।'
          : 'Registration completed! Account will be active once admin verifies payment.'
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setActiveTab('catalog');
  };

  // Profit Calculator helper
  const openCalculator = (product: Product) => {
    setCalcProduct(product);
    setCalcSellingPrice(product.shopPrice);
    setCalcQuantity(1);
  };

  // Prepare order from calculator
  const prepareOrderFromProduct = (product: Product, sellingPrice?: number, qty?: number) => {
    setSelectedProduct(product);
    setOrderSellingPrice(sellingPrice || product.shopPrice);
    setOrderQuantity(qty || 1);
    const initialVars: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach((v) => {
        if (v.options && v.options.length > 0) initialVars[v.name] = v.options[0];
      });
    }
    setOrderVariants(initialVars);
    setCalcProduct(null);
    setActiveTab('new-order');
  };

  // Submit Reseller Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProduct) {
      setErrorMsg(lang === 'bn' ? 'দয়া করে একটি পণ্য নির্বাচন করুন।' : 'Please select a product.');
      return;
    }

    if (!customerName || !customerPhone || !customerAddress) {
      setErrorMsg(lang === 'bn' ? 'কাস্টমারের নাম, ফোন এবং সম্পূর্ণ ঠিকানা দিন।' : 'Customer details are required.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMsg(lang === 'bn' ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (০১৭...)' : 'Valid 11-digit Bangladeshi phone required.');
      return;
    }

    // Price limits validation
    const maxAllowed = selectedProduct.resellerMaxPrice || Math.round(selectedProduct.resellerPrice * 1.6);
    if (orderSellingPrice < selectedProduct.resellerPrice) {
      setErrorMsg(
        lang === 'bn'
          ? `বিক্রয় মূল্য পাইকারি খরচ (৳${selectedProduct.resellerPrice})-এর কম হতে পারবে না।`
          : `Selling price cannot be lower than wholesale cost (৳${selectedProduct.resellerPrice}).`
      );
      return;
    }
    if (orderSellingPrice > maxAllowed) {
      setErrorMsg(
        lang === 'bn'
          ? `বিক্রয় মূল্য সর্বোচ্চ সীমা (৳${maxAllowed})-এর বেশি হতে পারবে না।`
          : `Selling price exceeds maximum allowed price (৳${maxAllowed}).`
      );
      return;
    }

    // MANDATORY ADVANCE DELIVERY PAYMENT CHECK
    if (advancePaidAmount < minAdvanceRequired) {
      setErrorMsg(
        lang === 'bn'
          ? `রিসেলার অর্ডারের ক্ষেত্রে ন্যূনতম ৳${minAdvanceRequired} অগ্রিম ডেলিভারি চার্জ জমা দেওয়া বাধ্যতামূলক।`
          : `Minimum advance delivery payment of ৳${minAdvanceRequired} is mandatory for reseller orders.`
      );
      return;
    }

    if (!advanceTxId || advanceTxId.trim().length < 4) {
      setErrorMsg(
        lang === 'bn'
          ? 'দয়া করে অগ্রিম ডেলিভারি চার্জের সঠিক ট্রানজ্যাকশন আইডি (TrxID) দিন।'
          : 'Please provide the transaction ID (TrxID) for advance delivery payment.'
      );
      return;
    }

    setLoading(true);
    try {
      await api.createResellerOrder({
        customerName,
        customerPhone: cleanPhone,
        customerAddress,
        deliveryZoneId: selectedZoneId,
        items: [
          {
            productId: selectedProduct.id,
            quantity: orderQuantity,
            selectedVariants: orderVariants,
            resellerSellingPrice: orderSellingPrice,
          },
        ],
        advancePayment: {
          paidAmount: advancePaidAmount,
          method: advanceMethod,
          senderPhone: advanceSenderPhone || cleanPhone,
          txId: advanceTxId.trim(),
        },
        notes: orderNotes,
      });

      setSuccessMsg(
        lang === 'bn'
          ? 'রিসেলার অর্ডার সফলভাবে গ্রহণ করা হয়েছে! অ্যাডমিন অগ্রিম পেমেন্ট যাচাই করার পর পার্সেল পাঠানো হবে।'
          : 'Reseller order placed successfully! Parcel will dispatch after advance payment is verified by admin.'
      );

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setAdvanceTxId('');
      setAdvanceSenderPhone('');
      setOrderNotes('');
      setSelectedProduct(null);
      loadResellerData();
      setActiveTab('my-orders');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit reseller order');
    } finally {
      setLoading(false);
    }
  };

  // Submit Withdrawal Request
  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const minAmount = settings?.minWithdrawalAmount || 500;
    if (withdrawAmount < minAmount) {
      setErrorMsg(lang === 'bn' ? `সর্বনিম্ন উইথড্রল ৳${minAmount}।` : `Minimum withdrawal amount is ৳${minAmount}.`);
      return;
    }

    if (!withdrawNumber || withdrawNumber.length < 11) {
      setErrorMsg(lang === 'bn' ? 'সঠিক ১১ ডিজিটের অ্যাকাউন্ট নম্বর দিন।' : 'Valid 11-digit payout account required.');
      return;
    }

    setLoading(true);
    try {
      await api.requestWithdrawal({
        amount: withdrawAmount,
        payoutMethod: withdrawMethod,
        payoutNumber: withdrawNumber,
      });
      setSuccessMsg(
        lang === 'bn'
          ? `৳${withdrawAmount} উইথড্রল রিকোয়েস্ট জমা হয়েছে! অ্যাডমিন শীঘ্রই পেমেন্ট পরিশোধ করবেন।`
          : `Withdrawal request for ৳${withdrawAmount} submitted!`
      );
      setWithdrawNumber('');
      loadResellerData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPaymentNum = (num: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedPayment(true);
      setTimeout(() => setCopiedPayment(false), 2000);
    }
  };

  const handleCopyRefCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedRefCode(true);
      setTimeout(() => setCopiedRefCode(false), 2000);
    }
  };

  const handleShareWhatsApp = (code: string) => {
    const text = encodeURIComponent(
      `Nova Shop রিসেলার প্ল্যাটফর্মে জয়েন করুন এবং ঘরে বসেই পাইকারি রেটে পণ্য বিক্রি করে আয় করুন! রেজিস্ট্রেশন করার সময় আমার রেফারেল কোড "${code}" ব্যবহার করলে পেয়ে যাবেন ৫০% ছাড়! ভিজিট করুন: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyShareLink = (code: string) => {
    const link = `${window.location.origin}/?ref=${encodeURIComponent(code)}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link);
    }
    setCopiedShareLink(true);
    setSuccessMsg(lang === 'bn' ? 'রেফারেল লিংক কপি হয়েছে!' : 'Referral link copied to clipboard!');
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleCopyProductInfo = (product: Product) => {
    const text = `🛍️ ${product.banglaName || product.name}
💰 বিক্রয় মূল্য: ৳${product.shopPrice}
🏷️ প্রোডাক্ট কোড (SKU): ${product.sku}

📝 বিবরণ:
${product.banglaDescription || product.description || '১০০% অরিজিনাল কোয়ালিটি পণ্য।'}

🚚 সারাদেশে হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা!
অর্ডার করতে ইনবক্স করুন।`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedProductId(product.id);
    setSuccessMsg(lang === 'bn' ? `'${product.banglaName || product.name}'-এর তথ্য কপি হয়েছে! ফেসবুকে পোস্ট করতে পারেন।` : 'Product details copied to clipboard!');
    setTimeout(() => setCopiedProductId(null), 2500);
  };

  // Filter products for catalog
  const filteredProducts = products.filter((p) => {
    const matchCategory = catalogCategory === 'all' || p.category === catalogCategory;
    const matchQuery =
      !catalogSearch ||
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (p.banglaName && p.banglaName.includes(catalogSearch));
    return matchCategory && matchQuery;
  });

  // Early return strictly AFTER all hooks
  if (!isOpen) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Sticky App Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs sm:text-sm font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'শপে ফিরে যান' : 'Back to Shop'}</span>
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold leading-tight flex items-center gap-2">
                  <span>{settings?.banglaShopName || 'নোভা শপ'}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {lang === 'bn' ? 'রিসেলার হাব' : 'Reseller Hub'}
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  {lang === 'bn' ? 'পাইকারি রেট • নিজস্ব প্রফিট মার্জিন • ড্রপশিপিং' : 'Wholesale Rates • Zero Hassle Dropshipping'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser && isReseller ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white">{currentUser.businessName || currentUser.name}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">
                    {currentUser.referralCode ? `Ref: ${currentUser.referralCode}` : currentUser.phone}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                {lang === 'bn' ? 'অনুমোদিত রিসেলারদের জন্য সংরক্ষিত' : 'Exclusive for verified resellers'}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        {isApproved && (
          <div className="bg-slate-800/90 border-t border-slate-700/60 hidden md:block">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-1">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'পাইকারি ক্যাটালগ' : 'Wholesale Catalog'}</span>
              </button>

              <button
                onClick={() => setActiveTab('new-order')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'new-order'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'নতুন কাস্টমার অর্ডার' : 'New Customer Order'}</span>
              </button>

              <button
                onClick={() => setActiveTab('my-orders')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'my-orders'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'আমার অর্ডার ও ট্র্যাকিং' : 'My Orders & Tracking'}</span>
                {resellerOrders.length > 0 && (
                  <span className="bg-slate-900 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {resellerOrders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'referrals'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'রেফারেল ও আয়' : 'Referrals & Earnings'}</span>
              </button>

              <button
                onClick={() => setActiveTab('wallet')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'wallet'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'উইথড্রল ও ওয়ালেট' : 'Withdrawals & Wallet'}</span>
                {referralsData?.commissionBalance ? (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    ৳{referralsData.commissionBalance}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Notification Toast Messages */}
      {errorMsg && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="p-1 text-emerald-500 hover:text-emerald-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 pb-24 md:pb-12">
        {/* VIEW 1: Non-logged or Guest User (Registration / Login) */}
        {!currentUser || currentUser.role !== 'reseller' ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden my-4 sm:my-8 animate-in fade-in duration-300">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-900 text-white p-6 sm:p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
                <TrendingUp className="w-8 h-8 text-emerald-300" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                {lang === 'bn' ? 'নোভা শপ রিসেলার প্ল্যাটফর্মে স্বাগতম' : 'Welcome to Nova Shop Reseller Hub'}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-md mx-auto">
                {lang === 'bn'
                  ? 'কোনো ইনভেস্টমেন্ট ছাড়া ঘরে বসেই পাইকারি রেটে পণ্য বিক্রি করে প্রতিদিন নিশ্চিত লাভ অর্জন করুন।'
                  : 'Start your zero-investment dropshipping business with authentic wholesale Bangladeshi goods.'}
              </p>

              {/* Mode Switcher */}
              <div className="grid grid-cols-2 p-1 bg-black/20 rounded-xl mt-6 max-w-xs mx-auto backdrop-blur-xs">
                <button
                  onClick={() => setAuthMode('login')}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    authMode === 'login' ? 'bg-white text-slate-900 shadow-md' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'রিসেলার লগইন' : 'Reseller Login'}
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    authMode === 'register' ? 'bg-white text-slate-900 shadow-md' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'নতুন রেজিস্ট্রেশন' : 'Register Now'}
                </button>
              </div>
            </div>

            {/* Login Form */}
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="kabir@reseller.bd"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? (lang === 'bn' ? 'লগইন হচ্ছে...' : 'Logging in...') : (lang === 'bn' ? 'লগইন করুন' : 'Sign In')}
                </button>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{lang === 'bn' ? 'ডেমো রিসেলার ক্রেডেনশিয়াল:' : 'Demo Reseller:'}</span>{' '}
                  kabir@reseller.bd / reseller123
                </div>
              </form>
            ) : (
              /* Registration Form */
              <form onSubmit={handleRegister} className="p-6 sm:p-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'bn' ? 'আপনার পূর্ণ নাম *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Asif Karim"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'bn' ? 'ব্যবসা / পেইজের নাম' : 'Business / Page Name'}
                    </label>
                    <input
                      type="text"
                      value={regBusinessName}
                      onChange={(e) => setRegBusinessName(e.target.value)}
                      placeholder="e.g. Karim Fashion"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'bn' ? 'ইমেইল অ্যাড্রেস *' : 'Email Address *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="asif@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {lang === 'bn' ? '১১ ডিজিটের মোবাইল নম্বর *' : 'Phone Number *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {lang === 'bn' ? 'পাসওয়ার্ড সেট করুন *' : 'Set Password *'}
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* Referral Code Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>{lang === 'bn' ? 'রেফারেল কোড (ঐচ্ছিক)' : 'Referral Code (Optional)'}</span>
                    <span className="text-emerald-600 font-semibold text-[11px]">
                      {lang === 'bn' ? 'রেফারেল কোডে ৫০% ছাড়!' : '50% discount with referral!'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={regReferralCode}
                    onChange={(e) => setRegReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. NOVA-1001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm uppercase font-mono tracking-wider focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                {/* Registration Fee & Manual Payment Instructions */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-900">
                      {lang === 'bn' ? 'রিসেলার রেজিস্ট্রেশন ফি:' : 'Registration Fee:'}
                    </div>
                    <div className="text-sm font-black text-amber-950 flex items-center gap-2">
                      {regReferralCode.trim() ? (
                        <>
                          <span className="line-through text-slate-400 text-xs">
                            ৳{settings?.resellerRegistrationFee || 200}
                          </span>
                          <span className="text-emerald-700 font-black">
                            ৳{Math.round((settings?.resellerRegistrationFee || 200) / 2)}
                          </span>
                        </>
                      ) : (
                        <span>৳{settings?.resellerRegistrationFee || 200}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {lang === 'bn'
                      ? 'নিচের বিকাশ অথবা নগদ নম্বরে রেজিস্ট্রেশন ফি সেন্ড মানি করুন এবং ট্রানজ্যাকশন আইডি নিচে জমা দিন।'
                      : 'Send registration fee to the number below and submit your Transaction ID.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-amber-200 flex flex-col justify-between">
                      <span className="font-bold text-pink-700">bKash (Personal):</span>
                      <span className="font-mono font-bold text-slate-800">{settings?.bkashNumber || '01712345678'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPaymentNum(settings?.bkashNumber || '01712345678')}
                        className="mt-1 text-[10px] text-emerald-700 font-bold hover:underline self-start cursor-pointer"
                      >
                        {copiedPayment ? 'কপি হয়েছে!' : 'কপি করুন'}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-amber-200 flex flex-col justify-between">
                      <span className="font-bold text-orange-700">Nagad (Personal):</span>
                      <span className="font-mono font-bold text-slate-800">{settings?.nagadNumber || '01812345678'}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPaymentNum(settings?.nagadNumber || '01812345678')}
                        className="mt-1 text-[10px] text-emerald-700 font-bold hover:underline self-start cursor-pointer"
                      >
                        {copiedPayment ? 'কপি হয়েছে!' : 'কপি করুন'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        {lang === 'bn' ? 'পেমেন্ট মেথড *' : 'Payment Method *'}
                      </label>
                      <select
                        value={regMethod}
                        onChange={(e: any) => setRegMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                      >
                        <option value="bkash">বিকাশ (bKash)</option>
                        <option value="nagad">নগদ (Nagad)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        {lang === 'bn' ? 'যে নম্বর থেকে পাঠিয়েছেন' : 'Sender Mobile No'}
                      </label>
                      <input
                        type="tel"
                        value={regSenderPhone}
                        onChange={(e) => setRegSenderPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                      {lang === 'bn' ? 'ট্রানজ্যাকশন আইডি (TrxID) *' : 'Transaction ID (TrxID) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={regTxId}
                      onChange={(e) => setRegTxId(e.target.value.toUpperCase())}
                      placeholder="e.g. BK78923412"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase tracking-wider bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {loading
                    ? (lang === 'bn' ? 'রেজিস্ট্রেশন হচ্ছে...' : 'Registering...')
                    : (lang === 'bn' ? 'রেজিস্ট্রেশন জমা দিন' : 'Submit Registration')}
                </button>
              </form>
            )}
          </div>
        ) : isPending ? (
          /* VIEW 2: Pending Approval Status Screen */
          <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-amber-200 text-center shadow-lg my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {lang === 'bn' ? 'আবেদনটি পর্যালোচনায় রয়েছে' : 'Application Under Review'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              {lang === 'bn'
                ? `ধন্যবাদ ${currentUser.name}! আপনার রিসেলার রেজিস্ট্রেশন ও ফি পেমেন্ট রিকোয়েস্ট (TrxID: ${
                    currentUser.registrationTxId || 'Pending'
                  }) অ্যাডমিন টিম যাচাই করছে। খুব শীঘ্রই আপনার রিসেলার অ্যাকাউন্ট সক্রিয় হবে।`
                : `Thank you ${currentUser.name}! Your reseller registration is pending payment verification by an admin.`}
            </p>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1 mb-6">
              <div className="flex justify-between text-slate-500">
                <span>ইমেইল:</span> <span className="font-medium text-slate-800">{currentUser.email}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>মোবাইল:</span> <span className="font-medium text-slate-800">{currentUser.phone}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>রেজিস্ট্রেশন স্ট্যাটাস:</span>
                <span className="font-bold text-amber-600">Pending Verification</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={loadResellerData}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                {lang === 'bn' ? 'স্ট্যাটাস রিফ্রেশ করুন' : 'Refresh Status'}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                {lang === 'bn' ? 'লগআউট' : 'Sign Out'}
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 3: Active Approved Reseller Dashboard (Tabs) */
          <div>
            {/* Executive Reseller Welcome & Profile Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-emerald-500/30 p-5 sm:p-6 mb-6 text-white shadow-xl">
              {/* Background ambient lighting */}
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20 shrink-0">
                    {((currentUser?.businessName || currentUser?.name || 'R').slice(0, 2)).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                        {currentUser?.businessName || currentUser?.name}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ভেরিফাইড অফিসিয়াল রিসেলার</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                      <span>📞 {currentUser?.phone}</span>
                      <span>•</span>
                      <span>✉️ {currentUser?.email}</span>
                      {currentUser?.businessName && <span>• 🏢 {currentUser.businessName}</span>}
                    </p>
                  </div>
                </div>

                {/* Referral Code Quick Copy Box & Direct Wallet Cashout */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-3 text-xs w-full sm:w-auto">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-300 block leading-tight">আপনার রেফারেল কোড</span>
                      <span className="font-mono font-black text-emerald-300 text-sm">{currentUser?.referralCode || 'NOVA-1001'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyRefCode(currentUser?.referralCode || '')}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                        title="কোড কপি করুন"
                      >
                        {copiedRefCode ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyShareLink(currentUser?.referralCode || '')}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                        title="ইনভাইট লিংক কপি করুন"
                      >
                        {copiedShareLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('wallet')}
                    className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>টাকা উত্তোলন (ক্যাশআউট)</span>
                  </button>
                </div>
              </div>

              {/* Fast Reselling 4-Step Flow Guidance Pills */}
              <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] text-slate-200">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2 border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">১</span>
                  <span className="line-clamp-1">পাইকারি রেটে পণ্য পছন্দ করুন</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2 border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">২</span>
                  <span className="line-clamp-1">নিজের লাভে সেল করুন</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2 border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">৩</span>
                  <span className="line-clamp-1">অগ্রিম ডেলিভারি ফি দিয়ে অর্ডার</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl p-2 border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">৪</span>
                  <span className="line-clamp-1">ডেলিভারিতে অটো লাভ ওয়ালেটে</span>
                </div>
              </div>
            </div>

            {/* Reseller Quick Stats Bar (Luxury 4-Cards Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {/* Card 1: Available Balance */}
              <div
                onClick={() => setActiveTab('wallet')}
                className="clay-card p-4 sm:p-5 bg-white rounded-3xl border border-emerald-100/80 shadow-sm flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {lang === 'bn' ? 'উপলব্ধ ওয়ালেট ব্যালেন্স' : 'Available Balance'}
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 leading-tight">
                    ৳{referralsData?.commissionBalance || 0}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">
                    ✓ ক্যাশআউট করার জন্য প্রস্তুত
                  </span>
                </div>
              </div>

              {/* Card 2: Pending Commission / Profit */}
              <div
                onClick={() => setActiveTab('my-orders')}
                className="clay-card p-4 sm:p-5 bg-white rounded-3xl border border-amber-100/80 shadow-sm flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {lang === 'bn' ? 'পেন্ডিং প্রত্যাশিত লাভ' : 'Pending Profit'}
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-black text-amber-600 leading-tight">
                    ৳{resellerStats?.pendingProfit || referralsData?.pendingCommission || 0}
                  </div>
                  <span className="text-[10px] text-amber-700 font-bold mt-1 inline-block">
                    ⏳ ডেলিভারির পর ব্যালেন্সে যোগ হবে
                  </span>
                </div>
              </div>

              {/* Card 3: Total Reseller Orders */}
              <div
                onClick={() => setActiveTab('my-orders')}
                className="clay-card p-4 sm:p-5 bg-white rounded-3xl border border-indigo-100/80 shadow-sm flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {lang === 'bn' ? 'মোট সম্পন্ন অর্ডার' : 'Total Orders'}
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {resellerStats?.totalOrders || resellerOrders.length} <span className="text-sm font-bold text-slate-400">টি</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 font-bold mt-1 inline-block">
                    সফল ডেলিভারি: {resellerStats?.deliveredOrders || 0} টি
                  </span>
                </div>
              </div>

              {/* Card 4: Total Lifetime Withdrawn */}
              <div
                onClick={() => setActiveTab('wallet')}
                className="clay-card p-4 sm:p-5 bg-white rounded-3xl border border-teal-100/80 shadow-sm flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {lang === 'bn' ? 'মোট উত্তোলিত আয়' : 'Total Withdrawn'}
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-black text-teal-800 leading-tight">
                    ৳{currentUser?.totalWithdrawn || 0}
                  </div>
                  <span className="text-[10px] text-teal-700 font-bold mt-1 inline-block">
                    ✓ লাইফটাইম মোট ক্যাশআউট
                  </span>
                </div>
              </div>
            </div>

            {/* TAB 1: WHOLESALE CATALOG */}
            {activeTab === 'catalog' && (() => {
              const dynamicCategories = [
                { slug: 'all', label: 'সকল পণ্য' },
                ...Array.from(new Set(products.map((p) => p.category)))
                  .filter(Boolean)
                  .map((slug) => {
                    let label = slug;
                    if (slug === 'mens-fashion') label = 'মেনস ফ্যাশন';
                    else if (slug === 'womens-collection') label = 'ওমেনস কালেকশন';
                    else if (slug === 'electronics') label = 'ইলেকট্রনিক্স';
                    else if (slug === 'traditional-wear') label = 'ঐতিহ্যবাহী পোশাক';
                    else if (slug === 'accessories') label = 'ব্যাগ ও এক্সেসরিজ';
                    return { slug, label };
                  }),
              ];

              return (
                <div className="space-y-4">
                  {/* Search & Dynamic Category Filter Bar */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={catalogSearch}
                        onChange={(e) => setCatalogSearch(e.target.value)}
                        placeholder={lang === 'bn' ? 'নাম বা SKU দিয়ে পাইকারি পণ্য খুঁজুন...' : 'Search products or SKU...'}
                        className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 font-medium text-slate-800"
                      />
                      {catalogSearch && (
                        <button
                          type="button"
                          onClick={() => setCatalogSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                      {dynamicCategories.map((cat) => (
                        <button
                          key={cat.slug}
                          onClick={() => setCatalogCategory(cat.slug)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                            catalogCategory === cat.slug
                              ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((p) => {
                      const wholesaleCost = p.resellerPrice;
                      const defaultSelling = p.shopPrice;
                      const maxAllowed = p.resellerMaxPrice || Math.round(wholesaleCost * 1.6);
                      const estimatedProfit = defaultSelling - wholesaleCost;

                      return (
                        <div
                          key={p.id}
                          className="clay-card bg-white rounded-3xl overflow-hidden border border-slate-200/80 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
                        >
                          <div>
                            <div className="relative aspect-4/3 overflow-hidden bg-slate-100 rounded-t-3xl">
                              <img
                                src={p.images[0] || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80'}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                loading="lazy"
                              />
                              <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md">
                                {lang === 'bn' ? '🏷️ পাইকারি রেট' : 'Wholesale'}
                              </div>
                              <div className="absolute top-2.5 right-2.5 bg-slate-900/85 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded-xl font-mono font-bold">
                                SKU: {p.sku}
                              </div>
                            </div>

                            <div className="p-4 sm:p-5">
                              <h3 className="font-black text-sm sm:text-base text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition">
                                {p.banglaName || p.name}
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{p.name}</p>

                              {/* 3-Tier Pricing Breakdown */}
                              <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100/90 space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 font-medium">{lang === 'bn' ? 'পাইকারি খরচ (আপনার রেট):' : 'Wholesale Cost:'}</span>
                                  <span className="font-black text-emerald-700 text-base">৳{wholesaleCost}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">{lang === 'bn' ? 'খুচরা শপ বিক্রয় মূল্য:' : 'Retail Shop Price:'}</span>
                                  <span className="font-bold text-slate-800">৳{p.shopPrice}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">{lang === 'bn' ? 'সর্বোচ্চ বিক্রয় সীমা:' : 'Max Allowed Price:'}</span>
                                  <span className="font-semibold text-slate-600">৳{maxAllowed}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700">{lang === 'bn' ? 'আপনার সম্ভাব্য লাভ:' : 'Est. Profit:'}</span>
                                  <span className="text-xs font-black text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-lg">
                                    + ৳{estimatedProfit} / পিস
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 sm:p-5 pt-0 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => openCalculator(p)}
                                className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === 'bn' ? 'লাভ হিসাব' : 'Profit Calc'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => prepareOrderFromProduct(p)}
                                className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                              >
                                <span>{lang === 'bn' ? 'অর্ডার প্লেস' : 'Place Order'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Copy Product Details for Social Media Posting */}
                            <button
                              type="button"
                              onClick={() => handleCopyProductInfo(p)}
                              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {copiedProductId === p.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">বিবরণী কপি হয়েছে!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>ফেসবুক/সোশ্যালে পোস্টের জন্য বিবরণী কপি</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* TAB 2: NEW RESELLER ORDER BUILDER */}
            {activeTab === 'new-order' && (
              <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
                <div className="border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      {lang === 'bn' ? 'নতুন কাস্টমার অর্ডার তৈরি করুন' : 'Create New Reseller Customer Order'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lang === 'bn'
                        ? 'আপনার কাস্টমারের ডেলিভারি ঠিকানা দিন এবং নির্ধারিত অগ্রিম ফি পরিশোধ করে অর্ডার কনফার্ম করুন।'
                        : 'Submit customer dropshipping details with mandatory advance delivery charge.'}
                    </p>
                  </div>
                  {selectedProduct && (
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-xs text-rose-600 hover:underline cursor-pointer"
                    >
                      {lang === 'bn' ? 'পণ্য পরিবর্তন' : 'Change Product'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleCreateOrder} className="space-y-6">
                  {/* Step 1: Product Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ১. পণ্য নির্বাচন ও রিসেলার বিক্রয় মূল্য
                    </label>

                    {!selectedProduct ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
                        <p className="text-xs text-slate-500 mb-3">
                          {lang === 'bn' ? 'এখনো কোনো পণ্য নির্বাচন করা হয়নি।' : 'No product selected yet.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('catalog')}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                        >
                          {lang === 'bn' ? 'ক্যাটালগ থেকে পণ্য বেছে নিন' : 'Choose Product from Catalog'}
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={selectedProduct.images[0]}
                            alt={selectedProduct.name}
                            className="w-16 h-16 rounded-xl object-cover border border-emerald-200"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{selectedProduct.banglaName || selectedProduct.name}</h4>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>পাইকারি খরচ: <strong className="text-emerald-700">৳{selectedProduct.resellerPrice}</strong></span>
                              <span>•</span>
                              <span>সর্বোচ্চ বিক্রয়: <strong>৳{selectedProduct.resellerMaxPrice || Math.round(selectedProduct.resellerPrice * 1.6)}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Variants Selector */}
                        {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                            {selectedProduct.variants.map((v) => (
                              <div key={v.name}>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">{v.name}:</label>
                                <select
                                  value={orderVariants[v.name] || (v.options[0] || '')}
                                  onChange={(e) => setOrderVariants({ ...orderVariants, [v.name]: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                                >
                                  {v.options.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quantity and Custom Selling Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {lang === 'bn' ? 'অর্ডার পরিমাণ (Quantity):' : 'Quantity:'}
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={selectedProduct.stock}
                              value={orderQuantity}
                              onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                              <span>{lang === 'bn' ? 'কাস্টমারের নিকট বিক্রয় মূল্য (প্রতি পিস):' : 'Customer Selling Price:'}</span>
                              <span className="text-emerald-600 font-bold">
                                লাভ: ৳{(orderSellingPrice - selectedProduct.resellerPrice) * orderQuantity}
                              </span>
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-slate-400 font-bold">৳</span>
                              <input
                                type="number"
                                min={selectedProduct.resellerPrice}
                                max={selectedProduct.resellerMaxPrice || Math.round(selectedProduct.resellerPrice * 1.6)}
                                value={orderSellingPrice}
                                onChange={(e) => setOrderSellingPrice(parseFloat(e.target.value) || 0)}
                                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-emerald-800"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Customer Delivery Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      ২. কাস্টমারের ডেলিভারি তথ্য
                    </label>

                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {lang === 'bn' ? 'কাস্টমারের নাম *' : 'Customer Name *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. Farhana Sultana"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {lang === 'bn' ? 'কাস্টমারের মোবাইল নম্বর *' : 'Customer Phone Number *'}
                          </label>
                          <input
                            type="tel"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === 'bn' ? 'ডেলিভারি এলাকা (Delivery Zone) *' : 'Delivery Zone *'}
                        </label>
                        <select
                          value={selectedZoneId}
                          onChange={(e) => setSelectedZoneId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                        >
                          {deliveryZones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.banglaName} — ৳{z.charge} ({z.banglaEstimatedDays})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === 'bn' ? 'কাস্টমারের পূর্ণ ঠিকানা (বাড়ি, রোড, এলাকা, জেলা) *' : 'Full Customer Address *'}
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="e.g. House 42, Road 11, Sector 4, Uttara, Dhaka"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: MANDATORY RESELLER ADVANCE DELIVERY PAYMENT */}
                  <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-4">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs sm:text-sm">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>৩. বাধ্যতামূলক অগ্রিম ডেলিভারি চার্জ পরিশোধ (ন্যূনতম ৳{minAdvanceRequired})</span>
                    </div>

                    <p className="text-[11px] text-rose-800 leading-relaxed">
                      {lang === 'bn'
                        ? 'ভুয়া অর্ডার ও রিটার্ন প্রতিরোধে রিসেলারদের প্রতিটি অর্ডারের বিপরীতে ন্যূনতম ৫০ টাকা অগ্রিম ডেলিভারি ফি বিকাশ বা নগদে পাঠানো বাধ্যতামূলক। অ্যাডমিন ভেরিফাই করার পরই পার্সেল ডিসপ্যাচ করা হবে।'
                        : 'To prevent fake orders and return abuse, an advance delivery charge of at least ৳50 is mandatory. Parcels are dispatched strictly after admin verification.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-rose-200">
                        <span className="font-bold text-pink-700 block">bKash (Send Money):</span>
                        <span className="font-mono font-bold text-slate-900">{settings?.bkashNumber || '01712345678'}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyPaymentNum(settings?.bkashNumber || '01712345678')}
                          className="mt-1 text-[10px] text-emerald-700 font-bold hover:underline block cursor-pointer"
                        >
                          {copiedPayment ? 'কপি হয়েছে!' : 'নম্বর কপি করুন'}
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-rose-200">
                        <span className="font-bold text-orange-700 block">Nagad (Send Money):</span>
                        <span className="font-mono font-bold text-slate-900">{settings?.nagadNumber || '01812345678'}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyPaymentNum(settings?.nagadNumber || '01812345678')}
                          className="mt-1 text-[10px] text-emerald-700 font-bold hover:underline block cursor-pointer"
                        >
                          {copiedPayment ? 'কপি হয়েছে!' : 'নম্বর কপি করুন'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          {lang === 'bn' ? 'জমা দেওয়া পরিমাণ (৳) *' : 'Paid Amount (৳) *'}
                        </label>
                        <input
                          type="number"
                          min={minAdvanceRequired}
                          required
                          value={advancePaidAmount}
                          onChange={(e) => setAdvancePaidAmount(parseFloat(e.target.value) || minAdvanceRequired)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          {lang === 'bn' ? 'পেমেন্ট মেথড *' : 'Method *'}
                        </label>
                        <select
                          value={advanceMethod}
                          onChange={(e: any) => setAdvanceMethod(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        >
                          <option value="bkash">বিকাশ (bKash)</option>
                          <option value="nagad">নগদ (Nagad)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          {lang === 'bn' ? 'যে নম্বর থেকে পাঠিয়েছেন' : 'Sender Phone'}
                        </label>
                        <input
                          type="tel"
                          value={advanceSenderPhone}
                          onChange={(e) => setAdvanceSenderPhone(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        {lang === 'bn' ? 'অগ্রিম পেমেন্টের ট্রানজ্যাকশন আইডি (TrxID) *' : 'Advance Payment TrxID *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={advanceTxId}
                        onChange={(e) => setAdvanceTxId(e.target.value.toUpperCase())}
                        placeholder="e.g. BK98234712"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase tracking-wider bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                        {lang === 'bn' ? 'অর্ডারের বিশেষ নির্দেশনা বা ডেলিভারি নোট (ঐচ্ছিক)' : 'Order / Delivery Notes (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder={lang === 'bn' ? 'যেমন: ইনভয়েস ছাড়া ডেলিভারি দিন' : 'Special packaging notes...'}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !selectedProduct}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {loading
                        ? (lang === 'bn' ? 'অর্ডার জমা হচ্ছে...' : 'Submitting Order...')
                        : (lang === 'bn' ? 'অর্ডার কনফার্ম করুন (অগ্রিম ফি সহ)' : 'Confirm Reseller Order')}
                    </span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: MY ORDERS & TRACKING */}
            {activeTab === 'my-orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {lang === 'bn' ? 'আপনার প্রেরিত সকল রিসেলার অর্ডার' : 'Your Reseller Customer Orders'}
                  </h2>
                  <button
                    onClick={loadResellerData}
                    className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
                  </button>
                </div>

                {resellerOrders.length === 0 ? (
                  <div className="clay-card bg-white rounded-3xl p-8 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">{lang === 'bn' ? 'এখনো কোনো অর্ডার তৈরি করা হয়নি।' : 'No reseller orders yet.'}</p>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                    >
                      {lang === 'bn' ? 'ক্যাটালগ দেখুন' : 'Browse Catalog'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resellerOrders.map((o) => {
                      const isAdvanceVerified = o.resellerAdvancePayment?.status === 'VERIFIED';
                      const isAdvancePending = o.resellerAdvancePayment?.status === 'PENDING_VERIFICATION';

                      return (
                        <div
                          key={o.id}
                          className="clay-card bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 flex flex-col sm:flex-row justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-slate-900">{o.id}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  o.orderStatus === 'DELIVERED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : o.orderStatus === 'SHIPPED'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : o.orderStatus === 'CANCELLED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {o.orderStatus}
                              </span>

                              {/* Advance Payment Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  isAdvanceVerified
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isAdvancePending
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isAdvanceVerified ? '✓ অ্যাডভান্স ভেরিফাইড' : '⏳ অ্যাডভান্স ভেরিফিকেশন বাকি'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-600 space-y-0.5">
                              <div><strong>কাস্টমার:</strong> {o.customerName} ({o.customerPhone})</div>
                              <div><strong>ঠিকানা:</strong> {o.customerAddress} ({o.deliveryZoneName})</div>
                              <div><strong>পণ্য:</strong> {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}</div>
                            </div>
                          </div>

                          <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end">
                            <div>
                              <div className="text-xs text-slate-400">কাস্টমার বিল (COD):</div>
                              <div className="text-base font-bold text-slate-900">৳{o.totalAmount}</div>
                            </div>
                            <div className="sm:mt-2">
                              <div className="text-xs text-emerald-600 font-bold">
                                আপনার লাভ: ৳{o.resellerProfit || 0}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                TrxID: {o.resellerAdvancePayment?.txId || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: REFERRALS & EARNINGS */}
            {activeTab === 'referrals' && (
              <div className="space-y-6">
                {/* Referral Code Banner */}
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs px-3 py-1 rounded-full font-bold">
                      রেফারেল ও ইনভাইট বোনাস
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black">
                      বন্ধু ও পরিচিতদের ইনভাইট করুন এবং প্রতি রেফারেলে আয় করুন ৳{referralsData?.commissionAmountPerReferral || 50}
                    </h2>
                    <p className="text-xs sm:text-sm text-indigo-200 max-w-lg leading-relaxed">
                      আপনার রেফারেল কোড দিয়ে নতুন কেউ রিসেলার হিসেবে যুক্ত হলে তারা পাবে রেজিস্ট্রেশন ফিতে ৫০% ছাড় এবং আপনি পাবেন প্রতিটি অনুমোদিত রেফারেলে ক্যাশ বোনাস!
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0 w-full md:w-auto">
                    <div className="text-[11px] text-indigo-200 font-semibold mb-1">আপনার ইউনিক রেফারেল কোড:</div>
                    <div className="text-2xl font-mono font-black text-white tracking-widest bg-black/30 px-4 py-2 rounded-xl mb-3">
                      {currentUser?.referralCode || 'NOVA-RESELLER'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyRefCode(currentUser?.referralCode || '')}
                        className="flex-1 py-2 px-3 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        {copiedRefCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedRefCode ? 'কপি হয়েছে' : 'কোড কপি'}</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(currentUser?.referralCode || '')}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>শেয়ার</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Referral Commissions Ledger */}
                <div className="clay-card bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      রেফারেল কমিশন লেজার (Auditable Earnings)
                    </h3>
                    <div className="text-xs text-slate-500">
                      মোট রেফারেল: <strong>{referralsData?.totalReferredCount || 0} জন</strong>
                    </div>
                  </div>

                  {!referralsData?.commissions || referralsData.commissions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      এখনো কোনো রেফারেল কমিশন রেকর্ড হয়নি। আপনার রেফারেল কোড শেয়ার করুন!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">রেফারেল আইডি</th>
                            <th className="py-2.5 px-3 font-semibold">আমন্ত্রিত রিসেলার</th>
                            <th className="py-2.5 px-3 font-semibold">তারিখ</th>
                            <th className="py-2.5 px-3 font-semibold">টাকার পরিমাণ</th>
                            <th className="py-2.5 px-3 font-semibold">স্ট্যাটাস</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {referralsData.commissions.map((c) => (
                            <tr key={c.id}>
                              <td className="py-2.5 px-3 font-mono text-slate-500">{c.id}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{c.referredUserName}</td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {new Date(c.createdAt).toLocaleDateString('bn-BD')}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-600">৳{c.amount}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    c.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : c.status === 'PENDING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {c.status === 'APPROVED' ? 'অনুমোদিত' : c.status === 'PENDING' ? 'অপেক্ষমাণ' : 'বাতিল'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: WITHDRAWALS & WALLET */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Wallet Card */}
                  <div className="clay-card bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        উপলব্ধ উইথড্রল ব্যালেন্স
                      </div>
                      <div className="text-3xl font-black text-emerald-400 mt-1">
                        ৳{referralsData?.commissionBalance || 0}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-2">
                        অনুমোদিত কমিশন থেকে সরাসরি বিকাশ বা নগদে টাকা তুলতে পারবেন।
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-700/60 mt-4 text-xs space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>পেন্ডিং কমিশন:</span> <span className="font-semibold text-amber-400">৳{referralsData?.pendingCommission || 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>মোট উত্তোলিত:</span> <span className="font-semibold text-slate-200">৳{currentUser?.totalWithdrawn || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Withdrawal Form */}
                  <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1">
                      টাকা উত্তোলনের আবেদন (Withdrawal Request)
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {lang === 'bn'
                        ? `সর্বনিম্ন উত্তোলনযোগ্য পরিমাণ ৳${settings?.minWithdrawalAmount || 500}। আবেদন করার ২৪ ঘণ্টার মধ্যে বিকাশ/নগদে পরিশোধ করা হয়।`
                        : `Minimum withdrawal is ৳${settings?.minWithdrawalAmount || 500}.`}
                    </p>

                    <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {lang === 'bn' ? 'টাকার পরিমাণ (৳) *' : 'Amount (BDT) *'}
                          </label>
                          <input
                            type="number"
                            min={settings?.minWithdrawalAmount || 500}
                            max={referralsData?.commissionBalance || 0}
                            required
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-hidden"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            {lang === 'bn' ? 'পেমেন্ট মেথড *' : 'Payout Method *'}
                          </label>
                          <select
                            value={withdrawMethod}
                            onChange={(e: any) => setWithdrawMethod(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                          >
                            <option value="bkash">বিকাশ (bKash Personal)</option>
                            <option value="nagad">নগদ (Nagad Personal)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {lang === 'bn' ? '১১ ডিজিটের বিকাশ/নগদ নম্বর *' : 'Account Mobile Number *'}
                        </label>
                        <input
                          type="tel"
                          required
                          value={withdrawNumber}
                          onChange={(e) => setWithdrawNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || (referralsData?.commissionBalance || 0) < (settings?.minWithdrawalAmount || 500)}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
                      >
                        {loading
                          ? (lang === 'bn' ? 'আবেদন পাঠানো হচ্ছে...' : 'Submitting...')
                          : (lang === 'bn' ? 'উইথড্রল রিকোয়েস্ট জমা দিন' : 'Submit Withdrawal')}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Withdrawals History Table */}
                <div className="clay-card bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-3">
                    উইথড্রল হিস্টোরি (Payout Records)
                  </h3>

                  {withdrawalsList.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      এখনো কোনো উইথড্রল আবেদন করা হয়নি।
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">আইডি</th>
                            <th className="py-2.5 px-3 font-semibold">তারিখ</th>
                            <th className="py-2.5 px-3 font-semibold">টাকার পরিমাণ</th>
                            <th className="py-2.5 px-3 font-semibold">মেথড ও নম্বর</th>
                            <th className="py-2.5 px-3 font-semibold">স্ট্যাটাস</th>
                            <th className="py-2.5 px-3 font-semibold">TrxID / নোট</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {withdrawalsList.map((w) => (
                            <tr key={w.id}>
                              <td className="py-2.5 px-3 font-mono text-slate-500">{w.id}</td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {new Date(w.createdAt).toLocaleDateString('bn-BD')}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">৳{w.amount}</td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold uppercase">{w.payoutMethod}</span>: {w.payoutNumber}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    w.status === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : w.status === 'PENDING'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {w.status === 'PAID' ? 'পরিশোধিত' : w.status === 'PENDING' ? 'প্রক্রিয়াধীন' : 'বাতিল'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                {w.txId || w.adminNotes || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Interactive Profit Calculator Modal */}
      {calcProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative border border-slate-100" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCalcProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{calcProduct.banglaName || calcProduct.name}</h3>
                <p className="text-[11px] text-slate-500">বাংলা প্রফিট ক্যালকুলেটর</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">পাইকারি খরচ (Cost Price):</span>
                <span className="font-bold text-slate-900">৳{calcProduct.resellerPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">প্রস্তাবিত খুচরা মূল্য:</span>
                <span className="font-semibold text-slate-700">৳{calcProduct.shopPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">সর্বোচ্চ বিক্রয় সীমা:</span>
                <span className="font-semibold text-slate-700">৳{calcProduct.resellerMaxPrice || Math.round(calcProduct.resellerPrice * 1.6)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  আপনার বিক্রয় মূল্য (প্রতি পিস ৳):
                </label>
                <input
                  type="number"
                  min={calcProduct.resellerPrice}
                  max={calcProduct.resellerMaxPrice || Math.round(calcProduct.resellerPrice * 1.6)}
                  value={calcSellingPrice}
                  onChange={(e) => setCalcSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অর্ডারের পরিমাণ (Quantity):
                </label>
                <input
                  type="number"
                  min={1}
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
            </div>

            {/* Calculated Gross Profit Result */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center mb-4">
              <div className="text-xs text-emerald-700 font-semibold">আপনার মোট নিট মুনাফা (Gross Profit):</div>
              <div className="text-2xl font-black text-emerald-800 mt-0.5">
                ৳{(calcSellingPrice - calcProduct.resellerPrice) * calcQuantity}
              </div>
              <p className="text-[10px] text-emerald-600 mt-1">
                (বিক্রয় মূল্য ৳{calcSellingPrice} - পাইকারি মূল্য ৳{calcProduct.resellerPrice}) × {calcQuantity} পিস
              </p>
            </div>

            <button
              onClick={() => prepareOrderFromProduct(calcProduct, calcSellingPrice, calcQuantity)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition cursor-pointer"
            >
              এই মূল্য দিয়ে সরাসরি অর্ডার করুন
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {isApproved && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`p-2 flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'catalog' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px]">{lang === 'bn' ? 'ক্যাটালগ' : 'Catalog'}</span>
          </button>

          <button
            onClick={() => setActiveTab('new-order')}
            className={`p-2 flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'new-order' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-[10px]">{lang === 'bn' ? 'অর্ডার' : 'Order'}</span>
          </button>

          <button
            onClick={() => setActiveTab('my-orders')}
            className={`p-2 flex flex-col items-center gap-0.5 cursor-pointer relative ${
              activeTab === 'my-orders' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px]">{lang === 'bn' ? 'ট্র্যাকিং' : 'Tracking'}</span>
            {resellerOrders.length > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`p-2 flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'referrals' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px]">{lang === 'bn' ? 'রেফারেল' : 'Referral'}</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`p-2 flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'wallet' ? 'text-emerald-600 font-bold' : 'text-slate-400'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span className="text-[10px]">{lang === 'bn' ? 'ওয়ালেট' : 'Wallet'}</span>
          </button>
        </nav>
      )}
    </div>
  );
};
