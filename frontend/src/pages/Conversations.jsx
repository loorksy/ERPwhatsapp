function ConversationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">المحادثات</h1>
        <p className="text-sm text-slate-600">تصفح المحادثات وفلترتها حسب الحالة والأولوية.</p>
      </div>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-600">
        قم بربط واجهة المحادثات هنا. استخدم عوامل التصفية، البحث، و Pagination لعرض المحادثات النشطة والمغلقة.
      </div>
    </div>
  );
}

export default ConversationsPage;
