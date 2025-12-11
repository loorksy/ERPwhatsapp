import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import Swal from 'sweetalert2';
import KnowledgeTable from '../components/KnowledgeTable';
import {
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  fetchKnowledge,
  uploadKnowledgeDocument,
} from '../services/knowledge.service';

function KnowledgeBasePage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { category: '', question: '', answer: '' },
  });

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const { data, total: totalCount } = await fetchKnowledge({
        page,
        pageSize,
        category: categoryFilter || undefined,
        search: search || undefined,
      });
      setEntries(data || []);
      setTotal(totalCount || 0);
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'تعذر تحميل البيانات' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, categoryFilter, search]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const sortedEntries = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      const first = a?.[sortBy] || '';
      const second = b?.[sortBy] || '';
      if (first === second) return 0;
      if (sortDirection === 'asc') return first > second ? 1 : -1;
      return first < second ? 1 : -1;
    });
    return copy;
  }, [entries, sortBy, sortDirection]);

  const categories = useMemo(() => {
    const base = ['عام', 'الدعم', 'المبيعات', 'المنتجات'];
    const unique = new Set([...(entries || []).map((e) => e.category).filter(Boolean), ...base]);
    return Array.from(unique);
  }, [entries]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      if (editingEntry?.id) {
        await updateKnowledge(editingEntry.id, values);
        setFeedback({ type: 'success', message: 'تم تحديث المعرفة بنجاح' });
      } else {
        await createKnowledge(values);
        setFeedback({ type: 'success', message: 'تم إضافة المعرفة بنجاح' });
      }
      setModalOpen(false);
      setEditingEntry(null);
      reset({ category: '', question: '', answer: '' });
      await loadEntries();
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'تعذر حفظ المعرفة' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    reset({
      category: entry.category || '',
      question: entry.question || '',
      answer: entry.answer || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (entry) => {
    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل أنت متأكد من حذف هذه المعرفة؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#e11d48',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteKnowledge(entry.id);
      setFeedback({ type: 'success', message: 'تم حذف المعرفة' });
      await loadEntries();
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'تعذر حذف المعرفة' });
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      setUploading(true);
      setUploadProgress(0);
      setFeedback(null);

      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          if (uploadCategory) formData.append('category', uploadCategory);

          const result = await uploadKnowledgeDocument(formData, (event) => {
            if (event.total) {
              setUploadProgress(Math.round((event.loaded * 100) / event.total));
            }
          });

          setUploadedFiles((prev) => [
            {
              name: file.name,
              size: file.size,
              uploadedAt: new Date().toISOString(),
              document: result?.document,
            },
            ...prev,
          ]);
        }
        await loadEntries();
        setFeedback({ type: 'success', message: 'تم رفع ومعالجة الملفات بنجاح' });
      } catch (error) {
        setFeedback({ type: 'error', message: error?.message || 'تعذر رفع الملف' });
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [uploadCategory, loadEntries],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  const handleSortChange = (column, forcedDirection) => {
    if (forcedDirection) {
      setSortBy(column);
      setSortDirection(forcedDirection);
      return;
    }
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">قاعدة المعرفة</h1>
          <p className="text-sm text-slate-600">إدارة الأسئلة، الأجوبة، والملفات الداعمة للردود الذكية.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingEntry(null);
              reset({ category: '', question: '', answer: '' });
              setModalOpen(true);
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            إضافة معرفة جديدة
          </button>
          <button
            type="button"
            onClick={loadEntries}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
          >
            تحديث
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <KnowledgeTable
        data={sortedEntries}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        search={search}
        category={categoryFilter}
        categories={categories}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryFilter}
        onSortChange={handleSortChange}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">رفع الملفات</h3>
                <p className="text-sm text-slate-600">اسحب الملفات أو اخترها لتحويلها إلى معلومات قابلة للبحث.</p>
              </div>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">فئة افتراضية</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div
              {...getRootProps()}
              className={`mt-4 flex min-h-[180px] items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition ${
                isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50'
              } ${uploading ? 'opacity-70' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="space-y-3">
                <div className="text-4xl">📄</div>
                <p className="text-sm font-semibold text-slate-900">اسحب ملفات PDF, DOCX, TXT هنا</p>
                <p className="text-xs text-slate-500">أو انقر للاختيار. سيتم إنشاء مقالات تلقائياً من محتوى الملف.</p>
                {uploading && (
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2 text-sm">
                <h4 className="text-sm font-semibold text-slate-800">آخر الملفات المرفوعة</h4>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50">
                  {uploadedFiles.map((file) => (
                    <div key={`${file.name}-${file.uploadedAt}`} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <p className="font-semibold text-slate-900">{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {(file.size / 1024).toFixed(1)} KB · {new Date(file.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700">تمت المعالجة</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">نصائح لإدارة المعرفة</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>• استخدم الفئات لتسهيل تنظيم المحتوى.</li>
            <li>• اجعل الأسئلة واضحة والإجابات مختصرة قدر الإمكان.</li>
            <li>• ارفع أدلة المستخدم أو الأسئلة الشائعة لتعزيز الردود.</li>
            <li>• حدّث قاعدة المعرفة باستمرار بناءً على المحادثات الشائعة.</li>
          </ul>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingEntry ? 'تعديل المعرفة' : 'إضافة معرفة جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-500 transition hover:text-slate-800"
              >
                ✕
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit(handleSave)}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">الفئة</label>
                  <select
                    {...register('category', { required: 'الفئة مطلوبة' })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">اختر فئة</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-rose-600">{errors.category.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-800">السؤال</label>
                  <input
                    type="text"
                    {...register('question', { required: 'السؤال مطلوب', minLength: { value: 5, message: 'السؤال قصير جداً' } })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  {errors.question && <p className="mt-1 text-xs text-rose-600">{errors.question.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-800">الإجابة</label>
                <textarea
                  rows="6"
                  {...register('answer', { required: 'الإجابة مطلوبة', minLength: { value: 10, message: 'الإجابة قصيرة جداً' } })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                {errors.answer && <p className="mt-1 text-xs text-rose-600">{errors.answer.message}</p>}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-rose-200 hover:text-rose-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeBasePage;
