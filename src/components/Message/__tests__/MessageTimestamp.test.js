import React from 'react';
import '@testing-library/jest-dom';
import { act, cleanup, render } from '@testing-library/react';
import { generateMessage } from 'mock-builders';
import { MessageTimestamp } from '../MessageTimestamp';
import { ComponentProvider, MessageProvider, TranslationContext } from '../../../context';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { notValidDateWarning } from '../../../i18n/utils';
import { Chat } from '../../Chat';
import { getTestClient } from '../../../mock-builders';
import { Streami18n } from '../../../i18n';

Dayjs.extend(calendar);

const calendarFormats = {
  lastDay: 'A YYYY',
  lastWeek: 'B YYYY',
  nextDay: 'C YYYY',
  nextWeek: 'D YYYY',
  sameDay: 'E YYYY',
  sameElse: 'F YYYY',
};

const dateMock = 'the date';
const formatDate = () => dateMock;

const createdAt = new Date('2019-04-03T14:42:47.087869Z');

const messageMock = generateMessage({
  created_at: createdAt,
});

const renderComponent = async ({ chatProps, componentCtx, messageCtx, props } = {}) => {
  let result;
  await act(() => {
    result = render(
      <Chat client={getTestClient()} {...chatProps}>
        <ComponentProvider value={componentCtx || {}}>
          <MessageProvider value={{ message: messageMock, ...messageCtx }}>
            <MessageTimestamp {...props} />
          </MessageProvider>
        </ComponentProvider>
      </Chat>,
    );
  });
  return result;
};

describe('<MessageTimestamp />', () => {
  afterEach(cleanup);

  it('should render correctly', async () => {
    const { container } = await renderComponent();
    expect(container).toMatchInlineSnapshot(`
      <div>
        <time
          datetime="2019-04-03T14:42:47.087Z"
          title="2019-04-03T14:42:47.087Z"
        >
          04/03/2019
        </time>
      </div>
    `);
  });

  it('should render non-Date timestamp value in datetime attribute without processing', async () => {
    const { container } = await renderComponent({
      messageCtx: { message: { ...messageMock, created_at: 28 } },
    });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <time
          datetime="28"
          title="28"
        >
          01/01/1970
        </time>
      </div>
    `);
  });

  it('should prefer message passed through props over the context message', async () => {
    const oneYearMs = 366 * 24 * 60 * 60 * 1000;
    const { container } = await renderComponent({
      props: {
        message: {
          ...messageMock,
          created_at: new Date(messageMock.created_at.getTime() + oneYearMs),
        },
      },
    });
    expect(container).toHaveTextContent('04/03/2020');
  });

  it('should not render if no message is available', () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const { container } = render(
      <MessageProvider value={{}}>
        <MessageTimestamp message={{}} />
      </MessageProvider>,
    );
    expect(container.children).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(notValidDateWarning);
  });

  it('should not render if message created_at is not a valid date', () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const message = generateMessage({ created_at: 'I am not a date' });
    const { container } = render(
      <MessageProvider value={{}}>
        <MessageTimestamp message={message} />
      </MessageProvider>,
    );
    expect(container.children).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(notValidDateWarning);
  });

  it('should render with no format if provided i18n config disables formatting', async () => {
    const { container } = await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/MessageTimestamp':
              '{{ timestamp | timestampFormatter(calendar: false) }}',
          },
        }),
      },
    });
    expect(container).toHaveTextContent('2019-04-03T14:42:47Z');
  });

  it('should render with custom format provided via i18n service', async () => {
    const { container } = await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/MessageTimestamp':
              '{{ timestamp | timestampFormatter(format: h:mmA) }}',
          },
        }),
      },
    });
    expect(container).toHaveTextContent('2:42PM');
  });

  it('should override the default format provided via i18n service with component props', async () => {
    const { container } = await renderComponent({
      props: { format: 'YYYY' },
    });
    expect(container).toHaveTextContent(messageMock.created_at.getFullYear().toString());
  });

  it('should override the custom format provided via i18n service with component props', async () => {
    const { container } = await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/MessageTimestamp':
              '{{ timestamp | timestampFormatter(format: h:mmA) }}',
          },
        }),
      },
      props: { format: 'YYYY' },
    });
    expect(container).toHaveTextContent(messageMock.created_at.getFullYear().toString());
  });

  it('should ignore the custom calendarFormats if calendar is disabled', async () => {
    const { container } = await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/MessageTimestamp':
              '{{ timestamp | timestampFormatter(calendar: false) }}',
          },
        }),
      },
      props: { calendarFormats },
    });
    expect(container).toHaveTextContent('2019-04-03T14:42:47Z');
  });

  it('should reflect the custom calendarFormats if calendar is enabled', async () => {
    const { container } = await renderComponent({
      props: { calendarFormats },
    });
    expect(container).toHaveTextContent('F 2019');
  });

  it('should apply custom formatDate function over custom component props & over custom i18n config', async () => {
    const { container } = await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/MessageTimestamp':
              '{{ timestamp | timestampFormatter(format: h:mmA) }}',
          },
        }),
      },
      messageCtx: { formatDate },
      props: { format: 'YYYY' },
    });
    expect(container).toHaveTextContent(dateMock);
  });

  it('should not render if called in calendar mode but no calendar function is available from the datetime parser', () => {
    const { container } = render(
      <TranslationContext.Provider
        value={{
          tDateTimeParser: () => ({ calendar: undefined }),
        }}
      >
        <MessageProvider value={{}}>
          <MessageTimestamp calendar message={messageMock} />
        </MessageProvider>
      </TranslationContext.Provider>,
    );
    expect(container.children).toHaveLength(0);
  });

  it('should render message with a custom css class when one is set', async () => {
    const customClass = 'custom-css-class';
    const { container } = await renderComponent({ props: { customClass } });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <time
          class="custom-css-class"
          datetime="2019-04-03T14:42:47.087Z"
          title="2019-04-03T14:42:47.087Z"
        >
          04/03/2019
        </time>
      </div>
    `);
  });
});
