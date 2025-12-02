import type { ChannelPreviewProps } from 'stream-chat-react';
import { useChatContext } from 'stream-chat-react';
import './ChannelPreviewItem.scss';

export const ChannelPreviewItem = (props: ChannelPreviewProps) => {
  const { setActiveChannel, channel: activeChannel } = useChatContext();
  const isActive = activeChannel?.id === props.channel.id;

  return (
    <div
      className={`ai-demo-channel-preview ${isActive ? 'ai-demo-channel-preview--active' : ''}`}
      onClick={() => setActiveChannel(props.channel)}
    >
      <div className="ai-demo-channel-preview__text">
        {props.channel.data?.summary ?? props.channel.id}
      </div>
    </div>
  );
};
