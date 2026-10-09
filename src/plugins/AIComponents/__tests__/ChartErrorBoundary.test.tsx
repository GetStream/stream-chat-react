import React from 'react';
import { render, screen } from '@testing-library/react';

import { AIMarkdown } from '..';

vi.mock('../AIMarkdown/tools/charts/Chart', () => ({
  default: () => {
    throw new Error('chart.js exploded');
  },
}));

describe('AIMarkdown chart error isolation', () => {
  it('renders the raw-code fallback when the chart throws, without crashing the tree', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const body = '{"type":"bar","data":{"datasets":[]}}';

    const { container } = render(
      <>
        <p>before</p>
        <AIMarkdown>{`\`\`\`chartjs\n${body}\n\`\`\``}</AIMarkdown>
        <p>after</p>
      </>,
    );

    expect(await screen.findByText(body)).toBeInTheDocument();
    expect(screen.getByText('before')).toBeInTheDocument();
    expect(screen.getByText('after')).toBeInTheDocument();
    expect(screen.queryByText('Loading chart...')).toBeNull();
    expect(container.querySelector('.str-chat__ai-chart')).toBeNull();
    consoleError.mockRestore();
  });
});
