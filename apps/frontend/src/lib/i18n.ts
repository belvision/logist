import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationRU from '@/locales/ru/translation.json';
import translationBE from '@/locales/be/translation.json';
import translationKZ from '@/locales/kz/translation.json';
import translationPL from '@/locales/pl/translation.json';
import translationLT from '@/locales/lt/translation.json';
import translationUZ from '@/locales/uz/translation.json';
import translationTJ from '@/locales/tj/translation.json';
import translationTR from '@/locales/tr/translation.json';
import translationKA from '@/locales/ka/translation.json';

// Import additional page translations
import cargoOwnersRU from '@/locales/ru/cargo-owners.json';
import carriersRU from '@/locales/ru/carriers.json';
import authRU from '@/locales/ru/auth.json';
import teamRU from '@/locales/ru/team.json';
import carriersPagesRU from '@/locales/ru/carriers-pages.json';

// Import Polish translations
import cargoOwnersPL from '@/locales/pl/cargo-owners.json';
import carriersPL from '@/locales/pl/carriers.json';
import authPL from '@/locales/pl/auth.json';

// Import auth for other languages
import authBE from '@/locales/be/auth.json';
import authKZ from '@/locales/kz/auth.json';
import authLT from '@/locales/lt/auth.json';
import authUZ from '@/locales/uz/auth.json';
import authTJ from '@/locales/tj/auth.json';
import authTR from '@/locales/tr/auth.json';
import authKA from '@/locales/ka/auth.json';

// Import other language translations for cargo-owners
import cargoOwnersBE from '@/locales/be/cargo-owners.json';
import cargoOwnersKZ from '@/locales/kz/cargo-owners.json';
import cargoOwnersLT from '@/locales/lt/cargo-owners.json';
import cargoOwnersUZ from '@/locales/uz/cargo-owners.json';
import cargoOwnersTJ from '@/locales/tj/cargo-owners.json';
import cargoOwnersTR from '@/locales/tr/cargo-owners.json';
import cargoOwnersKA from '@/locales/ka/cargo-owners.json';

// Import carriers for other languages
import carriersBE from '@/locales/be/carriers.json';
import carriersKZ from '@/locales/kz/carriers.json';
import carriersLT from '@/locales/lt/carriers.json';
import carriersUZ from '@/locales/uz/carriers.json';
import carriersTJ from '@/locales/tj/carriers.json';
import carriersTR from '@/locales/tr/carriers.json';
import carriersKA from '@/locales/ka/carriers.json';

const resources = {
  ru: { translation: { ...translationRU, ...cargoOwnersRU, ...carriersRU, ...authRU, ...teamRU, ...carriersPagesRU } },
  be: { translation: { ...translationBE, ...cargoOwnersBE, ...carriersBE, ...authBE } },
  kz: { translation: { ...translationKZ, ...cargoOwnersKZ, ...carriersKZ, ...authKZ } },
  pl: { translation: { ...translationPL, ...cargoOwnersPL, ...carriersPL, ...authPL } },
  lt: { translation: { ...translationLT, ...cargoOwnersLT, ...carriersLT, ...authLT } },
  uz: { translation: { ...translationUZ, ...cargoOwnersUZ, ...carriersUZ, ...authUZ } },
  tj: { translation: { ...translationTJ, ...cargoOwnersTJ, ...carriersTJ, ...authTJ } },
  tr: { translation: { ...translationTR, ...cargoOwnersTR, ...carriersTR, ...authTR } },
  ka: { translation: { ...translationKA, ...cargoOwnersKA, ...carriersKA, ...authKA } },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    supportedLngs: ['ru', 'be', 'kz', 'pl', 'lt', 'uz', 'tj', 'tr', 'ka'],
    react: {
      useSuspense: false, // Отключаем Suspense для предотвращения проблем с SSR/гидратацией
    },
  });

export default i18n;

