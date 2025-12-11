function SettingsPage() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">الإعدادات</h1>
      <p className="text-sm text-slate-600">اضبط إعدادات النظام، إشعارات البريد، وإعدادات الأمان من مكان واحد.</p>
      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        <p>سيتم إضافة عناصر التحكم العامة، تكوين التكاملات، وإدارة الفريق هنا.</p>
        <p className="mt-2">تأكد من تحديث كلمة المرور وإعدادات الأمان بشكل دوري.</p>
      </div>
    </div>
  );
}

export default SettingsPage;
