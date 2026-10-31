import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db, verifyPassword } from './server/db.js';
import { emailService } from './server/email.js';
import type { OrderStatus } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'novashop-super-secret-hmac-key-2026';

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// --- Simple Token Generation & Verification ---
function createToken(payload: { userId: string; role: string; email: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 86400000 * 7 })).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { userId: string; role: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  user?: { userId: string; role: string; email: string };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.substring(7);
  const user = verifyToken(token);
  if (user) {
    req.user = user;
  }
  next();
}

app.use(authMiddleware);

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
  }
  next();
}

function requireReseller(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'reseller' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Access denied: Verified reseller account required.' });
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// ==========================================
// API ROUTES
// ==========================================

// --- Store Settings ---
app.get('/api/settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  // Mask sensitive SMTP password from responses
  const maskedSmtpPass = settings.smtpPass ? '••••••••' : '';
  res.json({
    ...settings,
    smtpPass: maskedSmtpPass,
    hasSmtpPass: Boolean(settings.smtpPass),
  });
});

app.put('/api/settings', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updates = { ...req.body };
    const currentSettings = db.getSettings();

    // Preserve existing password if masked or omitted
    if (!updates.smtpPass || updates.smtpPass === '••••••••') {
      updates.smtpPass = currentSettings.smtpPass;
    }

    const updated = db.updateSettings(updates, req.user?.userId);
    res.json({
      ...updated,
      smtpPass: updated.smtpPass ? '••••••••' : '',
      hasSmtpPass: Boolean(updated.smtpPass),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update store settings' });
  }
});

// --- Categories Management (Point 10) ---
app.get('/api/categories', (req: Request, res: Response) => {
  res.json(db.getCategories());
});

app.post('/api/categories', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { name, banglaName } = req.body;
    if (!name || !banglaName) {
      return res.status(400).json({ error: 'Category name and Bengali name are required' });
    }
    const created = db.createCategory(req.body, req.user?.userId);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

app.put('/api/categories/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updated = db.updateCategory(req.params.id, req.body, req.user?.userId);
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = db.deleteCategory(req.params.id, req.user?.userId);
    if (!success) return res.status(404).json({ error: 'Category not found' });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
});

// --- AI Visual Image Search (Point 5) ---
app.post('/api/search/image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    const actualMimeType = mimeType || 'image/jpeg';
    const products = db.getProducts({ publishedOnly: true });

    if (products.length === 0) {
      return res.json({ matches: [], message: 'কোনো পণ্য পাওয়া যায়নি।' });
    }

    const catalogSummary = products.map((p) => ({
      id: p.id,
      name: p.name,
      banglaName: p.banglaName,
      category: p.category,
      shopPrice: p.shopPrice,
      description: (p.description || '').slice(0, 150),
    }));

    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI();
        const prompt = `You are the AI visual search engine for NOVA SHOP, a Bangladeshi e-commerce store.
Look at the user's provided product photo.
Compare the item in the image with this store catalog of products:
${JSON.stringify(catalogSummary)}

Task: Identify which products in our catalog match or are visually similar to the item in the picture (e.g. panjabi, saree, watch, bag, gadgets, electronics, etc.).
Only return matches from the provided catalog that are genuinely similar.
If the image shows something completely unrelated to any catalog item, return an empty matches array: [].

Respond with strictly valid JSON matching this schema:
{
  "detectedItem": "short description in Bengali of what item was detected in the photo",
  "matches": [
    {
      "productId": "id of matching product",
      "confidence": number between 0.0 and 1.0,
      "reason": "short explanation in Bengali of why it matches"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: actualMimeType,
                    data: cleanBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text?.trim() || '{}';
        const parsed = JSON.parse(text);
        const matchesList: any[] = [];

        if (Array.isArray(parsed.matches)) {
          for (const m of parsed.matches) {
            const prod = products.find((p) => p.id === m.productId);
            if (prod) {
              const { resellerPrice: _rp, ...safeProd } = prod;
              matchesList.push({
                product: safeProd,
                confidence: typeof m.confidence === 'number' ? Math.round(m.confidence * 100) : 92,
                reason: m.reason || 'ছবির সাথে চমৎকার মিল পাওয়া গেছে',
              });
            }
          }
        }

        return res.json({
          detectedItem: parsed.detectedItem || 'পণ্য',
          matches: matchesList,
          geminiPowered: true,
        });
      } catch (geminiErr: any) {
        console.error('Gemini Visual Search Error, falling back to smart matcher:', geminiErr);
      }
    }

    // Heuristic Fallback Matcher (if no API key or offline)
    const fallbackMatches = products.slice(0, 3).map((p) => {
      const { resellerPrice: _rp, ...safeProd } = p;
      return {
        product: safeProd,
        confidence: 88,
        reason: 'ক্যাটালগের জনপ্রিয় ট্রেন্ডিং কালেকশন থেকে বাছাই করা হয়েছে',
      };
    });

    return res.json({
      detectedItem: 'পণ্য',
      matches: fallbackMatches,
      geminiPowered: false,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Image search failed' });
  }
});

// --- Products ---
app.get('/api/products', (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const query = req.query.q as string | undefined;
  const isResellerOrAdmin = (req as AuthRequest).user?.role === 'admin' || (req as AuthRequest).user?.role === 'reseller';
  
  const products = db.getProducts({
    category,
    query,
    publishedOnly: !isResellerOrAdmin,
  });

  // If regular customer, hide wholesale resellerPrice to protect margins
  if (!isResellerOrAdmin) {
    const masked = products.map(({ resellerPrice: _rp, ...rest }) => rest);
    return res.json(masked);
  }

  res.json(products);
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const isResellerOrAdmin = (req as AuthRequest).user?.role === 'admin' || (req as AuthRequest).user?.role === 'reseller';
  if (!isResellerOrAdmin) {
    const { resellerPrice: _rp, ...rest } = product;
    return res.json(rest);
  }
  res.json(product);
});

app.post('/api/products', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, shopPrice, resellerPrice, stock, category } = req.body;
    if (!name || !sku || !shopPrice) {
      return res.status(400).json({ error: 'Name, SKU, and Shop Price are required.' });
    }
    const product = db.createProduct(req.body, req.user?.userId);
    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

app.put('/api/products/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updated = db.updateProduct(req.params.id, req.body, req.user?.userId);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = db.deleteProduct(req.params.id, req.user?.userId);
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// --- Categories ---
app.get('/api/categories', (req: Request, res: Response) => {
  res.json(db.getCategories());
});

app.put('/api/categories', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.updateCategories(req.body, req.user?.userId));
});

// --- Banners ---
app.get('/api/banners', (req: Request, res: Response) => {
  const activeOnly = req.query.active === 'true';
  res.json(db.getBanners(activeOnly));
});

app.put('/api/banners', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.updateBanners(req.body, req.user?.userId));
});

// --- Delivery Zones ---
app.get('/api/delivery-zones', (req: Request, res: Response) => {
  res.json(db.getDeliveryZones());
});

app.put('/api/delivery-zones', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.updateDeliveryZones(req.body, req.user?.userId));
});

// --- Authentication ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const valid = verifyPassword(password, user.passwordHash, user.salt);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact Nova Shop support.' });
  }

  const token = createToken({ userId: user.id, role: user.role, email: user.email });
  const { passwordHash: _ph, salt: _s, ...cleanUser } = user;
  res.json({ token, user: cleanUser });
});

app.post('/api/auth/register-reseller', async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      businessName,
      referralCode,
      registrationMethod,
      registrationSenderPhone,
      registrationTxId,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Name, email, phone, and password are required.' });
    }

    const registration = db.registerReseller({
      name,
      email,
      phone,
      password,
      businessName,
      referralCode,
      registrationMethod,
      registrationSenderPhone,
      registrationTxId,
    });

    const token = createToken({
      userId: registration.user.id,
      role: registration.user.role,
      email: registration.user.email,
    });

    // Send email notification to admin asynchronously
    const settings = db.getSettings();
    if (settings.emailNotificationsEnabled && settings.emailNotificationEvents?.resellerRegistration) {
      emailService.sendNotification(
        settings,
        'resellerRegistration',
        `[NOVA SHOP] নতুন রিসেলার আবেদন: ${name}`,
        `<h3>নতুন রিসেলার রেজিস্ট্রেশন আবেদন</h3>
         <p><strong>নাম:</strong> ${name}</p>
         <p><strong>ইমেইল:</strong> ${email}</p>
         <p><strong>ফোন:</strong> ${phone}</p>
         <p><strong>ব্যবসার নাম:</strong> ${businessName || 'N/A'}</p>
         <p><strong>রেজিস্ট্রেশন ফি:</strong> ৳${registration.netFee} (মূল ফি: ৳${registration.requiredFee}, ছাড়: ৳${registration.appliedDiscount})</p>
         <p><strong>পেমেন্ট ট্রানজ্যাকশন আইডি:</strong> ${registrationTxId || 'Not provided'}</p>
         <p>অ্যাডমিন প্যানেলে লগইন করে অনুমোদন করুন।</p>`
      ).then(({ log }) => db.addEmailLog(log)).catch(console.error);
    }

    res.status(201).json({
      token,
      user: registration.user,
      appliedDiscount: registration.appliedDiscount,
      netFee: registration.netFee,
      message: registration.user.status === 'pending_approval' 
        ? 'Registration successful! Your reseller account is pending admin verification and approval.' 
        : 'Registration successful!',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to register reseller' });
  }
});

app.get('/api/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash: _ph, salt: _s, ...cleanUser } = user;
  res.json(cleanUser);
});

// Admin Password Change Endpoint
app.post('/api/admin/change-password', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'বর্তমান পাসওয়ার্ড এবং নতুন পাসওয়ার্ড প্রদান করুন।' });
    }
    const result = db.changeUserPassword(req.user!.userId, currentPassword, newPassword, req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'পাসওয়ার্ড পরিবর্তনে ব্যর্থ হয়েছে।' });
  }
});

// Authenticated User Password Change Endpoint
app.post('/api/auth/change-password', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'বর্তমান পাসওয়ার্ড এবং নতুন পাসওয়ার্ড প্রদান করুন।' });
    }
    const result = db.changeUserPassword(req.user!.userId, currentPassword, newPassword, req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'পাসওয়ার্ড পরিবর্তনে ব্যর্থ হয়েছে।' });
  }
});

// --- Customer Order Placement (Guest or Direct) ---
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      deliveryZoneId,
      items,
      paymentMethod,
      customerTxId,
      customerSenderPhone,
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !customerAddress || !deliveryZoneId || !items || !items.length) {
      return res.status(400).json({ error: 'Please fill in all delivery details and add items to your cart.' });
    }

    // Phone validation for Bangladesh
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 11-digit Bangladeshi mobile number (01XXXXXXXXX).' });
    }

    const zones = db.getDeliveryZones();
    const zone = zones.find((z) => z.id === deliveryZoneId);
    if (!zone) {
      return res.status(400).json({ error: 'Invalid delivery zone selected.' });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = db.getProductById(item.productId);
      if (!prod) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${prod.name}". Available: ${prod.stock}` });
      }
      const itemSubtotal = prod.shopPrice * item.quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        productId: prod.id,
        productName: prod.name,
        productBanglaName: prod.banglaName,
        productImage: prod.images[0] || '',
        selectedVariants: item.selectedVariants || {},
        quantity: item.quantity,
        unitPrice: prod.shopPrice,
        costPrice: prod.resellerPrice,
        subtotal: itemSubtotal,
      });
    }

    const deliveryCharge = zone.charge;
    const totalAmount = subtotal + deliveryCharge;

    const order = db.createOrder({
      orderType: 'direct_customer',
      customerName,
      customerPhone: cleanPhone,
      customerAddress,
      deliveryZoneId: zone.id,
      deliveryZoneName: zone.name,
      deliveryCharge,
      items: validatedItems,
      subtotal,
      totalAmount,
      paymentMethod: paymentMethod || 'cod',
      customerPaymentStatus: 'PENDING',
      customerTxId,
      customerSenderPhone,
      orderStatus: 'PENDING',
      notes,
    });

    // Notify via email
    const settings = db.getSettings();
    if (settings.emailNotificationsEnabled && settings.emailNotificationEvents?.newShopOrder) {
      emailService.sendNotification(
        settings,
        'newShopOrder',
        `[NOVA SHOP] নতুন কাস্টমার অর্ডার #${order.id}`,
        `<h3>নতুন অর্ডার গ্রহণ করা হয়েছে (#${order.id})</h3>
         <p><strong>গ্রাহকের নাম:</strong> ${order.customerName}</p>
         <p><strong>ফোন:</strong> ${order.customerPhone}</p>
         <p><strong>ঠিকানা:</strong> ${order.customerAddress}</p>
         <p><strong>ডেলিভারি এরিয়া:</strong> ${order.deliveryZoneName} (৳${order.deliveryCharge})</p>
         <p><strong>সর্বমোট মূল্য:</strong> ৳${order.totalAmount} (${order.paymentMethod.toUpperCase()})</p>`
      ).then(({ log }) => db.addEmailLog(log)).catch(console.error);
    }

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to place order' });
  }
});

// --- Reseller Order Placement with Mandatory Advance Payment Rule ---
app.post('/api/reseller/orders', requireReseller, async (req: AuthRequest, res: Response) => {
  try {
    const resellerUser = db.findUserById(req.user!.userId);
    if (!resellerUser) {
      return res.status(404).json({ error: 'Reseller account not found.' });
    }

    if (resellerUser.status === 'pending_approval') {
      return res.status(403).json({ error: 'Your reseller account is pending admin approval. You cannot place orders yet.' });
    }
    if (resellerUser.status === 'suspended') {
      return res.status(403).json({ error: 'Your reseller account is suspended.' });
    }

    const {
      customerName,
      customerPhone,
      customerAddress,
      deliveryZoneId,
      items,
      advancePayment,
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !customerAddress || !deliveryZoneId || !items || !items.length) {
      return res.status(400).json({ error: 'Customer delivery information and items are required.' });
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 11-digit Bangladeshi customer mobile number.' });
    }

    const zones = db.getDeliveryZones();
    const zone = zones.find((z) => z.id === deliveryZoneId);
    if (!zone) {
      return res.status(400).json({ error: 'Invalid delivery zone.' });
    }

    const settings = db.getSettings();
    const minAdvance = settings.minResellerAdvance || 50;

    // MANDATORY RESELLER ADVANCE DELIVERY PAYMENT VALIDATION
    if (!advancePayment) {
      return res.status(400).json({
        error: `MANDATORY RULE: Reseller orders require an advance delivery payment of at least ৳${minAdvance}.`,
      });
    }

    const paidAmount = parseFloat(advancePayment.paidAmount) || 0;
    if (paidAmount < minAdvance) {
      return res.status(400).json({
        error: `Insufficient advance payment: Minimum required advance delivery charge is ৳${minAdvance}. You provided ৳${paidAmount}.`,
      });
    }

    if (!advancePayment.txId || advancePayment.txId.trim().length < 4) {
      return res.status(400).json({
        error: 'Please provide a valid Transaction ID (TrxID) for the advance delivery payment.',
      });
    }

    if (db.checkDuplicateTransactionId(advancePayment.txId)) {
      return res.status(400).json({
        error: `Duplicate transaction detected: TrxID "${advancePayment.txId}" has already been used in the system.`,
      });
    }

    // Validate items, stock, and reseller selling price limits
    let costSubtotal = 0;
    let customerSellingSubtotal = 0;
    const validatedItems = [];
    const defaultMarkup = settings.globalResellerMaxMarkupPercent || 60;

    for (const item of items) {
      const prod = db.getProductById(item.productId);
      if (!prod) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${prod.name}". Available: ${prod.stock}` });
      }

      const unitSellingPrice = parseFloat(item.resellerSellingPrice);
      if (isNaN(unitSellingPrice) || unitSellingPrice < prod.resellerPrice) {
        return res.status(400).json({
          error: `Selling price for "${prod.name}" cannot be lower than wholesale reseller cost (৳${prod.resellerPrice}).`,
        });
      }

      // Check max price limit
      const maxAllowedPrice = prod.resellerMaxPrice || Math.round(prod.resellerPrice * (1 + defaultMarkup / 100)) || prod.regularPrice;
      if (unitSellingPrice > maxAllowedPrice) {
        return res.status(400).json({
          error: `Selling price for "${prod.name}" (৳${unitSellingPrice}) exceeds the maximum allowed price (৳${maxAllowedPrice}).`,
        });
      }

      const itemCostTotal = prod.resellerPrice * item.quantity;
      const itemSellingTotal = unitSellingPrice * item.quantity;

      costSubtotal += itemCostTotal;
      customerSellingSubtotal += itemSellingTotal;

      validatedItems.push({
        productId: prod.id,
        productName: prod.name,
        productBanglaName: prod.banglaName,
        productImage: prod.images[0] || '',
        selectedVariants: item.selectedVariants || {},
        quantity: item.quantity,
        unitPrice: unitSellingPrice,
        costPrice: prod.resellerPrice,
        subtotal: itemSellingTotal,
      });
    }

    const deliveryCharge = zone.charge;
    const totalAmount = customerSellingSubtotal + deliveryCharge;
    const resellerProfit = customerSellingSubtotal - costSubtotal;

    const order = db.createOrder({
      orderType: 'reseller_order',
      resellerId: resellerUser.id,
      resellerName: resellerUser.businessName || resellerUser.name,
      resellerPhone: resellerUser.phone,
      customerName,
      customerPhone: cleanPhone,
      customerAddress,
      deliveryZoneId: zone.id,
      deliveryZoneName: zone.name,
      deliveryCharge,
      items: validatedItems,
      subtotal: customerSellingSubtotal,
      totalAmount,
      resellerSellingPriceTotal: customerSellingSubtotal,
      resellerProfit,
      paymentMethod: 'cod',
      customerPaymentStatus: 'PENDING',
      resellerAdvancePayment: {
        requiredAmount: minAdvance,
        paidAmount,
        method: advancePayment.method || 'bkash',
        senderPhone: advancePayment.senderPhone,
        txId: advancePayment.txId.trim(),
        screenshotUrl: advancePayment.screenshotUrl,
        status: 'PENDING_VERIFICATION', // Strictly pending admin verification!
      },
      orderStatus: 'PENDING',
      notes,
    });

    // Notify via email
    if (settings.emailNotificationsEnabled && settings.emailNotificationEvents?.newResellerOrder) {
      emailService.sendNotification(
        settings,
        'newResellerOrder',
        `[NOVA SHOP] নতুন রিসেলার অর্ডার #${order.id} (অ্যাডভান্স ভেরিফিকেশন বাকি)`,
        `<h3>নতুন রিসেলার অর্ডার (#${order.id})</h3>
         <p><strong>রিসেলার:</strong> ${order.resellerName} (${order.resellerPhone})</p>
         <p><strong>কাস্টমার:</strong> ${order.customerName} (${order.customerPhone})</p>
         <p><strong>কাস্টমার বিল:</strong> ৳${order.totalAmount} (ক্যাশ অন ডেলিভারি)</p>
         <p><strong>রিসেলার প্রত্যাশিত লাভ:</strong> ৳${order.resellerProfit}</p>
         <hr/>
         <h4>অ্যাডভান্স ডেলিভারি চার্জ বিবরণী:</h4>
         <p><strong>জমা দেওয়া পরিমাণ:</strong> ৳${order.resellerAdvancePayment?.paidAmount}</p>
         <p><strong>মেথড:</strong> ${order.resellerAdvancePayment?.method?.toUpperCase()}</p>
         <p><strong>TrxID:</strong> ${order.resellerAdvancePayment?.txId}</p>
         <p style="color: red; font-weight: bold;">সতর্কতা: অ্যাডমিন কর্তৃক অগ্রিম ডেলিভারি চার্জ যাচাই না করা পর্যন্ত পার্সেল প্রেরণ করা যাবে না।</p>`
      ).then(({ log }) => db.addEmailLog(log)).catch(console.error);
    }

    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to place reseller order' });
  }
});

// --- Reseller Dashboard Stats & Orders ---
app.get('/api/reseller/orders', requireReseller, (req: AuthRequest, res: Response) => {
  const orders = db.getOrders({ resellerId: req.user!.userId });
  res.json(orders);
});

app.get('/api/reseller/stats', requireReseller, (req: AuthRequest, res: Response) => {
  const user = db.findUserById(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const orders = db.getOrders({ resellerId: req.user!.userId });
  const totalOrders = orders.length;
  const pendingVerificationOrders = orders.filter((o) => o.resellerAdvancePayment?.status === 'PENDING_VERIFICATION').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  
  const pendingProfit = orders
    .filter((o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.resellerProfit || 0), 0);

  res.json({
    totalEarnings: user.commissionBalance || 0,
    withdrawnEarnings: user.totalWithdrawn || 0,
    availableBalance: user.commissionBalance || 0,
    pendingCommission: user.pendingCommission || 0,
    reservedWithdrawal: user.reservedWithdrawal || 0,
    pendingProfit,
    totalOrders,
    pendingVerificationOrders,
    deliveredOrders,
    referralCode: user.referralCode,
  });
});

// --- Reseller Referrals & Commission Ledger ---
app.get('/api/reseller/referrals', requireReseller, (req: AuthRequest, res: Response) => {
  const user = db.findUserById(req.user!.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const commissions = db.getReferralCommissions({ referrerId: user.id });
  const settings = db.getSettings();

  const referredUsers = db.getUsers().filter((u) => u.referredBy === user.referralCode);

  res.json({
    referralCode: user.referralCode,
    referralEnabled: settings.referralEnabled,
    commissionAmountPerReferral: settings.referralCommissionAmount,
    discountMode: settings.referralDiscountMode,
    discountValue: settings.referralDiscountValue,
    commissionBalance: user.commissionBalance || 0,
    pendingCommission: user.pendingCommission || 0,
    totalReferredCount: referredUsers.length,
    activeReferredCount: referredUsers.filter((u) => u.status === 'active').length,
    commissions,
  });
});

// --- Reseller Withdrawals ---
app.get('/api/reseller/withdrawals', requireReseller, (req: AuthRequest, res: Response) => {
  const list = db.getWithdrawals({ resellerId: req.user!.userId });
  res.json(list);
});

// --- Reseller Profit Records (Section 12) ---
app.get('/api/reseller/profits', requireReseller, (req: AuthRequest, res: Response) => {
  const profits = db.getResellerProfits({ resellerId: req.user!.userId });
  res.json(profits);
});

app.post('/api/reseller/withdrawals', requireReseller, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, payoutMethod, payoutNumber } = req.body;
    if (!amount || !payoutMethod || !payoutNumber) {
      return res.status(400).json({ error: 'Amount, payout method, and payout account number are required.' });
    }

    const withdrawal = db.requestWithdrawal(
      req.user!.userId,
      parseFloat(amount),
      payoutMethod,
      payoutNumber
    );

    // Notify admin
    const settings = db.getSettings();
    if (settings.emailNotificationsEnabled && settings.emailNotificationEvents?.withdrawalRequested) {
      emailService.sendNotification(
        settings,
        'withdrawalRequested',
        `[NOVA SHOP] নতুন উইথড্রল রিকোয়েস্ট: ৳${withdrawal.amount}`,
        `<h3>রিসেলার উইথড্রল রিকোয়েস্ট</h3>
         <p><strong>রিসেলার:</strong> ${withdrawal.resellerName} (${withdrawal.resellerPhone})</p>
         <p><strong>টাকার পরিমাণ:</strong> ৳${withdrawal.amount}</p>
         <p><strong>মেথড:</strong> ${withdrawal.payoutMethod.toUpperCase()}</p>
         <p><strong>অ্যাকাউন্ট নম্বর:</strong> ${withdrawal.payoutNumber}</p>`
      ).then(({ log }) => db.addEmailLog(log)).catch(console.error);
    }

    res.status(201).json(withdrawal);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit withdrawal request' });
  }
});

// --- Order Tracking (Public) ---
app.get('/api/orders/track/:orderId', (req: Request, res: Response) => {
  const queryPhone = req.query.phone as string | undefined;
  const order = db.getOrderById(req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found. Please verify your Order ID.' });
  }

  // If phone provided, verify matching phone
  if (queryPhone) {
    const cleanPhone = queryPhone.replace(/\D/g, '');
    const cleanOrderPhone = order.customerPhone.replace(/\D/g, '');
    if (!cleanOrderPhone.endsWith(cleanPhone) && !cleanPhone.endsWith(cleanOrderPhone)) {
      return res.status(403).json({ error: 'Phone number does not match this order.' });
    }
  }

  res.json({
    id: order.id,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    customerName: order.customerName,
    deliveryZoneName: order.deliveryZoneName,
    deliveryCharge: order.deliveryCharge,
    totalAmount: order.totalAmount,
    items: order.items.map((i) => ({
      productName: i.productName,
      productBanglaName: i.productBanglaName,
      quantity: i.quantity,
      selectedVariants: i.selectedVariants,
    })),
    resellerAdvanceStatus: order.resellerAdvancePayment?.status,
  });
});

// --- Admin Orders & Advance Payment Verification ---
app.get('/api/admin/orders', requireAdmin, (req: AuthRequest, res: Response) => {
  const status = req.query.status as OrderStatus | undefined;
  const orders = db.getOrders({ status });
  res.json(orders);
});

app.post('/api/admin/orders/:id/verify-advance', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { action, adminNotes } = req.body;
    if (action !== 'VERIFY' && action !== 'REJECT') {
      return res.status(400).json({ error: 'Action must be VERIFY or REJECT.' });
    }
    const updated = db.verifyResellerAdvancePayment(
      req.params.id,
      action,
      adminNotes,
      req.user?.userId
    );

    // Notify via email
    const settings = db.getSettings();
    if (settings.emailNotificationsEnabled && settings.emailNotificationEvents?.advancePaymentVerified) {
      emailService.sendNotification(
        settings,
        'advancePaymentVerified',
        `[NOVA SHOP] অর্ডার #${updated.id} অগ্রিম পেমেন্ট ${action === 'VERIFY' ? 'অনুমোদিত' : 'বাতিল'}`,
        `<p>অর্ডার #${updated.id}-এর জন্য রিসেলার অ্যাডভান্স পেমেন্ট ${action === 'VERIFY' ? 'সফলভাবে ভেরিফাই' : 'বাতিল'} করা হয়েছে।</p>`
      ).then(({ log }) => db.addEmailLog(log)).catch(console.error);
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to verify advance payment' });
  }
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const updated = db.updateOrderStatus(req.params.id, status, req.user?.userId);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update order status' });
  }
});

// --- Admin Resellers & Registration Payment Verification ---
app.get('/api/admin/resellers', requireAdmin, (req: AuthRequest, res: Response) => {
  const users = db.getUsers().filter((u) => u.role === 'reseller');
  // Sort: Pending applications first, then by newest registration date
  users.sort((a, b) => {
    const aPending = a.status === 'pending_approval' || a.regPaymentStatus === 'PENDING_VERIFICATION';
    const bPending = b.status === 'pending_approval' || b.regPaymentStatus === 'PENDING_VERIFICATION';
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
  res.json(users);
});

app.post('/api/admin/resellers/:id/verify-payment', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { action, notes } = req.body;
    if (action !== 'VERIFY' && action !== 'REJECT') {
      return res.status(400).json({ error: 'Action must be VERIFY or REJECT.' });
    }
    const updated = db.verifyResellerRegistrationPayment(
      req.params.id,
      action,
      notes,
      req.user?.userId
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to verify reseller payment' });
  }
});

app.patch('/api/admin/resellers/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const updated = db.updateUserStatus(req.params.id, status, req.user?.userId);
    if (!updated) {
      return res.status(404).json({ error: 'Reseller not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update reseller status' });
  }
});

// --- Admin Referrals & Commissions ---
app.get('/api/admin/referrals', requireAdmin, (req: AuthRequest, res: Response) => {
  const commissions = db.getReferralCommissions();
  res.json(commissions);
});

app.post('/api/admin/referrals/:id/approve', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const comm = db.approveReferralCommission(req.params.id, req.user?.userId);
    res.json(comm);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to approve referral commission' });
  }
});

app.post('/api/admin/referrals/:id/reject', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const comm = db.rejectReferralCommission(req.params.id, reason, req.user?.userId);
    res.json(comm);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reject referral commission' });
  }
});

// --- Admin Withdrawals Management ---
app.get('/api/admin/withdrawals', requireAdmin, (req: AuthRequest, res: Response) => {
  const withdrawals = db.getWithdrawals();
  res.json(withdrawals);
});

app.post('/api/admin/withdrawals/:id/approve', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { txId, adminNotes } = req.body;
    if (!txId) {
      return res.status(400).json({ error: 'Transaction ID is required when approving a payout.' });
    }
    const withdrawal = db.approveWithdrawal(req.params.id, txId, adminNotes, req.user?.userId);

    // Notify reseller
    const settings = db.getSettings();
    if (settings.emailNotificationsEnabled && settings.emailNotificationEvents?.withdrawalPaid) {
      emailService.sendNotification(
        settings,
        'withdrawalPaid',
        `[NOVA SHOP] উইথড্রল পেমেন্ট সফল: ৳${withdrawal.amount}`,
        `<p>আপনার ৳${withdrawal.amount} উইথড্রল রিকোয়েস্ট পরিশোধ করা হয়েছে।</p>
         <p><strong>মেথড:</strong> ${withdrawal.payoutMethod.toUpperCase()}</p>
         <p><strong>অ্যাকাউন্ট:</strong> ${withdrawal.payoutNumber}</p>
         <p><strong>TrxID:</strong> ${txId}</p>`
      ).then(({ log }) => db.addEmailLog(log)).catch(console.error);
    }

    res.json(withdrawal);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to approve withdrawal' });
  }
});

app.post('/api/admin/withdrawals/:id/reject', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const withdrawal = db.rejectWithdrawal(req.params.id, reason || 'Rejected by admin', req.user?.userId);
    res.json(withdrawal);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reject withdrawal' });
  }
});

// --- Admin Reseller Profit Approvals (Section 12) ---
app.get('/api/admin/reseller-profits', requireAdmin, (req: AuthRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  const list = db.getResellerProfits({ status });
  res.json(list);
});

app.post('/api/admin/reseller-profits/:id/approve', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { deductions, adminNotes } = req.body;
    const profit = db.approveResellerProfit(req.params.id, req.user?.userId, {
      deductions: deductions !== undefined ? parseFloat(deductions) : undefined,
      adminNotes,
    });
    res.json(profit);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to approve reseller profit' });
  }
});

app.post('/api/admin/reseller-profits/:id/reject', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const profit = db.rejectResellerProfit(req.params.id, reason || 'Rejected by admin', req.user?.userId);
    res.json(profit);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reject reseller profit' });
  }
});

app.post('/api/admin/reseller-profits/:id/hold', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const profit = db.holdResellerProfit(req.params.id, reason || 'Placed on hold', req.user?.userId);
    res.json(profit);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to hold reseller profit' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const result = db.deleteUser(req.params.id, req.user?.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete user' });
  }
});

// --- Admin Stats ---
app.get('/api/admin/stats', requireAdmin, (req: AuthRequest, res: Response) => {
  const orders = db.getOrders();
  const products = db.getProducts();
  const users = db.getUsers();
  const withdrawals = db.getWithdrawals();
  const commissions = db.getReferralCommissions();
  const profits = db.getResellerProfits();

  const totalSales = orders
    .filter((o) => o.orderStatus !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingAdvanceVerification = orders.filter(
    (o) => o.resellerAdvancePayment?.status === 'PENDING_VERIFICATION'
  ).length;

  const pendingResellerApprovals = users.filter(
    (u) => u.role === 'reseller' && u.status !== 'archived' && (u.status === 'pending_approval' || u.regPaymentStatus === 'PENDING_VERIFICATION')
  ).length;

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'PENDING').length;
  const pendingCommissionsCount = commissions.filter((c) => c.status === 'PENDING').length;
  const pendingProfitsCount = profits.filter((p) => p.status === 'PENDING').length;
  const lowStockCount = products.filter((p) => p.stock <= 5).length;

  res.json({
    totalSales,
    totalOrders: orders.length,
    pendingAdvanceVerification,
    pendingResellerApprovals,
    pendingWithdrawalsCount,
    pendingCommissionsCount,
    pendingProfitsCount,
    lowStockCount,
    totalProducts: products.length,
    totalResellers: users.filter((u) => u.role === 'reseller').length,
    recentOrders: orders.slice(0, 5),
  });
});

// --- CSV Product Import & Export ---
app.get('/api/admin/products/export-csv', requireAdmin, (req: AuthRequest, res: Response) => {
  const csvData = db.exportProductsCSV();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="novashop-products-${Date.now()}.csv"`);
  res.send(csvData);
});

app.post('/api/admin/products/preview-csv', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'CSV content is required.' });
    }
    const preview = db.previewCSVImport(csvContent);
    res.json(preview);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to parse CSV preview' });
  }
});

app.post('/api/admin/products/import-csv', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) {
      return res.status(400).json({ error: 'CSV content is required.' });
    }
    const result = db.commitCSVImport(csvContent, req.user?.userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to import CSV' });
  }
});

// --- Database Backup & Restore ---
app.get('/api/admin/backup/export', requireAdmin, (req: AuthRequest, res: Response) => {
  const backup = db.createBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
  res.send(backup.jsonContent);
});

app.get('/api/admin/backup/list', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.listBackups());
});

app.post('/api/admin/backup/restore', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { jsonContent } = req.body;
    if (!jsonContent) {
      return res.status(400).json({ error: 'Backup JSON content is required.' });
    }
    db.restoreBackup(jsonContent, req.user?.userId);
    res.json({ success: true, message: 'Database restored successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to restore backup' });
  }
});

// --- Email / SMTP Test & Logs ---
app.post('/api/admin/test-email', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { testRecipient, host, port, user, pass } = req.body;
    const currentSettings = db.getSettings();

    const testSettings = {
      ...currentSettings,
      smtpHost: host || currentSettings.smtpHost,
      smtpPort: port ? parseInt(port, 10) : currentSettings.smtpPort,
      smtpUser: user || currentSettings.smtpUser,
      smtpPass: (pass && pass !== '••••••••') ? pass : currentSettings.smtpPass,
    };

    const result = await emailService.testConnection(testSettings, testRecipient);
    
    // Automatically persist testRecipient in settings so user never has to re-type it
    if (testRecipient && testRecipient.trim() !== '') {
      db.updateSettings({ testEmailRecipient: testRecipient.trim() }, req.user?.userId);
    }

    db.addEmailLog({
      id: `test-${Date.now()}`,
      to: testRecipient || testSettings.smtpUser || 'Unknown',
      subject: '[Test] SMTP Connection Test',
      event: 'testEmail',
      status: result.success ? 'SENT' : 'FAILED',
      errorDetails: result.success ? undefined : result.message,
      timestamp: new Date().toISOString(),
    });

    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'SMTP test execution failed' });
  }
});

app.get('/api/admin/email-logs', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json(db.getEmailLogs());
});

app.post('/api/admin/email-logs/:id/resend', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const logs = db.getEmailLogs();
    const log = logs.find((l) => l.id === req.params.id);
    if (!log) return res.status(404).json({ error: 'Email log not found' });

    const settings = db.getSettings();
    const result = await emailService.sendNotification(
      settings,
      log.event,
      `[Resend] ${log.subject}`,
      `<p><strong>পুনরায় পাঠানো ইমেইল নোটিফিকেশন:</strong> ${log.event}</p><p>মূল বিষয়: ${log.subject}</p>`,
      [log.to],
      true
    );
    db.addEmailLog(result.log);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to resend email' });
  }
});

// ==========================================
// VITE DEV SERVER OR STATIC ASSETS
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const http = await import('http');
  const server = http.createServer(app);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
          clientPort: 443,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Nova Shop Full-Stack Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
}

export default app;
export { app };
