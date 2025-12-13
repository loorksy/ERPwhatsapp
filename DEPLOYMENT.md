# Deployment Guide

## ⚠️ إعداد PostgreSQL Authentication

بعد تثبيت PostgreSQL، يجب تعديل إعدادات المصادقة لضمان قبول كلمات المرور:

1. افتح ملف الإعدادات:
```bash
nano /etc/postgresql/*/main/pg_hba.conf
```

2. ابحث عن هذا السطر:
```
local   all             postgres                                peer
```

3. غيّره إلى:
```
local   all             postgres                                md5
```

4. أعد تشغيل PostgreSQL:
```bash
systemctl restart postgresql
```

التأكد من هذا التعديل يمنع فشل الاتصال عبر كلمة المرور أثناء نشر النظام أو إعادة تشغيل الخدمات.
