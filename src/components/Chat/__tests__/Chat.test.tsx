import React, { useContext } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { OwnUserResponse, StreamChat } from 'stream-chat';
import { ChannelPaginator, SearchController } from 'stream-chat';

import { Chat } from '..';

import { ChatContext, ComponentProvider, TranslationContext } from '../../../context';
import type { ChatContextValue } from '../../../context';
import { useNotificationConfigurationContext } from '../../Notifications';
import { GlobalModal } from '../../Modal';
import { Streami18n } from '../../../i18n';
import type { Notification } from 'stream-chat';
import type { UserMuteResponse } from 'stream-chat';
import {
  dispatchNotificationMutesUpdated,
  getTestClient,
  getTestClientWithUser,
  setWSConnectionStatus,
} from '../../../mock-builders';

const ChatContextConsumer = ({ fn }) => {
  fn(useContext(ChatContext));
  return <div data-testid='children' />;
};

const TranslationContextConsumer = ({ fn }) => {
  fn(useContext(TranslationContext));
  return <div data-testid='children' />;
};

const NotificationDisplayFilterConsumer = ({ fn }) => {
  fn(useNotificationConfigurationContext().displayFilter);
  return <div data-testid='children' />;
};

const notification = (tags: string[]) =>
  ({
    createdAt: 1,
    id: 'n-1',
    message: 'test',
    origin: { emitter: 'test' },
    severity: 'info',
    tags,
  }) as Notification;

describe('Chat', () => {
  afterEach(cleanup);
  const chatClient = getTestClient();
  const originalUserAgent = chatClient.getUserAgent();

  it('should render children without crashing', async () => {
    await act(() => {
      render(
        <Chat client={chatClient}>
          <div data-testid='children' />
        </Chat>,
      );
    });

    await waitFor(() => expect(screen.getByTestId('children')).toBeInTheDocument());
  });

  it('keeps modal-targeted notifications exclusive to the modal panel while a modal is open', async () => {
    let displayFilter: ReturnType<
      typeof useNotificationConfigurationContext
    >['displayFilter'];

    await act(() => {
      render(
        <Chat client={chatClient}>
          <ComponentProvider value={{ NotificationList: () => null }}>
            <GlobalModal aria-label='Test modal' open>
              Modal content
            </GlobalModal>
          </ComponentProvider>
          <NotificationDisplayFilterConsumer
            fn={(filter) => {
              displayFilter = filter;
            }}
          />
        </Chat>,
      );
    });

    await waitFor(() => {
      const modalNotification = notification(['target:modal', 'target:channel']);

      expect(displayFilter({ notification: modalNotification, panel: 'channel' })).toBe(
        false,
      );
      expect(displayFilter({ notification: modalNotification, panel: 'modal' })).toBe(
        true,
      );
    });
  });

  it('falls back a modal-targeted notification to its non-modal panel once the modal has closed', async () => {
    let displayFilter: ReturnType<
      typeof useNotificationConfigurationContext
    >['displayFilter'];

    // No modal open: mirrors a dialog that closed before emitting its confirmation. The
    // notification keeps its `target:modal` tag but its modal list is gone, so it must fall back to
    // its channel panel.
    await act(() => {
      render(
        <Chat client={chatClient}>
          <NotificationDisplayFilterConsumer
            fn={(filter) => {
              displayFilter = filter;
            }}
          />
        </Chat>,
      );
    });

    await waitFor(() => {
      const modalNotification = notification(['target:modal', 'target:channel']);

      expect(displayFilter({ notification: modalNotification, panel: 'channel' })).toBe(
        true,
      );
      expect(displayFilter({ notification: modalNotification, panel: 'modal' })).toBe(
        false,
      );
    });
  });

  it('routes notifications to the modal panel when a generated-id GlobalModal is open', async () => {
    let displayFilter: ReturnType<
      typeof useNotificationConfigurationContext
    >['displayFilter'];

    await act(() => {
      render(
        <Chat client={chatClient}>
          <ComponentProvider value={{ NotificationList: () => null }}>
            <GlobalModal aria-label='Test modal' open>
              Modal content
            </GlobalModal>
          </ComponentProvider>
          <NotificationDisplayFilterConsumer
            fn={(filter) => {
              displayFilter = filter;
            }}
          />
        </Chat>,
      );
    });

    await waitFor(() => {
      const channelNotification = notification(['target:channel']);

      expect(displayFilter({ notification: channelNotification, panel: 'channel' })).toBe(
        false,
      );
      expect(displayFilter({ notification: channelNotification, panel: 'modal' })).toBe(
        true,
      );
    });
  });

  it('should expose the context', async () => {
    let context: ChatContextValue;
    await act(() => {
      render(
        <Chat client={chatClient}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );
    });

    await waitFor(() => {
      expect(context).toBeInstanceOf(Object);
      expect(context.client).toBe(chatClient);
      expect(context.mutes).toStrictEqual([]);
      expect(context.theme).toBe('messaging light');
      expect(context.client.getUserAgent()).toMatch(
        new RegExp(
          `^stream-chat-react-.+-${originalUserAgent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        ),
      );
    });
  });

  it('props change should update the context', async () => {
    const theme = 'str-chat__theme-dark';
    let context: ChatContextValue;
    const { rerender } = render(
      <Chat client={chatClient} theme={theme}>
        <ChatContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );
    await waitFor(() => {
      expect(context.client).toBe(chatClient);
      expect(context.theme).toBe(theme);
    });

    const newTheme = 'str-chat__theme-dark custom-theme';
    const newClient = getTestClient();
    rerender(
      <Chat client={newClient} theme={newTheme}>
        <ChatContextConsumer
          fn={(ctx) => {
            context = ctx;
          }}
        />
      </Chat>,
    );
    await waitFor(() => {
      expect(context.client).toBe(newClient);
      expect(context.theme).toBe(newTheme);
    });
  });

  describe('search controller', () => {
    it('disposes the controller it created when it unmounts', async () => {
      let controller: ChatContextValue['searchController'] | undefined;
      const { unmount } = render(
        <Chat client={chatClient}>
          <ChatContextConsumer
            fn={(ctx: ChatContextValue) => {
              controller = ctx.searchController;
            }}
          />
        </Chat>,
      );
      await waitFor(() => expect(controller).toBeDefined());
      const dispose = vi.spyOn(controller as SearchController, 'dispose');

      unmount();

      expect(dispose).toHaveBeenCalledTimes(1);
    });

    it('leaves a controller passed in to the app', () => {
      const controller = new SearchController({ client: chatClient });
      const dispose = vi.spyOn(controller, 'dispose');
      const registerSubscriptions = vi.spyOn(controller, 'registerSubscriptions');
      const { unmount } = render(
        <Chat client={chatClient} searchController={controller}>
          <div />
        </Chat>,
      );

      unmount();

      expect(registerSubscriptions).not.toHaveBeenCalled();
      expect(dispose).not.toHaveBeenCalled();
    });

    it('takes back what it released when StrictMode mounts it a second time', async () => {
      let controller: ChatContextValue['searchController'] | undefined;
      render(
        <React.StrictMode>
          <Chat client={chatClient}>
            <ChatContextConsumer
              fn={(ctx: ChatContextValue) => {
                controller = ctx.searchController;
              }}
            />
          </Chat>
        </React.StrictMode>,
      );
      await waitFor(() => expect(controller).toBeDefined());

      // A disposed controller would stop hearing `client.config`.
      chatClient.config.set({ searchController: { keepSingleActiveSource: false } });
      expect(controller?.config.keepSingleActiveSource).toBe(false);
      chatClient.config.reset('searchController');
    });
  });

  describe('channel manager', () => {
    it('exposes the client channel manager on the context', async () => {
      const client = getTestClient();
      let context: ChatContextValue;

      await act(() => {
        render(
          <Chat client={client}>
            <ChatContextConsumer
              fn={(ctx) => {
                context = ctx;
              }}
            />
          </Chat>,
        );
      });

      await waitFor(() => expect(context.channelManager).toBe(client.channelManager));
    });

    it('does not register any channel list of its own', async () => {
      const client = await getTestClientWithUser({ id: 'user_x' });

      await act(() => {
        render(
          <Chat client={client}>
            <div data-testid='children' />
          </Chat>,
        );
      });

      await waitFor(() => expect(screen.getByTestId('children')).toBeInTheDocument());
      expect(client.channelManager.paginators).toEqual([]);
    });

    it('leaves the lists registered on the manager untouched', async () => {
      const client = getTestClient();
      const paginator = new ChannelPaginator({ client, id: 'channels:app-owned' });
      client.channelManager.insertPaginator({ paginator });

      let unmount: () => void;
      await act(() => {
        ({ unmount } = render(
          <Chat client={client}>
            <div data-testid='children' />
          </Chat>,
        ));
      });

      await waitFor(() => {
        expect(client.channelManager.paginators).toStrictEqual([paginator]);
      });

      await act(() => {
        unmount();
      });

      // The app owns its lists, so unmounting Chat must not drop them.
      expect(client.channelManager.paginators).toStrictEqual([paginator]);
    });

    it('routes events to the channel lists while mounted, with no ChannelList on screen', async () => {
      // The search results and the threads view replace the channel list, and the lists must keep
      // receiving events meanwhile.
      const client = await getTestClientWithUser({ id: 'user_x' });
      const channel = client.channelManager.ensure({ id: 'routed', type: 'messaging' });
      const ingestChannel = vi.spyOn(client.channelManager, 'ingestChannel');
      const channelUpdated = () =>
        client.dispatchEvent({
          channel: { ...channel.data, cid: channel.cid, id: 'routed', type: 'messaging' },
          channel_id: 'routed',
          channel_type: 'messaging',
          cid: channel.cid,
          type: 'channel.updated',
        } as never);

      let unmount: () => void;
      await act(() => {
        ({ unmount } = render(
          <Chat client={client}>
            <div />
          </Chat>,
        ));
      });
      channelUpdated();
      await waitFor(() => expect(ingestChannel).toHaveBeenCalledWith(channel));

      await act(() => {
        unmount();
      });
      ingestChannel.mockClear();
      channelUpdated();
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(ingestChannel).not.toHaveBeenCalled();
    });

    it('keeps exposing the same manager when the client changes', async () => {
      const client = getTestClient();
      const nextClient = getTestClient();
      let context: ChatContextValue;

      const { rerender } = render(
        <Chat client={client}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );

      await waitFor(() => expect(context.channelManager).toBe(client.channelManager));

      await act(() => {
        rerender(
          <Chat client={nextClient}>
            <ChatContextConsumer
              fn={(ctx) => {
                context = ctx;
              }}
            />
          </Chat>,
        );
      });

      await waitFor(() => expect(context.channelManager).toBe(nextClient.channelManager));
    });
  });

  describe('mutes', () => {
    it('init the mute state with client data', async () => {
      const chatClientWithUser = await getTestClientWithUser({ id: 'user_x' });
      // First load: mutes are initialized empty.
      (chatClientWithUser.user as OwnUserResponse).mutes = [];
      let context: ChatContextValue;
      const { rerender } = render(
        <Chat client={chatClientWithUser}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );
      // The client then loads its mutes.
      const mutes = ['user_y', 'user_z'];
      (chatClientWithUser.user as OwnUserResponse).mutes = mutes;
      await act(() => {
        rerender(
          <Chat client={chatClientWithUser}>
            <ChatContextConsumer
              fn={(ctx) => {
                context = ctx;
              }}
            />
          </Chat>,
        );
      });
      await waitFor(() => expect(context.mutes).toStrictEqual(mutes));
    });

    it('chat client listens and updates the state on mute event', async () => {
      const chatClientWithUser = await getTestClientWithUser({ id: 'user_x' });

      let context: ChatContextValue;
      render(
        <Chat client={chatClientWithUser}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );
      await waitFor(() => expect(context.mutes).toStrictEqual([]));

      const mutes = [{ target: { id: 'user_y' }, user: { id: 'user_y' } }];
      act(() =>
        dispatchNotificationMutesUpdated(
          chatClientWithUser,
          fromPartial<UserMuteResponse[]>(mutes),
        ),
      );
      await waitFor(() => expect(context.mutes).toStrictEqual(mutes));
    });
  });

  describe('connection notifications', () => {
    /** How long the banner holds a drop. Read from the client configuration. */
    const holdWindow = (client: StreamChat) =>
      client.wsConnection.config.offlineNotificationDisplayDelayMs;

    /**
     * Takes the socket down and waits out the hold window. The client publishes every transition,
     * so a test that expects the banner has to let the window pass.
     */
    const dropSocket = (client: StreamChat) => {
      vi.useFakeTimers();
      try {
        act(() => setWSConnectionStatus(client, false));
        act(() => {
          vi.advanceTimersByTime(holdWindow(client));
        });
      } finally {
        vi.useRealTimers();
      }
    };

    it('keeps the notification when the socket drops before i18n has initialized', async () => {
      // `Streami18n.init()` is asynchronous and replaces `t`, which re-runs the subscription
      // effect. Dismissal is scoped to the mount, so a drop inside the init window keeps its
      // banner.
      const client = await getTestClientWithUser();
      render(
        <Chat client={client}>
          <div data-testid='children' />
        </Chat>,
      );
      const chatNotifications = () =>
        client.notifications.notifications.filter(
          (notification) => notification.origin.emitter === 'Chat',
        );

      // Nothing is awaited first, so the drop lands inside the init window.
      dropSocket(client);
      expect(chatNotifications()).toHaveLength(1);

      // Long enough for `init()` to resolve and `t` to be replaced.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(chatNotifications()).toHaveLength(1);
    });

    const chatNotificationsOf = (client: StreamChat) =>
      client.notifications.notifications.filter(
        (notification) => notification.origin.emitter === 'Chat',
      );

    it('says reconnecting, not offline, when the socket dies on a working network', async () => {
      // The device network and the socket are different facts with different copy: a socket the
      // server closed must not be reported as a network outage.
      const client = await getTestClientWithUser();
      render(
        <Chat client={client}>
          <div data-testid='children' />
        </Chat>,
      );
      // jsdom is a browser, so the built-in reporter has already reported the network as up.
      expect(client.networkConnection.isOnline).toBe(true);

      dropSocket(client);

      await waitFor(() => expect(chatNotificationsOf(client)).toHaveLength(1));
      expect(chatNotificationsOf(client)[0].message).toBe('Reconnecting…');
      expect(chatNotificationsOf(client)[0].tags).toEqual(['system']);
    });

    it('says the network is down when the device reports no network', async () => {
      const client = await getTestClientWithUser();
      render(
        <Chat client={client}>
          <div data-testid='children' />
        </Chat>,
      );

      act(() => client.networkConnection.setStatus(false));

      await waitFor(() => expect(chatNotificationsOf(client)).toHaveLength(1));
      expect(chatNotificationsOf(client)[0].message).toBe('Waiting for network…');
    });

    it('swaps to the network message when the network drops while reconnecting', async () => {
      const client = await getTestClientWithUser();
      render(
        <Chat client={client}>
          <div data-testid='children' />
        </Chat>,
      );

      dropSocket(client);
      await waitFor(() =>
        expect(chatNotificationsOf(client)[0].message).toBe('Reconnecting…'),
      );

      act(() => client.networkConnection.setStatus(false));

      // One banner throughout: the more specific message replaces the general one.
      await waitFor(() =>
        expect(chatNotificationsOf(client)[0].message).toBe('Waiting for network…'),
      );
      expect(chatNotificationsOf(client)).toHaveLength(1);
    });

    it('publishes immediately when the client is already offline at mount', async () => {
      // The status is read on mount, not awaited, so an already-offline client shows the banner.
      const client = await getTestClientWithUser();
      client.networkConnection.setStatus(false);

      render(
        <Chat client={client}>
          <div data-testid='children' />
        </Chat>,
      );

      await waitFor(() => expect(chatNotificationsOf(client)).toHaveLength(1));
      expect(chatNotificationsOf(client)[0].message).toBe('Waiting for network…');
    });

    it('clears on recovery', async () => {
      const client = await getTestClientWithUser();
      render(
        <Chat client={client}>
          <div data-testid='children' />
        </Chat>,
      );

      dropSocket(client);
      await waitFor(() => expect(chatNotificationsOf(client)).toHaveLength(1));

      act(() => setWSConnectionStatus(client, true));

      await waitFor(() => expect(chatNotificationsOf(client)).toHaveLength(0));
    });

    it('respects a configured hold window', async () => {
      // Zero switches the wait off, but it still defers to the next task, so this advances timers
      // instead of asserting synchronously.
      const client = await getTestClientWithUser();
      client.config.set({
        client: { wsConnection: { offlineNotificationDisplayDelayMs: 0 } },
      });
      render(
        <Chat client={client}>
          <div data-testid='children' />
        </Chat>,
      );

      vi.useFakeTimers();
      try {
        act(() => setWSConnectionStatus(client, false));
        act(() => {
          vi.advanceTimersByTime(0);
        });
      } finally {
        vi.useRealTimers();
      }

      expect(chatNotificationsOf(client)).toHaveLength(1);
      expect(chatNotificationsOf(client)[0].message).toBe('Reconnecting…');
    });

    it('shows nothing for a drop the socket recovers from inside the window', async () => {
      // The socket retries on its own and most drops resolve quickly; showing those would make a
      // working app look broken.
      const client = await getTestClientWithUser();
      render(
        <Chat client={client}>
          <div data-testid='children' />
        </Chat>,
      );

      vi.useFakeTimers();
      try {
        act(() => setWSConnectionStatus(client, false));
        act(() => {
          vi.advanceTimersByTime(holdWindow(client) - 1);
        });
        // Coming back cancels the held drop instead of showing it and then removing it.
        expect(chatNotificationsOf(client)).toHaveLength(0);

        act(() => setWSConnectionStatus(client, true));
        act(() => {
          vi.advanceTimersByTime(holdWindow(client) * 2);
        });
      } finally {
        vi.useRealTimers();
      }

      expect(chatNotificationsOf(client)).toHaveLength(0);
    });

    it('uses NotificationAnnouncer from ComponentContext', async () => {
      const client = getTestClient();

      const CustomNotificationAnnouncer = () => (
        <div data-testid='custom-notification-announcer' />
      );

      render(
        <ComponentProvider value={{ NotificationAnnouncer: CustomNotificationAnnouncer }}>
          <Chat client={client}>
            <div data-testid='children' />
          </Chat>
        </ComponentProvider>,
      );

      await waitFor(() =>
        expect(screen.getByTestId('custom-notification-announcer')).toBeInTheDocument(),
      );
      expect(screen.queryByTestId('notification-announcer')).not.toBeInTheDocument();
    });
  });

  describe('translation context', () => {
    it('should expose the context', async () => {
      let context: ChatContextValue;
      await act(() => {
        render(
          <Chat client={chatClient}>
            <TranslationContextConsumer
              fn={(ctx) => {
                context = ctx;
              }}
            />
          </Chat>,
        );
      });

      await waitFor(() => {
        expect(context).toBeInstanceOf(Object);
        expect(context.t).toBeInstanceOf(Function);
        expect(context.tDateTimeParser).toBeInstanceOf(Function);
      });
    });

    it('should use i18n provided in props', async () => {
      const i18nInstance = new Streami18n();
      await i18nInstance.init();
      // `t` is a state-backed getter, so it cannot be assigned; `overrideTFunction` publishes to
      // the store that `<Chat>` subscribes to.
      const overridden = (() => 'overridden') as never;
      i18nInstance.overrideTFunction(overridden);

      let context: ChatContextValue;
      render(
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <TranslationContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );

      await waitFor(() => {
        expect(context.t).toBe(overridden);
        expect(context.tDateTimeParser).toBe(i18nInstance.tDateTimeParser);
      });
    });

    it('props change should update the context', async () => {
      const i18nInstance = new Streami18n();
      await i18nInstance.init();
      const firstT = (() => 'first') as never;
      i18nInstance.overrideTFunction(firstT);

      let context: ChatContextValue;
      const { rerender } = render(
        <Chat client={chatClient} i18nInstance={i18nInstance}>
          <TranslationContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );

      await waitFor(() => {
        expect(context.t).toBe(firstT);
        expect(context.tDateTimeParser).toBe(i18nInstance.tDateTimeParser);
      });

      const newI18nInstance = new Streami18n();
      await newI18nInstance.init();
      const secondT = (() => 'second') as never;
      newI18nInstance.overrideTFunction(secondT);

      rerender(
        <Chat client={chatClient} i18nInstance={newI18nInstance}>
          <TranslationContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );
      await waitFor(() => {
        expect(context.t).toBe(secondT);
        expect(context.t).not.toBe(firstT);
        expect(context.tDateTimeParser).toBe(newI18nInstance.tDateTimeParser);
      });
    });
  });
});
