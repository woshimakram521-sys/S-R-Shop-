import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  X, 
  Sparkles, 
  AlertCircle, 
  ShoppingBag, 
  CheckCircle2, 
  RefreshCw,
  Search
} from 'lucide-react';
import type { Product } from '../types.js';
import { api } from '../api.js';

interface AiImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'bn' | 'en';
  onSelectProduct: (product: Product) => void;
}

export const AiImageSearchModal: React.FC<AiImageSearchModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSelectProduct,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectedItem, setDetectedItem] = useState<string>('');
  const [matches, setMatches] = useState<Array<{ product: Product; confidence: number; reason: string }>>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage(lang === 'bn' ? 'অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন।' : 'Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      executeSearch(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const executeSearch = async (dataUrl: string, mimeType: string) => {
    setLoading(true);
    setErrorMessage(null);
    setHasSearched(true);
    setMatches([]);
    setDetectedItem('');

    try {
      const res = await api.searchByImage(dataUrl, mimeType);
      setDetectedItem(res.detectedItem || '');
      setMatches(res.matches || []);
    } catch (err: any) {
      console.error('AI Image search failed:', err);
      setErrorMessage(
        err.message || (lang === 'bn' ? 'ছবি দিয়ে অনুসন্ধান ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Visual search failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSelectedImage(null);
    setMatches([]);
    setHasSearched(false);
    setErrorMessage(null);
    setDetectedItem('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/60 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {lang === 'bn' ? 'AI স্মার্ট ইমেজ সার্চ' : 'AI Visual Product Search'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'bn' ? 'ছবি তুলুন বা আপলোড করে ক্যাটালগের পণ্য খুঁজুন' : 'Take a photo or upload to find matching products'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* File Picker Row (if no image selected) */}
          {!selectedImage && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-teal-200 rounded-3xl p-6 sm:p-8 text-center bg-teal-50/30 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
                  {lang === 'bn' ? 'আপনার পছন্দের পণ্যের ছবি দিন' : 'Provide a photo of the product'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mb-5">
                  {lang === 'bn' 
                    ? 'পাঞ্জাবি, ঘড়ি, শাড়ি, ব্যাগ, গ্যাজেট বা যেকোনো পণ্যের ছবি দিলে AI সরাসরি নোভা শপের নিজস্ব ক্যাটালগ থেকে খুঁজে বের করবে।' 
                    : 'Upload any product image to instantly discover exact or visually similar items from our catalog.'}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
                  {/* Camera capture */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 active:scale-95 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'ক্যামেরা দিয়ে ছবি তুলুন' : 'Take Photo'}</span>
                  </button>

                  {/* Gallery upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <span>{lang === 'bn' ? 'গ্যালারি থেকে বেছে নিন' : 'Choose from Gallery'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Image Preview & Action Bar */}
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedImage}
                    alt="Search Target"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl border border-slate-200 shadow-xs"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      {lang === 'bn' ? 'আপনার আপলোডকৃত ছবি' : 'Uploaded Photo'}
                    </span>
                    {detectedItem && (
                      <span className="text-[11px] font-medium text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-full inline-block mt-1">
                        {lang === 'bn' ? `সনাক্তকৃত: ${detectedItem}` : `Detected: ${detectedItem}`}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={resetSearch}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs hover:bg-slate-100 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'নতুন ছবি দিন' : 'New Photo'}</span>
                </button>
              </div>

              {/* Scanning Loader */}
              {loading && (
                <div className="py-12 text-center space-y-3">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full border-4 border-teal-200 border-t-teal-700 animate-spin" />
                    <Sparkles className="w-6 h-6 text-amber-500 absolute" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 animate-pulse">
                    {lang === 'bn' ? 'AI নোভা শপের নিজস্ব ক্যাটালগ বিশ্লেষণ করছে...' : 'AI is searching NOVA SHOP catalog...'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {lang === 'bn' ? 'রঙ, প্যাটার্ন ও পণ্যের ফিচারের ওপর ভিত্তি করে মিল খোঁজা হচ্ছে' : 'Matching visual attributes, patterns, and categories'}
                  </p>
                </div>
              )}

              {/* Error State */}
              {errorMessage && !loading && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed font-medium">{errorMessage}</p>
                </div>
              )}

              {/* Empty Results State */}
              {hasSearched && !loading && !errorMessage && matches.length === 0 && (
                <div className="py-10 text-center space-y-3 bg-slate-50 rounded-3xl border border-slate-200/80 p-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {lang === 'bn' ? 'কোনো পণ্য মেলেনি' : 'No Matching Products Found'}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    {lang === 'bn'
                      ? 'দুঃখিত! আপনার ছবির সাথে মিল পাওয়া কোনো পণ্য আমাদের ক্যাটালগে পাওয়া যায়নি। অনুগ্রহ করে অন্য কোনো অ্যাঙ্গেল থেকে ছবি তুলুন অথবা নাম লিখে সাধারণ সার্চ ব্যবহার করুন।'
                      : 'Sorry, no matching product was found in our current store catalog for this photo. Try taking another picture from a different angle or use normal keyword search.'}
                  </p>
                  <button
                    onClick={resetSearch}
                    className="mt-2 px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-semibold shadow-xs hover:bg-teal-800 cursor-pointer"
                  >
                    {lang === 'bn' ? 'অন্য ছবি দিয়ে চেষ্টা করুন' : 'Try Another Image'}
                  </button>
                </div>
              )}

              {/* Matched Products Grid */}
              {!loading && matches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {lang === 'bn' 
                        ? `${matches.length}টি মিল পাওয়া পণ্য:` 
                        : `${matches.length} matching products found:`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matches.map(({ product, confidence, reason }) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          onSelectProduct(product);
                          onClose();
                        }}
                        className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 hover:shadow-md transition group cursor-pointer flex gap-3"
                      >
                        <img
                          src={product.images[0] || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=300'}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-xl border border-slate-100 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                                {confidence}% {lang === 'bn' ? 'মিল' : 'match'}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                ৳{product.shopPrice}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-teal-700 transition">
                              {lang === 'bn' ? (product.banglaName || product.name) : product.name}
                            </h5>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {reason}
                            </p>
                          </div>

                          <button className="text-[11px] font-bold text-teal-700 group-hover:underline flex items-center gap-1 mt-1">
                            <ShoppingBag className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'পণ্যটি দেখুন' : 'View Details'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
