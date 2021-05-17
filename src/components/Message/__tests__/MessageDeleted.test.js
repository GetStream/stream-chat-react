/* eslint-disable jest-dom/prefer-to-have-class */
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { MessageDeleted } from '../MessageDeleted';

import { ChatProvider } from '../../../context/ChatContext';
import { TranslationProvider } from '../../../context/TranslationContext';
import { generateMessage, generateUser, getTestClientWithUser } from '../../../mock-builders';

const alice = generateUser();
const bob = generateUser();

async function renderComponent(message = generateMessage()) {
  const t = jest.fn((key) => key);
  const client = await getTestClientWithUser(alice);

  return render(
    <ChatProvider value={{ client }}>
      <TranslationProvider value={{ t }}>
        <MessageDeleted message={message} />
      </TranslationProvider>
    </ChatProvider>,
  );
}

const messageDeletedTestId = 'message-deleted-component';
const ownMessageCssClass = 'str-chat__message--me';
describe('MessageDeleted component', () => {
  it('should inform that the message was deleted', async () => {
    const { queryByText } = await renderComponent();
    expect(queryByText('This message was deleted...')).toBeInTheDocument();
  });

  it('should set specific css class when message is from current user', async () => {
    const { queryByTestId } = await renderComponent(generateMessage({ user: alice }));
    expect(queryByTestId(messageDeletedTestId).className).toContain(ownMessageCssClass);
  });

  it('should not set specific css class when message is not from current user', async () => {
    const { queryByTestId } = await renderComponent(generateMessage({ user: bob }));
    expect(queryByTestId(messageDeletedTestId).className).not.toContain(ownMessageCssClass);
  });

  it('should set specific css class based on message type', async () => {
    const type = 'message.read';
    const { queryByTestId } = await renderComponent(generateMessage({ type }));
    expect(queryByTestId(messageDeletedTestId).className).toContain(type);
  });
});
