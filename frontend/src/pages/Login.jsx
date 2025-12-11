import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../utils/error';

function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await login(values);
      navigate('/');
    } catch (err) {
      setServerError(friendlyError(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 px-4 py-10">
      <div className="w-full max-w-[440px] rounded-2xl border border-slate-200 bg-white p-8 shadow-lg md:p-10">
        <p className="text-sm font-semibold text-indigo-600">ERP WhatsApp</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-slate-600">سجل الدخول لإدارة حسابك والمحادثات.</p>

        {serverError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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

          <div className="flex items-center justify-between text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                {...register('rememberMe')}
              />
              <span>تذكرني</span>
            </label>
            <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500">
              نسيت كلمة المرور؟
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {loading ? '...جاري التحقق' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          ليس لديك حساب؟{' '}
          <Link className="font-semibold text-indigo-600" to="/register">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
