import { type MouseEvent, useMemo } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import {
  asDynamicKey,
  ChannelAvatar,
  type ChannelAvatarProps,
  useChannel,
  useTranslationContext,
} from 'stream-chat-react';
import { useChatViewNavigation } from 'stream-chat-react/slot-layout';
import {
  AvatarWithChannelDetail,
  type AvatarWithChannelDetailProps,
  ChannelDetail,
  type ChannelDetailProps,
  ChannelMembersView,
  type ChannelMembersViewModes,
  defaultChannelDetailSections,
  type SectionNavigatorSection,
  type SectionNavigatorSectionContentProps,
} from 'stream-chat-react/channel-detail';

import { useAppSettingsSelector } from '../AppSettings/state';
import { getChannelMembersHeaderActionSet } from '../AppSettings/tabs/ChannelDetail';
import { ChannelMembersRemoveView } from './ChannelMembersRemoveView';
import { CHANNEL_THREAD_SLOT } from '../ChatLayout/constants.ts';

const ChannelMembersRemoveTitle = () => {
  const { t } = useTranslationContext();
  return (
    <>
      {t(asDynamicKey('viteExample.channelDetail.manageMembers.title'), 'Manage members')}
    </>
  );
};

// Register the app-provided bulk-remove mode. The SDK ships no bulk removal; the
// `remove` mode is contributed entirely by this demo.
const channelMembersModeViews: ChannelMembersViewModes = {
  remove: {
    Body: ChannelMembersRemoveView,
    Title: ChannelMembersRemoveTitle,
  },
};

export const ConfiguredChannelDetail = (props: ChannelDetailProps) => {
  const channelDetail = useAppSettingsSelector((state) => state.channelDetail);
  const headerActionSet = useMemo(
    () => getChannelMembersHeaderActionSet(channelDetail),
    [channelDetail],
  );
  const sections = useMemo<SectionNavigatorSection[]>(
    () => [
      ...defaultChannelDetailSections.map((section) =>
        section.id !== 'channel-members'
          ? section
          : {
              ...section,
              SectionContent: (sectionProps: SectionNavigatorSectionContentProps) => (
                <ChannelMembersView
                  {...sectionProps}
                  headerActionSet={headerActionSet}
                  modeViews={channelMembersModeViews}
                />
              ),
            },
      ),
    ],
    [headerActionSet],
  );

  return <ChannelDetail {...props} sections={sections} />;
};

/** What the secondary slot holds when it shows a channel's details: the SDK's `custom` kind. */
export type ChannelDetailSource = { channel: StreamChannel; type: 'channelDetail' };

export const isChannelDetailSource = (source: unknown): source is ChannelDetailSource =>
  (source as ChannelDetailSource | undefined)?.type === 'channelDetail';

// The avatar inside the header's channel-details button. A ⌘/ctrl-click on it opens the details
// beside the channel, in the secondary slot; it is stopped here, so the button's own click handler,
// which opens the details in a modal, runs only for a plain click. The modal renders outside the
// avatar, so clicks inside it are not affected.
const AvatarOpeningDetailBeside = (avatarProps: ChannelAvatarProps) => {
  const channel = useChannel();
  const { open } = useChatViewNavigation();

  const openBeside = (event: MouseEvent) => {
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    event.stopPropagation();
    const source: ChannelDetailSource = { channel, type: 'channelDetail' };
    open(
      { key: `channelDetail:${channel.cid}`, kind: 'custom', source },
      { slot: CHANNEL_THREAD_SLOT },
    );
  };

  return (
    <span onClickCapture={openBeside} style={{ display: 'contents' }}>
      <ChannelAvatar {...avatarProps} />
    </span>
  );
};

/**
 * The header avatar that opens the channel's details: a plain click opens them in a modal, a
 * ⌘/ctrl-click beside the channel, in the secondary slot.
 */
export const ConfiguredAvatarWithChannelDetail = (
  props: AvatarWithChannelDetailProps,
) => (
  <AvatarWithChannelDetail
    {...props}
    Avatar={AvatarOpeningDetailBeside}
    ChannelDetail={ConfiguredChannelDetail}
  />
);
