import { CHANNEL_META } from "@/lib/mock-data";
import type { Channel } from "@/lib/types";

export function ChannelBadge({ channel, size = "sm" }: { channel: Channel; size?: "sm" | "md" }) {
  const meta = CHANNEL_META[channel];
  const px = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold uppercase tracking-wide text-white ${px}`}
      style={{ backgroundColor: meta.colorVar }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
      {meta.short}
    </span>
  );
}