import { lazy, Suspense } from 'react';
import { useTranslationContext } from '../../../../../context/TranslationContext';
import type { ToolComponentProps } from '../../AIMarkdown';

const Chart = lazy(() => import('./Chart'));

export const SuspendedChart = (props: ToolComponentProps) => {
  const { t } = useTranslationContext();

  return (
    <Suspense
      fallback={<div className='aicr__chart--loading'>{t('Loading chart...')}</div>}
    >
      <Chart {...props} />
    </Suspense>
  );
};
