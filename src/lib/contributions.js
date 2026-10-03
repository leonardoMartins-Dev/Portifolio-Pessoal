/**
 * Gráfico de contribuições do app GitHub: organiza os dias em colunas de
 * semana (domingo → sábado, como no GitHub) e calcula os números do app.
 * Dias no formato `{ date: 'YYYY-MM-DD', count, level }`, em ordem.
 */
const DAY_MS = 86_400_000;
const toTime = (isoDate) => Date.parse(`${isoDate}T00:00:00Z`);

/** Dias → semanas de 7 posições; `null` onde não há dia (antes do primeiro, depois do último). */
export function toWeeks(days) {
  if (!days.length) return [];
  const firstSunday = toTime(days[0].date) - new Date(toTime(days[0].date)).getUTCDay() * DAY_MS;
  const weeks = [];
  for (const day of days) {
    const index = Math.round((toTime(day.date) - firstSunday) / DAY_MS);
    const column = Math.floor(index / 7);
    while (weeks.length <= column) weeks.push(Array(7).fill(null));
    weeks[column][index % 7] = day;
  }
  return weeks;
}

/**
 * Rótulos dos meses: na coluna da semana em que o mês começa. A primeira
 * coluna ganha o mês dela se houver espaço até o próximo rótulo.
 */
export function monthLabels(weeks, minGap = 3) {
  const labels = [];
  weeks.forEach((week, column) => {
    const first = week.find((day) => day?.date.endsWith('-01'));
    if (first) labels.push({ column, month: first.date.slice(0, 7) });
  });
  const opening = weeks[0]?.find(Boolean);
  if (opening && (labels[0]?.column ?? Infinity) >= minGap) {
    labels.unshift({ column: 0, month: opening.date.slice(0, 7) });
  }
  return labels;
}

/** Dias com pelo menos uma contribuição nos últimos `windowDays` dias do gráfico. */
export function activeDays(days, windowDays = 30) {
  if (!days.length) return 0;
  const from = toTime(days.at(-1).date) - (windowDays - 1) * DAY_MS;
  return days.filter((day) => day.count > 0 && toTime(day.date) >= from).length;
}
