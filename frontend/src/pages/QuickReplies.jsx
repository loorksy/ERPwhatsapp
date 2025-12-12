import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  createQuickReply,
  deleteQuickReply,
  fetchQuickReplies,
  reorderQuickReplies,
  updateQuickReply,
} from '../services/quickReplies.service';
import { formatDateTime } from '../utils/date';

const ITEM_TYPE = 'QUICK_REPLY';
const placeholderPreview = {
  customer_name: 'عميل مميز',
  company_name: 'شركتك',
  current_date: new Date().toLocaleDateString('ar-EG'),
  current_time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
};

const QuickReplyCard = ({ reply, index, moveCard, onEdit, onDelete, onCopy, onReorder }) => {
  const ref = useRef(null);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ITEM_TYPE,
      item: { index },
    }),
    [index]
  );

  const [, drop] = useDrop(
    () => ({
      accept: ITEM_TYPE,
      hover(item) {
        if (!ref.current) return;
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        moveCard(dragIndex, hoverIndex);
        // eslint-disable-next-line no-param-reassign
        item.index = hoverIndex;
      },
      drop() {
        onReorder();
      },
    }),
    [index, moveCard, onReorder]
  );

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all ${
        isDragging ? 'scale-[0.99] opacity-80 ring-2 ring-indigo-100' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              {reply.category || 'غير مصنف'}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">/{reply.slug}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{reply.title}</h3>
          <p className="text-sm text-slate-600">{reply.preview}</p>
          <p className="text-[11px] text-slate-500">آخر تحديث: {formatDateTime(reply.updatedAt)}</p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm text-slate-500">
          <span className="rounded-lg bg-slate-50 px-2 py-1 font-semibold text-slate-700">{reply.shortcut}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onCopy(reply)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              نسخ
            </button>
            <button
              type="button"
              onClick={() => onEdit(reply)}
              className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              تعديل
            </button>
            <button
              type="button"
              onClick={() => onDelete(reply)}
              className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickReplyModal = ({ isOpen, onClose, onSubmit, initialData, categories }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: '',
      category: '',
      newCategory: '',
      content: '',
      slug: '',
    },
  });

  useEffect(() => {
    reset({
      title: initialData?.title || '',
      category: initialData?.category || '',
      newCategory: '',
      content: initialData?.content || '',
      slug: initialData?.slug?.replace('/', '') || '',
    });
  }, [initialData, reset]);

  const contentValue = watch('content');
  const slugValue = watch('slug');
  const categoryValue = watch('category');
  const newCategoryValue = watch('newCategory');

  const previewText = useMemo(() => {
    if (!contentValue) return 'ستظهر المعاينة هنا...';
    return contentValue
      .replace(/{{customer_name}}/g, placeholderPreview.customer_name)
      .replace(/{{company_name}}/g, placeholderPreview.company_name)
      .replace(/{{current_date}}/g, placeholderPreview.current_date)
      .replace(/{{current_time}}/g, placeholderPreview.current_time);
  }, [contentValue]);

  const handleFormSubmit = async (values) => {
    const payload = {
      title: values.title,
      category: values.newCategory || values.category || 'عام',
      content: values.content,
      slug: values.slug ? values.slug.toLowerCase() : '',
    };
    await onSubmit(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {initialData ? 'تعديل رد سريع' : 'إضافة رد سريع جديد'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            إغلاق
          </button>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">العنوان</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                {...register('title', { required: 'العنوان مطلوب' })}
              />
              {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">الفئة</label>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  {...register('category')}
                >
                  <option value="">اختر فئة</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">أو أنشئ فئة جديدة</label>
                <input
                  type="text"
                  placeholder="مثال: المبيعات"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                  {...register('newCategory')}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">الاختصار (slug)</label>
              <input
                type="text"
                placeholder="price"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                {...register('slug', {
                  required: 'الاختصار مطلوب',
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: 'استخدم حروف لاتينية وأرقام وشرطات فقط',
                  },
                })}
              />
              <p className="mt-1 text-xs text-slate-500">سيستخدم كلقب سريع: /{slugValue || 'example'}</p>
              {errors.slug && <p className="mt-1 text-xs text-rose-600">{errors.slug.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">المحتوى</label>
              <textarea
                rows={6}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none"
                placeholder="مرحباً {{customer_name}}، شكراً لتواصلك مع {{company_name}}..."
                {...register('content', { required: 'المحتوى مطلوب' })}
              />
              {errors.content && <p className="mt-1 text-xs text-rose-600">{errors.content.message}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-slate-100 px-2 py-1">{`{{customer_name}}`}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1">{`{{company_name}}`}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1">{`{{current_date}}`}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1">{`{{current_time}}`}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-800">المعاينة</h4>
                <span className="rounded-lg bg-white px-2 py-1 text-[11px] text-slate-600">
                  الفئة: {newCategoryValue || categoryValue || 'عام'}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{previewText}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">سيتم حفظ التغييرات وربطها بالحساب الحالي.</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ الرد'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

function QuickRepliesPage() {
  const [quickReplies, setQuickReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReply, setEditingReply] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const loadQuickReplies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchQuickReplies({ search, category });
      const list = data?.data || data?.quickReplies || [];
      setQuickReplies(list);
    } catch (err) {
      setError('تعذر تحميل الردود، تم عرض بيانات توضيحية.');
      setQuickReplies([
        {
          id: 'demo-1',
          title: 'تحية ترحيبية',
          content: 'مرحباً {{customer_name}}! كيف يمكنني مساعدتك اليوم؟',
          slug: 'hello',
          category: 'عام',
          shortcut: '/hello',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'demo-2',
          title: 'الأسعار',
          content: 'سعر باقة الأعمال يبدأ من 199 ريال شهرياً ويتضمن دعم مخصص.',
          slug: 'price',
          category: 'التسعير',
          shortcut: '/price',
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    loadQuickReplies();
  }, [loadQuickReplies]);

  const categories = useMemo(() => {
    const unique = new Set(quickReplies.map((item) => item.category).filter(Boolean));
    return Array.from(unique);
  }, [quickReplies]);

  const filteredReplies = useMemo(() => {
    return quickReplies
      .map((reply) => ({
        ...reply,
        preview: (reply.content || '').slice(0, 100) + (reply.content?.length > 100 ? '…' : ''),
        shortcut: reply.shortcut || `/${reply.slug || ''}`,
        updatedAt: reply.updatedAt || reply.createdAt || new Date().toISOString(),
      }))
      .filter((reply) => {
        const matchesCategory = category === 'all' || reply.category === category;
        const term = search.trim().toLowerCase();
        const matchesSearch =
          !term ||
          reply.title?.toLowerCase().includes(term) ||
          reply.content?.toLowerCase().includes(term) ||
          reply.slug?.toLowerCase().includes(term);
        return matchesCategory && matchesSearch;
      });
  }, [category, quickReplies, search]);

  const moveCard = useCallback(
    (dragIndex, hoverIndex) => {
      setQuickReplies((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(dragIndex, 1);
        updated.splice(hoverIndex, 0, removed);
        return updated;
      });
    },
    [setQuickReplies]
  );

  const persistOrder = useCallback(async () => {
    setSavingOrder(true);
    try {
      const orderedIds = filteredReplies.map((item) => item.id).filter(Boolean);
      if (orderedIds.length) await reorderQuickReplies(orderedIds);
    } catch (err) {
      setError('تعذر حفظ الترتيب، حاول مرة أخرى.');
    } finally {
      setSavingOrder(false);
    }
  }, [filteredReplies]);

  const openModal = (reply = null) => {
    setEditingReply(reply);
    setIsModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (editingReply) {
      const updated = await updateQuickReply(editingReply.id, payload);
      setQuickReplies((prev) =>
        prev.map((item) => (item.id === editingReply.id ? { ...item, ...payload, ...updated } : item))
      );
    } else {
      const created = await createQuickReply(payload);
      setQuickReplies((prev) => [{ ...payload, ...created }, ...prev]);
    }
  };

  const handleDelete = async (reply) => {
    const confirmDelete = window.confirm(`حذف الرد السريع "${reply.title}"؟`);
    if (!confirmDelete) return;
    try {
      await deleteQuickReply(reply.id);
    } catch (err) {
      setError('تعذر حذف الرد الآن، سيتم إزالته محلياً.');
    }
    setQuickReplies((prev) => prev.filter((item) => item.id !== reply.id));
  };

  const handleCopy = async (reply) => {
    try {
      await navigator.clipboard.writeText(reply.content || '');
    } catch (err) {
      setError('تعذر نسخ المحتوى، انسخه يدوياً.');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">الردود السريعة</h1>
            <p className="text-sm text-slate-600">قم بإدارة قوالب الردود الجاهزة وتخصيصها للفرق.</p>
          </div>
          <button
            type="button"
            onClick={() => openModal(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            + إضافة رد سريع
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                category === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              كل الفئات
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 font-semibold transition ${
                  category === cat ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="search"
              placeholder="ابحث في العناوين والمحتوى"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none md:w-64"
            />
            <span className="text-xs text-slate-500">{filteredReplies.length} نتيجة</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            سحب وإفلات لإعادة الترتيب (يدعم اختصار لوحة المفاتيح بالنقر ثم السحب)
          </div>
          {savingOrder && <span className="text-indigo-600">جارٍ حفظ الترتيب...</span>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 text-center text-sm text-slate-600">جارٍ التحميل...</div>
          ) : filteredReplies.length ? (
            filteredReplies.map((reply, index) => (
              <QuickReplyCard
                key={reply.id || reply.slug || index}
                reply={reply}
                index={index}
                moveCard={moveCard}
                onEdit={openModal}
                onDelete={handleDelete}
                onCopy={handleCopy}
                onReorder={persistOrder}
              />
            ))
          ) : (
            <div className="col-span-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              لا توجد ردود سريعة مطابقة. جرّب إضافة رد جديد أو تعديل الفلاتر.
            </div>
          )}
        </div>
      </div>

      <QuickReplyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        initialData={editingReply}
        categories={categories}
      />
    </DndProvider>
  );
}

export default QuickRepliesPage;
