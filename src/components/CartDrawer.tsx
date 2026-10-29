import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import type { DeliveryZone, Product } from '../types.js';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants: Record<string, string>;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onProceedCheckout: () => void;
  deliveryZones: DeliveryZone[];
  selectedZoneId: string;
  onSelectZoneId: (id: string) => void;
  lang: 'bn' | 'en';
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
  deliveryZones,
  selectedZoneId,
  onSelectZoneId,
  lang,
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.shopPrice * item.quantity,
    0
  );

  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId) || deliveryZones[0];
  const deliveryCharge = selectedZone ? selectedZone.charge : 70;
  const grandTotal = subtotal + (cartItems.length > 0 ? deliveryCharge : 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                {lang === 'bn' ? 'শপিং ব্যাগ' : 'Shopping Cart'}
              </h2>
              <span className="text-xs text-slate-500">
                {lang === 'bn' ? `${cartItems.length} টি পণ্য` : `${cartItems.length} items`}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body - Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
              <ShoppingBag className="w-16 h-16 text-slate-200 mb-3 stroke-1" />
              <p className="font-semibold text-slate-700 text-sm">
                {lang === 'bn' ? 'আপনার শপিং ব্যাগটি খালি' : 'Your cart is empty'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {lang === 'bn'
                  ? 'আমাদের প্রিমিয়াম কালেকশন থেকে পছন্দসই পণ্য যোগ করুন।'
                  : 'Explore our catalog and add premium products to your cart.'}
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 rounded-xl bg-teal-50 text-teal-700 font-semibold text-xs border border-teal-200 hover:bg-teal-100 transition cursor-pointer"
              >
                {lang === 'bn' ? 'কেনাকাটা শুরু করুন' : 'Start Shopping'}
              </button>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={`${item.product.id}-${idx}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                  <img
                    src={item.product.images[0] || ''}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {lang === 'bn' ? (item.product.banglaName || item.product.name) : item.product.name}
                  </h4>

                  {/* Variant info */}
                  {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5 text-[11px] text-slate-500">
                      {Object.entries(item.selectedVariants).map(([k, v]) => (
                        <span key={k} className="bg-slate-200/70 px-1.5 py-0.2 rounded text-[10px]">
                          {k}: {v}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-extrabold text-teal-900 text-sm">
                      ৳{(item.product.shopPrice * item.quantity).toLocaleString()}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white text-xs">
                      <button
                        onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                        className="px-2 py-0.5 hover:bg-slate-100 text-slate-600 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() =>
                          onUpdateQuantity(idx, Math.min(item.product.stock || 99, item.quantity + 1))
                        }
                        className="px-2 py-0.5 hover:bg-slate-100 text-slate-600 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onRemoveItem(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer - Calculations & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/90 space-y-3">
            {/* Delivery Zone Selector */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-teal-600" />
                {lang === 'bn' ? 'ডেলিভারি এলাকা নির্বাচন করুন:' : 'Delivery Location:'}
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => onSelectZoneId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 outline-hidden focus:border-teal-600 cursor-pointer"
              >
                {deliveryZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {lang === 'bn' ? z.banglaName : z.name} - ৳{z.charge} ({lang === 'bn' ? z.banglaEstimatedDays : z.estimatedDays})
                  </option>
                ))}
              </select>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>{lang === 'bn' ? 'পণ্যের মোট মূল্য (সাবটোটাল):' : 'Subtotal:'}</span>
                <span className="font-semibold text-slate-800">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'bn' ? 'হোম ডেলিভারি চার্জ:' : 'Delivery Charge:'}</span>
                <span className="font-semibold text-teal-700">+ ৳{deliveryCharge}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>{lang === 'bn' ? 'সর্বমোট প্রদেয়:' : 'Grand Total:'}</span>
                <span className="text-teal-900">৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                onClose();
                onProceedCheckout();
              }}
              className="clay-btn-primary w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>{lang === 'bn' ? 'অর্ডার সম্পন্ন করুন' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
