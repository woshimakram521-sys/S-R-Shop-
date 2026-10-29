import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Zap, 
  Share2, 
  Check, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import type { Product } from '../types.js';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts: Product[];
  lang: 'bn' | 'en';
  isReseller?: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variants: Record<string, string>) => void;
  onDirectOrder: (product: Product, quantity: number, variants: Record<string, string>) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  allProducts,
  lang,
  isReseller = false,
  onClose,
  onAddToCart,
  onDirectOrder,
  onSelectProduct,
}) => {
  // All hooks MUST be declared unconditionally at the top of the component
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.images[0] || '');
      setQuantity(1);
      const initial: Record<string, string> = {};
      if (product.variants) {
        product.variants.forEach((v) => {
          if (v.options && v.options.length > 0) {
            initial[v.name] = v.options[0];
          }
        });
      }
      setSelectedVariants(initial);
    }
  }, [product]);

  // Early return strictly AFTER all hooks are called
  if (!product) return null;

  const discountPercent = product.regularPrice > product.shopPrice
    ? Math.round(((product.regularPrice - product.shopPrice) / product.regularPrice) * 100)
    : 0;

  const handleShare = () => {
    const url = `${window.location.origin}/?product=${product.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || p.isBestseller))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto relative animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="max-h-[90vh] overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Left: Image Gallery */}
            <div>
              <div className="aspect-4/3 sm:aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative">
                <img
                  src={selectedImage || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    {lang === 'bn' ? `${discountPercent}% ডিসকাউন্ট` : `${discountPercent}% OFF`}
                  </span>
                )}
              </div>

              {/* Thumbnail Selector */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                        (selectedImage || product.images[0]) === img
                          ? 'border-teal-600 ring-2 ring-teal-600/30'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="mt-6 grid grid-cols-3 gap-2 py-3 px-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center text-slate-700">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-medium leading-tight">
                    {lang === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 border-x border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-medium leading-tight">
                    {lang === 'bn' ? '১০০% অরিজিনাল' : '100% Genuine'}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RotateCcw className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] font-medium leading-tight">
                    {lang === 'bn' ? 'সহজ রিটার্ন পলিসি' : 'Easy Returns'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Product Details & Controls */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Category & SKU */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-wider font-semibold text-teal-700">
                      {product.category.replace('-', ' ')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>SKU: {product.sku}</span>
                  </div>

                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 text-slate-500 hover:text-teal-700 text-xs font-medium cursor-pointer"
                    title="Share product link"
                  >
                    {copiedShare ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">{lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {lang === 'bn' ? (product.banglaName || product.name) : product.name}
                </h1>

                {/* Price block */}
                <div className="mt-3 p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-teal-900">
                    ৳{product.shopPrice.toLocaleString()}
                  </span>
                  {product.regularPrice > product.shopPrice && (
                    <span className="text-sm text-slate-400 line-through">
                      ৳{product.regularPrice.toLocaleString()}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                      {lang === 'bn' ? `সাশ্রয় ৳${(product.regularPrice - product.shopPrice).toLocaleString()}` : `Save ৳${(product.regularPrice - product.shopPrice).toLocaleString()}`}
                    </span>
                  )}
                </div>

                {/* Reseller Info if viewing in reseller mode */}
                {isReseller && product.resellerPrice && (
                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-700 inline" />
                      {lang === 'bn' ? 'রিসেলার স্পেশাল রেট:' : 'Reseller Wholesale Rate:'} 
                      <span className="text-sm font-extrabold text-amber-900">৳{product.resellerPrice.toLocaleString()}</span>
                    </p>
                    <p className="text-amber-800 mt-1">
                      {lang === 'bn' 
                        ? `সাধারণ মূল্যে বিক্রি করলে আপনার লাভ হবে প্রতি পিসে ৳${(product.shopPrice - product.resellerPrice).toLocaleString()}!` 
                        : `Selling at retail earns you ৳${(product.shopPrice - product.resellerPrice).toLocaleString()} profit per unit!`}
                    </p>
                  </div>
                )}

                {/* Variants Selection */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {product.variants.map((v) => (
                      <div key={v.id}>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          {v.name}: <span className="text-teal-700 font-semibold">{selectedVariants[v.name] || 'Not chosen'}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt) => {
                            const isSelected = selectedVariants[v.name] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => setSelectedVariants({ ...selectedVariants, [v.name]: opt })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-teal-700 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stock indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs">
                  {product.stock > 0 ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {lang === 'bn' ? `স্টক প্রস্তুত (${product.stock} টি স্টকে বিদ্যমান)` : `In Stock (${product.stock} units available)`}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {lang === 'bn' ? 'পরিমাণ:' : 'Quantity:'}
                  </span>
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-sm font-extrabold text-slate-900 bg-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    {lang === 'bn' ? 'পণ্যের বিবরণ ও বৈশিষ্ট্য:' : 'Product Description:'}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {lang === 'bn' ? (product.banglaDescription || product.description) : product.description}
                  </p>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <button
                  onClick={() => onAddToCart(product, quantity, selectedVariants)}
                  disabled={product.stock <= 0}
                  className="w-full py-3 px-4 rounded-xl border-2 border-teal-700 text-teal-800 hover:bg-teal-50 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'কার্ট-এ যোগ করুন' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={() => onDirectOrder(product, quantity, selectedVariants)}
                  disabled={product.stock <= 0}
                  className="clay-btn-primary w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>{lang === 'bn' ? 'সরাসরি অর্ডার করুন' : 'Order Now'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 pt-6 border-t border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-4">
                {lang === 'bn' ? 'সম্পর্কিত অন্যান্য আকর্ষণীয় পণ্য' : 'Related Products You May Like'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectProduct(rel);
                      setSelectedImage(rel.images[0] || '');
                      setQuantity(1);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition cursor-pointer bg-slate-50/50"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2">
                      <img src={rel.images[0]} alt={rel.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {lang === 'bn' ? (rel.banglaName || rel.name) : rel.name}
                    </p>
                    <p className="text-xs font-bold text-teal-700 mt-1">
                      ৳{rel.shopPrice.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
