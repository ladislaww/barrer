"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { EN_LOCALE_ENABLED, messages } from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Record<keyof typeof messages.ru, string>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const STORAGE_KEY = "barrer.locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru");

  useEffect(() => {
    queueMicrotask(() => {
      // Пока EN скрыт, забываем ранее сохранённый выбор: иначе посетитель,
      // переключившийся на английский раньше, остался бы в нём без кнопки возврата.
      if (!EN_LOCALE_ENABLED) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "ru" || stored === "en") {
        setLocaleState(stored);
      }
    });
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const setLocale = (nextLocale: Locale) => {
      if (!EN_LOCALE_ENABLED) return;
      setLocaleState(nextLocale);
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    };

    return {
      locale,
      setLocale,
      t: messages[locale]
    };
  }, [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
