"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { formatTranscriptParagraphs } from "@/domain/transcript-format";

export function TranscriptReader({ transcript }: { transcript: string }) {
  const sections = useMemo(() => transcript.split(/(?=^#{1,3}\s+)/m).filter((section) => section.trim()).map((section) => {
    const lines = section.trim().split("\n");
    const heading = lines[0].match(/^#{1,3}\s+(.+)$/)?.[1];
    const body = heading ? lines.slice(1).join(" ") : lines.join(" ");
    return { heading, paragraphs: formatTranscriptParagraphs(body) };
  }), [transcript]);
  const [copied, setCopied] = useState(false);
  async function copyTranscript() {
    await navigator.clipboard.writeText(transcript);
    setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  }
  return <section className="surface mt-5 p-5 sm:p-7" aria-labelledby="full-transcript-title">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><p className="eyebrow mb-1">AI-edited text</p><h2 id="full-transcript-title" className="text-xl font-bold">Condensed transcript</h2></div>
      <button className="button button-secondary" onClick={copyTranscript}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Copied" : "Copy transcript"}</button>
    </div>
    <div className="mx-auto max-w-3xl space-y-8 text-[17px] leading-8 text-stone-700">
      {sections.map((section, sectionIndex) => <section key={sectionIndex} className="space-y-5">{section.heading && <h3 className="text-xl font-bold leading-7 text-stone-950">{section.heading}</h3>}{section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</section>)}
    </div>
  </section>;
}
