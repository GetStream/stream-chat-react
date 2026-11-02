import { useEffect } from 'react';
import {
  Button,
  IconExclamationCircleFill,
  IconRetry,
  useAriaLiveAnnouncer,
} from 'stream-chat-react';
import './ChannelListState.css';

const title = 'Couldn’t load your conversations';

/**
 * Shown in place of the channel list when its first page failed to load. `onRetry` queries the first
 * page again. The view stays mounted while the retry runs, so the Retry button keeps focus: it turns
 * busy, and reads Retry again if the retry fails.
 */
export const ChannelListLoadError = ({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) => {
  const announce = useAriaLiveAnnouncer();

  // Announced when the error first shows and again whenever a retry fails. Polite, so it follows
  // the SDK's own error notification, which is announced assertively at the same moment. The dedupe
  // window swallows the second run of the effect in development.
  useEffect(() => {
    if (isRetrying) return;
    announce(title, { dedupeMs: 1000, priority: 'polite' });
  }, [announce, isRetrying]);

  return (
    <div className='cookbook-channel-list-state'>
      <div className='cookbook-channel-list-state__icon cookbook-channel-list-state__icon--error'>
        <IconExclamationCircleFill />
      </div>
      <p className='cookbook-channel-list-state__title'>{title}</p>
      <p className='cookbook-channel-list-state__text'>
        Something went wrong. Try again.
      </p>
      {/* aria-disabled, not disabled: a disabled button would lose focus. */}
      <Button
        appearance='outline'
        aria-busy={isRetrying}
        aria-disabled={isRetrying}
        onClick={onRetry}
        size='md'
        variant='secondary'
      >
        <IconRetry />
        {isRetrying ? 'Retrying…' : 'Retry'}
      </Button>
    </div>
  );
};
