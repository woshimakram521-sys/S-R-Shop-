import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Shield,
  TrendingUp,
  Package,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Download,
  Settings,
  Database,
  Users,
  Search,
  Filter,
  LogOut,
  Truck,
  DollarSign,
  Plus,
  Trash2,
  Edit,
  Check,
  Send,
  Eye,
  RefreshCw,
  Mail,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Wallet,
  Gift,
  Layers,
  Image as ImageIcon,
  Camera,
  RotateCcw,
  Phone,
  Bell,
  Tag,
} from 'lucide-react';
import type {
  DeliveryZone,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
  User,
  ReferralCommission,
  WithdrawalRequest,
  EmailLog,
  ResellerProfitRecord,
  Category,
} from '../types.js';
import { api, setAuthToken } from '../api.js';

interface AdminDashboardProps {
  isOpen?: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
  deliveryZones: DeliveryZone[];
  settings: StoreSettings | null;
  onRefreshSettings: () => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  lang: 'bn' | 'en';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen = true,
  onClose,
  products,
  onRefreshProducts,
  deliveryZones,
  settings,
  onRefreshSettings,
  currentUser,
  setCurrentUser,
  lang,
}) => {
  // UNCONDITIONAL HOOK INITIALIZATIONS AT VERY TOP
  const [adminEmail, setAdminEmail] = useState('admin@novashop.com');
  const [adminPassword, setAdminPassword] = useState('Admin@Nova2025!');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Admin Navigation (Points 3, 4, 10)
  const [activeNav, setActiveNav] = useState<
    | 'stats'
    | 'shop_orders'
    | 'reseller_orders'
    | 'products'
    | 'categories'
    | 'resellers'
    | 'referrals'
    | 'profits'
    | 'withdrawals'
    | 'csv'
    | 'settings'
    | 'backup'
  >('stats');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Stats
  const [adminStats, setAdminStats] = useState<any>(null);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopOrderStatusFilter, setShopOrderStatusFilter] = useState<string>('ALL');
  const [resellerOrderStatusFilter, setResellerOrderStatusFilter] = useState<string>('ALL');
  const [selectedOrderForAdvance, setSelectedOrderForAdvance] = useState<Order | null>(null);
  const [advanceNotes, setAdvanceNotes] = useState('');

  // Categories (Point 10)
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBanglaName, setNewCatBanglaName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Package');
  const [newCatImage, setNewCatImage] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Resellers & Registration Verifications
  const [resellers, setResellers] = useState<User[]>([]);

  // Referrals & Commissions
  const [referralCommissions, setReferralCommissions] = useState<ReferralCommission[]>([]);

  // Reseller Profits (Section 12: Reseller Profit Approval)
  const [resellerProfits, setResellerProfits] = useState<ResellerProfitRecord[]>([]);
  const [profitStatusFilter, setProfitStatusFilter] = useState<string>('ALL');
  const [selectedProfitForReview, setSelectedProfitForReview] = useState<ResellerProfitRecord | null>(null);
  const [profitDeductions, setProfitDeductions] = useState<number>(0);
  const [profitReviewNotes, setProfitReviewNotes] = useState<string>('');

  // Withdrawals
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedWithdrawalForPay, setSelectedWithdrawalForPay] = useState<WithdrawalRequest | null>(null);
  const [payoutTxId, setPayoutTxId] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');

  // Product Editing / Creation Modal (Point 6)
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [variantsText, setVariantsText] = useState('সাইজ: M, L, XL\nরং: কালো, নীল');

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [csvParsing, setCsvParsing] = useState(false);

  // Email Test & Logs (Point 2, 7)
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [showEmailLogs, setShowEmailLogs] = useState(false);
  const [resendingLogId, setResendingLogId] = useState<string | null>(null);

  // Editable Settings form
  const [editSettings, setEditSettings] = useState<any>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  // Backup file state
  const [backupList, setBackupList] = useState<string[]>([]);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  useEffect(() => {
    if (settings) {
      setEditSettings({
        ...settings,
        smtpPass: '', // Keep empty by default so saved password isn't overwritten
      });
      setTestEmailRecipient(settings.contactEmail || 'admin@novashop.com');
    }
  }, [settings]);

  const loadAdminData = async () => {
    if (!isAdmin) return;
    try {
      const [statsData, ordersData, resellersData, referralsData, profitsData, withdrawalsData, categoriesData] =
        await Promise.all([
          api.getAdminStats().catch(() => null),
          api.getAdminOrders().catch(() => []),
          api.getAdminResellers().catch(() => []),
          api.getAdminReferrals().catch(() => []),
          api.getAdminResellerProfits().catch(() => []),
          api.getAdminWithdrawals().catch(() => []),
          api.getCategories().catch(() => []),
        ]);

      if (statsData) setAdminStats(statsData);
      setOrders(ordersData || []);
      setResellers(resellersData || []);
      setReferralCommissions(referralsData || []);
      setResellerProfits(profitsData || []);
      setWithdrawals(withdrawalsData || []);
      setCategoriesList(categoriesData || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, activeNav]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await api.login({ email: adminEmail, password: adminPassword });
      if (res.user.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.');
      }
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setFeedbackMsg({ type: 'success', text: 'Welcome back, Administrator!' });
      loadAdminData();
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      setLoading(true);
      await api.updateOrderStatus(orderId, status);
      const isCompleted = status === 'DELIVERED' || status === 'COMPLETED';
      setFeedbackMsg({
        type: 'success',
        text: isCompleted
          ? `অর্ডার #${orderId} সফলভাবে '${status}' করা হয়েছে। রিসেলার অর্ডার হলে লাভ স্বয়ংক্রিয়ভাবে Available Balance-এ ক্রেডিট হয়েছে।`
          : `অর্ডার #${orderId} স্ট্যাটাস পরিবর্তন করে '${status}' করা হয়েছে।`,
      });
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update order status' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAdvance = async (orderId: string, action: 'VERIFY' | 'REJECT') => {
    try {
      setLoading(true);
      await api.verifyResellerAdvance(orderId, action, advanceNotes);
      setFeedbackMsg({
        type: 'success',
        text: action === 'VERIFY' ? 'অগ্রিম ডেলিভারি পেমেন্ট সফলভাবে যাচাই করা হয়েছে।' : 'অগ্রিম পেমেন্ট বাতিল করা হয়েছে।',
      });
      setSelectedOrderForAdvance(null);
      setAdvanceNotes('');
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResellerPayment = async (userId: string, action: 'VERIFY' | 'REJECT') => {
    try {
      setLoading(true);
      await api.verifyResellerRegistrationPayment(userId, action, 'Verified by administrator');
      setFeedbackMsg({
        type: 'success',
        text: action === 'VERIFY'
          ? 'রিসেলার রেজিস্ট্রেশন সফলভাবে অনুমোদন করা হয়েছে এবং রেফারার থাকলে অটো রেফারেল বোনাস ক্রেডিট হয়েছে।'
          : 'রিসেলার রেজিস্ট্রেশন পেমেন্ট বাতিল করা হয়েছে।',
      });
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommission = async (commId: string) => {
    try {
      setLoading(true);
      await api.approveReferralCommission(commId);
      setFeedbackMsg({ type: 'success', text: 'রেফারেল কমিশন সফলভাবে অনুমোদন ও রিসেলারের ব্যালেন্সে যোগ করা হয়েছে।' });
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to approve commission' });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWithdrawalForPay || !payoutTxId.trim()) return;
    try {
      setLoading(true);
      await api.approveWithdrawal(selectedWithdrawalForPay.id, payoutTxId.trim(), payoutNotes);
      setFeedbackMsg({ type: 'success', text: `উইথড্রল পরিশোধ সফল! TrxID: ${payoutTxId}` });
      setSelectedWithdrawalForPay(null);
      setPayoutTxId('');
      setPayoutNotes('');
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to process payout' });
    } finally {
      setLoading(false);
    }
  };

  // --- Category Management (Point 10) ---
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatBanglaName.trim()) {
      setFeedbackMsg({ type: 'error', text: 'ক্যাটাগরির নাম ও বাংলা নাম আবশ্যক।' });
      return;
    }
    try {
      setLoading(true);
      await api.createCategory({
        name: newCatName.trim(),
        banglaName: newCatBanglaName.trim(),
        slug: newCatSlug.trim() || undefined,
        iconName: newCatIcon,
        imageUrl: newCatImage.trim() || undefined,
      });
      setFeedbackMsg({ type: 'success', text: `নতুন ক্যাটাগরি '${newCatBanglaName}' সফলভাবে তৈরি হয়েছে!` });
      setNewCatName('');
      setNewCatBanglaName('');
      setNewCatSlug('');
      setNewCatImage('');
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'ক্যাটাগরি তৈরি ব্যর্থ হয়েছে' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    setCategoryToDelete(cat);
  };

  const confirmDeleteCategory = async (catId: string, name: string) => {
    try {
      setLoading(true);
      await api.deleteCategory(catId);
      setFeedbackMsg({ type: 'success', text: `'${name}' ক্যাটাগরি সফলভাবে মোছা হয়েছে।` });
      setCategoryToDelete(null);
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'ক্যাটাগরি মোছা ব্যর্থ হয়েছে' });
    } finally {
      setLoading(false);
    }
  };

  // --- Product Multi-Image File Upload (Point 6) ---
  const handleImageFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageUploadLoading(true);
    const fileList = Array.from(files);
    let loadedCount = 0;
    const newImages: string[] = [];

    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        loadedCount++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress via Canvas to ensure lightweight, crisp base64 data URLs that persist forever in database
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            newImages.push(compressedDataUrl);
          }

          loadedCount++;
          if (loadedCount === fileList.length) {
            setEditingProduct((prev) => ({
              ...prev,
              images: [...(prev?.images || []), ...newImages],
            }));
            setImageUploadLoading(false);
            if (multiFileInputRef.current) multiFileInputRef.current.value = '';
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    if (!editingProduct?.images) return;
    const imgs = [...editingProduct.images];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= imgs.length) return;
    const temp = imgs[index];
    imgs[index] = imgs[targetIndex];
    imgs[targetIndex] = temp;
    setEditingProduct({ ...editingProduct, images: imgs });
  };

  const handleRemoveImage = (index: number) => {
    if (!editingProduct?.images) return;
    const imgs = editingProduct.images.filter((_, i) => i !== index);
    setEditingProduct({ ...editingProduct, images: imgs });
  };

  const handleSaveProduct = async (e?: React.FormEvent, isDraft = false) => {
    if (e) e.preventDefault();
    if (!editingProduct) return;
    try {
      setLoading(true);
      const parsedVariants = variantsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l, idx) => {
          const parts = l.split(':');
          if (parts.length > 1) {
            return {
              id: `v-${idx + 1}`,
              name: parts[0].trim(),
              options: parts.slice(1).join(':').split(',').map((s) => s.trim()).filter(Boolean),
            };
          }
          return { id: `v-${idx + 1}`, name: 'ভ্যারিয়েন্ট', options: [l] };
        });

      const shopPrice = Number(editingProduct.shopPrice) || 0;
      const resellerPrice = Number(editingProduct.resellerPrice) > 0 
        ? Number(editingProduct.resellerPrice) 
        : Math.round(shopPrice * 0.78);
      const regularPrice = Number(editingProduct.regularPrice) > 0
        ? Number(editingProduct.regularPrice)
        : Math.round(shopPrice * 1.25);
      const resellerMaxPrice = Number(editingProduct.resellerMaxPrice) > 0
        ? Number(editingProduct.resellerMaxPrice)
        : Math.round(resellerPrice * 1.5);

      const productPayload: Partial<Product> = {
        ...editingProduct,
        name: editingProduct.name || editingProduct.banglaName || 'পণ্য',
        banglaName: editingProduct.banglaName || editingProduct.name || 'পণ্য',
        shopPrice,
        resellerPrice,
        regularPrice,
        resellerMaxPrice,
        stock: Number(editingProduct.stock) ?? 20,
        variants: parsedVariants,
        isPublished: isDraft ? false : (editingProduct.isPublished !== false),
        showInShop: editingProduct.showInShop !== false,
        showInReseller: editingProduct.showInReseller !== false,
        dropshippingActive: editingProduct.dropshippingActive !== false,
      };

      if (isNewProduct) {
        await api.createProduct(productPayload);
        setFeedbackMsg({
          type: 'success',
          text: isDraft ? 'পণ্যটি ড্রাফট হিসেবে সংরক্ষিত হয়েছে!' : 'পণ্যটি সফলভাবে যোগ করা হয়েছে!',
        });
      } else {
        await api.updateProduct(editingProduct.id!, productPayload);
        setFeedbackMsg({
          type: 'success',
          text: isDraft ? 'পণ্যটি ড্রাফট হিসেবে আপডেট হয়েছে!' : 'পণ্যটির তথ্য সফলভাবে আপডেট হয়েছে!',
        });
      }
      setEditingProduct(null);
      onRefreshProducts();
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'পণ্য সংরক্ষণ ব্যর্থ হয়েছে' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = (p: Product) => {
    setProductToDelete(p);
  };

  const confirmDeleteProduct = async (id: string) => {
    try {
      setLoading(true);
      // Optimistic instant UI update
      setLocalProducts((prev) => prev.filter((p) => p.id !== id));
      await api.deleteProduct(id);
      setFeedbackMsg({ type: 'success', text: 'পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।' });
      setProductToDelete(null);
      onRefreshProducts();
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'পণ্য মোছা ব্যর্থ হয়েছে' });
      setLocalProducts(products); // Revert on failure
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewProduct = () => {
    setEditingProduct({
      name: '',
      banglaName: '',
      sku: `ZX-${Math.floor(1000 + Math.random() * 9000)}`,
      shopPrice: 0,
      resellerPrice: 0,
      resellerMaxPrice: 0,
      regularPrice: 0,
      category: categoriesList[0]?.slug || 'mens-fashion',
      stock: 20,
      description: '',
      images: [],
      variants: [],
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      showInShop: true,
      showInReseller: true,
      dropshippingActive: true,
    });
    setVariantsText('সাইজ: M, L, XL\nরং: কালো, নীল');
    setIsNewProduct(true);
  };

  const handleStartEditProduct = (p: Product) => {
    setEditingProduct({ ...p });
    if (p.variants && p.variants.length > 0) {
      setVariantsText(p.variants.map((v) => `${v.name}: ${v.options.join(', ')}`).join('\n'));
    } else {
      setVariantsText('');
    }
    setIsNewProduct(false);
  };

  const handleDuplicateProduct = async (p: Product) => {
    try {
      setLoading(true);
      const newSku = `ZX-${Math.floor(1000 + Math.random() * 9000)}`;
      const duplicated: Partial<Product> = {
        ...p,
        sku: newSku,
        name: `${p.name} (Copy)`,
        banglaName: p.banglaName ? `${p.banglaName} (কপি)` : `${p.name} (কপি)`,
      };
      delete (duplicated as any).id;
      await api.createProduct(duplicated);
      setFeedbackMsg({ type: 'success', text: `পণ্যটি সফলভাবে কপি করা হয়েছে! নতুন SKU: ${newSku}` });
      onRefreshProducts();
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'পণ্য কপি ব্যর্থ হয়েছে' });
    } finally {
      setLoading(false);
    }
  };

  // --- Settings Save with Password Safeguard (Point 2) ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSettings) return;
    try {
      setLoading(true);
      const payload = { ...editSettings };
      // Only include smtpPass if admin typed a new one, otherwise keep saved
      if (newPasswordInput.trim() !== '') {
        payload.smtpPass = newPasswordInput.trim();
      } else {
        delete payload.smtpPass;
      }

      const updated = await api.updateSettings(payload);
      setFeedbackMsg({ type: 'success', text: 'সিস্টেম সেটিংস ও জিমেইল কনফিগারেশন নিরাপদে সংরক্ষিত হয়েছে।' });
      setNewPasswordInput('');
      onRefreshSettings();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setEmailTesting(true);
    try {
      const payload: any = { testRecipient: testEmailRecipient.trim() };
      if (newPasswordInput.trim() !== '') {
        payload.pass = newPasswordInput.trim();
      }
      const res = await api.testEmail(payload);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `টেস্ট ইমেইল সফলভাবে পাঠানো হয়েছে: ${res.message}` });
      } else {
        setFeedbackMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'SMTP Connection Test Failed' });
    } finally {
      setEmailTesting(false);
      loadEmailLogs();
    }
  };

  const loadEmailLogs = async () => {
    try {
      const logs = await api.getEmailLogs();
      setEmailLogs(logs);
      setShowEmailLogs(true);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to fetch email logs' });
    }
  };

  const handleResendEmail = async (logId: string) => {
    setResendingLogId(logId);
    try {
      const res = await api.resendEmail(logId);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'ইমেইল সফলভাবে পুনরায় পাঠানো হয়েছে।' });
      } else {
        setFeedbackMsg({ type: 'error', text: res.log.errorDetails || 'Failed to resend' });
      }
      loadEmailLogs();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Resend failed' });
    } finally {
      setResendingLogId(null);
    }
  };

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      setCsvParsing(true);
      try {
        const preview = await api.previewCSV(text);
        setCsvPreview(preview);
      } catch (err: any) {
        setFeedbackMsg({ type: 'error', text: err.message || 'Invalid CSV structure' });
      } finally {
        setCsvParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCommitCsvImport = async () => {
    if (!csvContent) return;
    try {
      setLoading(true);
      const res = await api.importCSV(csvContent);
      setFeedbackMsg({
        type: 'success',
        text: `CSV ইমপোর্ট সফল: ${res.created}টি নতুন পণ্য তৈরি এবং ${res.updated}টি পণ্য আপডেট করা হয়েছে।`,
      });
      setCsvContent('');
      setCsvPreview(null);
      onRefreshProducts();
      loadAdminData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'CSV Import failed' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Split Orders into Shop Orders vs Reseller Orders (Point 4)
  const shopOrders = orders.filter((o) => o.orderType !== 'reseller_order' && !o.resellerId);
  const resellerOrders = orders.filter((o) => o.orderType === 'reseller_order' || Boolean(o.resellerId));

  const filteredShopOrders = shopOrders.filter((o) => {
    if (shopOrderStatusFilter === 'ALL') return true;
    return o.orderStatus === shopOrderStatusFilter;
  });

  const filteredResellerOrders = resellerOrders.filter((o) => {
    if (resellerOrderStatusFilter === 'ALL') return true;
    if (resellerOrderStatusFilter === 'PENDING_ADVANCE') {
      return o.resellerAdvancePayment?.status === 'PENDING_VERIFICATION';
    }
    return o.orderStatus === resellerOrderStatusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col overflow-y-auto">
      {/* Top Announcement Bar - Red Banner (Matching Screenshot 1) */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white text-[11px] sm:text-xs py-1.5 px-3 font-semibold shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>
              🚚 🎉 সমগ্র বাংলাদেশে হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি সুবিধা! ঢাকার ভেতরে ডেলিভারি চার্জ মাত্র ৮০ টাকা, ঢাকার বাইরে ১৫০ টাকা!
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-rose-100">
            <span>হেল্পলাইন: {settings?.contactPhone || '01712-345678'}</span>
            <span>|</span>
            <button onClick={onClose} className="hover:text-white underline cursor-pointer">
              স্টোরে ফিরুন
            </button>
          </div>
        </div>
      </div>

      {/* Admin Navbar matching Screenshot 1 */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-2 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="স্টোরে ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-rose-600/30">
              {((settings?.shopName || 'ZX').slice(0, 2)).toUpperCase()}
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                {settings?.banglaShopName || 'ZX Shop'}
              </h1>
              <p className="text-[10px] sm:text-xs font-semibold text-rose-600 mt-0.5">
                {settings?.banglaTagline || 'আপনার পছন্দের প্রিমিয়াম অনলাইন শপ'}
              </p>
            </div>
          </div>

          {/* Search bar inside header (Screenshot 1) */}
          <div className="flex-1 max-w-md hidden sm:flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  if (activeNav !== 'products') setActiveNav('products');
                }}
                placeholder="পণ্য খুঁজুন..."
                className="w-full pl-9 pr-9 py-2 text-xs bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-red-500 rounded-full outline-hidden transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => {
                  if (activeNav !== 'products') setActiveNav('products');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => {
                if (activeNav !== 'products') setActiveNav('products');
              }}
              className="px-3.5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:from-red-700 hover:to-rose-700 transition cursor-pointer"
            >
              সার্চ
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveNav('products')}
              className="p-2 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs relative cursor-pointer"
              title="পণ্য ক্যাটালগ"
            >
              <ShoppingBag className="w-5 h-5 text-rose-600" />
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  setAuthToken(null);
                  setCurrentUser(null);
                }}
                className="p-2 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition shadow-2xs cursor-pointer"
                title="লগআউট"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Feedback Alert Toast */}
      {feedbackMsg && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-4">
          <div
            className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-75 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Body */}
      {!isAdmin ? (
        /* Admin Login Screen with Clean White/Slate High-Contrast */
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="w-14 h-14 rounded-3xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-center text-slate-900 mb-1">
              অ্যাডমিন প্রবেশদ্বার (Admin Login)
            </h2>
            <p className="text-xs text-slate-500 font-medium text-center mb-6">
              Enter authorized administrator credentials to manage Nova Shop.
            </p>

            {authError && (
              <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ইমেইল অ্যাড্রেস</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-900 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm shadow-md shadow-teal-800/20 transition cursor-pointer disabled:opacity-50"
              >
                {authLoading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Authenticated Admin Dashboard Layout with Clean Sidebar & White Content */
        <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full pb-20 md:pb-6">
          {/* Desktop Sidebar Navigation */}
          <aside className="w-64 bg-slate-50 border-r border-slate-200 p-4 space-y-1 hidden md:block shrink-0">
            {[
              { id: 'stats', label: 'ড্যাশবোর্ড ওভারভিউ', icon: TrendingUp },
              { id: 'shop_orders', label: 'শপ অর্ডার্স (Shop)', icon: Package, badge: shopOrders.filter(o => o.orderStatus === 'PENDING').length },
              { id: 'reseller_orders', label: 'রিসেলার অর্ডার্স', icon: ShoppingBag, badge: adminStats?.pendingAdvanceVerification },
              { id: 'products', label: 'প্রোডাক্টস ও প্রাইসিং', icon: ShoppingBag },
              { id: 'categories', label: 'ক্যাটাগরি ম্যানেজমেন্ট', icon: Layers },
              { id: 'resellers', label: 'রিসেলার্স ও রেজিস্ট্রেশন', icon: Users, badge: adminStats?.pendingResellerApprovals },
              { id: 'referrals', label: 'রেফারেল কমিশন লেজার', icon: Gift, badge: adminStats?.pendingCommissionsCount },
              { id: 'profits', label: 'রিসেলার লাভ হিসাব', icon: DollarSign, badge: adminStats?.pendingProfitsCount },
              { id: 'withdrawals', label: 'উইথড্রল রিকোয়েস্ট', icon: Wallet, badge: adminStats?.pendingWithdrawalsCount },
              { id: 'csv', label: 'CSV ইম্পোর্ট ও এক্সপোর্ট', icon: FileText },
              { id: 'settings', label: 'সিস্টেম ও ইমেইল সেটিংস', icon: Settings },
              { id: 'backup', label: 'ডাটাবেজ ব্যাকআপ ও রিস্টোর', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeNav === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveNav(tab.id as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-teal-800 text-white shadow-md shadow-teal-800/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge ? (
                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </aside>

          {/* Main Tab Panels */}
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white">
            {/* Top Admin Control Card (Matching Screenshot 1) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm mb-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-rose-600/30">
                    {((settings?.shopName || 'ZX').slice(0, 2)).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                      {settings?.banglaShopName || 'ZX Shop'} অ্যাডমিন কন্ট্রোল
                    </h2>
                    <span className="text-xs font-bold text-emerald-600 mt-1 block">
                      সক্রিয় সেশন (অ্যাডমিনিস্ট্রেটর)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackMsg({ type: 'success', text: 'সব সিস্টেম সক্রিয় ও স্বাভাবিক রয়েছে।' })}
                  className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                  title="নোটিফিকেশন"
                >
                  <Bell className="w-5 h-5 text-slate-700" />
                </button>
                <button
                  type="button"
                  onClick={handleStartNewProduct}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন পণ্য যোগ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthToken(null);
                    setCurrentUser(null);
                  }}
                  className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition shadow-2xs cursor-pointer"
                  title="লগআউট"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Navigation Pills (Matching Screenshot 1) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveNav('settings')}
                className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold whitespace-nowrap shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-rose-600" />
                <span>ডেলিভারি চার্জ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNav('settings')}
                className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold whitespace-nowrap shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5 text-rose-600" />
                <span>কুপন ও ছাড়</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNav('settings')}
                className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold whitespace-nowrap shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-rose-600" />
                <span>দোকান সেটিংস</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNav('shop_orders')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-2xs flex items-center gap-1.5 transition cursor-pointer ${
                  activeNav === 'shop_orders' ? 'bg-red-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>শপ অর্ডার</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNav('reseller_orders')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-2xs flex items-center gap-1.5 transition cursor-pointer ${
                  activeNav === 'reseller_orders' ? 'bg-red-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>রিসেলার অর্ডার</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNav('categories')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-2xs flex items-center gap-1.5 transition cursor-pointer ${
                  activeNav === 'categories' ? 'bg-red-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>ক্যাটাগরি</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNav('products')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-2xs flex items-center gap-1.5 transition cursor-pointer ${
                  activeNav === 'products' ? 'bg-red-600 text-white' : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>পণ্য তালিকা</span>
              </button>
            </div>

            {/* 1. STATS OVERVIEW */}
            {activeNav === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">মোট বিক্রয় (Revenue)</div>
                    <div className="text-xl sm:text-2xl font-black text-teal-800 mt-1">৳{adminStats?.totalSales || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">মোট অর্ডার্স</div>
                    <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{adminStats?.totalOrders || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-rose-200 bg-rose-50/40 shadow-sm">
                    <div className="text-[11px] font-bold text-rose-700 uppercase">অ্যাডভান্স ভেরিফিকেশন বাকি</div>
                    <div className="text-xl sm:text-2xl font-black text-rose-700 mt-1">{adminStats?.pendingAdvanceVerification || 0}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-amber-200 bg-amber-50/40 shadow-sm">
                    <div className="text-[11px] font-bold text-amber-700 uppercase">পেন্ডিং রিসেলার্স</div>
                    <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1">{adminStats?.pendingResellerApprovals || 0}</div>
                  </div>
                </div>

                {/* Quick Action Shortcuts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() => { setActiveNav('reseller_orders'); setResellerOrderStatusFilter('PENDING_ADVANCE'); }}
                    className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 cursor-pointer hover:border-rose-400 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-800">অগ্রিম ডেলিভারি ফি যাচাই</span>
                      <Shield className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="text-2xl font-black text-rose-900 mt-2">{adminStats?.pendingAdvanceVerification || 0} টি অর্ডার</div>
                    <p className="text-[11px] text-rose-700 mt-1">অনুমোদন ছাড়া পার্সেল পাঠানো বন্ধ থাকে</p>
                  </div>

                  <div
                    onClick={() => setActiveNav('withdrawals')}
                    className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer hover:border-amber-400 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800">রিসেলার উইথড্রল রিকোয়েস্ট</span>
                      <Wallet className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-amber-900 mt-2">{adminStats?.pendingWithdrawalsCount || 0} টি রিকোয়েস্ট</div>
                    <p className="text-[11px] text-amber-700 mt-1">বিকাশ/নগদে পরিশোধ করে TrxID রেকর্ড করুন</p>
                  </div>

                  <div
                    onClick={() => setActiveNav('categories')}
                    className="p-5 rounded-2xl bg-teal-50/70 border border-teal-200 cursor-pointer hover:border-teal-400 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-800">ক্যাটাগরি ম্যানেজমেন্ট</span>
                      <Layers className="w-5 h-5 text-teal-700" />
                    </div>
                    <div className="text-2xl font-black text-teal-900 mt-2">{categoriesList.length} টি ক্যাটাগরি</div>
                    <p className="text-[11px] text-teal-700 mt-1">নতুন ক্যাটাগরি (যেমন: ঘড়ি) যুক্ত করুন</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SHOP ORDERS (Point 4: Separate Menu & List) */}
            {activeNav === 'shop_orders' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      শপ সরাসরি কাস্টমার অর্ডার্স (Shop Orders)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      সাধারণ ক্রেতাদের সরাসরি প্লেস করা অর্ডার ও ডেলিভারি স্ট্যাটাস
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setShopOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                          shopOrderStatusFilter === st
                            ? 'bg-teal-800 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredShopOrders.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-semibold">
                      কোনো শপ অর্ডার পাওয়া যায়নি।
                    </div>
                  ) : (
                    filteredShopOrders.map((o) => (
                      <div key={o.id} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-teal-800">{o.id}</span>
                            <span className="bg-teal-50 text-teal-800 border border-teal-200 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">
                              DIRECT CUSTOMER
                            </span>
                            <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] px-2 py-0.5 rounded-md font-bold">
                              {o.orderStatus}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-600">স্ট্যাটাস:</label>
                            <select
                              value={o.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <div>
                            <div><strong>কাস্টমার:</strong> <span className="text-slate-900 font-bold">{o.customerName}</span> ({o.customerPhone})</div>
                            <div><strong>ঠিকানা:</strong> <span className="text-slate-800 font-medium">{o.customerAddress}</span></div>
                            <div><strong>এরিয়া:</strong> {o.deliveryZoneName} (চার্জ: ৳{o.deliveryCharge})</div>
                          </div>
                          <div>
                            <div><strong>পণ্য:</strong> {o.items.map((i) => `${i.productName} x${i.quantity}`).join(', ')}</div>
                            <div><strong>মোট কাস্টমার বিল:</strong> <span className="text-emerald-700 font-black text-sm">৳{o.totalAmount}</span> ({o.paymentMethod.toUpperCase()})</div>
                            {o.customerTxId && <div><strong>পেমেন্ট TrxID:</strong> <span className="font-mono text-teal-800">{o.customerTxId}</span></div>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. RESELLER ORDERS (Point 4: Separate Menu & List) */}
            {activeNav === 'reseller_orders' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      রিসেলার অর্ডার্স (Reseller Orders)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      অগ্রিম ডেলিভারি ফি ভেরিফিকেশন এবং ডেলিভারি সম্পন্ন হলে স্বয়ংক্রিয় লাভ ক্রেডিট
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {['ALL', 'PENDING_ADVANCE', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setResellerOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition ${
                          resellerOrderStatusFilter === st
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st === 'PENDING_ADVANCE' ? '⏳ অ্যাডভান্স বাকি' : st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredResellerOrders.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-semibold">
                      কোনো রিসেলার অর্ডার পাওয়া যায়নি।
                    </div>
                  ) : (
                    filteredResellerOrders.map((o) => {
                      const isAdvancePending = o.resellerAdvancePayment?.status === 'PENDING_VERIFICATION';
                      const isAdvanceVerified = o.resellerAdvancePayment?.status === 'VERIFIED';

                      return (
                        <div key={o.id} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-amber-700">{o.id}</span>
                              <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">
                                RESELLER ORDER
                              </span>
                              <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                {o.orderStatus}
                              </span>
                            </div>

                            {/* Status changer */}
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-slate-600">স্ট্যাটাস:</label>
                              <select
                                value={o.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs"
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="PROCESSING">PROCESSING</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED (লাভ অটো ক্রেডিট)</option>
                                <option value="COMPLETED">COMPLETED (লাভ অটো ক্রেডিট)</option>
                                <option value="CANCELLED">CANCELLED (লাভ রিভার্সাল)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                            <div>
                              <div><strong>রিসেলার:</strong> <span className="text-slate-900 font-bold">{o.resellerName}</span> ({o.resellerPhone})</div>
                              <div><strong>প্রত্যাশিত লাভ:</strong> <span className="text-emerald-700 font-black">৳{o.resellerProfit}</span></div>
                              <div><strong>ডেলিভারি এরিয়া:</strong> {o.deliveryZoneName} (চার্জ: ৳{o.deliveryCharge})</div>
                            </div>
                            <div>
                              <div><strong>কাস্টমার:</strong> <span className="text-slate-900 font-bold">{o.customerName}</span> ({o.customerPhone})</div>
                              <div><strong>ঠিকানা:</strong> <span className="text-slate-800">{o.customerAddress}</span></div>
                              <div><strong>কাস্টমার বিল:</strong> <span className="text-slate-900 font-bold">৳{o.totalAmount}</span></div>
                            </div>
                          </div>

                          {/* Advance Payment Card */}
                          {o.resellerAdvancePayment && (
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700">অগ্রিম ডেলিভারি ফি:</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isAdvanceVerified
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                                    }`}
                                  >
                                    {isAdvanceVerified ? 'ভেরিফাইড' : 'অপেক্ষমাণ (PENDING)'}
                                  </span>
                                </div>
                                <div className="text-slate-600">
                                  পরিমাণ: <strong className="text-slate-900">৳{o.resellerAdvancePayment.paidAmount}</strong> • মেথড: <strong className="uppercase">{o.resellerAdvancePayment.method}</strong> • TrxID: <strong className="font-mono text-teal-800">{o.resellerAdvancePayment.txId}</strong>
                                </div>
                              </div>

                              {isAdvancePending && (
                                <button
                                  onClick={() => setSelectedOrderForAdvance(o)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                                >
                                  পেমেন্ট যাচাই করুন
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 4. PRODUCTS & MULTI-IMAGE GALLERY (Matching Screenshot 1) */}
            {activeNav === 'products' && (
              <div className="space-y-4">
                {/* Product Search & CSV Action Card (Screenshot 1) */}
                <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="নাম বা SKU দিয়ে ফিল্টার করুন..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-red-500 text-xs font-semibold outline-hidden transition shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveNav('csv')}
                      className="w-full sm:w-auto flex-1 py-2 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-red-600" />
                      <span>CSV এক্সপোর্ট</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNav('csv')}
                      className="w-full sm:w-auto flex-1 py-2 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>CSV ইমপোর্ট</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartNewProduct}
                    className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন পণ্য যোগ করুন</span>
                  </button>
                </div>

                {/* Products List matching Screenshot 1 */}
                <div className="space-y-3">
                  {localProducts
                    .filter((p) => {
                      if (!productSearchQuery.trim()) return true;
                      const q = productSearchQuery.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.banglaName && p.banglaName.toLowerCase().includes(q)) ||
                        p.sku.toLowerCase().includes(q) ||
                        p.category.toLowerCase().includes(q)
                      );
                    })
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200'}
                              alt={p.name}
                              className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-xs text-red-600 block leading-tight">{p.sku}</span>
                              <h4 className="font-bold text-sm text-slate-900 truncate mt-0.5">{p.banglaName || p.name}</h4>
                              <span className="font-black text-sm text-red-600 block mt-1">৳{p.shopPrice.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold block mb-1">
                              Published
                            </span>
                            <span className="text-xs text-slate-600 font-bold">স্টক: {p.stock} টি</span>
                          </div>
                        </div>

                        {/* Action buttons matching Screenshot 1: সম্পাদনা, কপি, মুছুন */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleStartEditProduct(p)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>সম্পাদনা</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateProduct(p)}
                            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>কপি</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>মুছুন</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 5. CATEGORIES MANAGEMENT (Point 10: Admin Category Add/Edit/Delete) */}
            {activeNav === 'categories' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    ক্যাটাগরি ম্যানেজমেন্ট (Category Management)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    নতুন ক্যাটাগরি (যেমন: ঘড়ি, জুয়েলারি, হোম ডেকর) যোগ করুন ও ওয়েবসাইটে দেখান
                  </p>
                </div>

                {/* Add Category Form */}
                <form onSubmit={handleCreateCategory} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-teal-700" />
                    <span>নতুন ক্যাটাগরি তৈরি করুন</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">বাংলা নাম (যেমন: ঘড়ি) *</label>
                      <input
                        type="text"
                        required
                        value={newCatBanglaName}
                        onChange={(e) => setNewCatBanglaName(e.target.value)}
                        placeholder="ঘড়ি"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ইংরেজি নাম (English Name) *</label>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Watches"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">স্লাগ (Slug)</label>
                      <input
                        type="text"
                        value={newCatSlug}
                        onChange={(e) => setNewCatSlug(e.target.value)}
                        placeholder="watches"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ছবির URL (ঐচ্ছিক)</label>
                      <input
                        type="url"
                        value={newCatImage}
                        onChange={(e) => setNewCatImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md shadow-teal-800/20 cursor-pointer disabled:opacity-50"
                      >
                        ক্যাটাগরি যুক্ত করুন
                      </button>
                    </div>
                  </div>
                </form>

                {/* Categories Table */}
                <div className="space-y-3">
                  <h3 className="font-bold text-sm text-slate-800">বিদ্যমান ক্যাটাগরি তালিকা ({categoriesList.length} টি)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoriesList.map((cat) => (
                      <div key={cat.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={cat.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                            alt={cat.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-sm text-slate-900 block">{cat.banglaName}</span>
                            <span className="text-xs text-slate-500 font-medium">{cat.name} ({cat.slug})</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. RESELLERS & REGISTRATION (Point 9: Auto-referral bonus on approval) */}
            {activeNav === 'resellers' && (
              <div className="space-y-4">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  রিসেলার্স ও রেজিস্ট্রেশন পেমেন্ট ভেরিফিকেশন
                </h2>

                <div className="space-y-3">
                  {resellers.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-semibold">
                      কোনো রিসেলার নেই।
                    </div>
                  ) : (
                    resellers.map((r) => (
                      <div key={r.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{r.name}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-mono font-bold">
                              Ref: {r.referralCode || 'N/A'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                r.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {r.status}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            {r.businessName ? `${r.businessName} • ` : ''}ইমেইল: {r.email} • ফোন: {r.phone}
                          </div>
                          <div className="text-slate-600">
                            রেজিস্ট্রেশন ফি: <strong>৳{r.registrationFeeSnapshot || 200}</strong> • TrxID: <strong className="font-mono text-teal-800">{r.registrationTxId || 'None'}</strong> • মেথড: {r.registrationMethod?.toUpperCase()}
                          </div>
                          {r.referredBy && (
                            <div className="text-purple-700 font-bold">রেফারেল কোড ব্যবহার করেছে: {r.referredBy}</div>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          {r.regPaymentStatus === 'PENDING_VERIFICATION' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleVerifyResellerPayment(r.id, 'VERIFY')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                              >
                                অনুমোদন ও বোনাস ক্রেডিট
                              </button>
                              <button
                                onClick={() => handleVerifyResellerPayment(r.id, 'REJECT')}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs cursor-pointer"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                              রেজিস্ট্রেশন অনুমোদিত
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 7. RESELLER PROFITS (Section 12: Profit Records & Approval) */}
            {activeNav === 'profits' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      রিসেলার লাভ হিসাব ও লেজার (Reseller Profit Ledger)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      ডেলিভারি সম্পন্ন অর্ডারের স্বয়ংক্রিয় প্রফিট ক্রেডিট রেকর্ড ও অডিট ট্রেইল
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {resellerProfits.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-semibold">
                      কোনো প্রফিট রেকর্ড নেই।
                    </div>
                  ) : (
                    resellerProfits.map((pr) => (
                      <div key={pr.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900">{pr.orderId}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                pr.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : pr.status === 'REVERSED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {pr.status}
                            </span>
                          </div>
                          <div className="text-slate-600">
                            রিসেলার: <strong className="text-slate-900">{pr.resellerName}</strong> • কাস্টমার: {pr.customerName}
                          </div>
                          <div className="text-slate-600">
                            বিক্রয় মূল্য: ৳{pr.sellingTotal} • পাইকারি খরচ: ৳{pr.wholesaleTotal} • নিট লাভ: <strong className="text-emerald-700 font-bold">৳{pr.netProfit}</strong>
                          </div>
                          {pr.adminNotes && (
                            <div className="text-[11px] text-slate-500 italic">নোট: {pr.adminNotes}</div>
                          )}
                        </div>

                        <div className="flex items-center sm:items-end justify-between sm:justify-center">
                          <span className="text-[11px] font-bold text-slate-500">
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 8. REFERRALS LEDGER */}
            {activeNav === 'referrals' && (
              <div className="space-y-4">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  রেফারেল কমিশন লেজার (Referral Commission Ledger)
                </h2>

                <div className="space-y-3">
                  {referralCommissions.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-semibold">
                      কোনো রেফারেল কমিশন নেই।
                    </div>
                  ) : (
                    referralCommissions.map((c) => (
                      <div key={c.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex justify-between gap-4 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">রেফারার: {c.referrerName}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                          <div className="text-slate-600 mt-1">
                            আমন্ত্রিত নতুন রিসেলার: <strong className="text-slate-900">{c.referredUserName}</strong> • কমিশন পরিমাণ: <strong className="text-teal-800 font-black">৳{c.amount}</strong>
                          </div>
                        </div>

                        {c.status === 'PENDING' && (
                          <button
                            onClick={() => handleApproveCommission(c.id)}
                            className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs cursor-pointer shadow-xs self-center"
                          >
                            অনুমোদন করুন
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 9. WITHDRAWALS */}
            {activeNav === 'withdrawals' && (
              <div className="space-y-4">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  উইথড্রল রিকোয়েস্ট ও পেআউট (Withdrawal Requests)
                </h2>

                <div className="space-y-3">
                  {withdrawals.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-semibold">
                      কোনো উইথড্রল রিকোয়েস্ট নেই।
                    </div>
                  ) : (
                    withdrawals.map((w) => (
                      <div key={w.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between gap-4 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{w.resellerName}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                w.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {w.status}
                            </span>
                          </div>
                          <div className="text-slate-600 mt-1">
                            উইথড্রল পরিমাণ: <strong className="text-emerald-700 font-black text-sm">৳{w.amount}</strong> • মেথড: <strong className="uppercase">{w.payoutMethod}</strong> ({w.payoutNumber})
                          </div>
                          {w.txId && <div><strong>পেআউট TrxID:</strong> <span className="font-mono text-teal-800">{w.txId}</span></div>}
                        </div>

                        {w.status === 'PENDING' && (
                          <button
                            onClick={() => setSelectedWithdrawalForPay(w)}
                            className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs cursor-pointer shadow-xs self-center"
                          >
                            পরিশোধ করুন ও TrxID দিন
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 10. CSV IMPORT / EXPORT */}
            {activeNav === 'csv' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    CSV ইম্পোর্ট ও এক্সপোর্ট (12-Column Product Catalog)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    ১২ কলামের CSV ফাইল দিয়ে এক ক্লিকে হাজার হাজার পণ্য ও ছবি আপলোড করুন
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">বর্তমান ক্যাটালগ এক্সপোর্ট</h4>
                    <p className="text-xs text-slate-500 mt-0.5">সব পণ্য, বাংলা নাম, ভ্যারিয়েন্ট ও ১২তম কলাম Reseller Max Price সহ ডাউনলোড করুন</p>
                  </div>
                  <a
                    href={api.exportCSVUrl()}
                    download="novashop-products.csv"
                    className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>CSV ডাউনলোড করুন</span>
                  </a>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-700" />
                    <span>নতুন CSV ফাইল আপলোড</span>
                  </h4>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileSelect}
                    className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-800 hover:file:bg-teal-100 cursor-pointer"
                  />
                  {csvPreview && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-800">প্রিভিউ: {csvPreview.products?.length || 0} টি পণ্য সনাক্ত হয়েছে</div>
                      <button
                        onClick={handleCommitCsvImport}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        ইমপোর্ট নিশ্চিত করুন
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 11. SETTINGS & GMAIL SMTP */}
            {activeNav === 'settings' && editSettings && (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    দোকান ও সিস্টেম সেটিংস (Store & System Settings)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    ব্র্যান্ডিং, পেমেন্ট নম্বর, রিসেলার রুলস এবং জিমেইল নোটিফিকেশন কনফিগার করুন
                  </p>
                </div>

                {/* 1. General Store Info & Branding */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="p-2 rounded-xl bg-red-50 text-red-600 font-bold">🏪</span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">দোকানের তথ্য ও ব্র্যান্ডিং</h3>
                      <p className="text-[11px] text-slate-500">ক্রেতাদের কাছে প্রদর্শিত নাম ও যোগাযোগের বিবরণ</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">দোকানের নাম (English)</label>
                      <input
                        type="text"
                        value={editSettings.shopName || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, shopName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">দোকানের বাংলা নাম</label>
                      <input
                        type="text"
                        value={editSettings.banglaShopName || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, banglaShopName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ট্যাগলাইন (English)</label>
                      <input
                        type="text"
                        value={editSettings.tagline || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, tagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">বাংলা ট্যাগলাইন</label>
                      <input
                        type="text"
                        value={editSettings.banglaTagline || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, banglaTagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">যোগাযোগ ফোন / হেল্পলাইন</label>
                      <input
                        type="text"
                        value={editSettings.contactPhone || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, contactPhone: e.target.value, helplinePhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">অফিসিয়াল ইমেইল</label>
                      <input
                        type="email"
                        value={editSettings.contactEmail || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, contactEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">শপের ঠিকানা</label>
                      <input
                        type="text"
                        value={editSettings.address || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Payment Accounts */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="p-2 rounded-xl bg-pink-50 text-pink-600 font-bold">💳</span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">পেমেন্ট অ্যাকাউন্ট নম্বরসমূহ</h3>
                      <p className="text-[11px] text-slate-500">বিকাশ, নগদ ও রকেট পেমেন্ট গ্রহণের নম্বর</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="bg-pink-50/40 border border-pink-200/70 rounded-2xl p-3.5 space-y-1.5">
                      <label className="block text-xs font-extrabold text-pink-700">বিকাশ নম্বর (bKash)</label>
                      <input
                        type="text"
                        value={editSettings.bkashNumber || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, bkashNumber: e.target.value })}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-pink-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-pink-500/20 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editSettings.bkashType || 'মার্চেন্ট / পার্সোনাল'}
                        onChange={(e) => setEditSettings({ ...editSettings, bkashType: e.target.value })}
                        placeholder="অ্যাকাউন্টের ধরন (e.g. পার্সোনাল)"
                        className="w-full px-3 py-1.5 rounded-lg bg-white/80 border border-pink-100 text-[11px] text-slate-700"
                      />
                    </div>

                    <div className="bg-orange-50/40 border border-orange-200/70 rounded-2xl p-3.5 space-y-1.5">
                      <label className="block text-xs font-extrabold text-orange-700">নগদ নম্বর (Nagad)</label>
                      <input
                        type="text"
                        value={editSettings.nagadNumber || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, nagadNumber: e.target.value })}
                        placeholder="017XXXXXXXX"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-orange-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editSettings.nagadType || 'মার্চেন্ট / পার্সোনাল'}
                        onChange={(e) => setEditSettings({ ...editSettings, nagadType: e.target.value })}
                        placeholder="অ্যাকাউন্টের ধরন (e.g. পার্সোনাল)"
                        className="w-full px-3 py-1.5 rounded-lg bg-white/80 border border-orange-100 text-[11px] text-slate-700"
                      />
                    </div>

                    <div className="bg-purple-50/40 border border-purple-200/70 rounded-2xl p-3.5 space-y-1.5">
                      <label className="block text-xs font-extrabold text-purple-700">রকেট নম্বর (Rocket)</label>
                      <input
                        type="text"
                        value={editSettings.rocketNumber || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, rocketNumber: e.target.value })}
                        placeholder="017XXXXXXXXX"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-purple-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={editSettings.rocketType || 'পার্সোনাল'}
                        onChange={(e) => setEditSettings({ ...editSettings, rocketType: e.target.value })}
                        placeholder="অ্যাকাউন্টের ধরন (e.g. পার্সোনাল)"
                        className="w-full px-3 py-1.5 rounded-lg bg-white/80 border border-purple-100 text-[11px] text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Reseller & Dropshipping Rules */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold">💼</span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">রিসেলার ও ড্রপশিপিং নিয়মাবলী</h3>
                      <p className="text-[11px] text-slate-500">অগ্রিম ডেলিভারি চার্জ, রেজিস্ট্রেশন ফি এবং প্রাইস ক্যাপ পলিসি</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ন্যূনতম অগ্রিম চার্জ (৳)</label>
                      <input
                        type="number"
                        value={editSettings.minResellerAdvance ?? 50}
                        onChange={(e) => setEditSettings({ ...editSettings, minResellerAdvance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">রিসেলারের অর্ডারে বাধ্যতামূলক অগ্রিম পেমেন্ট</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">রেজিস্ট্রেশন ফি (৳)</label>
                      <input
                        type="number"
                        value={editSettings.resellerRegistrationFee ?? 200}
                        onChange={(e) => setEditSettings({ ...editSettings, resellerRegistrationFee: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">নতুন রিসেলার আইডি খোলার এককালীন ফি</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">সর্বোচ্চ প্রাইস ক্যাপ মার্কআপ %</label>
                      <input
                        type="number"
                        value={editSettings.globalResellerMaxMarkupPercent ?? 50}
                        onChange={(e) => setEditSettings({ ...editSettings, globalResellerMaxMarkupPercent: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">পাইকারি মূল্যের চেয়ে সর্বোচ্চ কত % বেশিতে বিক্রি করতে পারবে</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editSettings.autoApproveResellers || false}
                        onChange={(e) => setEditSettings({ ...editSettings, autoApproveResellers: e.target.checked })}
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        নতুন আবেদনকারীদের স্বয়ংক্রিয়ভাবে রিসেলার হিসেবে অনুমোদন দিন (ম্যানুয়াল ভেরিফিকেশন ছাড়া)
                      </span>
                    </label>
                  </div>
                </div>

                {/* 4. WhatsApp Floating Button Settings */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold">💬</span>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">WhatsApp ভাসমান বাটন</h3>
                        <p className="text-[11px] text-slate-500">ক্রেতাদের সরাসরি WhatsApp চ্যাটের জন্য ভাসমান বাটন</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editSettings.whatsappEnabled ?? true}
                        onChange={(e) => setEditSettings({ ...editSettings, whatsappEnabled: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-700 hidden sm:inline">সক্রিয় রাখুন</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp নম্বর</label>
                    <input
                      type="text"
                      value={editSettings.whatsappNumber || '+8801712345678'}
                      onChange={(e) => setEditSettings({ ...editSettings, whatsappNumber: e.target.value })}
                      placeholder="+8801712345678"
                      className="w-full max-w-sm px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* 5. GMAIL SMTP CONFIGURATION */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-red-50 text-red-600 font-bold">✉️</span>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">জিমেইল SMTP সার্ভার ও নোটিফিকেশন</h3>
                        <p className="text-[11px] text-slate-500">অর্ডার, পেমেন্ট ও গ্রাহকদের অটোম্যাটিক ইমেইল পাঠাতে</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editSettings.emailNotificationsEnabled || false}
                        onChange={(e) => setEditSettings({ ...editSettings, emailNotificationsEnabled: e.target.checked })}
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                      />
                      <span className="text-xs font-bold text-slate-800 hidden sm:inline">ইমেইল নোটিফিকেশন চালু রাখুন</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">SMTP Host</label>
                      <input
                        type="text"
                        value={editSettings.smtpHost || 'smtp.gmail.com'}
                        onChange={(e) => setEditSettings({ ...editSettings, smtpHost: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Port</label>
                      <input
                        type="number"
                        value={editSettings.smtpPort || 465}
                        onChange={(e) => setEditSettings({ ...editSettings, smtpPort: parseInt(e.target.value, 10) || 465 })}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gmail Sender Email</label>
                      <input
                        type="email"
                        value={editSettings.smtpUser || ''}
                        onChange={(e) => setEditSettings({ ...editSettings, smtpUser: e.target.value })}
                        placeholder="your-email@gmail.com"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Gmail App Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Gmail App Password (১৬ অক্ষরের গুগল অ্যাপ পাসওয়ার্ড):
                      </label>
                      {settings?.hasSmtpPass && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>সংরক্ষিত আছে (Saved)</span>
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder={
                        settings?.hasSmtpPass
                          ? 'আগের পাসওয়ার্ড সংরক্ষিত আছে (নতুন দিতে চাইলে এখানে লিখুন, অন্যথায় ফাঁকা রাখুন)'
                          : '১৬ অক্ষরের গুগল অ্যাপ পাসওয়ার্ড দিন (e.g. abcd efgh ijkl mnop)'
                      }
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      * আগে থেকে সংরক্ষিত পাসওয়ার্ডের ঘর ফাঁকা রেখে Save করলে পুরোনো পাসওয়ার্ড সুরক্ষিত থাকবে।
                    </p>
                  </div>

                  {/* Test Email Section */}
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">টেস্ট ইমেইল প্রাপক:</label>
                      <input
                        type="email"
                        value={testEmailRecipient}
                        onChange={(e) => setTestEmailRecipient(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2 sm:pt-4 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={emailTesting}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{emailTesting ? 'পাঠানো হচ্ছে...' : 'Test Email পাঠান'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={loadEmailLogs}
                        className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs cursor-pointer shadow-2xs transition"
                      >
                        লগস দেখুন
                      </button>
                    </div>
                  </div>

                  {/* Notification Events Checklist */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <h4 className="font-bold text-xs text-slate-800">কোন কোন ইভেন্টে ইমেইল নোটিফিকেশন যাবে:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                      {[
                        { key: 'newShopOrder', label: 'নতুন শপ অর্ডার (New Shop Order)' },
                        { key: 'newResellerOrder', label: 'নতুন রিসেলার অর্ডার (New Reseller Order)' },
                        { key: 'resellerRegistration', label: 'নতুন রিসেলার রেজিস্ট্রেশন আবেদন' },
                        { key: 'resellerApproved', label: 'রিসেলার অনুমোদন ও অ্যাক্টিভেশন' },
                        { key: 'advancePaymentSubmitted', label: 'রিসেলার অগ্রিম পেমেন্ট জমা' },
                        { key: 'advancePaymentVerified', label: 'অগ্রিম পেমেন্ট যাচাই সম্পন্ন' },
                        { key: 'orderStatusChanged', label: 'অর্ডার স্ট্যাটাস পরিবর্তন' },
                        { key: 'profitCredited', label: 'রিসেলার লাভ অটো ক্রেডিট' },
                        { key: 'commissionApproved', label: 'রেফারেল কমিশন ক্রেডিট' },
                        { key: 'withdrawalRequested', label: 'উইথড্রল রিকোয়েস্ট জমা' },
                        { key: 'withdrawalPaid', label: 'উইথড্রল পেআউট সম্পন্ন' },
                        { key: 'productChanged', label: 'পণ্য বা CSV ক্যাটালগ পরিবর্তন' },
                        { key: 'backupCreated', label: 'ডাটাবেজ ব্যাকআপ সম্পন্ন' },
                        { key: 'systemError', label: 'সিস্টেম এরর ও সতর্কতা' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={editSettings.emailNotificationEvents?.[item.key] ?? true}
                            onChange={(e) =>
                              setEditSettings({
                                ...editSettings,
                                emailNotificationEvents: {
                                  ...editSettings.emailNotificationEvents,
                                  [item.key]: e.target.checked,
                                },
                              })
                            }
                            className="rounded-sm text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-slate-800">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Email Logs View */}
                {showEmailLogs && (
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900">ইমেইল পাঠানোর লগ ({emailLogs.length} টি)</h3>
                      <button
                        type="button"
                        onClick={() => setShowEmailLogs(false)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800"
                      >
                        লুকান ×
                      </button>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {emailLogs.length === 0 ? (
                        <p className="text-xs text-slate-500">কোনো ইমেইল লগ নেই।</p>
                      ) : (
                        emailLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                              log.status === 'SENT'
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-rose-50/50 border-rose-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  log.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {log.status}
                                </span>
                                <span className="font-bold text-slate-800 truncate">{log.subject}</span>
                              </div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                প্রাপক: {log.to} • সময়: {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                              {log.errorDetails && (
                                <div className="text-rose-700 font-medium text-[10px] mt-0.5">{log.errorDetails}</div>
                              )}
                            </div>

                            {log.status === 'FAILED' && (
                              <button
                                type="button"
                                onClick={() => handleResendEmail(log.id)}
                                disabled={resendingLogId === log.id}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white font-bold text-[11px] shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                {resendingLogId === log.id ? 'পাঠানো হচ্ছে...' : 'পুনরায় পাঠান'}
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Save Settings Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm shadow-lg shadow-red-600/25 cursor-pointer disabled:opacity-50 transition active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>সেটিংস সংরক্ষণ করুন (Save Settings)</span>
                  </button>
                </div>
              </form>
            )}

            {/* 12. BACKUP & RESTORE */}
            {activeNav === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    ডাটাবেজ ব্যাকআপ ও রিস্টোর (Database Backup & Restore)
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    সম্পূর্ণ ডাটাবেজ এক ক্লিকে ডাউনলোড ও রিস্টোর করুন
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">সম্পূর্ণ ডাটাবেজ ব্যাকআপ ডাউনলোড</h4>
                    <p className="text-xs text-slate-500 mt-0.5">সব পণ্য, অর্ডার, রিসেলার লেজার ও সেটিংসের সম্পূর্ণ JSON স্ন্যাপশট</p>
                  </div>
                  <a
                    href={api.exportBackupUrl()}
                    download={`novashop-backup-${new Date().toISOString().slice(0, 10)}.json`}
                    className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ব্যাকআপ JSON ডাউনলোড</span>
                  </a>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Advance Verification Modal */}
      {selectedOrderForAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">
              অগ্রিম ডেলিভারি পেমেন্ট যাচাই ({selectedOrderForAdvance.id})
            </h3>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div><strong>পরিমাণ:</strong> ৳{selectedOrderForAdvance.resellerAdvancePayment?.paidAmount}</div>
              <div><strong>মেথড:</strong> {selectedOrderForAdvance.resellerAdvancePayment?.method?.toUpperCase()}</div>
              <div><strong>TrxID:</strong> <span className="font-mono text-teal-800 font-bold">{selectedOrderForAdvance.resellerAdvancePayment?.txId}</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">অ্যাডমিন নোট:</label>
              <input
                type="text"
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                placeholder="যেমন: bKash স্টেটমেন্ট থেকে যাচাইকৃত"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleVerifyAdvance(selectedOrderForAdvance.id, 'VERIFY')}
                className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                পেমেন্ট অনুমোদন করুন
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderForAdvance(null)}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit / Creation Modal (Screenshots 2 & 3: 4 Distinct Sections) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {isNewProduct ? 'নতুন পণ্য যোগ করুন' : 'পণ্য সম্পাদনা করুন'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  মোবাইল ও পিসিতে সহজে ছবি আপলোড ও তথ্য পূরণ করুন
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* ১. প্রাথমিক তথ্য */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-3.5">
                <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <span className="text-red-600">📦</span>
                  <span>১. প্রাথমিক তথ্য</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5">পণ্যের নাম *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                        banglaName: e.target.value,
                      })
                    }
                    placeholder="যেমন: প্রিমিয়াম কটন পাঞ্জাবি"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100/80 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5">SKU কোড</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    placeholder="ZX-5337"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100/80 border border-slate-200 text-sm font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5">ক্যাটাগরি নির্বাচন *</label>
                  <select
                    value={editingProduct.category || categoriesList[0]?.slug}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100/80 border border-slate-200 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition cursor-pointer"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.banglaName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ২. মূল্য ও রিসেলার রেট (স্বতন্ত্র মূল্য নির্ধারণ) */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-3.5">
                <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <span className="text-red-600">🏷️</span>
                  <span>২. মূল্য ও রিসেলার রেট (স্বতন্ত্র মূল্য নির্ধারণ)</span>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-xs">
                  <label className="block font-extrabold text-red-600 text-xs">শপ বিক্রয় মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.shopPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, shopPrice: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="যেমন: 2190"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">সাধারণ ক্রেতারা এই দামে কিনবে</p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-xs">
                  <label className="block font-extrabold text-emerald-700 text-xs">রিসেলার পাইকারি রেট (৳)</label>
                  <input
                    type="number"
                    value={editingProduct.resellerPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, resellerPrice: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="যেমন: 1700"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-sm font-bold text-emerald-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">ফাঁকা রাখলে স্বয়ংক্রিয় ৭৮% রেট হবে</p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-xs">
                  <label className="block font-extrabold text-slate-700 text-xs">MRP / নিয়মিত রেট (৳)</label>
                  <input
                    type="number"
                    value={editingProduct.regularPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, regularPrice: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="যেমন: 2500"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">কাটা দাগ দেখাতে (ঐচ্ছিক)</p>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-xs">
                  <label className="block font-extrabold text-red-600 text-xs">স্টক পরিমাণ *</label>
                  <input
                    type="number"
                    value={editingProduct.stock ?? 20}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })
                    }
                    placeholder="20"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">মজুদ পণ্যের সংখ্যা</p>
                </div>

                {/* 3 Checkboxes from Screenshot */}
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingProduct.showInShop !== false}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, showInShop: e.target.checked })
                      }
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                    />
                    <span>সাধারণ শপে দেখান</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingProduct.showInReseller !== false}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, showInReseller: e.target.checked })
                      }
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                    />
                    <span>রিসেলার ক্যাটালগে দেখান</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingProduct.dropshippingActive !== false}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, dropshippingActive: e.target.checked })
                      }
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                    />
                    <span>ড্রপশিপিং সক্রিয় রাখুন</span>
                  </label>
                </div>
              </div>

              {/* ৩. ছবি আপলোড ও প্রিভিউ (একাধিক ছবি) */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                    <span className="text-red-600">📷</span>
                    <span>৩. ছবি আপলোড ও প্রিভিউ (একাধিক ছবি)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    গ্যালারি/ক্যামেরা থেকে নির্বাচন করুন
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={multiFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageFilesSelect}
                  className="hidden"
                />

                {/* Big Red Button matching screenshot */}
                <button
                  type="button"
                  onClick={() => multiFileInputRef.current?.click()}
                  disabled={imageUploadLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm shadow-md shadow-red-600/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99]"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {imageUploadLoading
                      ? 'ছবি প্রসেস হচ্ছে...'
                      : 'ছবি নির্বাচন করুন (গ্যালারি/ক্যামেরা)'}
                  </span>
                </button>

                {/* URL Alternative Input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="অথবা অনলাইন ছবির লিঙ্ক দিন..."
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newImageUrl.trim()) {
                        const imgs = [...(editingProduct.images || []), newImageUrl.trim()];
                        setEditingProduct({ ...editingProduct, images: imgs });
                        setNewImageUrl('');
                      }
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs cursor-pointer transition"
                  >
                    যুক্ত
                  </button>
                </div>

                {/* Image Previews with Cover Badge, Reorder, and Delete */}
                {(editingProduct.images || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {(editingProduct.images || []).map((img, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white p-1.5 space-y-1.5 shadow-xs"
                      >
                        <img src={img} alt="preview" className="w-full h-24 object-cover rounded-xl" />
                        <div className="flex items-center justify-between px-1">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              idx === 0 ? 'bg-red-50 text-red-600 font-black' : 'text-slate-500'
                            }`}
                          >
                            {idx === 0 ? '★ প্রধান ছবি' : `#${idx + 1}`}
                          </span>
                          <div className="flex items-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, 'left')}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                title="Move Left"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {idx < (editingProduct.images || []).length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImage(idx, 'right')}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                title="Move Right"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ৪. ভ্যারিয়েন্ট ও বিবরণ */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-3.5">
                <div className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <span className="text-red-600">📚</span>
                  <span>৪. ভ্যারিয়েন্ট ও বিবরণ</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5">
                    ভ্যারিয়েন্ট (প্রতি লাইনে ১টি, যেমন: "সাইজ: M, L, XL" অথবা "রং: কালো, নীল"):
                  </label>
                  <textarea
                    rows={3}
                    value={variantsText}
                    onChange={(e) => setVariantsText(e.target.value)}
                    placeholder={'সাইজ: M, L, XL\nরং: কালো, নীল'}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition resize-y font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 text-xs mb-1.5">বিস্তারিত বিবরণ</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        description: e.target.value,
                        banglaDescription: e.target.value,
                      })
                    }
                    placeholder="পণ্য সম্পর্কে বিস্তারিত লিখুন..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition resize-y"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-800 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isFeatured)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                      }
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                    />
                    <span>Featured Product</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isBestseller)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, isBestseller: e.target.checked })
                      }
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                    />
                    <span>Popular Product</span>
                  </label>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSaveProduct(undefined, true)}
                  disabled={loading}
                  className="w-full sm:w-auto flex-1 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>ড্রাফট হিসেবে সংরক্ষণ</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto flex-[2] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-red-600/25 cursor-pointer disabled:opacity-50 transition active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isNewProduct ? 'নতুন পণ্য যুক্ত করুন' : 'পণ্য সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Delete Confirmation Modal (In-app, no window.confirm) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                পণ্যটি নিশ্চিতভাবে মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-slate-600 font-semibold mt-1.5">
                {productToDelete.banglaName || productToDelete.name}
              </p>
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 text-red-600 font-mono text-[11px] font-bold mt-1">
                SKU: {productToDelete.sku}
              </span>
              <p className="text-[11px] text-slate-400 mt-2">
                এটি ডাটাবেজ ও ওয়েবসাইট থেকে স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => confirmDeleteProduct(productToDelete.id)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-red-600/25 cursor-pointer disabled:opacity-50 transition active:scale-95"
              >
                {loading ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                ক্যাটাগরিটি মুছে ফেলতে চান?
              </h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                {categoryToDelete.banglaName} ({categoryToDelete.name})
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                এই ক্যাটাগরিটি স্থায়ীভাবে মুছে ফেলা হবে।
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => confirmDeleteCategory(categoryToDelete.id, categoryToDelete.banglaName)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-red-600/25 cursor-pointer disabled:opacity-50 transition active:scale-95"
              >
                {loading ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar for Admin */}
      {isAdmin && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setActiveNav('stats')}
            className={`p-1.5 flex flex-col items-center gap-0.5 cursor-pointer ${
              activeNav === 'stats' ? 'text-teal-800 font-black' : 'text-slate-500'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px]">ড্যাশবোর্ড</span>
          </button>

          <button
            onClick={() => setActiveNav('shop_orders')}
            className={`p-1.5 flex flex-col items-center gap-0.5 cursor-pointer ${
              activeNav === 'shop_orders' ? 'text-teal-800 font-black' : 'text-slate-500'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-[10px]">শপ অর্ডার</span>
          </button>

          <button
            onClick={() => setActiveNav('reseller_orders')}
            className={`p-1.5 flex flex-col items-center gap-0.5 cursor-pointer relative ${
              activeNav === 'reseller_orders' ? 'text-teal-800 font-black' : 'text-slate-500'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px]">রিসেলার</span>
            {adminStats?.pendingAdvanceVerification ? (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
            ) : null}
          </button>

          <button
            onClick={() => setActiveNav('categories')}
            className={`p-1.5 flex flex-col items-center gap-0.5 cursor-pointer ${
              activeNav === 'categories' ? 'text-teal-800 font-black' : 'text-slate-500'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px]">ক্যাটাগরি</span>
          </button>

          <button
            onClick={() => setActiveNav('settings')}
            className={`p-1.5 flex flex-col items-center gap-0.5 cursor-pointer ${
              activeNav === 'settings' ? 'text-teal-800 font-black' : 'text-slate-500'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="text-[10px]">সেটিংস</span>
          </button>
        </nav>
      )}
    </div>
  );
};
