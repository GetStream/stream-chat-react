import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageRepliesCountButton } from '../MessageRepliesCountButton';
import { TranslationContext } from '../../../context';

const onClickMock = jest.fn();

const i18nMock = (key) => key;

const renderComponent = (props) =>
  render(
    <TranslationContext.Provider value={{ t: i18nMock }}>
      <MessageRepliesCountButton {...props} onClick={onClickMock} />
    </TranslationContext.Provider>,
  );

describe('MessageRepliesCountButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('should render the right text when there is one reply, and labelSingle is not defined', () => {
    const { getByText } = renderComponent({ reply_count: 1 });

    expect(getByText('1 reply')).toBeInTheDocument();
  });

  it('should render the right text when there is one reply, and labelSingle is defined', () => {
    const labelSingle = 'text';
    const { getByText } = renderComponent({ labelSingle, reply_count: 1 });

    expect(getByText(`1 ${labelSingle}`)).toBeInTheDocument();
  });

  it('should render the right text when there is more than one reply, and labelPlural is not defined', () => {
    const { getByText } = renderComponent({ reply_count: 2 });

    expect(getByText('{{ replyCount }} replies')).toBeInTheDocument();
  });

  it('should render the right text when there is more than one reply, and labelPlural is defined', () => {
    const labelPlural = 'text';
    const { getByText } = renderComponent({ labelPlural, reply_count: 2 });

    expect(getByText(`2 ${labelPlural}`)).toBeInTheDocument();
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
});
