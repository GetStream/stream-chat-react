import React from 'react';

import { act, cleanup, render, screen } from '@testing-library/react';

import { Chat } from '../../Chat';
import { DateSeparator } from '../DateSeparator';
import { getTestClient } from '../../../mock-builders';
import { Streami18n } from '../../../i18n';

afterEach(cleanup);

const DATE_SEPARATOR_TEST_ID = 'date-separator';
const dateMock = 'the date';
const date = new Date('2020-03-30T22:57:47.173Z');
const formatDate = () => dateMock;

const renderComponent = async ({ chatProps, props }: any) => {
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
  it('should render the date separator with default formatting', async () => {
    await renderComponent({ props: { date } });
    const separator = screen.getByTestId(DATE_SEPARATOR_TEST_ID);
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('str-chat__date-separator');
    expect(separator).toHaveAttribute('data-date', date.toISOString());
    // The formatted date should be displayed inside a child div
    const dateDiv = separator.querySelector('.str-chat__date-separator-date');
    expect(dateDiv).toBeInTheDocument();
    expect(dateDiv.textContent).toBeTruthy();
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

  it('should render with unread prop (unread no longer changes output)', async () => {
    await renderComponent({ props: { date, unread: true } });
    const separator = screen.getByTestId(DATE_SEPARATOR_TEST_ID);
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveClass('str-chat__date-separator');
    expect(separator).toHaveAttribute('data-date', date.toISOString());
    const dateDiv = separator.querySelector('.str-chat__date-separator-date');
    expect(dateDiv).toBeInTheDocument();
    expect(dateDiv.textContent).toBeTruthy();
  });

  describe('Position prop', () => {
    const renderWithPosition = (position?: any) => (
      <DateSeparator date={date} formatDate={formatDate} position={position} />
    );

    it('should render the same structure regardless of position prop', () => {
      const { container: rightContainer } = render(renderWithPosition('right'));
      const { container: leftContainer } = render(renderWithPosition('left'));
      const { container: centerContainer } = render(renderWithPosition('center'));
      const { container: defaultContainer } = render(renderWithPosition());

      // All positions now render the same simplified structure
      for (const container of [
        rightContainer,
        leftContainer,
        centerContainer,
        defaultContainer,
      ]) {
        const separator = container.querySelector('.str-chat__date-separator');
        expect(separator).toBeInTheDocument();
        expect(separator).toHaveAttribute('data-date', date.toISOString());
        expect(separator).toHaveAttribute('data-testid', DATE_SEPARATOR_TEST_ID);

        const dateDiv = separator.querySelector('.str-chat__date-separator-date');
        expect(dateDiv).toBeInTheDocument();
        expect(dateDiv).toHaveTextContent(dateMock);

        // No <hr> elements in the new structure
        expect(separator.querySelector('hr')).not.toBeInTheDocument();
      }
    });
  });
});
