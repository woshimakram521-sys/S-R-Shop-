export interface ProductVariant {
  id: string;
  name: string; // e.g. "Size", "Color"
  options: string[]; // e.g. ["M", "L", "XL"] or ["Black", "Navy"]
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  banglaName?: string;
  category: string;
  shopPrice: number;      // Regular customer storefront selling price
  resellerPrice: number;  // Wholesale cost price for verified resellers
  regularPrice: number;   // Original strikethrough/MRP price (e.g. 1200 BDT)
  resellerMaxPrice?: number; // Configurable upper price limit for resellers
  stock: number;
  variants: ProductVariant[];
  images: string[];       // Multiple image URLs
  description: string;
  banglaDescription?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isPublished: boolean;
  showInShop?: boolean;
  showInReseller?: boolean;
  dropshippingActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  banglaName: string;
  charge: number;
  estimatedDays: string;
  banglaEstimatedDays: string;
  isActive: boolean;
}

export interface ResellerAdvancePayment {
  requiredAmount: number;
  paidAmount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'bank';
  senderPhone?: string;
  txId: string;
  screenshotUrl?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  verifiedBy?: string;
  adminNotes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productBanglaName?: string;
  productImage: string;
  selectedVariants?: Record<string, string>;
  quantity: number;
  unitPrice: number;      // Sold price to customer
  costPrice: number;      // Reseller wholesale price (if reseller order)
  subtotal: number;
}

export type OrderStatus = 
  | 'PENDING'
  | 'PAYMENT_VERIFIED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Order {
  id: string; // e.g. NS-2610-101
  orderType: 'direct_customer' | 'reseller_order';
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  deliveryZoneId: string;
  deliveryZoneName: string;
  deliveryCharge: number;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket';
  customerPaymentStatus: 'PENDING' | 'PAID';
  customerTxId?: string;
  customerSenderPhone?: string;
  
  // Reseller specific fields
  resellerId?: string;
  resellerName?: string;
  resellerPhone?: string;
  resellerSellingPriceTotal?: number;
  resellerProfit?: number;
  resellerAdvancePayment?: ResellerAdvancePayment;
  
  orderStatus: OrderStatus;
  notes?: string;
  customerNote?: string;
  resellerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResellerProfitRecord {
  id: string; // e.g. "prof-NS-2610-101"
  orderId: string;
  resellerId: string;
  resellerName: string;
  resellerPhone?: string;
  customerName: string;
  sellingTotal: number;
  wholesaleTotal: number;
  profitAmount: number;
  deductions?: number;
  netProfit: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ON_HOLD' | 'REVERSED';
  reason?: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'reseller' | 'customer';
  status: 'active' | 'pending_approval' | 'suspended' | 'archived';
  businessName?: string;
  
  // Registration Fee & Manual Payment Verification
  registrationFeePaid?: boolean;
  registrationTxId?: string;
  registrationMethod?: 'bkash' | 'nagad' | 'rocket' | 'bank';
  registrationSenderPhone?: string;
  registrationFeeSnapshot?: number;
  appliedReferralDiscount?: number;
  regPaymentStatus?: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  paymentRejectionReason?: string;

  // Referral System
  referralCode?: string;          // Unique code for this reseller e.g. "NOVA-928"
  referredBy?: string;            // The referral code used when signing up (locked)

  // Commission & Wallet Ledger
  commissionBalance: number;      // Approved & available to withdraw (includes approved profits + approved referral commissions)
  pendingCommission: number;      // Pending admin verification (referral commissions + pending order profits)
  reservedWithdrawal: number;    // Locked while withdrawal is in review
  totalWithdrawn: number;         // Historical completed withdrawals

  payoutAccount?: {
    method: 'bkash' | 'nagad' | 'rocket' | 'bank';
    accountNumber: string;
    accountHolderName?: string;
  };

  createdAt: string;
}

export interface ReferralCommission {
  id: string;
  referrerId: string;
  referrerName: string;
  referredUserId: string;
  referredUserName: string;
  referralCode: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVERSED';
  adminNotes?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  resellerId: string;
  resellerName: string;
  resellerPhone: string;
  amount: number;
  payoutMethod: 'bkash' | 'nagad' | 'rocket' | 'bank';
  payoutNumber: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  txId?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  event: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  errorDetails?: string;
  timestamp: string;
}

export interface Banner {
  id: string;
  title: string;
  banglaTitle: string;
  subtitle: string;
  banglaSubtitle: string;
  tag: string;
  imageUrl: string;
  buttonText: string;
  banglaButtonText: string;
  linkUrl: string;
  backgroundColor: string;
  isActive: boolean;
  order: number;
}

export interface StoreSettings {
  shopName: string;
  banglaShopName: string;
  tagline: string;
  banglaTagline: string;
  logoUrl: string;
  contactPhone: string;
  helplinePhone: string;
  contactEmail: string;
  address: string;
  tradeLicense: string;
  currencySymbol: string;
  
  // Reseller Rules
  minResellerAdvance: number; // e.g. 50 BDT minimum
  resellerRegistrationFee: number; // e.g. 200 BDT
  autoApproveResellers: boolean;
  globalResellerMaxMarkupPercent: number; // Default upper price cap markup (e.g. 50% above resellerPrice)

  // Referral System Settings
  referralEnabled: boolean;
  referralDiscountMode: 'half' | 'fixed' | 'percentage';
  referralDiscountValue: number; // e.g. 100 BDT or 50%
  referralCommissionAmount: number; // e.g. 50 BDT fixed reward per approved referral
  minWithdrawalAmount: number; // e.g. 500 BDT minimum

  // WhatsApp Floating Button Settings
  whatsappNumber?: string;
  whatsappEnabled?: boolean;
  
  // Payment Accounts
  bkashNumber: string;
  bkashType: string;
  bkashInstructions: string;
  nagadNumber: string;
  nagadType: string;
  nagadInstructions: string;
  rocketNumber: string;
  rocketType: string;
  
  // SMTP settings
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string; // Stored server-side only
  hasSmtpPass?: boolean; // Returned by server indicating if password is saved
  smtpFrom?: string;
  testEmailRecipient?: string;
  emailNotificationsEnabled: boolean;
  emailRecipients: string[];
  emailNotificationEvents: {
    newShopOrder: boolean;
    newResellerOrder: boolean;
    resellerRegistration: boolean;
    resellerApproved: boolean;
    registrationPaymentSubmitted: boolean;
    advancePaymentSubmitted: boolean;
    advancePaymentVerified: boolean;
    orderStatusChanged: boolean;
    profitCredited: boolean;
    commissionApproved: boolean;
    withdrawalRequested: boolean;
    withdrawalPaid: boolean;
    productChanged: boolean;
    backupCreated: boolean;
    systemError: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  banglaName: string;
  slug: string;
  iconName: string;
  imageUrl: string;
  order: number;
}
