import { act, renderHook } from '@testing-library/react';
import type { Thread } from 'stream-chat';

import { useActiveThread } from '../ChatView';

describe('useActiveThread', () => {
  const makeThread = () => {
    const release = vi.fn();
    const activate = vi.fn(() => release);
    return { activate, release, thread: { activate } as unknown as Thread };
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('activates the thread once while the window has focus, however many focus events arrive', () => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    const { activate, release, thread } = makeThread();

    renderHook(() => useActiveThread({ activeThread: thread }));
    act(() => {
      window.dispatchEvent(new Event('focus'));
      window.dispatchEvent(new Event('focus'));
    });

    expect(activate).toHaveBeenCalledTimes(1);
    expect(release).not.toHaveBeenCalled();
  });

  it('releases the activation on blur and activates again on focus', () => {
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    const { activate, release, thread } = makeThread();
    renderHook(() => useActiveThread({ activeThread: thread }));

    hasFocus.mockReturnValue(false);
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(release).toHaveBeenCalledTimes(1);

    hasFocus.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(activate).toHaveBeenCalledTimes(2);
  });

  it('releases the activation on unmount', () => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    const { release, thread } = makeThread();
    const { unmount } = renderHook(() => useActiveThread({ activeThread: thread }));

    unmount();

    expect(release).toHaveBeenCalledTimes(1);
  });
});
