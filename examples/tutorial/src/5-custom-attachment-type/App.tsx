import { useEffect, useState } from 'react';
import type {
  Attachment as AttachmentType,
  Channel as StreamChannel,
  ChannelFilters,
  ChannelSort,
  User,
} from 'stream-chat';
import {
  Attachment,
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageComposer,
  MessageList,
  Thread,
  WithComponents,
  Window,
  useCreateChatClient,
  type AttachmentProps,
} from 'stream-chat-react';

import './layout.css';

const apiKey = 'REPLACE_WITH_API_KEY';
const userId = 'REPLACE_WITH_USER_ID';
const userName = 'REPLACE_WITH_USER_NAME';
const userToken = 'REPLACE_WITH_USER_TOKEN';

const user: User = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const sort: ChannelSort = { last_message_at: -1 };
const filters: ChannelFilters = {
  type: 'messaging',
  members: { $in: [userId] },
};

const attachments: AttachmentType[] = [
  {
    image: 'https://images-na.ssl-images-amazon.com/images/I/71k0cry-ceL._SL1500_.jpg',
    name: 'iPhone',
    type: 'product',
    url: 'https://goo.gl/ppFmcR',
  },
];

const isProductAttachment = (
  attachment: AttachmentProps['attachments'] extends Array<infer T> ? T : never,
): attachment is AttachmentType => 'type' in attachment && attachment.type === 'product';

const CustomAttachment = (props: AttachmentProps) => {
  const { attachments } = props;
  const [attachment] = attachments || [];
  if (attachment && isProductAttachment(attachment)) {
    return (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          padding: '12px',
        }}
      >
        <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>
          Product recommendation
        </div>
        <a href={attachment.url} rel='noreferrer' target='_blank'>
          <img
            alt='custom-attachment'
            height='120'
            src={attachment.image}
            style={{ borderRadius: '18px', marginTop: '8px', objectFit: 'cover' }}
          />
          <div style={{ color: '#334155', marginTop: '8px' }}>{attachment.name}</div>
        </a>
      </div>
    );
  }

  return <Attachment {...props} />;
};

const App = () => {
  const [channel, setChannel] = useState<StreamChannel>();
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  useEffect(() => {
    if (!client) return;

    const initChannel = async () => {
      const nextChannel = client.channel('messaging', 'react-tutorial-products', {
        image: 'https://getstream.io/random_png/?name=products',
        name: 'Product recommendations',
        members: [userId],
      });

      await nextChannel.watch();

      const hasProductMessage = nextChannel.state.messages.some((message) =>
        message.attachments?.some(
          (attachment) => 'type' in attachment && attachment.type === 'product',
        ),
      );

      if (!hasProductMessage) {
        await nextChannel.sendMessage({
          text: 'Your selected product is out of stock, would you like to select one of these alternatives?',
          attachments,
        });
      }

      setChannel(nextChannel);
    };

    initChannel().catch((error) => {
      console.error('Failed to initialize attachments', error);
    });
  }, [client]);

  if (!client) return <div>Setting up client & connection...</div>;
  if (!channel) return <div>Loading tutorial channel...</div>;

  return (
    <WithComponents overrides={{ Attachment: CustomAttachment }}>
      <Chat client={client} theme='str-chat__theme-custom'>
        <ChannelList filters={filters} sort={sort} />
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageComposer />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </WithComponents>
  );
};

export default App;
