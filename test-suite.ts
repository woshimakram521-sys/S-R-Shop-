import { db, hashPassword, verifyPassword } from './server/db.js';

console.log('--- STARTING NOVA SHOP COMPREHENSIVE TEST SUITE ---');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. Settings & Persistence
  const settings = db.getSettings();
  assert(settings.shopName === 'Nova Shop', 'Store settings loaded with Bengali brand');
  assert(settings.minResellerAdvance >= 50, 'Minimum reseller advance delivery charge is at least ৳50');

  const updatedSettings = db.updateSettings({ helplinePhone: '09612-999888' });
  assert(db.getSettings().helplinePhone === '09612-999888', 'Settings update persists on server');

  // 2. Products & 3-Tier Pricing + Reseller Max Price
  const products = db.getProducts();
  assert(products.length >= 7, 'Default Bangladeshi products seeded');

  const panjabi = products.find((p) => p.sku === 'M-PNJ-01')!;
  assert(
    panjabi.shopPrice > 0 && panjabi.resellerPrice > 0 && panjabi.regularPrice > 0,
    '3-Tier pricing exists (Shop, Reseller, Regular MRP)'
  );
  assert(
    panjabi.resellerPrice < panjabi.shopPrice,
    'Wholesale reseller price is lower than customer shop price'
  );
  assert(
    panjabi.resellerMaxPrice !== undefined && panjabi.resellerMaxPrice > panjabi.resellerPrice,
    'Reseller Max Price is configured and exceeds wholesale price'
  );

  // 3. Password Hashing & Security
  const testPass = 'SecurePass@2026';
  const { hash, salt } = hashPassword(testPass);
  assert(verifyPassword(testPass, hash, salt), 'Password verification succeeds with correct credentials');
  assert(!verifyPassword('WrongPass', hash, salt), 'Password verification fails with incorrect credentials');

  // 4. Reseller Registration, Duplicate TrxID, and Referral Discount
  let referrerUser = db.getUsers().find((u) => u.role === "reseller" && u.status === "active");
  if (!referrerUser) {
    const created = db.createUser({
      name: "Kabir Ahmed",
      email: "kabir-" + Date.now() + "@reseller.bd",
      phone: "01899112233",
      password: "Password123",
      role: "reseller",
    });
    db.updateUserStatus(created.id, "active");
    referrerUser = db.findUserById(created.id)!;
  }
  const referrerCode = referrerUser.referralCode || 'NOVA-1001';

  // Test registration with referral discount
  const regResult = db.registerReseller({
    name: 'Asif Karim',
    email: `asif-${Date.now()}@reseller.bd`,
    phone: '01799887766',
    password: 'Password123',
    businessName: 'Karim Traders',
    referralCode: referrerCode,
    registrationMethod: 'bkash',
    registrationSenderPhone: '01799887766',
    registrationTxId: `BK-${Date.now()}-REG`,
  });

  assert(regResult.user.role === 'reseller', 'Reseller user created');
  assert(regResult.user.status === 'pending_approval', 'Reseller starts as pending_approval by default');
  assert(regResult.appliedDiscount > 0, 'Referral discount correctly applied on registration fee');
  assert(regResult.netFee < regResult.requiredFee, 'Net registration fee is lower than standard fee');

  // Test duplicate TrxID rejection
  let duplicateRejected = false;
  try {
    db.registerReseller({
      name: 'Duplicate Attempt',
      email: `dup-${Date.now()}@reseller.bd`,
      phone: '01711223344',
      password: 'Password123',
      registrationTxId: regResult.user.registrationTxId, // same TrxID
    });
  } catch (err: any) {
    duplicateRejected = err.message.includes('already been submitted');
  }
  assert(duplicateRejected, 'Duplicate registration transaction reference is rejected by server');

  // Test verifying registration payment & auto referral commission (Point 9)
  const prevAvailableBalance = referrerUser.commissionBalance || 0;
  const verifiedReseller = db.verifyResellerRegistrationPayment(regResult.user.id, 'VERIFY', 'Payment confirmed');
  assert(verifiedReseller.status === 'active', 'Reseller becomes active once payment is verified');
  assert(verifiedReseller.registrationFeePaid === true, 'Registration fee marked as paid');

  const updatedReferrer = db.findUserById(referrerUser.id)!;
  assert(
    updatedReferrer.commissionBalance === prevAvailableBalance + (db.getSettings().referralCommissionAmount || 100),
    'Point 9: Referrer automatically received referral commission in Available Balance upon reseller approval'
  );

  // 5. Commission Approval & Wallet Ledger
  const commissions = db.getReferralCommissions({ referrerId: referrerUser.id });
  assert(commissions.length > 0, 'Referral commission recorded in auditable ledger');
  const finalReferrer = updatedReferrer;

  // 6. Withdrawals & Double-Spending Prevention
  // Minimum withdrawal threshold
  let minWithdrawalBlocked = false;
  try {
    db.requestWithdrawal(finalReferrer.id, 100, 'bkash', finalReferrer.phone);
  } catch (err: any) {
    minWithdrawalBlocked = err.message.includes('Minimum withdrawal');
  }
  assert(minWithdrawalBlocked, 'Withdrawal request below ৳500 minimum threshold is rejected');

  // Ensure user has enough balance for test
  finalReferrer.commissionBalance = 1000;
  db.save();

  const withdrawal = db.requestWithdrawal(finalReferrer.id, 600, 'bkash', finalReferrer.phone);
  assert(withdrawal.status === 'PENDING', 'Valid withdrawal request created with status PENDING');

  const userAfterRequest = db.findUserById(finalReferrer.id)!;
  assert(userAfterRequest.commissionBalance === 400, 'Requested withdrawal amount deducted from available balance');
  assert(userAfterRequest.reservedWithdrawal === 600, 'Requested amount atomically reserved to prevent double spending');

  // Approve withdrawal
  const paidWithdrawal = db.approveWithdrawal(withdrawal.id, 'TRX-PAYOUT-991', 'bKash paid');
  assert(paidWithdrawal.status === 'PAID', 'Admin approved payout with TrxID');

  const userAfterPayout = db.findUserById(finalReferrer.id)!;
  assert(userAfterPayout.reservedWithdrawal === 0, 'Reserved withdrawal released after payout');
  assert(userAfterPayout.totalWithdrawn >= 600, 'Total withdrawn balance incremented');

  // 7. Order Placement & Price Limit Enforcement
  const initialStock = panjabi.stock;
  
  // Test price limit violation: selling price exceeding resellerMaxPrice
  let maxPriceBlocked = false;
  try {
    db.createOrder({
      orderType: 'reseller_order',
      customerName: 'Test Price Violator',
      customerPhone: '01711223344',
      customerAddress: 'Banani, Dhaka',
      deliveryZoneId: 'zone-1',
      deliveryZoneName: 'Inside Dhaka',
      deliveryCharge: 70,
      items: [
        {
          productId: panjabi.id,
          productName: panjabi.name,
          productImage: panjabi.images[0],
          quantity: 1,
          unitPrice: panjabi.resellerMaxPrice! + 500, // exceeds max limit!
          costPrice: panjabi.resellerPrice,
          subtotal: panjabi.resellerMaxPrice! + 500,
        },
      ],
      subtotal: panjabi.resellerMaxPrice! + 500,
      totalAmount: panjabi.resellerMaxPrice! + 570,
      paymentMethod: 'cod',
      customerPaymentStatus: 'PENDING',
      orderStatus: 'PENDING',
      resellerAdvancePayment: {
        requiredAmount: 50,
        paidAmount: 50,
        method: 'bkash',
        txId: `BK-${Date.now()}-EXP`,
        status: 'PENDING_VERIFICATION',
      },
    });
  } catch (err: any) {
    maxPriceBlocked = err.message.includes('exceeds allowed maximum price');
  }
  assert(maxPriceBlocked, 'Server enforces: reseller selling price CANNOT exceed Reseller Max Price');

  // Test valid reseller order
  const validOrder = db.createOrder({
    orderType: 'reseller_order',
    resellerId: referrerUser.id,
    resellerName: referrerUser.name,
    resellerPhone: referrerUser.phone,
    customerName: 'Valid Reseller Customer',
    customerPhone: '01711223344',
    customerAddress: 'Mirpur-10, Dhaka',
    deliveryZoneId: 'zone-1',
    deliveryZoneName: 'Inside Dhaka',
    deliveryCharge: 70,
    items: [
      {
        productId: panjabi.id,
        productName: panjabi.name,
        productImage: panjabi.images[0],
        quantity: 2,
        unitPrice: panjabi.resellerPrice + 300,
        costPrice: panjabi.resellerPrice,
        subtotal: (panjabi.resellerPrice + 300) * 2,
      },
    ],
    subtotal: (panjabi.resellerPrice + 300) * 2,
    totalAmount: (panjabi.resellerPrice + 300) * 2 + 70,
    paymentMethod: 'cod',
    customerPaymentStatus: 'PENDING',
    orderStatus: 'PENDING',
    resellerAdvancePayment: {
      requiredAmount: 50,
      paidAmount: 50,
      method: 'bkash',
      txId: `BK-${Date.now()}-ORD`,
      status: 'PENDING_VERIFICATION',
    },
  });

  assert(validOrder.id.startsWith('NS-'), 'Order ID generated with format NS-YYMMDD-XXX');
  assert(db.getProductById(panjabi.id)!.stock === initialStock - 2, 'Atomic stock decrement on order placement');

  // 8. Mandatory Advance Delivery Payment Enforcement
  let blockedDispatch = false;
  try {
    db.updateOrderStatus(validOrder.id, 'SHIPPED');
  } catch (err: any) {
    blockedDispatch = err.message.includes('CRITICAL RULE VIOLATION');
  }
  assert(blockedDispatch, 'Server enforces: Reseller order CANNOT be confirmed or dispatched without verified advance payment');

  // Admin verifies advance payment
  const verifiedOrder = db.verifyResellerAdvancePayment(validOrder.id, 'VERIFY', 'Advance ৳50 verified');
  assert(verifiedOrder.resellerAdvancePayment?.status === 'VERIFIED', 'Admin verified reseller advance payment');

  const shippedOrder = db.updateOrderStatus(validOrder.id, 'SHIPPED');
  assert(shippedOrder?.orderStatus === 'SHIPPED', 'Order can now be marked SHIPPED after verification');

  // 9. CSV Export & Import with Reseller Max Price
  const exportedCSV = db.exportProductsCSV();
  const firstLine = exportedCSV.split('\n')[0];
  assert(
    firstLine.includes('Reseller Max Price'),
    'CSV export includes the new 12th column: Reseller Max Price'
  );

  // Backward compatibility test: import legacy 11-column CSV
  const legSku = `LEGACY-${Date.now()}`;
  const legacyCSV = `ID,SKU,Name,Category,Shop Price,Reseller Price,Regular Price,Stock,Variants,Image URL,Description
"","${legSku}","Legacy Handloom Cotton Shirt","mens-fashion",850,550,1100,20,"সাইজ: M, L; রং: সাদা","https://example.com/legacy.jpg","Comfortable cotton shirt"`;

  const legacyPreview = db.previewCSVImport(legacyCSV);
  assert(legacyPreview.items.length === 1 && legacyPreview.items[0].status === 'NEW', 'Legacy 11-column CSV parsed without error');
  assert(legacyPreview.items[0].resellerMaxPrice > 550, 'Legacy import automatically applies global maximum price rule instead of setting 0');

  const importResult = db.commitCSVImport(legacyCSV);
  assert(importResult.created === 1, 'Legacy 11-column CSV imported and committed successfully');

  // Test full 12-column CSV with explicit Reseller Max Price & Bengali variants
  const newSku = `NEW-BN-${Date.now()}`;
  const new12CSV = `ID,SKU,Name,Category,Shop Price,Reseller Price,Regular Price,Stock,Variants,Image URL,Description,Reseller Max Price
"","${newSku}","জামদানি কটন পাঞ্জাবি","traditional-wear",1500,1000,2000,15,"সাইজ: 40, 42; রং: কালো, লাল","https://example.com/p1.jpg|https://example.com/p2.jpg","খাঁটি সুতি কাপড়",1850`;

  const newPreview = db.previewCSVImport(new12CSV);
  assert(newPreview.items[0].resellerMaxPrice === 1850, '12-column CSV preserves explicit Reseller Max Price');

  const newImport = db.commitCSVImport(new12CSV);
  assert(newImport.created === 1, '12-column CSV with Bengali variants and multiple images imported successfully');

  const importedProd = db.getProducts().find((p) => p.sku.startsWith('NEW-BN-'))!;
  assert(importedProd.images.length === 2, 'Multiple pipe-separated image URLs imported into array');
  assert(importedProd.variants.length === 2, 'Bengali variant groups parsed successfully');

  // 10. Database Backup & Recovery Integrity
  const backup = db.createBackup();
  assert(backup.jsonContent.length > 500, 'Database JSON backup successfully created');
  assert(db.restoreBackup(backup.jsonContent), 'Database snapshot restored cleanly with audit trail');

  // 11. Point 1 CRITICAL TEST: Reseller Order Profit Auto-Credit on DELIVERED/COMPLETED
  const resellerBeforeDelivery = db.findUserById(validOrder.resellerId!)!;
  const balBeforeDelivery = resellerBeforeDelivery.commissionBalance || 0;

  // Step A: Mark the shipped order as DELIVERED
  const deliveredOrder = db.updateOrderStatus(validOrder.id, 'DELIVERED', 'admin');
  assert(deliveredOrder?.orderStatus === 'DELIVERED', 'Order status marked as DELIVERED');

  // Step B: Check profit record created as APPROVED
  const profits = db.getResellerProfits({ resellerId: validOrder.resellerId });
  const orderProfit = profits.find((p) => p.orderId === validOrder.id);
  assert(orderProfit !== undefined, 'Profit record automatically generated on order DELIVERED');
  assert(orderProfit?.status === 'APPROVED', 'Point 1: Generated profit status is APPROVED automatically upon completion');

  // Step C: Verify Available Balance has immediately increased
  const resellerAfterDelivery = db.findUserById(validOrder.resellerId!)!;
  assert(
    resellerAfterDelivery.commissionBalance === balBeforeDelivery + orderProfit!.netProfit,
    'Point 1: Profit automatically credited to reseller Available Balance upon DELIVERED'
  );

  // Step D: STRICT IDEMPOTENCY - Marking COMPLETED or DELIVERED again will NEVER credit twice!
  const balBeforeSecondCall = resellerAfterDelivery.commissionBalance;
  db.updateOrderStatus(validOrder.id, 'COMPLETED', 'admin');
  const resellerAfterSecondCall = db.findUserById(validOrder.resellerId!)!;
  assert(
    resellerAfterSecondCall.commissionBalance === balBeforeSecondCall,
    'Point 1: Strict idempotency: same order profit is NEVER credited twice'
  );

  // Step E: Safe archiving of users with financial records
  const archiveResult = db.deleteUser(validOrder.resellerId!, 'admin');
  assert(
    archiveResult.archived === true,
    'Users with orders and profit ledger are safely ARCHIVED instead of hard-deleted to preserve audit trail'
  );

  // Step G: Stock restock on cancellation
  const stockBeforeCancel = db.getProductById(panjabi.id)!.stock;
  const testCancelOrder = db.createOrder({
    orderType: 'direct_customer',
    customerName: 'Cancel Test Customer',
    customerPhone: '01700112233',
    customerAddress: 'Dhanmondi, Dhaka',
    deliveryZoneId: 'zone-1',
    deliveryZoneName: 'Inside Dhaka',
    deliveryCharge: 70,
    items: [
      {
        productId: panjabi.id,
        productName: panjabi.name,
        productImage: panjabi.images[0],
        quantity: 3,
        unitPrice: panjabi.shopPrice,
        costPrice: panjabi.shopPrice,
        subtotal: panjabi.shopPrice * 3,
      },
    ],
    subtotal: panjabi.shopPrice * 3,
    totalAmount: panjabi.shopPrice * 3 + 70,
    paymentMethod: 'cod',
    customerPaymentStatus: 'PENDING',
    orderStatus: 'PENDING',
  });
  assert(db.getProductById(panjabi.id)!.stock === stockBeforeCancel - 3, 'Stock decremented by 3 on test order');

  db.updateOrderStatus(testCancelOrder.id, 'CANCELLED', 'admin');
  assert(db.getProductById(panjabi.id)!.stock === stockBeforeCancel, 'Cancelled order atomically restored original product stock');

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
