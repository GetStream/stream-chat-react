import clsx from 'clsx';
import React, { useState } from 'react';
import type { Channel } from 'stream-chat';

import {
  SECTION_NAVIGATOR_LAYOUT,
  SectionNavigator,
  type SectionNavigatorLayout,
  type SectionNavigatorNavButtonProps,
  type SectionNavigatorProps,
  type SectionNavigatorSection,
} from './SectionNavigator';
import { ChannelDetailNavButton } from './ChannelDetailNavButton';
import {
  ChannelDetailProvider,
  type ChannelDetailProviderProps,
} from './ChannelDetailContext';
import { ChannelFilesView } from './Views/ChannelFilesView';
import { ChannelManagementView } from './Views/ChannelManagementView';
import { ChannelMediaView } from './Views/ChannelMediaView';
import { ChannelMembersView } from './Views/ChannelMembersView';
import { PinnedMessagesView } from './Views/PinnedMessagesView';
import { ScheduledMessagesView } from './Views/ScheduledMessagesView';
import { Prompt } from '../../components/Dialog';
import { useComponentContextIcons, useTranslationContext } from '../../context';
import { useStableCallback } from '../../utils';

const ChannelManagementNavButtonIcon = () => {
  const { IconInfo } = useComponentContextIcons();

  return <IconInfo className='str-chat__channel-detail__action-icon' />;
};

const ChannelMembersNavButtonIcon = () => {
  const { IconUser } = useComponentContextIcons();

  return <IconUser className='str-chat__channel-detail__action-icon' />;
};

const PinnedMessagesNavButtonIcon = () => {
  const { IconPin } = useComponentContextIcons();

  return <IconPin className='str-chat__channel-detail__action-icon' />;
};

const ChannelMediaNavButtonIcon = () => {
  const { IconImage } = useComponentContextIcons();

  return <IconImage className='str-chat__channel-detail__action-icon' />;
};

const ScheduledMessagesNavButtonIcon = () => {
  const { IconClock } = useComponentContextIcons();
  return <IconClock className='str-chat__channel-detail__action-icon' />;
};

const ChannelFilesNavButtonIcon = () => {
  const { IconFolder } = useComponentContextIcons();

  return <IconFolder className='str-chat__channel-detail__action-icon' />;
};

export const ChannelManagementNavButton = (props: SectionNavigatorNavButtonProps) => {
  const { t } = useTranslationContext();
  return (
    <ChannelDetailNavButton
      {...props}
      LeadingIcon={ChannelManagementNavButtonIcon}
      title={t('channelDetail.navButton.channelInfo.title', 'Channel info')}
    />
  );
};

export const ChannelMembersNavButton = (props: SectionNavigatorNavButtonProps) => {
  const { t } = useTranslationContext();
  return (
    <ChannelDetailNavButton
      {...props}
      LeadingIcon={ChannelMembersNavButtonIcon}
      title={t('channelDetail.navButton.members.title', 'Members')}
    />
  );
};

export const PinnedMessagesNavButton = (props: SectionNavigatorNavButtonProps) => {
  const { t } = useTranslationContext();
  return (
    <ChannelDetailNavButton
      {...props}
      LeadingIcon={PinnedMessagesNavButtonIcon}
      title={t('channelDetail.navButton.pinnedMessages.title', 'Pinned messages')}
    />
  );
};

export const ScheduledMessagesNavButton = (props: SectionNavigatorNavButtonProps) => {
  const { t } = useTranslationContext();
  return (
    <ChannelDetailNavButton
      {...props}
      LeadingIcon={ScheduledMessagesNavButtonIcon}
      title={t('channelDetail.navButton.scheduledMessages.title', 'Scheduled')}
    />
  );
};

export const ChannelMediaNavButton = (props: SectionNavigatorNavButtonProps) => {
  const { t } = useTranslationContext();
  return (
    <ChannelDetailNavButton
      {...props}
      LeadingIcon={ChannelMediaNavButtonIcon}
      title={t('channelDetail.navButton.media.title', 'Photos & videos')}
    />
  );
};

export const ChannelFilesNavButton = (props: SectionNavigatorNavButtonProps) => {
  const { t } = useTranslationContext();
  return (
    <ChannelDetailNavButton
      {...props}
      LeadingIcon={ChannelFilesNavButtonIcon}
      title={t('channelDetail.navButton.files.title', 'Files')}
    />
  );
};

export const defaultChannelDetailSections: SectionNavigatorSection[] = [
  {
    id: 'channel-info',
    NavButton: ChannelManagementNavButton,
    SectionContent: ChannelManagementView,
  },
  {
    id: 'channel-members',
    NavButton: ChannelMembersNavButton,
    SectionContent: ChannelMembersView,
  },
  {
    id: 'pinned-messages',
    NavButton: PinnedMessagesNavButton,
    SectionContent: PinnedMessagesView,
  },
  {
    id: 'scheduled-messages',
    NavButton: ScheduledMessagesNavButton,
    SectionContent: ScheduledMessagesView,
  },
  {
    id: 'channel-media',
    NavButton: ChannelMediaNavButton,
    SectionContent: ChannelMediaView,
  },
  {
    id: 'channel-files',
    NavButton: ChannelFilesNavButton,
    SectionContent: ChannelFilesView,
  },
];

export type ChannelDetailProps = Omit<SectionNavigatorProps, 'sections'> & {
  channel: Channel;
  /** Closes the channel detail. See `ChannelDetailProviderProps.onClose`. */
  onClose?: ChannelDetailProviderProps['onClose'];
  sections?: SectionNavigatorSection[];
};

export const ChannelDetail = ({
  channel,
  className,
  defaultLayout = SECTION_NAVIGATOR_LAYOUT.tabs,
  onClose,
  onLayoutChange,
  sections = defaultChannelDetailSections,
  ...props
}: ChannelDetailProps) => {
  const [layout, setLayout] = useState<SectionNavigatorLayout>(defaultLayout);

  // The layout drives the inline-layout class here, and the caller gets every change too. Stable, so
  // SectionNavigator reports a layout once, even when the caller passes a new `onLayoutChange` on
  // every render.
  const handleLayoutChange = useStableCallback((nextLayout: SectionNavigatorLayout) => {
    setLayout(nextLayout);
    onLayoutChange?.(nextLayout);
  });

  return (
    <ChannelDetailProvider channel={channel} onClose={onClose}>
      <Prompt.Root
        className={clsx(
          'str-chat__channel-detail',
          {
            'str-chat__channel-detail--inline':
              layout === SECTION_NAVIGATOR_LAYOUT.inline,
          },
          className,
        )}
      >
        <SectionNavigator
          {...props}
          defaultLayout={defaultLayout}
          onLayoutChange={handleLayoutChange}
          sections={sections}
        />
      </Prompt.Root>
    </ChannelDetailProvider>
  );
};
