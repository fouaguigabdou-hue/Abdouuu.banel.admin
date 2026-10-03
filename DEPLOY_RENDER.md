# نشر ABDOUUU BANEL VIP على Render

1. أنشئ حسابًا في Render.
2. ارفع هذا المشروع إلى GitHub ثم في Render اختر New > Web Service واربط المستودع.
3. إذا استخدمت Render Blueprint، اختر ملف `render.yaml`.
4. أضف المتغيرات السرية:
   - `ADMIN_USER` = اسم مستخدم لوحة الأدمن
   - `ADMIN_PASSWORD` = كلمة مرور قوية
   - `JWT_SECRET` = سلسلة عشوائية طويلة
   - `INSTAGRAM_URL` = `https://www.instagram.com/zi.wr/`
5. شغّل Deploy.
6. سيعطيك Render عنوانًا مثل:
   `https://abdouuu-banel-vip.onrender.com`
7. استخدم هذا العنوان داخل تطبيق Android بدل `YOUR-DOMAIN.example`.

## تنبيه مهم عن التخزين
هذا الإصدار يستخدم `server/data/db.json`. التخزين المحلي في Render Free مؤقت وقد تضيع المفاتيح عند إعادة التشغيل/إعادة النشر. Render توصي باستخدام قاعدة بيانات خارج التخزين المحلي للبيانات التي يجب الاحتفاظ بها. لا تعتمد على هذه النسخة لتخزين مفاتيح مهمة قبل نقل قاعدة البيانات إلى Postgres أو تخزين دائم.
