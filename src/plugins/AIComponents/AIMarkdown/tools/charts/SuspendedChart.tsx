import { lazy, Suspense } from 'react';
import type { ToolComponentProps } from '../../AIMarkdown';

const Chart = lazy(() => import('./Chart'));

export const SuspendedChart = (props: ToolComponentProps) => (
  <Suspense fallback={<div className='aicr__chart--loading'>Loading chart...</div>}>
    <Chart {...props} />
  </Suspense>
);
