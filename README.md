# Journey of Motherhood (منصة رحلة الأمومة)

منصة متكاملة لدعم الأمهات تتضمن: مساعد ذكي (chatbot)، تتبع الحالة المزاجية، الكشف المبكر عن خطر اكتئاب ما بعد الولادة، مقالات صحية مخصصة، نظام مواعيد مع الأطباء، ومتجر للمنتجات.

## بنية المشروع

```
.
├── frontend/   → React + Vite (يُرفع على Vercel)
└── backend/    → Node.js + Express (يُرفع على Render)
```

## التقنيات المستخدمة

- **Frontend:** React 19, Vite, React Router, Axios, i18next (دعم متعدد اللغات), Supabase JS
- **Backend:** Node.js, Express 5, Supabase (قاعدة بيانات + مصادقة), Groq SDK (الذكاء الاصطناعي للشات بوت)

## التشغيل محلياً

### الباك إند

```bash
cd backend
npm install
cp .env.example .env   # ثم عدّل القيم الحقيقية في .env
npm run dev
```

السيرفر يعمل على: `http://localhost:3000`

### الفرونت إند

```bash
cd frontend
npm install
cp .env.example .env   # ثم عدّل القيم الحقيقية في .env
npm run dev
```

الموقع يعمل على: `http://localhost:5173`

## متغيرات البيئة المطلوبة

### Backend (`backend/.env`)
| المتغير | الوصف |
|---|---|
| `GROQ_API_KEY` | مفتاح Groq لتشغيل الشات بوت |
| `GEMINI_API_KEY` | مفتاح Gemini (مزود بديل، اختياري) |
| `SUPABASE_URL` | رابط مشروع Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | مفتاح Supabase الإداري (سري جداً) |
| `SUPABASE_ANON_KEY` | مفتاح Supabase العام |
| `FRONTEND_URL` | رابط الفرونت إند المنشور (لإعدادات CORS) |
| `PORT` | منفذ التشغيل (Render يحدده تلقائياً) |

### Frontend (`frontend/.env`)
| المتغير | الوصف |
|---|---|
| `VITE_SUPABASE_URL` | رابط مشروع Supabase |
| `VITE_SUPABASE_ANON_KEY` | مفتاح Supabase العام |
| `VITE_API_URL` | رابط الباك إند المنشور على Render |

## النشر (Deployment)

- **الفرونت إند → Vercel**: Root Directory = `frontend`
- **الباك إند → Render**: Root Directory = `backend`

راجع تعليمات النشر التفصيلية المرفقة لمزيد من المعلومات.
