import { useMemo } from 'react';
import {
  AvatarWithChannelDetail,
  type AvatarWithChannelDetailProps,
  ChannelDetail,
  type ChannelDetailProps,
  ChannelManagementNavButton,
  ChannelManagementView,
  ChannelMembersNavButton,
  ChannelMembersView,
  type SectionNavigatorSection,
} from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings/state';
import { getChannelMembersHeaderActionSet } from '../AppSettings/tabs/ChannelDetail';

const ConfiguredChannelDetail = (props: ChannelDetailProps) => {
  const channelDetail = useAppSettingsSelector((state) => state.channelDetail);
  const headerActionSet = useMemo(
    () => getChannelMembersHeaderActionSet(channelDetail),
    [channelDetail],
  );
  const sections = useMemo<SectionNavigatorSection[]>(
    () => [
      {
        id: 'channel-info',
        NavButton: ChannelManagementNavButton,
        SectionContent: ChannelManagementView,
      },
      {
        id: 'channel-members',
        NavButton: ChannelMembersNavButton,
        SectionContent: (sectionProps) => (
          <ChannelMembersView {...sectionProps} headerActionSet={headerActionSet} />
        ),
      },
    ],
    [headerActionSet],
  );

  return <ChannelDetail {...props} sections={sections} />;
};

export const ConfiguredAvatarWithChannelDetail = (
  props: AvatarWithChannelDetailProps,
) => <AvatarWithChannelDetail {...props} ChannelDetail={ConfiguredChannelDetail} />;
