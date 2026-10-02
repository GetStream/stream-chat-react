import { useEffect, useState } from 'react';
import type {
  Attachment as AttachmentType,
  ClientUser,
  Channel as StreamChannel,
} from 'stream-chat';
import {
  Attachment,
  AttachmentPreviewList,
  type AttachmentPreviewListProps,
  type AttachmentProps,
  Channel,
  ChannelHeader,
  Chat,
  getChannel,
  MessageComposer,
  MessageList,
  RemoveAttachmentPreviewButton,
  ThreadHeader,
  UnsupportedAttachmentPreview,
  type UnsupportedAttachmentPreviewProps,
  useCreateChatClient,
  WithComponents,
} from 'stream-chat-react';

import { ChatView, ThreadSlot } from 'stream-chat-react/slot-layout';

import './layout.css';
import { apiKey, tokenProvider, userId, userName } from '../2-client-setup/credentials';
import { setUpCommandMiddlewares } from '../2-client-setup/commandMiddlewares';

const user: ClientUser = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const attachments: AttachmentType[] = [
  {
    type: 'product',
    // fields that are not part of the Attachment API go under `custom` — this example declares them
    // through module augmentation in ./stream-chat.d.ts
    custom: {
      image: 'https://images-na.ssl-images-amazon.com/images/I/71k0cry-ceL._SL1500_.jpg',
      name: 'iPhone',
      url: 'https://goo.gl/ppFmcR',
    },
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
        <a href={attachment.custom?.url} rel='noreferrer' target='_blank'>
          <img
            alt='custom-attachment'
            height='120'
            src={attachment.custom?.image}
            style={{ borderRadius: '18px', marginTop: '8px', objectFit: 'cover' }}
          />
          <div style={{ color: '#334155', marginTop: '8px' }}>
            {attachment.custom?.name}
          </div>
        </a>
      </div>
    );
  }

  return <Attachment {...props} />;
};

// The composer has no preview of its own for a custom attachment type, so editing a message that
// carries a product would list it as unsupported. `AttachmentPreviewList` takes the component for
// those: the product gets a card like the one in the message, and any other unknown type keeps
// the default.
const ProductAttachmentPreview = (props: UnsupportedAttachmentPreviewProps) => {
  const { attachment, removeAttachments } = props;
  if (attachment.type !== 'product') return <UnsupportedAttachmentPreview {...props} />;

  return (
    <div
      style={{
        alignItems: 'center',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        gap: '12px',
        height: '72px',
        padding: '8px 12px 8px 8px',
        position: 'relative',
        width: '290px',
      }}
    >
      <img
        alt=''
        height='56'
        src={attachment.custom?.image}
        style={{ borderRadius: '12px', objectFit: 'cover' }}
        width='56'
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: 700 }}>
          Product recommendation
        </div>
        <div style={{ color: '#334155', marginTop: '4px' }}>
          {attachment.custom?.name}
        </div>
      </div>
      <RemoveAttachmentPreviewButton
        onClick={() => removeAttachments([attachment.localMetadata.id])}
      />
    </div>
  );
};

const ProductAttachmentPreviewList = (props: AttachmentPreviewListProps) => (
  <AttachmentPreviewList
    {...props}
    UnsupportedAttachmentPreview={ProductAttachmentPreview}
  />
);

// A thread is opened through workspace navigation (a message's "reply in thread" action), which
// `ChatView` provides, into a layout slot. The channel is rendered directly, so the only slot is the
// thread's.
const chatViewLayouts = [{ id: 'channels' as const, slots: ['thread'] }];

const ChannelWorkspace = ({ channel }: { channel: StreamChannel }) => (
  <>
    <Channel channel={channel}>
      <ChannelHeader />
      <MessageList />
      <MessageComposer />
    </Channel>
    {/* The custom attachment renders in the thread too: the override comes from
        `WithComponents` above, which both panels sit inside. */}
    <ThreadSlot slot='thread'>
      <ThreadHeader />
      <MessageList />
      <MessageComposer />
    </ThreadSlot>
  </>
);

const App = () => {
  const [channel, setChannel] = useState<StreamChannel>();
  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: user,
  });

  // Commands such as /giphy need their middlewares in every composer (see
  // `setUpCommandMiddlewares`). A setup function applies to composers created after it is set, so
  // it is registered before the effects below create any.
  useEffect(() => {
    if (!client) return;
    client.config.setSetupFunction('messageComposer', ({ composer }) =>
      setUpCommandMiddlewares(composer),
    );
  }, [client]);

  useEffect(() => {
    if (!client) return;

    const initChannel = async () => {
      const channel = client.channelManager.ensure({
        data: {
          members: [userId],
          custom: {
            image: 'https://getstream.io/random_png/?name=products',
            name: 'Product recommendations',
          },
        },
        id: 'react-tutorial-products',
        type: 'messaging',
      });

      // `Channel` binds a channel to its subtree; it does not query one, so initializing is the
      // caller's job. The cached instance may already be loaded, so query only when it is not --
      // and when a query is needed, `getChannel` de-duplicates calls that overlap in time.
      if (!channel.initialized) {
        await getChannel({ channel, client });
      }

      // messages are no longer kept on channel.state — the paginator owns the list
      const hasProductMessage = (channel.messagePaginator.items ?? []).some((message) =>
        message.attachments?.some(
          (attachment) => 'type' in attachment && attachment.type === 'product',
        ),
      );

      if (!hasProductMessage) {
        // the message payload is nested under `message` since v10
        await channel.sendMessage({
          message: {
            text: 'Your selected product is out of stock, would you like to select one of these alternatives?',
            attachments,
          },
        });
      }

      setChannel(channel);
    };

    initChannel().catch((error) => {
      console.error('Failed to initialize attachments', error);
    });
  }, [client]);

  if (!client) return <div>Setting up client & connection...</div>;
  if (!channel) return <div>Loading tutorial channel...</div>;

  return (
    <WithComponents
      overrides={{
        Attachment: CustomAttachment,
        AttachmentPreviewList: ProductAttachmentPreviewList,
      }}
    >
      <Chat client={client} theme='custom-theme'>
        <ChatView
          layouts={chatViewLayouts}
          views={{ channels: <ChannelWorkspace channel={channel} /> }}
        />
      </Chat>
    </WithComponents>
  );
};

export default App;
