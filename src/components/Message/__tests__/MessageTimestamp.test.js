import React from 'react';
import '@testing-library/jest-dom';
import renderer from 'react-test-renderer';
import { cleanup, render } from '@testing-library/react';
import { generateMessage } from 'mock-builders';
import MessageTimestamp, {
  defaultTimestampFormat,
  notValidDateWarning,
} from '../MessageTimestamp';
import { TranslationContext } from '../../../context';

const messageMock = generateMessage({
  created_at: '2019-04-03T14:42:47.087869Z',
});
describe('<MessageTimestamp />', () => {
  afterEach(cleanup);

  it('should render correctly', () => {
    const tree = renderer
      .create(<MessageTimestamp message={messageMock} />)
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <time
        className=""
        dateTime="2019-04-03T14:42:47.087869Z"
        title="2019-04-03T14:42:47.087869Z"
      >
        2:42PM
      </time>
    `);
  });

  it('should not render if no message is available', () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const { container } = render(<MessageTimestamp message={undefined} />);
    expect(container.children).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(notValidDateWarning);
  });

  it('should not render if message created_at is not a valid date', () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const message = generateMessage({ created_at: 'I am not a date' });
    const { container } = render(<MessageTimestamp message={message} />);
    expect(container.children).toHaveLength(0);
    expect(console.warn).toHaveBeenCalledWith(notValidDateWarning);
  });

  it('should render message created_at date with custom datetime parser if one is set', () => {
    const format = jest.fn();
    const customDateTimeParser = jest.fn(() => ({ format }));
    render(
      <MessageTimestamp
        message={messageMock}
        tDateTimeParser={customDateTimeParser}
      />,
    );
    expect(format).toHaveBeenCalledWith(defaultTimestampFormat);
  });

  it('should render message with custom datetime format if one is set', () => {
    const format = 'LT';
    const { queryByText } = render(
      <MessageTimestamp message={messageMock} format={format} />,
    );
    expect(queryByText('2:42 PM')).toBeInTheDocument();
  });

  it('should render in calendar format if calendar is set to true', () => {
    const calendarDateTimeParser = { calendar: jest.fn() };
    render(
      <TranslationContext.Provider
        value={{
          tDateTimeParser: () => calendarDateTimeParser,
        }}
      >
        <MessageTimestamp message={messageMock} calendar />
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
        <MessageTimestamp message={messageMock} calendar />
      </TranslationContext.Provider>,
    );
    expect(container.children).toHaveLength(0);
  });

  it('should use custom date formater when one is set', () => {
    const customDate = 'Some time ago';
    const formatDate = jest.fn(() => customDate);
    const { queryByText } = render(
      <MessageTimestamp formatDate={formatDate} message={messageMock} />,
    );
    expect(formatDate).toHaveBeenCalledWith(new Date(messageMock.created_at));
    expect(queryByText(customDate)).toBeInTheDocument();
  });

  it('should render message with a custom css class when one is set', () => {
    const customCssClass = 'custom-css-class';
    const tree = renderer
      .create(
        <MessageTimestamp customClass={customCssClass} message={messageMock} />,
      )
      .toJSON();
    expect(tree).toMatchInlineSnapshot(`
      <time
        className="custom-css-class"
        dateTime="2019-04-03T14:42:47.087869Z"
        title="2019-04-03T14:42:47.087869Z"
      >
        2:42PM
      </time>
    `);
  });
});
