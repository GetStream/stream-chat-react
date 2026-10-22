// @vitest-environment node
import React from 'react';
import { renderToString } from 'react-dom/server';

import {
  AIMarkdown,
  AIMessageComposer,
  AIStateIndicator,
  StreamingMessage,
  VoiceGlow,
  VoiceWave,
} from '..';

it('server-renders without touching browser globals', () => {
  expect(typeof window).toBe('undefined');
  const html = renderToString(
    <>
      <AIMarkdown>{'**bold** and ```ts\nx\n```'}</AIMarkdown>
      <StreamingMessage text='streamed-ssr-marker' />
      <AIStateIndicator text='Thinking' />
      <AIMessageComposer>
        <AIMessageComposer.TextInput />
        <AIMessageComposer.SpeechToTextButton />
      </AIMessageComposer>
      <VoiceWave state='speaking' />
      <VoiceGlow state='thinking' />
      <VoiceGlow rendering='css' state='speaking' />
    </>,
  );
  expect(html).toContain('<strong>bold</strong>');
  expect(html).toContain('streamed-ssr-marker');
  expect(html).toContain('Thinking');
  expect(html).toContain('<input');
  expect(html).toContain(
    'class="str-chat__ai-voice-visualization str-chat__ai-voice-wave"',
  );
  expect(html).toContain(
    'class="str-chat__ai-voice-visualization str-chat__ai-voice-glow"',
  );
  expect(html).toContain('str-chat__ai-voice-glow--css');
  expect(html.match(/role="img"/g)).toHaveLength(3);
  expect(html.match(/<canvas/g)).toHaveLength(2);
});
