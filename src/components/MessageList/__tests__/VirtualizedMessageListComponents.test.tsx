import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  Footer,
  Header,
  Item,
  messageRenderer,
} from '../VirtualizedMessageListComponents';
import { VirtualizedMessageListEmptyUI } from '../ListStates';
import type { VirtuosoContext } from '../VirtualizedMessageList';
import {
  generateMessage,
  generateUser,
  initClientWithChannels,
  mockComponentContext,
  mockTranslationContextValue,
} from '../../../mock-builders';
import {
  ComponentProvider,
  DialogManagerProvider,
  TranslationProvider,
  useMessageContext,
} from '../../../context';
import type { ComponentContextValue } from '../../../context';
import { Chat } from '../../Chat';
import { EventComponent } from '../../EventComponent';
import type { EventComponentProps } from '../../EventComponent';
import { Channel as ChannelComponent } from '../../Channel';
import { ThreadProvider } from '../../Threads';
import { UnreadMessagesSeparator } from '../UnreadMessagesSeparator';
import type { GroupStyle, RenderedMessage } from '../utils';
import type { Channel, LocalMessage, StreamChat, Thread } from 'stream-chat';
import { convertDateToTimestamp } from '../../../mock-builders';

// `VirtualizedMessageListEmptyUI` reads thread-ness from `useThreadContext()`, so provide a truthy thread to
// exercise the thread branch.
const threadStub = {} as unknown as Thread;

const prependOffset = 0;
let client: StreamChat;
let channel: Channel;

const PREPEND_OFFSET = 10 ** 7;

// Item, Header and VirtualizedMessageListEmptyUI only consume `ComponentContext`, `ThreadContext` and
// `TranslationContext` (through their default sub-components), so this wrapper provides just those
// and renders no DOM chrome. Tests that render a `Message` use `renderWithChannel` instead, which
// supplies the full context stack.
const Wrapper = ({
  children,
  componentContext = {},
  thread,
}: {
  children?: React.ReactNode;
  componentContext?: Partial<ComponentContextValue>;
  thread?: Thread;
}) => (
  <TranslationProvider value={mockTranslationContextValue()}>
    <ThreadProvider thread={thread}>
      <ComponentProvider value={mockComponentContext(componentContext)}>
        <DialogManagerProvider id='vml-components-dialog-manager'>
          {children}
        </DialogManagerProvider>
      </ComponentProvider>
    </ThreadProvider>
  </TranslationProvider>
);

const renderElements = (
  children: React.ReactNode,
  componentContext?: Partial<ComponentContextValue>,
  thread?: Thread,
) =>
  render(
    <Wrapper componentContext={componentContext} thread={thread}>
      {children}
    </Wrapper>,
  );

const renderWithChannel = (
  children: React.ReactNode,
  componentContext?: Partial<ComponentContextValue>,
) =>
  render(
    <Chat client={client}>
      <ChannelComponent channel={channel}>
        <ComponentProvider value={mockComponentContext(componentContext)}>
          <DialogManagerProvider id='vml-components-dialog-manager'>
            {children}
          </DialogManagerProvider>
        </ComponentProvider>
      </ChannelComponent>
    </Chat>,
  );

describe('VirtualizedMessageComponents', () => {
  beforeAll(async () => {
    const result = await initClientWithChannels();
    client = result.client;
    channel = result.channels[0];
  });

  describe('Item', function () {
    // A fixed ID: the wrapper carries it as `data-message-id`, which the snapshots record.
    const processedMessages = [generateMessage({ id: 'item-message' })];
    const withVirtualMessageClasses = { virtualMessage: 'XXX' };
    const withMessageGroupStyles = { [processedMessages[0].id]: 'single' };
    const withoutVirtualMessageClasses = undefined;
    const withoutMessageGroupStyles = {};

    it.each([
      ['with', 'without', withVirtualMessageClasses, withoutMessageGroupStyles],
      ['without', 'without', withoutVirtualMessageClasses, withoutMessageGroupStyles],
      ['without', 'with', withoutVirtualMessageClasses, withMessageGroupStyles],
      ['with', 'with', withVirtualMessageClasses, withMessageGroupStyles],
    ])(
      'should render wrapper %s custom classes %s group styles',
      (_, __, customClasses, messageGroupStyles) => {
        const props = {
          'data-index': PREPEND_OFFSET,
          'data-item-index': PREPEND_OFFSET,
          'data-known-size': 0,
          // react-virtuoso 4 passes the row's data; this list renders by `totalCount`, so none.
          item: undefined as never,
        };
        const virtuosoContext = {
          customClasses,
          messageGroupStyles,
          numItemsPrepended: 0,
          processedMessages,
        };

        const { container } = renderElements(
          <Item context={virtuosoContext as unknown as VirtuosoContext} {...props} />,
        );
        expect(container).toMatchSnapshot();
      },
    );
  });

  // The list-state part of the Virtuoso context: a channel's loaded list with older messages above.
  const listContext = (overrides: Partial<VirtuosoContext> = {}) =>
    ({
      head: null,
      loadingEdge: undefined,
      loadingMore: false,
      processedMessages: [],
      ...overrides,
    }) as unknown as VirtuosoContext;

  describe('Header', () => {
    const head = <div>Custom head</div>;
    const CustomLoadingIndicator = () => <div>Custom Loading Indicator</div>;

    it('should render nothing without a Virtuoso context', () => {
      const { container } = renderElements(<Header />);
      expect(container).toBeEmptyDOMElement();
    });

    it('should render nothing while no page loads at the top', () => {
      const { container } = renderElements(<Header context={listContext()} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('should render the LoadingIndicator while an older page loads', () => {
      const { container } = renderElements(
        <Header context={listContext({ loadingEdge: 'top', loadingMore: true })} />,
      );
      expect(
        container.querySelector(
          '.str-chat__virtual-list__loading > .str-chat__loading-indicator',
        ),
      ).toBeInTheDocument();
    });

    it('should render the custom LoadingIndicator while an older page loads', () => {
      const { container } = renderElements(
        <Header context={listContext({ loadingEdge: 'top', loadingMore: true })} />,
        { LoadingIndicator: CustomLoadingIndicator },
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            class="str-chat__virtual-list__loading"
          >
            <div>
              Custom Loading Indicator
            </div>
          </div>
        </div>
      `);
    });

    it.each([
      ['a newer page loads', { loadingEdge: 'bottom' as const, loadingMore: true }],
      ['the list jumps to a message', { loadingEdge: undefined, loadingMore: true }],
    ])('should not render the LoadingIndicator while %s', (_, overrides) => {
      const { container } = renderElements(<Header context={listContext(overrides)} />, {
        LoadingIndicator: CustomLoadingIndicator,
      });
      expect(container).toBeEmptyDOMElement();
    });

    it('should render the head above the LoadingIndicator while an older page loads', () => {
      const { container } = renderElements(
        <Header context={listContext({ head, loadingEdge: 'top', loadingMore: true })} />,
        { LoadingIndicator: CustomLoadingIndicator },
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div>
            Custom head
          </div>
          <div
            class="str-chat__virtual-list__loading"
          >
            <div>
              Custom Loading Indicator
            </div>
          </div>
        </div>
      `);
    });

    it('should render the head while no page loads', () => {
      const { container } = renderElements(<Header context={listContext({ head })} />);
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div>
            Custom head
          </div>
        </div>
      `);
    });

    it('should pass the top edge to ListLoadingNextPageUI', () => {
      const ListEndReachedUI = vi.fn(() => null);
      const ListLoadingNextPageUI = vi.fn(() => null);
      renderElements(
        <Header context={listContext({ loadingEdge: 'top', loadingMore: true })} />,
        { ListEndReachedUI, ListLoadingNextPageUI },
      );
      expect(ListLoadingNextPageUI.mock.lastCall?.[0]).toEqual({
        isLoading: true,
        position: 'top',
      });
      expect(ListEndReachedUI).not.toHaveBeenCalled();
    });

    it('should render no loading wrapper while LoadingIndicator is set to null', () => {
      const { container } = renderElements(
        <Header context={listContext({ loadingEdge: 'top', loadingMore: true })} />,
        // Apps turn the spinners off with `null`, which the key's type does not name.
        { LoadingIndicator: null as unknown as undefined },
      );
      expect(container.querySelector('.str-chat__virtual-list__loading')).toBeNull();
    });

    it('should render ListLoadingNextPageUI over the LoadingIndicator while an older page loads', () => {
      const ListLoadingNextPageUI = () => <div>Loading older</div>;
      const { container } = renderElements(
        <Header context={listContext({ loadingEdge: 'top', loadingMore: true })} />,
        { ListLoadingNextPageUI, LoadingIndicator: CustomLoadingIndicator },
      );
      const wrapper = container.querySelector('.str-chat__virtual-list__loading');
      expect(wrapper).toHaveTextContent('Loading older');
      expect(wrapper).not.toHaveTextContent('Custom Loading Indicator');
    });

    it('should render ListLoadingNextPageUI in its wrapper while the LoadingIndicator is null', () => {
      const ListLoadingNextPageUI = () => <div>Loading older</div>;
      const { container } = renderElements(
        <Header context={listContext({ loadingEdge: 'top', loadingMore: true })} />,
        {
          ListLoadingNextPageUI,
          LoadingIndicator: null as unknown as undefined,
        },
      );
      expect(
        container.querySelector('.str-chat__virtual-list__loading'),
      ).toHaveTextContent('Loading older');
    });

    it('should render the head alone when ListLoadingNextPageUI renders nothing', () => {
      const { container } = renderElements(
        <Header context={listContext({ head, loadingEdge: 'top', loadingMore: true })} />,
        { ListLoadingNextPageUI: () => null },
      );
      expect(container).toHaveTextContent('Custom head');
      expect(container.querySelector('.str-chat__loading-indicator')).toBeNull();
    });
  });

  describe('Footer', () => {
    it.each([
      ['without a Virtuoso context', undefined],
      ['while no page loads', listContext()],
      [
        'while an older page loads',
        listContext({ loadingEdge: 'top', loadingMore: true }),
      ],
    ])('should render nothing %s', (_, context) => {
      const { container } = renderElements(<Footer context={context} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('should render ListLoadingNextPageUI at the bottom while a newer page loads', () => {
      const ListLoadingNextPageUI = vi.fn(() => <div>Loading newer</div>);
      const { container } = renderElements(
        <Footer
          context={listContext({
            loadingEdge: 'bottom',
            loadingMore: true,
          })}
        />,
        { ListLoadingNextPageUI },
      );
      expect(
        container.querySelector('.str-chat__virtual-list__loading'),
      ).toHaveTextContent('Loading newer');
      expect(ListLoadingNextPageUI.mock.lastCall?.[0]).toEqual({
        isLoading: true,
        position: 'bottom',
      });
    });

    it('should render ListLoadingNextPageUI over the LoadingIndicator while a newer page loads', () => {
      const ListLoadingNextPageUI = () => <div>Loading newer</div>;
      const { container } = renderElements(
        <Footer context={listContext({ loadingEdge: 'bottom', loadingMore: true })} />,
        {
          ListLoadingNextPageUI,
          LoadingIndicator: () => <div>Custom Loading Indicator</div>,
        },
      );
      const wrapper = container.querySelector('.str-chat__virtual-list__loading');
      expect(wrapper).toHaveTextContent('Loading newer');
      expect(wrapper).not.toHaveTextContent('Custom Loading Indicator');
    });

    it('should render no loading wrapper at the bottom for a null LoadingIndicator', () => {
      const { container } = renderElements(
        <Footer context={listContext({ loadingEdge: 'bottom', loadingMore: true })} />,
        { LoadingIndicator: null as unknown as undefined },
      );
      expect(container).toBeEmptyDOMElement();
    });

    it('should render the default LoadingIndicator while a newer page loads', () => {
      const { container } = renderElements(
        <Footer context={listContext({ loadingEdge: 'bottom', loadingMore: true })} />,
      );
      expect(container.querySelector('.str-chat__loading-indicator')).toBeInTheDocument();
    });
  });

  describe('VirtualizedMessageListEmptyUI', () => {
    const EmptyStateIndicator = ({ listType }: { listType?: string }) => (
      <div data-listtype={listType}>Custom EmptyStateIndicator</div>
    );
    const emptyContext = listContext();

    it('should render nothing without a Virtuoso context', () => {
      const { container } = renderElements(<VirtualizedMessageListEmptyUI />);
      expect(container).toBeEmptyDOMElement();
    });

    it('should render the default empty state for the main message list', () => {
      const { container } = renderElements(
        <VirtualizedMessageListEmptyUI context={emptyContext} />,
      );
      expect(container.querySelector('.str-chat__empty-channel')).toHaveTextContent(
        'Send a message to start the conversation',
      );
    });

    it('should render ListEmptyUI', () => {
      const ListEmptyUI = vi.fn(() => <div>Custom ListEmptyUI</div>);
      renderElements(<VirtualizedMessageListEmptyUI context={emptyContext} />, {
        ListEmptyUI,
      });
      expect(screen.getByText('Custom ListEmptyUI')).toBeInTheDocument();
      expect(ListEmptyUI.mock.lastCall?.[0]).toEqual({});
    });

    it('should render the deprecated EmptyStateIndicator instead of ListEmptyUI while set', () => {
      const ListEmptyUI = vi.fn(() => null);
      renderElements(<VirtualizedMessageListEmptyUI context={emptyContext} />, {
        EmptyStateIndicator,
        ListEmptyUI,
      });
      expect(screen.getByText('Custom EmptyStateIndicator')).toHaveAttribute(
        'data-listtype',
        'message',
      );
      expect(ListEmptyUI).not.toHaveBeenCalled();
    });

    it('should render nothing while messages are loaded', () => {
      const ListEmptyUI = vi.fn(() => null);
      const { container } = renderElements(
        <VirtualizedMessageListEmptyUI
          context={listContext({
            processedMessages: [generateMessage()],
          } as Partial<VirtuosoContext>)}
        />,
        { EmptyStateIndicator, ListEmptyUI },
      );
      expect(container).toBeEmptyDOMElement();
      expect(ListEmptyUI).not.toHaveBeenCalled();
    });

    it('should render the empty state while a page loads into the empty list', () => {
      const ListEmptyUI = vi.fn(() => <div data-testid='empty-list' />);
      renderElements(
        <VirtualizedMessageListEmptyUI context={listContext({ loadingMore: true })} />,
        {
          ListEmptyUI,
        },
      );
      expect(screen.getByTestId('empty-list')).toBeInTheDocument();
    });

    it('should render nothing for a thread by default', () => {
      const ListEmptyUI = vi.fn(() => null);
      const { container } = renderElements(
        <VirtualizedMessageListEmptyUI context={listContext()} />,
        { ListEmptyUI },
        threadStub,
      );
      expect(container).toBeEmptyDOMElement();
      expect(ListEmptyUI).not.toHaveBeenCalled();
    });

    it('should render the deprecated EmptyStateIndicator with listType thread in a thread', () => {
      renderElements(
        <VirtualizedMessageListEmptyUI context={listContext()} />,
        { EmptyStateIndicator },
        threadStub,
      );
      expect(screen.getByText('Custom EmptyStateIndicator')).toHaveAttribute(
        'data-listtype',
        'thread',
      );
    });

    it('should render nothing in a thread if EmptyStateIndicator nullified', () => {
      const { container } = renderElements(
        <VirtualizedMessageListEmptyUI context={listContext()} />,
        { EmptyStateIndicator: null },
        threadStub,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('messageRenderer', () => {
    const virtuosoIndex = PREPEND_OFFSET;
    const numItemsPrepended = 0;

    it('should allow to execute custom item rendering logic instead of the default', () => {
      const customMessageRenderer = vi.fn();
      const virtuosoContext = {
        customMessageRenderer,
        numItemsPrepended,
        processedMessages: [generateMessage()],
      };
      messageRenderer(
        virtuosoIndex,
        undefined,
        virtuosoContext as unknown as VirtuosoContext,
      );
      expect(customMessageRenderer).toHaveBeenCalledWith(
        expect.arrayContaining(virtuosoContext.processedMessages),
        0,
      );
    });

    describe('default item rendering logic', () => {
      it('should forward message group styles', () => {
        const virtuosoRef = { current: {} };
        let groupStylesMessageContext: GroupStyle[];
        const GroupStylesProbe = () => {
          const { groupStyles } = useMessageContext();
          groupStylesMessageContext = groupStyles;
          return null;
        };
        const processedMessages = [generateMessage()];
        const messageGroupStyles = { [processedMessages[0].id]: 'xy' };
        renderWithChannel(
          <>
            {processedMessages.map((_, numItemsPrepended) => {
              const virtuosoContext = {
                messageGroupStyles,
                numItemsPrepended,
                ownMessagesDeliveredToOthers: {},
                ownMessagesReadByOthers: {},
                prependOffset,
                processedMessages,
                virtuosoRef,
              };
              return (
                <div key={numItemsPrepended}>
                  {messageRenderer(
                    virtuosoIndex,
                    undefined,
                    virtuosoContext as unknown as VirtuosoContext,
                  )}
                </div>
              );
            })}
          </>,
          { MessageUI: GroupStylesProbe },
        );
        expect(groupStylesMessageContext).toStrictEqual([
          messageGroupStyles[processedMessages[0].id],
        ]);
      });

      describe('list-wide message props', () => {
        const author = generateUser({ name: 'author' });
        const mentionedUser = generateUser({ name: 'mentioned' });

        // Renders one message with the default message UI, so the props reach real DOM handlers.
        const renderMessage = async (
          message: LocalMessage,
          messageProps: Partial<VirtuosoContext>,
        ) => {
          const virtuosoContext = {
            ...messageProps,
            channel,
            messageGroupStyles: {},
            numItemsPrepended,
            ownMessagesDeliveredToOthers: {},
            ownMessagesReadByOthers: {},
            processedMessages: [message],
            virtuosoRef: { current: {} },
          } as unknown as VirtuosoContext;
          let result: ReturnType<typeof render>;
          // eslint-disable-next-line require-await
          await act(async () => {
            result = renderWithChannel(
              messageRenderer(virtuosoIndex, undefined, virtuosoContext),
            );
          });
          return result!;
        };

        const mentionMessage = () =>
          generateMessage({
            mentioned_users: [mentionedUser],
            text: `@${mentionedUser.name} hello`,
            user: author,
          });

        it('should call onMentionsClick and onMentionsHover with the message', async () => {
          const onMentionsClick = vi.fn();
          const onMentionsHover = vi.fn();
          const message = mentionMessage();
          await renderMessage(message, { onMentionsClick, onMentionsHover });

          const text = screen.getByTestId('message-text-inner-wrapper');
          fireEvent.click(text);
          fireEvent.mouseOver(text);

          expect(onMentionsClick).toHaveBeenCalledTimes(1);
          expect(onMentionsClick).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ id: message.id }),
          );
          expect(onMentionsHover).toHaveBeenCalledTimes(1);
          expect(onMentionsHover).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ id: message.id }),
          );
        });

        it('should call onUserClick and onUserHover with the message author', async () => {
          const onUserClick = vi.fn();
          const onUserHover = vi.fn();
          await renderMessage(generateMessage({ user: author }), {
            onUserClick,
            onUserHover,
          });

          const avatar = screen.getByTitle(author.name as string);
          fireEvent.click(avatar);
          fireEvent.mouseOver(avatar);

          expect(onUserClick).toHaveBeenCalledTimes(1);
          expect(onUserClick).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ id: author.id }),
          );
          expect(onUserHover).toHaveBeenCalledTimes(1);
          expect(onUserHover).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ id: author.id }),
          );
        });

        it('should render the message HTML when unsafeHTML is set', async () => {
          await renderMessage(
            generateMessage({
              html: '<span data-testid="custom-html" />',
              user: author,
            }),
            { unsafeHTML: true },
          );

          expect(screen.getByTestId('custom-html')).toBeInTheDocument();
        });

        it('should render the message text instead of its HTML without unsafeHTML', async () => {
          await renderMessage(
            generateMessage({
              html: '<span data-testid="custom-html" />',
              text: 'plain text',
              user: author,
            }),
            {},
          );

          expect(screen.queryByTestId('custom-html')).not.toBeInTheDocument();
          expect(screen.getByText('plain text')).toBeInTheDocument();
        });
      });

      it('should render nothing if MessageSystem component is undefined for system messages', () => {
        const virtuosoContext = {
          numItemsPrepended,
          processedMessages: [generateMessage({ type: 'system' })],
        };

        const { container } = render(
          messageRenderer(
            virtuosoIndex,
            undefined,
            virtuosoContext as unknown as VirtuosoContext,
          ),
        );
        expect(container).toMatchInlineSnapshot(`<div />`);
      });

      it('should render MessageSystem component for system messages', () => {
        const text = 'MessageSystem';
        const MessageSystem = () => <>{text}</>;
        const virtuosoContext = {
          MessageSystem,
          numItemsPrepended,
          processedMessages: [generateMessage({ type: 'system' })],
        };

        render(
          messageRenderer(
            virtuosoIndex,
            undefined,
            virtuosoContext as unknown as VirtuosoContext,
          ),
        );
        expect(screen.getByText(text)).toBeInTheDocument();
      });

      describe('system message HTML', () => {
        // Renders a system message that has both HTML and text with the default MessageSystem.
        const renderSystemMessage = (unsafeHTML?: boolean) => {
          const virtuosoContext = {
            MessageSystem: EventComponent,
            numItemsPrepended,
            processedMessages: [
              generateMessage({
                html: '<span data-testid="custom-html" />',
                text: 'system text',
                type: 'system',
              }),
            ],
            unsafeHTML,
          };
          render(
            messageRenderer(
              virtuosoIndex,
              undefined,
              virtuosoContext as unknown as VirtuosoContext,
            ),
          );
        };

        it("should render a system message's HTML when unsafeHTML is set", () => {
          renderSystemMessage(true);

          expect(screen.getByTestId('custom-html')).toBeInTheDocument();
          expect(screen.queryByText('system text')).not.toBeInTheDocument();
        });

        describe('with a MessageSystem override that sets its own unsafeHTML', () => {
          const MessageSystem = (props: EventComponentProps) => (
            <EventComponent unsafeHTML {...props} />
          );
          const renderWithOverride = (unsafeHTML?: boolean) => {
            const virtuosoContext = {
              MessageSystem,
              numItemsPrepended,
              processedMessages: [
                generateMessage({
                  html: '<span data-testid="custom-html" />',
                  text: 'system text',
                  type: 'system',
                }),
              ],
              unsafeHTML,
            };
            render(
              messageRenderer(
                virtuosoIndex,
                undefined,
                virtuosoContext as unknown as VirtuosoContext,
              ),
            );
          };

          it("should keep the override's value when the list doesn't set unsafeHTML", () => {
            renderWithOverride();

            expect(screen.getByTestId('custom-html')).toBeInTheDocument();
          });

          it('should pass unsafeHTML false from the list over the override', () => {
            renderWithOverride(false);

            expect(screen.getByText('system text')).toBeInTheDocument();
            expect(screen.queryByTestId('custom-html')).not.toBeInTheDocument();
          });
        });

        it.each([false, undefined])(
          "should render a system message's text when unsafeHTML is %s",
          (unsafeHTML) => {
            renderSystemMessage(unsafeHTML);

            expect(screen.getByText('system text')).toBeInTheDocument();
            expect(screen.queryByTestId('custom-html')).not.toBeInTheDocument();
          },
        );
      });

      it('should render nothing if DateSeparator component is undefined for custom message type date', () => {
        const virtuosoContext = {
          numItemsPrepended,
          processedMessages: [
            fromPartial<RenderedMessage>({
              customType: 'message.date',
              date: new Date(),
            }),
          ],
        };
        const { container } = render(
          messageRenderer(
            virtuosoIndex,
            undefined,
            virtuosoContext as unknown as VirtuosoContext,
          ),
        );
        expect(container).toMatchInlineSnapshot(`<div />`);
      });

      it('should render DateSeparator component for custom message type date', () => {
        const text = 'DateSeparator';
        const DateSeparator = () => <div>{text}</div>;
        const virtuosoContext = {
          DateSeparator,
          numItemsPrepended,
          processedMessages: [
            fromPartial<RenderedMessage>({
              customType: 'message.date',
              date: new Date(),
            }),
          ],
        };
        render(
          messageRenderer(
            virtuosoIndex,
            undefined,
            virtuosoContext as unknown as VirtuosoContext,
          ),
        );
        expect(screen.getByText(text)).toBeInTheDocument();
      });

      it('should render empty div when trying to render message at non-existent index', () => {
        const virtuosoIndex = PREPEND_OFFSET - 1;
        const virtuosoContext = {
          numItemsPrepended,
          processedMessages: [generateMessage()],
        };

        const { container } = render(
          messageRenderer(
            virtuosoIndex,
            undefined,
            virtuosoContext as unknown as VirtuosoContext,
          ),
        );
        expect(container).toMatchInlineSnapshot(`
                  <div>
                    <div
                      style="height: 1px;"
                    />
                  </div>
              `);
      });

      describe('UnreadMessagesSeparator', () => {
        const messages = Array.from({ length: 2 }, (_, i) =>
          generateMessage({
            created_at: convertDateToTimestamp(new Date(i + 2).toISOString()),
            id: String(i + 1),
          }),
        );

        const MessageUI = () => <div className='message-component' />;

        const renderMarkUnread = async ({
          virtuosoContext,
          virtuosoIndex,
        }: {
          virtuosoContext?: Partial<VirtuosoContext>;
          virtuosoIndex?: number;
        } = {}) => {
          const {
            channels: [markUnreadChannel],
            client: markUnreadClient,
          } = await initClientWithChannels();
          // `getIsFirstUnreadMessage` returns false without a channel on the context, so add one.
          const ctx = {
            ...virtuosoContext,
            channel: markUnreadChannel,
          } as unknown as VirtuosoContext;
          let result: ReturnType<typeof render>;
          // eslint-disable-next-line require-await
          await act(async () => {
            result = render(
              <Chat client={markUnreadClient}>
                <ChannelComponent channel={markUnreadChannel}>
                  <ComponentProvider value={mockComponentContext({ MessageUI })}>
                    {messageRenderer(virtuosoIndex ?? PREPEND_OFFSET, undefined, ctx)}
                  </ComponentProvider>
                </ChannelComponent>
              </Chat>,
            );
          });
          return result!;
        };

        it('should be rendered above the first unread message if unread count is non-zero', async () => {
          const { container } = await renderMarkUnread({
            virtuosoContext: {
              lastReadDate: messages[0].created_at,
              lastReadMessageId: messages[0].id,
              lastReceivedMessageId: messages[1].id,
              messageGroupStyles: {},
              numItemsPrepended: 1,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 1,
              UnreadMessagesSeparator,
              virtuosoRef: fromPartial<VirtuosoContext['virtuosoRef']>({ current: {} }),
            },
          });
          expect(
            container.querySelector('.str-chat__unread-messages-separator-wrapper'),
          ).toBeInTheDocument();
          expect(
            container.querySelector('[data-testid="unread-messages-separator"]'),
          ).toBeInTheDocument();
          expect(container.querySelector('.message-component')).toBeInTheDocument();
        });

        it('should not be rendered below the last read message if the message is the newest in the channel', async () => {
          const { container } = await renderMarkUnread({
            virtuosoContext: {
              lastReadDate: messages[1].created_at,
              lastReadMessageId: messages[1].id,
              lastReceivedMessageId: messages[1].id,
              messageGroupStyles: {},
              numItemsPrepended: 1,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 1,
              UnreadMessagesSeparator,
              virtuosoRef: fromPartial<VirtuosoContext['virtuosoRef']>({ current: {} }),
            },
          });
          expect(
            container.querySelector('.str-chat__unread-messages-separator-wrapper'),
          ).not.toBeInTheDocument();
          expect(container.querySelector('.message-component')).toBeInTheDocument();
        });

        // `getIsFirstUnreadMessage` returns false on a falsy `unreadCount` before considering
        // `firstUnreadMessageId`: the unread separator is snapshot-driven.
        it('should not be rendered if unread count is falsy even when the first unread message is known', async () => {
          const { container } = await renderMarkUnread({
            virtuosoContext: {
              firstUnreadMessageId: messages[1].id,
              lastReadMessageId: messages[0].id,
              lastReceivedMessageId: messages[1].id,
              messageGroupStyles: {},
              numItemsPrepended: 1,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 0,
              UnreadMessagesSeparator,
              virtuosoRef: fromPartial<VirtuosoContext['virtuosoRef']>({ current: {} }),
            },
          });
          expect(
            container.querySelector('.str-chat__unread-messages-separator-wrapper'),
          ).not.toBeInTheDocument();
          expect(container.querySelector('.message-component')).toBeInTheDocument();
        });

        it('should not be rendered if unread count is falsy and first unread messages is unknown', async () => {
          const { container } = await renderMarkUnread({
            virtuosoContext: {
              lastReadMessageId: messages[0].id,
              lastReceivedMessageId: messages[1].id,
              messageGroupStyles: {},
              numItemsPrepended: 1,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 0,
              UnreadMessagesSeparator,
              virtuosoRef: fromPartial<VirtuosoContext['virtuosoRef']>({ current: {} }),
            },
          });
          expect(
            container.querySelector('.str-chat__unread-messages-separator-wrapper'),
          ).not.toBeInTheDocument();
          expect(container.querySelector('.message-component')).toBeInTheDocument();
        });

        it('should not be rendered if rendering other message than the last read one', async () => {
          const { container } = await renderMarkUnread({
            virtuosoContext: {
              lastReadMessageId: messages[0].id,
              lastReceivedMessageId: messages[1].id,
              messageGroupStyles: {},
              numItemsPrepended: 0,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 1,
              UnreadMessagesSeparator,
              virtuosoRef: fromPartial<VirtuosoContext['virtuosoRef']>({ current: {} }),
            },
          });
          expect(
            container.querySelector('.str-chat__unread-messages-separator-wrapper'),
          ).not.toBeInTheDocument();
          expect(container.querySelector('.message-component')).toBeInTheDocument();
        });
      });
    });
  });
});
