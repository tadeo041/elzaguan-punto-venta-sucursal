// backend/src/common/date-utils.ts

/**
 * Devuelve el inicio del día local `dateStr` expresado en UTC (ISO con 'Z').
 * Ej: (México UTC−6) '2026-11-24' → '2026-11-24T06:00:00.000Z'
 */
export function localDayStartUtcIso(dateStr: string, offsetMin: number = -360): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const localAsUtc = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  return new Date(localAsUtc - offsetMin * 60 * 1000).toISOString();
}

/**
 * Devuelve el INICIO del día SIGUIENTE al local `dateStr`, en UTC (ISO con 'Z').
 * Úsalo como cota superior EXCLUSIVA: `createdAt < :endExclusive`.
 * Ej: (México UTC−6) '2026-11-24' → '2026-11-25T06:00:00.000Z'
 */
export function localNextDayStartUtcIso(dateStr: string, offsetMin: number = -360): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const localAsUtc = Date.UTC(y, m - 1, d + 1, 0, 0, 0, 0); // d+1 maneja fin de mes/año
  return new Date(localAsUtc - offsetMin * 60 * 1000).toISOString();
}

/**
 * Suma `days` a una fecha YYYY-MM-DD (útil para "ayer", "hace 7 días", etc.)
 */
export function addDaysIso(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}