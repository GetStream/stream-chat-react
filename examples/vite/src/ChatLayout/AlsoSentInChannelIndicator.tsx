import {
  MessageAlsoSentInChannelIndicator,
  useMessageAlsoSentInChannelNavigation,
} from 'stream-chat-react';
import { useSlotGeometry } from 'stream-chat-react/slot-geometry';

import { MAIN_CHANNEL_SLOT } from './constants';

/**
 * Coverage-aware "Also sent in channel" indicator. It reuses the SDK default component and its
 * navigation hook — no logic or markup is copied — and only records a one-shot intent (on the
 * geometry provider) to reveal the channel column when jumping to it from inside a reply thread.
 *
 * The actual "close the covering thread" decision is deferred to a channels-view effect
 * (in `ResponsiveChannelPanels`), because it must run *after* navigation: in the cross-view
 * case (threads → channels) the channel isn't mounted or measurable at click time. The effect closes
 * the thread only when the geometry plugin reports the channel is actually obscured, so wide
 * side-by-side layouts keep the thread. This scopes the behavior to this navigation only — it does
 * not change global channel-open semantics.
 */
export const AlsoSentInChannelIndicator = () => {
  const { isInThread, viewReference } = useMessageAlsoSentInChannelNavigation();
  const { requestReveal } = useSlotGeometry();

  const onView = async () => {
    if (isInThread) requestReveal(MAIN_CHANNEL_SLOT);
    await viewReference();
  };

  return <MessageAlsoSentInChannelIndicator onView={onView} />;
};
