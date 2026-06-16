import { useMemo } from 'react';
import {
  type SectionNavigatorSection,
  type SectionNavigatorSectionContentProps,
  useTranslationContext,
} from 'stream-chat-react';
import {
  AvatarWithChannelDetail,
  type AvatarWithChannelDetailProps,
  ChannelDetail,
  type ChannelDetailProps,
  ChannelMembersView,
  type ChannelMembersViewModes,
  defaultChannelDetailSections,
} from 'stream-chat-react/channel-detail';

import { useAppSettingsSelector } from '../AppSettings/state';
import { getChannelMembersHeaderActionSet } from '../AppSettings/tabs/ChannelDetail';
import { ChannelMembersRemoveView } from './ChannelMembersRemoveView';

const ChannelMembersRemoveTitle = () => {
  const { t } = useTranslationContext();
  return <>{t('Manage members')}</>;
};

// Register the app-provided bulk-remove mode. The SDK ships no bulk removal; the
// `remove` mode is contributed entirely by this demo.
const channelMembersModeViews: ChannelMembersViewModes = {
  remove: {
    Body: ChannelMembersRemoveView,
    Title: ChannelMembersRemoveTitle,
  },
};

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

export const ConfiguredAvatarWithChannelDetail = (
  props: AvatarWithChannelDetailProps,
) => <AvatarWithChannelDetail {...props} ChannelDetail={ConfiguredChannelDetail} />;
