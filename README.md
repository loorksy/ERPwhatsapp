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
- حماية أمنية افتراضية تشمل Helmet وCSRF Tokens وRate Limiting وتطهير المدخلات وتسجيل مركزي للعمليات الحساسة.

## المتطلبات المسبقة
- Node.js 18+
- PostgreSQL
- Redis
- متصفح Chromium/Chrome للسماح بتوليد رمز الـ QR في `whatsapp-web.js`.

## الإعداد السريع
1. انسخ ملف المتغيرات البيئية (إلزامي مع `dotenv-safe`):
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

> يتم تحميل متغيرات البيئة عبر `dotenv-safe`، لذا يجب ضبط كل القيم المطلوبة أو إبقاء القيم الافتراضية في `.env.example` قبل تشغيل الخوادم.

## النشر على الإنتاج (bot2.lork.cloud)
1. **ضبط DNS**: وجّه `bot2.lork.cloud` إلى عنوان الـ VPS العام.
2. **إعداد المتغيرات البيئية (الخادم)**:
   - انسخ القالب: `cp .env.example backend/.env` ثم حدّث القيم المهمة:
     - `PORT=5001`
     - `FRONTEND_URL=https://bot2.lork.cloud`
     - `CORS_ORIGINS=https://bot2.lork.cloud`
     - `COOKIE_DOMAIN=.lork.cloud`
     - بيانات القاعدة/Redis ومفاتيح المزودين (استخدم قيمًا حقيقية، وتجنّب مشاركتها في Git).
3. **Nginx**:
   - انسخ القالب إلى السيرفر: `/etc/nginx/sites-available/bot2.lork.cloud.conf` من `deploy/nginx/bot2.lork.cloud.conf`.
   - فعّل الموقع: `sudo ln -sf /etc/nginx/sites-available/bot2.lork.cloud.conf /etc/nginx/sites-enabled/`
   - اختبار الصياغة: `sudo nginx -t` ثم `sudo systemctl reload nginx`.
4. **الشهادة (HTTPS)**:
   - استخرج شهادة: `sudo certbot --nginx -d bot2.lork.cloud` (أعدها عند التجديد التلقائي أو تغيّر الدومين).
5. **تشغيل الـ Backend عبر PM2**:
   - من جذر المشروع على الخادم: `chmod +x deploy/restart-backend.sh && ./deploy/restart-backend.sh`
   - اسم العملية: `whatsapp-ai-bot-new` (المعرّف داخل `ecosystem.config.js`).
6. **الصحة والتشخيص**:
   - تحقّق من الصحة محليًا: `curl http://127.0.0.1:5001/api/health`
   - عبر الدومين بعد الشهادة: `curl https://bot2.lork.cloud/api/health`
   - سجلات PM2: `pm2 logs whatsapp-ai-bot-new`
   - سجلات Nginx: `/var/log/nginx/access.log` و`/var/log/nginx/error.log`.
7. **الحد من المشكلات الشائعة**:
   - تأكد أن `proxy_pass` في `/api` لا يحتوي على شرطة مائلة إضافية (القالب مهيأ بالفعل).
   - CORS/CSRF: يجب أن يطابق `FRONTEND_URL` و`CORS_ORIGINS` الدومين الفعلي مع `credentials=true`، ولا يُسمح بـ `*`.
   - ملفات تعريف الارتباط: في الإنتاج تستخدم `Secure` و`SameSite=lax` مع `COOKIE_DOMAIN=.lork.cloud` لضمان مشاركة الرمز عبر الواجهة و API على نفس الدومين.

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
│       │   ├── notification.controller.js
│       │   └── whatsapp.controller.js
│       ├── index.js
│       ├── middleware
│       │   ├── auth.middleware.js
│       │   ├── rateLimit.middleware.js
│       │   └── sanitize.middleware.js
│       ├── routes
│       │   ├── auth.routes.js
│       │   ├── ai.routes.js
│       │   ├── knowledge.routes.js
│       │   ├── conversation.routes.js
│       │   ├── index.js
│       │   ├── notification.routes.js
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

## الأمان
- **Helmet**: تفعيل ترويسات حماية (`CSP`, `HSTS`, `X-Frame-Options`، إلخ) افتراضياً.
- **Rate Limiting**: 100 طلب/دقيقة لكل IP على `/api` و5 محاولات/15 دقيقة لتسجيل الدخول مع ردود قياسية.
- **CSRF**: تفعيل `csurf` مع Cookies/Headers (`XSRF-TOKEN` و`X-CSRF-Token`). يمكن جلب رمز جديد عبر `GET /api/csrf-token` ويُرسل تلقائيًا من الواجهة عبر Axios.
- **تطهير المدخلات**: تمرير جميع القيم عبر `DOMPurify` على الخادم بالإضافة إلى `express-validator` للتحقق.
- **التسجيل والمراقبة**: استخدام Winston لتسجيل الأخطاء والطلبات الحساسة في `logs/error.log`, `logs/combined.log`, `logs/access.log`.

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
- مفعّل Winston للتسجيل مع ملفات منفصلة ويمكن ربطه بمزود مراقبة خارجي.

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
