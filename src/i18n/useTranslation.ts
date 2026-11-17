import { create } from 'zustand';
import { translations, Language, TranslationKey } from './translations';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nStore>((set) => ({
  language: 'en',
  setLanguage: (lang) => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
    set({ language: lang });
  },
}));

export function useTranslation() {
  const language = useI18nStore((state) => state.language);
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };
  
  return { t, language, setLanguage: useI18nStore.getState().setLanguage };
}
