import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MapPin, 
  ShieldCheck 
} from 'lucide-react';
import { api } from '../api.js';

interface OrderTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
  lang: 'bn' | 'en';
}

export const OrderTrackModal: React.FC<OrderTrackModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = '',
  lang,
}) => {
  // All hooks declared unconditionally at top
  const [orderId, setOrderId] = useState(initialOrderId);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId);
      if (isOpen) {
        fetchTrack(initialOrderId);
      }
    }
  }, [initialOrderId, isOpen]);

  // Early return strictly AFTER all hooks
  if (!isOpen) return null;

  const fetchTrack = async (searchId: string) => {
    if (!searchId.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.trackOrder(searchId.trim(), phone.trim() || undefined);
      setOrderData(data);
    } catch (err: any) {
      setError(err.message || 'Order not found');
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrack(orderId);
  };

  const stages = [
    { key: 'PENDING', labelBn: 'অর্ডার গৃহীত', labelEn: 'Order Placed', descBn: 'অর্ডারটি সিস্টেমে জমা হয়েছে' },
    { key: 'PAYMENT_VERIFIED', labelBn: 'পেমেন্ট ও তথ্য যাচাই', labelEn: 'Verified', descBn: 'অগ্রিম চার্জ ও অর্ডার তথ্য যাচাইকৃত' },
    { key: 'CONFIRMED', labelBn: 'কনফার্ম ও প্যাকেজিং', labelEn: 'Confirmed & Packing', descBn: 'পণ্য কোয়ালিটি চেক ও প্যাকিং সম্পন্ন' },
    { key: 'SHIPPED', labelBn: 'কুরিয়ারে অন-রোড', labelEn: 'Handed to Courier', descBn: 'ডেলিভারির জন্য কুরিয়ারে পাঠানো হয়েছে' },
    { key: 'DELIVERED', labelBn: 'সফল ডেলিভারি', labelEn: 'Delivered', descBn: 'গ্রাহক পণ্যটি হাতে পেয়েছেন' },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'PAYMENT_VERIFIED':
        return 1;
      case 'CONFIRMED':
      case 'PROCESSING':
        return 2;
      case 'SHIPPED':
        return 3;
      case 'DELIVERED':
        return 4;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentStage = orderData ? getStageIndex(orderData.orderStatus) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto relative animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {lang === 'bn' ? 'অর্ডার ট্র্যাকিং সিস্টেম' : 'Live Order Tracking'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'আপনার অর্ডার নম্বর দিয়ে বর্তমান অবস্থান জানুন' : 'Check status with your Order ID'}
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

        <div className="p-4 sm:p-6 space-y-5">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder={lang === 'bn' ? 'অর্ডার আইডি দিন (যেমন: NS-2610-101)' : 'Enter Order ID (e.g. NS-2610-101)'}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-teal-600 outline-hidden font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="clay-btn-primary px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{lang === 'bn' ? 'ট্র্যাক' : 'Track'}</span>
            </button>
          </form>

          {loading && (
            <div className="text-center py-8 text-slate-500 text-xs flex flex-col items-center gap-2">
              <Clock className="w-6 h-6 animate-spin text-teal-600" />
              <span>{lang === 'bn' ? 'অর্ডারের তথ্য খোঁজা হচ্ছে...' : 'Fetching tracking info...'}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {orderData && (
            <div className="space-y-5 animate-in fade-in">
              {/* Order Banner */}
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                    {lang === 'bn' ? 'অর্ডার নম্বর:' : 'Order ID:'}
                  </span>
                  <span className="text-base font-extrabold text-teal-950 font-mono">
                    {orderData.id}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">
                    {lang === 'bn' ? 'অর্ডারের তারিখ' : 'Date Placed'}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {new Date(orderData.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              {orderData.orderStatus === 'CANCELLED' ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <p className="text-sm font-bold text-rose-800">
                    {lang === 'bn' ? 'এই অর্ডারটি বাতিল (Cancelled) করা হয়েছে।' : 'This order has been cancelled.'}
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  <div className="space-y-4">
                    {stages.map((stage, idx) => {
                      const isCompleted = idx <= currentStage;
                      const isCurrent = idx === currentStage;

                      return (
                        <div key={stage.key} className="flex items-start gap-3 relative">
                          {idx < stages.length - 1 && (
                            <div
                              className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-4 ${
                                idx < currentStage ? 'bg-teal-600' : 'bg-slate-200'
                              }`}
                            />
                          )}

                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs ${
                              isCompleted
                                ? 'bg-teal-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 border border-slate-300'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>

                          <div className="flex-1 pb-1">
                            <div className="flex items-center justify-between">
                              <h4
                                className={`text-xs sm:text-sm font-bold ${
                                  isCompleted ? 'text-slate-900' : 'text-slate-400'
                                }`}
                              >
                                {lang === 'bn' ? stage.labelBn : stage.labelEn}
                              </h4>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 animate-pulse">
                                  {lang === 'bn' ? 'বর্তমান ধাপ' : 'Active Stage'}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {stage.descBn}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reseller advance payment verification note if applicable */}
              {orderData.resellerAdvanceStatus && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">
                    {lang === 'bn' ? 'রিসেলার অগ্রিম ডেলিভারি চার্জ যাচাই:' : 'Reseller Advance Payment Status:'}
                  </span>{' '}
                  <span className="font-extrabold uppercase">
                    {orderData.resellerAdvanceStatus}
                  </span>
                </div>
              )}

              {/* Order Info Breakdown */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-xs space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>{lang === 'bn' ? 'গ্রাহক:' : 'Customer:'}</span>
                  <span className="font-semibold text-slate-900">{orderData.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>{lang === 'bn' ? 'ডেলিভারি এলাকা:' : 'Delivery Location:'}</span>
                  <span className="font-semibold text-slate-900">{orderData.deliveryZoneName}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>{lang === 'bn' ? 'সর্বমোট পরিশোধযোগ্য:' : 'Total Payable:'}</span>
                  <span className="font-extrabold text-teal-800 text-sm">৳{orderData.totalAmount?.toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="font-bold text-[11px] text-slate-500 uppercase">
                    {lang === 'bn' ? 'অর্ডারের পণ্যসমূহ:' : 'Ordered Items:'}
                  </span>
                  {orderData.items?.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-slate-600">
                      <span>• {lang === 'bn' ? (it.productBanglaName || it.productName) : it.productName}</span>
                      <span className="font-semibold">× {it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
