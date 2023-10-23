import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';
import {
  ChannelActionProvider,
  ChannelStateProvider,
  ChatProvider,
  ComponentProvider,
} from '../../../../context';
import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { useVirtualizedMessageListComponents } from '../VirtualizedMessageList';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

const prependOffset = 0;
const user1 = generateUser();
const user2 = generateUser();
let client;
let channel;

const Wrapper = ({ children }) => (
  <ChatProvider value={{ client }}>
    <ChannelStateProvider value={{ channel }}>
      <ChannelActionProvider value={{ addNotification: jest.fn() }}>
        <ComponentProvider value={{}}>{children}</ComponentProvider>
      </ChannelActionProvider>
    </ChannelStateProvider>
  </ChatProvider>
);

const renderElements = (children) => render(<Wrapper>{children}</Wrapper>);

function renderVMLComponentsHook(params = {}) {
  const { result } = renderHook(() => useVirtualizedMessageListComponents(params), {
    wrapper: Wrapper,
  });
  return result.current;
}

describe('useVirtualizedMessageListComponents', () => {
  beforeAll(async () => {
    client = await getTestClientWithUser();
    const channelData = generateChannel();
    channel = client.channel(channelData.channel.type, channelData.channel.id, channelData);
  });

  it('should allow to execute custom item rendering logic instead of the default', () => {
    const customMessageRenderer = jest.fn();
    const virtuosoIndex = 1;
    const virtuosoContext = {
      numItemsPrepended: 0,
      processedMessages: [generateMessage()],
    };
    const { messageRenderer } = renderVMLComponentsHook({ customMessageRenderer, prependOffset });
    messageRenderer(virtuosoIndex, undefined, virtuosoContext);
    expect(customMessageRenderer).toHaveBeenCalledWith(
      expect.arrayContaining(virtuosoContext.processedMessages),
      1,
    );
  });
  describe('default item rendering logic', () => {
    it('should render MessageSystem component for system messages', () => {
      const virtuosoIndex = 0;
      const virtuosoContext = {
        numItemsPrepended: 0,
        processedMessages: [generateMessage({ type: 'system' })],
      };
      const { messageRenderer } = renderVMLComponentsHook({ prependOffset });
      render(messageRenderer(virtuosoIndex, undefined, virtuosoContext));
      expect(screen.getByTestId('message-system')).toBeInTheDocument();
    });

    it('should render DateSeparator component for custom message type date', () => {
      const virtuosoIndex = 0;
      const virtuosoContext = {
        numItemsPrepended: 0,
        processedMessages: [generateMessage({ customType: 'message.date', date: new Date() })],
      };
      const { messageRenderer } = renderVMLComponentsHook({ prependOffset });
      render(messageRenderer(virtuosoIndex, undefined, virtuosoContext));
      expect(screen.getByTestId('date-separator')).toBeInTheDocument();
    });

    it('should render empty div when trying to render message at non-existent index', () => {
      const virtuosoIndex = 1;
      const virtuosoContext = {
        numItemsPrepended: 0,
        processedMessages: [generateMessage({ customType: 'message.date', date: new Date() })],
      };
      const { messageRenderer } = renderVMLComponentsHook({ prependOffset });
      const { container } = render(messageRenderer(virtuosoIndex, undefined, virtuosoContext));
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            style="height: 1px;"
          />
        </div>
      `);
    });

    it.each([
      ['not ', 'by default', 'not ', false],
      ['', '', '', true],
    ])(
      'should %sgroup messages %s and mark the first and the last group message',
      (_, __, ___, shouldGroupByUser) => {
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

        const renderers = processedMessages.map(() => {
          const virtuosoRef = { current: {} };

          const { messageRenderer } = renderVMLComponentsHook({
            prependOffset,
            shouldGroupByUser,
            virtuosoRef,
          });
          return messageRenderer;
        });

        const virtuosoContext = {
          numItemsPrepended: 0,
          ownMessagesReadByOthers: {},
          processedMessages,
        };
        const { container } = renderElements(
          <>
            {renderers.map((messageRenderer, virtuosoIndex) => (
              <div key={virtuosoIndex}>
                {messageRenderer(virtuosoIndex, undefined, virtuosoContext)}
              </div>
            ))}
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
          expect(messageElements[processedMessages.length - 2]).toHaveClass(lastGroupItemClass);
          expect(messageElements[processedMessages.length - 1]).toHaveClass(firstGroupItemClass);
          expect(messageElements[processedMessages.length - 1]).toHaveClass(lastGroupItemClass);
        }
      },
    );
  });

  describe('default virtuoso components', () => {
    it('should render EmptyPlaceholder', () => {
      const {
        virtuosoComponents: { EmptyPlaceholder },
      } = renderVMLComponentsHook({ prependOffset });
      const { container } = renderElements(<EmptyPlaceholder />);

      expect(container).toMatchInlineSnapshot(`
              <div>
                <div
                  class="str-chat__empty-channel"
                >
                  <svg
                    data-testid="chat-bubble"
                    fill="none"
                    height="96"
                    viewBox="0 0 136 136"
                    width="96"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M106 24.5H30C24.775 24.5 20.5 28.775 20.5 34V119.5L39.5 100.5H106C111.225 100.5 115.5 96.225 115.5 91V34C115.5 28.775 111.225 24.5 106 24.5ZM106 91H39.5L30 100.5V34H106V91Z"
                      fill="#B4B7BB"
                    />
                  </svg>
                  <p
                    class="str-chat__empty-channel-text"
                    role="listitem"
                  >
                    No chats here yet…
                  </p>
                </div>
              </div>
          `);
    });

    it('should render empty div in Footer', () => {
      const {
        virtuosoComponents: { Footer },
      } = renderVMLComponentsHook({ prependOffset });
      const { container } = renderElements(<Footer />);
      expect(container).toMatchInlineSnapshot(`<div />`);
    });

    it('should render empty div in Header when not loading more messages', () => {
      const {
        virtuosoComponents: { Header },
      } = renderVMLComponentsHook({ prependOffset });
      const { container } = renderElements(<Header />);
      expect(container).toMatchInlineSnapshot(`<div />`);
    });

    it('should render LoadingIndicator in Header when loading more messages', () => {
      const {
        virtuosoComponents: { Header },
      } = renderVMLComponentsHook({ loadingMore: true, prependOffset });
      const { container } = renderElements(<Header />);
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            class="str-chat__virtual-list__loading"
          >
            <div
              class="str-chat__loading-indicator"
              data-testid="loading-indicator-wrapper"
              style="height: 20px; width: 20px;"
            >
              <svg
                height="20"
                viewBox="0 0 30 30"
                width="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <lineargradient
                    id="a"
                    x1="50%"
                    x2="50%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stop-color="#FFF"
                      stop-opacity="0"
                    />
                    <stop
                      data-testid="loading-indicator-circle"
                      offset="100%"
                      stop-color="#006CFF"
                      stop-opacity="1"
                      style="stop-color: rgb(0, 108, 255);"
                    />
                  </lineargradient>
                </defs>
                <path
                  d="M2.518 23.321l1.664-1.11A12.988 12.988 0 0 0 15 28c7.18 0 13-5.82 13-13S22.18 2 15 2V0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-5.206 0-9.792-2.652-12.482-6.679z"
                  fill="url(#a)"
                  fill-rule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      `);
    });

    it.each([
      ['with', { virtualMessage: 'XXX' }],
      ['without', undefined],
    ])('should render item wrapper %s custom classes', (_, customClasses) => {
      const props = {
        'data-item-index': 0,
      };
      const virtuosoContext = {
        customClasses,
        messageGroupStyles: {},
        numItemsPrepended: 0,
        processedMessages: [generateMessage()],
      };
      const {
        virtuosoComponents: { Item },
      } = renderVMLComponentsHook({ prependOffset });

      const { container } = renderElements(<Item context={virtuosoContext} {...props} />);
      if (customClasses) {
        expect(container.getElementsByClassName(customClasses.virtualMessage)).toHaveLength(1);
        expect(container).toMatchInlineSnapshot(`
          <div>
            <div
              class="XXX"
              data-item-index="0"
            />
          </div>
        `);
      } else {
        expect(container).toMatchInlineSnapshot(`
          <div>
            <div
              class="str-chat__virtual-list-message-wrapper str-chat__li"
              data-item-index="0"
            />
          </div>
        `);
      }
    });
  });

  it('should not provide default for selected virtuoso components', () => {
    const { virtuosoComponents } = renderVMLComponentsHook({ prependOffset });
    expect(Object.keys(virtuosoComponents)).toHaveLength(4);
    expect(virtuosoComponents.EmptyPlaceholder).toBeDefined();
    expect(virtuosoComponents.Footer).toBeDefined();
    expect(virtuosoComponents.Header).toBeDefined();
    expect(virtuosoComponents.Item).toBeDefined();
  });

  it('should allow to override default components', () => {
    const components = {
      EmptyPlaceholder: jest.fn(),
      Footer: jest.fn(),
      Header: jest.fn(),
      Item: jest.fn(),
    };

    const { virtuosoComponents } = renderVMLComponentsHook({ components, prependOffset });
    Object.values(virtuosoComponents).forEach((virtuosoComponent) => virtuosoComponent());

    expect(Object.keys(virtuosoComponents)).toHaveLength(4);
    expect(virtuosoComponents.EmptyPlaceholder).toHaveBeenCalledTimes(1);
    expect(virtuosoComponents.Footer).toHaveBeenCalledTimes(1);
    expect(virtuosoComponents.Header).toHaveBeenCalledTimes(1);
    expect(virtuosoComponents.Item).toHaveBeenCalledTimes(1);
  });

  it('should allow to add components not provided by the SDK and merge them with defaults', () => {
    const components = {
      Group: jest.fn(),
      List: jest.fn(),
      Scroller: jest.fn(),
      ScrollSeekPlaceholder: jest.fn(),
      TopItemList: jest.fn(),
    };
    const virtuosoContext = {
      messageGroupStyles: {},
      numItemsPrepended: 0,
      processedMessages: [generateMessage()],
    };

    const { virtuosoComponents } = renderVMLComponentsHook({ components, prependOffset });
    Object.entries(components).forEach(([componentName, Component]) => {
      if (componentName === 'Item') {
        const { container } = renderElements(<Component context={virtuosoContext} />);
        expect(container).toMatchInlineSnapshot(`
          <div>
            <div
              class="str-chat__virtual-list-message-wrapper str-chat__li"
              data-item-index="0"
            />
          </div>
        `);
      } else if (componentName === 'EmptyPlaceholder') {
        const { container } = renderElements(<Component />);
        expect(container).toMatchInlineSnapshot(`
              <div>
                <div
                  class="str-chat__empty-channel"
                >
                  <svg
                    data-testid="chat-bubble"
                    fill="none"
                    height="96"
                    viewBox="0 0 136 136"
                    width="96"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M106 24.5H30C24.775 24.5 20.5 28.775 20.5 34V119.5L39.5 100.5H106C111.225 100.5 115.5 96.225 115.5 91V34C115.5 28.775 111.225 24.5 106 24.5ZM106 91H39.5L30 100.5V34H106V91Z"
                      fill="#B4B7BB"
                    />
                  </svg>
                  <p
                    class="str-chat__empty-channel-text"
                    role="listitem"
                  >
                    No chats here yet…
                  </p>
                </div>
              </div>
          `);
      } else if (componentName === 'Footer') {
        const { container } = renderElements(<Component />);
        expect(container).toMatchInlineSnapshot(`<div />`);
      } else if (componentName === 'Header') {
        const { container } = renderElements(<Component />);
        expect(container).toMatchInlineSnapshot(`<div />`);
      }
      virtuosoComponents[componentName]();
    });
    expect(Object.keys(virtuosoComponents)).toHaveLength(9);
    expect(virtuosoComponents.Group).toHaveBeenCalledTimes(1);
    expect(virtuosoComponents.List).toHaveBeenCalledTimes(1);
    expect(virtuosoComponents.Scroller).toHaveBeenCalledTimes(1);
    expect(virtuosoComponents.ScrollSeekPlaceholder).toHaveBeenCalledTimes(1);
    expect(virtuosoComponents.TopItemList).toHaveBeenCalledTimes(1);
  });
});
