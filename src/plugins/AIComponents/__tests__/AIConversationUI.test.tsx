import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';

import {
  AIConversation,
  type AIMessage,
  AIUIComponentView,
  AIUIHost,
  type AIUIRenderer,
  AIUIView,
  defineAIUIComponent,
  fromStreamMessage,
  parseAIUIComponentDefinition,
} from '..';
import { renderWithEnglish } from './renderWithEnglish';

const user = (id: string, text: string): AIMessage => ({ id, role: 'user', text });
const reply = (
  id: string,
  text: string,
  ui?: Record<string, unknown>,
  extra: Record<string, unknown> = {},
): AIMessage =>
  fromStreamMessage({
    ai_generated: true,
    ai_ui: ui,
    attachments: [],
    id,
    text,
    ...extra,
  });

// Shows a document's text as a card, or nothing for the content `nothing`.
const cardRenderer: AIUIRenderer = {
  createEngine: () => ({
    view: (document) =>
      document.content === 'nothing' ? null : (
        <div data-testid='card'>{String(document.content)}</div>
      ),
  }),
  format: 'a2ui',
  supports: (version) => version === undefined || version === '1.0',
};

const makeHost = () => new AIUIHost({ renderers: [cardRenderer], send: vi.fn() });

const flushFrames = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

describe('AIConversation with generated UI', () => {
  it('shows a reply’s UI in place of its text', () => {
    renderWithEnglish(
      <AIConversation
        messages={[
          user('u1', 'Plan a weekend in Ohrid'),
          reply('a1', "Here's a weekend in Ohrid.", {
            content: 'Ohrid plan',
            format: 'a2ui',
          }),
        ]}
        ui={makeHost()}
      />,
    );
    expect(screen.getByTestId('card')).toHaveTextContent('Ohrid plan');
    expect(screen.queryByText("Here's a weekend in Ohrid.")).not.toBeInTheDocument();
  });

  it('shows the text of a reply whose UI no renderer shows', () => {
    renderWithEnglish(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'In OpenUI', { content: 'root = Card()', format: 'openui' }),
          user('u2', 'Again'),
          reply('a2', 'A newer A2UI', { content: 'x', format: 'a2ui', version: '2.0' }),
          user('u3', 'Once more'),
          reply('a3', 'A newer field', { content: 'x', format: 'a2ui', v: 2 }),
          user('u4', 'And'),
          reply('a4', 'Shows nothing of its own', { content: 'nothing', format: 'a2ui' }),
        ]}
        ui={makeHost()}
      />,
    );
    for (const text of [
      'In OpenUI',
      'A newer A2UI',
      'A newer field',
      'Shows nothing of its own',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  it('shows the text without a host', () => {
    renderWithEnglish(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'The words', { content: 'Ohrid plan', format: 'a2ui' }),
        ]}
      />,
    );
    expect(screen.getByText('The words')).toBeInTheDocument();
  });

  it('stops thinking once a reply has UI to show, and keeps thinking while it has none', () => {
    const ui = makeHost();
    const question = user('u1', 'Plan');
    const { rerender } = renderWithEnglish(
      <AIConversation
        messages={[
          question,
          reply(
            'a1',
            '',
            { content: 'x', format: 'openui', status: 'streaming' },
            {
              generating: true,
            },
          ),
        ]}
        ui={ui}
      />,
    );
    expect(screen.getByText('Thinking…')).toBeInTheDocument();

    rerender(
      <AIConversation
        messages={[
          question,
          reply(
            'a1',
            '',
            { content: 'Ohrid', format: 'a2ui', status: 'streaming' },
            {
              generating: true,
            },
          ),
        ]}
        ui={ui}
      />,
    );
    expect(screen.queryByText('Thinking…')).not.toBeInTheDocument();
    expect(screen.getByTestId('card')).toHaveTextContent('Ohrid');
  });

  it('has the reply’s actions under a finished UI-only reply, not while its UI is written', () => {
    const ui = makeHost();
    const question = user('u1', 'Plan');
    const { rerender } = renderWithEnglish(
      <AIConversation
        messages={[
          question,
          reply('a1', '', { content: 'Ohrid', format: 'a2ui', status: 'streaming' }),
        ]}
        ui={ui}
      />,
    );
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();

    rerender(
      <AIConversation
        messages={[
          question,
          reply('a1', '', { content: 'Ohrid', format: 'a2ui', status: 'complete' }),
        ]}
        ui={ui}
      />,
    );
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('brings a UI in when it first shows while written, and shows one from history at once', async () => {
    const ui = makeHost();
    renderWithEnglish(
      <AIConversation
        messages={[
          user('u1', 'Earlier'),
          reply('a1', '', { content: 'From history', format: 'a2ui' }),
          user('u2', 'Plan'),
          reply('a2', '', {
            content: 'Being written',
            format: 'a2ui',
            status: 'streaming',
          }),
        ]}
        ui={ui}
      />,
    );
    const stageOf = (text: string) => screen.getByText(text).closest('.str-chat__ai-ui');
    expect(stageOf('From history')).toHaveAttribute('data-entrance', 'shown');
    expect(stageOf('Being written')).toHaveAttribute('data-entrance', 'hidden');
    await flushFrames();
    expect(stageOf('Being written')).toHaveAttribute('data-entrance', 'shown');
  });

  it('hands the replies’ documents to the host as they change', () => {
    const ui = makeHost();
    const receive = vi.spyOn(ui, 'receive');
    const messages = [
      user('u1', 'Plan'),
      reply('a1', '', { content: 'Ohrid', format: 'a2ui' }),
    ];
    renderWithEnglish(<AIConversation messages={messages} ui={ui} />);
    expect(receive).toHaveBeenCalledWith(messages);
  });
});

describe('AIUIView', () => {
  it('shows one reply’s UI outside a conversation, or nothing when no renderer shows it', () => {
    const ui = makeHost();
    const { rerender } = renderWithEnglish(
      <AIUIView
        document={{ content: 'Alone', format: 'a2ui', isStreaming: false }}
        host={ui}
        messageId='a1'
      />,
    );
    expect(screen.getByTestId('card')).toHaveTextContent('Alone');
    rerender(
      <AIUIView
        document={{ content: 'x', format: 'openui', isStreaming: false }}
        host={ui}
        messageId='a1'
      />,
    );
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });
});

describe('AIUIComponentView', () => {
  const definition = parseAIUIComponentDefinition({
    description: 'One place of a plan.',
    events: [{ description: 'Asks about the place.', name: 'ask_about' }],
    name: 'place_card',
    parameters: {
      properties: { place_note: { type: 'string' }, title: { type: 'string' } },
      required: ['title'],
      'x-order': ['title', 'place_note'],
    },
  });
  if (!definition) throw new Error('no definition');
  const placeCard = defineAIUIComponent<{ placeNote?: string; title: string }>(
    definition,
    ({ args, context }) => (
      <button
        onClick={() =>
          context.emit('ask_about', `Tell me more about ${args.title}`, {
            title: args.title,
          })
        }
        type='button'
      >
        {args.title}
        {args.placeNote && ` · ${args.placeNote}`}
      </button>
    ),
  );

  it('shows an app’s component once its arguments fit, and tells the agent what was done', () => {
    const emit = vi.fn();
    const context = { emit, host: makeHost(), isStreaming: true, messageId: 'a1' };
    const { rerender } = renderWithEnglish(
      <AIUIComponentView
        args={{ place_note: 'Best at' }}
        component={placeCard}
        context={context}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(
      <AIUIComponentView
        args={{ place_note: 'Best at sunset', title: 'Kaneo' }}
        component={placeCard}
        context={context}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Kaneo · Best at sunset' }));
    expect(emit).toHaveBeenCalledWith('ask_about', 'Tell me more about Kaneo', {
      title: 'Kaneo',
    });
  });
});
