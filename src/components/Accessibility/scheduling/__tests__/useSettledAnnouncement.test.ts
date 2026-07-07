import { act, renderHook } from '@testing-library/react';

import { useSettledAnnouncement } from '../useSettledAnnouncement';
import type { UseSettledAnnouncementParams } from '../useSettledAnnouncement';

describe('useSettledAnnouncement', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setup = (params: UseSettledAnnouncementParams, announce = vi.fn()) => {
    const utils = renderHook(({ p }) => useSettledAnnouncement(announce, p), {
      initialProps: { p: params },
    });
    return { announce, ...utils };
  };

  it('announces only after the settleKey has been idle for the window', () => {
    const { announce, rerender } = setup({
      active: true,
      idleMs: 1000,
      message: 'ready',
      settleKey: 0,
    });

    // Each settleKey change before the window elapses restarts the timer.
    act(() => vi.advanceTimersByTime(600));
    rerender({ p: { active: true, idleMs: 1000, message: 'ready', settleKey: 1 } });
    act(() => vi.advanceTimersByTime(600));
    expect(announce).not.toHaveBeenCalled();

    // Once it settles for the full window, it fires once.
    act(() => vi.advanceTimersByTime(1000));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('ready', { priority: 'polite' });
  });

  it('announces at most once per active epoch by default', () => {
    const { announce, rerender } = setup({
      active: true,
      idleMs: 500,
      message: 'ready',
      settleKey: 0,
    });

    act(() => vi.advanceTimersByTime(500));
    expect(announce).toHaveBeenCalledTimes(1);

    // Further settleKey changes while still active do not re-announce.
    rerender({ p: { active: true, idleMs: 500, message: 'ready', settleKey: 1 } });
    act(() => vi.advanceTimersByTime(500));
    expect(announce).toHaveBeenCalledTimes(1);
  });

  it('re-arms after active goes false and true again', () => {
    const base = { idleMs: 500, message: 'ready', settleKey: 0 };
    const { announce, rerender } = setup({ ...base, active: true });

    act(() => vi.advanceTimersByTime(500));
    expect(announce).toHaveBeenCalledTimes(1);

    rerender({ p: { ...base, active: false } });
    rerender({ p: { ...base, active: true } });
    act(() => vi.advanceTimersByTime(500));
    expect(announce).toHaveBeenCalledTimes(2);
  });

  it('cancels a pending announcement when active goes false before it fires', () => {
    const base = { idleMs: 1000, message: 'ready', settleKey: 0 };
    const { announce, rerender } = setup({ ...base, active: true });

    act(() => vi.advanceTimersByTime(600));
    rerender({ p: { ...base, active: false } });
    act(() => vi.advanceTimersByTime(1000));
    expect(announce).not.toHaveBeenCalled();
  });

  it('re-announces on each settle when once is false', () => {
    const base = { idleMs: 500, message: 'ready', once: false };
    const { announce, rerender } = setup({ ...base, active: true, settleKey: 0 });

    act(() => vi.advanceTimersByTime(500));
    expect(announce).toHaveBeenCalledTimes(1);

    rerender({ p: { ...base, active: true, settleKey: 1 } });
    act(() => vi.advanceTimersByTime(500));
    expect(announce).toHaveBeenCalledTimes(2);
  });

  it('uses the provided priority', () => {
    const { announce } = setup({
      active: true,
      idleMs: 300,
      message: 'ready',
      priority: 'assertive',
      settleKey: 0,
    });
    act(() => vi.advanceTimersByTime(300));
    expect(announce).toHaveBeenCalledWith('ready', { priority: 'assertive' });
  });

  it('clears the pending timer on unmount', () => {
    const { announce, unmount } = setup({
      active: true,
      idleMs: 500,
      message: 'ready',
      settleKey: 0,
    });
    unmount();
    act(() => vi.advanceTimersByTime(500));
    expect(announce).not.toHaveBeenCalled();
  });
});
