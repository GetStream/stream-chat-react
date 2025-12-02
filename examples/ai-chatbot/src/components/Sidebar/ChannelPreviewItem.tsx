import type { ChannelPreviewProps } from 'stream-chat-react';
import { useChatContext } from 'stream-chat-react';
import './ChannelPreviewItem.scss';

export const ChannelPreviewItem = (props: ChannelPreviewProps) => {
  const { id, data } = props.channel;
  const { setActiveChannel, channel: activeChannel } = useChatContext();
  const isActive = activeChannel?.id === id;

  return (
    <div
      className={`ai-demo-channel-preview ${isActive ? 'ai-demo-channel-preview--active' : ''}`}
      onClick={() => setActiveChannel(props.channel)}
    >
      <div className="ai-demo-channel-preview__text">
        {data?.summary ?? 'New Chat'}
      </div>
    </div>
  );
};
