import React, { act } from 'react';
import { cleanup, render, type RenderResult, screen } from '@testing-library/react';
import { nanoid } from 'nanoid';

import {
  dispatchMessageNewEvent,
  dispatchMessageUpdatedEvent,
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../mock-builders';

import { usePrependedMessagesCount } from '../hooks';
import { VirtualizedMessageList } from '../VirtualizedMessageList';

import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { useComponentContext, WithComponents } from '../../../context';
import { ThreadProvider } from '../../Threads';

import { StateStore } from '@stream-io/state-store';
import { fromPartial } from '@total-typescript/shoehorn';
import type { LocalMessage, Thread, ThreadState } from 'stream-chat';
import type { MessageProps } from '../../Message';
import type { ComponentContextValue } from '../../../context';
import type { VirtualizedMessageListProps } from '../VirtualizedMessageList';
import type { GiphyPreviewMessageProps } from '../GiphyPreviewMessage';

const threadWithParentMessage = () =>
  fromPartial<Thread>({
    id: 'virtualized-list-thread',
    state: new StateStore<ThreadState>(
      fromPartial<ThreadState>({ parentMessage: generateMessage() }),
    ),
  });

// Records the props `VirtualizedMessageList` hands to Virtuoso and routes the imperative handle
// through a spy, so the scroll target is assertable. The overrides keep the real Virtuoso
// renderable under jsdom, which reports every element as 0px.
// `mockViewport` opts a test into rendering items: jsdom lays nothing out, so Virtuoso renders none
// unless `VirtuosoMockContext` gives it item and viewport sizes.
const { mockViewport, scrollToIndexSpy, virtuosoProps } = vi.hoisted(() => ({
  mockViewport: {
    current: null as { itemHeight: number; viewportHeight: number } | null,
  },
  scrollToIndexSpy: vi.fn(),
  virtuosoProps: [] as Record<string, any>[],
}));

vi.mock('react-virtuoso', async (importOriginal) => {
  const { Virtuoso, VirtuosoMockContext } =
    await importOriginal<typeof import('react-virtuoso')>();
  const { forwardRef, useImperativeHandle, useRef } = await import('react');
  return {
    Virtuoso: forwardRef((props: any, ref: any) => {
      virtuosoProps.push(props);
      const innerRef = useRef<any>(null);
      useImperativeHandle(
        ref,
        () => ({
          autoscrollToBottom: (...args: any[]) =>
            innerRef.current?.autoscrollToBottom(...args),
          scrollBy: (...args: any[]) => innerRef.current?.scrollBy(...args),
          scrollIntoView: (...args: any[]) => innerRef.current?.scrollIntoView(...args),
          scrollTo: (...args: any[]) => innerRef.current?.scrollTo(...args),
          scrollToIndex: (...args: any[]) => {
            scrollToIndexSpy(...args);
            return innerRef.current?.scrollToIndex(...args);
          },
        }),
        [],
      );
      const list = (
        <Virtuoso
          ref={innerRef}
          {...props}
          fixedItemHeight={30}
          initialTopMostItemIndex={0}
          overscan={0}
        />
      );
      return mockViewport.current ? (
        <VirtuosoMockContext.Provider value={mockViewport.current}>
          {list}
        </VirtuosoMockContext.Provider>
      ) : (
        list
      );
    }),
  };
});

vi.mock('../../Loading', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../Loading')>()),
  LoadingIndicator: vi.fn(() => <div>LoadingIndicator</div>),
}));

vi.mock('../../ChatView', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../ChatView')>();
  return {
    ...actual,
    useChatViewContext: vi.fn(() => ({
      activeView: 'channels',
      setActiveView: vi.fn(),
    })),
    useThreadsViewContext: vi.fn(() => ({
      activeThread: undefined,
      setActiveThread: vi.fn(),
    })),
  };
});

vi.mock('nanoid', () => ({
  nanoid: vi.fn(),
}));

async function createChannel(empty = false) {
  const user1 = generateUser();
  const user2 = generateUser();
  const mockedChannel = generateChannel({
    members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
    messages: empty
      ? []
      : ' '
          .repeat(20)
          .split(' ')
          .map((_v, i) => generateMessage({ user: i % 3 ? user1 : user2 })),
  });
  const client = await getTestClientWithUser({ id: 'id' });
  useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
  const channel = client.channel('messaging', mockedChannel.channel.id);
  await channel.watch();

  return { channel, client };
}

// Virtuoso relies heavily on document height, which jsdom does not support, so tests stay simple.
describe('VirtualizedMessageList', () => {
  afterEach(cleanup);
  beforeEach(vi.clearAllMocks);

  it('should render the list without any message', async () => {
    const { channel, client } = await createChannel(true);
    vi.mocked(nanoid).mockReturnValue('mockedId');

    let result: RenderResult;
    await act(() => {
      result = render(
        <Chat client={client}>
          <Channel channel={channel}>
            <VirtualizedMessageList />
          </Channel>
        </Chat>,
      );
    });
    expect(result.container).toMatchSnapshot();
  });

  // The `VirtualMessage` override has to beat `MessageUI`, but only for messages rendered by this
  // list. The list applies it by overriding `MessageUI` for its own subtree, so these assert on
  // what `useComponentContext()` resolves to inside vs. outside the list. Virtuoso renders no
  // items under jsdom (it measures document height), so the thread head is the in-subtree probe
  // point: the list renders it, in the same provider subtree as the items, whenever a thread is in
  // context.
  describe('VirtualMessage override', () => {
    const CustomMessageUI = () => <div />;
    const CustomVirtualMessage = () => <div />;

    const ResolvedMessageUIProbe = ({ label }: { label: string }) => {
      const { MessageUI } = useComponentContext();
      return (
        <div
          data-probe={label}
          data-resolved={(MessageUI as { name?: string } | undefined)?.name ?? 'none'}
        />
      );
    };

    const resolvedAt = (container: HTMLElement, label: string) =>
      container.querySelector(`[data-probe="${label}"]`)?.getAttribute('data-resolved') ??
      null;

    const renderWithOverrides = async (
      overrides: Parameters<typeof WithComponents>[0]['overrides'],
    ) => {
      overrides = {
        ...overrides,
        ThreadHead: () => <ResolvedMessageUIProbe label='inside' />,
      };
      const { channel, client } = await createChannel();
      vi.mocked(nanoid).mockReturnValue('mockedId');

      let result: RenderResult;
      await act(() => {
        result = render(
          <Chat client={client}>
            <Channel channel={channel}>
              <WithComponents overrides={overrides}>
                <ResolvedMessageUIProbe label='outside' />
                <ThreadProvider thread={threadWithParentMessage()}>
                  <VirtualizedMessageList />
                </ThreadProvider>
              </WithComponents>
            </Channel>
          </Chat>,
        );
      });

      return result!.container;
    };

    it('takes precedence over MessageUI for messages rendered by the list', async () => {
      const container = await renderWithOverrides({
        MessageUI: CustomMessageUI,
        VirtualMessage: CustomVirtualMessage,
      });

      expect(resolvedAt(container, 'inside')).toBe('CustomVirtualMessage');
    });

    it('does not leak outside the list', async () => {
      const container = await renderWithOverrides({
        MessageUI: CustomMessageUI,
        VirtualMessage: CustomVirtualMessage,
      });

      expect(resolvedAt(container, 'outside')).toBe('CustomMessageUI');
    });

    it('leaves the MessageUI override in place when unset', async () => {
      const container = await renderWithOverrides({ MessageUI: CustomMessageUI });

      expect(resolvedAt(container, 'inside')).toBe('CustomMessageUI');
      expect(resolvedAt(container, 'outside')).toBe('CustomMessageUI');
    });
  });

  it('gives the thread parent message the message props of its replies', async () => {
    const CustomThreadHead = vi.fn<(props: MessageProps) => React.ReactElement>(() => (
      <div />
    ));
    const messageProps = {
      onMentionsClick: vi.fn(),
      onMentionsHover: vi.fn(),
      onUserClick: vi.fn(),
      onUserHover: vi.fn(),
      renderText: vi.fn(),
      showAvatar: false,
      unsafeHTML: true,
    };
    const { channel, client } = await createChannel();

    await act(() => {
      render(
        <Chat client={client}>
          <Channel channel={channel}>
            <WithComponents overrides={{ ThreadHead: CustomThreadHead }}>
              <ThreadProvider thread={threadWithParentMessage()}>
                <VirtualizedMessageList {...messageProps} />
              </ThreadProvider>
            </WithComponents>
          </Channel>
        </Chat>,
      );
    });

    const props = CustomThreadHead.mock.lastCall?.[0];
    expect(props).toEqual(expect.objectContaining(messageProps));
    // Props the list was not given stay unset, so an override's own defaults apply.
    expect(props).not.toHaveProperty('formatDate');
  });

  it('gives the separate giphy preview the list-wide message props', async () => {
    const CustomGiphyPreviewMessage = vi.fn<
      (props: GiphyPreviewMessageProps) => React.ReactElement
    >(() => <div />);
    const messageProps = {
      onMentionsClick: vi.fn(),
      onUserClick: vi.fn(),
      unsafeHTML: true,
    };
    const user = generateUser({ id: 'id' });
    const giphyPreview = generateMessage({
      command: 'giphy',
      id: 'giphy-preview',
      type: 'ephemeral',
      user,
    });
    const mockedChannel = generateChannel({
      members: [generateMember({ user })],
      messages: [giphyPreview],
    });
    const client = await getTestClientWithUser({ id: user.id });
    useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);
    const channel = client.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    await act(() => {
      render(
        <Chat client={client}>
          <Channel channel={channel}>
            <WithComponents
              overrides={{ GiphyPreviewMessage: CustomGiphyPreviewMessage }}
            >
              <VirtualizedMessageList {...messageProps} separateGiphyPreview />
            </WithComponents>
          </Channel>
        </Chat>,
      );
    });

    const props = CustomGiphyPreviewMessage.mock.lastCall?.[0];
    expect(props).toEqual(
      expect.objectContaining({
        ...messageProps,
        message: expect.objectContaining({ id: giphyPreview.id }),
      }),
    );
    // Props the list was not given stay unset, so an override's own defaults apply.
    expect(props).not.toHaveProperty('formatDate');
  });

  it('hands the list-wide message props to the item renderer', async () => {
    const messageProps = {
      onMentionsClick: vi.fn(),
      onMentionsHover: vi.fn(),
      onUserClick: vi.fn(),
      onUserHover: vi.fn(),
      unsafeHTML: true,
    };
    const { channel, client } = await createChannel();
    virtuosoProps.length = 0;

    await act(() => {
      render(
        <Chat client={client}>
          <Channel channel={channel}>
            <VirtualizedMessageList {...messageProps} />
          </Channel>
        </Chat>,
      );
    });

    expect(virtuosoProps[virtuosoProps.length - 1].context).toEqual(
      expect.objectContaining(messageProps),
    );
  });

  // A bare index means align: 'start', which parks the last row's top at the viewport top and
  // clips its bottom whenever that row is taller than the list, visible in a short panel. jsdom has
  // no layout, so these assert the scroll target rather than the clipping.
  describe('scroll anchoring', () => {
    const MESSAGE_COUNT = 20;

    let scrollToBottom: (() => Promise<void>) | undefined;

    // `TypingIndicator` is the simplest overridable seam that receives the list's `scrollToBottom`.
    const TypingIndicatorProbe = (props: { scrollToBottom: () => Promise<void> }) => {
      scrollToBottom = props.scrollToBottom;
      return null;
    };

    const renderList = async ({
      hasMoreHead = false,
      listProps = {},
      overrides = {},
    }: {
      hasMoreHead?: boolean;
      listProps?: Partial<VirtualizedMessageListProps>;
      overrides?: Partial<ComponentContextValue>;
    } = {}) => {
      const user1 = generateUser();
      const user2 = generateUser();
      // The file-wide nanoid mock collapses generated IDs, which would dedupe the messages down
      // to one and let an off-by-one pass.
      const mockedChannel = generateChannel({
        members: [generateMember({ user: user1 }), generateMember({ user: user2 })],
        messages: Array.from({ length: MESSAGE_COUNT }, (_v, i) =>
          generateMessage({ id: `anchor-msg-${i}`, user: i % 2 ? user1 : user2 }),
        ),
      });
      const client = await getTestClientWithUser({ id: 'id' });
      useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
      const channel = client.channel('messaging', mockedChannel.channel.id);
      await channel.watch();
      // With newer pages still to load, scrollToBottom jumps to the latest message set instead of
      // scrolling, so pin it to the branch that targets a Virtuoso index.
      vi.spyOn(channel.messagePaginator, 'hasMoreHead', 'get').mockReturnValue(
        hasMoreHead,
      );

      await act(() => {
        render(
          <Chat client={client}>
            <Channel channel={channel}>
              <WithComponents
                overrides={{ TypingIndicator: TypingIndicatorProbe, ...overrides }}
              >
                <VirtualizedMessageList {...listProps} />
              </WithComponents>
            </Channel>
          </Chat>,
        );
      });
      return virtuosoProps[virtuosoProps.length - 1];
    };

    beforeEach(() => {
      virtuosoProps.length = 0;
      scrollToBottom = undefined;
    });

    it('renders the ScrollToLatestMessageButton override with the list state', async () => {
      const ScrollToLatestMessageButton = vi.fn(() => (
        <div data-testid='custom-scroll-to-latest' />
      ));
      await renderList({ overrides: { ScrollToLatestMessageButton } });

      expect(screen.getByTestId('custom-scroll-to-latest')).toBeInTheDocument();
      expect(ScrollToLatestMessageButton).toHaveBeenCalledWith(
        expect.objectContaining({
          isNotAtLatestMessageSet: false,
          onClick: expect.any(Function),
        }),
        undefined,
      );
    });

    it('anchors the initial scroll to the end of the last item', async () => {
      const props = await renderList();

      expect(props.totalCount).toBe(MESSAGE_COUNT);
      expect(props.initialTopMostItemIndex).toEqual({
        align: 'end',
        index: MESSAGE_COUNT - 1,
      });
    });

    // The thresholds and the true-bottom check are only honest while these callbacks reach the
    // viewport hook, so an integrator override has to compose with them rather than replace them.
    it('still measures the viewport when a scrollerRef is supplied', async () => {
      const scrollerRefFromProps = vi.fn();
      const props = await renderList({
        listProps: { additionalVirtuosoProps: { scrollerRef: scrollerRefFromProps } },
      });

      // Ours is what Virtuoso receives, not the caller's.
      expect(props.scrollerRef).not.toBe(scrollerRefFromProps);

      const scroller = document.createElement('div');
      act(() => {
        props.scrollerRef(scroller);
      });

      // The caller still gets the element...
      expect(scrollerRefFromProps).toHaveBeenCalledWith(scroller);
      // ...and the hook measured it, so the threshold is no longer the unmeasured default.
      const measured = virtuosoProps[virtuosoProps.length - 1];
      expect(measured.atBottomThreshold).not.toBe(100);
      expect(measured.atBottomThreshold).toBe(measured.atTopThreshold);

      // Virtuoso passes null on teardown; the caller has to see that too.
      act(() => {
        props.scrollerRef(null);
      });
      expect(scrollerRefFromProps).toHaveBeenCalledWith(null);
    });

    it('still remeasures when a totalListHeightChanged is supplied', async () => {
      const totalListHeightChangedFromProps = vi.fn();
      const props = await renderList({
        listProps: {
          additionalVirtuosoProps: {
            totalListHeightChanged: totalListHeightChangedFromProps,
          },
        },
      });

      expect(props.totalListHeightChanged).not.toBe(totalListHeightChangedFromProps);

      act(() => {
        props.totalListHeightChanged(1234);
      });

      expect(totalListHeightChangedFromProps).toHaveBeenCalledWith(1234);
    });

    // Virtuoso's window-scroll path never calls the supplied scrollerRef, so unless the hook is fed
    // directly the list is never measured and the true-bottom check always answers "yes".
    describe('window scrolling', () => {
      // Virtuoso's own window-viewport hook needs a ResizeObserver, which jsdom does not
      // provide. mock-builders' ResizeObserverMock has no `unobserve`, which Virtuoso calls.
      const OriginalResizeObserver = globalThis.ResizeObserver;

      beforeEach(() => {
        globalThis.ResizeObserver = class implements ResizeObserver {
          disconnect = vi.fn();
          observe = vi.fn();
          unobserve = vi.fn();
        };
      });

      afterEach(() => {
        globalThis.ResizeObserver = OriginalResizeObserver;
      });

      it.each([
        ['useWindowScroll', { useWindowScroll: true }],
        ['customScrollParent', { customScrollParent: document.createElement('div') }],
      ])('measures the viewport with %s', async (_label, virtuosoProp) => {
        const props = await renderList({
          listProps: { additionalVirtuosoProps: virtuosoProp },
        });

        expect(props.atBottomThreshold).not.toBe(100);
        expect(props.atBottomThreshold).toBe(props.atTopThreshold);
      });
    });

    // Virtuoso cannot measure anything under jsdom, so "scrolled up" is reported through the
    // at-bottom callback VML hands it, the same way Virtuoso reports it in a browser.
    describe('NewMessageNotification', () => {
      const NEW_MESSAGE_NOTIFICATION_TEST_ID = 'message-notification';
      const SCROLL_TO_LATEST_MESSAGE_TEST_ID = 'scroll-to-latest-message-button';

      const scrollUp = () =>
        act(() => {
          virtuosoProps[virtuosoProps.length - 1].atBottomStateChange(false);
        });

      const renderListWithChannel = async () => {
        // The file-wide nanoid mock collapses generated ids, so the ones events rely on are explicit.
        const user = generateUser({ id: 'other-user' });
        const mockedChannel = generateChannel({
          channel: { id: 'notification-channel' },
          members: [generateMember({ user })],
          // Fewer than a page, so the loaded window is the latest one.
          messages: Array.from({ length: 5 }, (_v, i) =>
            generateMessage({ id: `notification-msg-${i}`, user }),
          ),
        });
        const client = await getTestClientWithUser({ id: 'id' });
        useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
        const channel = client.channel('messaging', mockedChannel.channel.id);
        await channel.watch();

        await act(() => {
          render(
            <Chat client={client}>
              <Channel channel={channel}>
                <VirtualizedMessageList />
              </Channel>
            </Chat>,
          );
        });

        return { channel, client, mockedChannel, user };
      };

      it('is not shown for a scrolled-up window older than the latest messages', async () => {
        const { channel } = await renderListWithChannel();

        scrollUp();
        act(() => {
          channel.messagePaginator.state.partialNext({ hasMoreHead: true });
        });

        expect(screen.getByTestId(SCROLL_TO_LATEST_MESSAGE_TEST_ID)).toBeInTheDocument();
        expect(
          screen.queryByTestId(NEW_MESSAGE_NOTIFICATION_TEST_ID),
        ).not.toBeInTheDocument();
      });

      it('is not shown when the window is replaced by the latest messages while scrolled up', async () => {
        const { channel, user } = await renderListWithChannel();

        scrollUp();
        act(() => {
          channel.messagePaginator.setItems({
            isFirstPage: true,
            isLastPage: true,
            valueOrFactory: Array.from({ length: 5 }, (_v, i) =>
              fromPartial<LocalMessage>(generateMessage({ id: `latest-msg-${i}`, user })),
            ),
          });
        });

        expect(
          screen.queryByTestId(NEW_MESSAGE_NOTIFICATION_TEST_ID),
        ).not.toBeInTheDocument();
      });

      it('is shown when a message from another user arrives while scrolled up', async () => {
        const { channel, client, mockedChannel, user } = await renderListWithChannel();

        scrollUp();
        expect(
          screen.queryByTestId(NEW_MESSAGE_NOTIFICATION_TEST_ID),
        ).not.toBeInTheDocument();

        act(() => {
          dispatchMessageNewEvent(
            client,
            generateMessage({ cid: channel.cid, id: 'arrived-msg', user }),
            mockedChannel.channel,
          );
        });

        expect(
          await screen.findByTestId(NEW_MESSAGE_NOTIFICATION_TEST_ID),
        ).toBeInTheDocument();
      });
    });

    it('anchors scrollToBottom to the end of the last item', async () => {
      const props = await renderList();

      await act(async () => {
        await scrollToBottom?.();
      });

      expect(props.totalCount).toBe(MESSAGE_COUNT);
      expect(scrollToIndexSpy).toHaveBeenCalledWith({
        align: 'end',
        index: MESSAGE_COUNT - 1,
      });
    });
  });

  // MessagePaginator leaves a jump's highlight countdown to the list: VML starts it once the focused
  // message was viewed, and stops scrolling back to it then.
  describe('message focus signal', () => {
    const MESSAGE_COUNT = 20;
    const targetId = 'focus-msg-10';
    // The paginator orders messages by creation time, so the target's index is read from the list.
    const recenterCall = () =>
      expect.objectContaining({
        align: 'center',
        index: virtuosoProps[
          virtuosoProps.length - 1
        ].context.processedMessages.findIndex(
          (message: { id: string }) => message.id === targetId,
        ),
      });

    // jsdom has no IntersectionObserver: a fake records what it observes and reports entries.
    const intersectionObservers: {
      callback: IntersectionObserverCallback;
      observed: Element[];
    }[] = [];
    class IntersectionObserverMock {
      entry: { callback: IntersectionObserverCallback; observed: Element[] };
      constructor(callback: IntersectionObserverCallback) {
        this.entry = { callback, observed: [] };
        intersectionObservers.push(this.entry);
      }
      disconnect = () => {
        this.entry.observed = [];
      };
      observe = (element: Element) => {
        this.entry.observed.push(element);
      };
      takeRecords = () => [];
      unobserve = (element: Element) => {
        this.entry.observed = this.entry.observed.filter((e) => e !== element);
      };
    }
    const originalIntersectionObserver = window.IntersectionObserver;

    const reportTargetViewed = () => {
      const target = document.querySelector(`[data-message-id="${targetId}"]`);
      expect(target, 'focused message rendered').not.toBeNull();
      const observer = intersectionObservers.find((o) => o.observed.includes(target!));
      expect(observer, 'focused message observed').toBeDefined();
      act(() => {
        observer!.callback(
          [
            fromPartial<IntersectionObserverEntry>({
              intersectionRatio: 1,
              intersectionRect: fromPartial<DOMRectReadOnly>({ height: 30 }),
              isIntersecting: true,
              target: target!,
            }),
          ],
          fromPartial<IntersectionObserver>({}),
        );
      });
    };

    const renderList = async () => {
      const user = generateUser({ id: 'focus-user' });
      const mockedChannel = generateChannel({
        channel: { id: 'focus-channel' },
        members: [generateMember({ user })],
        // The file-wide nanoid mock collapses generated IDs, so they are explicit.
        messages: Array.from({ length: MESSAGE_COUNT }, (_v, i) =>
          generateMessage({ id: `focus-msg-${i}`, user }),
        ),
      });
      const client = await getTestClientWithUser({ id: 'id' });
      useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
      const channel = client.channel('messaging', mockedChannel.channel.id);
      await channel.watch();
      const scheduleClear = vi.spyOn(
        channel.messagePaginator,
        'scheduleMessageFocusSignalClear',
      );

      await act(() => {
        render(
          <Chat client={client}>
            <Channel channel={channel}>
              <VirtualizedMessageList />
            </Channel>
          </Chat>,
        );
      });

      let token = 0;
      act(() => {
        ({ token } = channel.messagePaginator.emitMessageFocusSignal({
          messageId: targetId,
          reason: 'jump-to-message',
        }));
      });
      await vi.waitFor(() =>
        expect(scrollToIndexSpy).toHaveBeenCalledWith(recenterCall()),
      );

      const receiveMessage = async (id: string) => {
        scrollToIndexSpy.mockClear();
        act(() => {
          dispatchMessageNewEvent(
            client,
            generateMessage({ cid: channel.cid, id, user }),
            mockedChannel.channel,
          );
        });
        await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
      };

      return { channel, receiveMessage, scheduleClear, token };
    };

    beforeEach(() => {
      intersectionObservers.length = 0;
      mockViewport.current = { itemHeight: 30, viewportHeight: 600 };
      window.IntersectionObserver =
        IntersectionObserverMock as unknown as typeof IntersectionObserver;
    });

    afterEach(() => {
      mockViewport.current = null;
      window.IntersectionObserver = originalIntersectionObserver;
    });

    it('re-centers on the focused message while it has not been viewed', async () => {
      const { receiveMessage, scheduleClear } = await renderList();

      expect(scheduleClear).not.toHaveBeenCalled();
      await receiveMessage('arrived-before-viewed');
      expect(scrollToIndexSpy).toHaveBeenCalledWith(recenterCall());
    });

    it('starts the dismissal countdown once the focused message is viewed, and stops re-centering', async () => {
      const { receiveMessage, scheduleClear, token } = await renderList();

      reportTargetViewed();
      expect(scheduleClear).toHaveBeenCalledTimes(1);
      expect(scheduleClear).toHaveBeenCalledWith({ token });

      // The signal still lives during the countdown, but a reader who scrolled away stays there.
      await receiveMessage('arrived-after-viewed');
      expect(scrollToIndexSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ align: 'center' }),
      );
    });

    it('starts the dismissal countdown at once for a message that is not in the list', async () => {
      const { channel, scheduleClear } = await renderList();
      scrollToIndexSpy.mockClear();

      let token = 0;
      act(() => {
        ({ token } = channel.messagePaginator.emitMessageFocusSignal({
          messageId: 'not-in-list',
          reason: 'jump-to-message',
        }));
      });
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
      expect(scheduleClear).toHaveBeenCalledWith({ token });
      expect(scrollToIndexSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ align: 'center' }),
      );
    });
  });

  describe('groupByUser', () => {
    // Three consecutive messages from one user, with explicit IDs because the file-wide nanoid
    // mock collapses generated ones.
    const renderGroupStyles = async (listProps = {}) => {
      const user = generateUser();
      const messages = [0, 1, 2].map((i) =>
        generateMessage({ id: `group-msg-${i}`, user }),
      );
      const mockedChannel = generateChannel({
        members: [generateMember({ user })],
        messages,
      });
      const client = await getTestClientWithUser({ id: 'id' });
      useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]); // eslint-disable-line react-hooks/rules-of-hooks
      const channel = client.channel('messaging', mockedChannel.channel.id);
      await channel.watch();
      virtuosoProps.length = 0;

      await act(() => {
        render(
          <Chat client={client}>
            <Channel channel={channel}>
              <VirtualizedMessageList {...listProps} />
            </Channel>
          </Chat>,
        );
      });
      const readGroupStyles = () => {
        const { messageGroupStyles } = virtuosoProps[virtuosoProps.length - 1].context;
        return messages.map(({ id }) => messageGroupStyles[id]);
      };
      return { client, messages, mockedChannel, readGroupStyles };
    };

    it('does not group messages by user unless set', async () => {
      const { readGroupStyles } = await renderGroupStyles();
      expect(readGroupStyles()).toEqual(['single', 'single', 'single']);
    });

    it('groups consecutive messages from one user when set', async () => {
      const { readGroupStyles } = await renderGroupStyles({ groupByUser: true });
      expect(readGroupStyles()).toEqual(['top', 'middle', 'bottom']);
    });

    // An edited message ends its group, but the number of messages stays the same.
    it('recomputes the group styles when a message is edited', async () => {
      const { client, messages, mockedChannel, readGroupStyles } =
        await renderGroupStyles({
          groupByUser: true,
        });

      act(() => {
        dispatchMessageUpdatedEvent(
          client,
          { ...messages[0], message_text_updated_at: messages[0].created_at },
          mockedChannel.channel,
        );
      });

      expect(readGroupStyles()).toEqual(['single', 'top', 'bottom']);
    });
  });
});

describe('usePrependedMessagesCount', () => {
  const TestCase = ({ messages }) => {
    const prependCount = usePrependedMessagesCount(messages, false);
    return <div data-prepend-count={prependCount} id='prepend-counter' />;
  };

  const expectPrependCount = (count, container) => {
    expect(container.querySelector('#prepend-counter')).toHaveAttribute(
      'data-prepend-count',
      count.toString(),
    );
  };

  it('determines 0 prepended messages for empty message list', async () => {
    const { container } = await render(<TestCase messages={[]} />);
    expectPrependCount(0, container);
  });

  const messageBatch = (ids, status) => ids.map((id) => ({ id, status }));
  const firstBatch = (status) => messageBatch(['a'], status);
  const secondBatch = (status) => messageBatch(['c', 'b'], status);
  const thirdBatch = (status) => messageBatch(['e', 'd'], status);

  const testPrependCount = async (status, first, second, third) => {
    const firstMessage = firstBatch(status);
    const secondMsgBatch = secondBatch(status);
    const thirdMsgBatch = thirdBatch(status);

    const { container, rerender } = await render(<TestCase messages={[]} />);

    await act(async () => {
      await rerender(<TestCase messages={[...firstMessage]} />);
    });
    expectPrependCount(first, container);

    await act(async () => {
      await rerender(<TestCase messages={[...secondMsgBatch, ...firstMessage]} />);
    });
    expectPrependCount(second, container);

    await act(async () => {
      await rerender(
        <TestCase messages={[...thirdMsgBatch, ...secondMsgBatch, ...firstMessage]} />,
      );
    });
    expectPrependCount(third, container);
  };

  it('calculates the prepended count for messages of status "received"', async () => {
    await testPrependCount('received', 0, 2, 4);
  });

  it('ignores the messages of status "sending" from the prepended messages count', async () => {
    await testPrependCount('sending', 0, 0, 0);
  });

  it('ignores the messages of status "failed" from the prepended messages count', async () => {
    await testPrependCount('failed', 0, 0, 0);
  });

  it('calculates the prepended messages count for the messages of status undefined', async () => {
    await testPrependCount(undefined, 0, 2, 4);
  });
});
