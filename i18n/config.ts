export const locales = ["en", "ar", "ru", "fr", "es", "uk", "de", "it", "pt-BR", "ko", "zh", "nl", "tr"] as const;
export const defaultLocale = "en";
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  ru: "Русский",
  fr: "Français",
  es: "Español",
  uk: "Українська",
  de: "Deutsch",
  it: "Italiano",
  "pt-BR": "Português (Brasil)",
  ko: "한국어",
  zh: "简体中文",
  nl: "Nederlands",
  tr: "Türkçe",
};

export const localeDirection: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
  ru: "ltr",
  fr: "ltr",
  es: "ltr",
  uk: "ltr",
  de: "ltr",
  it: "ltr",
  "pt-BR": "ltr",
  ko: "ltr",
  zh: "ltr",
  nl: "ltr",
  tr: "ltr",
};
