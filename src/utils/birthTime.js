export function parseBirthTime(noTime, bh, fallbackHour = 12, fallbackMinute = 0) {
  if (noTime || bh === "" || bh == null) return [fallbackHour, fallbackMinute];

  const numeric = Number(bh);
  if (!Number.isFinite(numeric)) return [fallbackHour, fallbackMinute];

  const totalMinutes = Math.round(numeric * 60);
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  return [
    Math.floor(normalizedMinutes / 60),
    normalizedMinutes % 60,
  ];
}
