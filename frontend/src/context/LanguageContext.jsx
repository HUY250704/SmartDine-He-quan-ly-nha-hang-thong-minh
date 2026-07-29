import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import vi from "@/i18n/vi.json";
import en from "@/i18n/en.json";

const translations = { vi, en };
const LANGUAGE_KEY = "smartdine_lang";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(LANGUAGE_KEY) || "vi";
    } catch {
      return "vi";
    }
  });

  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      localStorage.setItem(LANGUAGE_KEY, l);
    } catch {}
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "vi" ? "en" : "vi");
  }, [lang, setLang]);

  const t = useCallback(
    (key) => {
      const keys = key.split(".");
      let val = translations[lang];
      for (const k of keys) {
        if (val == null) return key;
        val = val[k];
      }
      return val ?? key;
    },
    [lang]
  );

  const value = { lang, setLang, toggleLang, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
