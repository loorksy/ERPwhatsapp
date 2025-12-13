import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-medium text-indigo-600">404</p>
      <h1 className="text-3xl font-bold text-slate-900">الصفحة غير موجودة</h1>
      <p className="text-sm text-slate-600">تأكد من الرابط أو عد إلى لوحة التحكم.</p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
      >
        العودة للوحة التحكم
      </Link>
    </div>
  );
}

export default NotFoundPage;
