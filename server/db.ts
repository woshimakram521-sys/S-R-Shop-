import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { 
  Product, 
  Category, 
  Order, 
  User, 
  StoreSettings, 
  Banner, 
  DeliveryZone,
  OrderStatus,
  ReferralCommission,
  WithdrawalRequest,
  EmailLog,
  ProductVariant,
  ResellerProfitRecord
} from '../src/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'novashop-db.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');

export interface AuditLog {
  id: string;
  userId?: string;
  userRole?: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DatabaseSchema {
  settings: StoreSettings;
  products: Product[];
  categories: Category[];
  banners: Banner[];
  deliveryZones: DeliveryZone[];
  orders: Order[];
  users: (User & { passwordHash: string; salt: string })[];
  referralCommissions: ReferralCommission[];
  resellerProfits: ResellerProfitRecord[];
  withdrawals: WithdrawalRequest[];
  emailLogs: EmailLog[];
  auditLogs: AuditLog[];
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getInitialData(): DatabaseSchema {
  const adminPass = hashPassword('admin123');
  const resellerPass = hashPassword('reseller123');

  const defaultSettings: StoreSettings = {
    shopName: 'Nova Shop',
    banglaShopName: 'নোভা শপ',
    tagline: 'Premium Bangladeshi E-Commerce & Reseller Hub',
    banglaTagline: 'বাংলাদেশের সেরা অনলাইন শপিং ও বিশ্বস্ত রিসেলার প্ল্যাটফর্ম',
    logoUrl: '/icon.svg',
    contactPhone: '+880 1712-345678',
    helplinePhone: '09612-345678',
    contactEmail: 'support@novashop.bd',
    address: 'House #42, Road #11, Sector #4, Uttara, Dhaka-1230, Bangladesh',
    tradeLicense: 'TRAD/DNCC/029412/2026',
    currencySymbol: '৳',
    
    // Reseller Rules
    minResellerAdvance: 50, // Minimum 50 BDT advance delivery charge rule
    resellerRegistrationFee: 200,
    autoApproveResellers: false,
    globalResellerMaxMarkupPercent: 60, // Default 60% above reseller wholesale price

    // Referral System Settings
    referralEnabled: true,
    referralDiscountMode: 'half', // 'half' | 'fixed' | 'percentage'
    referralDiscountValue: 100,  // 100 BDT or 50%
    referralCommissionAmount: 50, // 50 BDT reward per successful approved referral
    minWithdrawalAmount: 500,     // Minimum 500 BDT payout threshold

    // Payment Numbers & Guides
    bkashNumber: '01712345678',
    bkashType: 'মার্চেন্ট অ্যাকাউন্ট (Make Payment)',
    bkashInstructions: 'বিকাশ অ্যাপে গিয়ে Payment অপশন বেছে নিন, আমাদের মার্চেন্ট নম্বর দিন এবং রেফারেন্সে আপনার অর্ডার আইডি লিখুন।',
    nagadNumber: '01812345678',
    nagadType: 'পার্সোনাল অ্যাকাউন্ট (Send Money)',
    nagadInstructions: 'নগদ অ্যাপে অথবা *167# ডায়াল করে Send Money অপশনে যান, নগদ পার্সোনাল নম্বর দিন এবং রেফারেন্সে অর্ডার আইডি দিন।',
    rocketNumber: '01912345678-9',
    rocketType: 'পার্সোনাল অ্যাকাউন্ট',
    
    // SMTP defaults
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    emailNotificationsEnabled: false,
    emailRecipients: ['admin@novashop.com'],
    emailNotificationEvents: {
      newShopOrder: true,
      newResellerOrder: true,
      resellerRegistration: true,
      registrationPaymentSubmitted: true,
      advancePaymentSubmitted: true,
      advancePaymentVerified: true,
      orderStatusChanged: true,
      commissionApproved: true,
      withdrawalRequested: true,
      withdrawalPaid: true,
      resellerApproved: true,
      profitCredited: true,
      productChanged: true,
      backupCreated: true,
      systemError: true,
    },
  };

  const defaultCategories: Category[] = [
    {
      id: 'cat-1',
      name: "Men's Fashion",
      banglaName: 'মেনস ফ্যাশন',
      slug: 'mens-fashion',
      iconName: 'Shirt',
      imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80',
      order: 1,
    },
    {
      id: 'cat-2',
      name: "Women's Collection",
      banglaName: 'ওমেনস কালেকশন',
      slug: 'womens-collection',
      iconName: 'Sparkles',
      imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      order: 2,
    },
    {
      id: 'cat-3',
      name: 'Electronics & Gadgets',
      banglaName: 'ইলেকট্রনিক্স ও গ্যাজেট',
      slug: 'electronics',
      iconName: 'Smartphone',
      imageUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
      order: 3,
    },
    {
      id: 'cat-4',
      name: 'Traditional & Festive',
      banglaName: 'ঐতিহ্যবাহী পোশাক',
      slug: 'traditional-wear',
      iconName: 'Crown',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
      order: 4,
    },
    {
      id: 'cat-5',
      name: 'Bags & Accessories',
      banglaName: 'ব্যাগ ও এক্সেসরিজ',
      slug: 'accessories',
      iconName: 'ShoppingBag',
      imageUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80',
      order: 5,
    },
  ];

  const defaultBanners: Banner[] = [
    {
      id: 'ban-1',
      title: 'Eid & Festive Collection 2026',
      banglaTitle: 'ঈদ ও উৎসবের এক্সক্লুসিভ কালেকশন ২০২৬',
      subtitle: 'Exclusive Silk Panjabi, Jamdani & Premium Gadgets',
      banglaSubtitle: 'সেরা মানের সিল্ক পাঞ্জাবি, ঢাকাই জামদানি এবং আধুনিক গ্যাজেট',
      tag: 'বৈশাখ ও ঈদ ধামাকা',
      imageUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=1200&auto=format&fit=crop&q=80',
      buttonText: 'Shop Collection',
      banglaButtonText: 'কালেকশন দেখুন',
      linkUrl: '#products',
      backgroundColor: 'from-amber-600 via-rose-600 to-indigo-900',
      isActive: true,
      order: 1,
    },
    {
      id: 'ban-2',
      title: 'Become a Nova Reseller & Earn Daily',
      banglaTitle: 'ঘরে বসেই শুরু করুন রিসেলিং ও আয় করুন',
      subtitle: 'Get wholesale prices, set your own profit, zero warehouse hassle',
      banglaSubtitle: 'পাইকারি রেটে কিনুন, নিজের মতো লাভে বিক্রি করুন, ক্যাশ অন ডেলিভারি সাপোর্ট',
      tag: 'রিসেলার পার্টনারশিপ',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?w=1200&auto=format&fit=crop&q=80',
      buttonText: 'Join Reseller Hub',
      banglaButtonText: 'রিসেলার হোন',
      linkUrl: '#reseller',
      backgroundColor: 'from-emerald-700 via-teal-800 to-cyan-900',
      isActive: true,
      order: 2,
    },
  ];

  const defaultDeliveryZones: DeliveryZone[] = [
    {
      id: 'zone-1',
      name: 'Inside Dhaka City',
      banglaName: 'ঢাকা সিটির ভেতরে',
      charge: 70,
      estimatedDays: '1-2 Days',
      banglaEstimatedDays: '১-২ কর্মদিবস',
      isActive: true,
    },
    {
      id: 'zone-2',
      name: 'Dhaka Suburbs (Savar, Gazipur, Narayanganj)',
      banglaName: 'ঢাকার পার্শ্ববর্তী অঞ্চল (সাভার, গাজীপুর, নারায়ণগঞ্জ)',
      charge: 100,
      estimatedDays: '2-3 Days',
      banglaEstimatedDays: '২-৩ কর্মদিবস',
      isActive: true,
    },
    {
      id: 'zone-3',
      name: 'Outside Dhaka (All Over Bangladesh)',
      banglaName: 'ঢাকার বাইরে (সমগ্র বাংলাদেশ)',
      charge: 130,
      estimatedDays: '3-5 Days',
      banglaEstimatedDays: '৩-৫ কর্মদিবস',
      isActive: true,
    },
  ];

  const defaultProducts: Product[] = [
    {
      id: 'prod-101',
      sku: 'M-PNJ-01',
      name: 'Royal Semi-fitted Silk Panjabi with Embroidery',
      banglaName: 'রয়্যাল সেমি-ফিটেড সিল্ক সুতি পাঞ্জাবি',
      category: 'mens-fashion',
      shopPrice: 1250,
      resellerPrice: 850,
      regularPrice: 1750,
      resellerMaxPrice: 1550,
      stock: 48,
      variants: [
        { id: 'v-size', name: 'সাইজ', options: ['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)'] },
        { id: 'v-color', name: 'রং', options: ['মেরুন', 'নেভি ব্লু', 'অলিভ গ্রিন', 'রয়্যাল ব্ল্যাক'] },
      ],
      images: [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
      ],
      description: 'Handcrafted premium silk blend fabric with elegant neck and cuff embroidery. Breathable, comfortable, perfect for Eid and family occasions.',
      banglaDescription: 'প্রিমিয়াম সিল্ক ব্লেন্ড কাপড়ে সূক্ষ্ম এমব্রয়ডারি করা পাঞ্জাবি। আরামদায়ক ও উৎসবমুখর যেকোনো অনুষ্ঠানের জন্য মানানসই।',
      isFeatured: true,
      isBestseller: true,
      isPublished: true,
      createdAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'prod-102',
      sku: 'W-JMD-02',
      name: 'Dhakai Traditional Handloom Jamdani Saree',
      banglaName: 'ঐতিহ্যবাহী ঢাকাই তাঁতের জামদানি শাড়ি',
      category: 'womens-collection',
      shopPrice: 2800,
      resellerPrice: 2000,
      regularPrice: 3800,
      resellerMaxPrice: 3400,
      stock: 25,
      variants: [
        { id: 'v-color', name: 'রং', options: ['লাল-সোনালী', 'রানী গোলাপী', 'কালো-রূপালী', 'বাসন্তী হলুদ'] },
      ],
      images: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
      ],
      description: 'Original 84-count soft cotton blend Dhakai Jamdani saree with delicate floral all-over weaving and matching blouse piece.',
      banglaDescription: 'আসল ৮৪ কাউন্ট নরম সুতি ব্লেন্ডের ঢাকাই জামদানি। চোখ জুড়ানো নকশা ও সাথে ম্যাচিং ব্লাউজ পিস অন্তর্ভুক্ত।',
      isFeatured: true,
      isBestseller: true,
      isPublished: true,
      createdAt: '2026-03-02T11:00:00Z',
    },
    {
      id: 'prod-103',
      sku: 'G-ANC-03',
      name: 'Wireless Bluetooth Earbuds with Active Noise Cancellation',
      banglaName: 'অ্যাক্টিভ নয়েজ ক্যান্সেলেশন ওয়্যারলেস এয়ারবাডস',
      category: 'electronics',
      shopPrice: 1650,
      resellerPrice: 1100,
      regularPrice: 2400,
      resellerMaxPrice: 2100,
      stock: 72,
      variants: [
        { id: 'v-color', name: 'রং', options: ['ম্যাট ব্ল্যাক', 'পার্ল হোয়াইট', 'মেটালিক গ্রে'] },
      ],
      images: [
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
      ],
      description: '35 hours total battery life with Type-C fast charging, Bluetooth 5.4, deep bass, and IPX5 sweat resistance. 6 months official warranty.',
      banglaDescription: '৩৫ ঘণ্টা ব্যাটারি ব্যাকআপ, টাইপ-সি ফাস্ট চার্জিং, ব্লুটুথ ৫.৪ এবং ডিপ ব্যাস। সাথে ৬ মাসের ওয়ারেন্টি।',
      isFeatured: true,
      isBestseller: true,
      isPublished: true,
      createdAt: '2026-03-05T09:30:00Z',
    },
    {
      id: 'prod-104',
      sku: 'G-SW-04',
      name: 'AMOLED Smart Watch with Bluetooth Calling & Bangla Support',
      banglaName: 'অ্যামোলেড স্মার্ট ওয়াচ (ব্লুটুথ কলিং ও বাংলা সাপোর্ট)',
      category: 'electronics',
      shopPrice: 2450,
      resellerPrice: 1700,
      regularPrice: 3500,
      resellerMaxPrice: 3100,
      stock: 40,
      variants: [
        { id: 'v-strap', name: 'স্ট্র্যাপ', options: ['সিলিকন ব্ল্যাক', 'মেটাল চেইন সিলভার', 'লেদার ব্রাউন'] },
      ],
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      ],
      description: '1.43-inch Always-on AMOLED display with full Bengali notifications, heart rate, SpO2, sleep monitor, and 100+ sports modes.',
      banglaDescription: '১.৪৩ ইঞ্চি অলওয়েজ-অন অ্যামোলেড ডিসপ্লে, বাংলা নোটিফিকেশন সুবিধা, হার্টরেট ও অক্সিজেন মনিটর।',
      isFeatured: true,
      isBestseller: false,
      isPublished: true,
      createdAt: '2026-03-06T14:15:00Z',
    },
    {
      id: 'prod-105',
      sku: 'A-LTH-05',
      name: 'Genuine Leather Executive Travel Backpack & Laptop Bag',
      banglaName: 'জেনুইন লেদার এক্সিকিউটিভ ল্যাপটপ ব্যাগ ও ব্যাকপ্যাক',
      category: 'accessories',
      shopPrice: 2200,
      resellerPrice: 1500,
      regularPrice: 3200,
      resellerMaxPrice: 2750,
      stock: 30,
      variants: [
        { id: 'v-color', name: 'রং', options: ['চকলেট ব্রাউন', 'ক্লাসিক ব্ল্যাক', 'ট্যান কাফে'] },
      ],
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
      ],
      description: 'Crafted with top-grain water-repellent leather. Dedicated 15.6 inch padded laptop compartment, USB charging port, and anti-theft zipper.',
      banglaDescription: 'আসল টপ-গ্রেইন ওয়াটারপ্রুফ চামড়া দিয়ে তৈরি। ১৫.৬ ইঞ্চি ল্যাপটপ চেম্বার এবং সিক্রেট জিপার যুক্ত।',
      isFeatured: false,
      isBestseller: true,
      isPublished: true,
      createdAt: '2026-03-07T16:00:00Z',
    },
    {
      id: 'prod-106',
      sku: 'M-POLO-06',
      name: 'High Density Pique Cotton Polo Shirt for Men',
      banglaName: 'হাই ডেনসিটি পিকে কটন প্রিমিয়াম পোলো শার্ট',
      category: 'mens-fashion',
      shopPrice: 650,
      resellerPrice: 420,
      regularPrice: 950,
      resellerMaxPrice: 850,
      stock: 110,
      variants: [
        { id: 'v-size', name: 'সাইজ', options: ['M (Chest 38)', 'L (Chest 40)', 'XL (Chest 42)', 'XXL (Chest 44)'] },
        { id: 'v-color', name: 'রং', options: ['রয়্যাল ব্লু', 'বারগান্ডি', 'অ্যাশ গ্রে', 'বটল গ্রিন'] },
      ],
      images: [
        'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
      ],
      description: '220 GSM 100% combed cotton pique polo. Color fade resistant, breathable collar, regular fit for casual and office wear.',
      banglaDescription: '২২০ জিএসএম শতভাগ কম্বড সুতির পোলো শার্ট। রঙ চটে না এবং গরমে অত্যন্ত আরামদায়ক।',
      isFeatured: false,
      isBestseller: true,
      isPublished: true,
      createdAt: '2026-03-08T08:00:00Z',
    },
    {
      id: 'prod-107',
      sku: 'W-KUR-07',
      name: 'Designer Viscose Rayon Printed Kurti with Dupatta',
      banglaName: 'ডিজাইনার ভিসকস রেয়ন প্রিন্টেড কুর্তি ও ওড়না সেট',
      category: 'womens-collection',
      shopPrice: 1450,
      resellerPrice: 980,
      regularPrice: 2100,
      resellerMaxPrice: 1850,
      stock: 45,
      variants: [
        { id: 'v-size', name: 'সাইজ', options: ['36 (S)', '38 (M)', '40 (L)', '42 (XL)'] },
        { id: 'v-color', name: 'রং', options: ['স্কাই ব্লু', 'পিচ পিঙ্ক', 'মিন্ট গ্রিন'] },
      ],
      images: [
        'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800&auto=format&fit=crop&q=80',
      ],
      description: 'Comfortable summer kurti set with digital block prints and lightweight chiffon dupatta.',
      banglaDescription: 'গরমের জন্য আরামদায়ক ডিজিটাল প্রিন্টের কুর্তি ও শিফন ওড়না সেট।',
      isFeatured: false,
      isBestseller: false,
      isPublished: true,
      createdAt: '2026-03-09T10:30:00Z',
    },
  ];

  const defaultUsers: (User & { passwordHash: string; salt: string })[] = [
    {
      id: 'usr-admin-1',
      name: 'Super Admin',
      email: 'admin@novashop.com',
      phone: '01712345678',
      role: 'admin',
      status: 'active',
      registrationFeePaid: true,
      regPaymentStatus: 'APPROVED',
      referralCode: 'NOVA-ADMIN',
      commissionBalance: 0,
      pendingCommission: 0,
      reservedWithdrawal: 0,
      totalWithdrawn: 0,
      createdAt: '2026-01-01T00:00:00Z',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
    },
    {
      id: 'usr-reseller-1',
      name: 'Kabir Ahmed (Digital Reseller)',
      email: 'kabir@reseller.bd',
      phone: '01899112233',
      role: 'reseller',
      status: 'active',
      businessName: 'Kabir Fashion House',
      registrationFeePaid: true,
      registrationTxId: 'BK923847291',
      registrationMethod: 'bkash',
      registrationSenderPhone: '01899112233',
      registrationFeeSnapshot: 200,
      regPaymentStatus: 'APPROVED',
      referralCode: 'NOVA-1001',
      commissionBalance: 450,
      pendingCommission: 100,
      reservedWithdrawal: 0,
      totalWithdrawn: 1200,
      payoutAccount: {
        method: 'bkash',
        accountNumber: '01899112233',
        accountHolderName: 'Kabir Ahmed',
      },
      createdAt: '2026-02-10T12:00:00Z',
      passwordHash: resellerPass.hash,
      salt: resellerPass.salt,
    },
  ];

  const defaultOrders: Order[] = [
    {
      id: 'NS-2603-001',
      orderType: 'direct_customer',
      customerName: 'Tanvir Hossain',
      customerPhone: '01755123456',
      customerAddress: 'House 12, Road 4, Dhanmondi, Dhaka',
      deliveryZoneId: 'zone-1',
      deliveryZoneName: 'ঢাকা সিটির ভেতরে',
      deliveryCharge: 70,
      items: [
        {
          productId: 'prod-101',
          productName: 'Royal Semi-fitted Silk Panjabi with Embroidery',
          productBanglaName: 'রয়্যাল সেমি-ফিটেড সিল্ক সুতি পাঞ্জাবি',
          productImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
          selectedVariants: { 'সাইজ': '40 (L)', 'রং': 'মেরুন' },
          quantity: 1,
          unitPrice: 1250,
          costPrice: 850,
          subtotal: 1250,
        },
      ],
      subtotal: 1250,
      totalAmount: 1320,
      paymentMethod: 'cod',
      customerPaymentStatus: 'PENDING',
      orderStatus: 'DELIVERED',
      notes: 'Customer requested evening delivery',
      createdAt: '2026-03-10T14:30:00Z',
      updatedAt: '2026-03-12T18:00:00Z',
    },
    {
      id: 'NS-2603-002',
      orderType: 'reseller_order',
      customerName: 'Farhana Sultana',
      customerPhone: '01611887766',
      customerAddress: 'Flat 4B, Green Road, Farmgate, Dhaka',
      deliveryZoneId: 'zone-1',
      deliveryZoneName: 'ঢাকা সিটির ভেতরে',
      deliveryCharge: 70,
      items: [
        {
          productId: 'prod-102',
          productName: 'Dhakai Traditional Handloom Jamdani Saree',
          productBanglaName: 'ঐতিহ্যবাহী ঢাকাই তাঁতের জামদানি শাড়ি',
          productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
          selectedVariants: { 'রং': 'লাল-সোনালী' },
          quantity: 1,
          unitPrice: 2600, // Reseller sold at 2600 (Cost 2000, Profit 600)
          costPrice: 2000,
          subtotal: 2600,
        },
      ],
      subtotal: 2600,
      totalAmount: 2670,
      paymentMethod: 'cod',
      customerPaymentStatus: 'PENDING',
      resellerId: 'usr-reseller-1',
      resellerName: 'Kabir Ahmed (Digital Reseller)',
      resellerPhone: '01899112233',
      resellerSellingPriceTotal: 2600,
      resellerProfit: 600,
      resellerAdvancePayment: {
        requiredAmount: 50,
        paidAmount: 50,
        method: 'bkash',
        senderPhone: '01899112233',
        txId: 'BK78291048',
        status: 'VERIFIED',
        verifiedAt: '2026-03-11T12:00:00Z',
        verifiedBy: 'usr-admin-1',
        adminNotes: 'Advance delivery fee received via bKash',
      },
      orderStatus: 'CONFIRMED',
      notes: 'Reseller customer order',
      createdAt: '2026-03-11T11:00:00Z',
      updatedAt: '2026-03-11T12:05:00Z',
    },
  ];

  const defaultCommissions: ReferralCommission[] = [
    {
      id: 'com-1',
      referrerId: 'usr-reseller-1',
      referrerName: 'Kabir Ahmed',
      referredUserId: 'usr-sample-2',
      referredUserName: 'Shakil Hasan',
      referralCode: 'NOVA-1001',
      amount: 50,
      status: 'APPROVED',
      adminNotes: 'Verified new reseller registration',
      createdAt: '2026-03-01T10:00:00Z',
      approvedAt: '2026-03-01T12:00:00Z',
    },
  ];

  const defaultWithdrawals: WithdrawalRequest[] = [
    {
      id: 'wdr-1',
      resellerId: 'usr-reseller-1',
      resellerName: 'Kabir Ahmed',
      resellerPhone: '01899112233',
      amount: 1200,
      payoutMethod: 'bkash',
      payoutNumber: '01899112233',
      status: 'PAID',
      txId: 'TRX-PAY-98124',
      adminNotes: 'Paid via bKash personal send money',
      createdAt: '2026-02-28T16:00:00Z',
      processedAt: '2026-03-01T09:00:00Z',
    },
  ];

  return {
    settings: defaultSettings,
    products: defaultProducts,
    categories: defaultCategories,
    banners: defaultBanners,
    deliveryZones: defaultDeliveryZones,
    orders: defaultOrders,
    users: defaultUsers,
    referralCommissions: defaultCommissions,
    resellerProfits: [],
    withdrawals: defaultWithdrawals,
    emailLogs: [],
    auditLogs: [
      {
        id: 'aud-init',
        action: 'SYSTEM_INITIALIZATION',
        details: 'Initial database dataset created with ACID persistence and default Bangladeshi products',
        timestamp: '2026-03-01T00:00:00Z',
      },
    ],
  };
}

class Database {
  private data: DatabaseSchema;
  private isSaving = false;
  private pendingSave = false;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);

        if (parsed.settings && parsed.products && parsed.orders && parsed.users) {
          // Safe schema migrations & backfilling without losing existing data
          parsed.referralCommissions = parsed.referralCommissions || [];
          parsed.resellerProfits = parsed.resellerProfits || [];
          parsed.withdrawals = parsed.withdrawals || [];
          parsed.emailLogs = parsed.emailLogs || [];
          parsed.auditLogs = parsed.auditLogs || [];

          // Migrate settings fields
          parsed.settings.whatsappNumber = parsed.settings.whatsappNumber ?? '+8801712345678';
          parsed.settings.whatsappEnabled = parsed.settings.whatsappEnabled ?? true;
          parsed.settings.globalResellerMaxMarkupPercent = parsed.settings.globalResellerMaxMarkupPercent ?? 60;
          parsed.settings.referralEnabled = parsed.settings.referralEnabled ?? true;
          parsed.settings.referralDiscountMode = parsed.settings.referralDiscountMode ?? 'half';
          parsed.settings.referralDiscountValue = parsed.settings.referralDiscountValue ?? 100;
          parsed.settings.referralCommissionAmount = parsed.settings.referralCommissionAmount ?? 50;
          parsed.settings.minWithdrawalAmount = parsed.settings.minWithdrawalAmount ?? 500;
          parsed.settings.emailRecipients = parsed.settings.emailRecipients || [parsed.settings.contactEmail || 'admin@novashop.com'];
          parsed.settings.emailNotificationEvents = parsed.settings.emailNotificationEvents || {
            newShopOrder: true,
            newResellerOrder: true,
            resellerRegistration: true,
            registrationPaymentSubmitted: true,
            advancePaymentSubmitted: true,
            advancePaymentVerified: true,
            orderStatusChanged: true,
            commissionApproved: true,
            withdrawalRequested: true,
            withdrawalPaid: true,
          };

          // Migrate products
          for (const p of parsed.products) {
            if (!p.images || p.images.length === 0) {
              p.images = [(p as any).imageUrl || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'];
            }
            if (p.resellerMaxPrice === undefined) {
              p.resellerMaxPrice = Math.round(p.resellerPrice * 1.5);
            }
          }

          // Migrate users
          for (const u of parsed.users) {
            if (!u.referralCode) {
              u.referralCode = 'NOVA-' + Math.floor(1000 + Math.random() * 9000);
            }
            u.commissionBalance = u.commissionBalance ?? 0;
            u.pendingCommission = u.pendingCommission ?? 0;
            u.reservedWithdrawal = u.reservedWithdrawal ?? 0;
            u.totalWithdrawn = u.totalWithdrawn ?? (u as any).withdrawnEarnings ?? 0;
            u.regPaymentStatus = u.regPaymentStatus || (u.registrationFeePaid ? 'APPROVED' : 'PENDING_VERIFICATION');
          }

          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading database file, creating fresh dataset:', err);
    }

    // Try fallback emergency file if main file is missing or corrupted
    try {
      const fallbackPath = path.join(process.env.TEMP || '/tmp', 'novashop-db.json');
      if (fs.existsSync(fallbackPath)) {
        const raw = fs.readFileSync(fallbackPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.settings && parsed.products) {
          console.log(`Database recovered from fallback: ${fallbackPath}`);
          return parsed;
        }
      }
    } catch {}

    const fresh = getInitialData();
    this.saveDirect(fresh);
    return fresh;
  }

  private saveDirect(data: DatabaseSchema) {
    const jsonStr = JSON.stringify(data, null, 2);
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, jsonStr, 'utf8');
      try {
        fs.renameSync(tempPath, DB_FILE);
      } catch (renameErr) {
        // Fallback for Windows or cross-device mounts where renameSync fails:
        fs.copyFileSync(tempPath, DB_FILE);
        try { fs.unlinkSync(tempPath); } catch {}
      }
    } catch (err) {
      console.warn('Atomic save failed, falling back to direct write:', err);
      try {
        fs.writeFileSync(DB_FILE, jsonStr, 'utf8');
      } catch (directErr) {
        console.error('Fatal error saving database directly to DB_FILE:', directErr);
        // Emergency secondary fallback for serverless/read-only container environments
        try {
          const fallbackPath = path.join(process.env.TEMP || '/tmp', 'novashop-db.json');
          fs.writeFileSync(fallbackPath, jsonStr, 'utf8');
          console.log(`Database emergency saved to ${fallbackPath}`);
        } catch {}
      }
    }
  }

  public save() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;
    try {
      this.saveDirect(this.data);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.save();
      }
    }
  }

  public logAudit(action: string, details: string, userId?: string, userRole?: string) {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userRole,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
  }

  // --- Settings ---
  public getSettings(): StoreSettings {
    return { ...this.data.settings };
  }

  public updateSettings(partial: Partial<StoreSettings>, adminId?: string): StoreSettings {
    const existingPass = this.data.settings.smtpPass;
    const updates = { ...partial };

    // Strict safeguard: Never overwrite saved smtpPass if empty, whitespace, or masked
    if (
      updates.smtpPass === undefined ||
      updates.smtpPass === null ||
      updates.smtpPass.trim() === '' ||
      updates.smtpPass.includes('•') ||
      updates.smtpPass.includes('*')
    ) {
      updates.smtpPass = existingPass;
    } else {
      updates.smtpPass = updates.smtpPass.trim();
    }

    this.data.settings = { ...this.data.settings, ...updates };
    this.logAudit('UPDATE_SETTINGS', 'Store configuration settings updated persistently', adminId, 'admin');
    this.save();
    return this.getSettings();
  }

  // --- Categories Management (Point 10) ---
  public getCategories(): Category[] {
    return [...this.data.categories].sort((a, b) => a.order - b.order);
  }

  public getCategoryById(id: string): Category | undefined {
    return this.data.categories.find((c) => c.id === id);
  }

  public createCategory(
    data: { name: string; banglaName: string; slug?: string; iconName?: string; imageUrl?: string },
    adminId?: string
  ): Category {
    const rawSlug = data.slug?.trim() || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = rawSlug || `cat-${Date.now()}`;
    const newCat: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      banglaName: data.banglaName.trim(),
      slug,
      iconName: data.iconName || 'Package',
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      order: this.data.categories.length + 1,
    };
    this.data.categories.push(newCat);
    this.logAudit('CREATE_CATEGORY', `Category created: ${newCat.banglaName} (${newCat.name})`, adminId, 'admin');
    this.save();
    return newCat;
  }

  public updateCategory(id: string, updates: Partial<Category>, adminId?: string): Category | null {
    const cat = this.data.categories.find((c) => c.id === id);
    if (!cat) return null;
    if (updates.name) cat.name = updates.name.trim();
    if (updates.banglaName) cat.banglaName = updates.banglaName.trim();
    if (updates.slug) cat.slug = updates.slug.trim();
    if (updates.iconName) cat.iconName = updates.iconName;
    if (updates.imageUrl) cat.imageUrl = updates.imageUrl;
    if (updates.order !== undefined) cat.order = updates.order;
    this.logAudit('UPDATE_CATEGORY', `Category updated: ${cat.banglaName} (${cat.name})`, adminId, 'admin');
    this.save();
    return cat;
  }

  public deleteCategory(id: string, adminId?: string): boolean {
    const index = this.data.categories.findIndex((c) => c.id === id);
    if (index === -1) return false;
    const deleted = this.data.categories.splice(index, 1)[0];
    this.logAudit('DELETE_CATEGORY', `Category deleted: ${deleted.banglaName} (${deleted.name})`, adminId, 'admin');
    this.save();
    return true;
  }

  // --- Products ---
  public getProducts(options?: { category?: string; query?: string; publishedOnly?: boolean }): Product[] {
    let list = [...this.data.products];
    if (options?.publishedOnly) {
      list = list.filter((p) => p.isPublished);
    }
    if (options?.category && options.category !== 'all') {
      list = list.filter((p) => p.category === options.category);
    }
    if (options?.query) {
      const q = options.query.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.banglaName && p.banglaName.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public createProduct(product: Omit<Product, 'id' | 'createdAt'>, adminId?: string): Product {
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: Product = {
      ...product,
      id: newId,
      images: product.images && product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'],
      resellerMaxPrice: product.resellerMaxPrice ?? Math.round(product.resellerPrice * (1 + (this.data.settings.globalResellerMaxMarkupPercent || 60) / 100)),
      createdAt: new Date().toISOString(),
    };
    this.data.products.unshift(newProduct);
    this.logAudit('CREATE_PRODUCT', `Product created: ${newProduct.name} (${newProduct.sku})`, adminId, 'admin');
    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>, adminId?: string): Product | null {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const existing = this.data.products[idx];
    const updated: Product = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.products[idx] = updated;
    this.logAudit('UPDATE_PRODUCT', `Product updated: ${updated.name} (${updated.sku})`, adminId, 'admin');
    this.save();
    return updated;
  }

  public deleteProduct(id: string, adminId?: string): boolean {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const deleted = this.data.products.splice(idx, 1)[0];
    this.logAudit('DELETE_PRODUCT', `Product deleted: ${deleted.name} (${deleted.sku})`, adminId, 'admin');
    this.save();
    return true;
  }

  public updateCategories(categories: Category[], adminId?: string): Category[] {
    this.data.categories = categories;
    this.logAudit('UPDATE_CATEGORIES', 'Product categories modified', adminId, 'admin');
    this.save();
    return this.getCategories();
  }

  // --- Banners ---
  public getBanners(activeOnly = false): Banner[] {
    let list = [...this.data.banners];
    if (activeOnly) {
      list = list.filter((b) => b.isActive);
    }
    return list.sort((a, b) => a.order - b.order);
  }

  public updateBanners(banners: Banner[], adminId?: string): Banner[] {
    this.data.banners = banners;
    this.logAudit('UPDATE_BANNERS', 'Store banners updated', adminId, 'admin');
    this.save();
    return this.getBanners();
  }

  // --- Delivery Zones ---
  public getDeliveryZones(): DeliveryZone[] {
    return [...this.data.deliveryZones];
  }

  public updateDeliveryZones(zones: DeliveryZone[], adminId?: string): DeliveryZone[] {
    this.data.deliveryZones = zones;
    this.logAudit('UPDATE_DELIVERY_ZONES', 'Delivery zones and rates modified', adminId, 'admin');
    this.save();
    return this.getDeliveryZones();
  }

  // --- Users & Resellers ---
  public getUsers(): User[] {
    return this.data.users.map(({ passwordHash, salt, ...user }) => user);
  }

  public findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByReferralCode(code: string) {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    return this.data.users.find((u) => u.referralCode && u.referralCode.toUpperCase() === clean);
  }

  public checkDuplicateTransactionId(txId: string): boolean {
    if (!txId) return false;
    const clean = txId.trim().toUpperCase();
    // Check in users registrationTxId
    const userHasTx = this.data.users.some(
      (u) => u.registrationTxId && u.registrationTxId.trim().toUpperCase() === clean
    );
    if (userHasTx) return true;
    // Check in orders reseller advance txId
    const orderHasTx = this.data.orders.some(
      (o) => o.resellerAdvancePayment?.txId && o.resellerAdvancePayment.txId.trim().toUpperCase() === clean
    );
    if (orderHasTx) return true;
    // Check in customerTxId
    const customerHasTx = this.data.orders.some(
      (o) => o.customerTxId && o.customerTxId.trim().toUpperCase() === clean
    );
    return customerHasTx;
  }


  public createUser(user: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: "admin" | "reseller" | "customer";
    businessName?: string;
    registrationFeePaid?: boolean;
    registrationTxId?: string;
    registrationMethod?: "bkash" | "nagad" | "rocket" | "bank";
    payoutAccount?: User["payoutAccount"];
  }): User {
    const { hash, salt } = hashPassword(user.password);
    const isReseller = user.role === "reseller";
    const autoApprove = isReseller ? this.data.settings.autoApproveResellers : true;
    const uniqueRefCode = "NOVA-" + Math.floor(1000 + Math.random() * 9000);

    const newUser: User & { passwordHash: string; salt: string } = {
      id: "usr-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: isReseller && !autoApprove ? "pending_approval" : "active",
      businessName: user.businessName,
      registrationFeePaid: user.registrationFeePaid ?? false,
      registrationTxId: user.registrationTxId,
      registrationMethod: user.registrationMethod,
      payoutAccount: user.payoutAccount,
      referralCode: uniqueRefCode,
      commissionBalance: 0,
      pendingCommission: 0,
      reservedWithdrawal: 0,
      totalWithdrawn: 0,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt,
    };
    this.data.users.push(newUser);
    this.logAudit("CREATE_USER", "Created user " + newUser.email + " with role " + newUser.role);
    this.save();
    const { passwordHash: _ph, salt: _s, ...cleanUser } = newUser;
    return cleanUser;
  }

  public registerReseller(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    businessName?: string;
    referralCode?: string;
    registrationMethod?: 'bkash' | 'nagad' | 'rocket' | 'bank';
    registrationSenderPhone?: string;
    registrationTxId?: string;
  }): { user: User; appliedDiscount: number; requiredFee: number; netFee: number } {
    // Check if email already exists
    if (this.findUserByEmail(data.email)) {
      throw new Error('An account with this email address already exists.');
    }

    // Check duplicate transaction ID
    if (data.registrationTxId && this.checkDuplicateTransactionId(data.registrationTxId)) {
      throw new Error(`Transaction ID '${data.registrationTxId}' has already been submitted in the system. Duplicate submissions are not allowed.`);
    }

    const settings = this.data.settings;
    const standardFee = settings.resellerRegistrationFee || 200;
    let appliedDiscount = 0;
    let validReferrer: (User & { passwordHash: string; salt: string }) | null = null;

    // Validate referral code if submitted
    if (data.referralCode && settings.referralEnabled) {
      const referrer = this.findUserByReferralCode(data.referralCode);
      if (referrer && referrer.role === 'reseller' && referrer.status === 'active') {
        validReferrer = referrer;
        if (settings.referralDiscountMode === 'half') {
          appliedDiscount = Math.round(standardFee / 2);
        } else if (settings.referralDiscountMode === 'fixed') {
          appliedDiscount = Math.min(standardFee, settings.referralDiscountValue || 50);
        } else if (settings.referralDiscountMode === 'percentage') {
          appliedDiscount = Math.round((standardFee * (settings.referralDiscountValue || 25)) / 100);
        }
      }
    }

    const netFee = Math.max(0, standardFee - appliedDiscount);

    // Generate unique referral code for this new reseller
    const uniqueRefCode = `NOVA-${Math.floor(1000 + Math.random() * 9000)}`;

    const { hash, salt } = hashPassword(data.password);
    const autoApprove = settings.autoApproveResellers;

    const newUser: User & { passwordHash: string; salt: string } = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'reseller',
      status: autoApprove ? 'active' : 'pending_approval',
      businessName: data.businessName,
      registrationFeePaid: false,
      registrationTxId: data.registrationTxId,
      registrationMethod: data.registrationMethod,
      registrationSenderPhone: data.registrationSenderPhone,
      registrationFeeSnapshot: netFee,
      appliedReferralDiscount: appliedDiscount,
      regPaymentStatus: 'PENDING_VERIFICATION',
      referralCode: uniqueRefCode,
      referredBy: validReferrer ? validReferrer.referralCode : undefined,
      commissionBalance: 0,
      pendingCommission: 0,
      reservedWithdrawal: 0,
      totalWithdrawn: 0,
      createdAt: new Date().toISOString(),
      passwordHash: hash,
      salt,
    };

    this.data.users.push(newUser);
    this.logAudit('REGISTER_RESELLER', `Reseller registered: ${newUser.email} (Referral: ${validReferrer ? validReferrer.referralCode : 'None'})`);
    this.save();

    const { passwordHash: _ph, salt: _s, ...cleanUser } = newUser;
    return {
      user: cleanUser,
      appliedDiscount,
      requiredFee: standardFee,
      netFee,
    };
  }

  public verifyResellerRegistrationPayment(
    userId: string,
    action: 'VERIFY' | 'REJECT',
    notes?: string,
    adminId?: string
  ): User {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) throw new Error('Reseller user not found.');

    if (action === 'VERIFY') {
      user.registrationFeePaid = true;
      user.regPaymentStatus = 'APPROVED';
      user.status = 'active'; // Approved once payment is verified

      // Point 9: Auto-credit referral commission to the referrer's Available Balance upon admin approval
      if (user.referredBy && this.data.settings.referralEnabled) {
        const referrer = this.findUserByReferralCode(user.referredBy);
        if (referrer) {
          const commAmount = this.data.settings.referralCommissionAmount || 100;
          const comm = this.createReferralCommission(referrer.id, user.id, commAmount);
          if (comm && comm.status === 'PENDING') {
            this.approveReferralCommission(comm.id, adminId);
            this.logAudit(
              'AUTO_CREDIT_REFERRAL_BONUS',
              `Auto-credited referral bonus ৳${commAmount} to referrer ${referrer.name} (${referrer.email}) on approval of reseller ${user.name}`,
              adminId,
              'admin'
            );
          }
        }
      }

      this.logAudit('VERIFY_REGISTRATION_PAYMENT', `Approved registration payment for reseller ${user.email}. Notes: ${notes || 'None'}`, adminId, 'admin');
    } else {
      user.regPaymentStatus = 'REJECTED';
      user.paymentRejectionReason = notes || 'Payment reference or transaction ID could not be verified.';
      this.logAudit('REJECT_REGISTRATION_PAYMENT', `Rejected registration payment for reseller ${user.email}. Reason: ${notes || 'None'}`, adminId, 'admin');
    }

    this.save();
    const { passwordHash: _ph, salt: _s, ...cleanUser } = user;
    return cleanUser;
  }


  // --- Referral Commissions ---
  public getReferralCommissions(filter?: { referrerId?: string; status?: string }): ReferralCommission[] {
    let list = [...this.data.referralCommissions];
    if (filter?.referrerId) {
      list = list.filter((c) => c.referrerId === filter.referrerId);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((c) => c.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createReferralCommission(referrerId: string, referredUserId: string, amount: number): ReferralCommission | null {
    // Check if commission already exists for this referred user to prevent duplicate attribution
    const existing = this.data.referralCommissions.find((c) => c.referredUserId === referredUserId);
    if (existing) {
      return existing;
    }

    const referrer = this.findUserById(referrerId);
    const referred = this.findUserById(referredUserId);
    if (!referrer || !referred) return null;

    const commission: ReferralCommission = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      referrerId,
      referrerName: referrer.name,
      referredUserId,
      referredUserName: referred.name,
      referralCode: referrer.referralCode || '',
      amount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.data.referralCommissions.unshift(commission);
    referrer.pendingCommission = (referrer.pendingCommission || 0) + amount;
    this.logAudit('CREATE_REFERRAL_COMMISSION', `Pending commission ৳${amount} created for referrer ${referrer.name} from ${referred.name}`);
    this.save();
    return commission;
  }

  public approveReferralCommission(commissionId: string, adminId?: string): ReferralCommission {
    const comm = this.data.referralCommissions.find((c) => c.id === commissionId);
    if (!comm) throw new Error('Referral commission not found.');
    if (comm.status !== 'PENDING') throw new Error(`Commission is already ${comm.status}.`);

    const referrer = this.findUserById(comm.referrerId);
    if (!referrer) throw new Error('Referrer user not found.');

    comm.status = 'APPROVED';
    comm.approvedAt = new Date().toISOString();

    // Move from pending to available commission balance
    referrer.pendingCommission = Math.max(0, (referrer.pendingCommission || 0) - comm.amount);
    referrer.commissionBalance = (referrer.commissionBalance || 0) + comm.amount;

    this.logAudit('APPROVE_REFERRAL_COMMISSION', `Approved commission ৳${comm.amount} for reseller ${referrer.name}`, adminId, 'admin');
    this.save();
    return comm;
  }

  public rejectReferralCommission(commissionId: string, reason?: string, adminId?: string): ReferralCommission {
    const comm = this.data.referralCommissions.find((c) => c.id === commissionId);
    if (!comm) throw new Error('Referral commission not found.');
    if (comm.status !== 'PENDING') throw new Error(`Commission is already ${comm.status}.`);

    const referrer = this.findUserById(comm.referrerId);
    if (referrer) {
      referrer.pendingCommission = Math.max(0, (referrer.pendingCommission || 0) - comm.amount);
    }

    comm.status = 'REJECTED';
    comm.adminNotes = reason || 'Admin rejected commission';

    this.logAudit('REJECT_REFERRAL_COMMISSION', `Rejected commission ৳${comm.amount} for commission ${commissionId}. Reason: ${reason || 'None'}`, adminId, 'admin');
    this.save();
    return comm;
  }

  // --- Withdrawals ---
  public getWithdrawals(filter?: { resellerId?: string; status?: string }): WithdrawalRequest[] {
    let list = [...this.data.withdrawals];
    if (filter?.resellerId) {
      list = list.filter((w) => w.resellerId === filter.resellerId);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((w) => w.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public requestWithdrawal(
    resellerId: string,
    amount: number,
    payoutMethod: 'bkash' | 'nagad' | 'rocket' | 'bank',
    payoutNumber: string
  ): WithdrawalRequest {
    const user = this.findUserById(resellerId);
    if (!user) throw new Error('Reseller account not found.');

    const minAmount = this.data.settings.minWithdrawalAmount || 500;
    if (amount < minAmount) {
      throw new Error(`Minimum withdrawal amount is ৳${minAmount}. Requested ৳${amount} is too low.`);
    }

    if ((user.commissionBalance || 0) < amount) {
      throw new Error(`Insufficient approved commission balance. Available: ৳${user.commissionBalance || 0}, requested: ৳${amount}.`);
    }

    // Atomically reserve / lock the amount to prevent race conditions or double spending
    user.commissionBalance -= amount;
    user.reservedWithdrawal = (user.reservedWithdrawal || 0) + amount;

    const withdrawal: WithdrawalRequest = {
      id: `wdr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      resellerId: user.id,
      resellerName: user.name,
      resellerPhone: user.phone,
      amount,
      payoutMethod,
      payoutNumber,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.data.withdrawals.unshift(withdrawal);
    this.logAudit('REQUEST_WITHDRAWAL', `Reseller ${user.name} requested withdrawal of ৳${amount} via ${payoutMethod} (${payoutNumber})`);
    this.save();
    return withdrawal;
  }

  public approveWithdrawal(
    withdrawalId: string,
    txId: string,
    adminNotes?: string,
    adminId?: string
  ): WithdrawalRequest {
    const w = this.data.withdrawals.find((item) => item.id === withdrawalId);
    if (!w) throw new Error('Withdrawal request not found.');
    if (w.status !== 'PENDING') throw new Error(`Withdrawal request is already ${w.status}.`);

    const user = this.findUserById(w.resellerId);
    if (!user) throw new Error('Reseller account not found.');

    w.status = 'PAID';
    w.txId = txId;
    w.adminNotes = adminNotes || 'Paid by admin';
    w.processedAt = new Date().toISOString();

    // Deduct from reserved and add to totalWithdrawn
    user.reservedWithdrawal = Math.max(0, (user.reservedWithdrawal || 0) - w.amount);
    user.totalWithdrawn = (user.totalWithdrawn || 0) + w.amount;

    this.logAudit('APPROVE_WITHDRAWAL', `Paid withdrawal ৳${w.amount} to ${w.resellerName} via ${w.payoutMethod}. TrxID: ${txId}`, adminId, 'admin');
    this.save();
    return w;
  }

  public rejectWithdrawal(
    withdrawalId: string,
    reason: string,
    adminId?: string
  ): WithdrawalRequest {
    const w = this.data.withdrawals.find((item) => item.id === withdrawalId);
    if (!w) throw new Error('Withdrawal request not found.');
    if (w.status !== 'PENDING') throw new Error(`Withdrawal request is already ${w.status}.`);

    const user = this.findUserById(w.resellerId);
    if (user) {
      // Release locked funds back to available balance
      user.reservedWithdrawal = Math.max(0, (user.reservedWithdrawal || 0) - w.amount);
      user.commissionBalance = (user.commissionBalance || 0) + w.amount;
    }

    w.status = 'REJECTED';
    w.adminNotes = reason || 'Admin rejected payout request';
    w.processedAt = new Date().toISOString();

    this.logAudit('REJECT_WITHDRAWAL', `Rejected withdrawal ৳${w.amount} for ${w.resellerName}. Reason: ${reason}`, adminId, 'admin');
    this.save();
    return w;
  }

  // --- Orders ---
  public getOrders(filter?: { resellerId?: string; status?: OrderStatus }): Order[] {
    let list = [...this.data.orders];
    if (filter?.resellerId) {
      list = list.filter((o) => o.resellerId === filter.resellerId);
    }
    if (filter?.status) {
      list = list.filter((o) => o.orderStatus === filter.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id.toUpperCase() === id.trim().toUpperCase());
  }

  public generateOrderId(): string {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    return `NS-${yy}${mm}-${randomSeq}`;
  }

  public createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    // 1. Reseller order price limits & advance payment validation
    if (orderData.orderType === 'reseller_order') {
      const minAdvance = this.data.settings.minResellerAdvance || 50;
      if (!orderData.resellerAdvancePayment || orderData.resellerAdvancePayment.paidAmount < minAdvance) {
        throw new Error(`CRITICAL RULE VIOLATION: Reseller orders require an advance delivery fee payment of at least ৳${minAdvance}.`);
      }

      // Check duplicate transaction reference for advance payment
      if (orderData.resellerAdvancePayment.txId && this.checkDuplicateTransactionId(orderData.resellerAdvancePayment.txId)) {
        throw new Error(`Transaction ID '${orderData.resellerAdvancePayment.txId}' has already been recorded for an order or registration. Replay is forbidden.`);
      }

      // Reseller advance payment must always start strictly as PENDING_VERIFICATION
      orderData.resellerAdvancePayment.status = 'PENDING_VERIFICATION';

      // Validate reseller selling prices against product limits
      for (const item of orderData.items) {
        const prod = this.getProductById(item.productId);
        if (prod) {
          const wholesalePrice = prod.resellerPrice;
          const maxAllowedPrice = prod.resellerMaxPrice || Math.round(prod.resellerPrice * (1 + (this.data.settings.globalResellerMaxMarkupPercent || 60) / 100)) || prod.regularPrice;

          if (item.unitPrice < wholesalePrice) {
            throw new Error(`Price error on '${prod.name}': selling price ৳${item.unitPrice} cannot be lower than wholesale cost ৳${wholesalePrice}.`);
          }
          if (item.unitPrice > maxAllowedPrice) {
            throw new Error(`Price error on '${prod.name}': selling price ৳${item.unitPrice} exceeds allowed maximum price ৳${maxAllowedPrice}.`);
          }
        }
      }
    }

    // 2. Validate and atomically decrement stock
    for (const item of orderData.items) {
      const prod = this.getProductById(item.productId);
      if (prod) {
        if (prod.stock < item.quantity) {
          throw new Error(`Insufficient stock for product '${prod.name}'. Available: ${prod.stock}, requested: ${item.quantity}.`);
        }
        prod.stock -= item.quantity;
      }
    }

    const orderId = this.generateOrderId();
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      createdAt: now,
      updatedAt: now,
    };

    this.data.orders.unshift(newOrder);
    this.logAudit('CREATE_ORDER', `New ${newOrder.orderType} placed: ${orderId} by ${newOrder.customerName} (Total: ৳${newOrder.totalAmount})`);
    this.save();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus, adminId?: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    // MANDATORY RESELLER ADVANCE DELIVERY PAYMENT ENFORCEMENT
    // A reseller order cannot progress to CONFIRMED, PROCESSING, SHIPPED, or DELIVERED until the advance payment is verified by an admin!
    if (order.orderType === 'reseller_order' && status !== 'PENDING' && status !== 'CANCELLED') {
      if (!order.resellerAdvancePayment || order.resellerAdvancePayment.status !== 'VERIFIED') {
        throw new Error(
          'CRITICAL RULE VIOLATION: Reseller orders cannot be confirmed or dispatched until the minimum advance delivery payment is VERIFIED by an admin.'
        );
      }
    }

    // Restock if cancelled
    if (status === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
      for (const item of order.items) {
        const prod = this.getProductById(item.productId);
        if (prod) {
          prod.stock += item.quantity;
        }
      }
    }

    // RESELLER ORDER PROFIT AUTO-CREDIT (Point 1)
    // When marked DELIVERED or COMPLETED: Profit is automatically credited to the reseller's Available Balance!
    // Strict idempotency: same order profit will NEVER be credited twice.
    const isCompletedStatus = status === 'DELIVERED' || status === 'COMPLETED';
    if (isCompletedStatus && order.orderType === 'reseller_order' && order.resellerId) {
      const existingProfit = this.data.resellerProfits.find((p) => p.orderId === order.id);
      const resellerUser = this.findUserById(order.resellerId);

      if (existingProfit) {
        // If already approved/credited, DO NOT credit again!
        if (existingProfit.status === 'APPROVED') {
          // Already credited, skip duplicate credit
        } else if (existingProfit.status === 'PENDING' || existingProfit.status === 'ON_HOLD') {
          // Previously pending, now auto-approve and credit to Available Balance!
          existingProfit.status = 'APPROVED';
          existingProfit.approvedAt = new Date().toISOString();
          existingProfit.approvedBy = adminId || 'admin';
          existingProfit.adminNotes = 'Auto-credited upon order completion';
          existingProfit.updatedAt = new Date().toISOString();

          if (resellerUser) {
            resellerUser.pendingCommission = Math.max(0, (resellerUser.pendingCommission || 0) - existingProfit.profitAmount);
            resellerUser.commissionBalance = (resellerUser.commissionBalance || 0) + existingProfit.netProfit;
          }

          const uniqueRef = `PROFIT-AUTO-CREDIT-${order.id}`;
          this.logAudit(
            'AUTO_CREDIT_RESELLER_PROFIT',
            `Order ${order.id} marked ${status}: Auto-credited profit ৳${existingProfit.netProfit} to reseller ${resellerUser?.name || order.resellerId}. Reference: ${uniqueRef}`,
            adminId,
            'admin'
          );
        }
      } else {
        // First time generating profit record: directly credit to Available Balance!
        const wholesaleTotal = order.items.reduce((s, it) => s + (it.costPrice * it.quantity), 0);
        const sellingTotal = order.items.reduce((s, it) => s + (it.unitPrice * it.quantity), 0);
        const profitAmount = Math.max(0, sellingTotal - wholesaleTotal);

        const profitRecord: ResellerProfitRecord = {
          id: `prof-${order.id}`,
          orderId: order.id,
          resellerId: order.resellerId,
          resellerName: order.resellerName || resellerUser?.name || 'Reseller',
          resellerPhone: order.resellerPhone || resellerUser?.phone,
          customerName: order.customerName,
          sellingTotal,
          wholesaleTotal,
          profitAmount,
          deductions: 0,
          netProfit: profitAmount,
          status: 'APPROVED', // Auto-credited directly to Available Balance!
          approvedAt: new Date().toISOString(),
          approvedBy: adminId || 'admin',
          adminNotes: 'Auto-credited upon order completion',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.data.resellerProfits.unshift(profitRecord);

        if (resellerUser) {
          resellerUser.commissionBalance = (resellerUser.commissionBalance || 0) + profitAmount;
        }

        const uniqueRef = `PROFIT-AUTO-CREDIT-${order.id}`;
        this.logAudit(
          'AUTO_CREDIT_RESELLER_PROFIT',
          `Order ${order.id} marked ${status}: Generated and auto-credited profit ৳${profitAmount} to reseller ${resellerUser?.name || order.resellerId}. Reference: ${uniqueRef}`,
          adminId,
          'admin'
        );
      }
    }

    // If status was changed from DELIVERED or COMPLETED to CANCELLED, handle profit reversal safely
    const wasCompleted = order.orderStatus === 'DELIVERED' || order.orderStatus === 'COMPLETED';
    if (wasCompleted && status === 'CANCELLED' && order.orderType === 'reseller_order' && order.resellerId) {
      const profitRecord = this.data.resellerProfits.find((p) => p.orderId === order.id);
      if (profitRecord && profitRecord.status === 'APPROVED') {
        profitRecord.status = 'REVERSED';
        profitRecord.reason = `Order status changed from ${order.orderStatus} to CANCELLED`;
        profitRecord.updatedAt = new Date().toISOString();
        const resellerUser = this.findUserById(order.resellerId);
        if (resellerUser) {
          resellerUser.commissionBalance = Math.max(0, (resellerUser.commissionBalance || 0) - profitRecord.netProfit);
        }
        this.logAudit(
          'REVERSE_RESELLER_PROFIT',
          `Reversed auto-credited profit of ৳${profitRecord.netProfit} for order ${order.id} due to cancellation. Reference: PROFIT-REVERSAL-${order.id}`,
          adminId,
          'admin'
        );
      }
    }

    order.orderStatus = status;
    order.updatedAt = new Date().toISOString();
    this.logAudit('UPDATE_ORDER_STATUS', `Order ${order.id} status changed to ${status}`, adminId, 'admin');
    this.save();
    return order;
  }

  public verifyResellerAdvancePayment(
    orderId: string,
    action: 'VERIFY' | 'REJECT',
    adminNotes?: string,
    adminId?: string
  ): Order {
    const order = this.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }
    if (!order.resellerAdvancePayment) {
      throw new Error(`Order ${orderId} does not have a reseller advance payment.`);
    }

    if (action === 'VERIFY') {
      order.resellerAdvancePayment.status = 'VERIFIED';
      order.resellerAdvancePayment.verifiedAt = new Date().toISOString();
      order.resellerAdvancePayment.verifiedBy = adminId || 'admin';
      order.resellerAdvancePayment.adminNotes = adminNotes;
      if (order.orderStatus === 'PENDING') {
        order.orderStatus = 'PAYMENT_VERIFIED';
      }
      this.logAudit('VERIFY_ADVANCE_PAYMENT', `Verified advance payment for order ${order.id}. Notes: ${adminNotes || 'None'}`, adminId, 'admin');
    } else {
      order.resellerAdvancePayment.status = 'REJECTED';
      order.resellerAdvancePayment.adminNotes = adminNotes || 'Advance payment rejected by admin';
      this.logAudit('REJECT_ADVANCE_PAYMENT', `Rejected advance payment for order ${order.id}. Reason: ${adminNotes || 'None'}`, adminId, 'admin');
    }

    order.updatedAt = new Date().toISOString();
    this.save();
    return order;
  }

  // --- Reseller Order Profit Approval (Section 12) ---
  public getResellerProfits(filter?: { resellerId?: string; status?: string }): ResellerProfitRecord[] {
    let list = [...this.data.resellerProfits];
    if (filter?.resellerId) {
      list = list.filter((p) => p.resellerId === filter.resellerId);
    }
    if (filter?.status && filter.status !== 'ALL') {
      list = list.filter((p) => p.status === filter.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getResellerProfitById(profitId: string): ResellerProfitRecord | undefined {
    return this.data.resellerProfits.find((p) => p.id === profitId);
  }

  public approveResellerProfit(
    profitId: string,
    adminId?: string,
    options?: { deductions?: number; adminNotes?: string }
  ): ResellerProfitRecord {
    const profit = this.getResellerProfitById(profitId);
    if (!profit) {
      throw new Error(`Reseller profit record '${profitId}' not found.`);
    }

    // STRICT IDEMPOTENCY / DOUBLE-CREDIT PREVENTION
    if (profit.status === 'APPROVED') {
      throw new Error(`CRITICAL INTEGRITY ERROR: Profit record '${profitId}' for order '${profit.orderId}' has ALREADY been approved and credited. Duplicate payout blocked.`);
    }

    if (profit.status !== 'PENDING' && profit.status !== 'ON_HOLD') {
      throw new Error(`Profit record status is '${profit.status}'. Only PENDING or ON_HOLD records can be approved.`);
    }

    // Verify related order is in valid state
    const order = this.getOrderById(profit.orderId);
    if (!order) {
      throw new Error(`Associated order '${profit.orderId}' not found.`);
    }
    if (order.orderStatus !== 'DELIVERED') {
      throw new Error(`Cannot approve profit for order '${profit.orderId}' because its status is '${order.orderStatus}' (must be DELIVERED).`);
    }

    const reseller = this.findUserById(profit.resellerId);
    if (!reseller) {
      throw new Error(`Reseller account '${profit.resellerId}' not found.`);
    }

    const deductions = Math.max(0, Math.min(options?.deductions || 0, profit.profitAmount));
    const netProfit = profit.profitAmount - deductions;

    profit.deductions = deductions;
    profit.netProfit = netProfit;
    profit.status = 'APPROVED';
    profit.approvedBy = adminId || 'admin';
    profit.approvedAt = new Date().toISOString();
    profit.adminNotes = options?.adminNotes;
    profit.updatedAt = new Date().toISOString();

    // Release from pending money and credit to withdrawable available balance
    reseller.pendingCommission = Math.max(0, (reseller.pendingCommission || 0) - profit.profitAmount);
    reseller.commissionBalance = (reseller.commissionBalance || 0) + netProfit;

    const uniqueLedgerRef = `PROFIT-CREDIT-${profit.orderId}`;
    this.logAudit(
      'APPROVE_RESELLER_PROFIT',
      `Approved reseller profit ৳${netProfit} (Deductions: ৳${deductions}) for order ${profit.orderId}. Credited to reseller ${reseller.name}. Ledger Ref: ${uniqueLedgerRef}`,
      adminId,
      'admin'
    );

    this.save();
    return profit;
  }

  public rejectResellerProfit(profitId: string, reason: string, adminId?: string): ResellerProfitRecord {
    const profit = this.getResellerProfitById(profitId);
    if (!profit) throw new Error(`Reseller profit record '${profitId}' not found.`);
    if (profit.status === 'APPROVED') {
      throw new Error(`Cannot reject an already approved profit. Use reversal instead.`);
    }

    const reseller = this.findUserById(profit.resellerId);
    if (reseller && (profit.status === 'PENDING' || profit.status === 'ON_HOLD')) {
      reseller.pendingCommission = Math.max(0, (reseller.pendingCommission || 0) - profit.profitAmount);
    }

    profit.status = 'REJECTED';
    profit.reason = reason || 'Admin rejected profit credit';
    profit.updatedAt = new Date().toISOString();

    this.logAudit('REJECT_RESELLER_PROFIT', `Rejected profit credit for order ${profit.orderId}. Reason: ${reason}`, adminId, 'admin');
    this.save();
    return profit;
  }

  public holdResellerProfit(profitId: string, reason: string, adminId?: string): ResellerProfitRecord {
    const profit = this.getResellerProfitById(profitId);
    if (!profit) throw new Error(`Reseller profit record '${profitId}' not found.`);
    if (profit.status === 'APPROVED') {
      throw new Error(`Cannot put an already approved profit on hold.`);
    }

    profit.status = 'ON_HOLD';
    profit.reason = reason || 'Placed on hold for verification';
    profit.updatedAt = new Date().toISOString();

    this.logAudit('HOLD_RESELLER_PROFIT', `Put profit credit for order ${profit.orderId} on hold. Reason: ${reason}`, adminId, 'admin');
    this.save();
    return profit;
  }

  // --- Reseller Account Lifecycle (Activate, Deactivate, Suspend, Safe Delete) ---
  public updateUserStatus(
    userId: string,
    status: 'active' | 'pending_approval' | 'suspended' | 'archived',
    adminId?: string
  ): User | null {
    const user = this.findUserById(userId);
    if (!user) return null;

    const oldStatus = user.status;
    user.status = status;

    // Auto-credit referral bonus to referrer if approved/activated
    if (status === 'active' && oldStatus !== 'active' && user.referredBy && this.data.settings.referralEnabled) {
      const referrer = this.findUserByReferralCode(user.referredBy);
      if (referrer) {
        const commAmount = this.data.settings.referralCommissionAmount || 100;
        const comm = this.createReferralCommission(referrer.id, user.id, commAmount);
        if (comm && comm.status === 'PENDING') {
          this.approveReferralCommission(comm.id, adminId);
        }
      }
    }

    this.logAudit(
      'UPDATE_USER_STATUS',
      `Changed user ${user.name} (${user.email}) status from ${oldStatus} to ${status}`,
      adminId,
      'admin'
    );
    this.save();
    const { passwordHash: _ph, salt: _s, ...clean } = user;
    return clean;
  }

  public deleteUser(userId: string, adminId?: string): { success: boolean; message: string; archived?: boolean } {
    const userIndex = this.data.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new Error(`User '${userId}' not found.`);
    }

    const user = this.data.users[userIndex];
    if (user.role === 'admin') {
      throw new Error('Admin accounts cannot be deleted.');
    }

    // CHECK FINANCIAL HISTORY: Orders, Commissions, Profits, Withdrawals
    const hasOrders = this.data.orders.some((o) => o.resellerId === userId);
    const hasCommissions = this.data.referralCommissions.some((c) => c.referrerId === userId || c.referredUserId === userId);
    const hasProfits = this.data.resellerProfits.some((p) => p.resellerId === userId);
    const hasWithdrawals = this.data.withdrawals.some((w) => w.resellerId === userId);

    if (hasOrders || hasCommissions || hasProfits || hasWithdrawals) {
      // PRESERVE AUDIT TRAIL & FINANCIAL INTEGRITY: ARCHIVE INSTEAD OF HARD DELETE
      user.status = 'archived';
      this.logAudit(
        'ARCHIVE_USER',
        `User ${user.name} (${user.email}) has financial history. Safely archived instead of hard-deleted to preserve ledger integrity.`,
        adminId,
        'admin'
      );
      this.save();
      return {
        success: true,
        archived: true,
        message: `রিসেলারের পূর্ববর্তী আর্থিক ও অর্ডার হিস্ট্রি থাকায় অডিট সুরক্ষার জন্য অ্যাকাউন্টটি স্থায়ীভাবে 'Archived' হিসেবে সংরক্ষণ করা হয়েছে।`,
      };
    }

    // Pure empty test account can be safely deleted
    this.data.users.splice(userIndex, 1);
    this.logAudit('DELETE_USER', `Safely deleted user ${user.name} (${user.email})`, adminId, 'admin');
    this.save();
    return {
      success: true,
      archived: false,
      message: `ব্যবহারকারী অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।`,
    };
  }

  // --- Password Change Management ---
  public changeUserPassword(
    userId: string,
    currentPass: string,
    newPass: string,
    adminId?: string
  ): { success: boolean; message: string } {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('ব্যবহারকারী অ্যাকাউন্ট পাওয়া যায়নি।');
    }

    if (!newPass || newPass.trim().length < 6) {
      throw new Error('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
    }

    // Verify current password
    const valid = verifyPassword(currentPass, user.passwordHash, user.salt);
    if (!valid) {
      throw new Error('বর্তমান পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে আপনার সঠিক বর্তমান পাসওয়ার্ড দিন।');
    }

    const { hash, salt } = hashPassword(newPass.trim());
    user.passwordHash = hash;
    user.salt = salt;

    this.logAudit(
      'CHANGE_PASSWORD',
      `User ${user.email} (${user.role}) changed login password`,
      adminId || userId,
      user.role
    );
    this.save();

    return {
      success: true,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন ও ডাটাবেজে সংরক্ষণ করা হয়েছে।',
    };
  }

  // --- CSV Import / Export ---
  public exportProductsCSV(): string {
    const headers = [
      'ID',
      'SKU',
      'Name',
      'Category',
      'Shop Price',
      'Reseller Price',
      'Regular Price',
      'Stock',
      'Variants',
      'Image URL',
      'Description',
      'Reseller Max Price',
    ];

    const rows = this.data.products.map((p) => {
      const variantsStr = (p.variants || [])
        .map((v) => `${v.name}:${v.options.join(',')}`)
        .join('|');
      const imagesStr = (p.images && p.images.length > 0) ? p.images.join('|') : '';
      const maxPrice = p.resellerMaxPrice ?? Math.round(p.resellerPrice * (1 + (this.data.settings.globalResellerMaxMarkupPercent || 60) / 100));

      const escape = (val: any) => {
        const s = String(val ?? '').replace(/"/g, '""');
        return `"${s}"`;
      };

      return [
        escape(p.id),
        escape(p.sku),
        escape(p.name),
        escape(p.category),
        p.shopPrice,
        p.resellerPrice,
        p.regularPrice,
        p.stock,
        escape(variantsStr),
        escape(imagesStr),
        escape(p.description),
        maxPrice,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  public parseCSVString(csvContent: string): {
    headers: string[];
    rows: Record<string, string>[];
    errors: string[];
  } {
    const errors: string[] = [];
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      errors.push('CSV file is empty or does not contain header and data rows.');
      return { headers: [], rows: [], errors };
    }

    function parseLine(line: string): string[] {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    }

    const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim());

    // Base required headers for backward compatibility
    const requiredHeaders = [
      'ID',
      'SKU',
      'Name',
      'Category',
      'Shop Price',
      'Reseller Price',
      'Regular Price',
      'Stock',
      'Variants',
      'Image URL',
      'Description',
    ];

    const missingHeaders = requiredHeaders.filter((eh) => !headers.includes(eh));
    if (missingHeaders.length > 0) {
      errors.push(`Missing required base columns: ${missingHeaders.join(', ')}`);
    }

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseLine(lines[i]);
      if (cols.length < headers.length) {
        errors.push(`Row ${i + 1}: expected ${headers.length} columns, found ${cols.length}`);
        continue;
      }
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] !== undefined ? cols[idx].replace(/^"|"$/g, '').trim() : '';
      });
      rows.push(rowObj);
    }

    return { headers, rows, errors };
  }

  public previewCSVImport(csvContent: string): {
    total: number;
    validCount: number;
    duplicateCount: number;
    errorCount: number;
    items: Array<{
      rowNumber: number;
      sku: string;
      name: string;
      category: string;
      shopPrice: number;
      resellerPrice: number;
      regularPrice: number;
      resellerMaxPrice: number;
      stock: number;
      status: 'NEW' | 'UPDATE_DUPLICATE' | 'INVALID';
      validationMessage?: string;
    }>;
  } {
    const { rows, errors } = this.parseCSVString(csvContent);
    const existingSkus = new Set(this.data.products.map((p) => p.sku.toUpperCase()));
    const existingIds = new Set(this.data.products.map((p) => p.id));

    let validCount = 0;
    let duplicateCount = 0;
    let errorCount = errors.length;

    const defaultMarkup = this.data.settings.globalResellerMaxMarkupPercent || 60;

    const items = rows.map((r, idx) => {
      const rowNumber = idx + 2;
      const id = r['ID'] || '';
      const sku = r['SKU'] || '';
      const name = r['Name'] || '';
      const category = r['Category'] || 'general';
      const shopPrice = parseFloat(r['Shop Price']) || 0;
      const resellerPrice = parseFloat(r['Reseller Price']) || 0;
      const regularPrice = parseFloat(r['Regular Price']) || shopPrice;
      const stock = parseInt(r['Stock'], 10) || 0;

      // Handle Reseller Max Price: do not interpret blank as 0!
      let resellerMaxPrice: number;
      const existingProduct = this.data.products.find((p) => p.id === id || p.sku.toUpperCase() === sku.toUpperCase());
      const maxPriceStr = r['Reseller Max Price'];

      if (maxPriceStr && maxPriceStr.trim() !== '' && !isNaN(parseFloat(maxPriceStr))) {
        resellerMaxPrice = parseFloat(maxPriceStr);
      } else if (existingProduct && existingProduct.resellerMaxPrice) {
        resellerMaxPrice = existingProduct.resellerMaxPrice;
      } else {
        resellerMaxPrice = Math.round(resellerPrice * (1 + defaultMarkup / 100));
      }

      let status: 'NEW' | 'UPDATE_DUPLICATE' | 'INVALID' = 'NEW';
      let validationMessage = '';

      if (!sku || !name || shopPrice <= 0) {
        status = 'INVALID';
        validationMessage = 'Missing SKU, Name, or positive Shop Price';
        errorCount++;
      } else if (resellerPrice > shopPrice) {
        status = 'INVALID';
        validationMessage = 'Reseller Price cannot be higher than Shop Price';
        errorCount++;
      } else if (resellerMaxPrice < resellerPrice) {
        status = 'INVALID';
        validationMessage = 'Reseller Max Price cannot be lower than Reseller Price';
        errorCount++;
      } else if ((id && existingIds.has(id)) || existingSkus.has(sku.toUpperCase())) {
        status = 'UPDATE_DUPLICATE';
        validationMessage = 'Matches existing SKU or ID (will safely update)';
        duplicateCount++;
        validCount++;
      } else {
        status = 'NEW';
        validationMessage = 'Valid new product';
        validCount++;
      }

      return {
        rowNumber,
        sku,
        name,
        category,
        shopPrice,
        resellerPrice,
        regularPrice,
        resellerMaxPrice,
        stock,
        status,
        validationMessage,
      };
    });

    return {
      total: rows.length,
      validCount,
      duplicateCount,
      errorCount,
      items,
    };
  }

  public commitCSVImport(
    csvContent: string,
    adminId?: string
  ): {
    created: number;
    updated: number;
    errors: string[];
  } {
    const { rows, errors } = this.parseCSVString(csvContent);
    if (errors.length > 0) {
      return { created: 0, updated: 0, errors };
    }

    let created = 0;
    let updated = 0;
    const defaultMarkup = this.data.settings.globalResellerMaxMarkupPercent || 60;

    for (const r of rows) {
      const id = r['ID']?.trim();
      const sku = r['SKU']?.trim();
      const name = r['Name']?.trim();
      const category = r['Category']?.trim() || 'general';
      const shopPrice = parseFloat(r['Shop Price']) || 0;
      const resellerPrice = parseFloat(r['Reseller Price']) || 0;
      const regularPrice = parseFloat(r['Regular Price']) || shopPrice;
      const stock = parseInt(r['Stock'], 10) || 0;
      const variantsRaw = r['Variants']?.trim() || '';
      const imageUrlRaw = r['Image URL']?.trim() || '';
      const additionalImages = r['Additional Image URLs']?.trim() || '';
      const description = r['Description']?.trim() || '';

      if (!sku || !name || shopPrice <= 0) continue;

      // Handle multiple images from pipe separation or extra column
      let imagesList: string[] = [];
      if (imageUrlRaw.includes('|')) {
        imagesList = imageUrlRaw.split('|').map((u) => u.trim()).filter((u) => u.length > 0);
      } else if (imageUrlRaw) {
        imagesList.push(imageUrlRaw);
      }
      if (additionalImages) {
        const extra = additionalImages.split('|').map((u) => u.trim()).filter((u) => u.length > 0);
        imagesList.push(...extra);
      }
      if (imagesList.length === 0) {
        imagesList.push('https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80');
      }

      // Parse variants supporting both "সাইজ: M, L, XL; রং: কালো, নীল" and "Size:M,L|Color:Black"
      const parsedVariants: ProductVariant[] = [];
      if (variantsRaw) {
        const groups = variantsRaw.includes(';') ? variantsRaw.split(';') : variantsRaw.split('|');
        for (const g of groups) {
          const parts = g.split(':');
          if (parts.length === 2) {
            const vName = parts[0].trim();
            const vOpts = parts[1].split(',').map((o) => o.trim()).filter((o) => o.length > 0);
            if (vName && vOpts.length > 0) {
              parsedVariants.push({
                id: `var-${Math.random().toString(36).substring(2, 6)}`,
                name: vName,
                options: vOpts,
              });
            }
          }
        }
      }

      // Check if product exists by ID or SKU
      const existingIdx = this.data.products.findIndex(
        (p) => (id && p.id === id) || p.sku.toUpperCase() === sku.toUpperCase()
      );

      // Handle Reseller Max Price (do not overwrite with 0 if blank!)
      let resellerMaxPrice: number;
      const maxPriceStr = r['Reseller Max Price'];
      if (maxPriceStr && maxPriceStr.trim() !== '' && !isNaN(parseFloat(maxPriceStr))) {
        resellerMaxPrice = parseFloat(maxPriceStr);
      } else if (existingIdx !== -1 && this.data.products[existingIdx].resellerMaxPrice) {
        resellerMaxPrice = this.data.products[existingIdx].resellerMaxPrice!;
      } else {
        resellerMaxPrice = Math.round(resellerPrice * (1 + defaultMarkup / 100));
      }

      if (existingIdx !== -1) {
        const cur = this.data.products[existingIdx];
        this.data.products[existingIdx] = {
          ...cur,
          name,
          category,
          shopPrice,
          resellerPrice,
          regularPrice,
          resellerMaxPrice,
          stock,
          images: imagesList.length > 0 ? imagesList : cur.images,
          variants: parsedVariants.length > 0 ? parsedVariants : cur.variants,
          description: description || cur.description,
          updatedAt: new Date().toISOString(),
        };
        updated++;
      } else {
        const newProduct: Product = {
          id: id && !this.data.products.some((p) => p.id === id) ? id : `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sku,
          name,
          category,
          shopPrice,
          resellerPrice,
          regularPrice,
          resellerMaxPrice,
          stock,
          variants: parsedVariants,
          images: imagesList,
          description,
          isPublished: true,
          createdAt: new Date().toISOString(),
        };
        this.data.products.push(newProduct);
        created++;
      }
    }

    this.logAudit('IMPORT_CSV', `CSV import completed: ${created} created, ${updated} updated`, adminId, 'admin');
    this.save();
    return { created, updated, errors: [] };
  }

  // --- Database Backup & Restore ---
  public createBackup(): { filename: string; jsonContent: string } {
    const filename = `novashop-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const jsonContent = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(path.join(BACKUP_DIR, filename), jsonContent, 'utf8');
    this.logAudit('DATABASE_BACKUP', `Database backup created: ${filename}`);
    return { filename, jsonContent };
  }

  public listBackups(): string[] {
    try {
      if (!fs.existsSync(BACKUP_DIR)) return [];
      return fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json'));
    } catch {
      return [];
    }
  }

  public restoreBackup(jsonContent: string, adminId?: string): boolean {
    const parsed = JSON.parse(jsonContent);
    if (!parsed.settings || !parsed.products || !parsed.orders || !parsed.users) {
      throw new Error('Invalid backup file structure: missing required root entities.');
    }
    // Create safety snapshot of current data before overwriting
    this.createBackup();
    this.data = parsed;
    this.save();
    this.logAudit('DATABASE_RESTORE', 'Database restored from backup archive', adminId, 'admin');
    return true;
  }

  // --- Email Logs ---
  public addEmailLog(log: EmailLog) {
    this.data.emailLogs.unshift(log);
    if (this.data.emailLogs.length > 200) {
      this.data.emailLogs = this.data.emailLogs.slice(0, 200);
    }
    this.save();
  }

  public getEmailLogs(): EmailLog[] {
    return [...this.data.emailLogs];
  }
}

export const db = new Database();
