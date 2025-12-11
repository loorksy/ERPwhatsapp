# ERP WhatsApp Automation

مشروع متكامل (Backend + Frontend) لنظام رد آلي ذكي على WhatsApp باستخدام Node.js و React.

## المميزات
- تكامل مع WhatsApp عبر مكتبة `whatsapp-web.js`.
- خادم Express مع PostgreSQL و Redis كعناصر أساسية للتخزين والمهام.
- نظام مصادقة JWT مع تسجيل/دخول/خروج واستعادة كلمة المرور باستخدام رموز آمنة.
- واجهة React + TailwindCSS لمراقبة الحالة وإرسال رسائل تجريبية.
- هيكل منظم وقابل للتوسع لإضافة الذكاء الاصطناعي والخدمات الخارجية.

## المتطلبات المسبقة
- Node.js 18+
- PostgreSQL
- Redis
- متصفح Chromium/Chrome للسماح بتوليد رمز الـ QR في `whatsapp-web.js`.

## الإعداد السريع
1. انسخ ملف المتغيرات البيئية:
   ```bash
   cp .env.example .env
   ```
2. أنشئ قاعدة البيانات وشغّل مخطط الجداول:
   ```bash
   psql $DATABASE_URL -f backend/db/schema.sql
   ```
3. ثبّت الحزم وشغّل الـ Backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   سيتولد رمز QR في الطرفية لربط حساب WhatsApp.
4. ثبّت الحزم وشغّل الـ Frontend في جلسة أخرى:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. افتح المتصفح على: http://localhost:5173

## هيكل المجلدات
```
.
├── backend
│   ├── db
│   │   └── schema.sql
│   ├── package.json
│   └── src
│       ├── app.js
│       ├── config
│       │   ├── database.js
│       │   ├── db.js
│       │   ├── env.js
│       │   └── redis.js
│       ├── controllers
│       │   ├── auth.controller.js
│       │   ├── health.controller.js
│       │   └── message.controller.js
│       ├── index.js
│       ├── middleware
│       │   └── auth.middleware.js
│       ├── routes
│       │   ├── auth.routes.js
│       │   └── index.js
│       ├── services
│       │   ├── message.service.js
│       │   └── whatsapp.service.js
│       └── utils
│           └── logger.js
├── frontend
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── src
│   │   ├── App.jsx
│   │   ├── components
│   │   │   └── StatusCard.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── services
│   │       └── api.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── .env.example
```

## ملاحظات التطوير
- أضف قواعد linter/formatter (مثل ESLint و Prettier) لتطبيق معايير الكود.
- حدّث منطق `message.service.js` لتخزين الرسائل وتشغيل تدفقات الذكاء الاصطناعي.
- استخدم طبقة خدمات أو Workers مع Redis للتعامل مع الحمل المرتفع ومعالجة الرسائل.
- استبدل الـ logger الحالي بحل إنتاجي مثل `pino` أو `winston` مع ربطه بمزود مراقبة.

## المصادقة (API)
توجد جميع مسارات المصادقة تحت `/api/auth`:
- `POST /register` — تسجيل مستخدم جديد (بريد إلكتروني، كلمة مرور ≥ 8 حروف، الاسم الكامل، اختياري: الهاتف والشركة).
- `POST /login` — تسجيل الدخول وإرجاع JWT.
- `POST /logout` — إنهاء الجلسة على جانب العميل (JWT عديم الحالة).
- `POST /forgot-password` — توليد رمز استعادة (يُعاد في الاستجابة ببيئة التطوير لتسهيل الاختبار).
- `POST /reset-password` — إعادة تعيين كلمة المرور باستخدام رمز الاستعادة.

### المتغيرات البيئية ذات الصلة
- `JWT_SECRET` سر توقيع الـ JWT.
- `JWT_EXPIRES_IN` مدة صلاحية الرمز (مثال: `1h`).
- `RESET_TOKEN_EXPIRES_MINUTES` مدة صلاحية رمز استعادة كلمة المرور بالدقائق.

## الأمان
- خزّن مفاتيح الاعتماد في متغيرات البيئة فقط.
- فعّل HTTPS عند النشر، وقم بتقييد صلاحيات قواعد البيانات و Redis.
- عند الربط مع WhatsApp، حافظ على مسار الجلسة في مكان آمن ومحمّي بالصلاحيات.
