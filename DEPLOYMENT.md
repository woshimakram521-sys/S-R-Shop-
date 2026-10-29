# NOVA SHOP — Deployment & Operations Guide

এই নির্দেশিকাটি NOVA SHOP প্ল্যাটফর্মকে GitHub ও Vercel-এ ডিপ্লয় এবং পরিচালনা করার পূর্ণাঙ্গ গাইড।

---

## ১. GitHub-এ আপলোড করার নিয়মাবলী

১. লোকাল বা প্রজেক্ট ডিরেক্টরিতে গিট ইনিশিয়ালাইজ করুন (যদি না থাকে):
   ```bash
   git init
   git add .
   git commit -m "feat: complete production-ready NOVA SHOP with reseller portal and admin"
   ```

২. GitHub-এ একটি নতুন Repository তৈরি করুন (Private বা Public)।

৩. রিমোট যুক্ত করে পুশ করুন:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

---

## ২. Vercel-এ ডেপ্লয় করার ধাপসমূহ

১. [Vercel Dashboard](https://vercel.com)-এ যান এবং **"Add New Project"** সিলেক্ট করুন।
২. আপনার GitHub Repository টি ইমপোর্ট (Import) করুন।
৩. Framework Preset: **Vite** সিলেক্ট থাকবে।
৪. **Build Command**: `npm run build`
৫. **Output Directory**: `dist`
৬. **Environment Variables**:
   Vercel Dashboard > Project Settings > Environment Variables সেকশনে নিচের ভেরিয়েবলগুলো যোগ করুন:
   - `PORT`: `3000` (ঐচ্ছিক)
   - `TOKEN_SECRET`: যেকোনো শক্তিশালী র্যান্ডম স্ট্রিং (যেমন: `nova-jwt-secret-bangladesh-2026`)
   - `GEMINI_API_KEY`: (AI সার্ভিসের জন্য ঐচ্ছিক)
   - `APP_URL`: আপনার Vercel প্রজেক্টের লাইভ ডোমেন (যেমন: `https://novashop.vercel.app`)

৭. **Deploy** বাটনে ক্লিক করুন। `vercel.json` ফাইলে `/api/(.*)` স্বয়ংক্রিয়ভাবে `/api/index.ts` সার্ভারলেস ফাংশনে রাউট হবে।

---

## ৩. Gmail SMTP ইমেল কনফিগারেশন

অর্ডার নোটিফিকেশন ও রিসেলার অ্যাক্টিভেশন ইমেলের জন্য জিমেইল অ্যাপ পাসওয়ার্ড ব্যবহার করতে হয়:

১. আপনার Google অ্যাকাউন্টে যান: [myaccount.google.com](https://myaccount.google.com)
২. **Security** ট্যাবে গিয়ে **2-Step Verification** চালু করুন।
৩. সার্চ বারে **"App Passwords"** লিখে সার্চ করুন।
৪. অ্যাপের নাম দিন "NOVA SHOP" এবং **Create** ক্লিক করুন। ১৬ অক্ষরের একটি অ্যাপ পাসওয়ার্ড পাবেন (যেমন: `abcd efgh ijkl mnop`)।
৫. NOVA SHOP-এর **অ্যাডমিন প্যানেল > ইমেল সেটিংস (Gmail SMTP)**-এ যান:
   - Host: `smtp.gmail.com`
   - Port: `465` (Secure SSL)
   - Sender Email: আপনার জিমেইল ঠিকানা
   - Sender Name: `NOVA SHOP`
   - App Password: ১৬ অক্ষরের পাসওয়ার্ডটি বসিয়ে দিন
   - **"সেটিংস সংরক্ষণ করুন"** এ ক্লিক করুন।
৬. **"টেস্ট ইমেল পাঠান"** বাটনে আপনার ইমেল লিখে সরাসরি লাইভ ভেরিফাই করুন।

---

## ৪. রিসেলার পোর্টাল ও অগ্রিম ডেলিভারি চার্জ নিয়ম

- রিসেলারের ন্যূনতম অর্ডার ডেলিভারি চার্জ অগ্রিম পরিশোধ (কমপক্ষে ৳৫০) বাধ্যতামূলক।
- কাস্টমারের ঠিকানার উপর ভিত্তি করে ডেলিভারি চার্জ নির্ধারিত হয় (ঢাকা: ৳৭০, ঢাকার আশপাশে: ৳১০০, ঢাকার বাইরে: ৳১৩০)।
- রিসেলার bKash বা Nagad-এ টাকা পাঠিয়ে TrxID প্রদান করবেন।
- অ্যাডমিন প্যানেল থেকে **"অগ্রিম পেমেন্ট যাচাই"** অনুমোদিত না হওয়া পর্যন্ত অর্ডার ডেলিভারির জন্য লক থাকবে।
- রেফারেল কোডের মাধ্যমে নতুন রিসেলাররা রেজিস্ট্রেশন ফি-তে ৫০% পর্যন্ত ছাড় পান।
- রেফারার প্রতি সফল ভেরিফাইড রেফারেল থেকে নির্ধারিত কমিশন অর্জন করেন এবং ন্যূনতম ব্যালেন্স ৳৫০০ হলে উত্তোলনের আবেদন করতে পারেন।

---

## ৫. ডাটাবেজ ব্যাকআপ ও রিকভারি

- অ্যাডমিন প্যানেলের **"ব্যাকআপ ও রিকভারি"** সেকশন থেকে যেকোনো সময় এক ক্লিকে সম্পূর্ণ ডাটাবেজ JSON ফরম্যাটে ডাউনলোড ও পুনরুদ্ধার (Restore) করা যায়।
- প্রতিবার রিস্টোর করার পূর্বে সিস্টেম স্বয়ংক্রিয়ভাবে একটি সেফটি স্ন্যাপশট সংরক্ষণ করে যাতে পূর্বাবস্থায় ফিরে যাওয়া সম্ভব হয়।
