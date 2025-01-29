import React from 'react';

import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { act, cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Chat } from '../../Chat';
import { DateSeparator } from '../DateSeparator';
import { getTestClient } from '../../../mock-builders';
import { Streami18n } from '../../../i18n';

Dayjs.extend(calendar);

afterEach(cleanup);

const DATE_SEPARATOR_TEST_ID = 'date-separator';
const dateMock = 'the date';
const date = new Date('2020-03-30T22:57:47.173Z');
const formatDate = () => dateMock;

const renderComponent = async ({ chatProps, props }) => {
  let result;
  await act(() => {
    result = render(
      <Chat client={getTestClient()} {...chatProps}>
        <DateSeparator {...props} />
      </Chat>,
    );
  });
  return result;
};

describe('DateSeparator', () => {
  it('should use the default formatting with calendar', async () => {
    await renderComponent({ props: { date } });
    expect(screen.queryByText(Dayjs(date.toISOString()).calendar())).toBeInTheDocument();
  });

  it('should apply custom formatting options from i18n service', async () => {
    await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/DateSeparator':
              '{{ timestamp | timestampFormatter(calendar: false, format: "YYYY") }}',
          },
        }),
      },
      props: { date },
    });
    expect(screen.queryByTestId(DATE_SEPARATOR_TEST_ID)).toHaveTextContent(
      date.getFullYear().toString(),
    );
  });

  it('should combine default formatting options from 18n service with those passed through props', async () => {
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
        date,
      },
    });
    expect(screen.queryByTestId(DATE_SEPARATOR_TEST_ID)).toHaveTextContent(
      `F ${date.getFullYear().toString()}`,
    );
  });

  it('ignores calendarFormats if calendar is not enabled', async () => {
    await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/DateSeparator':
              '{{ timestamp | timestampFormatter(calendar: false, format: "YYYY") }}',
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
        date,
      },
    });

    expect(screen.queryByTestId(DATE_SEPARATOR_TEST_ID)).toHaveTextContent(
      date.getFullYear().toString(),
    );
  });

  it('should combine custom formatting options from i18n service with those passed through props', async () => {
    await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/DateSeparator':
              '{{ timestamp | timestampFormatter(calendar: false) }}',
          },
        }),
      },
      props: { date, format: 'YYYY' },
    });
    expect(screen.queryByTestId(DATE_SEPARATOR_TEST_ID)).toHaveTextContent(
      date.getFullYear().toString(),
    );
  });

  it('should format date with formatDate instead of defaults provided with i18n service', async () => {
    const { queryByText } = await renderComponent({
      props: { date, formatDate },
    });
    expect(queryByText('the date')).toBeInTheDocument();
  });

  it('should format date with formatDate instead of customs provided with i18n service', async () => {
    await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/DateSeparator':
              '{{ timestamp | timestampFormatter(calendar: false, format: "YYYY") }}',
          },
        }),
      },
      props: { date, formatDate },
    });
    expect(screen.queryByTestId(DATE_SEPARATOR_TEST_ID)).toHaveTextContent(dateMock);
  });

  it('should format date with formatDate instead of customs provided via props', async () => {
    await renderComponent({
      chatProps: {
        i18nInstance: new Streami18n({
          translationsForLanguage: {
            'timestamp/DateSeparator':
              '{{ timestamp | timestampFormatter(calendar: false) }}',
          },
        }),
      },
      props: { date, format: 'YYYY', formatDate },
    });
    expect(screen.queryByTestId(DATE_SEPARATOR_TEST_ID)).toHaveTextContent(dateMock);
  });

  it('should render New text if unread prop is true', async () => {
    const { container } = await renderComponent({ props: { date, unread: true } });
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="str-chat__date-separator"
          data-testid="date-separator"
        >
          <hr
            class="str-chat__date-separator-line"
          />
          <div
            class="str-chat__date-separator-date"
          >
            New - 03/30/2020
          </div>
        </div>
      </div>
    `);
    expect(screen.getByText('New - 03/30/2020')).toBeInTheDocument();
  });

  describe('Position prop', () => {
    const renderWithPosition = (position) => (
      <DateSeparator date={date} formatDate={formatDate} position={position} />
    );

    it('should render correctly with position==="right", and it should match the default', () => {
      const { container } = render(renderWithPosition('right'));
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            class="str-chat__date-separator"
            data-testid="date-separator"
          >
            <hr
              class="str-chat__date-separator-line"
            />
            <div
              class="str-chat__date-separator-date"
            >
              the date
            </div>
          </div>
        </div>
      `);
      expect(render(renderWithPosition()).container).toMatchInlineSnapshot(`
        <div>
          <div
            class="str-chat__date-separator"
            data-testid="date-separator"
          >
            <hr
              class="str-chat__date-separator-line"
            />
            <div
              class="str-chat__date-separator-date"
            >
              the date
            </div>
          </div>
        </div>
      `);
    });

    it('should render correctly with position==="left"', () => {
      const { container } = render(renderWithPosition('left'));
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            class="str-chat__date-separator"
            data-testid="date-separator"
          >
            <div
              class="str-chat__date-separator-date"
            >
              the date
            </div>
            <hr
              class="str-chat__date-separator-line"
            />
          </div>
        </div>
      `);
    });

    it('should render correctly with position==="center"', () => {
      const { container } = render(renderWithPosition('center'));
      expect(container).toMatchInlineSnapshot(`
        <div>
          <div
            class="str-chat__date-separator"
            data-testid="date-separator"
          >
            <hr
              class="str-chat__date-separator-line"
            />
            <div
              class="str-chat__date-separator-date"
            >
              the date
            </div>
            <hr
              class="str-chat__date-separator-line"
            />
          </div>
        </div>
      `);
    });
  });
});
