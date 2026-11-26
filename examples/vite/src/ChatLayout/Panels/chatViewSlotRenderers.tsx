import type { ChatViewSlotRenderers } from 'stream-chat-react/slot-layout';

import { isOwnProfileSource } from '../../UserProfile';
import { isChannelDetailSource } from '../../ChannelDetail';
import { CHANNEL_THREAD_SLOT, MAIN_CHANNEL_SLOT, MAIN_THREAD_SLOT } from '../constants';
import { ChannelDetailPanel } from './ChannelDetailPanel';
import { ChannelMemberDetailPanel } from './ChannelMemberDetailPanel';
import { ChannelThreadPanel } from './ChannelThreadPanel';
import { MainChannelPanel } from './MainChannelPanel';
import { OwnProfilePanel } from './OwnProfilePanel';
import { SecondChannelPanel } from './SecondChannelPanel';
import { ThreadsViewThreadPanel } from './ThreadsViewThreadPanel';

/**
 * What each kind shows in the slots of the channels and threads views, as a slot's base or as a
 * layer over it. Renderers run while the layout renders, so each returns an element and leaves the
 * hooks to that element's component.
 */
export const chatViewSlotRenderers: ChatViewSlotRenderers = {
  channel: ({ slot, source }) =>
    slot === MAIN_CHANNEL_SLOT ? (
      <MainChannelPanel channel={source} />
    ) : (
      <SecondChannelPanel channel={source} />
    ),
  custom: ({ slot, source }) => {
    if (isChannelDetailSource(source)) {
      return <ChannelDetailPanel channel={source.channel} slot={slot} />;
    }
    if (isOwnProfileSource(source)) return <OwnProfilePanel slot={slot} />;
    return null;
  },
  thread: ({ slot, source }) => {
    if (slot === CHANNEL_THREAD_SLOT) return <ChannelThreadPanel thread={source} />;
    return (
      <ThreadsViewThreadPanel focusComposer={slot === MAIN_THREAD_SLOT} thread={source} />
    );
  },
  userProfile: ({ slot, source }) => (
    <ChannelMemberDetailPanel slot={slot} userId={source.userId} />
  ),
};
