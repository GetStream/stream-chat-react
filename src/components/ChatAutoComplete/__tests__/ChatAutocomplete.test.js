import React, { useContext, useEffect } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ChatAutoComplete } from '../ChatAutoComplete';
import {
  generateChannel,
  generateMember,
  generateMessage,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  queryMembersApi,
  useMockedApis,
} from '../../../mock-builders';
import { Chat } from '../../Chat/Chat';
import { Channel } from '../../Channel/Channel';
import { ChatContext } from '../../../context/ChatContext';
import { MessageInput } from '../../MessageInput';
import {
  MessageInputContextProvider,
  useMessageInputContext,
} from '../../../context/MessageInputContext';

let chatClient;
let channel;
const user = generateUser({ id: 'id', name: 'name' });
const mentionUser = generateUser({ id: 'mention-id', name: 'mention-name' });

const ActiveChannelSetter = ({ activeChannel }) => {
  const { setActiveChannel } = useContext(ChatContext);
  useEffect(() => {
    setActiveChannel(activeChannel);
  });
  return null;
};

const searchIndexMock = {
  search: () => [
    {
      emoticons: [':D'],
      id: 'smile',
      name: 'Smile',
      native: '😄',
      skins: [],
    },
  ],
};

const renderComponent = async (
  props = {},
  messageInputContextOverrides = {},
  activeChannel = channel,
) => {
  const placeholderText = props.placeholder === null ? null : props.placeholder || 'placeholder';

  const OverrideMessageInputContext = ({ children }) => {
    const currentContext = useMessageInputContext();
    const withOverrides = {
      ...currentContext,
      ...messageInputContextOverrides,
    };
    return (
      <MessageInputContextProvider value={withOverrides}>{children}</MessageInputContextProvider>
    );
  };

  const AutoComplete = () => (
    <OverrideMessageInputContext>
      <ChatAutoComplete {...props} placeholder={placeholderText} />
    </OverrideMessageInputContext>
  );
  let renderResult;
  await act(() => {
    renderResult = render(
      <Chat client={chatClient}>
        <ActiveChannelSetter activeChannel={activeChannel} />
        <Channel>
          <MessageInput emojiSearchIndex={searchIndexMock} Input={AutoComplete} />
        </Channel>
      </Chat>,
    );
  });

  let textarea;
  let typeText;
  if (placeholderText !== null) {
    textarea = await waitFor(() => renderResult.getByPlaceholderText(placeholderText));

    typeText = (text) => {
      fireEvent.change(textarea, {
        target: {
          selectionEnd: text.length,
          value: text,
        },
      });
    };
  }
  return { ...renderResult, textarea, typeText };
};

describe('ChatAutoComplete', () => {
  beforeEach(async () => {
    const messages = [generateMessage({ user })];
    const members = [generateMember({ user }), generateMember({ user: mentionUser })];
    const mockedChannelData = generateChannel({
      members,
      messages,
    });
    chatClient = await getTestClientWithUser(user);
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannelData)]);
    channel = chatClient.channel('messaging', mockedChannelData.channel.id);
  });

  afterEach(cleanup);

  it('should call onChange with the change event when you type in the input', async () => {
    const onChange = jest.fn();
    const { typeText } = await renderComponent({}, { handleChange: onChange });
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
    const { textarea } = await renderComponent({}, { disabled: true });

    expect(textarea).toBeDisabled();
  });

  it('should give preference to prop disabled over the MessageInputContext value', async () => {
    const { textarea } = await renderComponent({ disabled: false }, { disabled: true });

    expect(textarea).toBeEnabled();
  });

  it('should give preference to cooldown value over the prop disabled', async () => {
    await renderComponent({ disabled: false, placeholder: null }, { cooldownRemaining: 10 });
    expect(screen.queryByPlaceholderText('Placeholder')).not.toBeInTheDocument();
    const textarea = screen.getByTestId('message-input');
    expect(textarea).toBeDisabled();
    expect(textarea).toHaveProperty('placeholder', 'Slow Mode ON');
  });

  it('should let you select emojis when you type :<emoji>', async () => {
    const emojiAutocompleteText = ':smile';
    const { findByText, textarea, typeText } = await renderComponent();

    typeText(emojiAutocompleteText);

    const emoji = await findByText('😄');

    expect(emoji).toBeInTheDocument();

    fireEvent.click(emoji);

    await waitFor(() => {
      expect(textarea.value).toContain('😄');
    });
  });

  it('should let you select users when you type @<username>', async () => {
    const onSelectItem = jest.fn();
    const userAutocompleteText = `@${mentionUser.name}`;
    const { textarea, typeText } = await renderComponent({
      onSelectItem,
    });
    typeText(userAutocompleteText);
    const userText = await screen.getByText(mentionUser.name);

    expect(userText).toBeInTheDocument();

    fireEvent.click(userText);

    expect(textarea.value).toContain(mentionUser.name);
  });

  it('should let you select users when you type @<userid>', async () => {
    const onSelectItem = jest.fn();
    const userAutocompleteText = `@${mentionUser.id}`;
    const { findByText, textarea, typeText } = await renderComponent({ onSelectItem });
    typeText(userAutocompleteText);
    const userText = await findByText(mentionUser.name);

    expect(userText).toBeInTheDocument();

    fireEvent.click(userText);

    expect(textarea.value).toContain(mentionUser.name);
  });

  it('should let you select commands when you type /<command>', async () => {
    const commandAutocompleteText = '/giph';
    const { findByText, textarea, typeText } = await renderComponent({
      commands: [
        {
          args: '[text]',
          description: 'Post a random gif to the channel',
          name: 'giphy',
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
    const { queryAllByText, typeText } = await renderComponent(
      {},
      {
        disableMentions: true,
        onSelectItem,
      },
    );
    typeText(userAutocompleteText);
    const userText = await queryAllByText(user.name);

    // eslint-disable-next-line jest-dom/prefer-in-document
    expect(userText).toHaveLength(0);
  });

  it('should disable popup list when the input is in "isComposing" state', async () => {
    const { typeText } = await renderComponent();

    const messageInput = await screen.findByTestId('message-input');

    act(() => {
      const cStartEvent = new Event('compositionstart', { bubbles: true });
      messageInput.dispatchEvent(cStartEvent);
    });

    const userAutocompleteText = `@${user.name}`;
    typeText(userAutocompleteText);

    expect(screen.queryByText(user.name)).not.toBeInTheDocument();

    act(() => {
      const cEndEvent = new Event('compositionend', { bubbles: true });
      messageInput.dispatchEvent(cEndEvent);
    });

    expect(await screen.findByText(user.name)).toBeInTheDocument();
  });

  it('should use the queryMembers API for mentions if a channel has many members', async () => {
    const users = Array(100).fill().map(generateUser);
    const members = users.map((u) => generateMember({ user: u }));
    const messages = [generateMessage({ user: users[1] })];
    const mockedChannel = generateChannel({
      members,
      messages,
    });
    useMockedApis(chatClient, [getOrCreateChannelApi(mockedChannel)]);
    const searchMember = members[0];
    useMockedApis(chatClient, [queryMembersApi([searchMember])]);

    const { findByText, textarea, typeText } = await renderComponent();
    const mentionedUser = searchMember.user;

    await act(() => {
      typeText(`@${mentionedUser.id}`);
    });

    const userText = await findByText(mentionedUser.name);
    expect(userText).toBeInTheDocument();

    await act(() => {
      fireEvent.click(userText);
    });
    await waitFor(() => {
      expect(textarea.value).toContain(mentionedUser.name);
    });
  });
});
