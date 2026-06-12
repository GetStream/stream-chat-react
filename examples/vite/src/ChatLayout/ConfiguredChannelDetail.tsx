import { useMemo } from 'react';
import {
  type SectionNavigatorSection,
  type SectionNavigatorSectionContentProps,
} from 'stream-chat-react';
import {
  AvatarWithChannelDetail,
  type AvatarWithChannelDetailProps,
  ChannelDetail,
  type ChannelDetailProps,
  ChannelMembersView,
  defaultChannelDetailSections,
} from 'stream-chat-react/channel-detail';

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
      ...defaultChannelDetailSections.map((section) =>
        section.id !== 'channel-members'
          ? section
          : {
              ...section,
              SectionContent: (sectionProps: SectionNavigatorSectionContentProps) => (
                <ChannelMembersView {...sectionProps} headerActionSet={headerActionSet} />
              ),
            },
      ),
    ],
    [headerActionSet],
  );

  return <ChannelDetail {...props} sections={sections} />;
};

export const ConfiguredAvatarWithChannelDetail = (
  props: AvatarWithChannelDetailProps,
) => <AvatarWithChannelDetail {...props} ChannelDetail={ConfiguredChannelDetail} />;
