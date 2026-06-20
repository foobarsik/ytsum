"use client";

import Link from "next/link";
import { ArrowLeft, Languages } from "lucide-react";
import { useSummaryLanguage } from "@/components/use-summary-language";
import { summaryLanguages, type SummaryLanguage } from "@/domain/summary-languages";

export default function SettingsPage() {
  const [language, setLanguage] = useSummaryLanguage();
  return (
    <div className="shell py-8 sm:py-12">
      <Link
        href="/"
        className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
      >
        <ArrowLeft size={16} />
        Back to playlists
      </Link>
      <div className="mx-auto max-w-2xl">
        <div className="mb-7">
          <p className="eyebrow mb-2">Preferences</p>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="muted mt-2">Defaults apply to every video unless overridden on its page.</p>
        </div>
        <section className="surface p-5 sm:p-7">
          <div className="mb-5 flex items-start gap-3">
            <Languages className="mt-0.5 text-[#EA580C]" size={20} />
            <div>
              <h2 className="font-bold">Summary language</h2>
              <p className="muted mt-1 text-sm">
                OpenRouter will generate summaries, key points, and action items in this language.
              </p>
            </div>
          </div>
          <label className="label" htmlFor="summary-language">
            Default language
          </label>
          <select
            id="summary-language"
            className="field"
            value={language}
            onChange={(event) => setLanguage(event.target.value as SummaryLanguage)}
          >
            {summaryLanguages.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-3 text-sm font-medium text-[#15803D]" aria-live="polite">
            Changes are saved automatically.
          </p>
        </section>
      </div>
    </div>
  );
}
