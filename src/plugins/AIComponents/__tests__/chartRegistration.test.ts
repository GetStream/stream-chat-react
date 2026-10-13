import { Chart as ChartJS } from 'chart.js';

import { CHART_JS_TYPES } from '../AIMarkdown/tools/charts/chartTypes';

// jsdom has no canvas context, so Chart.js bails out before building scales and a render test
// cannot see an unregistered scale. Check the registry instead: every chart type the schema
// accepts must have its controller and the scales that controller defaults to registered once
// the chart module has loaded.
describe('Chart.js registration', () => {
  beforeAll(async () => {
    await import('../AIMarkdown/tools/charts/Chart');
  });

  it.each(CHART_JS_TYPES)(
    'registers the controller and default scales for %s',
    (type) => {
      expect(() => ChartJS.registry.getController(type)).not.toThrow();

      const scales = Object.values(ChartJS.overrides[type]?.scales ?? {});
      for (const scale of scales) {
        const scaleType = (scale as { type?: string } | undefined)?.type;
        if (scaleType) {
          expect(() => ChartJS.registry.getScale(scaleType)).not.toThrow();
        }
      }
    },
  );
});
