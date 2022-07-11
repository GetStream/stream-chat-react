import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageRepliesCountButton } from '../MessageRepliesCountButton';
import { ChatProvider, TranslationProvider } from '../../../context';

const onClickMock = jest.fn();
const defaultSingularText = '1 reply';
const defaultPluralText = '2 replies';

const i18nMock = (key, { count }) => (count > 1 ? defaultPluralText : defaultSingularText);

const renderComponent = (props, themeVersion = '1') =>
  render(
    <ChatProvider value={{ themeVersion }}>
      <TranslationProvider value={{ t: i18nMock }}>
        <MessageRepliesCountButton {...props} onClick={onClickMock} />
      </TranslationProvider>
    </ChatProvider>,
  );

describe('MessageRepliesCountButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render the right text when there is one reply, and labelSingle is not defined', () => {
    const { getByText } = renderComponent({ reply_count: 1 });

    expect(getByText(defaultSingularText)).toBeInTheDocument();
  });

  it('should render the right text when there is one reply, and labelSingle is defined', () => {
    const customSingularLabel = 'text';
    const { getByText } = renderComponent({ labelSingle: customSingularLabel, reply_count: 1 });

    expect(getByText(`1 ${customSingularLabel}`)).toBeInTheDocument();
  });

  it('should render the right text when there is more than one reply, and labelPlural is not defined', () => {
    const { getByText } = renderComponent({ reply_count: 2 });

    expect(getByText(defaultPluralText)).toBeInTheDocument();
  });

  it('should render the right text when there is more than one reply, and labelPlural is defined', () => {
    const customPluralLabel = 'text';
    const { getByText } = renderComponent({ labelPlural: customPluralLabel, reply_count: 2 });

    expect(getByText(`2 ${customPluralLabel}`)).toBeInTheDocument();
  });

  it('should call the onClick prop if the button is clicked', () => {
    const { getByTestId } = renderComponent({
      reply_count: 1,
    });
    fireEvent.click(getByTestId('replies-count-button'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should not render anything if reply_count is 0 or undefined', () => {
    const { queryByTestId } = renderComponent({
      reply_count: 0,
    });

    expect(queryByTestId('replies-count-button')).not.toBeInTheDocument();
  });

  it('should not render ReplyIcon for theming v2', () => {
    const themeVersion = '2';
    const { queryByTestId } = renderComponent(
      {
        reply_count: 1,
      },
      themeVersion,
    );
    expect(queryByTestId('reply-icon')).not.toBeInTheDocument();
  });
});
