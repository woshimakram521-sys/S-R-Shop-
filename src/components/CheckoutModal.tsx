import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle, 
  Truck, 
  Copy, 
  Check, 
  Printer, 
  PackageCheck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { CartItem } from './CartDrawer.js';
import type { DeliveryZone, Order, StoreSettings } from '../types.js';
import { api } from '../api.js';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  deliveryZones: DeliveryZone[];
  selectedZoneId: string;
  settings: StoreSettings | null;
  lang: 'bn' | 'en';
  onOrderSuccess: (order: Order) => void;
  onTrackOrder: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  deliveryZones,
  selectedZoneId: initialZoneId,
  settings,
  lang,
  onOrderSuccess,
  onTrackOrder,
}) => {
  // All hooks must be called unconditionally at top of component
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [zoneId, setZoneId] = useState(initialZoneId || (deliveryZones[0]?.id ?? 'zone-1'));
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'rocket'>('cod');
  const [senderPhone, setSenderPhone] = useState('');
  const [txId, setTxId] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedPaymentNumber, setCopiedPaymentNumber] = useState(false);

  useEffect(() => {
    if (initialZoneId) {
      setZoneId(initialZoneId);
    }
  }, [initialZoneId]);

  // Early return strictly AFTER all hooks
  if (!isOpen) return null;

  const selectedZone = deliveryZones.find((z) => z.id === zoneId) || deliveryZones[0];
  const deliveryCharge = selectedZone ? selectedZone.charge : 70;
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.shopPrice * item.quantity, 0);
  const grandTotal = subtotal + deliveryCharge;

  const handleCopyPaymentNumber = (num: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedPaymentNumber(true);
      setTimeout(() => setCopiedPaymentNumber(false), 2000);
    }
  };

  const handleCopyOrderId = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    if (!customerName.trim()) {
      setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম লিখুন।' : 'Please enter your name.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।'
          : 'Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).'
      );
      return;
    }

    if (!customerAddress.trim() || customerAddress.trim().length < 8) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে পূর্ণাঙ্গ ঠিকানা প্রদান করুন (বাসা নং, রোড, এলাকা/থানা, জেলা)।'
          : 'Please provide full delivery address (House/Road, Area, District).'
      );
      return;
    }

    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !txId.trim()) {
      setErrorMessage(
        lang === 'bn'
          ? 'অনুগ্রহ করে আপনার পেমেন্টের Transaction ID (TrxID) লিখুন।'
          : 'Please enter the transaction ID (TrxID) for verification.'
      );
      return;
    }

    try {
      setLoading(true);
      const order = await api.createCustomerOrder({
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerAddress: customerAddress.trim(),
        deliveryZoneId: zoneId,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedVariants: item.selectedVariants,
        })),
        paymentMethod,
        customerTxId: txId.trim() || undefined,
        customerSenderPhone: senderPhone.trim() || cleanPhone,
        notes: notes.trim() || undefined,
      });

      setConfirmedOrder(order);
      onOrderSuccess(order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto relative animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                {confirmedOrder
                  ? (lang === 'bn' ? 'অর্ডার সফলভাবে গৃহীত হয়েছে!' : 'Order Placed Successfully!')
                  : (lang === 'bn' ? 'অর্ডার ফর্ম ও দ্রুত চেকআউট' : 'Order Checkout')}
              </h2>
              <p className="text-xs text-slate-500">
                {confirmedOrder
                  ? (lang === 'bn' ? 'আপনার অর্ডার নিশ্চিত করা হয়েছে' : 'Thank you for shopping with Nova Shop')
                  : (lang === 'bn' ? 'লগইন বা রেজিস্ট্রেশন ছাড়াই সরাসরি অর্ডার করুন' : 'Guest checkout - No account required')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          {/* SUCCESS SCREEN */}
          {confirmedOrder ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {lang === 'bn' ? 'ধন্যবাদ! আপনার অর্ডারটি নিশ্চিত হয়েছে' : 'Thank You! Order Confirmed'}
                </h3>
                <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                  {lang === 'bn'
                    ? 'আমাদের কাস্টমার কেয়ার টিম দ্রুত আপনার সাথে ফোনে যোগাযোগ করে পার্সেলটি পাঠিয়ে দেবে।'
                    : 'Our team will contact you shortly to confirm the shipment.'}
                </p>
              </div>

              {/* Order ID Box */}
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 max-w-md mx-auto flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                    {lang === 'bn' ? 'অর্ডার ট্র্যাকিং আইডি:' : 'Order Tracking ID:'}
                  </span>
                  <span className="text-lg font-mono font-extrabold text-teal-950">
                    {confirmedOrder.id}
                  </span>
                </div>

                <button
                  onClick={() => handleCopyOrderId(confirmedOrder.id)}
                  className="px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-semibold text-teal-800 hover:bg-teal-100 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedOrderId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'আইডি কপি' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Order Details Receipt Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-w-md mx-auto text-left text-xs text-slate-700">
                <div className="bg-slate-50 p-3 font-bold border-b border-slate-200 flex justify-between">
                  <span>{lang === 'bn' ? 'অর্ডার সারাংশ' : 'Order Summary'}</span>
                  <span>৳{confirmedOrder.totalAmount.toLocaleString()}</span>
                </div>
                <div className="p-3 space-y-2">
                  <p><strong className="text-slate-900">{lang === 'bn' ? 'গ্রাহক:' : 'Customer:'}</strong> {confirmedOrder.customerName} ({confirmedOrder.customerPhone})</p>
                  <p><strong className="text-slate-900">{lang === 'bn' ? 'ঠিকানা:' : 'Address:'}</strong> {confirmedOrder.customerAddress}</p>
                  <p><strong className="text-slate-900">{lang === 'bn' ? 'পেমেন্ট মেথড:' : 'Payment:'}</strong> {confirmedOrder.paymentMethod.toUpperCase()}</p>
                  <p><strong className="text-slate-900">{lang === 'bn' ? 'ডেলিভারি এলাকা:' : 'Zone:'}</strong> {confirmedOrder.deliveryZoneName} (৳{confirmedOrder.deliveryCharge})</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onTrackOrder(confirmedOrder.id);
                  }}
                  className="clay-btn-primary w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'অর্ডার ট্র্যাক করুন' : 'Track Order Status'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ইনভয়েস প্রিন্ট' : 'Print Invoice'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM */
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Customer Info */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px]">১</span>
                  {lang === 'bn' ? 'কাস্টমার ও ডেলিভারি তথ্য' : 'Customer & Delivery Info'}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {lang === 'bn' ? 'আপনার নাম *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={lang === 'bn' ? 'যেমন: মাহামুদুল হাসান' : 'e.g. John Doe'}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      {lang === 'bn' ? 'মোবাইল নম্বর (১১ ডিজিট) *' : 'Mobile Phone (11 digits) *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'bn' ? 'পূর্ণাঙ্গ ডেলিভারি ঠিকানা *' : 'Full Delivery Address *'}
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'বাসা/হোল্ডিং নং, রোড, পোস্ট অফিস, থানা, জেলা...'
                        : 'House #, Road #, Area, Police Station, District...'
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden transition"
                  />
                </div>

                {/* Delivery Zone Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'bn' ? 'ডেলিভারি লোকেশন সিলেক্ট করুন *' : 'Delivery Zone *'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {deliveryZones.map((z) => {
                      const isSelected = zoneId === z.id;
                      return (
                        <button
                          type="button"
                          key={z.id}
                          onClick={() => setZoneId(z.id)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-teal-700 bg-teal-50/70 ring-1 ring-teal-700'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900">
                            {lang === 'bn' ? z.banglaName : z.name}
                          </p>
                          <p className="text-[11px] text-teal-800 font-extrabold mt-0.5">
                            ৳{z.charge}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {lang === 'bn' ? z.banglaEstimatedDays : z.estimatedDays}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Method */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px]">২</span>
                  {lang === 'bn' ? 'মূল্য পরিশোধের পদ্ধতি (Payment Method)' : 'Payment Method'}
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      paymentMethod === 'cod'
                        ? 'border-teal-700 bg-teal-50 ring-1 ring-teal-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Truck className="w-5 h-5 mx-auto text-teal-700 mb-1" />
                    <p className="text-xs font-bold text-slate-900">
                      {lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {lang === 'bn' ? 'পণ্য দেখে টাকা দিন' : 'Pay when received'}
                    </p>
                  </button>

                  {/* bKash */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bkash')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      paymentMethod === 'bkash'
                        ? 'border-pink-600 bg-pink-50 ring-1 ring-pink-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-5 h-5 mx-auto bg-pink-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mb-1">
                      b
                    </div>
                    <p className="text-xs font-bold text-pink-700">bKash (বিকাশ)</p>
                    <p className="text-[10px] text-slate-500">
                      {lang === 'bn' ? 'পেমেন্ট / সেন্ড মানি' : 'Instant Pay'}
                    </p>
                  </button>

                  {/* Nagad */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nagad')}
                    className={`p-3 rounded-xl border text-center transition cursor-pointer ${
                      paymentMethod === 'nagad'
                        ? 'border-orange-600 bg-orange-50 ring-1 ring-orange-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-5 h-5 mx-auto bg-orange-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mb-1">
                      N
                    </div>
                    <p className="text-xs font-bold text-orange-700">Nagad (নগদ)</p>
                    <p className="text-[10px] text-slate-500">
                      {lang === 'bn' ? 'সেন্ড মানি' : 'Instant Pay'}
                    </p>
                  </button>
                </div>

                {/* bKash Payment Instructions & TrxID */}
                {paymentMethod === 'bkash' && (
                  <div className="p-3.5 rounded-xl bg-pink-50/70 border border-pink-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-pink-900">
                        {settings?.bkashType || 'বিকাশ মার্চেন্ট অ্যাকাউন্ট'}:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-pink-950 text-sm">
                          {settings?.bkashNumber || '01712345678'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPaymentNumber(settings?.bkashNumber || '01712345678')}
                          className="p-1 hover:bg-pink-100 rounded text-pink-700 cursor-pointer"
                          title="Copy Number"
                        >
                          {copiedPaymentNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {settings?.bkashInstructions ||
                        'বিকাশ অ্যাপে Payment অপশন বেছে নিন, নম্বরটি দিন ও মোট ৳' +
                          grandTotal.toLocaleString() +
                          ' পেমেন্ট করুন।'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        required
                        value={txId}
                        onChange={(e) => setTxId(e.target.value)}
                        placeholder="Transaction ID (TrxID) *"
                        className="w-full px-3 py-1.5 bg-white border border-pink-300 rounded-lg text-xs outline-hidden focus:border-pink-600"
                      />
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="Sender বিকাশ নম্বর"
                        className="w-full px-3 py-1.5 bg-white border border-pink-300 rounded-lg text-xs outline-hidden focus:border-pink-600"
                      />
                    </div>
                  </div>
                )}

                {/* Nagad Payment Instructions & TrxID */}
                {paymentMethod === 'nagad' && (
                  <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-orange-900">
                        {settings?.nagadType || 'নগদ পার্সোনাল অ্যাকাউন্ট'}:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-orange-950 text-sm">
                          {settings?.nagadNumber || '01812345678'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPaymentNumber(settings?.nagadNumber || '01812345678')}
                          className="p-1 hover:bg-orange-100 rounded text-orange-700 cursor-pointer"
                          title="Copy Number"
                        >
                          {copiedPaymentNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {settings?.nagadInstructions ||
                        'নগদ অ্যাপে গিয়ে Send Money অপশনে যান এবং ৳' +
                          grandTotal.toLocaleString() +
                          ' পাঠিয়ে দিন।'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        required
                        value={txId}
                        onChange={(e) => setTxId(e.target.value)}
                        placeholder="নগদ TrxID *"
                        className="w-full px-3 py-1.5 bg-white border border-orange-300 rounded-lg text-xs outline-hidden focus:border-orange-600"
                      />
                      <input
                        type="tel"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="Sender নগদ নম্বর"
                        className="w-full px-3 py-1.5 bg-white border border-orange-300 rounded-lg text-xs outline-hidden focus:border-orange-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Special Delivery Note */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {lang === 'bn' ? 'বিশেষ নির্দেশনা বা ডেলিভারি নোট (ঐচ্ছিক)' : 'Order Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: বিকেলে ডেলিভারি দিলে ভালো হয়' : 'Special requests...'}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white"
                />
              </div>

              {/* Calculation Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>{lang === 'bn' ? 'পণ্যসমূহ (' + cartItems.length + ' টি):' : 'Products (' + cartItems.length + '):'}</span>
                  <span className="font-semibold text-slate-900">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'bn' ? 'ডেলিভারি চার্জ (' + (selectedZone ? selectedZone.banglaName : '') + '):' : 'Delivery Charge:'}</span>
                  <span className="font-semibold text-teal-700">৳{deliveryCharge}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>{lang === 'bn' ? 'সর্বমোট পরিশোধযোগ্য:' : 'Total Payable:'}</span>
                  <span className="text-teal-900">৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="clay-btn-primary w-full py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>{lang === 'bn' ? 'অর্ডার প্রসেস হচ্ছে...' : 'Processing Order...'}</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-amber-300" />
                    <span>
                      {lang === 'bn'
                        ? 'অর্ডার নিশ্চিত করুন (৳' + grandTotal.toLocaleString() + ')'
                        : 'Confirm Order (৳' + grandTotal.toLocaleString() + ')'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
