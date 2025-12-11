function AISettingsPage() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">إعدادات الذكاء الاصطناعي</h1>
      <p className="text-sm text-slate-600">قم بضبط المزود، الموديل، وحدود التخصيص من صفحة إعدادات AI.</p>
      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        <p>هذه الصفحة ستكون مخصصة لضبط موفري الذكاء الاصطناعي المتعددين.</p>
        <p className="mt-2">يمكنك التوجه لقسم <span className="font-semibold">مزود AI</span> لاختبار الاتصال أو تحديث الإعدادات.</p>
      </div>
    </div>
  );
}

export default AISettingsPage;
