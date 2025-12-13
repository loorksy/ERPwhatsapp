import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('language');
const fallbackLng = 'ar';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: savedLanguage || fallbackLng,
    fallbackLng,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
    },
  });

export default i18n;
