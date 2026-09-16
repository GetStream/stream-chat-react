import React, { useContext } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { OwnUserResponse, StreamChat } from 'stream-chat';
import { ChannelPaginator, WS_OFFLINE_ANNOUNCE_DELAY_MS } from 'stream-chat';

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

    // No modal open: mirrors a dialog that closed optimistically before emitting its confirmation
    // (e.g. "Poll sent"). The notification is still tagged `target:modal` from when the dialog was
    // open, but its modal list is gone — it must fall back to its channel panel, not vanish.
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

      // the app owns its lists — unmounting Chat must not drop them
      expect(client.channelManager.paginators).toStrictEqual([paginator]);
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
      // First load, mutes are initialized empty
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
      // Chat client loads mutes information
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
    /**
     * Takes the socket down and waits out the window the banner holds a drop for.
     *
     * The client publishes every transition as it happens; deciding a drop has lasted long enough to
     * be worth telling a person about is the banner's job, so a test that wants the banner has to
     * let that window pass.
     */
    const dropSocket = (client: StreamChat) => {
      vi.useFakeTimers();
      try {
        act(() => setWSConnectionStatus(client, false));
        act(() => {
          vi.advanceTimersByTime(WS_OFFLINE_ANNOUNCE_DELAY_MS);
        });
      } finally {
        vi.useRealTimers();
      }
    };

    it('keeps the notification when the socket drops before i18n has initialized', async () => {
      // The regression. `Streami18n.init()` is asynchronous and `t` changes identity when it
      // resolves. With `t` in the effect's dependencies, a drop during that window published the
      // notification and then had it dismissed by the effect's own cleanup — leaving no banner
      // exactly when one is most wanted: an offline app launch, a captive portal, an expired token.
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

      // Deliberately not awaiting anything first — the drop lands inside the init window.
      dropSocket(client);
      expect(chatNotifications()).toHaveLength(1);

      // Long enough for `init()` to resolve and `t` to be replaced.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(chatNotifications()).toHaveLength(1);
    });

    /**
     * The device losing its network and the socket dying are different facts, so they get different
     * copy. Publishing "Waiting for network…" off the socket alone — which is what this did — told
     * users their network was down when the server had closed the socket, the token had expired or a
     * health check had timed out on working Wi-Fi.
     */
    const chatNotificationsOf = (client: StreamChat) =>
      client.notifications.notifications.filter(
        (notification) => notification.origin.emitter === 'Chat',
      );

    it('says reconnecting, not offline, when the socket dies on a working network', async () => {
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

      // One banner throughout, with the more specific message replacing the general one.
      await waitFor(() =>
        expect(chatNotificationsOf(client)[0].message).toBe('Waiting for network…'),
      );
      expect(chatNotificationsOf(client)).toHaveLength(1);
    });

    it('publishes immediately when the client is already offline at mount', async () => {
      // It used to react only to transitions, so a client that was already offline showed nothing
      // until something changed.
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

    it('shows nothing for a drop the socket recovers from inside the window', async () => {
      // The reason the banner holds a drop at all. The socket retries on its own and most drops
      // resolve in well under a second; announcing those makes a working application look broken.
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
          vi.advanceTimersByTime(WS_OFFLINE_ANNOUNCE_DELAY_MS - 1);
        });
        // Nothing yet, and nothing later either: coming back cancels the held drop rather than
        // showing it and then removing it.
        expect(chatNotificationsOf(client)).toHaveLength(0);

        act(() => setWSConnectionStatus(client, true));
        act(() => {
          vi.advanceTimersByTime(WS_OFFLINE_ANNOUNCE_DELAY_MS * 2);
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
      // `t` is a state-backed getter now, so it cannot be assigned. Swapping the translator is what
      // `overrideTFunction` is for -- it publishes to the store, which is what `<Chat>` subscribes to.
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
