import React from 'react';

import type { ToolComponentProps } from '../../AIMarkdown';
import { looksLikeChartJsConfig } from './chartTypes';
import { SuspendedChart } from './SuspendedChart';

/**
 * Renders a `json` fence as a chart only when it holds a Chart.js config; other JSON (e.g. a
 * partial payload mid-stream) stays highlighted code.
 */
export const JsonChart = (props: ToolComponentProps) =>
  looksLikeChartJsConfig(props.data) ? (
    <SuspendedChart {...props} />
  ) : (
    <>{props.fallback}</>
  );
