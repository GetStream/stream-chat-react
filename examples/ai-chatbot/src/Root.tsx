import { AIMessageComposer, StreamingMessage } from '@stream-io/ai-chat-react';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  LocalMessage,
} from 'stream-chat';
import {
  AIStateIndicator,
  Channel,
  ChannelList,
  Chat,
  useCreateChatClient,
  MessageList,
  Window,
  type ChannelPreviewProps,
  ChannelPreview,
  useChannelStateContext,
  useChatContext,
  MessageInput,
  useChannelActionContext,
  useMessageComposer,
  useMessageContext,
  Attachment,
  messageHasAttachments,
  MessageErrorIcon,
} from 'stream-chat-react';

import { customAlphabet } from 'nanoid';
import { useEffect, useMemo } from 'react';
import clsx from 'clsx';

const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, property) => searchParams.get(property as string),
}) as unknown as Record<string, string | null>;

const parseUserIdFromToken = (token: string) => {
  const [, payload] = token.split('.');

  if (!payload) throw new Error('Token is missing');

  return JSON.parse(atob(payload))?.user_id;
};

const apiKey = params.key ?? (import.meta.env.VITE_STREAM_KEY as string);
const userToken = params.ut ?? (import.meta.env.VITE_USER_TOKEN as string);
const userId = parseUserIdFromToken(userToken);

const filters: ChannelFilters = {
  members: { $in: [userId] },
  type: 'messaging',
  archived: false,
};
const options: ChannelOptions = { limit: 5, presence: true, state: true };
const sort: ChannelSort = { pinned_at: 1, last_message_at: -1, updated_at: -1 };

// @ts-ignore
const isMessageAIGenerated = (message: LocalMessage) => !!message?.ai_generated;

const InputComponent = () => {
  const { updateMessage, sendMessage } = useChannelActionContext();
  const { channel } = useChannelStateContext();
  const composer = useMessageComposer();

  return (
    <AIMessageComposer
      onSubmit={async (e) => {
        const event = e;
        const target = (event.currentTarget ??
          event.target) as HTMLFormElement | null;
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const t = formData.get('message');
        const model = formData.get('model');

        composer.textComposer.setText(t as string);

        const d = await composer.compose();

        if (!d) return;

        target?.reset();
        composer.clear();

        if (channel.initialized) {
          await sendMessage(d);
        } else {
          updateMessage(d?.localMessage);

          await channel.watch();

          // TODO: wrap in retry (in case channel creation takes longer)
          await fetch('http://localhost:3000/start-ai-agent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channel_id: channel.id,
              channel_type: channel.type,
              platform: 'openai',
              model: model,
            }),
          });

          await sendMessage(d);
        }
      }}
    />
  );
};

const CustomPreview = (p: ChannelPreviewProps) => {
  const { setActiveChannel } = useChatContext();
  return (
    <div onClick={() => setActiveChannel(p.channel)}>
      {/* @ts-expect-error */}
      {p.channel.data.summary ?? p.channel.id}
    </div>
  );
};

const EmptyPlaceholder = () => {
  const { channel, setActiveChannel, client } = useChatContext();

  useEffect(() => {
    if (!channel) {
      setActiveChannel(
        client.channel('messaging', `ai-${nanoId()}`, {
          members: [client.userID as string],
        }),
      );
    }
  }, [channel, client, setActiveChannel]);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        Start a conversation!
      </div>
    </div>
  );
};

const CustomMessage = () => {
  const { message, isMyMessage, highlighted, handleAction } =
    useMessageContext();

  const hasAttachment = messageHasAttachments(message);
  const finalAttachments = useMemo(
    () =>
      !message.shared_location && !message.attachments
        ? []
        : !message.shared_location
          ? message.attachments
          : [message.shared_location, ...(message.attachments ?? [])],
    [message],
  );

  const rootClassName = clsx(
    'str-chat__message str-chat__message-simple',
    `str-chat__message--${message.type}`,
    `str-chat__message--${message.status}`,
    {
      'str-chat__message--me str-chat__message-simple--me': isMyMessage(),
      'str-chat__message--other': !isMyMessage(),
      'str-chat__message--has-text': !!message.text,
      'has-no-text': !message.text,
      'str-chat__message--has-attachment': hasAttachment,
      'str-chat__message--highlighted': highlighted,
      'str-chat__message-send-can-be-retried':
        message?.status === 'failed' && message?.error?.status !== 403,
    },
  );

  return (
    <div className={rootClassName}>
      <div className="str-chat__message-inner" data-testid="message-inner">
        <div className="str-chat__message-bubble">
          {finalAttachments?.length ? (
            <Attachment
              actionHandler={handleAction}
              attachments={finalAttachments}
            />
          ) : null}

          <StreamingMessage text={message?.text || ''} />

          <MessageErrorIcon />
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: { id: userId },
  });

  if (!chatClient) return <>Loading...</>;

  return (
    <Chat client={chatClient} isMessageAIGenerated={isMessageAIGenerated}>
      <ChannelList
        setActiveChannelOnMount={false}
        Preview={(props) => (
          <ChannelPreview {...props} Preview={CustomPreview} />
        )}
        filters={filters}
        options={options}
        sort={sort}
      />
      <Channel
        initializeOnMount={false}
        EmptyPlaceholder={<EmptyPlaceholder />}
        Message={CustomMessage}
      >
        <Window>
          <MessageList />
          <AIStateIndicator />
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '.5rem',
            }}
          >
            <MessageInput Input={InputComponent} focus />
          </div>
        </Window>
      </Channel>
      {/* <InputComponent /> */}
    </Chat>
  );
};

export default App;
