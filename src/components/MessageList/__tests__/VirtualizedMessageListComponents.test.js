import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import {
  EmptyPlaceholder,
  Header,
  Item,
  messageRenderer,
} from '../VirtualizedMessageListComponents';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
  initClientWithChannels,
} from '../../../mock-builders';
import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
  DialogManagerProvider,
  TranslationProvider,
  useMessageContext,
} from '../../../context';
import { ChatViewContext } from '../../ChatView/ChatView';
import { MessageUI } from '../../Message';
import { UnreadMessagesSeparator } from '../UnreadMessagesSeparator';

const prependOffset = 0;
const user1 = generateUser();
const user2 = generateUser();
let client;
let channel;

const PREPEND_OFFSET = 10 ** 7;

const chatViewContextValue = { activeChatView: 'channels', setActiveChatView: () => {} };

const Wrapper = ({ children, componentContext = {} }) => (
  <ChatViewContext.Provider value={chatViewContextValue}>
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel }}>
        <ChannelActionProvider value={{}}>
          <ComponentProvider value={componentContext}>
            <DialogManagerProvider id='vml-components-dialog-manager'>
              {children}
            </DialogManagerProvider>
          </ComponentProvider>
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>
  </ChatViewContext.Provider>
);

const renderElements = (children, componentContext) =>
  render(<Wrapper componentContext={componentContext}>{children}</Wrapper>);

describe('VirtualizedMessageComponents', () => {
  describe('Item', function () {
    const processedMessages = [generateMessage()];
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
          'data-item-index': PREPEND_OFFSET,
        };
        const virtuosoContext = {
          customClasses,
          messageGroupStyles,
          numItemsPrepended: 0,
          processedMessages,
        };

        const { container } = renderElements(
          <Item context={virtuosoContext} {...props} />,
        );
        expect(container).toMatchSnapshot();
      },
    );
  });

  describe('Header', () => {
    const head = <div>Custom head</div>;
    const CustomLoadingIndicator = () => <div>Custom Loading Indicator</div>;
    it('should render empty div in Header when not loading more messages', () => {
      const { container } = renderElements(<Header />);
      expect(container).toBeEmptyDOMElement();
    });

    it('should render LoadingIndicator in Header when loading more messages', () => {
      const context = { loadingMore: true };
      const { container } = renderElements(<Header context={context} />);
      expect(container).toMatchSnapshot();
    });

    it('should render custom LoadingIndicator in Header when loading more messages', () => {
      const componentContext = { LoadingIndicator: CustomLoadingIndicator };
      const context = { loadingMore: true };
      const { container } = renderElements(
        <Header context={context} />,
        componentContext,
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

    it('should not render custom LoadingIndicator in Header when not loading more messages', () => {
      const componentContext = { LoadingIndicator: CustomLoadingIndicator };
      const { container } = renderElements(<Header />, componentContext);
      expect(container).toBeEmptyDOMElement();
    });

    // FIXME: this is a crazy pattern of having to set LoadingIndicator to null so that additionalVirtuosoProps.head can be rendered.
    it('should not render custom head in Header when loading more messages, but the LoadingIndicator', () => {
      const context = { head, loadingMore: true };
      const { container } = renderElements(<Header context={context} />);
      expect(container).toMatchSnapshot();
    });

    // FIXME: this is a crazy pattern of having to set LoadingIndicator to null so that additionalVirtuosoProps.head can be rendered.
    it('should render custom head in Header when LoadingIndicator in component context is set to null', () => {
      const componentContext = {
        LoadingIndicator: null,
      };
      const context = { head, loadingMore: true };
      const { container } = renderElements(
        <Header context={context} />,
        componentContext,
      );
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div>
            Custom head
          </div>
        </div>
      `);
    });

    it('should not render custom head in Header when not loading more messages', () => {
      const context = { head };
      const { container } = renderElements(<Header context={context} />);
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div>
            Custom head
          </div>
        </div>
      `);
    });

    it('should render custom LoadingIndicator instead of head when loading more', () => {
      const componentContext = { LoadingIndicator: CustomLoadingIndicator };
      const context = { head, loadingMore: true };
      const { container } = renderElements(
        <Header context={context} />,
        componentContext,
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
  });

  describe('EmptyPlaceholder', () => {
    const EmptyStateIndicator = ({ listType }) => (
      <div data-listtype={listType}>Custom EmptyStateIndicator</div>
    );
    const NullEmptyStateIndicator = null;
    const componentContext = { EmptyStateIndicator };
    it('should render for main message list by default', () => {
      const { container } = renderElements(<EmptyPlaceholder />);
      expect(container).toMatchSnapshot();
    });

    it('should render empty for thread by default', () => {
      const { container } = renderElements(
        <EmptyPlaceholder context={{ threadList: true }} />,
      );
      expect(container).toBeEmptyDOMElement();
    });
    it('should render custom EmptyStateIndicator for main message list', () => {
      const { container } = renderElements(<EmptyPlaceholder />, componentContext);
      expect(container).toMatchSnapshot();
    });

    it('should render custom EmptyStateIndicator for thread', () => {
      const { container } = renderElements(
        <EmptyPlaceholder context={{ threadList: true }} />,
        componentContext,
      );
      expect(container).toMatchSnapshot();
    });

    it('should render empty if EmptyStateIndicator nullified', () => {
      const componentContext = { EmptyStateIndicator: NullEmptyStateIndicator };
      const { container } = renderElements(<EmptyPlaceholder />, componentContext);
      expect(container).toBeEmptyDOMElement();
    });

    it('should render empty in thread if EmptyStateIndicator nullified', () => {
      const componentContext = { EmptyStateIndicator: NullEmptyStateIndicator };
      const { container } = renderElements(
        <EmptyPlaceholder context={{ threadList: true }} />,
        componentContext,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('messageRenderer', () => {
    const virtuosoIndex = PREPEND_OFFSET;
    const numItemsPrepended = 0;
    beforeAll(async () => {
      client = await getTestClientWithUser();
      const channelData = generateChannel();
      channel = client.channel(
        channelData.channel.type,
        channelData.channel.id,
        channelData,
      );
    });

    it('should allow to execute custom item rendering logic instead of the default', () => {
      const customMessageRenderer = jest.fn();
      const virtuosoContext = {
        customMessageRenderer,
        numItemsPrepended,
        processedMessages: [generateMessage()],
      };
      messageRenderer(virtuosoIndex, undefined, virtuosoContext);
      expect(customMessageRenderer).toHaveBeenCalledWith(
        expect.arrayContaining(virtuosoContext.processedMessages),
        0,
      );
    });

    describe('default item rendering logic', () => {
      it('should forward message group styles', () => {
        const virtuosoRef = { current: {} };
        let groupStylesMessageContext;
        const Message = () => {
          const { groupStyles } = useMessageContext();
          groupStylesMessageContext = groupStyles;
          return null;
        };
        const processedMessages = [generateMessage()];
        const messageGroupStyles = { [processedMessages[0].id]: 'xy' };
        renderElements(
          <>
            {processedMessages.map((_, numItemsPrepended) => {
              const virtuosoContext = {
                Message,
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
                  {messageRenderer(virtuosoIndex, undefined, virtuosoContext)}
                </div>
              );
            })}
          </>,
        );
        expect(groupStylesMessageContext).toStrictEqual([
          messageGroupStyles[processedMessages[0].id],
        ]);
      });
      it('should render nothing if MessageSystem component is undefined for system messages', () => {
        const virtuosoContext = {
          numItemsPrepended,
          processedMessages: [generateMessage({ type: 'system' })],
        };

        const { container } = render(
          messageRenderer(virtuosoIndex, undefined, virtuosoContext),
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

        render(messageRenderer(virtuosoIndex, undefined, virtuosoContext));
        expect(screen.getByText(text)).toBeInTheDocument();
      });

      it('should render nothing if DateSeparator component is undefined for custom message type date', () => {
        const virtuosoContext = {
          numItemsPrepended,
          processedMessages: [
            generateMessage({ customType: 'message.date', date: new Date() }),
          ],
        };
        const { container } = render(
          messageRenderer(virtuosoIndex, undefined, virtuosoContext),
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
            generateMessage({ customType: 'message.date', date: new Date() }),
          ],
        };
        render(messageRenderer(virtuosoIndex, undefined, virtuosoContext));
        expect(screen.getByText(text)).toBeInTheDocument();
      });

      it('should render empty div when trying to render message at non-existent index', () => {
        const virtuosoIndex = PREPEND_OFFSET - 1;
        const virtuosoContext = {
          numItemsPrepended,
          processedMessages: [generateMessage()],
        };

        const { container } = render(
          messageRenderer(virtuosoIndex, undefined, virtuosoContext),
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
          generateMessage({ created_at: new Date(i + 2).toISOString(), id: i + 1 }),
        );

        const Message = () => <div className='message-component' />;

        const renderMarkUnread = async ({ virtuosoContext, virtuosoIndex } = {}) => {
          const {
            channels: [channel],
            client,
          } = await initClientWithChannels();
          return render(
            <ChatViewContext.Provider value={chatViewContextValue}>
              <ChatProvider value={{ client }}>
                <TranslationProvider value={{ t: (v) => v }}>
                  <ComponentProvider value={{}}>
                    <ChannelActionProvider value={{}}>
                      <ChannelStateProvider value={{ channel }}>
                        {messageRenderer(
                          virtuosoIndex ?? PREPEND_OFFSET,
                          undefined,
                          virtuosoContext,
                        )}
                      </ChannelStateProvider>
                    </ChannelActionProvider>
                  </ComponentProvider>
                </TranslationProvider>
              </ChatProvider>
            </ChatViewContext.Provider>,
          );
        };

        it('should be rendered above the first unread message if unread count is non-zero', async () => {
          const { container } = await renderMarkUnread({
            virtuosoContext: {
              lastReadDate: new Date(messages[0].created_at),
              lastReadMessageId: messages[0].id,
              lastReceivedMessageId: messages[1].id,
              Message,
              messageGroupStyles: {},
              numItemsPrepended: 1,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 1,
              UnreadMessagesSeparator,
              virtuosoRef: { current: {} },
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
              lastReadDate: new Date(messages[1].created_at),
              lastReadMessageId: messages[1].id,
              lastReceivedMessageId: messages[1].id,
              Message,
              messageGroupStyles: {},
              numItemsPrepended: 1,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 1,
              UnreadMessagesSeparator,
              virtuosoRef: { current: {} },
            },
          });
          expect(container).toMatchInlineSnapshot(`
            <div>
              <div
                class="message-component"
              />
            </div>
          `);
        });

        it('should be rendered if unread count is falsy and the first unread message is known', async () => {
          const { container } = await renderMarkUnread({
            virtuosoContext: {
              firstUnreadMessageId: messages[1].id,
              lastReadMessageId: messages[0].id,
              lastReceivedMessageId: messages[1].id,
              Message,
              messageGroupStyles: {},
              numItemsPrepended: 1,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 0,
              UnreadMessagesSeparator,
              virtuosoRef: { current: {} },
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

        it('should not be rendered if unread count is falsy and first unread messages is unknown', async () => {
          const { container } = await renderMarkUnread({
            virtuosoContext: {
              lastReadMessageId: messages[0].id,
              lastReceivedMessageId: messages[1].id,
              Message,
              messageGroupStyles: {},
              numItemsPrepended: 1,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 0,
              UnreadMessagesSeparator,
              virtuosoRef: { current: {} },
            },
          });
          expect(container).toMatchInlineSnapshot(`
            <div>
              <div
                class="message-component"
              />
            </div>
          `);
        });

        it('should not be rendered if rendering other message than the last read one', async () => {
          const { container } = await renderMarkUnread({
            virtuosoContext: {
              lastReadMessageId: messages[0].id,
              lastReceivedMessageId: messages[1].id,
              Message,
              messageGroupStyles: {},
              numItemsPrepended: 0,
              ownMessagesDeliveredToOthers: {},
              ownMessagesReadByOthers: {},
              processedMessages: messages,
              unreadMessageCount: 1,
              UnreadMessagesSeparator,
              virtuosoRef: { current: {} },
            },
          });
          expect(container).toMatchInlineSnapshot(`
            <div>
              <div
                class="message-component"
              />
            </div>
          `);
        });
      });

      // In v14, grouping CSS classes (groupedByUser, firstOfGroup, endOfGroup) are no longer
      // derived inside messageRenderer. The messageGroupStyles map determines groupStyles prop
      // passed to Message, but the --group/--first/--end CSS classes are only applied when
      // the Message component receives groupedByUser/firstOfGroup/endOfGroup props directly.
      it.each([
        ['not ', 'by default', 'not ', false],
        ['not ', '(grouping CSS classes are now set externally)', 'not ', true],
      ])(
        'should %sgroup messages %s and mark the first and the last group message',
        (_, __, ___, shouldGroupByUser) => {
          const virtuosoRef = { current: {} };
          const user1MessageGroup = [
            generateMessage({ user: user1 }),
            generateMessage({ user: user1 }),
            generateMessage({ user: user1 }),
            generateMessage({ user: user1 }),
          ];
          const processedMessages = [
            generateMessage({ user: user2 }),
            ...user1MessageGroup,
            generateMessage({ user: user2 }),
          ];

          // In v14, grouping is pre-computed and passed via messageGroupStyles
          // rather than being computed inside messageRenderer via shouldGroupByUser
          const messageGroupStyles = {};
          if (shouldGroupByUser) {
            // user2 message (single)
            messageGroupStyles[processedMessages[0].id] = 'single';
            // user1 group: top, middle, middle, bottom
            messageGroupStyles[processedMessages[1].id] = 'top';
            messageGroupStyles[processedMessages[2].id] = 'middle';
            messageGroupStyles[processedMessages[3].id] = 'middle';
            messageGroupStyles[processedMessages[4].id] = 'bottom';
            // user2 message (single)
            messageGroupStyles[processedMessages[5].id] = 'single';
          }

          const { container } = renderElements(
            <>
              {processedMessages.map((_, numItemsPrepended) => {
                const virtuosoContext = {
                  Message: MessageUI,
                  messageGroupStyles,
                  numItemsPrepended,
                  ownMessagesDeliveredToOthers: {},
                  ownMessagesReadByOthers: {},
                  prependOffset,
                  processedMessages,
                  shouldGroupByUser,
                  virtuosoRef,
                };
                return (
                  <div key={numItemsPrepended}>
                    {messageRenderer(virtuosoIndex, undefined, virtuosoContext)}
                  </div>
                );
              })}
            </>,
          );
          const messageElements = container.querySelectorAll('.str-chat__message');

          // Grouping CSS classes (--group, --first, --end) are no longer applied via
          // messageRenderer in v14; they require explicit groupedByUser/firstOfGroup/endOfGroup
          // props to be passed to the Message component from higher up the tree.
          // Here we verify that messages render without grouping classes.
          const firstGroupItemClass = 'str-chat__virtual-message__wrapper--first';
          const lastGroupItemClass = 'str-chat__virtual-message__wrapper--end';
          expect(
            container.getElementsByClassName('str-chat__virtual-message__wrapper--group'),
          ).toHaveLength(0);

          expect(container.getElementsByClassName(firstGroupItemClass)).toHaveLength(0);
          expect(container.getElementsByClassName(lastGroupItemClass)).toHaveLength(0);

          // Verify that messages are rendered
          expect(messageElements.length).toBe(processedMessages.length);
        },
      );
    });
  });
});
