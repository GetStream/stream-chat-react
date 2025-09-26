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
import { MessageSimple } from '../../Message';
import { UnreadMessagesSeparator } from '../UnreadMessagesSeparator';

const prependOffset = 0;
const user1 = generateUser();
const user2 = generateUser();
let client;
let channel;

const PREPEND_OFFSET = 10 ** 7;

const Wrapper = ({ children, componentContext = {} }) => (
  <ChatProvider value={{ client }}>
    <ChannelStateProvider value={{ channel }}>
      <ChannelActionProvider value={{ addNotification: jest.fn() }}>
        <ComponentProvider value={componentContext}>
          <DialogManagerProvider id='vml-components-dialog-manager'>
            {children}
          </DialogManagerProvider>
        </ComponentProvider>
      </ChannelActionProvider>
    </ChannelStateProvider>
  </ChatProvider>
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
            </ChatProvider>,
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
          expect(container).toMatchInlineSnapshot(`
            <div>
              <div
                class="str-chat__unread-messages-separator-wrapper"
              >
                <div
                  class="str-chat__unread-messages-separator"
                  data-testid="unread-messages-separator"
                >
                  Unread messages
                </div>
              </div>
              <div
                class="message-component"
              />
            </div>
          `);
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
          expect(container).toMatchInlineSnapshot(`
            <div>
              <div
                class="str-chat__unread-messages-separator-wrapper"
              >
                <div
                  class="str-chat__unread-messages-separator"
                  data-testid="unread-messages-separator"
                >
                  Unread messages
                </div>
              </div>
              <div
                class="message-component"
              />
            </div>
          `);
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

      it.each([
        ['not ', 'by default', 'not ', false],
        ['', '', '', true],
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

          const { container } = renderElements(
            <>
              {processedMessages.map((_, numItemsPrepended) => {
                const virtuosoContext = {
                  Message: MessageSimple,
                  messageGroupStyles: {},
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
          const messageElements = container.getElementsByClassName(
            'str-chat__message str-chat__message-simple',
          );

          const firstGroupItemClass = 'str-chat__virtual-message__wrapper--first';
          const lastGroupItemClass = 'str-chat__virtual-message__wrapper--end';
          expect(
            container.getElementsByClassName('str-chat__virtual-message__wrapper--group'),
          ).toHaveLength(shouldGroupByUser ? user1MessageGroup.length - 1 : 0);

          expect(container.getElementsByClassName(firstGroupItemClass)).toHaveLength(
            shouldGroupByUser ? 3 : 0,
          );
          expect(container.getElementsByClassName(lastGroupItemClass)).toHaveLength(
            shouldGroupByUser ? 3 : 0,
          );
          if (shouldGroupByUser) {
            expect(messageElements[0]).toHaveClass(firstGroupItemClass);
            expect(messageElements[0]).toHaveClass(lastGroupItemClass);
            expect(messageElements[1]).toHaveClass(firstGroupItemClass);
            expect(messageElements[processedMessages.length - 2]).toHaveClass(
              lastGroupItemClass,
            );
            expect(messageElements[processedMessages.length - 1]).toHaveClass(
              firstGroupItemClass,
            );
            expect(messageElements[processedMessages.length - 1]).toHaveClass(
              lastGroupItemClass,
            );
          }
        },
      );
    });
  });
});
