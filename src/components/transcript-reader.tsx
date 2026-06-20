"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function TranscriptReader({ transcript }: { transcript: string }) {
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
    <div className="mx-auto max-w-3xl text-[17px] leading-8 text-stone-700">
      <ReactMarkdown components={{
        h1: ({ children }) => <h3 className="mt-8 mb-4 text-2xl font-bold leading-8 text-stone-950 first:mt-0">{children}</h3>,
        h2: ({ children }) => <h3 className="mt-8 mb-4 text-xl font-bold leading-7 text-stone-950 first:mt-0">{children}</h3>,
        h3: ({ children }) => <h3 className="mt-7 mb-3 text-lg font-bold leading-7 text-stone-950 first:mt-0">{children}</h3>,
        p: ({ children }) => <p className="mb-5">{children}</p>,
        ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6">{children}</ul>,
        ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-bold text-stone-950">{children}</strong>,
      }}>{transcript}</ReactMarkdown>
    </div>
  </section>;
}
