import { renderHook } from '@testing-library/react';

import { useInteractionAnnouncements } from '../useInteractionAnnouncements';

const { announceMock, tMock } = vi.hoisted(() => ({
  announceMock: vi.fn(),
  tMock: vi.fn((key: string, params?: Record<string, number | string>) =>
    Object.keys(params ?? {}).reduce(
      (acc, paramKey) =>
        acc.replace(
          new RegExp(`\\{\\{\\s${paramKey}\\s\\}\\}`, 'g'),
          String(params?.[paramKey]),
        ),
      // strip the `aria/` prefix to mimic the natural-language key fallback
      key.replace(/^aria\//, ''),
    ),
  ),
}));

vi.mock('../../useAriaLiveAnnouncer', () => ({
  useAriaLiveAnnouncer: () => announceMock,
}));

vi.mock('../../../../context/TranslationContext', () => ({
  useTranslationContext: () => ({ t: tMock }),
}));

describe('useInteractionAnnouncements', () => {
  beforeEach(() => {
    announceMock.mockClear();
    tMock.mockClear();
  });

  it('returns a stable announceInteraction callback across renders', () => {
    const { rerender, result } = renderHook(() => useInteractionAnnouncements());
    const first = result.current.announceInteraction;
    rerender();
    expect(result.current.announceInteraction).toBe(first);
  });

  it('announces "Giphy sent" with polite priority', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('giphy.sent');
    expect(announceMock).toHaveBeenCalledWith('Giphy sent', { priority: 'polite' });
  });

  it('announces "Giphy canceled" with polite priority', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('giphy.canceled');
    expect(announceMock).toHaveBeenCalledWith('Giphy canceled', { priority: 'polite' });
  });

  it('announces "Poll sent" with polite priority', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('poll.sent');
    expect(announceMock).toHaveBeenCalledWith('Poll sent', { priority: 'polite' });
  });

  it('announces a removed poll option by name with polite priority', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('poll.optionRemoved', { option: 'First option' });
    expect(announceMock).toHaveBeenCalledWith('Removed option First option', {
      priority: 'polite',
    });
  });

  it('announces picking up a poll option assertively', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('poll.optionPickedUp', { option: 'First option' });
    expect(announceMock).toHaveBeenCalledWith(
      'Picked up "First option". Use arrow keys to reorder. Press Space or Tab to drop.',
      { priority: 'assertive' },
    );
  });

  it('announces dropping a poll option at its new position assertively', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('poll.optionDropped', {
      option: 'First option',
      position: 2,
    });
    expect(announceMock).toHaveBeenCalledWith('Dropped "First option" at position 2.', {
      priority: 'assertive',
    });
  });

  it('announces the composed poll dialog open message — assertive and deduped', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('poll.dialogOpened');
    // Open confirmation + the (reused) visible description + the Enter affordance, one utterance.
    expect(announceMock).toHaveBeenCalledWith(
      'Poll dialog opened. Create a question, add options, and configure poll settings. Press Enter to start typing.',
      { dedupeMs: 1000, priority: 'assertive' },
    );
  });

  it('interpolates the selected user with polite priority (immediate)', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('user.selected', { user: 'Alice' });
    expect(announceMock).toHaveBeenCalledWith('User selected: Alice', {
      priority: 'polite',
    });
  });

  it('announces a generic "giphy.shuffled" when no title is present', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('giphy.shuffled', {});
    expect(announceMock).toHaveBeenCalledWith('Giphy image changed', {
      priority: 'polite',
    });
  });

  it('includes the title in "giphy.shuffled" when present', () => {
    const { result } = renderHook(() => useInteractionAnnouncements());
    result.current.announceInteraction('giphy.shuffled', { title: 'cats' });
    expect(announceMock).toHaveBeenCalledWith('Giphy image changed: cats', {
      priority: 'polite',
    });
  });

  describe('channel.opened / thread.opened / command.selected (provider-delayed past the focus announcement)', () => {
    it('announces the opened channel politely, via a provider delay (survives caller unmount)', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('channel.opened', { name: 'General' });

      // A single deferred emit is handed to the PROVIDER (delayMs) — not a per-call-site debounce —
      // so it still fires after the list row that triggered it unmounts (e.g. on mobile). The
      // delay lets it land after the composer's focus announcement instead of competing with it.
      expect(announceMock).toHaveBeenCalledWith('Opened channel: General', {
        delayMs: 1500,
        priority: 'polite',
      });
    });

    it('announces the opened thread by its channel name, via the same provider delay', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('thread.opened', { name: 'General' });

      expect(announceMock).toHaveBeenCalledWith('Opened thread in General', {
        delayMs: 1500,
        priority: 'polite',
      });
    });

    it('announces the activated command by name, via the same provider delay', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('command.selected', { command: 'giphy' });

      expect(announceMock).toHaveBeenCalledWith('Command activated: giphy', {
        delayMs: 1500,
        priority: 'polite',
      });
    });

    it('lets a call site override the delay', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('channel.opened', {
        delayMs: 0,
        name: 'General',
      });

      expect(announceMock).toHaveBeenCalledWith('Opened channel: General', {
        delayMs: 0,
        priority: 'polite',
      });
    });
  });

  describe('suggestions.count (debounced stream)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('debounces and announces only the settled count', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('suggestions.count', { count: 8 });
      result.current.announceInteraction('suggestions.count', { count: 4 });
      result.current.announceInteraction('suggestions.count', { count: 2 });

      // Nothing announced synchronously while the query is still settling.
      expect(announceMock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);

      expect(announceMock).toHaveBeenCalledTimes(1);
      expect(announceMock).toHaveBeenCalledWith('2 suggestions', { priority: 'polite' });
    });

    it('names the suggestion list via the provided label', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('suggestions.count', {
        count: 5,
        suggestionsLabel: 'Command Suggestions',
      });
      vi.advanceTimersByTime(500);

      expect(announceMock).toHaveBeenCalledWith('5 Command Suggestions', {
        priority: 'polite',
      });
    });

    it('re-announces when only the label changes (same count)', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('suggestions.count', {
        count: 3,
        suggestionsLabel: 'Command Suggestions',
      });
      vi.advanceTimersByTime(500);
      result.current.announceInteraction('suggestions.count', {
        count: 3,
        suggestionsLabel: 'User Suggestions',
      });
      vi.advanceTimersByTime(500);

      expect(announceMock).toHaveBeenCalledTimes(2);
      expect(announceMock).toHaveBeenNthCalledWith(1, '3 Command Suggestions', {
        priority: 'polite',
      });
      expect(announceMock).toHaveBeenNthCalledWith(2, '3 User Suggestions', {
        priority: 'polite',
      });
    });

    it('coalesces rapid identical calls within one debounce window into a single announcement', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      // Two identical calls without the window elapsing between them → one announcement.
      result.current.announceInteraction('suggestions.count', { count: 3 });
      result.current.announceInteraction('suggestions.count', { count: 3 });
      vi.advanceTimersByTime(500);
      expect(announceMock).toHaveBeenCalledTimes(1);
      expect(announceMock).toHaveBeenLastCalledWith('3 suggestions', {
        priority: 'polite',
      });
    });

    it('re-announces an unchanged count once the previous announcement has settled', () => {
      // The hook is a dumb debounced channel: deduping an unchanged value is the caller's
      // responsibility (e.g. SuggestionList only re-announces on a genuine re-filter). A repeat
      // separated by the settle window IS announced again — this is what gives the user feedback
      // when the count stays constant (e.g. emoji results capped at N) as they keep typing.
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('suggestions.count', { count: 3 });
      vi.advanceTimersByTime(500);
      expect(announceMock).toHaveBeenCalledTimes(1);

      result.current.announceInteraction('suggestions.count', { count: 3 });
      vi.advanceTimersByTime(500);
      expect(announceMock).toHaveBeenCalledTimes(2);
      expect(announceMock).toHaveBeenLastCalledWith('3 suggestions', {
        priority: 'polite',
      });
    });

    it('does not debounce discrete confirmations', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());
      result.current.announceInteraction('giphy.sent');
      expect(announceMock).toHaveBeenCalledWith('Giphy sent', { priority: 'polite' });
    });

    it('lets params.debounceMs override the registered default for a single call', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      // suggestions.count defaults to 500ms; this call asks for 1000ms.
      result.current.announceInteraction('suggestions.count', {
        count: 3,
        debounceMs: 1000,
      });

      // The default window elapses, but the overridden one has not — still silent.
      vi.advanceTimersByTime(500);
      expect(announceMock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(announceMock).toHaveBeenCalledTimes(1);
      expect(announceMock).toHaveBeenCalledWith('3 suggestions', { priority: 'polite' });
    });

    it('opts an otherwise-immediate interaction into debouncing via params.debounceMs', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      // user.selected has no registered default → would normally fire immediately.
      result.current.announceInteraction('user.selected', {
        debounceMs: 300,
        user: 'Alice',
      });
      expect(announceMock).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(announceMock).toHaveBeenCalledWith('User selected: Alice', {
        priority: 'polite',
      });
    });

    it('cancelInteraction(type) drops that interaction’s pending announcement', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('suggestions.count', { count: 3 });
      result.current.cancelInteraction('suggestions.count');

      vi.advanceTimersByTime(500);
      expect(announceMock).not.toHaveBeenCalled();
    });

    it('cancelInteraction() with no argument drops all pending announcements', () => {
      const { result } = renderHook(() => useInteractionAnnouncements());

      result.current.announceInteraction('suggestions.count', { count: 3 });
      result.current.announceInteraction('search.resultCount', { count: 5 });
      result.current.cancelInteraction();

      vi.advanceTimersByTime(1500);
      expect(announceMock).not.toHaveBeenCalled();
    });
  });
});
