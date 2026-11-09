import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useScrollLocationLogic } from '../MessageList/useScrollLocationLogic';
import { ChatProvider } from '../../../../context/ChatContext';
import { getTestClientWithUser, mockChatContext } from '../../../../mock-builders';

import type { LocalMessage, StreamChat } from 'stream-chat';

// Regression cover for the viewport jumping to the newest message when a window the user jumped to
// (a search result deep in history) merges into the live head. The merge shows up as
// `hasMoreNewer` flipping true -> false while messages are appended below the loaded window; the
// viewport must not move for it.

let client: StreamChat;

const generateMessages = (length: number, offset = 0) =>
  Array.from({ length }, (_, index) =>
    fromPartial<LocalMessage>({ id: `${index + offset}`, user: { id: 'someone-else' } }),
  );

/** A scroll container sitting at the bottom of its currently loaded window. */
const createListElement = () => {
  const element = {
    clientHeight: 600,
    getBoundingClientRect: () => fromPartial<DOMRect>({ height: 600, width: 400 }),
    offsetHeight: 600,
    scrollBy: vi.fn(),
    scrollHeight: 16000,
    scrollTo: vi.fn(),
    scrollTop: 15400,
  };
  return element as unknown as HTMLElement & { scrollTo: ReturnType<typeof vi.fn> };
};

const renderScrollLogic = ({
  hasMoreNewer,
  listElement,
  messages,
}: {
  hasMoreNewer: boolean;
  listElement: HTMLElement;
  messages: LocalMessage[];
}) =>
  renderHook(
    (props: { hasMoreNewer: boolean; messages: LocalMessage[] }) =>
      useScrollLocationLogic({
        hasMoreNewer: props.hasMoreNewer,
        listElement,
        loadMoreScrollThreshold: 100,
        messages: props.messages,
        scrolledUpThreshold: 200,
      }),
    {
      initialProps: { hasMoreNewer, messages },
      wrapper: ({ children }: React.PropsWithChildren) => (
        <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
      ),
    },
  );

describe('useScrollLocationLogic', () => {
  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'alice' });
  });

  // The list can open at the bottom without a scroll event reporting it (the autoscroll lands before
  // the content is tall enough to scroll). The first scroll up must still leave "scrolled to bottom".
  it('reports the first scroll up after opening as no longer at the bottom', () => {
    const listElement = createListElement();
    const { result } = renderScrollLogic({
      hasMoreNewer: false,
      listElement,
      messages: generateMessages(25),
    });
    expect(result.current.isMessageListScrolledToBottom).toBe(true);

    (listElement as { scrollTop: number }).scrollTop = 10000;
    act(() => result.current.onScroll(fromPartial({ target: listElement })));

    expect(result.current.isMessageListScrolledToBottom).toBe(false);
  });

  it('does not scroll to the newest message when a jumped-to window merges into the live head', () => {
    const listElement = createListElement();
    const loadedWindow = generateMessages(25);

    const { rerender, result } = renderScrollLogic({
      hasMoreNewer: true,
      listElement,
      messages: loadedWindow,
    });
    // The list reports its scroll position through onScroll; the manager reads it from there.
    act(() => result.current.onScroll(fromPartial({ target: listElement })));
    listElement.scrollTo.mockClear();

    // The newer page arrives below the loaded window and closes the gap to the live head.
    listElement.scrollHeight = 28500;
    rerender({
      hasMoreNewer: false,
      messages: loadedWindow.concat(generateMessages(25, 25)),
    });

    expect(listElement.scrollTo).not.toHaveBeenCalled();
  });

  it('still scrolls to the newest message when messages arrive at the live head', () => {
    const listElement = createListElement();
    const loadedWindow = generateMessages(25);

    const { rerender, result } = renderScrollLogic({
      hasMoreNewer: false,
      listElement,
      messages: loadedWindow,
    });
    act(() => result.current.onScroll(fromPartial({ target: listElement })));
    listElement.scrollTo.mockClear();

    // Already at the head and at the bottom: a newly received message should pin the view to it.
    listElement.scrollHeight = 17000;
    rerender({
      hasMoreNewer: false,
      messages: loadedWindow.concat(generateMessages(1, 25)),
    });

    expect(listElement.scrollTo).toHaveBeenCalled();
  });

  describe('another window replaces the rendered messages', () => {
    // A reconnect across a gap replaces the loaded messages with the newest page.
    const renderWindowSwitch = ({ focusedMessageId }: { focusedMessageId?: string }) => {
      const listElement = createListElement();
      const { rerender, result } = renderHook(
        (props: { focusedMessageId?: string; messages: LocalMessage[] }) =>
          useScrollLocationLogic({
            focusedMessageId: props.focusedMessageId,
            hasMoreNewer: false,
            listElement,
            loadMoreScrollThreshold: 100,
            messages: props.messages,
            scrolledUpThreshold: 200,
          }),
        {
          initialProps: { messages: generateMessages(25) },
          wrapper: ({ children }: React.PropsWithChildren) => (
            <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
          ),
        },
      );
      act(() => result.current.onScroll(fromPartial({ target: listElement })));
      listElement.scrollTo.mockClear();

      rerender({ focusedMessageId, messages: generateMessages(27, 94) });
      return listElement;
    };

    it('scrolls to the bottom of the newest messages', () => {
      const listElement = renderWindowSwitch({});

      expect(listElement.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ top: listElement.scrollHeight }),
      );
    });

    it('leaves the list to the jump focusing a message', () => {
      const listElement = renderWindowSwitch({ focusedMessageId: '100' });

      expect(listElement.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('older page prepended', () => {
    // The anchor message sits at the top of the list's viewport (both rects start at 100) when
    // loading starts. After the prepend its layout offset inside the list is `ANCHOR_CONTENT_TOP`.
    const ANCHOR_CONTENT_TOP = 520;
    const ANCHOR_ID = '25';

    const originalCSS = Object.getOwnPropertyDescriptor(globalThis, 'CSS');
    afterEach(() => {
      if (originalCSS) Object.defineProperty(globalThis, 'CSS', originalCSS);
      else delete (globalThis as Record<string, unknown>).CSS;
    });
    const setIosWebKit = (isIos: boolean) =>
      Object.defineProperty(globalThis, 'CSS', {
        configurable: true,
        value: {
          supports: (property: string) => isIos && property === '-webkit-touch-callout',
        },
      });

    type FakeList = HTMLElement & {
      scrollBy: ReturnType<typeof vi.fn>;
      scrollTo: ReturnType<typeof vi.fn>;
    };

    /** A list near its top, holding one anchor message whose geometry the test controls. */
    const createNearTopList = ({
      unstableRects = false,
    }: { unstableRects?: boolean } = {}) => {
      let rectReads = 0;
      const anchorElement = {
        dataset: { messageId: ANCHOR_ID },
        getBoundingClientRect: () => {
          // Exact until the older page lands; the anchor is captured before that. Afterwards every
          // read differs, as iOS WebKit can still report pre-scroll geometry.
          const pageLanded = (element as { scrollHeight: number }).scrollHeight > 600;
          const top =
            unstableRects && pageLanded
              ? (rectReads++ % 2 ? 1 : -1) * 100 * rectReads
              : 100;
          return fromPartial<DOMRect>({ bottom: top + 120, height: 120, top });
        },
        offsetParent: null,
        offsetTop: ANCHOR_CONTENT_TOP,
      };
      const element = {
        clientHeight: 250,
        clientTop: 0,
        getBoundingClientRect: () =>
          fromPartial<DOMRect>({ bottom: 350, height: 250, top: 100 }),
        offsetHeight: 250,
        offsetParent: null,
        offsetTop: 0,
        querySelector: () => anchorElement,
        querySelectorAll: () => [anchorElement],
        scrollBy: vi.fn(),
        scrollHeight: 600,
        scrollTo: vi.fn(),
        scrollTop: 50,
        style: { overflowY: '' },
      };
      return element as unknown as FakeList;
    };

    const renderOlderPageLoad = ({
      listElement,
      reportLoading = true,
    }: {
      listElement: FakeList;
      reportLoading?: boolean;
    }) => {
      const current = generateMessages(25, 25);
      const older = generateMessages(25, 0);
      const hook = renderHook(
        (props: { loadingMore: boolean; messages: LocalMessage[] }) =>
          useScrollLocationLogic({
            hasMoreNewer: false,
            listElement,
            loadingMore: props.loadingMore,
            loadMoreScrollThreshold: 100,
            messages: props.messages,
            scrolledUpThreshold: 200,
          }),
        {
          initialProps: { loadingMore: false, messages: current },
          wrapper: ({ children }: React.PropsWithChildren) => (
            <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
          ),
        },
      );
      act(() => hook.result.current.onScroll(fromPartial({ target: listElement })));
      // Loading starts while the user is near, but not at, the top of the list.
      if (reportLoading) {
        hook.rerender({ loadingMore: true, messages: current });
      }
      listElement.scrollHeight = 900;
      // The older page arrives and the load ends in the same update.
      hook.rerender({ loadingMore: false, messages: older.concat(current) });
      return hook;
    };

    const settle = () =>
      act(() => new Promise<void>((resolve) => setTimeout(resolve, 150)));

    it('restores the anchor with an absolute scroll position, whatever the geometry reads report', async () => {
      const listElement = createNearTopList({ unstableRects: true });
      renderOlderPageLoad({ listElement });
      await settle();

      expect(listElement.scrollBy).not.toHaveBeenCalled();
      expect(listElement.scrollTop).toBe(ANCHOR_CONTENT_TOP);
    });

    it('ends the fling on iOS WebKit while restoring, then hands scrolling back', async () => {
      setIosWebKit(true);
      const listElement = createNearTopList();
      renderOlderPageLoad({ listElement });

      // iOS keeps animating a fling over programmatic positions until the overflow is hidden.
      expect(listElement.style.overflowY).toBe('hidden');
      await settle();
      expect(listElement.style.overflowY).toBe('');
      expect(listElement.scrollTop).toBe(ANCHOR_CONTENT_TOP);
    });

    it('leaves the overflow alone outside iOS WebKit', async () => {
      setIosWebKit(false);
      const listElement = createNearTopList();
      renderOlderPageLoad({ listElement });

      expect(listElement.style.overflowY).toBe('');
      await settle();
      expect(listElement.style.overflowY).toBe('');
      expect(listElement.scrollTop).toBe(ANCHOR_CONTENT_TOP);
    });

    it('hands scrolling back when the list unmounts mid-restore', () => {
      setIosWebKit(true);
      const listElement = createNearTopList();
      const { unmount } = renderOlderPageLoad({ listElement });
      expect(listElement.style.overflowY).toBe('hidden');

      unmount();

      expect(listElement.style.overflowY).toBe('');
    });

    it('restores an inline overflow-y set by the app instead of clearing it', async () => {
      setIosWebKit(true);
      const listElement = createNearTopList();
      listElement.style.overflowY = 'scroll';
      renderOlderPageLoad({ listElement });
      expect(listElement.style.overflowY).toBe('hidden');
      await settle();

      expect(listElement.style.overflowY).toBe('scroll');
    });

    it('does not restore an anchor when no page load is reported (previous height-delta behaviour)', async () => {
      const listElement = createNearTopList();
      renderOlderPageLoad({ listElement, reportLoading: false });
      await settle();

      // Without a reported load there is no anchor, so the page height is compensated instead.
      expect(listElement.scrollBy).toHaveBeenCalledWith({ top: 300 });
      expect(listElement.scrollTop).toBe(50);
    });
  });
});
