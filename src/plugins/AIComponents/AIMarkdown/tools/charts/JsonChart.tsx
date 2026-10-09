import React from 'react';

import type { ToolComponentProps } from '../../AIMarkdown';
import { looksLikeChartJsConfig } from './chartTypes';
import { SuspendedChart } from './SuspendedChart';

/**
 * `json` fences render as a chart only when they hold a Chart.js config; any other JSON
 * (an API response, a config file, a partial payload mid-stream) stays highlighted code.
 */
export const JsonChart = (props: ToolComponentProps) =>
  looksLikeChartJsConfig(props.data) ? (
    <SuspendedChart {...props} />
  ) : (
    <>{props.fallback}</>
  );
