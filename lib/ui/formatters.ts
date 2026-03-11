export const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// Compact location labels keep card layouts short without changing stored values.
export const formatCompactCampusLocation = (
  value: string | null | undefined,
) => {
  if (!value?.trim()) return "Location TBD";

  const cleaned = value
    .replace(/^[A-Z0-9]{3,}\+[A-Z0-9]{2,}[\.,]?\s*/i, "")
    .replace(/\((-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\)$/g, "")
    .replace(/\bSidama\b/gi, "")
    .replace(/\bEthiopi(?:a)?\b/gi, "")
    .replace(/\s*\.\s*/g, ", ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/(,\s*){2,}/g, ", ")
    .replace(/^,\s*|,\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || "Location TBD";
};
