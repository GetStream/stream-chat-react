import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatAutoComplete from '../ChatAutoComplete';
import {
  generateMember,
  generateUser,
  generateMessage,
} from '../../../mock-builders';
import { ChannelContext } from '../../../context';

const user = generateUser({ name: 'name', id: 'id' });
const channelContextMock = {
  channel: {
    state: {
      messages: [generateMessage({ user })],
      members: [generateMember({ user })],
      watchers: [user],
    },
  },
};

const renderComponent = async (
  props = {},
  channelContext = channelContextMock,
) => {
  const placeholderText = props.placeholder || 'placeholder';
  const renderResult = render(
    <ChannelContext.Provider value={channelContext}>
      <ChatAutoComplete {...props} placeholder={placeholderText} />
    </ChannelContext.Provider>,
  );
  const textarea = await renderResult.findByPlaceholderText(placeholderText);
  const typeText = (text) => {
    fireEvent.change(textarea, {
      target: {
        value: text,
        selectionEnd: text.length,
      },
    });
  };
  return { ...renderResult, typeText, textarea };
};

describe('ChatAutoComplete', () => {
  it('should call onChange with the change event when you type in the input', async () => {
    const onChange = jest.fn();
    const { typeText } = await renderComponent({ onChange });
    typeText('something');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: 'something',
        }),
      }),
    );
  });

  it('should pass the placeholder prop into the textarea', async () => {
    const placeholder = 'something';
    const { getByPlaceholderText } = await renderComponent({ placeholder });

    expect(getByPlaceholderText(placeholder)).toBeInTheDocument();
  });

  it('should pass the disabled prop to the textarea', async () => {
    const { textarea } = await renderComponent({ disabled: true });

    expect(textarea).toBeDisabled();
  });

  it('should let you select emojis when you type :<emoji>', async () => {
    const emojiAutocompleteText = ':smile';
    const { typeText, findByText, textarea } = await renderComponent();
    typeText(emojiAutocompleteText);
    const emoji = await findByText('😄');

    expect(emoji).toBeInTheDocument();

    fireEvent.click(emoji);

    expect(textarea.value).toContain('😄');
  });

  it('should let you select users when you type @<username>', async () => {
    const onSelectItem = jest.fn();
    const userAutocompleteText = `@${user.name}`;
    const { typeText, findByText } = await renderComponent({ onSelectItem });
    typeText(userAutocompleteText);
    const userText = await findByText(user.name);

    expect(userText).toBeInTheDocument();

    fireEvent.click(userText);

    expect(onSelectItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
      }),
    );
  });

  it('should let you select users when you type @<userid>', async () => {
    const onSelectItem = jest.fn();
    const userAutocompleteText = `@${user.id}`;
    const { typeText, findByText } = await renderComponent({ onSelectItem });
    typeText(userAutocompleteText);
    const userText = await findByText(user.name);

    expect(userText).toBeInTheDocument();

    fireEvent.click(userText);

    expect(onSelectItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
      }),
    );
  });

  it('should use the queryMembers API for mentions if a channel has many members', async () => {
    const users = Array(100).fill().map(generateUser);
    const members = users.map((u) => generateMember({ user: u }));
    const messages = [generateMessage({ user: users[0] })];
    const queryMembers = jest.fn(() => Promise.resolve({ members }));

    const onSelectItem = jest.fn();
    const { typeText, findByText } = await renderComponent(
      { onSelectItem },
      {
        channel: {
          state: {
            members,
            messages,
            watchers: users,
          },
          queryMembers,
        },
      },
    );
    const mentionedUser = users[0];

    typeText(`@${mentionedUser.name}`);

    await waitFor(() => expect(queryMembers).toHaveBeenCalledTimes(1));

    const userText = await findByText(mentionedUser.name);

    expect(userText).toBeInTheDocument();

    fireEvent.click(userText);

    expect(onSelectItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mentionedUser.id,
      }),
    );
  });

  it('should let you select commands when you type /<command>', async () => {
    const commandAutocompleteText = '/giph';
    const { typeText, findByText, textarea } = await renderComponent({
      commands: [
        {
          name: 'giphy',
          description: 'Post a random gif to the channel',
          args: '[text]',
          set: 'fun_set',
        },
      ],
    });
    typeText(commandAutocompleteText);
    const command = await findByText('giphy');

    expect(command).toBeInTheDocument();

    fireEvent.click(command);

    expect(textarea.value).toContain('/giphy');
  });
});
