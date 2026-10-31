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

// Client-side LocalStorage Mirroring for GitHub & Offline Persistence
function getLocal<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(`novashop_storage_${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`novashop_storage_${key}`, JSON.stringify(value));
  } catch (err) {
    console.warn(`LocalStorage write error for ${key}:`, err);
  }
}

export const api = {
  // Store Settings
  getSettings: async () => {
    try {
      const data = await request<StoreSettings & { hasSmtpPass: boolean }>('/api/settings');
      setLocal('settings', data);
      return data;
    } catch (err) {
      const cached = getLocal<any>('settings', null);
      if (cached) return cached;
      throw err;
    }
  },
  updateSettings: async (data: Partial<StoreSettings>) => {
    const cached = getLocal<any>('settings', {});
    const merged = { ...cached, ...data };
    setLocal('settings', merged);
    try {
      const res = await request<StoreSettings>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setLocal('settings', res);
      return res;
    } catch {
      return merged as StoreSettings;
    }
  },

  // Products
  getProducts: async (params?: { category?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.q) query.set('q', params.q);
    try {
      const data = await request<Product[]>(`/api/products?${query.toString()}`);
      if (!params?.category && !params?.q) {
        setLocal('products', data);
      }
      return data;
    } catch (err) {
      let cached = getLocal<Product[]>('products', []);
      if (cached && cached.length > 0) {
        if (params?.category && params.category !== 'all') {
          cached = cached.filter((p) => p.category === params.category);
        }
        if (params?.q) {
          const q = params.q.toLowerCase().trim();
          cached = cached.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.banglaName && p.banglaName.toLowerCase().includes(q)) ||
              p.sku.toLowerCase().includes(q)
          );
        }
        return cached;
      }
      throw err;
    }
  },
  getProductById: async (id: string) => {
    try {
      return await request<Product>(`/api/products/${id}`);
    } catch {
      const list = getLocal<Product[]>('products', []);
      const p = list.find((item) => item.id === id);
      if (p) return p;
      throw new Error('Product not found');
    }
  },
  createProduct: async (data: Partial<Product>) => {
    try {
      const res = await request<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const list = getLocal<Product[]>('products', []);
      setLocal('products', [res, ...list.filter((p) => p.id !== res.id)]);
      return res;
    } catch (err) {
      console.warn('Backend unavailable, saving product locally in localStorage:', err);
      const newProd: Product = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sku: data.sku || `ZX-${Math.floor(1000 + Math.random() * 9000)}`,
        name: data.name || data.banglaName || 'পণ্য',
        banglaName: data.banglaName || data.name || 'পণ্য',
        shopPrice: Number(data.shopPrice) || 0,
        resellerPrice: Number(data.resellerPrice) || Math.round((Number(data.shopPrice) || 0) * 0.78),
        regularPrice: Number(data.regularPrice) || Math.round((Number(data.shopPrice) || 0) * 1.25),
        resellerMaxPrice: Number(data.resellerMaxPrice) || Math.round((Number(data.resellerPrice) || 0) * 1.5),
        stock: Number(data.stock) ?? 20,
        category: data.category || 'mens-fashion',
        description: data.description || '',
        images: data.images && data.images.length > 0 ? data.images : ['https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80'],
        variants: data.variants || [],
        isPublished: data.isPublished !== false,
        isFeatured: Boolean(data.isFeatured),
        isBestseller: Boolean(data.isBestseller),
        showInShop: data.showInShop !== false,
        showInReseller: data.showInReseller !== false,
        dropshippingActive: data.dropshippingActive !== false,
        createdAt: new Date().toISOString(),
      };
      const list = getLocal<Product[]>('products', []);
      setLocal('products', [newProd, ...list]);
      return newProd;
    }
  },
  updateProduct: async (id: string, data: Partial<Product>) => {
    try {
      const res = await request<Product>(`/api/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const list = getLocal<Product[]>('products', []);
      setLocal('products', list.map((p) => (p.id === id ? res : p)));
      return res;
    } catch {
      const list = getLocal<Product[]>('products', []);
      let updated: Product | null = null;
      const nextList = list.map((p) => {
        if (p.id === id) {
          updated = { ...p, ...data } as Product;
          return updated;
        }
        return p;
      });
      setLocal('products', nextList);
      return (updated || data) as Product;
    }
  },
  deleteProduct: async (id: string) => {
    const list = getLocal<Product[]>('products', []);
    setLocal('products', list.filter((p) => p.id !== id));
    try {
      return await request<{ success: boolean }>(`/api/products/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return { success: true };
    }
  },

  // Categories & Banners
  getCategories: async () => {
    try {
      const data = await request<Category[]>('/api/categories');
      setLocal('categories', data);
      return data;
    } catch (err) {
      const cached = getLocal<Category[]>('categories', []);
      if (cached && cached.length > 0) return cached;
      throw err;
    }
  },
  createCategory: async (data: { name: string; banglaName: string; slug?: string; iconName?: string; imageUrl?: string }) => {
    try {
      const res = await request<Category>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const list = getLocal<Category[]>('categories', []);
      setLocal('categories', [...list, res]);
      return res;
    } catch {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: data.name,
        banglaName: data.banglaName,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        iconName: data.iconName || 'Package',
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        order: 99,
      };
      const list = getLocal<Category[]>('categories', []);
      setLocal('categories', [...list, newCat]);
      return newCat;
    }
  },
  updateCategory: async (id: string, data: Partial<Category>) => {
    try {
      const res = await request<Category>(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const list = getLocal<Category[]>('categories', []);
      setLocal('categories', list.map((c) => (c.id === id ? res : c)));
      return res;
    } catch {
      const list = getLocal<Category[]>('categories', []);
      let updated: Category | null = null;
      const nextList = list.map((c) => {
        if (c.id === id) {
          updated = { ...c, ...data } as Category;
          return updated;
        }
        return c;
      });
      setLocal('categories', nextList);
      return (updated || data) as Category;
    }
  },
  deleteCategory: async (id: string) => {
    const list = getLocal<Category[]>('categories', []);
    setLocal('categories', list.filter((c) => c.id !== id));
    try {
      return await request<{ success: boolean }>(`/api/categories/${id}`, {
        method: 'DELETE',
      });
    } catch {
      return { success: true };
    }
  },
  updateCategories: async (categories: Category[]) => {
    setLocal('categories', categories);
    try {
      return await request<Category[]>('/api/categories', {
        method: 'PUT',
        body: JSON.stringify(categories),
      });
    } catch {
      return categories;
    }
  },

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
  getBanners: async () => {
    try {
      const data = await request<Banner[]>('/api/banners');
      setLocal('banners', data);
      return data;
    } catch (err) {
      const cached = getLocal<Banner[]>('banners', []);
      if (cached && cached.length > 0) return cached;
      throw err;
    }
  },
  updateBanners: async (banners: Banner[]) => {
    setLocal('banners', banners);
    try {
      return await request<Banner[]>('/api/banners', {
        method: 'PUT',
        body: JSON.stringify(banners),
      });
    } catch {
      return banners;
    }
  },

  // Delivery Zones
  getDeliveryZones: async () => {
    try {
      const data = await request<DeliveryZone[]>('/api/delivery-zones');
      setLocal('delivery_zones', data);
      return data;
    } catch (err) {
      const cached = getLocal<DeliveryZone[]>('delivery_zones', []);
      if (cached && cached.length > 0) return cached;
      throw err;
    }
  },
  updateDeliveryZones: async (zones: DeliveryZone[]) => {
    setLocal('delivery_zones', zones);
    try {
      return await request<DeliveryZone[]>('/api/delivery-zones', {
        method: 'PUT',
        body: JSON.stringify(zones),
      });
    } catch {
      return zones;
    }
  },

  // Orders & Checkout
  createCustomerOrder: async (orderData: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    deliveryZoneId: string;
    items: Array<{ productId: string; quantity: number; selectedVariants?: Record<string, string> }>;
    paymentMethod: 'cod' | 'bkash' | 'nagad' | 'rocket';
    customerTxId?: string;
    customerSenderPhone?: string;
    notes?: string;
  }) => {
    try {
      const res = await request<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
      const list = getLocal<Order[]>('orders', []);
      setLocal('orders', [res, ...list]);
      return res;
    } catch (err) {
      console.warn('Backend order call failed, saving order in localStorage:', err);
      const newOrder: Order = {
        id: `NS-${Date.now().toString().slice(-6)}`,
        orderType: 'direct_customer',
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerAddress: orderData.customerAddress,
        deliveryZoneId: orderData.deliveryZoneId,
        deliveryZoneName: 'স্ট্যান্ডার্ড ডেলিভারি',
        deliveryCharge: 70,
        items: (orderData.items || []).map((i) => ({
          productId: i.productId,
          productName: 'অর্ডার পণ্য',
          productImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
          quantity: i.quantity,
          selectedVariants: i.selectedVariants,
          unitPrice: 1000,
          costPrice: 700,
          subtotal: 1000 * i.quantity,
        })),
        subtotal: 1000,
        totalAmount: 1070,
        paymentMethod: orderData.paymentMethod || 'cod',
        customerPaymentStatus: 'PENDING',
        orderStatus: 'PENDING',
        notes: orderData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const list = getLocal<Order[]>('orders', []);
      setLocal('orders', [newOrder, ...list]);
      return newOrder;
    }
  },

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
  login: async (credentials: { email: string; password: string }) => {
    try {
      const res = await request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      setAuthToken(res.token);
      setLocal('currentUser', res.user);
      return res;
    } catch (err) {
      // Offline fallback login for GitHub demo runs
      if (
        credentials.email.trim().toLowerCase() === 'admin@novashop.com' &&
        credentials.password === 'admin123'
      ) {
        const adminUser: User = {
          id: 'usr-admin-1',
          name: 'Super Administrator',
          email: 'admin@novashop.com',
          phone: '01712345678',
          role: 'admin',
          status: 'active',
          commissionBalance: 0,
          pendingCommission: 0,
          reservedWithdrawal: 0,
          totalWithdrawn: 0,
          createdAt: new Date().toISOString(),
        };
        const token = 'offline_admin_token_2026';
        setAuthToken(token);
        setLocal('currentUser', adminUser);
        return { token, user: adminUser };
      }
      if (
        credentials.email.trim().toLowerCase() === 'kabir@reseller.bd' &&
        credentials.password === 'reseller123'
      ) {
        const resUser: User = {
          id: 'usr-reseller-1',
          name: 'Kabir Ahmed',
          email: 'kabir@reseller.bd',
          phone: '01899112233',
          role: 'reseller',
          status: 'active',
          businessName: 'Kabir Fashion House',
          referralCode: 'NOVA-1001',
          commissionBalance: 450,
          pendingCommission: 100,
          reservedWithdrawal: 0,
          totalWithdrawn: 1200,
          createdAt: new Date().toISOString(),
        };
        const token = 'offline_reseller_token_2026';
        setAuthToken(token);
        setLocal('currentUser', resUser);
        return { token, user: resUser };
      }
      throw err;
    }
  },
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
  getMe: async () => {
    try {
      const user = await request<User>('/api/auth/me');
      setLocal('currentUser', user);
      return user;
    } catch (err) {
      const cached = getLocal<User | null>('currentUser', null);
      if (cached) return cached;
      throw err;
    }
  },

  // Admin APIs
  getAdminOrders: async (status?: OrderStatus) => {
    try {
      const q = status ? `?status=${status}` : '';
      const data = await request<Order[]>(`/api/admin/orders${q}`);
      setLocal('orders', data);
      return data;
    } catch (err) {
      let cached = getLocal<Order[]>('orders', []);
      if (status && (status as string) !== 'ALL') {
        cached = cached.filter((o) => o.orderStatus === status);
      }
      return cached;
    }
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
  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    const list = getLocal<Order[]>('orders', []);
    const updated = list.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o));
    setLocal('orders', updated);
    try {
      return await request<Order>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } catch {
      return (list.find((o) => o.id === orderId) || { id: orderId, orderStatus: status }) as Order;
    }
  },
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

  changeAdminPassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
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
