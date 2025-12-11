import PropTypes from 'prop-types';

function QRCodeDisplay({ image, expiresIn, loading, error, onRefresh }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex w-full items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">رمز QR</p>
          <p className="text-xs text-slate-500">قم بمسحه بكاميرا WhatsApp للربط</p>
        </div>
        {onRefresh && (
          <button
            type="button"
            className="text-xs font-semibold text-indigo-600 underline underline-offset-4 hover:text-indigo-500"
            onClick={onRefresh}
          >
            تحديث الرمز
          </button>
        )}
      </div>

      <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
        {loading && <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-500" />}

        {!loading && error && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-red-700">تعذر تحميل رمز QR</p>
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        {!loading && !error && image && (
          <img
            src={image}
            alt="WhatsApp QR"
            className="h-48 w-48 rounded-lg border border-white shadow"
          />
        )}

        {!loading && !error && !image && (
          <p className="text-sm text-slate-500">اضغط على زر الربط للحصول على رمز QR</p>
        )}
      </div>

      <div className="mt-3 flex w-full items-center justify-between text-xs text-slate-600">
        <p>
          الحالة:{' '}
          {loading
            ? 'جاري التهيئة...'
            : error
              ? 'خطأ'
              : image
                ? 'جاهز للمسح'
                : 'بانتظار الطلب'}
        </p>
        <p className="text-slate-500">{expiresIn > 0 ? `ينتهي خلال ${expiresIn} ثانية` : 'لم يتم توليد الرمز بعد'}</p>
      </div>
    </div>
  );
}

QRCodeDisplay.propTypes = {
  image: PropTypes.string,
  expiresIn: PropTypes.number,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
};

QRCodeDisplay.defaultProps = {
  image: null,
  expiresIn: 0,
  loading: false,
  error: null,
  onRefresh: null,
};

export default QRCodeDisplay;
