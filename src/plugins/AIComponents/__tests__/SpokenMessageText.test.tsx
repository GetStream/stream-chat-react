import React from 'react';
import { act, render } from '@testing-library/react';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

import {
  ChannelStateProvider,
  MessageProvider,
  TranslationProvider,
} from '../../../context';
import {
  generateMessage,
  initClientWithChannels,
  mockChannelStateContext,
  mockMessageContext,
  mockTranslationContextValue,
} from '../../../mock-builders';
import { SpokenMessageText, SpokenTextProvider } from '..';
import type {
  HeardTextFunction,
  HeardTextProgress,
  SpokenMessageTextProps,
  SpokenTextSubscribe,
} from '..';

const TEXT = 'Hello there, how can I help you today?';
const FRAME_MS = 16;

let client: StreamChat;
let channel: Channel;

type RenderOptions = {
  heard?: HeardTextFunction;
  historyThresholdMs?: number;
  props?: Partial<SpokenMessageTextProps>;
  subscribe?: SpokenTextSubscribe;
  withProvider?: boolean;
};

const generateLiveMessage = (overrides: Record<string, unknown> = {}) =>
  generateMessage({ created_at: new Date(), text: TEXT, ...overrides });

const renderSpokenMessageText = (
  message: LocalMessage,
  {
    heard,
    historyThresholdMs,
    props,
    subscribe,
    withProvider = true,
  }: RenderOptions = {},
) => {
  const tree = (msg: LocalMessage) => {
    const content = (
      <ChannelStateProvider value={mockChannelStateContext({ channel })}>
        <TranslationProvider value={mockTranslationContextValue({ userLanguage: 'en' })}>
          <MessageProvider value={mockMessageContext({ message: msg })}>
            <SpokenMessageText message={msg} {...props} />
          </MessageProvider>
        </TranslationProvider>
      </ChannelStateProvider>
    );
    return withProvider && heard ? (
      <SpokenTextProvider
        heard={heard}
        historyThresholdMs={historyThresholdMs}
        subscribe={subscribe}
      >
        {content}
      </SpokenTextProvider>
    ) : (
      content
    );
  };
  const result = render(tree(message));
  return {
    ...result,
    rerenderWith: (msg: LocalMessage) => result.rerender(tree(msg)),
  };
};

// MessageText also renders a visually hidden "Message," label; read only the text itself.
const shownText = (container: HTMLElement) =>
  container.querySelector('[data-testid="message-text-inner-wrapper"]')?.textContent ??
  '';

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe('SpokenMessageText', () => {
  beforeAll(async () => {
    ({
      channels: [channel],
      client,
    } = await initClientWithChannels());
  });

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
        'Date',
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reveals the text at the pace it is heard', () => {
    const start = performance.now();
    // 20 characters per second
    const heard = vi.fn<HeardTextFunction>((_, now) => ({
      chars: ((now - start) / 1000) * 20,
      done: false,
    }));
    const message = generateLiveMessage();
    const { container } = renderSpokenMessageText(message, { heard });

    expect(shownText(container)).toBe('');

    // requestAnimationFrame fires every 16 ms under fake timers
    advance(512);
    expect(shownText(container)).toBe(TEXT.slice(0, 10));

    advance(512);
    expect(shownText(container)).toBe(TEXT.slice(0, 20));

    advance(5000);
    // clamped to the text length, the full text while speech is still in progress
    expect(shownText(container)).toBe(TEXT);
    expect(heard).toHaveBeenCalledWith(message, expect.any(Number));
  });

  it('floors fractional character counts', () => {
    const heard: HeardTextFunction = () => ({ chars: 4.9, done: false });
    const { container } = renderSpokenMessageText(generateLiveMessage(), { heard });
    expect(shownText(container)).toBe(TEXT.slice(0, 4));
  });

  it('never moves the reveal backwards', () => {
    let progress: HeardTextProgress = { chars: 12, done: false };
    const heard: HeardTextFunction = () => progress;
    const { container } = renderSpokenMessageText(generateLiveMessage(), { heard });
    expect(shownText(container)).toBe(TEXT.slice(0, 12));

    progress = { chars: 3, done: false };
    advance(FRAME_MS * 3);
    expect(shownText(container)).toBe(TEXT.slice(0, 12));

    progress = { chars: 15, done: false };
    advance(FRAME_MS * 2);
    expect(shownText(container)).toBe(TEXT.slice(0, 15));
  });

  it('shows the full text once the speech is done and the message is not generating', () => {
    let progress: HeardTextProgress = { chars: 5, done: false };
    const heard: HeardTextFunction = () => progress;
    const { container } = renderSpokenMessageText(generateLiveMessage(), { heard });
    expect(shownText(container)).toBe(TEXT.slice(0, 5));

    progress = { chars: 8, done: true };
    advance(FRAME_MS * 2);
    expect(shownText(container)).toBe(TEXT);
  });

  it('keeps pacing a done message while it is still generating', () => {
    const heard = vi.fn<HeardTextFunction>(() => ({ chars: 8, done: true }));
    const message = generateLiveMessage({ generating: true });
    const { container, rerenderWith } = renderSpokenMessageText(message, { heard });
    expect(shownText(container)).toBe(TEXT.slice(0, 8));

    rerenderWith({ ...message, generating: false } as LocalMessage);
    expect(shownText(container)).toBe(TEXT);
  });

  it('stops ticking once the speech is done', () => {
    const heard = vi.fn<HeardTextFunction>(() => ({ chars: 8, done: true }));
    renderSpokenMessageText(generateLiveMessage({ generating: true }), { heard });
    const callCount = heard.mock.calls.length;

    advance(FRAME_MS * 20);
    expect(heard).toHaveBeenCalledTimes(callCount);
  });

  it('stops ticking on unmount', () => {
    const heard = vi.fn<HeardTextFunction>(() => ({ chars: 1, done: false }));
    const { unmount } = renderSpokenMessageText(generateLiveMessage(), { heard });
    advance(FRAME_MS * 3);
    unmount();
    const callCount = heard.mock.calls.length;

    advance(FRAME_MS * 20);
    expect(heard).toHaveBeenCalledTimes(callCount);
  });

  it('wakes up when the subscribed source notifies and unsubscribes on unmount', () => {
    let progress: HeardTextProgress | undefined;
    const heard: HeardTextFunction = () => progress;
    let notify: (() => void) | undefined;
    const unsubscribe = vi.fn();
    const subscribe = vi.fn<SpokenTextSubscribe>((listener) => {
      notify = listener;
      return unsubscribe;
    });
    const { container, unmount } = renderSpokenMessageText(generateLiveMessage(), {
      heard,
      subscribe,
    });
    // not paced yet: default StreamedMessageText output
    expect(shownText(container)).toBe(TEXT);

    progress = { chars: TEXT.length, done: false };
    act(() => notify?.());
    expect(shownText(container)).toBe(TEXT);

    progress = { chars: TEXT.length, done: true };
    act(() => notify?.());
    expect(shownText(container)).toBe(TEXT);

    expect(subscribe).toHaveBeenCalled();
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('starts pacing from the notified source', () => {
    let progress: HeardTextProgress = { chars: 2, done: true };
    const heard: HeardTextFunction = () => progress;
    let notify: (() => void) | undefined;
    const subscribe: SpokenTextSubscribe = (listener) => {
      notify = listener;
      return () => undefined;
    };
    const message = generateLiveMessage({ generating: true });
    const { container } = renderSpokenMessageText(message, { heard, subscribe });
    expect(shownText(container)).toBe(TEXT.slice(0, 2));

    // settled (done), so no ticking until the source notifies
    progress = { chars: 7, done: false };
    advance(FRAME_MS * 3);
    expect(shownText(container)).toBe(TEXT.slice(0, 2));

    act(() => notify?.());
    expect(shownText(container)).toBe(TEXT.slice(0, 7));

    progress = { chars: 9, done: false };
    advance(FRAME_MS * 2);
    expect(shownText(container)).toBe(TEXT.slice(0, 9));
  });

  it('shows messages loaded from history in full', () => {
    const heard: HeardTextFunction = () => ({ chars: 0, done: false });
    const message = generateLiveMessage({
      created_at: new Date(Date.now() - 60_000),
      generating: true,
    });
    const { container } = renderSpokenMessageText(message, { heard });
    expect(shownText(container)).toBe(TEXT);
  });

  it('honours historyThresholdMs', () => {
    const heard: HeardTextFunction = () => ({ chars: 0, done: false });
    const message = generateLiveMessage({ created_at: new Date(Date.now() - 60_000) });
    const { container } = renderSpokenMessageText(message, {
      heard,
      historyThresholdMs: 120_000,
    });
    expect(shownText(container)).toBe('');
  });

  it('falls back to the default streaming when heard returns undefined', () => {
    const heard = vi.fn<HeardTextFunction>(() => undefined);
    const message = generateLiveMessage({ text: 'Hello' });
    const { container, rerenderWith } = renderSpokenMessageText(message, { heard });
    expect(shownText(container)).toBe('Hello');

    rerenderWith({ ...message, text: 'Hello world' });
    advance(30);
    // StreamedMessageText types 2 letters every 30 ms
    expect(shownText(container)).toBe('Hello w');
    advance(90);
    expect(shownText(container)).toBe('Hello world');
    expect(heard).toHaveBeenCalled();
  });

  it('falls back to the default streaming without a provider', () => {
    const message = generateLiveMessage({ text: 'Hello' });
    const { container, rerenderWith } = renderSpokenMessageText(message, {
      withProvider: false,
    });
    expect(shownText(container)).toBe('Hello');

    rerenderWith({ ...message, text: 'Hello world' });
    advance(30);
    expect(shownText(container)).toBe('Hello w');
  });

  it('reveals the full text on ai_indicator.stop', () => {
    const heard: HeardTextFunction = () => ({ chars: 3, done: false });
    const message = generateLiveMessage();
    const { container } = renderSpokenMessageText(message, { heard });
    expect(shownText(container)).toBe(TEXT.slice(0, 3));

    act(() => {
      client.dispatchEvent({
        cid: channel.cid,
        message_id: 'another-message',
        type: 'ai_indicator.stop',
      });
    });
    expect(shownText(container)).toBe(TEXT.slice(0, 3));

    act(() => {
      client.dispatchEvent({
        cid: channel.cid,
        message_id: message.id,
        type: 'ai_indicator.stop',
      });
    });
    expect(shownText(container)).toBe(TEXT);
  });

  it('renders through MessageText with the custom renderText', () => {
    const heard: HeardTextFunction = () => ({ chars: 5, done: false });
    const renderText = vi.fn((text?: string) => <span data-testid='custom'>{text}</span>);
    const { container, getByTestId } = renderSpokenMessageText(generateLiveMessage(), {
      heard,
      props: { renderText },
    });
    expect(getByTestId('custom').textContent).toBe(TEXT.slice(0, 5));
    expect(container.querySelector('.str-chat__message-text')).toBeInTheDocument();
    expect(renderText).toHaveBeenLastCalledWith(
      TEXT.slice(0, 5),
      expect.anything(),
      expect.anything(),
    );
  });

  describe('with emoji and other astral characters', () => {
    // waving hand + skin tone modifier, mathematical script X, grinning face, the
    // US flag (two regional indicators) and a BMP character: all but the last are
    // surrogate pairs in UTF-16
    const ASTRAL_TEXT =
      'Hi \u{1F44B}\u{1F3FD} \u{1D4B3}\u{1F600}!\u{1F1FA}\u{1F1F8}\u00E9';
    const CODE_POINTS = Array.from(ASTRAL_TEXT);
    const LONE_SURROGATE =
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
    // render the raw text so that the assertions see exactly what was sliced
    const renderRawText = (text?: string) => <>{text}</>;

    it('counts chars in code points, not UTF-16 code units', () => {
      expect(CODE_POINTS.length).toBeLessThan(ASTRAL_TEXT.length);
      let progress: HeardTextProgress = { chars: 0, done: false };
      const heard: HeardTextFunction = () => progress;
      const { container } = renderSpokenMessageText(
        generateLiveMessage({ text: ASTRAL_TEXT }),
        { heard, props: { renderText: renderRawText } },
      );

      for (let chars = 1; chars <= CODE_POINTS.length; chars++) {
        progress = { chars, done: false };
        advance(FRAME_MS);
        const shown = shownText(container);
        expect(shown).toBe(CODE_POINTS.slice(0, chars).join(''));
        expect(shown).not.toMatch(LONE_SURROGATE);
      }
      // the whole text once chars reaches the code point length, still speaking
      expect(shownText(container)).toBe(ASTRAL_TEXT);
    });

    it('never renders a lone surrogate for fractional or time based progress', () => {
      const start = performance.now();
      // 7.3 code points per second
      const heard: HeardTextFunction = (_, now) => ({
        chars: ((now - start) / 1000) * 7.3,
        done: false,
      });
      const { container } = renderSpokenMessageText(
        generateLiveMessage({ text: ASTRAL_TEXT }),
        { heard, props: { renderText: renderRawText } },
      );

      for (let frame = 0; frame < 150; frame++) {
        advance(FRAME_MS);
        const shown = shownText(container);
        expect(shown).not.toMatch(LONE_SURROGATE);
        expect(ASTRAL_TEXT.startsWith(shown)).toBe(true);
      }
      expect(shownText(container)).toBe(ASTRAL_TEXT);
    });

    it('shows the full text when chars exceeds the code point length', () => {
      const heard: HeardTextFunction = () => ({
        chars: ASTRAL_TEXT.length + 10,
        done: false,
      });
      const { container } = renderSpokenMessageText(
        generateLiveMessage({ text: ASTRAL_TEXT }),
        { heard, props: { renderText: renderRawText } },
      );
      expect(shownText(container)).toBe(ASTRAL_TEXT);
    });

    it('never moves the reveal backwards in code points', () => {
      let progress: HeardTextProgress = { chars: 6, done: false };
      const heard: HeardTextFunction = () => progress;
      const { container } = renderSpokenMessageText(
        generateLiveMessage({ text: ASTRAL_TEXT }),
        { heard, props: { renderText: renderRawText } },
      );
      expect(shownText(container)).toBe(CODE_POINTS.slice(0, 6).join(''));

      progress = { chars: 2, done: false };
      advance(FRAME_MS * 3);
      expect(shownText(container)).toBe(CODE_POINTS.slice(0, 6).join(''));
    });

    it('keeps code point boundaries when the text grows', () => {
      const heard: HeardTextFunction = () => ({ chars: 5, done: false });
      const message = generateLiveMessage({ text: '\u{1F600}\u{1F600}' });
      const { container, rerenderWith } = renderSpokenMessageText(message, {
        heard,
        props: { renderText: renderRawText },
      });
      expect(shownText(container)).toBe('\u{1F600}\u{1F600}');

      rerenderWith({
        ...message,
        text: '\u{1F600}\u{1F600}\u{1F44B}\u{1F44B}\u{1F44B}\u{1F44B}',
      });
      advance(FRAME_MS);
      expect(shownText(container)).toBe('\u{1F600}\u{1F600}\u{1F44B}\u{1F44B}\u{1F44B}');
    });
  });
});
