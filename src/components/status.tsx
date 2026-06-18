import { AlertTriangle, CheckCircle2, CircleHelp, Clock3 } from "lucide-react";
import type { Priority, TranscriptStatus } from "@/domain/types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map = { recommended: ["badge-green", "Recommended", CheckCircle2], low: ["badge-gray", "Low priority", Clock3], unclear: ["badge-amber", "Unclear", CircleHelp] } as const;
  const [className, label, Icon] = map[priority]; return <span className={`badge ${className}`}><Icon size={13} aria-hidden="true" />{label}</span>;
}
export function TranscriptBadge({ status }: { status: TranscriptStatus }) {
  const good = status === "available" || status === "manually_added";
  return <span className={`badge ${good ? "badge-green" : status === "failed" ? "badge-red" : "badge-amber"}`}>{good ? <CheckCircle2 size={13} aria-hidden="true" /> : <AlertTriangle size={13} aria-hidden="true" />}{status.replace("_", " ")}</span>;
}
