import { act, renderHook, waitFor } from '@testing-library/react';

import { useLocalVideoDimensions } from '../useLocalVideoDimensions';

/**
 * jsdom never loads media, so the probe element is stubbed: every `<video>` created records
 * itself and its metadata event is fired by hand. That also lets the tests count how many media
 * elements the hook creates, which is the resource it has to be careful with.
 */
const createdProbes: HTMLVideoElement[] = [];
// Captured once, before any spy exists: `restoreMocks` reinstalls the spy per test, and binding
// inside `beforeEach` would capture the previous spy and recurse.
const realCreateElement = document.createElement.bind(document);

const settleProbe = (probe: HTMLVideoElement, width: number, height: number) => {
  Object.defineProperty(probe, 'videoWidth', { configurable: true, value: width });
  Object.defineProperty(probe, 'videoHeight', { configurable: true, value: height });
  probe.dispatchEvent(new Event('loadedmetadata'));
};

beforeEach(() => {
  createdProbes.length = 0;
  vi.spyOn(document, 'createElement').mockImplementation(((
    tagName: string,
    options?: ElementCreationOptions,
  ) => {
    const element = realCreateElement(tagName, options);
    if (tagName === 'video') createdProbes.push(element as HTMLVideoElement);
    return element;
  }) as typeof document.createElement);
});

describe('useLocalVideoDimensions', () => {
  it('reports the intrinsic dimensions of the local file', async () => {
    const { result } = renderHook(() => useLocalVideoDimensions('blob:one'));

    await waitFor(() => expect(createdProbes).toHaveLength(1));
    act(() => settleProbe(createdProbes[0], 640, 360));

    await waitFor(() => expect(result.current).toEqual({ height: 360, width: 640 }));
  });

  it('probes a source only once, however many widgets ask for it', async () => {
    // A virtualized list remounts widgets as the user scrolls; re-probing each time would create
    // a media element per remount, and browsers cap how many can exist at once.
    const first = renderHook(() => useLocalVideoDimensions('blob:shared'));
    await waitFor(() => expect(createdProbes).toHaveLength(1));
    act(() => settleProbe(createdProbes[0], 1280, 720));
    await waitFor(() =>
      expect(first.result.current).toEqual({ height: 720, width: 1280 }),
    );
    first.unmount();

    const second = renderHook(() => useLocalVideoDimensions('blob:shared'));

    expect(second.result.current).toEqual({ height: 720, width: 1280 });
    expect(createdProbes).toHaveLength(1);
  });

  it('holds only one probe open at a time', async () => {
    // Several videos uploading together must not each hold a media element open.
    renderHook(() => useLocalVideoDimensions('blob:a'));
    renderHook(() => useLocalVideoDimensions('blob:b'));
    renderHook(() => useLocalVideoDimensions('blob:c'));

    await waitFor(() => expect(createdProbes).toHaveLength(1));
    act(() => settleProbe(createdProbes[0], 640, 360));

    await waitFor(() => expect(createdProbes).toHaveLength(2));
    act(() => settleProbe(createdProbes[1], 640, 360));

    await waitFor(() => expect(createdProbes).toHaveLength(3));
    // Drain the queue: it is shared process-wide, so a probe left pending here would hold up
    // every later test in this file — which is exactly the behaviour the timeout exists for.
    act(() => settleProbe(createdProbes[2], 640, 360));
  });

  it('releases the blob when the probe settles', async () => {
    renderHook(() => useLocalVideoDimensions('blob:released'));

    await waitFor(() => expect(createdProbes).toHaveLength(1));
    act(() => settleProbe(createdProbes[0], 640, 360));

    await waitFor(() => expect(createdProbes[0].getAttribute('src')).toBeNull());
  });

  it('gives up on a file that cannot be decoded, without blocking the queue', async () => {
    renderHook(() => useLocalVideoDimensions('blob:broken'));
    await waitFor(() => expect(createdProbes).toHaveLength(1));

    act(() => {
      createdProbes[0].dispatchEvent(new Event('error'));
    });

    // The next source still gets its turn.
    renderHook(() => useLocalVideoDimensions('blob:after-broken'));
    await waitFor(() => expect(createdProbes).toHaveLength(2));
  });

  it('reports nothing when there is no source', () => {
    const { result } = renderHook(() => useLocalVideoDimensions(undefined));

    expect(result.current).toBeUndefined();
    expect(createdProbes).toHaveLength(0);
  });
});
