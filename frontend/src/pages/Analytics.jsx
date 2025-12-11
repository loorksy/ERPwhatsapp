function AnalyticsPage() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">الإحصائيات</h1>
      <p className="text-sm text-slate-600">تعرض هذه الصفحة تحليلات الأداء، معدلات الاستجابة، وأداء الوكلاء.</p>
      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
        <p>سيتم لاحقاً إضافة رسوم بيانية تفصيلية حول الرسائل، التحويلات، ورضا العملاء.</p>
        <p className="mt-2">يمكنك الاستفادة من نفس مزود الرسوم البيانية المستخدم في صفحة نظرة عامة.</p>
      </div>
    </div>
  );
}

export default AnalyticsPage;
