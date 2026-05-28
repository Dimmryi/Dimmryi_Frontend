import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ukTranslation from './locales/uk/translation.json';
import enTranslation from './locales/en/translation.json';

const resources = {
    uk: { translation: ukTranslation },
    en: { translation: enTranslation },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'uk', // мова за замовчуванням
        interpolation: {
            escapeValue: false, // React захищає від XSS
        },
    });

export default i18n;
