import { useEffect } from 'react';
import { useAriaLiveAnnouncer } from 'stream-chat-react';
import './ChannelListSkeleton.css';

// Different widths per row, so the placeholder reads as a list of conversations.
const rows = [
  { preview: '88%', title: '52%' },
  { preview: '70%', title: '38%' },
  { preview: '80%', title: '60%' },
  { preview: '64%', title: '44%' },
  { preview: '76%', title: '34%' },
];

/**
 * Placeholder rows shaped like the channel list's rows: an avatar, the title and the time on the
 * first line, the last message on the second. Screen readers skip the shapes and hear one message
 * through the SDK's announcer instead.
 */
export const ChannelListSkeleton = () => {
  const announce = useAriaLiveAnnouncer();

  // Delayed, so a first page that arrives quickly is not announced at all; unmounting cancels it.
  useEffect(() => announce('Loading conversations…', { delayMs: 300 }), [announce]);

  return (
    <div aria-hidden='true' className='cookbook-channel-list-skeleton'>
      {rows.map(({ preview, title }, index) => (
        <div className='cookbook-channel-list-skeleton__row' key={index}>
          <div className='cookbook-channel-list-skeleton__avatar' />
          <div className='cookbook-channel-list-skeleton__lines'>
            <div className='cookbook-channel-list-skeleton__first-line'>
              <div
                className='cookbook-channel-list-skeleton__bar'
                style={{ width: title }}
              />
              <div className='cookbook-channel-list-skeleton__bar cookbook-channel-list-skeleton__bar--time' />
            </div>
            <div
              className='cookbook-channel-list-skeleton__bar'
              style={{ width: preview }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
