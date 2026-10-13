import React from 'react';
import { render, screen } from '@testing-library/react';

import { AIMarkdown } from '..';

const renderChartFence = (body: string) =>
  render(<AIMarkdown>{`\`\`\`chartjs\n${body}\n\`\`\``}</AIMarkdown>);

describe('AIMarkdown chart fallback', () => {
  it.each([
    ['invalid JSON', '{not json'],
    ['JSON failing the schema', '{"type":"bar","data":{"datasets":"nope"}}'],
  ])('falls back to the raw code for %s', async (_, body) => {
    const { container } = renderChartFence(body);
    expect(await screen.findByText(body)).toBeInTheDocument();
    expect(screen.queryByText('Loading chart...')).toBeNull();
    expect(container).toHaveTextContent(body);
    expect(container.querySelector('.str-chat__ai-chart')).toBeNull();
    expect(container.querySelector('canvas')).toBeNull();
  });
});
