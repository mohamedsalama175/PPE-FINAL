import { create } from 'zustand';
import { translations, Language, TranslationKey } from './translations';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useI18nStore = create<I18nStore>((set) => ({
  language: 'en',
  setLanguage: (lang) => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    set({ language: lang });
  },
}));

export function useTranslation() {
  const language = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);

  const t = (key: TranslationKey): string => {
    return (translations[language] && translations[language][key]) || translations.en[key] || (key as string);
  };

  return { t, language, setLanguage };
}
