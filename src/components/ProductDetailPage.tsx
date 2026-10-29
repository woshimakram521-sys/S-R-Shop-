import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  ShoppingBag, 
  Check, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Star, 
  Layers, 
  Package, 
  Sparkles,
  ChevronRight,
  Heart
} from 'lucide-react';
import type { Product, StoreSettings } from '../types.js';
import { ProductCard } from './ProductCard.js';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  settings: StoreSettings | null;
  lang: 'bn' | 'en';
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, selectedVariants?: Record<string, string>) => void;
  onDirectOrder: (product: Product, quantity: number, selectedVariants?: Record<string, string>) => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductDetailPage({
  product,
  allProducts,
  settings,
  lang,
  onBack,
  onAddToCart,
  onDirectOrder,
  onSelectProduct,
}: ProductDetailPageProps) {
  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (product.variants) {
      product.variants.forEach((v) => {
        if (v.options && v.options.length > 0) {
          init[v.name] = v.options[0];
        }
      });
    }
    return init;
  });

  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const discountPercent = product.regularPrice > product.shopPrice
    ? Math.round(((product.regularPrice - product.shopPrice) / product.regularPrice) * 100)
    : 0;

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const fallbackRelated = relatedProducts.length > 0
    ? relatedProducts
    : allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/#product-${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} - NOVA SHOP-এ অর্ডার করুন মাত্র ৳${product.shopPrice}`,
          url: shareUrl,
        });
      } catch (err) {
        // Fallback to clipboard
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddToCartClick = () => {
    onAddToCart(product, quantity, selectedVariants);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const handleDirectOrderClick = () => {
    onDirectOrder(product, quantity, selectedVariants);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-16 pt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb & Back Bar */}
        <div className="flex items-center justify-between py-3 mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-100 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-teal-700" />
            <span>{lang === 'bn' ? 'হোমে ফিরে যান' : 'Back to Store'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition shadow-sm"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 text-xs font-semibold">
                    {lang === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!'}
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>{lang === 'bn' ? 'শেয়ার করুন' : 'Share'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Product Details Hero Card (Claymorphic / Soft 3D) */}
        <div className="bg-white rounded-3xl p-5 md:p-8 border border-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.04)] mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column: Image Gallery */}
            <div className="lg:col-span-6 space-y-4">
              {/* Main Preview Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-inner group">
                <img
                  src={images[activeImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback gracefully without breaking
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80';
                  }}
                />

                {discountPercent > 0 && (
                  <span className="absolute top-4 left-4 bg-rose-600 text-white font-bold text-xs sm:text-sm px-3 py-1 rounded-full shadow-md">
                    {discountPercent}% {lang === 'bn' ? 'ছাড়' : 'OFF'}
                  </span>
                )}

                {product.stock <= 5 && product.stock > 0 && (
                  <span className="absolute top-4 right-4 bg-amber-500 text-white font-semibold text-xs px-2.5 py-1 rounded-full shadow-sm">
                    {lang === 'bn' ? `স্টক সীমিত: মাত্র ${product.stock} টি` : `Low Stock: ${product.stock}`}
                  </span>
                )}
                {product.stock === 0 && (
                  <span className="absolute top-4 right-4 bg-slate-800 text-white font-semibold text-xs px-2.5 py-1 rounded-full shadow-sm">
                    {lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
                  </span>
                )}
              </div>

              {/* Multiple Images Thumbnail Carousel */}
              {images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition ${
                        activeImageIndex === idx
                          ? 'border-teal-600 ring-2 ring-teal-600/30 shadow-md scale-95'
                          : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <Truck className="w-5 h-5 text-teal-600 mx-auto mb-1.5" />
                  <p className="text-[11px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'সারাদেশে হোম ডেলিভারি' : 'Nationwide Delivery'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <RotateCcw className="w-5 h-5 text-teal-600 mx-auto mb-1.5" />
                  <p className="text-[11px] font-semibold text-slate-700">
                    {lang === 'bn' ? 'সহজ রিটার্ন পলিসি' : 'Easy Returns'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-teal-600 mx-auto mb-1.5" />
                  <p className="text-[11px] font-semibold text-slate-700">
                    {lang === 'bn' ? '১০০% আসল পণ্য' : 'Genuine Product'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Product Information & Controls */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Category & SKU */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
                    {product.category}
                  </span>
                  <span>SKU: <strong className="font-mono text-slate-700">{product.sku}</strong></span>
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                    {lang === 'bn' && product.banglaName ? product.banglaName : product.name}
                  </h1>
                  {product.banglaName && lang !== 'bn' && (
                    <p className="text-sm text-slate-500 mt-1">{product.banglaName}</p>
                  )}
                </div>

                {/* 3-Tier Price Display */}
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100/80 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-teal-700">
                    ৳{product.shopPrice}
                  </span>
                  {product.regularPrice > product.shopPrice && (
                    <span className="text-lg line-through text-slate-400 font-medium">
                      ৳{product.regularPrice}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                      {lang === 'bn' ? `সাশ্রয় ৳${product.regularPrice - product.shopPrice}` : `Save ৳${product.regularPrice - product.shopPrice}`}
                    </span>
                  )}
                </div>

                {/* Variants Selection (e.g. Size, Color) */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-4 pt-2">
                    {product.variants.map((v) => (
                      <div key={v.id || v.name} className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>{v.name}:</span>
                          <span className="text-teal-700 font-medium normal-case">
                            {selectedVariants[v.name] || 'Select'}
                          </span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {v.options.map((opt) => {
                            const isSelected = selectedVariants[v.name] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [v.name]: opt,
                                  }))
                                }
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                                  isSelected
                                    ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-600/30 scale-102'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
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

                {/* Quantity Controls */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    {lang === 'bn' ? 'পরিমাণ (Quantity):' : 'Quantity:'}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-slate-800 text-base">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                        disabled={quantity >= product.stock}
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs text-slate-500 font-medium">
                      {lang === 'bn'
                        ? `মোট মূল্য: ৳${product.shopPrice * quantity}`
                        : `Subtotal: ৳${product.shopPrice * quantity}`}
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Direct Order & Add to Cart */}
                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleDirectOrderClick}
                    disabled={product.stock === 0}
                    className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-lg shadow-teal-600/20 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{lang === 'bn' ? 'এখনই অর্ডার করুন' : 'Order Now'}</span>
                  </button>

                  <button
                    onClick={handleAddToCartClick}
                    disabled={product.stock === 0}
                    className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base border-2 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      addedAnimation
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white hover:bg-teal-50 text-teal-700 border-teal-600 shadow-sm active:scale-98'
                    }`}
                  >
                    {addedAnimation ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>{lang === 'bn' ? 'কার্টে যোগ করা হয়েছে!' : 'Added to Cart!'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-teal-600" />
                        <span>{lang === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Delivery Information Note */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-teal-600" />
                    <span>{lang === 'bn' ? 'ডেলিভারি চার্জ:' : 'Delivery Charge:'}</span>
                  </p>
                  <p>
                    {lang === 'bn'
                      ? 'ঢাকার ভিতরে ৳৭০ | ঢাকা সংলগ্ন এলাকা ৳১০০ | ঢাকার বাইরে ৳১৩০ (ক্যাশ অন ডেলিভারি প্রযোজ্য)'
                      : 'Inside Dhaka ৳70 | Suburbs ৳100 | Outside Dhaka ৳130 (Cash on Delivery available)'}
                  </p>
                </div>
              </div>

              {/* Product Full Description */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-teal-700" />
                  <span>{lang === 'bn' ? 'পণ্যের পূর্ণ বিবরণ' : 'Product Description'}</span>
                </h3>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                  {lang === 'bn' && product.banglaDescription
                    ? product.banglaDescription
                    : product.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {fallbackRelated.length > 0 && (
          <div className="mt-12 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {lang === 'bn' ? 'সম্পর্কিত অন্যান্য পণ্য' : 'Related Products'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'bn' ? 'এই ক্যাটাগরির আরও চমৎকার সব কালেকশন' : 'More picks from this category'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {fallbackRelated.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  lang={lang}
                  onSelect={(selected) => {
                    onSelectProduct(selected);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onAddToCart={(item) => onAddToCart(item, 1)}
                  onDirectOrder={(item) => onDirectOrder(item, 1)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
