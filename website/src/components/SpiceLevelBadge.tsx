import { Flame } from "lucide-react";

type SpiceLevel = "mild" | "medium" | "hot";

interface SpiceLevelBadgeProps {
  level: SpiceLevel;
  size?: "sm" | "md";
}

const config = {
  mild: { label: "Mild", color: "bg-spice-mild", flames: 1 },
  medium: { label: "Medium", color: "bg-spice-medium", flames: 2 },
  hot: { label: "Spicy", color: "bg-spice-hot", flames: 3 },
};

export const SpiceLevelBadge = ({ level, size = "md" }: SpiceLevelBadgeProps) => {
  const { label, color, flames } = config[level];
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";

  return (
    <div className={`inline-flex items-center gap-1 rounded-full ${color} text-white ${textSize} font-medium ${padding}`}>
      {Array.from({ length: flames }).map((_, i) => (
        <Flame key={i} className={iconSize} fill="currentColor" />
      ))}
      <span className="ml-0.5">{label}</span>
    </div>
  );
};
