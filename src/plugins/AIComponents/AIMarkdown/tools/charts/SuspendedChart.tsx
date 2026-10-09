import { Component, lazy, type ReactNode, Suspense } from 'react';
import { useTranslationContext } from '../../../../../context/TranslationContext';
import type { ToolComponentProps } from '../../AIMarkdown';

const Chart = lazy(() => import('./Chart'));

type ChartErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  resetKey: string;
};

/**
 * Isolates chart failures (chunk load errors, chart.js throwing on render) so
 * they render the raw-code fallback instead of unmounting the message.
 * Resets when the chart data changes (e.g. while a message is streaming).
 */
class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: ChartErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

export const SuspendedChart = (props: ToolComponentProps) => {
  const { t } = useTranslationContext();

  return (
    <ChartErrorBoundary fallback={props.fallback} resetKey={props.data}>
      <Suspense
        fallback={
          <div className='str-chat__ai-chart--loading'>{t('Loading chart...')}</div>
        }
      >
        <Chart {...props} />
      </Suspense>
    </ChartErrorBoundary>
  );
};
