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

  it('has no a11y violations', async () => {
    const { container } = render(<AIMarkdown>{'# Title\n\n- a\n- b'}</AIMarkdown>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
