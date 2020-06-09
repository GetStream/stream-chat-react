import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MessageInput, MessageInputLarge } from '../index';
import { ChannelContext } from '../../../context/ChannelContext';
import { TranslationContext } from '../../../context/TranslationContext';

const i18nMock = jest.fn((key) => key);

const singleUserTyping = '{{ user }} is typing...';
const twoUsersTyping = '{{ firstUser }} and {{ secondUser }} are typing...';
const manyUsersTyping =
  '{{ commaSeparatedUsers }} and {{ lastUser }} are typing...';

const getChannelContextMock = ({ ownUser, typingUsers }) => ({
  client: {
    user: ownUser,
  },
  typing: typingUsers.reduce(
    (acc, user) => ({
      ...acc,
      [user.id]: { user },
    }),
    {},
  ),
});

const renderComponent = (channelContextMock) =>
  render(
    <ChannelContext.Provider value={channelContextMock}>
      <TranslationContext.Provider value={{ t: i18nMock }}>
        <MessageInput Input={MessageInputLarge} />
      </TranslationContext.Provider>
    </ChannelContext.Provider>,
  );

const user1 = { name: 'User one', id: 'user1' };
const user2 = { name: 'User two', id: 'user2' };
const user3 = { name: 'User three', id: 'user3' };
const user4 = { name: 'User four', id: 'user4' };

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
  ])(
    'should properly construct typing string',
    async (ownUser, typingUsers, expectedI18nKey) => {
      const channelContextMock = getChannelContextMock({
        ownUser,
        typingUsers,
      });
      const { findByText } = renderComponent(channelContextMock);
      const textEl = await findByText(expectedI18nKey);
      expect(textEl).toBeInTheDocument();
    },
  );

  it('should not show anything if only the current user is typing', () => {
    const channelContextMock = getChannelContextMock({
      ownUser: user1,
      typingUsers: [user1],
    });
    renderComponent(channelContextMock);
    const expectedI18nKey = singleUserTyping;
    // If typing user does not equal own user, we'd expect this to be called.
    expect(i18nMock).not.toHaveBeenCalledWith(expectedI18nKey, {
      user: user2.name,
    });
  });
});
