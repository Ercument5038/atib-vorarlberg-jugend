"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "de" | "tr";
export type Theme = "light" | "dark";

type SiteSettings = {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
};

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("de");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedLanguage = window.localStorage.getItem("atib-language");
      const savedTheme = window.localStorage.getItem("atib-theme");
      if (savedLanguage === "de" || savedLanguage === "tr") setLanguageState(savedLanguage);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      language,
      theme,
      setLanguage: (nextLanguage: Language) => {
        setLanguageState(nextLanguage);
        window.localStorage.setItem("atib-language", nextLanguage);
      },
      toggleTheme: () => {
        setTheme((currentTheme) => {
          const nextTheme = currentTheme === "light" ? "dark" : "light";
          window.localStorage.setItem("atib-theme", nextTheme);
          return nextTheme;
        });
      },
    }),
    [language, theme],
  );

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const settings = useContext(SiteSettingsContext);
  if (!settings) throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  return settings;
}
