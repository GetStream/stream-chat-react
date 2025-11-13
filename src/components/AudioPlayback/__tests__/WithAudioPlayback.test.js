// WithAudioPlayback.test.js
import React, { useEffect } from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, render } from '@testing-library/react';

import { useAudioPlayer, WithAudioPlayback } from '../WithAudioPlayback';
import * as audioModule from '../AudioPlayer'; // to spy on defaultRegisterAudioPlayerError

// mock context used by WithAudioPlayback
jest.mock('../../../context', () => {
  const mockAddError = jest.fn();
  const mockClient = { notifications: { addError: mockAddError } };
  const t = (s) => s;
  return {
    __esModule: true,
    mockAddError,
    useChatContext: () => ({ client: mockClient }),
    useTranslationContext: () => ({ t }),
    // export spy so tests can assert on it
  };
});

// make throttle a no-op (so seek/time-related stuff runs synchronously)
jest.mock('lodash.throttle', () => (fn) => fn);

// ------------------ imports FROM mocks ------------------

import { mockAddError as addErrorSpy } from '../../../context';

const defaultRegisterSpy = jest.spyOn(audioModule, 'defaultRegisterAudioPlayerError');

// silence console.error in tests
jest.spyOn(console, 'error').mockImplementation(() => {});

// ------------------ window.Audio + media stubs ------------------

const createdAudios = [];

beforeEach(() => {
  // Return a real <audio> so it has addEventListener/removeEventListener
  jest.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
    const el = document.createElement('audio');
    if (args[0]) {
      el.src = args[0];
      el.load();
    }
    createdAudios.push(el);
    return el;
  });

  jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => ({}));
  jest
    .spyOn(HTMLMediaElement.prototype, 'play')
    .mockImplementation(() => Promise.resolve());
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => ({}));

  jest.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(true);
  jest.spyOn(HTMLMediaElement.prototype, 'ended', 'get').mockReturnValue(false);
  jest.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(100);
});

afterEach(() => {
  cleanup();
  jest.resetAllMocks();
  createdAudios.length = 0;
  // addErrorSpy.mockReset();
  // defaultRegisterSpy.mockClear();
});

// ------------------ helpers ------------------

function RegisterPlayer({ onReady, params }) {
  const player = useAudioPlayer(params);
  useEffect(() => {
    if (!player) return;
    player.state.partialNext({ canPlayRecord: true });
    if (onReady) onReady(player);
  }, [player, onReady]);
  return null;
}

const renderWithProvider = ({ allowConcurrentPlayback, ui }) =>
  render(
    <WithAudioPlayback allowConcurrentPlayback={allowConcurrentPlayback}>
      {ui}
    </WithAudioPlayback>,
  );

// ------------------ tests ------------------

describe('WithAudioPlayback + useAudioPlayer', () => {
  describe.each([true, false])(
    'allowConcurrentPlayback is %s',
    (allowConcurrentPlayback) => {
      it('useAudioPlayer returns undefined when src is missing', () => {
        let seen;
        renderWithProvider({
          allowConcurrentPlayback,
          ui: <RegisterPlayer onReady={(p) => (seen = p)} params={{}} />,
        });
        expect(seen).toBeUndefined();
      });

      it('creates an AudioPlayer when src is provided and does not associate audio element until played', () => {
        let player;
        renderWithProvider({
          allowConcurrentPlayback,
          ui: (
            <RegisterPlayer
              onReady={(p) => (player = p)}
              params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
            />
          ),
        });

        expect(player).toBeTruthy();
        expect(player.elementRef).toBeNull();
        // the first (temporary) Audio is created in AudioPlayer constructor to test whether audio type can be played
        expect(createdAudios.length).toBe(1);
        expect(createdAudios[0].src).toBe('');

        player.play();
        expect(createdAudios[1].src).toBe('https://example.com/a.mp3');
        expect(player.src).toBe('https://example.com/a.mp3');
        expect(
          player['plugins']?.some?.((p) => p.id === 'AudioPlayerNotificationsPlugin'),
        ).toBe(true);
      });

      it('memoization: same props -> same player instance; changing src -> new instance', () => {
        const props = { mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' };
        let first, second, third;

        const { rerender } = renderWithProvider({
          allowConcurrentPlayback,
          ui: <RegisterPlayer onReady={(p) => (first = p)} params={props} />,
        });

        rerender(
          <WithAudioPlayback>
            <RegisterPlayer onReady={(p) => (second = p)} params={props} />
          </WithAudioPlayback>,
        );

        rerender(
          <WithAudioPlayback>
            <RegisterPlayer
              onReady={(p) => (third = p)}
              params={{ ...props, src: 'https://example.com/b.mp3' }}
            />
          </WithAudioPlayback>,
        );

        expect(first).toBe(second);
        expect(third).not.toBe(first);
      });

      it('subscriptions: sets secondsElapsed and progress in state on timeupdate Event ', () => {
        let player;
        renderWithProvider({
          allowConcurrentPlayback,
          ui: (
            <RegisterPlayer
              onReady={(p) => (player = p)}
              params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
            />
          ),
        });

        player.play();

        const audio = createdAudios[1];
        jest.spyOn(audio, 'duration', 'get').mockReturnValue(200);
        jest.spyOn(audio, 'currentTime', 'get').mockReturnValue(50);

        act(() => {
          audio.dispatchEvent(new Event('timeupdate'));
        });

        const st = player.state.getLatestValue();
        expect(st.secondsElapsed).toBe(50);
        expect(st.progressPercent).toBeCloseTo(25, 5);
      });

      it('subscriptions: sets isPlaying=false and secondsElapsed to duration on Event "ended"', () => {
        let player;
        renderWithProvider({
          allowConcurrentPlayback,
          ui: (
            <RegisterPlayer
              onReady={(p) => {
                player?.state.partialNext({ canPlayRecord: true });
                return (player = p);
              }}
              params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
            />
          ),
        });
        player.play();
        const audio = createdAudios[1];

        player.state.partialNext({ isPlaying: true });
        jest.spyOn(audio, 'duration', 'get').mockReturnValue(200);
        jest.spyOn(audio, 'currentTime', 'get').mockReturnValue(50);

        act(() => {
          audio.dispatchEvent(new Event('timeupdate'));
        });

        act(() => {
          audio.dispatchEvent(new Event('ended'));
        });

        const st = player.state.getLatestValue();
        expect(st.isPlaying).toBe(false);
        expect(st.secondsElapsed).toBe(200);
      });

      it('subscriptions: error with MediaError.code=4 logs and sets canPlayRecord=false', () => {
        let player;
        renderWithProvider({
          allowConcurrentPlayback,
          ui: (
            <RegisterPlayer
              onReady={(p) => (player = p)}
              params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
            />
          ),
        });

        player.play();
        const audio = createdAudios[1];

        Object.defineProperty(audio, 'error', {
          configurable: true,
          get: () => ({ code: 4 }),
        });

        act(() => {
          audio.dispatchEvent(new Event('error'));
        });

        const st = player.state.getLatestValue();
        expect(st.isPlaying).toBe(false);
        expect(st.canPlayRecord).toBe(false);

        expect(defaultRegisterSpy).toHaveBeenCalledTimes(1);
        const arg = defaultRegisterSpy.mock.calls[0][0];
        expect(arg.error).toBeInstanceOf(Error);
        expect(arg.error.message).toMatch('MEDIA_ERR_SRC_NOT_SUPPORTED');
        expect(arg.error.message).toMatch('https://example.com/a.mp3');
      });

      it('registerError mapping: failed-to-start -> translated message and notification', () => {
        let player;
        renderWithProvider({
          allowConcurrentPlayback,
          ui: (
            <RegisterPlayer
              onReady={(p) => (player = p)}
              params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
            />
          ),
        });

        act(() => {
          player.registerError({ errCode: 'failed-to-start' });
        });

        expect(addErrorSpy).toHaveBeenCalled();
        const call = addErrorSpy.mock.calls[0][0];
        expect(call.message).toBe('Failed to play the recording');
        expect(call.options.type).toBe('browser:audio:playback:error');
        expect(call.origin.emitter).toBe('AudioPlayer');
      });

      it('registerError mapping: not-playable / seek-not-supported', () => {
        let player;
        renderWithProvider({
          allowConcurrentPlayback,
          ui: (
            <RegisterPlayer
              onReady={(p) => (player = p)}
              params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
            />
          ),
        });

        act(() => {
          player.registerError({ errCode: 'not-playable' });
        });
        let call = addErrorSpy.mock.calls.pop()[0];
        expect(call.message).toBe(
          'Recording format is not supported and cannot be reproduced',
        );

        act(() => {
          player.registerError({ errCode: 'seek-not-supported' });
        });
        call = addErrorSpy.mock.calls.pop()[0];
        expect(call.message).toBe('Cannot seek in the recording');
      });

      it('registerError uses raw Error message if provided', () => {
        let player;
        renderWithProvider({
          allowConcurrentPlayback,
          ui: (
            <RegisterPlayer
              onReady={(p) => (player = p)}
              params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
            />
          ),
        });

        act(() => {
          player.registerError({ error: new Error('Boom!') });
        });

        const call = addErrorSpy.mock.calls[0][0];
        expect(call.message).toBe('Boom!');
      });

      it('unmounting WithAudioPlayback clears pool: element src is cleared and load() called', () => {
        let player;
        const { unmount } = renderWithProvider({
          allowConcurrentPlayback,
          ui: (
            <RegisterPlayer
              onReady={(p) => (player = p)}
              params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
            />
          ),
        });

        player.play();
        const loadSpy = jest.spyOn(player.elementRef, 'load');
        expect(player.elementRef.src).toBe('https://example.com/a.mp3');

        unmount();

        // cannot do "expect(player.elementRef.src).toBe('');" as player.elementRef.src in JSDOM normalizes to "http://localhost/"
        expect(player.elementRef).toBeNull();
        expect(loadSpy).toHaveBeenCalled();
      });

      it('unmounting WithAudioPlayback unsubscribes audio element listeners and pauses', () => {
        let player;
        const { unmount } = renderWithProvider({
          allowConcurrentPlayback,
          ui: (
            <RegisterPlayer
              onReady={(p) => (player = p)}
              params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
            />
          ),
        });
        player.play();
        const audio = createdAudios[1];

        const removeSpy = jest.spyOn(audio, 'removeEventListener');
        const pauseSpy = jest.spyOn(audio, 'pause');

        // Unmount provider -> audioPlayers.clear() -> unsubscribe() -> removeEventListener + pause
        unmount();

        expect(pauseSpy).toHaveBeenCalled();

        const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
        expect(removedEvents).toEqual(
          expect.arrayContaining(['ended', 'error', 'timeupdate']),
        );
      });

      it('re-mounting provider with same props creates a fresh player and cleans previous element', () => {
        const params = { mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' };

        let firstPlayer;
        const { unmount } = renderWithProvider({
          allowConcurrentPlayback,
          ui: <RegisterPlayer onReady={(p) => (firstPlayer = p)} params={params} />,
        });
        firstPlayer.play();

        expect(createdAudios.length).toBe(2);
        const firstEl = createdAudios[1];
        expect(firstPlayer).toBeTruthy();
        expect(firstPlayer.elementRef).toBe(firstEl);

        unmount();

        // After unmount, player was cleaned
        expect(firstPlayer.elementRef).toBeNull();

        // New provider -> new pool -> new player + new <audio>
        let secondPlayer;
        renderWithProvider({
          allowConcurrentPlayback,
          ui: <RegisterPlayer onReady={(p) => (secondPlayer = p)} params={params} />,
        });

        secondPlayer.play();

        expect(secondPlayer).toBeTruthy();
        expect(secondPlayer).not.toBe(firstPlayer);
        expect(createdAudios.length).toBe(4);
        expect(secondPlayer.elementRef).not.toBe(firstEl);
      });
    },
  );

  it('concurrent mode: separate elements per player (created lazily at registration)', () => {
    let p1, p2;
    renderWithProvider({
      allowConcurrentPlayback: true,
      ui: (
        <>
          <RegisterPlayer
            onReady={(p) => (p1 = p)}
            params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
          />
          <RegisterPlayer
            onReady={(p) => (p2 = p)}
            params={{ mimeType: 'audio/mpeg', src: 'https://example.com/b.mp3' }}
          />
        </>
      ),
    });

    p1.play();
    p2.play();
    expect(createdAudios.length).toBe(4);
    expect(p1.elementRef).not.toBe(p2.elementRef);
    expect(p1.elementRef).toBeInstanceOf(HTMLAudioElement);
    expect(p2.elementRef).toBeInstanceOf(HTMLAudioElement);
  });

  it('single-playback mode: second player takes over shared element, first is released', () => {
    let p1, p2;
    renderWithProvider({
      allowConcurrentPlayback: false,
      ui: (
        <>
          <RegisterPlayer
            onReady={(p) => (p1 = p)}
            params={{ mimeType: 'audio/mpeg', src: 'https://example.com/a.mp3' }}
          />
          <RegisterPlayer
            onReady={(p) => (p2 = p)}
            params={{ mimeType: 'audio/mpeg', src: 'https://example.com/b.mp3' }}
          />
        </>
      ),
    });

    expect(createdAudios.length).toBe(2);
    p1.play();
    const shared = p1.elementRef;
    expect(createdAudios.length).toBe(3);
    // timeupdate with 0 should not regress progress on the paused player (anti-flicker)
    const sharedCurrentTimeSpy = jest
      .spyOn(shared, 'currentTime', 'get')
      .mockReturnValue(40);
    act(() => {
      shared.dispatchEvent(new Event('timeupdate'));
    });
    expect(p1.state.getLatestValue().secondsElapsed).toBe(40);

    p2.play();
    // still only one <audio> handed over to p2 (other two are temporary for canPlayType() check on new AudioPlayer())
    expect(createdAudios.length).toBe(3);
    expect(p1.elementRef).toBeNull();
    expect(p2.elementRef).toBe(shared);
    expect(p2.elementRef.src).toBe('https://example.com/b.mp3');
    // p1 should preserve last known progress after element handoff
    expect(p1.state.getLatestValue().secondsElapsed).toBe(40);

    // timeupdate with 20 should not regress progress on the paused player (anti-flicker)
    sharedCurrentTimeSpy.mockReturnValue(20);
    act(() => {
      shared.dispatchEvent(new Event('timeupdate'));
    });
    expect(p1.state.getLatestValue().secondsElapsed).toBe(40);
    expect(p2.state.getLatestValue().secondsElapsed).toBe(20);
  });
});
