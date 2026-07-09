import {
  MessageAlsoSentInChannelIndicator,
  useChatViewNavigation,
  useMessageAlsoSentInChannelNavigation,
} from 'stream-chat-react';
import { useSlotGeometry } from 'stream-chat-react/slot-geometry';

import { CHANNEL_THREAD_SLOT, MAIN_CHANNEL_SLOT } from './constants';

/**
 * Coverage-aware "Also sent in channel" indicator. It reuses the SDK default component and its
 * navigation hook — no logic or markup is copied — and only augments the click: when jumping to the
 * channel from inside the reply thread, it first releases the thread slot **if** the geometry module
 * reports the channel column is actually obscured (collapsed under / covered by the thread) right
 * now. On wide side-by-side layouts the channel isn't obscured, so the thread stays open.
 *
 * Coverage is app-layout knowledge (this example's responsive CSS), so it lives here rather than in
 * the SDK — measured from real DOM rects, no breakpoint or class-name coupling.
 */
export const AlsoSentInChannelIndicator = () => {
  const { isInThread, viewReference } = useMessageAlsoSentInChannelNavigation();
  const { close } = useChatViewNavigation();
  const { isObscured } = useSlotGeometry();

  const onView = async () => {
    if (isInThread && isObscured(MAIN_CHANNEL_SLOT)) close(CHANNEL_THREAD_SLOT);
    await viewReference();
  };

  return <MessageAlsoSentInChannelIndicator onView={onView} />;
};
