import translationENGB from './locales/en-GB/translation.json';
import translationENAU from './locales/en-AU/translation.json';
import translationLA from './locales/la/translation.json';
import translationKO from './locales/ko/translation.json';
import translationFA from './locales/fa/translation.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';
import translationNL from './locales/nl/translation.json';
import translationIT from './locales/it/translation.json';
import translationES from './locales/es/translation.json';
import translationDE from './locales/de/translation.json';
import translationHI from './locales/hi/translation.json';
import translationNO from './locales/no/translation.json';
import translationAR from './locales/ar/translation.json';
import translationPT from './locales/pt/translation.json';
import translationZH from './locales/zh/translation.json';
import translationJA from './locales/ja/translation.json';
import translationEL from './locales/el/translation.json';
import translationID from './locales/id/translation.json';
import translationHE from './locales/he/translation.json';

const resources = {
  en: { translation: translationEN },
  fr: { translation: translationFR },
  nl: { translation: translationNL },
  it: { translation: translationIT },
  es: { translation: translationES },
  de: { translation: translationDE },
  hi: { translation: translationHI },
  no: { translation: translationNO },
  ar: { translation: translationAR },
  pt: { translation: translationPT },
  zh: { translation: translationZH },
  ja: { translation: translationJA },
  el: { translation: translationEL },
  id: { translation: translationID },
  he: { translation: translationHE },
  ko: { translation: translationKO },
  fa: { translation: translationFA },
  'en-GB': { translation: translationENGB },
  'en-AU': { translation: translationENAU },
  la: { translation: translationLA }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr', 'nl', 'it', 'es', 'de', 'hi', 'no', 'ar', 'pt', 'zh', 'ja', 'el', 'id', 'he', 'ko', 'fa', 'en-GB', 'en-AU', 'la'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
