'use client';

import type { ChannelStateData } from 'stream-chat';
import type { ChannelListItemUIProps } from 'stream-chat-react';
import { useStateStore } from 'stream-chat-react';
import { useActiveChannel } from '@/components/ActiveChannelContext';
import './ChannelPreviewItem.scss';

const summarySelector = ({ data }: ChannelStateData) => ({
  summary: data?.custom?.summary,
});

export const ChannelPreviewItem = (props: ChannelListItemUIProps) => {
  const { channel } = props;
  const { activeChannel, setActiveChannel } = useActiveChannel();
  const { summary } = useStateStore(channel.state, summarySelector);
  const isActive = activeChannel?.id === channel.id;

  return (
    <div
      className={`ai-demo-channel-preview ${isActive ? 'ai-demo-channel-preview--active' : ''}`}
      onClick={() => setActiveChannel(channel)}
    >
      <div className='ai-demo-channel-preview__text'>{summary ?? 'New Chat'}</div>
    </div>
  );
};
