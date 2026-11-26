import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useDialogOnNearestManager } from '../hooks';
import { DialogAnchor } from '../service';
import { DialogManagerProvider } from '../../../context';
import { ResizeObserverMock } from '../../../mock-builders/browser';

const dialogId = 'dialog-anchor-test';

const DialogFixture = (props: Partial<React.ComponentProps<typeof DialogAnchor>>) => {
  const { dialog } = useDialogOnNearestManager({ id: dialogId });
  const [referenceElement, setReferenceElement] =
    React.useState<HTMLButtonElement | null>(null);

  return (
    <>
      <button
        data-testid='open-dialog'
        onClick={() => dialog.open()}
        ref={setReferenceElement}
      >
        Open
      </button>
      <button data-testid='close-dialog' onClick={() => dialog.close()}>
        Close
      </button>
      <DialogAnchor
        id={dialogId}
        placement='top-start'
        referenceElement={referenceElement}
        {...props}
      >
        <button data-testid='dialog-item'>Dialog item</button>
      </DialogAnchor>
    </>
  );
};

const renderOpenDialog = async (
  props: Partial<React.ComponentProps<typeof DialogAnchor>> = {},
) => {
  const result = render(
    <DialogManagerProvider id='dialog-anchor-test-manager'>
      <DialogFixture {...props} />
    </DialogManagerProvider>,
  );
  await act(() => {
    screen.getByTestId('open-dialog').click();
  });
  return { ...result, dialogContents: screen.getByTestId('str-chat__dialog-contents') };
};

/**
 * Stubs the layout jsdom lacks: a 1000px viewport, an overlay from 100px, a 20px reference at
 * `referenceTop` and a dialog of `contentHeight` capped by its `max-height`. With the defaults and
 * an 8px padding, 392px are left above the reference in a 500px overlay and 492px in the viewport.
 * Mutate the returned object to change the next measurement.
 */
const stubLayout = (initial: {
  contentHeight?: number;
  itemHeight?: number;
  overlayHeight: number;
  referenceTop?: number;
}) => {
  const layout = { contentHeight: 300, itemHeight: 0, referenceTop: 500, ...initial };
  const box = (top: number, left: number, width: number, height: number) => ({
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
  });
  const layoutOf = (element: Element) => {
    if (element === document.documentElement) return box(0, 0, 1000, 1000);
    if (element.matches('.str-chat__dialog-overlay'))
      return box(100, 0, 800, layout.overlayHeight);
    if (element.matches('[data-testid="open-dialog"]'))
      return box(layout.referenceTop, 100, 100, 20);
    if (element.matches('[data-testid="dialog-item"]'))
      return box(0, 0, 200, layout.itemHeight);
    if (element.matches('[data-testid="str-chat__dialog-contents"]')) {
      const maxHeight = parseFloat((element as HTMLElement).style.maxHeight);
      return box(0, 0, 200, Math.min(layout.contentHeight, maxHeight || Infinity));
    }
    return box(0, 0, 0, 0);
  };
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: Element,
  ) {
    return layoutOf(this) as DOMRect;
  });
  const dimension = (key: 'height' | 'width') =>
    function (this: HTMLElement) {
      return layoutOf(this)[key];
    };
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
    dimension('height'),
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
    dimension('width'),
  );
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(
    dimension('height'),
  );
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(
    dimension('width'),
  );
  return layout;
};

describe('DialogAnchor', () => {
  describe('fitAvailableSpace', () => {
    it('caps the dialog to the available space by default and lays its children out to fit', async () => {
      const { dialogContents } = await renderOpenDialog();

      expect(dialogContents).toHaveClass(
        'str-chat__dialog-contents--fit-available-space',
      );
      await waitFor(() => {
        expect(dialogContents.style.maxHeight).toMatch(/^\d+(\.\d+)?px$/);
      });
      expect(dialogContents.style.maxWidth).toMatch(/^\d+(\.\d+)?px$/);
    });

    it('leaves the dialog size uncapped with fitAvailableSpace={false}', async () => {
      const { dialogContents } = await renderOpenDialog({ fitAvailableSpace: false });

      await waitFor(() => {
        expect(dialogContents.style.top).not.toBe('');
      });
      expect(dialogContents).not.toHaveClass(
        'str-chat__dialog-contents--fit-available-space',
      );
      expect(dialogContents.style.maxHeight).toBe('');
      expect(dialogContents.style.maxWidth).toBe('');
    });
  });

  describe('fitAvailableSpace boundary', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('caps the dialog to the space left in its dialog overlay', async () => {
      stubLayout({ overlayHeight: 500 });
      const { dialogContents } = await renderOpenDialog();

      await waitFor(() => {
        expect(dialogContents.style.maxHeight).toBe('392px');
      });
    });

    it('opens beside its reference when it fits neither above nor below', async () => {
      // 192px are left above the reference and 272px below it.
      stubLayout({ contentHeight: 450, overlayHeight: 500, referenceTop: 300 });
      const { dialogContents } = await renderOpenDialog();

      await waitFor(() =>
        expect(dialogContents).toHaveAttribute('data-str-chat-placement', 'right-start'),
      );
      // The reference spans 100–200px horizontally; the dialog stays inside the overlay.
      expect(parseFloat(dialogContents.style.left)).toBeGreaterThanOrEqual(200);
      const top = parseFloat(dialogContents.style.top);
      expect(top).toBeGreaterThanOrEqual(108);
      expect(top + 450).toBeLessThanOrEqual(592);
    });

    it('never caps the dialog below one and a half items', async () => {
      // The overlay fits 24px; one and a half 36px items need 54px.
      stubLayout({ itemHeight: 36, overlayHeight: 40 });
      const { dialogContents } = await renderOpenDialog();

      await waitFor(() => {
        expect(dialogContents.style.maxHeight).toBe('54px');
      });
    });

    it('caps a dialog shorter than one and a half items to its content', async () => {
      stubLayout({ contentHeight: 40, itemHeight: 36, overlayHeight: 40 });
      const { dialogContents } = await renderOpenDialog();

      await waitFor(() => {
        expect(dialogContents.style.maxHeight).toBe('40px');
      });
    });

    it('falls back to the viewport while the dialog overlay has no area', async () => {
      stubLayout({ overlayHeight: 0 });
      const { dialogContents } = await renderOpenDialog();

      await waitFor(() => {
        expect(dialogContents.style.maxHeight).toBe('492px');
      });
    });
  });

  describe('updatePositionOnContentResize', () => {
    let requestAnimationFrameSpy: ReturnType<typeof vi.spyOn>;
    let cancelAnimationFrameSpy: ReturnType<typeof vi.spyOn>;
    let queuedFrames: Map<number, FrameRequestCallback>;
    let nextFrameId: number;

    beforeEach(() => {
      ResizeObserverMock.observers = [];
      vi.stubGlobal('ResizeObserver', ResizeObserverMock);
      nextFrameId = 0;
      queuedFrames = new Map();
      // Frames run only through `runQueuedFrames`.
      requestAnimationFrameSpy = vi
        .spyOn(window, 'requestAnimationFrame')
        .mockImplementation((callback) => {
          queuedFrames.set(++nextFrameId, callback);
          return nextFrameId;
        });
      cancelAnimationFrameSpy = vi
        .spyOn(window, 'cancelAnimationFrame')
        .mockImplementation((id) => {
          queuedFrames.delete(id);
        });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    // Called outside `act`, which would flush frames that focus handling requests.
    const triggerResize = () => {
      const observer = ResizeObserverMock.observers.find(({ active }) => active);
      expect(observer).toBeDefined();
      observer?.cb([], observer as unknown as ResizeObserver);
    };

    const runQueuedFrames = () => {
      const frames = [...queuedFrames.values()];
      queuedFrames.clear();
      act(() => frames.forEach((callback) => callback(performance.now())));
    };

    it('updates the position in the next animation frame', async () => {
      const layout = stubLayout({ overlayHeight: 500 });
      const { dialogContents } = await renderOpenDialog({
        updatePositionOnContentResize: true,
      });
      // 500px reference top - 300px dialog.
      await waitFor(() => expect(dialogContents.style.top).toBe('200px'));

      layout.referenceTop = 450;
      triggerResize();

      // Not inside the observer callback.
      await expect(
        waitFor(() => expect(dialogContents.style.top).toBe('150px'), { timeout: 100 }),
      ).rejects.toThrow();

      runQueuedFrames();

      await waitFor(() => expect(dialogContents.style.top).toBe('150px'));
    });

    it('moves a fitted dialog that grew to the roomier side', async () => {
      // Small, it fits in the 72px below the reference; grown to 300px, it fits only above.
      const layout = stubLayout({ contentHeight: 50, overlayHeight: 500 });
      const { dialogContents } = await renderOpenDialog({
        placement: 'bottom-start',
        updatePositionOnContentResize: true,
      });
      await waitFor(() => expect(dialogContents.style.top).toBe('520px'));
      expect(dialogContents).toHaveAttribute('data-str-chat-placement', 'bottom-start');

      layout.contentHeight = 300;
      triggerResize();
      runQueuedFrames();

      await waitFor(() =>
        expect(dialogContents).toHaveAttribute('data-str-chat-placement', 'top-start'),
      );
      expect(dialogContents.style.top).toBe('200px');
    });

    it('keeps only the latest pending update when the dialog resizes again before the frame', async () => {
      await renderOpenDialog({
        updatePositionOnContentResize: true,
      });
      requestAnimationFrameSpy.mockClear();
      cancelAnimationFrameSpy.mockClear();

      triggerResize();
      const firstFrameId = nextFrameId;
      triggerResize();
      const secondFrameId = nextFrameId;

      expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2);
      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(firstFrameId);
      expect(queuedFrames.has(firstFrameId)).toBe(false);
      expect(queuedFrames.has(secondFrameId)).toBe(true);
    });

    it('cancels the pending update and disconnects the observer when the dialog closes', async () => {
      await renderOpenDialog({
        updatePositionOnContentResize: true,
      });
      const observer = ResizeObserverMock.observers.find(({ active }) => active);

      triggerResize();
      const pendingFrameId = nextFrameId;
      cancelAnimationFrameSpy.mockClear();

      await act(() => {
        screen.getByTestId('close-dialog').click();
      });

      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(pendingFrameId);
      expect(observer?.disconnect).toHaveBeenCalled();
    });

    it('cancels the pending update when the dialog unmounts', async () => {
      const { unmount } = await renderOpenDialog({
        updatePositionOnContentResize: true,
      });

      triggerResize();
      const pendingFrameId = nextFrameId;
      cancelAnimationFrameSpy.mockClear();

      unmount();

      expect(cancelAnimationFrameSpy).toHaveBeenCalledWith(pendingFrameId);
    });
  });
});
