// @vitest-environment node
import React from 'react';
import { renderToString } from 'react-dom/server';

import { AIConversation, AIUIHost, fromStreamMessage } from '../../AIComponents';
import { createA2UIRenderer } from '..';

it('server-renders a reply’s A2UI as a placeholder, without loading the A2UI packages', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof HTMLElement).toBe('undefined');
  const ui = new AIUIHost({ renderers: [createA2UIRenderer()], send: () => undefined });
  const html = renderToString(
    <AIConversation
      messages={[
        { id: 'u1', role: 'user', text: 'Plan a weekend' },
        fromStreamMessage({
          ai_generated: true,
          ai_ui: {
            content: '{"version":"1.0","createSurface":{"surfaceId":"s"}}',
            format: 'a2ui',
            status: 'complete',
          },
          attachments: [],
          id: 'a1',
          text: 'ssr-hidden-text',
        }),
      ]}
      ui={ui}
    />,
  );
  expect(html).toContain('str-chat__a2ui--loading');
  expect(html).not.toContain('ssr-hidden-text');
});
