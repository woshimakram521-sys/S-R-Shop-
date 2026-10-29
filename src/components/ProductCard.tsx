import React from 'react';
import { ShoppingCart, Zap, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Product } from '../types.js';

interface ProductCardProps {
  product: Product;
  lang: 'bn' | 'en';
  isReseller?: boolean;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onDirectOrder: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lang,
  isReseller = false,
  onSelect,
  onAddToCart,
  onDirectOrder,
}) => {
  const discountPercent = product.regularPrice > product.shopPrice
    ? Math.round(((product.regularPrice - product.shopPrice) / product.regularPrice) * 100)
    : 0;

  const resellerProfit = isReseller && product.resellerPrice
    ? product.shopPrice - product.resellerPrice
    : 0;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock <= 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="clay-card group cursor-pointer overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl bg-white"
    >
      <div>
        {/* Image Container with Badges */}
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100 rounded-t-[1.2rem]">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
              {lang === 'bn' ? `${discountPercent}% ছাড়` : `${discountPercent}% OFF`}
            </div>
          )}

          {/* Stock Status Badge */}
          {isOutOfStock ? (
            <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-rose-300 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}</span>
            </div>
          ) : isLowStock ? (
            <div className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-xs">
              {lang === 'bn' ? `মাত্র ${product.stock} টি বাকি` : `Only ${product.stock} left`}
            </div>
          ) : (
            <div className="absolute top-2.5 right-2.5 bg-emerald-600/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs">
              {lang === 'bn' ? 'ইন স্টক' : 'In Stock'}
            </div>
          )}

          {/* Reseller Wholesale Badge if logged in as reseller */}
          {isReseller && product.resellerPrice && (
            <div className="absolute bottom-2 left-2 right-2 bg-amber-500/95 backdrop-blur-xs text-slate-950 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center justify-between shadow-md">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-slate-950" />
                {lang === 'bn' ? 'রিসেলার রেট:' : 'Reseller Cost:'}
              </span>
              <span>৳{product.resellerPrice.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4">
          {/* Category unboxed breadcrumb (no pills, strictly following design rules) */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase tracking-wider font-medium mb-1">
            <span>{product.category.replace('-', ' ')}</span>
            <span aria-hidden="true">·</span>
            <span>SKU: {product.sku}</span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
            {lang === 'bn' ? (product.banglaName || product.name) : product.name}
          </h3>

          {/* Bengali Subtitle / Spec if in English view */}
          {lang === 'en' && product.banglaName && (
            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-sans">
              {product.banglaName}
            </p>
          )}

          {/* Price Layout */}
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-black text-red-600">
              ৳{product.shopPrice.toLocaleString()}
            </span>
            {product.regularPrice > product.shopPrice && (
              <span className="text-xs text-slate-400 line-through">
                ৳{product.regularPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Reseller Estimated Profit Highlight */}
          {isReseller && resellerProfit > 0 && (
            <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 inline" />
              {lang === 'bn' 
                ? `প্রস্তাবিত লাভ: ৳${resellerProfit.toLocaleString()}` 
                : `Est. Profit: ৳${resellerProfit.toLocaleString()}`}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-3.5 sm:p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={(e) => onAddToCart(product, e)}
          disabled={isOutOfStock}
          className="w-full py-2 px-2.5 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-700 hover:bg-rose-100 disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-rose-600" />
          <span>{lang === 'bn' ? 'কার্ট' : 'Cart'}</span>
        </button>

        <button
          onClick={(e) => onDirectOrder(product, e)}
          disabled={isOutOfStock}
          className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-rose-600/20 disabled:opacity-50 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
          <span>{lang === 'bn' ? 'অর্ডার' : 'Order'}</span>
        </button>
      </div>
    </div>
  );
};
