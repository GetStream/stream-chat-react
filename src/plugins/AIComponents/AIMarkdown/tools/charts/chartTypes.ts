export const CHART_JS_TYPES = [
  'pie',
  'bar',
  'line',
  'bubble',
  'doughnut',
  'polarArea',
  'radar',
  'scatter',
] as const;

const chartJsTypes = new Set<string>(CHART_JS_TYPES);

/**
 * Cheap structural check (no zod, no chart.js) for whether a `json` fence holds a Chart.js
 * config. Full validation still happens in the lazily loaded chart chunk.
 */
export const looksLikeChartJsConfig = (data: string): boolean => {
  try {
    const parsed: unknown = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') return false;
    const { data: chartData, type } = parsed as { data?: unknown; type?: unknown };
    return (
      typeof type === 'string' &&
      chartJsTypes.has(type) &&
      !!chartData &&
      typeof chartData === 'object' &&
      Array.isArray((chartData as { datasets?: unknown }).datasets)
    );
  } catch {
    return false;
  }
};
