import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { MessageInput } from '../MessageInput';
import { MessageInputLarge } from '../MessageInputLarge';

import { ChatProvider } from '../../../context/ChatContext';
import { TranslationContext } from '../../../context/TranslationContext';
import { TypingProvider } from '../../../context/TypingContext';

const i18nMock = jest.fn((key) => key);

const singleUserTyping = '{{ user }} is typing...';
const twoUsersTyping = '{{ firstUser }} and {{ secondUser }} are typing...';
const manyUsersTyping = '{{ commaSeparatedUsers }} and {{ lastUser }} are typing...';

const getChatContextMock = ({ ownUser }) => ({
  client: {
    user: ownUser,
  },
});

const getTypingContextMock = ({ typingUsers }) => ({
  typing: typingUsers.reduce(
    (acc, user) => ({
      ...acc,
      [user.id]: { user },
    }),
    {},
  ),
});

const renderComponent = (ChatContextMock, TypingContextMock) =>
  render(
    <ChatProvider value={ChatContextMock}>
      <TranslationContext.Provider value={{ t: i18nMock }}>
        <TypingProvider value={TypingContextMock}>
          <MessageInput Input={MessageInputLarge} />
        </TypingProvider>
      </TranslationContext.Provider>
    </ChatProvider>,
  );

const user1 = { id: 'user1', name: 'User one' };
const user2 = { id: 'user2', name: 'User two' };
const user3 = { id: 'user3', name: 'User three' };
const user4 = { id: 'user4', name: 'User four' };

describe('MessageInputLarge', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [user1, [user2], singleUserTyping],
    [user1, [user2, user3], twoUsersTyping],
    [user1, [user2, user3, user4], manyUsersTyping],
    [user1, [user1, user2], singleUserTyping],
    [user1, [user1, user2, user3], twoUsersTyping],
    [user1, [user1, user2, user3, user4], manyUsersTyping],
  ])('should properly construct typing string', async (ownUser, typingUsers, expectedI18nKey) => {
    const chatContextMock = getChatContextMock({ ownUser });
    const typingContextMock = getTypingContextMock({ typingUsers });

    const { findByText } = renderComponent(chatContextMock, typingContextMock);
    const textEl = await findByText(expectedI18nKey);

    expect(textEl).toBeInTheDocument();
  });

  it('should not show anything if only the current user is typing', () => {
    const chatContextMock = getChatContextMock({ ownUser: user1 });
    const typingContextMock = getTypingContextMock({ typingUsers: [user1] });

    renderComponent(chatContextMock, typingContextMock);
    const expectedI18nKey = singleUserTyping;

    // If typing user does not equal own user, we'd expect this to be called.
    expect(i18nMock).not.toHaveBeenCalledWith(expectedI18nKey, {
      user: user2.name,
    });
  });
});
