// @vitest-environment node
import React from 'react';
import { renderToString } from 'react-dom/server';

import { AIMarkdown, AIMessageComposer, AIStateIndicator, StreamingMessage } from '..';

it('server-renders without touching browser globals', () => {
  expect(typeof window).toBe('undefined');
  const html = renderToString(
    <>
      <AIMarkdown>{'**bold** and ```ts\nx\n```'}</AIMarkdown>
      <StreamingMessage text='hi' />
      <AIStateIndicator text='Thinking' />
      <AIMessageComposer>
        <AIMessageComposer.TextInput />
        <AIMessageComposer.SpeechToTextButton />
      </AIMessageComposer>
    </>,
  );
  expect(html).toContain('<strong>bold</strong>');
  expect(html).toContain('hi');
  expect(html).toContain('Thinking');
  expect(html).toContain('<input');
});
