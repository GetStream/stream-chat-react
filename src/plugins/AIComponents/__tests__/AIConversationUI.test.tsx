import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';

import {
  AIConversation,
  type AIConversationAssistantMessageProps,
  type AIMessage,
  AIUIComponentView,
  AIUIHost,
  type AIUIRenderer,
  AIUIRuntimeLoader,
  AIUIRuntimeView,
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

  it('shows a UI being written even where no frame is painted', async () => {
    const frames = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    renderWithEnglish(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', '', {
            content: 'In the background',
            format: 'a2ui',
            status: 'streaming',
          }),
        ]}
        ui={makeHost()}
      />,
    );
    const stage = screen.getByText('In the background').closest('.str-chat__ai-ui');
    expect(stage).toHaveAttribute('data-entrance', 'hidden');
    await flushFrames();
    expect(stage).toHaveAttribute('data-entrance', 'shown');
    frames.mockRestore();
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

  it('shows a reply’s text when its UI throws, and keeps the rest of the conversation', async () => {
    const Throws = () => {
      throw new Error('The map had no places');
    };
    const throwing: AIUIRenderer = {
      createEngine: () => ({
        view: (document) =>
          document.content === 'boom' ? (
            <Throws />
          ) : (
            <div data-testid='card'>{String(document.content)}</div>
          ),
      }),
      format: 'a2ui',
    };
    const onRenderError = vi.fn();
    const ui = new AIUIHost({ onRenderError, renderers: [throwing], send: vi.fn() });
    // React reports what a boundary caught.
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithEnglish(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'A weekend by the lake', { content: 'boom', format: 'a2ui' }),
          user('u2', 'Again'),
          reply('a2', 'Another', { content: 'Ohrid plan', format: 'a2ui' }),
        ]}
        ui={ui}
      />,
    );
    await flushFrames();
    expect(screen.getByText('A weekend by the lake')).toBeInTheDocument();
    expect(screen.getByTestId('card')).toHaveTextContent('Ohrid plan');
    expect(onRenderError).toHaveBeenCalledTimes(1);
    expect(onRenderError).toHaveBeenCalledWith(expect.any(Error), 'a1');
    logged.mockRestore();
  });

  it('tells a custom message whether the reply’s UI shows, and whether it failed', async () => {
    const seen = new Map<
      string,
      Pick<AIConversationAssistantMessageProps, 'showsUI' | 'text' | 'uiFailed'>
    >();
    // Memoised, as an app's message often is: what it is told must change for it to show again.
    const AssistantMessage = React.memo(function AssistantMessage({
      isGenerating,
      message,
      showsUI,
      text,
      uiFailed,
    }: AIConversationAssistantMessageProps) {
      seen.set(message.id, { showsUI, text, uiFailed });
      return !isGenerating && !showsUI && text === '' ? (
        <p data-testid={`status-${message.id}`}>
          {uiFailed ? 'UI failed' : 'Finished without a text reply'}
        </p>
      ) : null;
    });
    const ui = new AIUIHost({
      onRenderError: vi.fn(),
      renderers: [cardRenderer],
      send: vi.fn(),
    });
    renderWithEnglish(
      <AIConversation
        AssistantMessage={AssistantMessage}
        messages={[
          user('u1', 'Plan'),
          reply('a1', '', { content: 'Ohrid plan', format: 'a2ui' }),
          user('u2', 'Again'),
          reply('a2', '', { content: 'nothing', format: 'a2ui' }),
          user('u3', 'In OpenUI'),
          reply('a3', 'In words', { content: 'root = Card()', format: 'openui' }),
          user('u4', 'Hi'),
          reply('a4', 'Hello'),
        ]}
        ui={ui}
      />,
    );
    expect(seen.get('a1')).toEqual({ showsUI: true, text: '', uiFailed: false });
    expect(seen.get('a2')).toEqual({ showsUI: false, text: '', uiFailed: false });
    expect(seen.get('a3')).toEqual({ showsUI: false, text: 'In words', uiFailed: false });
    expect(seen.get('a4')).toEqual({ showsUI: false, text: 'Hello', uiFailed: false });
    expect(screen.queryByTestId('status-a1')).not.toBeInTheDocument();
    expect(screen.getByTestId('status-a2')).toHaveTextContent(
      'Finished without a text reply',
    );

    act(() => ui.fail('a1', new Error('The map had no places')));
    await flushFrames();
    expect(ui.hasFailed('a1')).toBe(true);
    expect(seen.get('a1')).toEqual({ showsUI: false, text: '', uiFailed: true });
    expect(screen.getByTestId('status-a1')).toHaveTextContent('UI failed');
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  it('shows the replies’ text when a renderer’s runtime can’t load, and tries again for one being written', async () => {
    const importRuntime = vi.fn(() => Promise.reject(new Error('Failed to fetch')));
    const onFailure = vi.fn();
    const lazy: AIUIRenderer = {
      createEngine: (host) => {
        const loader = new AIUIRuntimeLoader(host, importRuntime, onFailure);
        return {
          view: (document) =>
            loader.showsText(document) ? null : (
              <AIUIRuntimeView
                loader={loader}
                placeholder={<div data-testid='loading' />}
                render={() => <div data-testid='card' />}
              />
            ),
        };
      },
      format: 'a2ui',
    };
    const ui = new AIUIHost({ renderers: [lazy], send: vi.fn() });
    const history = [
      user('u1', 'Plan'),
      reply('a1', 'A weekend by the lake', { content: 'x', format: 'a2ui' }),
      user('u2', 'Again'),
      reply('a2', 'A day in the old town', { content: 'y', format: 'a2ui' }),
    ];
    const { rerender } = renderWithEnglish(<AIConversation messages={history} ui={ui} />);
    await flushFrames();
    expect(screen.getByText('A weekend by the lake')).toBeInTheDocument();
    expect(screen.getByText('A day in the old town')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    expect(onFailure).toHaveBeenCalledTimes(1);

    rerender(
      <AIConversation
        messages={[
          ...history,
          user('u3', 'And Sunday?'),
          reply('a3', '', { content: 'z', format: 'a2ui', status: 'streaming' }),
        ]}
        ui={ui}
      />,
    );
    await flushFrames();
    expect(importRuntime).toHaveBeenCalledTimes(2);
    // the finished replies keep their text while the one being written tries again, and the
    // failure is said once
    expect(screen.getByText('A weekend by the lake')).toBeInTheDocument();
    expect(screen.getByText('A day in the old town')).toBeInTheDocument();
    expect(screen.getAllByTestId('loading')).toHaveLength(1);
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('tries a reply’s UI that failed while it was written again once it is written', async () => {
    const Throws = () => {
      throw new Error('Half a map');
    };
    const throwing: AIUIRenderer = {
      createEngine: () => ({
        view: (document) =>
          document.isStreaming ? (
            <Throws />
          ) : (
            <div data-testid='card'>{String(document.content)}</div>
          ),
      }),
      format: 'a2ui',
    };
    const onRenderError = vi.fn();
    const ui = new AIUIHost({ onRenderError, renderers: [throwing], send: vi.fn() });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { rerender } = renderWithEnglish(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'A weekend by the lake', {
            content: 'Ohrid',
            format: 'a2ui',
            status: 'streaming',
          }),
        ]}
        ui={ui}
      />,
    );
    await flushFrames();
    expect(screen.getByText('A weekend by the lake')).toBeInTheDocument();
    rerender(
      <AIConversation
        messages={[
          user('u1', 'Plan'),
          reply('a1', 'A weekend by the lake', { content: 'Ohrid plan', format: 'a2ui' }),
        ]}
        ui={ui}
      />,
    );
    await flushFrames();
    expect(screen.getByTestId('card')).toHaveTextContent('Ohrid plan');
    expect(onRenderError).toHaveBeenCalledTimes(1);
    logged.mockRestore();
  });

  it('leaves out only an app’s component that throws, and says so once the reply is written', async () => {
    const definition = parseAIUIComponentDefinition({
      description: 'A map.',
      name: 'trip_map',
      parameters: { properties: { title: { type: 'string' } }, required: ['title'] },
    });
    if (!definition) throw new Error('no definition');
    const tripMap = defineAIUIComponent<{ title: string }>(definition, ({ args }) => {
      if (args.title === 'nowhere') throw new Error('No places');
      return <div data-testid='map'>{args.title}</div>;
    });
    const withMap: AIUIRenderer = {
      createEngine: (host) => ({
        view: (document, messageId) => (
          <div>
            <div data-testid='card'>Plan</div>
            <AIUIComponentView
              args={{ title: String(document.content) }}
              component={tripMap}
              context={{
                emit: vi.fn(),
                host,
                isStreaming: document.isStreaming,
                messageId,
              }}
            />
          </div>
        ),
      }),
      format: 'a2ui',
    };
    const onRenderError = vi.fn();
    const ui = new AIUIHost({ onRenderError, renderers: [withMap], send: vi.fn() });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const messages = (content: string, status: string) => [
      user('u1', 'Plan'),
      reply('a1', 'A weekend by the lake', { content, format: 'a2ui', status }),
    ];
    const { rerender } = renderWithEnglish(
      <AIConversation messages={messages('nowhere', 'streaming')} ui={ui} />,
    );
    await flushFrames();
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.queryByTestId('map')).not.toBeInTheDocument();
    expect(onRenderError).not.toHaveBeenCalled();

    rerender(<AIConversation messages={messages('Ohrid', 'streaming')} ui={ui} />);
    await flushFrames();
    expect(screen.getByTestId('map')).toHaveTextContent('Ohrid');

    rerender(<AIConversation messages={messages('nowhere', 'complete')} ui={ui} />);
    await flushFrames();
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.queryByText('A weekend by the lake')).not.toBeInTheDocument();
    expect(onRenderError).toHaveBeenCalledTimes(1);
    expect(onRenderError).toHaveBeenCalledWith(expect.any(Error), 'a1');
    logged.mockRestore();
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
