// ============================================================
// KonsinyasiApp — i18n Provider for Refine
// Translates built-in Refine button labels to Bahasa Indonesia
// ============================================================

import type { I18nProvider } from "@refinedev/core";

const translations: Record<string, string> = {
  "buttons.create": "Tambah",
  "buttons.save": "Simpan",
};

export const i18nProvider: I18nProvider = {
  translate: (key, options, defaultMessage) => {
    // Refine passes the default message either as `options` (string) or
    // as the third argument depending on the call site.
    const fallback = typeof options === "string" ? options : defaultMessage;
    return translations[key] ?? fallback ?? key;
  },
  changeLocale: async () => {
    // Only Bahasa Indonesia is supported at the moment.
  },
  getLocale: () => "id",
};
