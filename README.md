# ERP WhatsApp Automation

مشروع متكامل (Backend + Frontend) لنظام رد آلي ذكي على WhatsApp باستخدام Node.js و React.

## المميزات
- تكامل مع WhatsApp عبر مكتبة `whatsapp-web.js`.
- خادم Express مع PostgreSQL و Redis كعناصر أساسية للتخزين والمهام.
- نظام مصادقة JWT مع تسجيل/دخول/خروج واستعادة كلمة المرور باستخدام رموز آمنة.
- واجهة React + TailwindCSS مع React Router وسياق مصادقة لإدارة الجلسات وإرسال الرسائل التجريبية.
- طبقة ذكاء اصطناعي متعددة المزودين (OpenAI، Anthropic Claude، Google Gemini) قابلة للتوسعة.
- نظام قاعدة معرفة ببحث نصي ودلالي مع رفع مستندات PDF/DOCX/TXT وتوليد Embeddings.
- هيكل منظم وقابل للتوسع لإضافة الذكاء الاصطناعي والخدمات الخارجية.
- لوحة تحكم للمشرف مع إحصائيات النظام وإدارة المستخدمين، التصدير، والفلاتر المتقدمة.

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
│       │   ├── ai.controller.js
│       │   ├── knowledge.controller.js
│       │   ├── health.controller.js
│       │   ├── message.controller.js
│       │   └── whatsapp.controller.js
│       ├── index.js
│       ├── middleware
│       │   └── auth.middleware.js
│       ├── routes
│       │   ├── auth.routes.js
│       │   ├── ai.routes.js
│       │   ├── knowledge.routes.js
│       │   ├── index.js
│       │   └── whatsapp.routes.js
│       ├── services
│       │   ├── message.service.js
│       │   ├── ai.service.js
│       │   ├── knowledge.service.js
│       │   └── whatsapp.service.js
│       └── utils
│           └── logger.js
├── frontend
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── src
│   │   ├── App.jsx (Routes + Protected/Guest guards)
│   │   ├── components
│   │   │   ├── AppLayout.jsx
│   │   │   ├── GuestRoute.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatusCard.jsx
│   │   ├── context
│   │   │   └── AuthContext.js
│   │   ├── index.css
│   │   ├── main.jsx (BrowserRouter + AuthProvider)
│   │   ├── pages
│   │   │   ├── Conversations.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Knowledge.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── Register.jsx
│   │   ├── services
│   │   │   └── api.service.js
│   │   └── utils
│   │       ├── error.js
│   │       └── storage.js
│   ├── tailwind.config.js
│   └── vite.config.js
└── .env.example
```

## ملاحظات التطوير
- أضف قواعد linter/formatter (مثل ESLint و Prettier) لتطبيق معايير الكود.
- حدّث منطق `message.service.js` لتخزين الرسائل وتشغيل تدفقات الذكاء الاصطناعي.

## الذكاء الاصطناعي متعدد المزودين
- تم تغليف مزودي OpenAI وAnthropic Claude وGoogle Gemini في طبقة خدمات قابلة للتوسعة مع آلية إعادة المحاولة.
- الحقول المدعومة للإعدادات: `provider`, `model`, `temperature`, `maxTokens`, `systemPrompt`, `settings` (JSON عام للمفاتيح/الخيارات الخاصة).
- نقاط النهاية (محميّة بـ JWT تحت `/api/ai`):
  - `GET /settings` — جلب إعدادات مزود معين أو جميع المزودين.
  - `PUT /settings` — حفظ/تحديث إعدادات مزود (مع دعم تخزين المفتاح في `settings_json`).
  - `POST /test` — اختبار الاتصال بالمزود وإرجاع رد تجريبي.
  - `GET /providers` — قائمة المزودين المتاحين والنماذج الافتراضية.
  - `POST /switch` — تعيين المزود الافتراضي للمستخدم (يضبط حقل `is_default` داخل `settings_json`).

### المتغيرات البيئية الخاصة بالذكاء الاصطناعي
- `DEFAULT_AI_PROVIDER` المزود الافتراضي (القيم المدعومة: `openai`, `claude`, `gemini`).
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` مفاتيح الوصول للمزودين.
- `EMBEDDING_MODEL` نموذج التضمين المستخدم في البحث الدلالي (افتراضي: `text-embedding-3-small`).
- `KNOWLEDGE_UPLOAD_DIR` مسار تخزين الملفات المرفوعة (افتراضي: `./uploads`).
- `MAX_UPLOAD_SIZE_MB` الحد الأقصى لحجم الملف (ميغابايت، افتراضي 10).

## تكامل WhatsApp (Multi-Device)
- استخدم Socket.io للانضمام إلى غرفة المستخدم (`user:{userId}`) والاستماع لحدث `whatsapp:qr` للحصول على QR بشكل فوري.
- نقاط النهاية المحمية (JWT):
  - `POST /api/whatsapp/connect`: بدء تهيئة العميل وإطلاق حدث QR.
  - `GET /api/whatsapp/qr`: جلب أحدث QR (base64 + النص).
  - `POST /api/whatsapp/disconnect`: قطع الاتصال وإيقاف العميل.
  - `GET /api/whatsapp/status`: حالة الاتصال ورقم الجهاز إن وُجد.
  - `POST /api/messages/send`: إرسال رسالة بعد تمرير `phone` و`message` (يتطلب اتصال WhatsApp جاهزًا).
- مسار جلسة WhatsApp يدار عبر `LocalAuth` مع دعم الأجهزة المتعددة وتتم مزامنته مع جدول `whatsapp_sessions`.
- استخدم طبقة خدمات أو Workers مع Redis للتعامل مع الحمل المرتفع ومعالجة الرسائل.
- استبدل الـ logger الحالي بحل إنتاجي مثل `pino` أو `winston` مع ربطه بمزود مراقبة.

## إدارة المحادثات والرسائل
- المعالجة الخلفية للرسائل الواردة تحفظ الوسائط (base64 data URL)، تنشئ محادثة تلقائيًا، وتكتشف نية المستخدم بشكل أولي لتحديد ما إذا كان البوت سيرد (مع فحص أوقات العمل الاختيارية).
- نقاط النهاية المحمية (JWT) تحت `/api/conversations` مع دعم الفلترة والبحث والـ Pagination:
  - `GET /` — قائمة المحادثات مع فلاتر `status`, `priority`, `search`, وفرز `sort=latest|oldest`، وحدود `page`, `pageSize`.
  - `GET /:id` — محادثة واحدة + رسائلها مع Pagination.
  - `PUT /:id/status` — تحديث حالة أو أولوية المحادثة.
  - `POST /:id/notes` — إضافة ملاحظة داخلية (تسجل كرسالة `system`).
  - `POST /:id/transfer` — نقل للمشغل البشري وتسجيل ملاحظة تحويل.
  - المتغيرات البيئية الاختيارية لأوقات العمل: `OPERATING_HOURS_START` و`OPERATING_HOURS_END` بصيغة `HH:MM`.

## قاعدة المعرفة والبحث الدلالي
- إضافة وتعديل وحذف عناصر قاعدة المعرفة مع توليد Embeddings لكل سؤال/إجابة.
- رفع ملفات PDF/DOCX/TXT لاستخراج النص وتجزئته ودمجه تلقائيًا في قاعدة المعرفة.
- بحث نصي أو دلالي (Cosine Similarity) مع ترتيب النتائج وإرجاع السياق الأكثر صلة.
- نقاط النهاية المحمية (JWT) تحت `/api/knowledge`:
  - `GET /` — جلب قائمة المعارف مع Pagination وفلاتر `category`, `search`.
  - `POST /` — إنشاء معلومة جديدة (`question`, `answer`, اختياري: `category`).
  - `GET /:id` — جلب معلومة واحدة.
  - `PUT /:id` — تحديث سؤال/إجابة/تصنيف.
  - `DELETE /:id` — حذف معلومة.
  - `POST /upload` — رفع ملف (`file`) واستخراج النص وتجزئته تلقائيًا لعناصر قاعدة المعرفة.
  - `POST /search` — بحث نصي/دلالي (خيارات: `query`, `category`, `limit`, `semantic`).

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
