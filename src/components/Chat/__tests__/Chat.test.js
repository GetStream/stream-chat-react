import React, { useContext } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Chat } from '..';

import { ChatContext, TranslationContext } from '../../../context';
import { Streami18n } from '../../../i18n';
import { getTestClient } from '../../../mock-builders';

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
      expect(context.navOpen).toBe(true);
      expect(context.theme).toBe('messaging light');
      expect(context.openMobileNav).toBeInstanceOf(Function);
      expect(context.client.getUserAgent()).toBe(
        `stream-chat-react-undefined-${originalUserAgent}`,
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

    it('open fn keeps nav state open', async () => {
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
      act(() => {
        context.openMobileNav();
      });

      await waitFor(() => expect(context.navOpen).toBe(true));
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
