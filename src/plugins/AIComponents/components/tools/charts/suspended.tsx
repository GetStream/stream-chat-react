import { lazy, Suspense } from 'react';
import type { ToolComponentProps } from '../../ai-markdown';

const Chart = lazy(() => import('./charts'));

export const SuspendedChart = (props: ToolComponentProps) => {
  return (
    <Suspense
      fallback={<div className="aicr__chart--loading">Loading chart...</div>}
    >
      <Chart {...props} />
    </Suspense>
  );
};
