import React from 'react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import { generateMessage } from 'mock-builders';
import { MessageTimestamp } from '../MessageTimestamp';
import { MessageProvider, TranslationContext } from '../../../context';
import Dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import { notValidDateWarning } from '../../../i18n/utils';

Dayjs.extend(calendar);

const messageMock = generateMessage({
  created_at: Dayjs(new Date('2019-04-03T14:42:47.087869Z')),
});
describe('<MessageTimestamp />', () => {
  afterEach(cleanup);

  it('should render correctly', () => {
    const tree = renderer
      .create(
        <MessageProvider value={{}}>
          <MessageTimestamp message={messageMock} />
        </MessageProvider>,
      )
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <time
        className=""
        dateTime={"2019-04-03T14:42:47.087Z"}
        title={"2019-04-03T14:42:47.087Z"}
      >
        2:42PM
      </time>
    `);
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

  it('should render message with custom datetime format if one is set', () => {
    const format = 'LT';
    const { queryByText } = render(
      <MessageProvider value={{}}>
        <MessageTimestamp format={format} message={messageMock} />
      </MessageProvider>,
    );
    expect(queryByText('2:42 PM')).toBeInTheDocument();
  });

  it('should render in calendar format if calendar is set to true', () => {
    const calendarDateTimeParser = { calendar: jest.fn(), isSame: true };
    render(
      <TranslationContext.Provider
        value={{
          tDateTimeParser: () => calendarDateTimeParser,
        }}
      >
        <MessageProvider value={{}}>
          <MessageTimestamp calendar message={messageMock} />
        </MessageProvider>
      </TranslationContext.Provider>,
    );
    expect(calendarDateTimeParser.calendar).toHaveBeenCalledTimes(1);
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

  it('should render message with a custom css class when one is set', () => {
    const customCssClass = 'custom-css-class';
    const tree = renderer
      .create(
        <MessageProvider value={{}}>
          <MessageTimestamp customClass={customCssClass} message={messageMock} />
        </MessageProvider>,
      )
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <time
        className="custom-css-class"
        dateTime={"2019-04-03T14:42:47.087Z"}
        title={"2019-04-03T14:42:47.087Z"}
      >
        2:42PM
      </time>
    `);
  });
});
