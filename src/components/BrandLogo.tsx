import React from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'badge' | 'full';
  shopName?: string;
  banglaShopName?: string;
  tagline?: string;
  className?: string;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'badge',
  shopName = 'Nova Shop',
  banglaShopName = 'নোভা শপ',
  tagline = 'SHOPPING & RESELLER BD',
  className = '',
  showText = false,
}) => {
  const sizeMap = {
    xs: {
      box: 'w-7 h-7 rounded-xl',
      text: 'text-sm font-black',
      star: 'w-1.5 h-1.5',
      subtext: 'text-[9px]',
      title: 'text-xs',
    },
    sm: {
      box: 'w-9 h-9 rounded-2xl',
      text: 'text-base font-black',
      star: 'w-2 h-2',
      subtext: 'text-[10px]',
      title: 'text-sm',
    },
    md: {
      box: 'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl',
      text: 'text-lg sm:text-xl font-black',
      star: 'w-2.5 h-2.5',
      subtext: 'text-[10px] sm:text-xs',
      title: 'text-base sm:text-lg',
    },
    lg: {
      box: 'w-12 h-12 sm:w-14 sm:h-14 rounded-3xl',
      text: 'text-2xl sm:text-3xl font-black',
      star: 'w-3 h-3',
      subtext: 'text-xs',
      title: 'text-lg sm:text-xl',
    },
    xl: {
      box: 'w-16 h-16 sm:w-20 sm:h-20 rounded-3xl',
      text: 'text-3xl sm:text-4xl font-black',
      star: 'w-4 h-4',
      subtext: 'text-xs sm:text-sm',
      title: 'text-xl sm:text-2xl',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const logoBadge = (
    <div
      className={`relative ${currentSize.box} bg-gradient-to-tr from-rose-700 via-red-600 to-rose-500 border border-amber-400/40 flex items-center justify-center text-white shadow-md shadow-rose-600/30 group-hover:scale-105 group-hover:shadow-rose-600/50 transition-all duration-300 shrink-0 select-none overflow-hidden ${className}`}
    >
      {/* Ambient glass glare highlight */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

      {/* Stylized Luxury 'S' */}
      <span
        className={`relative z-10 ${currentSize.text} font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(76,5,25,0.8)]`}
        style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}
      >
        S
      </span>

      {/* Top right golden sparkle accent */}
      <span className="absolute top-1 right-1 text-amber-300 animate-pulse pointer-events-none drop-shadow-xs">
        <svg
          className={currentSize.star}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
        </svg>
      </span>

      {/* Bottom subtle gold trim */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
    </div>
  );

  if (variant === 'badge' && !showText) {
    return logoBadge;
  }

  return (
    <div className="flex items-center gap-2.5 text-left group">
      {logoBadge}
      <div>
        <span className={`${currentSize.title} font-black tracking-tight text-slate-900 font-sans block leading-none`}>
          {banglaShopName || shopName}
        </span>
        <span className={`${currentSize.subtext} text-rose-600 font-bold tracking-wider uppercase block mt-1`}>
          {tagline}
        </span>
      </div>
    </div>
  );
};
