import { act, renderHook } from '@testing-library/react';

import { useMutationObserver } from '../useMutationObserver';

// MutationObserver delivers asynchronously (microtask); let it flush.
const flush = () => act(async () => await Promise.resolve());

describe('useMutationObserver', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('runs the callback once on connect by default', () => {
    const onMutation = vi.fn();
    renderHook(() => useMutationObserver({ current: container }, onMutation));
    expect(onMutation).toHaveBeenCalledTimes(1);
  });

  it('does not run on connect when runOnConnect is false', () => {
    const onMutation = vi.fn();
    renderHook(() =>
      useMutationObserver({ current: container }, onMutation, { runOnConnect: false }),
    );
    expect(onMutation).not.toHaveBeenCalled();
  });

  it('runs the callback on subtree mutations', async () => {
    const onMutation = vi.fn();
    renderHook(() =>
      useMutationObserver({ current: container }, onMutation, { runOnConnect: false }),
    );

    container.appendChild(document.createElement('span'));
    await flush();

    expect(onMutation).toHaveBeenCalled();
  });

  it('does nothing while disabled and runs onDisconnect when it becomes disabled', () => {
    const onMutation = vi.fn();
    const onDisconnect = vi.fn();
    const { rerender } = renderHook(
      ({ enabled }) =>
        useMutationObserver({ current: container }, onMutation, {
          enabled,
          onDisconnect,
        }),
      { initialProps: { enabled: true } },
    );
    expect(onMutation).toHaveBeenCalledTimes(1); // ran on connect

    rerender({ enabled: false });
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('does not connect when disabled from the start', () => {
    const onMutation = vi.fn();
    renderHook(() =>
      useMutationObserver({ current: container }, onMutation, { enabled: false }),
    );
    expect(onMutation).not.toHaveBeenCalled();
  });

  it('runs onDisconnect on unmount', () => {
    const onDisconnect = vi.fn();
    const { unmount } = renderHook(() =>
      useMutationObserver({ current: container }, vi.fn(), { onDisconnect }),
    );

    unmount();
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('stops calling the callback after unmount', async () => {
    const onMutation = vi.fn();
    const { unmount } = renderHook(() =>
      useMutationObserver({ current: container }, onMutation, { runOnConnect: false }),
    );

    unmount();
    container.appendChild(document.createElement('span'));
    await flush();

    expect(onMutation).not.toHaveBeenCalled();
  });

  describe('when MutationObserver is unavailable', () => {
    const original = globalThis.MutationObserver;
    beforeEach(() => {
      // @ts-expect-error - simulate an environment without MutationObserver
      delete globalThis.MutationObserver;
    });
    afterEach(() => {
      globalThis.MutationObserver = original;
    });

    it('does not throw, still runs onMutation on connect, and runs onDisconnect on unmount', () => {
      const onMutation = vi.fn();
      const onDisconnect = vi.fn();

      const { unmount } = renderHook(() =>
        useMutationObserver({ current: container }, onMutation, { onDisconnect }),
      );

      expect(onMutation).toHaveBeenCalledTimes(1); // ran on connect
      unmount();
      expect(onDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
