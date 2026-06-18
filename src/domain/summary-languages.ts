export const summaryLanguages = [
  { code: "en", label: "English", promptName: "English" },
  { code: "ru", label: "Русский", promptName: "Russian" },
  { code: "uk", label: "Українська", promptName: "Ukrainian" },
  { code: "es", label: "Español", promptName: "Spanish" },
  { code: "de", label: "Deutsch", promptName: "German" },
  { code: "fr", label: "Français", promptName: "French" },
  { code: "pt", label: "Português", promptName: "Portuguese" },
  { code: "pl", label: "Polski", promptName: "Polish" },
] as const;

export type SummaryLanguage = (typeof summaryLanguages)[number]["code"];
export const defaultSummaryLanguage: SummaryLanguage = "en";

export function isSummaryLanguage(value: string): value is SummaryLanguage {
  return summaryLanguages.some((language) => language.code === value);
}

export function summaryLanguageName(code: SummaryLanguage): string {
  return summaryLanguages.find((language) => language.code === code)?.promptName ?? "English";
}
