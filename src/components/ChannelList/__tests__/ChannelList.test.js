import React from 'react';
import { getNodeText } from '@testing-library/dom';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  dispatchChannelDeletedEvent,
  dispatchChannelHiddenEvent,
  dispatchChannelTruncatedEvent,
  dispatchChannelUpdatedEvent,
  dispatchChannelVisibleEvent,
  dispatchConnectionRecoveredEvent,
  dispatchMessageNewEvent,
  dispatchNotificationAddedToChannelEvent,
  dispatchNotificationMessageNewEvent,
  dispatchNotificationRemovedFromChannel,
  erroredPostApi,
  generateChannel,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  queryChannelsApi,
  useMockedApis,
} from 'mock-builders';
import { v4 as uuidv4 } from 'uuid';

import { ChatContext } from '../../../context';
import { Chat } from '../../Chat';

import { ChannelList } from '../ChannelList';
import {
  ChannelPreviewCompact,
  ChannelPreviewLastMessage,
  ChannelPreviewMessenger,
} from '../../ChannelPreview';

/**
 * We are gonna use following custom UI components for preview and list.
 * If we use ChannelPreviewMessenger or ChannelPreviewLastMessage here, then changes
 * to those components might end up breaking tests for ChannelList, which will be quite painful
 * to debug then.
 */
const ChannelPreviewComponent = ({ channel, channelUpdateCount, latestMessage }) => (
  <div data-testid={channel.id} role='listitem'>
    <div data-testid='channelUpdateCount'>{channelUpdateCount}</div>
    <div>{channel.data.name}</div>
    <div>{latestMessage}</div>
  </div>
);

const ChannelListComponent = (props) => {
  const { error, loading } = props;
  if (error) {
    return <div data-testid='error-indicator' />;
  }

  if (loading) {
    return <div data-testid='loading-indicator' />;
  }

  return <div role='list'>{props.children}</div>;
};
const ROLE_LIST_ITEM_SELECTOR = '[role="listitem"]';

describe('ChannelList', () => {
  let chatClientUthred;
  let testChannel1;
  let testChannel2;
  let testChannel3;

  beforeEach(async () => {
    chatClientUthred = await getTestClientWithUser({ id: 'uthred' });
    testChannel1 = generateChannel();
    testChannel2 = generateChannel();
    testChannel3 = generateChannel();
  });

  afterEach(cleanup);

  describe('mobile navigation', () => {
    let closeMobileNav;
    let props;
    beforeEach(() => {
      closeMobileNav = jest.fn();
      props = {
        closeMobileNav,
        filters: {},
        List: ChannelListComponent,
        Preview: ChannelPreviewComponent,
      };
      useMockedApis(chatClientUthred, [queryChannelsApi([])]);
    });
    it('should call `closeMobileNav` prop function, when clicked outside ChannelList', async () => {
      const { getByRole, getByTestId } = render(
        <ChatContext.Provider value={{ client: chatClientUthred, closeMobileNav, navOpen: true }}>
          <ChannelList {...props} />
          <div data-testid='outside-channellist' />
        </ChatContext.Provider>,
      );

      // Wait for list of channels to load in DOM.
      await waitFor(() => {
        expect(getByRole('list')).toBeInTheDocument();
      });

      fireEvent.click(getByTestId('outside-channellist'));
      await waitFor(() => {
        expect(closeMobileNav).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call `closeMobileNav` prop function on click, if ChannelList is collapsed', async () => {
      const { getByRole, getByTestId } = render(
        <ChatContext.Provider value={{ client: chatClientUthred, closeMobileNav, navOpen: false }}>
          <ChannelList {...props} />
          <div data-testid='outside-channellist' />
        </ChatContext.Provider>,
      );

      // Wait for list of channels to load in DOM.
      await waitFor(() => {
        expect(getByRole('list')).toBeInTheDocument();
      });

      fireEvent.click(getByTestId('outside-channellist'));
      await waitFor(() => {
        expect(closeMobileNav).toHaveBeenCalledTimes(0);
      });
    });
  });

  it('should re-query channels when filters change', async () => {
    const props = {
      filters: {},
      List: ChannelListComponent,
      Preview: ChannelPreviewComponent,
    };

    useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1])]);

    const { getByRole, getByTestId, rerender } = render(
      <Chat client={chatClientUthred}>
        <ChannelList {...props} />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByRole('list')).toBeInTheDocument();
    });

    useMockedApis(chatClientUthred, [queryChannelsApi([testChannel2])]);
    rerender(
      <Chat client={chatClientUthred}>
        <ChannelList {...props} filters={{ dummyFilter: true }} />
      </Chat>,
    );
    await waitFor(() => {
      expect(getByTestId(testChannel2.channel.id)).toBeInTheDocument();
    });
  });

  it('should only show filtered channels when a filter function prop is provided', async () => {
    const filteredChannel = generateChannel({ channel: { type: 'filtered' } });

    const customFilterFunction = (channels) =>
      channels.filter((channel) => channel.type === 'filtered');

    const props = {
      channelRenderFilterFn: customFilterFunction,
      filters: {},
      List: ChannelListComponent,
      Preview: ChannelPreviewComponent,
    };

    useMockedApis(chatClientUthred, [queryChannelsApi([filteredChannel, testChannel1])]);

    const { getByRole, queryAllByRole } = render(
      <Chat client={chatClientUthred}>
        <ChannelList {...props} />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByRole('list')).toBeInTheDocument();
      // eslint-disable-next-line jest-dom/prefer-in-document
      expect(queryAllByRole('listitem')).toHaveLength(1);
    });
  });

  it('should render `LoadingErrorIndicator` when queryChannels api throws error', async () => {
    useMockedApis(chatClientUthred, [erroredPostApi()]);
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);

    const { getByTestId } = render(
      <Chat client={chatClientUthred}>
        <ChannelList
          filters={{}}
          List={ChannelListComponent}
          options={{ presence: true, state: true, watch: true }}
          Preview={ChannelPreviewComponent}
        />
      </Chat>,
    );

    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByTestId('error-indicator')).toBeInTheDocument();
    });
  });

  it('ChannelPreview UI components should render `Avatar` when the custom prop is provided', async () => {
    useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1])]);

    const { getByTestId, rerender } = render(
      <Chat client={chatClientUthred}>
        <ChannelList
          Avatar={() => <div data-testid='custom-avatar-compact'>Avatar</div>}
          List={ChannelListComponent}
          Preview={ChannelPreviewCompact}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('custom-avatar-compact')).toBeInTheDocument();
    });

    rerender(
      <Chat client={chatClientUthred}>
        <ChannelList
          Avatar={() => <div data-testid='custom-avatar-last'>Avatar</div>}
          List={ChannelListComponent}
          Preview={ChannelPreviewLastMessage}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('custom-avatar-last')).toBeInTheDocument();
    });

    rerender(
      <Chat client={chatClientUthred}>
        <ChannelList
          Avatar={() => <div data-testid='custom-avatar-messenger'>Avatar</div>}
          List={ChannelListComponent}
          Preview={ChannelPreviewMessenger}
        />
      </Chat>,
    );

    await waitFor(() => {
      expect(getByTestId('custom-avatar-messenger')).toBeInTheDocument();
    });
  });

  it('when queryChannels api returns no channels, `EmptyStateIndicator` should be rendered', async () => {
    useMockedApis(chatClientUthred, [queryChannelsApi([])]);

    const EmptyStateIndicator = () => <div data-testid='empty-state-indicator' />;

    const { getByTestId } = render(
      <Chat client={chatClientUthred}>
        <ChannelList
          EmptyStateIndicator={EmptyStateIndicator}
          filters={{}}
          List={ChannelListComponent}
          options={{ presence: true, state: true, watch: true }}
        />
      </Chat>,
    );
    // Wait for list of channels to load in DOM.
    await waitFor(() => {
      expect(getByTestId('empty-state-indicator')).toBeInTheDocument();
    });
  });

  describe('Default and custom active channel', () => {
    let setActiveChannel;
    const watchersConfig = { limit: 20, offset: 0 };
    const testSetActiveChannelCall = (channelInstance) =>
      waitFor(() => {
        expect(setActiveChannel).toHaveBeenCalledTimes(1);
        expect(setActiveChannel).toHaveBeenCalledWith(channelInstance, watchersConfig);
        return true;
      });

    beforeEach(() => {
      setActiveChannel = jest.fn();
      useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1, testChannel2])]);
    });

    it('should call `setActiveChannel` prop function with first channel as param', async () => {
      render(
        <ChatContext.Provider value={{ client: chatClientUthred, setActiveChannel }}>
          <ChannelList
            filters={{}}
            List={ChannelListComponent}
            options={{
              presence: true,
              state: true,
              watch: true,
            }}
            setActiveChannelOnMount
            watchers={watchersConfig}
          />
        </ChatContext.Provider>,
      );

      const channelInstance = chatClientUthred.channel(
        testChannel1.channel.type,
        testChannel1.channel.id,
      );

      expect(await testSetActiveChannelCall(channelInstance)).toBe(true);
    });

    it('should call `setActiveChannel` prop function with channel (which has `customActiveChannel` id)  as param', async () => {
      render(
        <ChatContext.Provider value={{ client: chatClientUthred, setActiveChannel }}>
          <ChannelList
            customActiveChannel={testChannel2.channel.id}
            filters={{}}
            List={ChannelListComponent}
            options={{ presence: true, state: true, watch: true }}
            setActiveChannel={setActiveChannel}
            setActiveChannelOnMount
            watchers={watchersConfig}
          />
        </ChatContext.Provider>,
      );

      const channelInstance = chatClientUthred.channel(
        testChannel2.channel.type,
        testChannel2.channel.id,
      );

      expect(await testSetActiveChannelCall(channelInstance)).toBe(true);
    });

    it('should render channel with id `customActiveChannel` at top of the list', async () => {
      const { getAllByRole, getByRole, getByTestId } = render(
        <ChatContext.Provider value={{ client: chatClientUthred, setActiveChannel }}>
          <ChannelList
            customActiveChannel={testChannel2.channel.id}
            filters={{}}
            List={ChannelListComponent}
            options={{ presence: true, state: true, watch: true }}
            Preview={ChannelPreviewComponent}
            setActiveChannel={setActiveChannel}
            setActiveChannelOnMount
            watchers={watchersConfig}
          />
        </ChatContext.Provider>,
      );

      // Wait for list of channels to load in DOM.
      await waitFor(() => {
        expect(getByRole('list')).toBeInTheDocument();
      });

      const items = getAllByRole('listitem');

      // Get the closest listitem to the channel that received new message.
      const channelPreview = getByTestId(testChannel2.channel.id).closest(ROLE_LIST_ITEM_SELECTOR);

      expect(channelPreview.isEqualNode(items[0])).toBe(true);
    });
  });

  describe('Event handling', () => {
    describe('message.new', () => {
      const props = {
        filters: {},
        List: ChannelListComponent,
        Preview: ChannelPreviewComponent,
      };
      const sendNewMessageOnChannel3 = () => {
        const newMessage = generateMessage({
          user: generateUser(),
        });

        act(() => dispatchMessageNewEvent(chatClientUthred, newMessage, testChannel3.channel));
        return newMessage;
      };

      beforeEach(() => {
        useMockedApis(chatClientUthred, [
          queryChannelsApi([testChannel1, testChannel2, testChannel3]),
        ]);
      });

      it('should move channel to top of the list', async () => {
        const { getAllByRole, getByRole, getByText } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...props} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newMessage = sendNewMessageOnChannel3();
        await waitFor(() => {
          expect(getByText(newMessage.text)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByText(newMessage.text).closest(ROLE_LIST_ITEM_SELECTOR);
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
      });

      it('should not alter order if `lockChannelOrder` prop is true', async () => {
        const { getAllByRole, getByRole, getByText } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...props} lockChannelOrder />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newMessage = sendNewMessageOnChannel3();

        await waitFor(() => {
          expect(getByText(newMessage.text)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByText(newMessage.text).closest(ROLE_LIST_ITEM_SELECTOR);
        expect(channelPreview.isEqualNode(items[2])).toBe(true);
      });
    });

    describe('notification.message_new', () => {
      it('should move channel to top of the list by default', async () => {
        useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1, testChannel2])]);

        const { getAllByRole, getByRole, getByTestId } = render(
          <Chat client={chatClientUthred}>
            <ChannelList
              filters={{}}
              List={ChannelListComponent}
              options={{ presence: true, state: true, watch: true }}
              Preview={ChannelPreviewComponent}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        useMockedApis(chatClientUthred, [getOrCreateChannelApi(testChannel3)]);

        act(() => dispatchNotificationMessageNewEvent(chatClientUthred, testChannel3.channel));

        await waitFor(() => {
          expect(getByTestId(testChannel3.channel.id)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByTestId(testChannel3.channel.id);
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
      });

      it('should call `onMessageNew` function prop, if provided', async () => {
        const onMessageNew = jest.fn();

        useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1])]);

        const { getByRole } = render(
          <Chat client={chatClientUthred}>
            <ChannelList
              filters={{}}
              List={ChannelListComponent}
              onMessageNew={onMessageNew}
              options={{ presence: true, state: true, watch: true }}
              Preview={ChannelPreviewComponent}
            />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        useMockedApis(chatClientUthred, [getOrCreateChannelApi(testChannel2)]);

        act(() => dispatchNotificationMessageNewEvent(chatClientUthred, testChannel2.channel));

        await waitFor(() => {
          expect(onMessageNew).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('notification.added_to_channel', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        options: { presence: true, state: true, watch: true },
        Preview: ChannelPreviewComponent,
      };

      beforeEach(async () => {
        chatClientUthred = await getTestClientWithUser({ id: 'vishal' });
        useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should move channel to top of the list by default', async () => {
        const { getAllByRole, getByRole, getByTestId } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        useMockedApis(chatClientUthred, [getOrCreateChannelApi(testChannel3)]);

        act(() => dispatchNotificationAddedToChannelEvent(chatClientUthred, testChannel3.channel));

        await waitFor(() => {
          expect(getByTestId(testChannel3.channel.id)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByTestId(testChannel3.channel.id);
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
      });

      it('should call `onAddedToChannel` function prop, if provided', async () => {
        const onAddedToChannel = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} onAddedToChannel={onAddedToChannel} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchNotificationAddedToChannelEvent(chatClientUthred, testChannel3.channel));

        await waitFor(() => {
          expect(onAddedToChannel).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('notification.removed_from_channel', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        useMockedApis(chatClientUthred, [
          queryChannelsApi([testChannel1, testChannel2, testChannel3]),
        ]);
      });

      it('should remove the channel from list by default', async () => {
        const { getByRole, getByTestId } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );
        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });
        const nodeToBeRemoved = getByTestId(testChannel3.channel.id);

        act(() => dispatchNotificationRemovedFromChannel(chatClientUthred, testChannel3.channel));

        await waitFor(() => {
          expect(nodeToBeRemoved).not.toBeInTheDocument();
        });
      });

      it('should call `onRemovedFromChannel` function prop, if provided', async () => {
        const onRemovedFromChannel = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} onRemovedFromChannel={onRemovedFromChannel} />
          </Chat>,
        );
        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchNotificationRemovedFromChannel(chatClientUthred, testChannel3.channel));

        await waitFor(() => {
          expect(onRemovedFromChannel).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.updated', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should update the channel in list, by default', async () => {
        const { getByRole, getByText } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newChannelName = uuidv4();
        act(() =>
          dispatchChannelUpdatedEvent(chatClientUthred, {
            ...testChannel2.channel,
            name: newChannelName,
          }),
        );

        await waitFor(() => {
          expect(getByText(newChannelName)).toBeInTheDocument();
        });
      });

      it('should call `onChannelUpdated` function prop, if provided', async () => {
        const onChannelUpdated = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} onChannelUpdated={onChannelUpdated} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const newChannelName = uuidv4();

        act(() =>
          dispatchChannelUpdatedEvent(chatClientUthred, {
            ...testChannel2.channel,
            name: newChannelName,
          }),
        );

        await waitFor(() => {
          expect(onChannelUpdated).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.deleted', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should remove channel from list, by default', async () => {
        const { getByRole, getByTestId } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const nodeToBeRemoved = getByTestId(testChannel2.channel.id);
        act(() => dispatchChannelDeletedEvent(chatClientUthred, testChannel2.channel));

        await waitFor(() => {
          expect(nodeToBeRemoved).not.toBeInTheDocument();
        });
      });

      it('should call `onChannelDeleted` function prop, if provided', async () => {
        const onChannelDeleted = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} onChannelDeleted={onChannelDeleted} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelDeletedEvent(chatClientUthred, testChannel2.channel));

        await waitFor(() => {
          expect(onChannelDeleted).toHaveBeenCalledTimes(1);
        });
      });

      it('should unset activeChannel if it was deleted', async () => {
        const setActiveChannel = jest.fn();
        const { getByRole } = render(
          <ChatContext.Provider value={{ client: chatClientUthred, setActiveChannel }}>
            <ChannelList
              {...channelListProps}
              channel={{ cid: testChannel1.channel.cid }}
              setActiveChannel={setActiveChannel}
            />
          </ChatContext.Provider>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelDeletedEvent(chatClientUthred, testChannel1.channel));

        await waitFor(() => {
          expect(setActiveChannel).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.hidden', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should remove channel from list, by default', async () => {
        const { getByRole, getByTestId } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const nodeToBeRemoved = getByTestId(testChannel2.channel.id);
        act(() => dispatchChannelHiddenEvent(chatClientUthred, testChannel2.channel));

        await waitFor(() => {
          expect(nodeToBeRemoved).not.toBeInTheDocument();
        });
      });

      it('should unset activeChannel if it was hidden', async () => {
        const setActiveChannel = jest.fn();
        const { getByRole } = render(
          <ChatContext.Provider value={{ client: chatClientUthred, setActiveChannel }}>
            <ChannelList
              {...channelListProps}
              channel={{ cid: testChannel1.channel.cid }}
              setActiveChannel={setActiveChannel}
            />
          </ChatContext.Provider>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelHiddenEvent(chatClientUthred, testChannel1.channel));

        await waitFor(() => {
          expect(setActiveChannel).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('channel.visible', () => {
      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        options: { presence: true, state: true, watch: true },
        Preview: ChannelPreviewComponent,
      };

      beforeEach(async () => {
        chatClientUthred = await getTestClientWithUser({ id: 'jaap' });
        useMockedApis(chatClientUthred, [queryChannelsApi([testChannel1, testChannel2])]);
      });

      it('should move channel to top of the list by default', async () => {
        const { getAllByRole, getByRole, getByTestId } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        useMockedApis(chatClientUthred, [getOrCreateChannelApi(testChannel3)]);

        act(() => dispatchChannelVisibleEvent(chatClientUthred, testChannel3.channel));

        await waitFor(() => {
          expect(getByTestId(testChannel3.channel.id)).toBeInTheDocument();
        });

        const items = getAllByRole('listitem');

        // Get the closes listitem to the channel that received new message.
        const channelPreview = getByTestId(testChannel3.channel.id);
        expect(channelPreview.isEqualNode(items[0])).toBe(true);
      });

      it('should call `onChannelVisible` function prop, if provided', async () => {
        const onChannelVisible = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} onChannelVisible={onChannelVisible} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelVisibleEvent(chatClientUthred, testChannel3.channel));

        await waitFor(() => {
          expect(onChannelVisible).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('connection.recovered', () => {
      it('should rerender the list', async () => {
        const channel1 = generateChannel();
        const channel2 = generateChannel();
        const channelListProps = {
          filters: {},
          List: ChannelListComponent,
          Preview: ChannelPreviewComponent,
        };

        useMockedApis(chatClientUthred, [queryChannelsApi([channel1])]);

        const { getByRole, getByTestId } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        const updateCount = parseInt(getNodeText(getByTestId('channelUpdateCount')), 10);

        useMockedApis(chatClientUthred, [queryChannelsApi([channel2])]);
        act(() => dispatchConnectionRecoveredEvent(chatClientUthred));

        await waitFor(() => {
          expect(parseInt(getNodeText(getByTestId('channelUpdateCount')), 10)).toBe(
            updateCount + 1,
          );
        });
      });
    });

    describe('channel.truncated', () => {
      let channel1;
      let user1;
      let message1;
      let message2;

      const channelListProps = {
        filters: {},
        List: ChannelListComponent,
        Preview: ChannelPreviewComponent,
      };

      beforeEach(() => {
        user1 = generateUser();
        message1 = generateMessage({ user: user1 });
        message2 = generateMessage({ user: user1 });
        channel1 = generateChannel({ messages: [message1, message2] });

        useMockedApis(chatClientUthred, [queryChannelsApi([channel1])]);
      });

      it('should call `onChannelTruncated` function prop, if provided', async () => {
        const onChannelTruncated = jest.fn();
        const { getByRole } = render(
          <Chat client={chatClientUthred}>
            <ChannelList {...channelListProps} onChannelTruncated={onChannelTruncated} />
          </Chat>,
        );

        // Wait for list of channels to load in DOM.
        await waitFor(() => {
          expect(getByRole('list')).toBeInTheDocument();
        });

        act(() => dispatchChannelTruncatedEvent(chatClientUthred, channel1.channel));

        await waitFor(() => {
          expect(onChannelTruncated).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
