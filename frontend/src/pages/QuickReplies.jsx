function QuickRepliesPage() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">الردود السريعة</h1>
      <p className="text-sm text-slate-600">أنشئ وأدر قوالب الردود السريعة لتسريع محادثات الدعم والمبيعات.</p>
      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        <p>سيتم ربط هذه الصفحة بقائمة الردود السريعة المخزنة في قاعدة البيانات.</p>
        <p className="mt-2">يمكنك إضافة، تعديل، أو حذف الردود لتشاركها فرق العمل.</p>
      </div>
    </div>
  );
}

export default QuickRepliesPage;
