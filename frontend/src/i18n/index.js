import en from './en.json';
import hi from './hi.json';
import pa from './pa.json';

export const translations = {
  en,
  hi,
  pa,
};

export const getTranslation = (lang, keyPath, fallback = '') => {
  const dict = translations[lang] || translations.en;
  const keys = keyPath.split('.');
  let current = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to English
      let enCurrent = translations.en;
      for (const ek of keys) {
        if (enCurrent && typeof enCurrent === 'object' && ek in enCurrent) {
          enCurrent = enCurrent[ek];
        } else {
          return fallback || keyPath;
        }
      }
      return enCurrent;
    }
  }
  return current || fallback || keyPath;
};
