import React from 'react';
import { render, screen } from '@testing-library/react';

import { AIMarkdown } from '..';
import { axe } from '../../../../axe-helper';

describe('AIMarkdown', () => {
  it('renders inline code without the highlighter', () => {
    const { container } = render(<AIMarkdown>{'run `yarn build` now'}</AIMarkdown>);
    expect(container.querySelector('code[data-inline="true"]')).toHaveTextContent(
      'yarn build',
    );
    expect(container.querySelector('.str-chat__ai-syntax-highlighter-pre')).toBeNull();
  });

  it('marks a fenced block without a language as block code', () => {
    const { container } = render(<AIMarkdown>{'```\nplain text\n```'}</AIMarkdown>);
    const code = container.querySelector('pre > code');
    expect(code).toHaveTextContent('plain text');
    expect(code).toHaveAttribute('data-inline', 'false');
    expect(container.querySelector('[data-inline="true"]')).toBeNull();
  });

  it.each([
    ['inline code', 'run `yarn build` now'],
    ['a fenced block without a language', '```\nplain\n```'],
    ['a fenced block with a language', '```ts\nconst a = 1;\n```'],
  ])('does not leak the react-markdown node prop to the DOM for %s', (_, markdown) => {
    const { container } = render(<AIMarkdown>{markdown}</AIMarkdown>);
    expect(container.querySelector('code')).toBeInTheDocument();
    expect(container.querySelector('[node]')).toBeNull();
  });

  it('renders fenced code through the highlighter', () => {
    const { container } = render(<AIMarkdown>{'```ts\nconst a = 1;\n```'}</AIMarkdown>);
    expect(
      container.querySelector('.str-chat__ai-syntax-highlighter-pre'),
    ).toBeInTheDocument();
  });

  it('routes a registered tool fence to its component', () => {
    const Weather = ({ data }: { data: string }) => (
      <div data-testid='weather'>{data}</div>
    );
    render(
      <AIMarkdown toolComponents={{ weather: Weather }}>
        {'```weather\n{"c":21}\n```'}
      </AIMarkdown>,
    );
    expect(screen.getByTestId('weather')).toHaveTextContent('{"c":21}');
  });

  it('shows the chart fallback while the chart chunk loads', () => {
    render(<AIMarkdown>{'```chartjs\n{}\n```'}</AIMarkdown>);
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders a plain json fence as highlighted code, not as a chart', () => {
    const { container } = render(
      <AIMarkdown>{'```json\n{ "status": "ok", "items": [1, 2] }\n```'}</AIMarkdown>,
    );
    expect(screen.queryByText('Loading chart...')).toBeNull();
    expect(
      container.querySelector('.str-chat__ai-syntax-highlighter-pre'),
    ).toHaveTextContent('"status"');
  });

  it('renders a json fence that holds a Chart.js config as a chart', () => {
    const chartConfig = JSON.stringify({
      data: { datasets: [{ data: [1, 2, 3] }], labels: ['a', 'b', 'c'] },
      type: 'bar',
    });
    render(<AIMarkdown>{`\`\`\`json\n${chartConfig}\n\`\`\``}</AIMarkdown>);
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<AIMarkdown>{'# Title\n\n- a\n- b'}</AIMarkdown>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
