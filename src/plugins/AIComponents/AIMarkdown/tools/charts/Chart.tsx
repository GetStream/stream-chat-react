import { type ComponentProps, useMemo } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title as TitlePlugin,
  Tooltip,
} from 'chart.js';
import {
  Bar,
  Bubble,
  Doughnut,
  Line,
  Pie,
  PolarArea,
  Radar,
  Scatter,
} from 'react-chartjs-2';
import type { ToolComponentProps } from '../../AIMarkdown';
import { useTranslationContext } from '../../../../../context/TranslationContext';
import { chartJsSchema } from './chartJsSchema';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  TitlePlugin,
);

const UnknownChart = () => {
  const { t } = useTranslationContext();
  return <div>{t('Unknown chart type')}</div>;
};

const components = {
  bar: Bar,
  bubble: Bubble,
  doughnut: Doughnut,
  line: Line,
  pie: Pie,
  polarArea: PolarArea,
  radar: Radar,
  scatter: Scatter,
  unknown: UnknownChart,
} as const;

const Chart = ({ data, fallback }: ToolComponentProps) => {
  const parsedDataOrError = useMemo(() => {
    try {
      return chartJsSchema.parse(JSON.parse(data));
    } catch (error) {
      if (error instanceof Error) {
        error.message = `Error occured while parsing Chart.js data: ${error.message}`;
        return error;
      }
      return new Error('Unknown error occured while parsing Chart.js data');
    }
  }, [data]);

  if (parsedDataOrError instanceof Error) {
    return fallback;
  }

  const Component =
    components[parsedDataOrError.type as keyof typeof components] ?? components.unknown;

  return (
    <div className='str-chat__ai-chart'>
      <Component data={parsedDataOrError.data} options={{ responsive: true }} />
    </div>
  );
};

export type ChartProps = ComponentProps<typeof Chart>;

export default Chart;

// Context for usage:
// the application rendering these messages is capable of rendering charts using Chart.js, to render a chart return a markdown code block with language "chartjs" which contains JSON of Chart.js compatible data
