import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { generateMessage } from '../../../mock-builders';
import MessageDeleted from '../MessageDeleted';
import { TranslationContext } from '../../../context';

function renderComponent(
  isMyMessage = () => true,
  message = generateMessage(),
) {
  const t = jest.fn((key) => key);
  return render(
    <TranslationContext.Provider value={{ t }}>
      <MessageDeleted message={message} isMyMessage={isMyMessage} />
    </TranslationContext.Provider>,
  );
}
const messageDeletedTestId = 'message-deleted-component';
const ownMessageCssClass = 'str-chat__message--me';
describe('MessageDeleted component', () => {
  it('should inform that the message was deleted', () => {
    const { queryByText } = renderComponent();
    expect(queryByText('This message was deleted...')).toBeInTheDocument();
  });

  it('should set specific css class when message is from current user', () => {
    const { queryByTestId } = renderComponent(() => true);
    expect(queryByTestId(messageDeletedTestId).className).toContain(
      ownMessageCssClass,
    );
  });

  it('should not set specific css class when message is not from current user', () => {
    const { queryByTestId } = renderComponent(() => false);
    expect(queryByTestId(messageDeletedTestId).className).not.toContain(
      ownMessageCssClass,
    );
  });

  it('should set specific css class based on message type', () => {
    const type = 'message.read';
    const { queryByTestId } = renderComponent(
      () => true,
      generateMessage({ type }),
    );
    expect(queryByTestId(messageDeletedTestId).className).toContain(type);
  });
});
