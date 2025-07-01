import React from 'react';

import { act, cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EventComponent } from '../EventComponent';
import { Chat } from '../../Chat';
import { getTestClient } from '../../../mock-builders';
import { Streami18n } from '../../../i18n';

const SYSTEM_MSG_TEST_ID = 'message-system';

jest.mock('../../Avatar', () => ({
  Avatar: jest.fn(({ image = '', name = '' }) => (
    <img data-testid='avatar' name={name} src={image} />
  )),
}));

describe('EventComponent', () => {
  afterEach(cleanup);

  const message = {
    created_at: new Date('2020-03-13T10:18:38.148025Z'),
    type: 'system',
  };

  const renderComponent = async ({ chatProps, props } = {}) => {
    let result;
    await act(() => {
      result = render(
        <Chat client={getTestClient()} {...chatProps}>
          <EventComponent message={message} {...props} />
        </Chat>,
      );
    });
    return result;
  };

  it('should render null for empty message', () => {
    const { container } = render(<EventComponent message={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('should render system events', async () => {
    const { container } = await renderComponent({
      props: { message: { ...message, text: 'system event' } },
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__message--system"
          data-testid="message-system"
        >
          <div
            class="str-chat__message--system__text"
          >
            <div
              class="str-chat__message--system__line"
            />
            <p>
              system event
            </p>
            <div
              class="str-chat__message--system__line"
            />
          </div>
          <div
            class="str-chat__message--system__date"
          >
            <strong>
              Friday 03/13/2020
            </strong>
          </div>
        </div>
      </div>
    `);
  });

  describe('timestamp formatting', () => {
    it('should format date with default formatting rules provided by i18n service', async () => {
      await renderComponent();
      expect(screen.getByTestId(SYSTEM_MSG_TEST_ID)).toHaveTextContent(
        'Friday 03/13/2020',
      );
    });

    it('should format date with custom formatting rules provided by i18n service', async () => {
      await renderComponent({
        chatProps: {
          i18nInstance: new Streami18n({
            translationsForLanguage: {
              'timestamp/SystemMessage':
                '{{ timestamp | timestampFormatter(format: "YYYY") }}',
            },
          }),
        },
      });
      expect(screen.getByTestId(SYSTEM_MSG_TEST_ID)).toHaveTextContent('2020');
    });

    it('should combine the custom date formatting rules from i18n service with custom formatting props', async () => {
      await renderComponent({
        chatProps: {
          i18nInstance: new Streami18n({
            translationsForLanguage: {
              'timestamp/SystemMessage':
                '{{ timestamp | timestampFormatter(calendar: true) }}',
            },
          }),
        },
        props: {
          calendarFormats: {
            lastDay: 'A YYYY',
            lastWeek: 'B YYYY',
            nextDay: 'C YYYY',
            nextWeek: 'D YYYY',
            sameDay: 'E YYYY',
            sameElse: 'F YYYY',
          },
        },
      });
      expect(screen.getByTestId(SYSTEM_MSG_TEST_ID)).toHaveTextContent('F 2020');
    });

    it('should override the default date formatting rules from i18n service with custom formatting props', async () => {
      await renderComponent({
        props: {
          calendar: true,
          calendarFormats: {
            lastDay: 'A YYYY',
            lastWeek: 'B YYYY',
            nextDay: 'C YYYY',
            nextWeek: 'D YYYY',
            sameDay: 'E YYYY',
            sameElse: 'F YYYY',
          },
        },
      });
      expect(screen.getByTestId(SYSTEM_MSG_TEST_ID)).toHaveTextContent('F 2020');
    });

    it('should override the custom date formatting rules from i18n service with custom formatting props', async () => {
      await renderComponent({
        chatProps: {
          i18nInstance: new Streami18n({
            translationsForLanguage: {
              'timestamp/SystemMessage':
                '{{ timestamp | timestampFormatter(calendar: false) }}',
            },
          }),
        },
        props: {
          calendar: true,
          calendarFormats: {
            lastDay: 'A YYYY',
            lastWeek: 'B YYYY',
            nextDay: 'C YYYY',
            nextWeek: 'D YYYY',
            sameDay: 'E YYYY',
            sameElse: 'F YYYY',
          },
        },
      });
      expect(screen.getByTestId(SYSTEM_MSG_TEST_ID)).toHaveTextContent('F 2020');
    });

    it('ignores calendarFormats if calendar is not enabled', async () => {
      await renderComponent({
        props: {
          calendarFormats: {
            lastDay: 'A YYYY',
            lastWeek: 'B YYYY',
            nextDay: 'C YYYY',
            nextWeek: 'D YYYY',
            sameDay: 'E YYYY',
            sameElse: 'F YYYY',
          },
        },
      });
      expect(screen.getByTestId(SYSTEM_MSG_TEST_ID)).toHaveTextContent(
        'Friday 03/13/2020',
      );
    });
  });

  describe('Channel events', () => {
    it('should render message for member add event', () => {
      const message = {
        created_at: '2020-01-13T18:18:38.148025Z',
        event: {
          type: 'member.added',
          user: { id: 'user_id', image: 'image_url', username: 'username' },
        },
        type: 'channel.event',
      };

      const { container } = render(<EventComponent message={message} />);
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            class="str-chat__event-component__channel-event"
          >
            <img
              data-testid="avatar"
              name="user_id"
              src="image_url"
            />
            <div
              class="str-chat__event-component__channel-event__content"
            >
              <em
                class="str-chat__event-component__channel-event__sentence"
              >
                user_id has joined the chat
              </em>
              <div
                class="str-chat__event-component__channel-event__date"
              >
                6:18 PM
              </div>
            </div>
          </div>
        </div>
      `);
    });

    it('should render message for member remove event', () => {
      const message = {
        created_at: '2020-01-13T18:18:38.148025Z',
        event: {
          type: 'member.removed',
          user: { id: 'user_id', image: 'image_url', username: 'username' },
        },
        type: 'channel.event',
      };

      const { container } = render(<EventComponent message={message} />);
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            class="str-chat__event-component__channel-event"
          >
            <img
              data-testid="avatar"
              name="user_id"
              src="image_url"
            />
            <div
              class="str-chat__event-component__channel-event__content"
            >
              <em
                class="str-chat__event-component__channel-event__sentence"
              >
                user_id was removed from the chat
              </em>
              <div
                class="str-chat__event-component__channel-event__date"
              >
                6:18 PM
              </div>
            </div>
          </div>
        </div>
      `);
    });
  });
});
