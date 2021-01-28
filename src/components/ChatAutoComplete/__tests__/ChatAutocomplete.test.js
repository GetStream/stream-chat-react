import React, { useEffect, useContext } from 'react';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import ChatAutoComplete from '../ChatAutoComplete';
import {
  useMockedApis,
  queryMembersApi,
  generateMember,
  generateUser,
  generateMessage,
  generateChannel,
  getTestClientWithUser,
  getOrCreateChannelApi,
} from '../../../mock-builders';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { ChatContext } from '../../../context';

let chatClient;
let channel;
const user = generateUser({ name: 'name', id: 'id' });

const ActiveChannelSetter = ({ activeChannel }) => {
  const { setActiveChannel } = useContext(ChatContext);
  useEffect(() => {
    setActiveChannel(activeChannel);
  });
  return null;
};

const renderComponent = async (props = {}, activeChannel = channel) => {
  const placeholderText = props.placeholder || 'placeholder';
  const renderResult = render(
    <Chat client={chatClient}>
      <ActiveChannelSetter activeChannel={activeChannel} />
      <Channel>
        <ChatAutoComplete {...props} placeholder={placeholderText} />
      </Channel>
    </Chat>,
  );
  const textarea = await waitFor(() =>
    renderResult.getByPlaceholderText(placeholderText),
  );
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
  beforeEach(async () => {
    const messages = [generateMessage({ user })];
    const members = [generateMember({ user })];
    const mockedChannel = generateChannel({
      messages,
      members,
    });
    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    channel = chatClient.channel('messaging', mockedChannel.id);
  });

  afterEach(cleanup);

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
    const { typeText, getAllByText } = await renderComponent({ onSelectItem });
    typeText(userAutocompleteText);
    const userText = await getAllByText(user.name);

    expect(userText).toHaveLength(2);

    fireEvent.click(userText[1]);

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

  it('should disable mention popup list', async () => {
    const onSelectItem = jest.fn();
    const userAutocompleteText = `@${user.name}`;
    const { typeText, queryAllByText } = await renderComponent({
      onSelectItem,
      disableMentions: true,
    });
    typeText(userAutocompleteText);
    const userText = await queryAllByText(user.name);

    expect(userText).toHaveLength(0);
  });

  it('should use the queryMembers API for mentions if a channel has many members', async () => {
    const users = Array(100).fill().map(generateUser);
    const members = users.map((u) => generateMember({ user: u }));
    const messages = [generateMessage({ user: users[0] })];
    const mockedChannel = generateChannel({
      messages,
      members,
    });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const activeChannel = chatClient.channel('messaging', mockedChannel.id);
    const searchMember = members[0];
    useMockedApis(chatClient, [queryMembersApi([searchMember])]);

    const onSelectItem = jest.fn();
    const { typeText, findByText } = await renderComponent({
      onSelectItem,
      activeChannel,
    });
    const mentionedUser = searchMember.user;

    typeText(`@${mentionedUser.id}`);

    const userText = await findByText(mentionedUser.name);
    expect(userText).toBeInTheDocument();

    fireEvent.click(userText);

    expect(onSelectItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mentionedUser.id,
      }),
    );
  });
});
