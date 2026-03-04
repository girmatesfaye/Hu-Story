type EventRangeFormatOptions = {
  locale?: string;
  timeZone?: string;
  fallback?: string;
};

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

const getDateParts = (value: Date, locale?: string, timeZone?: string) => {
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone,
  }).formatToParts(value);

  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const year = parts.find((part) => part.type === "year")?.value;

  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
};

const formatMonthDay = (value: Date, locale?: string, timeZone?: string) =>
  new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(value);

const formatTime = (value: Date, locale?: string, timeZone?: string) =>
  new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(value);

const parseISODateTime = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return isValidDate(parsed) ? parsed : null;
};

export const formatEventDateRange = (
  startAt: string | null | undefined,
  endAt: string | null | undefined,
  options: EventRangeFormatOptions = {},
) => {
  const { locale, timeZone, fallback = "Date TBD" } = options;
  const start = parseISODateTime(startAt);
  if (!start) return fallback;

  const startDateLabel = formatMonthDay(start, locale, timeZone);
  const startTimeLabel = formatTime(start, locale, timeZone);

  const end = parseISODateTime(endAt);
  if (!end) {
    return `${startDateLabel} • ${startTimeLabel}`;
  }

  const startDayKey = getDateParts(start, locale, timeZone);
  const endDayKey = getDateParts(end, locale, timeZone);
  const endTimeLabel = formatTime(end, locale, timeZone);
  const timeRangeLabel =
    startTimeLabel === endTimeLabel
      ? startTimeLabel
      : `${startTimeLabel} – ${endTimeLabel}`;

  if (startDayKey && endDayKey && startDayKey === endDayKey) {
    return `${startDateLabel} • ${timeRangeLabel}`;
  }

  const endDateLabel = formatMonthDay(end, locale, timeZone);
  return `${startDateLabel} – ${endDateLabel}, ${timeRangeLabel}`;
};
