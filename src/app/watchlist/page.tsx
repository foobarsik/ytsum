"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleHelp,
  Eye,
  Loader2,
  Megaphone,
  Plus,
  Radar,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useWatchlist } from "@/components/watchlist-provider";
import { useSummaryLanguage } from "@/components/use-summary-language";
import { mergeWatchlistChannel } from "@/data/watchlist-store";
import { buildWeeklyDigest } from "@/domain/watchlist";
import type { WatchlistChannel, WatchlistInsight, WatchlistVideo } from "@/domain/types";
import { VideoThumbnail } from "@/components/video-thumbnail";

type ChannelResponse = {
  id?: string;
  uploadsPlaylistId?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  topic?: string;
  videos?: WatchlistVideo[];
  error?: { message?: string };
};

function formatDate(value?: string): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function WatchlistPage() {
  const { channels, ready, upsert, update, remove } = useWatchlist();
  const [language] = useSummaryLanguage();
  const [channelInput, setChannelInput] = useState("");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const autoChecked = useRef(false);
  const digest = useMemo(() => buildWeeklyDigest(channels), [channels]);

  const analyzeVideos = useCallback(
    async (channel: WatchlistChannel, videos: WatchlistVideo[]) => {
      const targetIds = new Set(videos.map((video) => video.youtubeId));
      const history = channel.videos
        .flatMap((video) =>
          video.insight && !targetIds.has(video.youtubeId) ? [video.insight] : [],
        )
        .slice(0, 8);
      for (const video of videos.slice(0, 3)) {
        setBusy(`analyze:${video.youtubeId}`);
        const response = await fetch("/api/watchlist/analyze", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            channelTitle: channel.title,
            videoTitle: video.title,
            videoDescription: video.description,
            youtubeId: video.youtubeId,
            topic: channel.topic,
            language,
            priorInsights: history,
          }),
        });
        const result = (await response.json()) as {
          transcriptStatus?: WatchlistVideo["transcriptStatus"];
          insight?: WatchlistInsight;
          error?: { message?: string };
        };
        if (!response.ok)
          throw new Error(result.error?.message ?? `Could not analyze ${video.title}.`);
        channel = await update(channel.id, (current) => ({
          ...current,
          videos: current.videos.map((item) =>
            item.youtubeId === video.youtubeId
              ? {
                  ...item,
                  transcriptStatus: result.transcriptStatus ?? "failed",
                  ...(result.insight ? { insight: result.insight } : {}),
                }
              : item,
          ),
        }));
        if (result.insight) history.unshift(result.insight);
      }
    },
    [language, update],
  );

  const syncChannel = useCallback(
    async (channel: WatchlistChannel, automatic = false) => {
      if (!automatic) setBusy(`sync:${channel.id}`);
      const response = await fetch("/api/watchlist/channel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          input: channel.youtubeChannelId,
          topic: channel.topic,
          knownVideoIds: channel.videos.map((video) => video.youtubeId),
          limit: 20,
        }),
      });
      const result = (await response.json()) as ChannelResponse;
      if (!response.ok || !result.id || !result.uploadsPlaylistId || !result.title)
        throw new Error(result.error?.message ?? `Could not check ${channel.title}.`);
      const newVideos = result.videos ?? [];
      const incoming: WatchlistChannel = {
        ...channel,
        youtubeChannelId: result.id,
        uploadsPlaylistId: result.uploadsPlaylistId,
        title: result.title,
        description: result.description ?? "",
        thumbnail: result.thumbnail ?? "",
        lastCheckedAt: new Date().toISOString(),
        videos: newVideos,
      };
      const merged = mergeWatchlistChannel(channel, incoming);
      const persisted = await upsert(merged);
      if (newVideos.length) await analyzeVideos(persisted, newVideos);
      return newVideos.length;
    },
    [analyzeVideos, upsert],
  );

  useEffect(() => {
    if (!ready || autoChecked.current || !channels.length) return;
    autoChecked.current = true;
    const stale = channels.filter(
      (channel) =>
        !channel.lastCheckedAt ||
        Date.now() - new Date(channel.lastCheckedAt).getTime() > 6 * 60 * 60 * 1_000,
    );
    if (!stale.length) return;
    void (async () => {
      try {
        for (const channel of stale) await syncChannel(channel, true);
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Automatic channel check failed.");
      } finally {
        setBusy(null);
      }
    })();
  }, [channels, ready, syncChannel]);

  async function addChannel(event: React.FormEvent) {
    event.preventDefault();
    setBusy("add");
    setNotice("");
    try {
      if (channels.length >= 20) throw new Error("The watchlist supports up to 20 channels.");
      const response = await fetch("/api/watchlist/channel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: channelInput, topic, limit: 10 }),
      });
      const result = (await response.json()) as ChannelResponse;
      if (!response.ok || !result.id || !result.uploadsPlaylistId || !result.title)
        throw new Error(result.error?.message ?? "Could not add this channel.");
      if (channels.some((channel) => channel.youtubeChannelId === result.id))
        throw new Error("This channel is already in the watchlist.");
      const channel: WatchlistChannel = {
        id: result.id,
        youtubeChannelId: result.id,
        uploadsPlaylistId: result.uploadsPlaylistId,
        title: result.title,
        description: result.description ?? "",
        thumbnail: result.thumbnail ?? "",
        topic: topic.trim(),
        addedAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
        videos: result.videos ?? [],
      };
      const persisted = await upsert(channel);
      setChannelInput("");
      setTopic("");
      await analyzeVideos(persisted, persisted.videos);
      setNotice(`${channel.title} added. The latest videos were checked.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not add this channel.");
    } finally {
      setBusy(null);
    }
  }

  async function checkAll() {
    setBusy("all");
    setNotice("");
    try {
      let found = 0;
      for (const channel of channels) found += await syncChannel(channel);
      setNotice(
        found
          ? `${found} new video${found === 1 ? "" : "s"} found and queued for review.`
          : "No new videos found.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Channel check failed.");
    } finally {
      setBusy(null);
    }
  }

  async function retryAnalysis(channel: WatchlistChannel, video: WatchlistVideo) {
    setNotice("");
    try {
      await analyzeVideos(channel, [video]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Video analysis failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="shell py-9 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Signal intelligence</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Channel Watchlist</h1>
          <p className="muted mt-2 max-w-2xl">
            Monitor research channels, review new claims, and separate useful signals from promotion
            and weak reasoning.
          </p>
        </div>
        <button
          className="button button-secondary"
          onClick={checkAll}
          disabled={Boolean(busy) || !channels.length}
        >
          {busy === "all" ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <RefreshCw size={17} />
          )}
          Check all now
        </button>
      </div>

      <form
        onSubmit={addChannel}
        className="surface mb-8 grid gap-4 p-5 sm:grid-cols-[1.3fr_1fr_auto] sm:items-end"
      >
        <div>
          <label className="label" htmlFor="channel">
            YouTube channel
          </label>
          <input
            id="channel"
            className="field"
            value={channelInput}
            onChange={(event) => setChannelInput(event.target.value)}
            placeholder="https://youtube.com/@channel or @handle"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="topic">
            Research topic
          </label>
          <input
            id="topic"
            className="field"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="AI tooling, competitors, market…"
            maxLength={120}
          />
        </div>
        <button className="button button-primary" disabled={Boolean(busy)}>
          {busy === "add" ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}Add
          channel
        </button>
      </form>
      {notice && (
        <p
          className={`mb-6 text-sm font-semibold ${notice.includes("failed") || notice.includes("Could not") || notice.includes("already") ? "text-red-700" : "text-[#15803D]"}`}
        >
          {notice}
        </p>
      )}

      <SignalScoreGlossary />

      <section className="surface mb-8 overflow-hidden">
        <div className="border-b border-stone-200 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">Last 7 days</p>
              <h2 className="text-xl font-bold">Weekly digest</h2>
            </div>
            <span className="badge badge-gray">
              {digest.processedCount}/{digest.videoCount} reviewed
            </span>
          </div>
        </div>
        {!digest.videoCount ? (
          <div className="p-8 text-center">
            <Radar className="mx-auto mb-3 text-stone-400" />
            <p className="font-bold">No recent videos yet</p>
            <p className="muted mt-1 text-sm">
              Add channels or check the watchlist for new uploads.
            </p>
          </div>
        ) : (
          <div className="grid gap-px bg-stone-200 md:grid-cols-2 xl:grid-cols-4">
            <DigestColumn
              icon={<Eye size={17} />}
              title="Ranked signals"
              items={digest.signals.map(
                (item) =>
                  `${item.claim} · ${item.score}${item.verificationStatus === "needs_verification" ? " · verify term" : ""}`,
              )}
              empty="No decision-grade signals"
            />
            <DigestColumn
              icon={<Megaphone size={17} />}
              title="Marketing"
              items={digest.marketingSignals.map((item) => item.signal)}
              empty="No marketing signals"
            />
            <DigestColumn
              icon={<ShieldAlert size={17} />}
              title="Risks"
              items={digest.reasoningRisks.map((item) => item.signal)}
              empty="No reasoning risks"
            />
            <DigestColumn
              icon={<Radar size={17} />}
              title="Opportunities"
              items={digest.productOpportunities.map((item) => item.opportunity)}
              empty="No product opportunities"
            />
          </div>
        )}
      </section>

      <div className="space-y-5">
        {!ready ? (
          <div className="surface h-48 skeleton" />
        ) : !channels.length ? (
          <section className="surface py-14 text-center">
            <Eye className="mx-auto mb-4 text-stone-400" size={30} />
            <h2 className="text-lg font-bold">Your watchlist is empty</h2>
            <p className="muted mt-2">Start with a channel you review every week.</p>
          </section>
        ) : (
          channels.map((channel) => (
            <section key={channel.id} className="surface overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 p-5 sm:p-6">
                <div className="flex min-w-0 gap-4">
                  {channel.thumbnail && (
                    <Image
                      src={channel.thumbnail}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 rounded-full object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">{channel.title}</h2>
                      {channel.topic && <span className="badge badge-gray">{channel.topic}</span>}
                    </div>
                    <p className="muted mt-1 text-sm">
                      Last checked {formatDate(channel.lastCheckedAt)} · {channel.videos.length}{" "}
                      tracked videos
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="button button-secondary"
                    onClick={() =>
                      void syncChannel(channel)
                        .then((count) => {
                          setNotice(count ? `${count} new videos found.` : "No new videos found.");
                          setBusy(null);
                        })
                        .catch((error: unknown) => {
                          setNotice(
                            error instanceof Error ? error.message : "Channel check failed.",
                          );
                          setBusy(null);
                        })
                    }
                    disabled={Boolean(busy)}
                  >
                    {busy === `sync:${channel.id}` ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Check now
                  </button>
                  <button
                    className="button button-danger"
                    aria-label={`Remove ${channel.title}`}
                    onClick={() =>
                      void remove(channel.id).catch((error: unknown) =>
                        setNotice(
                          error instanceof Error ? error.message : "Could not delete the channel.",
                        ),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-stone-200">
                {channel.videos.slice(0, 10).map((video) => (
                  <article key={video.youtubeId} className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      {video.thumbnail && (
                        <VideoThumbnail
                          thumbnail={video.thumbnail}
                          title={video.title}
                          className="hidden w-36 shrink-0 self-start sm:block"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <a
                              href={`https://youtube.com/watch?v=${video.youtubeId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold hover:text-[var(--accent)]"
                            >
                              {video.title} <ArrowUpRight className="inline" size={14} />
                            </a>
                            <p className="muted mt-1 text-xs">{formatDate(video.publishedAt)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {video.insight && <span className="badge badge-green">Reviewed</span>}
                            <button
                              className="button button-secondary"
                              onClick={() => retryAnalysis(channel, video)}
                              disabled={Boolean(busy)}
                            >
                              {busy === `analyze:${video.youtubeId}` ? (
                                <Loader2 className="animate-spin" size={15} />
                              ) : (
                                <RefreshCw size={15} />
                              )}{" "}
                              {video.insight
                                ? "Retry review"
                                : video.transcriptStatus === "processing"
                                  ? "Review"
                                  : "Retry review"}
                            </button>
                          </div>
                        </div>
                        {video.insight && <InsightDetails insight={video.insight} />}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function SignalScoreGlossary() {
  const dimensions = [
    ["Novelty", "1 — commonly known context", "5 — a genuinely new pattern or development"],
    ["Specificity", "1 — broad or vague statement", "5 — scoped mechanism, workflow, or use case"],
    [
      "Evidence",
      "1 — unsupported assertion",
      "5 — concrete examples, numbers, or direct demonstration",
    ],
    [
      "Actionability",
      "1 — no practical implication",
      "5 — enables a clear decision, experiment, or product move",
    ],
    [
      "Market impact",
      "1 — isolated or local effect",
      "5 — changes category economics, roles, competition, or behaviour",
    ],
    [
      "Hype risk",
      "1 — measured and narrowly scoped",
      "5 — sweeping claim without a baseline or sufficient support",
    ],
  ];
  return (
    <details className="surface mb-8 p-5 sm:p-6">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-bold">
        <CircleHelp size={18} />
        How signal scoring works
      </summary>
      <div className="mt-5 border-t border-stone-200 pt-5">
        <p className="text-sm leading-6 text-stone-700">
          <strong>Score prioritises decision value; it does not establish truth.</strong> The
          formula is{" "}
          <code className="rounded bg-stone-100 px-1.5 py-0.5">
            novelty + specificity + actionability + market impact − hype risk
          </code>
          , giving a possible range from −1 to 19.
        </p>
        <p className="mt-3 text-sm leading-6 text-stone-700">
          A signal enters the digest at <strong>10 or higher</strong>, with{" "}
          <strong>evidence of at least 2/5</strong>, and only when classified as a workflow, role,
          tooling, market, or user-behaviour shift. Historical context, generic hype, author
          metadata, and unsupported recommendations are filtered out.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dimensions.map(([name, low, high]) => (
            <div key={name} className="rounded-lg border border-stone-200 p-3">
              <h3 className="text-sm font-bold">{name}</h3>
              <p className="muted mt-1 text-xs leading-5">
                {low}
                <br />
                {high}
              </p>
            </div>
          ))}
        </div>
        <p className="muted mt-4 text-xs leading-5">
          <strong>Evidence</strong> is a minimum-quality gate rather than an extra term in the
          formula. <strong>Confidence</strong> describes how certain the model is about its
          interpretation; it is not the same as signal importance.{" "}
          <strong>Verification status</strong> is separate again: it indicates whether technical
          names survived the noisy subtitle source and were matched in source metadata. An
          interesting signal can still require terminology verification.
        </p>
      </div>
    </details>
  );
}

function DigestColumn({
  icon,
  title,
  items,
  empty,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  empty: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, 4);
  return (
    <div className="bg-white p-5">
      <h3 className="mb-3 flex items-center gap-2 font-bold">
        {icon}
        {title}
        <span className="muted text-xs">{items.length}</span>
      </h3>
      {items.length ? (
        <>
          <ul className="space-y-2 text-sm text-stone-700">
            {visibleItems.map((item, index) => (
              <li key={`${item}-${index}`}>• {item}</li>
            ))}
          </ul>
          {items.length > 4 && (
            <button
              className="mt-4 text-sm font-bold text-[var(--accent)] hover:underline"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show less" : `Show all ${items.length}`}
            </button>
          )}
        </>
      ) : (
        <p className="muted text-sm">{empty}</p>
      )}
    </div>
  );
}

function InsightDetails({ insight }: { insight: WatchlistInsight }) {
  return (
    <details className="mt-4 rounded-lg bg-stone-50 p-4">
      <summary className="cursor-pointer text-sm font-bold">Critical review</summary>
      <p className="mt-3 text-sm leading-6 text-stone-700">{insight.overview}</p>
      <TermReview terms={insight.terms ?? []} />
      <RankedSignals signals={insight.signals ?? []} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SignalList title="Check-worthy claims" items={insight.claims.map((claim) => claim.text)} />
        <SignalList
          title="Position changes"
          items={insight.positionChanges.map(
            (change) => `${change.topic}: ${change.currentPosition}`,
          )}
        />
        <SignalList
          title="Marketing signals"
          items={insight.marketingSignals.map((signal) => signal.signal)}
        />
        <SignalList
          title="Reasoning risks"
          items={insight.reasoningRisks.map((signal) => signal.signal)}
        />
        <SignalList
          title="Quality signals"
          items={insight.qualitySignals.map((signal) => signal.signal)}
        />
        <SignalList
          title="Early signals"
          items={insight.earlySignals.map((signal) => signal.signal)}
        />
      </div>
      {insight.warnings.length > 0 && (
        <div className="mt-4 flex gap-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 shrink-0" size={16} />
          <span>{insight.warnings.join(" ")}</span>
        </div>
      )}
    </details>
  );
}

function RankedSignals({ signals }: { signals: NonNullable<WatchlistInsight["signals"]> }) {
  if (!signals.length)
    return (
      <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
        <h4 className="font-bold">Ranked signals</h4>
        <p className="muted mt-1 text-sm">
          No decision-grade signals passed the score and evidence threshold. Re-run older reviews to
          use the new ranking model.
        </p>
      </div>
    );
  return (
    <div className="mt-5 space-y-3">
      <h4 className="font-bold">Ranked signals</h4>
      {signals.map((signal) => (
        <article
          key={`${signal.signalType}-${signal.claim}`}
          className="rounded-lg border border-stone-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-gray">{signal.signalType.replaceAll("_", " ")}</span>
            <span className="badge badge-green">Interestingness {signal.score}</span>
            {signal.verificationStatus && (
              <span
                className={`badge ${signal.verificationStatus === "needs_verification" ? "badge-amber" : "badge-green"}`}
              >
                {signal.verificationStatus.replaceAll("_", " ")}
              </span>
            )}
            <span className="muted text-xs">{signal.confidence} confidence</span>
          </div>
          <h5 className="mt-3 font-bold text-stone-950">{signal.claim}</h5>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            <strong>Why it matters:</strong> {signal.whyItMatters}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            <strong>Affected:</strong> {signal.whoIsAffected.join(", ")}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            <strong>Counterpoint:</strong> {signal.counterpoint}
          </p>
          {signal.productOpportunity && (
            <p className="mt-2 text-sm leading-6 text-stone-700">
              <strong>Product opportunity:</strong> {signal.productOpportunity}
            </p>
          )}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-semibold text-[var(--accent)]">
              Evidence and scoring
            </summary>
            <p className="mt-2 leading-6 text-stone-700">{signal.evidenceFromVideo}</p>
            {signal.evidenceLevel && (
              <p className="mt-2 text-sm text-stone-700">
                <strong>Evidence level:</strong> {signal.evidenceLevel}
              </p>
            )}
            {signal.sourceFragility && (
              <p className="mt-2 text-sm text-stone-700">
                <strong>Source fragility:</strong> {signal.sourceFragility}
              </p>
            )}
            <p className="muted mt-2 text-xs">
              Novelty {signal.novelty}/5 · Specificity {signal.specificity}/5 · Evidence{" "}
              {signal.evidence}/5 · Actionability {signal.actionability}/5 · Market impact{" "}
              {signal.marketImpact}/5 · Hype risk {signal.hypeRisk}/5
            </p>
          </details>
        </article>
      ))}
    </div>
  );
}

function TermReview({ terms }: { terms: NonNullable<WatchlistInsight["terms"]> }) {
  const risky = terms.filter((term) => term.asrRisk !== "low" || term.verificationRequired);
  if (!risky.length) return null;
  return (
    <details className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <summary className="cursor-pointer text-sm font-bold text-amber-900">
        ASR-risk terms · {risky.length}
      </summary>
      <div className="mt-3 space-y-3">
        {risky.map((term) => (
          <div
            key={`${term.rawTerm}-${term.contextExcerpt}`}
            className="text-sm leading-6 text-amber-950"
          >
            <div className="flex flex-wrap items-center gap-2">
              <strong>{term.rawTerm}</strong>
              <span>→ {term.canonicalTerm ?? "unverified"}</span>
              <span
                className={`badge ${term.status === "needs_verification" ? "badge-amber" : "badge-green"}`}
              >
                {term.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="mt-1">{term.contextExcerpt}</p>
            {term.notes && <p className="mt-1 text-xs text-amber-800">{term.notes}</p>}
          </div>
        ))}
      </div>
    </details>
  );
}

function SignalList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">{title}</h4>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-sm text-stone-700">
          {items.slice(0, 5).map((item, index) => (
            <li key={`${item}-${index}`}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted mt-2 text-sm">None detected</p>
      )}
    </div>
  );
}
