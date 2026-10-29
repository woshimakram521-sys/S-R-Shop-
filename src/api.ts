import type {
  Product,
  Category,
  Banner,
  DeliveryZone,
  Order,
  User,
  StoreSettings,
  OrderStatus,
  ReferralCommission,
  WithdrawalRequest,
  EmailLog,
  ResellerProfitRecord,
} from './types.js';

let authToken: string | null = null;

// Initialize token from localStorage if available
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('novashop_auth_token');
}

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('novashop_auth_token', token);
  } else {
    localStorage.removeItem('novashop_auth_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch {
      errorMsg = await response.text();
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Store Settings
  getSettings: () => request<StoreSettings & { hasSmtpPass: boolean }>('/api/settings'),
  updateSettings: (data: Partial<StoreSettings>) =>
    request<StoreSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Products
  getProducts: (params?: { category?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.q) query.set('q', params.q);
    return request<Product[]>(`/api/products?${query.toString()}`);
  },
  getProductById: (id: string) => request<Product>(`/api/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    request<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),

  // Categories & Banners
  getCategories: () => request<Category[]>('/api/categories'),
  createCategory: (data: { name: string; banglaName: string; slug?: string; iconName?: string; imageUrl?: string }) =>
    request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: Partial<Category>) =>
    request<Category>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),
  updateCategories: (categories: Category[]) =>
    request<Category[]>('/api/categories', {
      method: 'PUT',
      body: JSON.stringify(categories),
    }),

  // AI Visual Image Search
  searchByImage: (imageBase64: string, mimeType?: string) =>
    request<{
      detectedItem: string;
      matches: Array<{ product: Product; confidence: number; reason: string }>;
      geminiPowered: boolean;
    }>('/api/search/image', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType }),
    }),
  getBanners: () => request<Banner[]>('/api/banners'),
  updateBanners: (banners: Banner[]) =>
    request<Banner[]>('/api/banners', {
      method: 'PUT',
      body: JSON.stringify(banners),
    }),

  // Delivery Zones
  getDeliveryZones: () => request<DeliveryZone[]>('/api/delivery-zones'),
  updateDeliveryZones: (zones: DeliveryZone[]) =>
    request<DeliveryZone[]>('/api/delivery-zones', {
      method: 'PUT',
      body: JSON.stringify(zones),
    }),

  // Orders & Checkout
  createCustomerOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    deliveryZoneId: string;
    items: Array<{ productId: string; quantity: number; selectedVariants?: Record<string, string> }>;
    paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket';
    customerTxId?: string;
    customerSenderPhone?: string;
    notes?: string;
  }) =>
    request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  trackOrder: (orderId: string, phone?: string) => {
    const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    return request<any>(`/api/orders/track/${encodeURIComponent(orderId)}${query}`);
  },

  // Reseller Order with Advance Delivery Payment
  createResellerOrder: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    deliveryZoneId: string;
    items: Array<{
      productId: string;
      quantity: number;
      selectedVariants?: Record<string, string>;
      resellerSellingPrice: number;
    }>;
    advancePayment: {
      paidAmount: number;
      method: 'bkash' | 'nagad' | 'rocket' | 'bank';
      senderPhone?: string;
      txId: string;
      screenshotUrl?: string;
    };
    notes?: string;
  }) =>
    request<Order>('/api/reseller/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getResellerOrders: () => request<Order[]>('/api/reseller/orders'),
  getResellerStats: () =>
    request<{
      totalEarnings: number;
      withdrawnEarnings: number;
      availableBalance: number;
      pendingCommission: number;
      reservedWithdrawal: number;
      pendingProfit: number;
      totalOrders: number;
      pendingVerificationOrders: number;
      deliveredOrders: number;
      referralCode?: string;
    }>('/api/reseller/stats'),

  getResellerReferrals: () =>
    request<{
      referralCode?: string;
      referralEnabled: boolean;
      commissionAmountPerReferral: number;
      discountMode: string;
      discountValue: number;
      commissionBalance: number;
      pendingCommission: number;
      totalReferredCount: number;
      activeReferredCount: number;
      commissions: ReferralCommission[];
    }>('/api/reseller/referrals'),

  getResellerWithdrawals: () => request<WithdrawalRequest[]>('/api/reseller/withdrawals'),
  requestWithdrawal: (data: {
    amount: number;
    payoutMethod: 'bkash' | 'nagad' | 'rocket' | 'bank';
    payoutNumber: string;
  }) =>
    request<WithdrawalRequest>('/api/reseller/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  registerReseller: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    businessName?: string;
    referralCode?: string;
    registrationMethod?: 'bkash' | 'nagad' | 'rocket' | 'bank';
    registrationSenderPhone?: string;
    registrationTxId?: string;
  }) =>
    request<{
      token: string;
      user: User;
      appliedDiscount: number;
      netFee: number;
      message: string;
    }>('/api/auth/register-reseller', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<User>('/api/auth/me'),

  // Admin APIs
  getAdminOrders: (status?: OrderStatus) => {
    const q = status ? `?status=${status}` : '';
    return request<Order[]>(`/api/admin/orders${q}`);
  },
  verifyResellerAdvance: (
    orderId: string,
    action: 'VERIFY' | 'REJECT',
    adminNotes?: string
  ) =>
    request<Order>(`/api/admin/orders/${orderId}/verify-advance`, {
      method: 'POST',
      body: JSON.stringify({ action, adminNotes }),
    }),
  updateOrderStatus: (orderId: string, status: OrderStatus) =>
    request<Order>(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAdminResellers: () => request<User[]>('/api/admin/resellers'),
  verifyResellerRegistrationPayment: (id: string, action: 'VERIFY' | 'REJECT', notes?: string) =>
    request<User>(`/api/admin/resellers/${id}/verify-payment`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    }),
  updateResellerStatus: (id: string, status: User['status']) =>
    request<User>(`/api/admin/resellers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAdminReferrals: () => request<ReferralCommission[]>('/api/admin/referrals'),
  approveReferralCommission: (id: string) =>
    request<ReferralCommission>(`/api/admin/referrals/${id}/approve`, {
      method: 'POST',
    }),
  rejectReferralCommission: (id: string, reason?: string) =>
    request<ReferralCommission>(`/api/admin/referrals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getAdminWithdrawals: () => request<WithdrawalRequest[]>('/api/admin/withdrawals'),
  approveWithdrawal: (id: string, txId: string, adminNotes?: string) =>
    request<WithdrawalRequest>(`/api/admin/withdrawals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ txId, adminNotes }),
    }),
  rejectWithdrawal: (id: string, reason?: string) =>
    request<WithdrawalRequest>(`/api/admin/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Reseller Order Profit Approvals (Section 12)
  getResellerProfits: () => request<ResellerProfitRecord[]>('/api/reseller/profits'),
  getAdminResellerProfits: (status?: string) => {
    const q = status ? `?status=${status}` : '';
    return request<ResellerProfitRecord[]>(`/api/admin/reseller-profits${q}`);
  },
  approveResellerProfit: (
    id: string,
    data?: { deductions?: number; adminNotes?: string }
  ) =>
    request<ResellerProfitRecord>(`/api/admin/reseller-profits/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  rejectResellerProfit: (id: string, reason?: string) =>
    request<ResellerProfitRecord>(`/api/admin/reseller-profits/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  holdResellerProfit: (id: string, reason?: string) =>
    request<ResellerProfitRecord>(`/api/admin/reseller-profits/${id}/hold`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  deleteUser: (id: string) =>
    request<{ success: boolean; message: string; archived?: boolean }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),

  getAdminStats: () => request<any>('/api/admin/stats'),

  // CSV
  previewCSV: (csvContent: string) =>
    request<any>('/api/admin/products/preview-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    }),
  importCSV: (csvContent: string) =>
    request<{ created: number; updated: number; errors: string[] }>('/api/admin/products/import-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent }),
    }),
  exportCSVUrl: () => `/api/admin/products/export-csv`,

  // Backup & Restore
  exportBackupUrl: () => `/api/admin/backup/export`,
  getBackupList: () => request<string[]>('/api/admin/backup/list'),
  restoreBackup: (jsonContent: string) =>
    request<{ success: boolean; message: string }>('/api/admin/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ jsonContent }),
    }),

  // Email Test & Logs
  testEmail: (data: { testRecipient?: string; host?: string; port?: number; user?: string; pass?: string }) =>
    request<{ success: boolean; message: string }>('/api/admin/test-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getEmailLogs: () => request<EmailLog[]>('/api/admin/email-logs'),
  resendEmail: (logId: string) =>
    request<{ success: boolean; log: EmailLog }>(`/api/admin/email-logs/${logId}/resend`, {
      method: 'POST',
    }),
};
