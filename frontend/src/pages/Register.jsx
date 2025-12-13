import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import { friendlyError } from '../utils/error';

function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, loading } = useAuth();
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      company_name: '',
      password: '',
      confirm_password: '',
      rememberMe: true,
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (values) => {
    setServerError(null);
    setSuccessMessage('');
    const { confirm_password, rememberMe, ...payload } = values;

    try {
      await registerUser({ ...payload, rememberMe });
      setSuccessMessage('تم إنشاء الحساب بنجاح، سيتم توجيهك إلى لوحة التحكم.');
      setTimeout(() => navigate('/'), 600);
    } catch (err) {
      setServerError(friendlyError(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10">
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative hidden h-full items-center justify-center bg-indigo-600 p-10 text-white md:flex">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-widest text-indigo-100">ERP WhatsApp</p>
              <h2 className="text-3xl font-bold leading-tight">نظام رد آلي ذكي لإدارة محادثات عملائك</h2>
              <p className="text-indigo-100/90">لوحة تحكم موحدة، ذكاء اصطناعي متعدد المزودين، وتكامل WhatsApp موثوق.</p>
              <div className="rounded-xl bg-white/10 p-4 text-sm backdrop-blur">
                <p className="font-semibold">مزايا سريعة</p>
                <ul className="mt-2 space-y-1 text-indigo-100/90">
                  <li>• إدارة فرق ودعم فوري</li>
                  <li>• قاعدة معرفة وذكاء اصطناعي مدمج</li>
                  <li>• رسائل وسائط متعددة مع تتبع كامل</li>
                </ul>
              </div>
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%)]" aria-hidden />
          </div>

          <div className="p-8 md:p-10">
            <p className="text-sm font-semibold text-indigo-600">ابدأ مجاناً</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">إنشاء حساب جديد</h1>
            <p className="mt-1 text-sm text-slate-600">املأ البيانات التالية للانطلاق.</p>

            {serverError && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
            )}
            {successMessage && (
              <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>
            )}

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">الاسم الكامل</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    {...register('full_name', { required: 'الاسم الكامل مطلوب', minLength: { value: 3, message: 'الحد الأدنى 3 أحرف' } })}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    {...register('email', {
                      required: 'البريد الإلكتروني مطلوب',
                      pattern: {
                        value: /[^\s@]+@[^\s@]+\.[^\s@]+/,
                        message: 'صيغة البريد الإلكتروني غير صحيحة',
                      },
                    })}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">رقم الهاتف</label>
                  <input
                    type="tel"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    placeholder="مثال: 201234567890"
                    {...register('phone', {
                      required: 'رقم الهاتف مطلوب',
                      pattern: {
                        value: /^[0-9]{8,15}$/,
                        message: 'استخدم أرقاماً فقط بين 8-15 خانة',
                      },
                    })}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">اسم الشركة</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    placeholder="اختياري"
                    {...register('company_name', { maxLength: { value: 80, message: 'الحد الأقصى 80 حرفاً' } })}
                  />
                  {errors.company_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.company_name.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">كلمة المرور</label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    {...register('password', {
                      required: 'كلمة المرور مطلوبة',
                      minLength: { value: 8, message: 'الحد الأدنى 8 أحرف' },
                    })}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                    {...register('confirm_password', {
                      required: 'تأكيد كلمة المرور مطلوب',
                      validate: (value) => value === passwordValue || 'كلمتا المرور غير متطابقتين',
                    })}
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    {...register('rememberMe')}
                  />
                  <label htmlFor="remember" className="cursor-pointer select-none">تذكرني على هذا الجهاز</label>
                </div>
                <span className="text-xs text-slate-500">دخول سريع بدون إعادة تسجيل</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {loading ? '...جاري الإنشاء' : 'إنشاء الحساب'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              لديك حساب بالفعل؟{' '}
              <Link className="font-semibold text-indigo-600" to="/login">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
