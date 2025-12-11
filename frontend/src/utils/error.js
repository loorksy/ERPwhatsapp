export const parseApiError = (error, fallback = 'حدث خطأ غير متوقع') => {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error?.message || error?.response?.data?.message || fallback;
};

export const friendlyError = (error) => parseApiError(error, 'تعذر إكمال الطلب');
