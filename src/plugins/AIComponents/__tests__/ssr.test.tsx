// @vitest-environment node
import React from 'react';
import { renderToString } from 'react-dom/server';

import {
  AIConversation,
  AIMarkdown,
  AIMessageComposer,
  AIStateIndicator,
  AISuggestions,
  AIUIHost,
  fromStreamMessage,
  parseMessageParts,
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
  expect(html).toContain('<textarea');
  expect(html).toContain(
    // Rendered on its own, each component is its own `str-chat` theme scope.
    'class="str-chat str-chat__ai-voice-visualization str-chat__ai-voice-wave"',
  );
  expect(html).toContain(
    'class="str-chat str-chat__ai-voice-visualization str-chat__ai-voice-glow"',
  );
  expect(html).toContain('str-chat__ai-voice-glow--css');
  expect(html.match(/role="img"/g)).toHaveLength(3);
  expect(html.match(/<canvas/g)).toHaveLength(2);
});

it('server-renders a conversation without touching browser globals', () => {
  const parts = parseMessageParts([
    {
      id: 'r1',
      preview: 'ssr-reasoning-marker',
      status: 'streaming',
      type: 'ai_reasoning',
    },
    {
      display_title: 'ssr-tool-marker',
      id: 'c1',
      status: 'running',
      type: 'ai_tool_call',
    },
  ]);
  const html = renderToString(
    <>
      <AIConversation
        footer={<p>ssr-footer-marker</p>}
        isThinking
        loadOlderMessages={() => undefined}
        messages={[
          { id: 'u1', role: 'user', text: 'ssr-question-marker' },
          { id: 'a1', isGenerating: true, parts, role: 'assistant', text: 'ssr-answer' },
        ]}
        pendingMessage={{ id: 'p1', text: 'ssr-pending-marker' }}
      />
      <AIMessageComposer>
        <AIMessageComposer.ChatOptions
          options={[{ id: 'think', title: 'Think harder' }]}
        />
      </AIMessageComposer>
      <AISuggestions onSelect={() => undefined} suggestions={['ssr-suggestion']} />
    </>,
  );
  for (const marker of [
    'ssr-question-marker',
    'ssr-reasoning-marker',
    'ssr-tool-marker',
    'ssr-answer',
    'ssr-pending-marker',
    'ssr-footer-marker',
    'ssr-suggestion',
  ]) {
    expect(html).toContain(marker);
  }
});

it('server-renders a reply’s generated UI without touching browser globals', () => {
  const ui = new AIUIHost({
    renderers: [
      {
        createEngine: () => ({
          view: (document) => <div>{String(document.content)}</div>,
        }),
        format: 'a2ui',
      },
    ],
    send: () => undefined,
  });
  const html = renderToString(
    <AIConversation
      messages={[
        { id: 'u1', role: 'user', text: 'Plan a weekend' },
        fromStreamMessage({
          ai_generated: true,
          ai_ui: { content: 'ssr-ui-marker', format: 'a2ui', status: 'streaming' },
          attachments: [],
          generating: true,
          id: 'a1',
          text: 'ssr-hidden-text',
        }),
      ]}
      ui={ui}
    />,
  );
  expect(html).toContain('ssr-ui-marker');
  expect(html).not.toContain('ssr-hidden-text');
  expect(html).toContain('data-entrance="hidden"');
});
