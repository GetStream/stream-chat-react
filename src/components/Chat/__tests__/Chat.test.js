import React, { useContext } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Chat } from '..';

import { ChatContext, TranslationContext } from '../../../context';
import { Streami18n } from '../../../i18n';
import {
  dispatchNotificationMutesUpdated,
  getTestClient,
  getTestClientWithUser,
} from '../../../mock-builders';

import { version } from '../../../../package.json';

const ChatContextConsumer = ({ fn }) => {
  fn(useContext(ChatContext));
  return <div data-testid='children' />;
};

const TranslationContextConsumer = ({ fn }) => {
  fn(useContext(TranslationContext));
  return <div data-testid='children' />;
};

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

  it('should expose the context', async () => {
    let context;
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
      expect(context.channel).toBeUndefined();
      expect(context.mutes).toStrictEqual([]);
      expect(context.navOpen).toBe(true);
      expect(context.theme).toBe('messaging light');
      expect(context.setActiveChannel).toBeInstanceOf(Function);
      expect(context.openMobileNav).toBeInstanceOf(Function);
      expect(context.closeMobileNav).toBeInstanceOf(Function);
      expect(context.client.getUserAgent()).toBe(
        `stream-chat-react-${version}-${originalUserAgent}`,
      );
    });
  });

  it('props change should update the context', async () => {
    const theme = 'team dark';
    let context;
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

    const newTheme = 'messaging dark';
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

  describe('mobile nav', () => {
    it('initialNavOpen prop should set navOpen', async () => {
      let context;
      await act(() => {
        render(
          <Chat client={chatClient} initialNavOpen={false}>
            <ChatContextConsumer
              fn={(ctx) => {
                context = ctx;
              }}
            />
          </Chat>,
        );
      });

      await waitFor(() => expect(context.navOpen).toBe(false));
    });

    it('initialNavOpen prop update should be ignored', async () => {
      let context;
      const { rerender } = render(
        <Chat client={chatClient} initialNavOpen={false}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );
      await waitFor(() => expect(context.navOpen).toBe(false));

      rerender(
        <Chat client={chatClient} initialNavOpen={true}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );
      await waitFor(() => expect(context.navOpen).toBe(false));
    });

    it('open/close fn updates the nav state', async () => {
      let context;
      render(
        <Chat client={chatClient}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );

      await waitFor(() => expect(context.navOpen).toBe(true));
      act(() => context.closeMobileNav());
      await waitFor(() => expect(context.navOpen).toBe(false));
      act(() => {
        context.openMobileNav();
      });

      await waitFor(() => expect(context.navOpen).toBe(true));
    });

    it('setActiveChannel closes the nav', async () => {
      let context;
      render(
        <Chat client={chatClient}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );

      await waitFor(() => expect(context.navOpen).toBe(true));
      await act(() => context.setActiveChannel());
      await waitFor(() => expect(context.navOpen).toBe(false));
    });
  });

  describe('mutes', () => {
    it('init the mute state with client data', async () => {
      const chatClientWithUser = await getTestClientWithUser({ id: 'user_x' });
      // First load, mutes are initialized empty
      chatClientWithUser.user.mutes = [];
      let context;
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
      chatClientWithUser.user.mutes = mutes;
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

      let context;
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
      act(() => dispatchNotificationMutesUpdated(chatClientWithUser, mutes));
      await waitFor(() => expect(context.mutes).toStrictEqual(mutes));

      act(() => dispatchNotificationMutesUpdated(chatClientWithUser, null));
      await waitFor(() => expect(context.mutes).toStrictEqual([]));
    });
  });

  describe('active channel', () => {
    it('setActiveChannel query if there is a watcher', async () => {
      let context;
      render(
        <Chat client={chatClient}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );

      const channel = { cid: 'cid', query: jest.fn() };
      const watchers = { user_y: {} };
      await waitFor(() => expect(context.channel).toBeUndefined());
      await act(() => context.setActiveChannel(channel, watchers));
      await waitFor(() => {
        expect(context.channel).toStrictEqual(channel);
        expect(channel.query).toHaveBeenCalledTimes(1);
        expect(channel.query).toHaveBeenCalledWith({ watch: true, watchers });
      });
    });

    it('setActiveChannel prevent event default', async () => {
      let context;
      render(
        <Chat client={chatClient}>
          <ChatContextConsumer
            fn={(ctx) => {
              context = ctx;
            }}
          />
        </Chat>,
      );

      await waitFor(() => expect(context.setActiveChannel).not.toBeUndefined());

      const e = { preventDefault: jest.fn() };
      await act(() => context.setActiveChannel(undefined, {}, e));
      await waitFor(() => expect(e.preventDefault).toHaveBeenCalledTimes(1));
    });
  });

  describe('translation context', () => {
    it('should expose the context', async () => {
      let context;
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
      await i18nInstance.getTranslators();
      i18nInstance.t = 't';
      i18nInstance.tDateTimeParser = 'tDateTimeParser';

      let context;
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
        expect(context.t).toBe(i18nInstance.t);
        expect(context.tDateTimeParser).toBe(i18nInstance.tDateTimeParser);
      });
    });

    it('props change should update the context', async () => {
      const i18nInstance = new Streami18n();
      await i18nInstance.getTranslators();
      i18nInstance.t = 't';
      i18nInstance.tDateTimeParser = 'tDateTimeParser';

      let context;
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
        expect(context.t).toBe(i18nInstance.t);
        expect(context.tDateTimeParser).toBe(i18nInstance.tDateTimeParser);
      });

      const newI18nInstance = new Streami18n();
      await newI18nInstance.getTranslators();
      newI18nInstance.t = 'newT';
      newI18nInstance.tDateTimeParser = 'newtDateTimeParser';

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
        expect(context.t).toBe(newI18nInstance.t);
        expect(context.tDateTimeParser).toBe(newI18nInstance.tDateTimeParser);
        expect(context.t).not.toBe(i18nInstance.t);
        expect(context.tDateTimeParser).not.toBe(i18nInstance.tDateTimeParser);
      });
    });
  });
});
