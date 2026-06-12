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
} from '../SectionNavigator';
import { ChannelDetailNavButton } from './ChannelDetailNavButton';
import { ChannelDetailProvider } from './ChannelDetailContext';
import { ChannelFilesView } from './Views/ChannelFilesView';
import { ChannelManagementView } from './Views/ChannelManagementView';
import { ChannelMediaView } from './Views/ChannelMediaView';
import { ChannelMembersView } from './Views/ChannelMembersView';
import { PinnedMessagesView } from './Views/PinnedMessagesView';
import { Prompt } from '../Dialog';
import { IconFolder, IconImage, IconInfo, IconPin, IconUser } from '../Icons';

const ChannelManagementNavButtonIcon = () => (
  <IconInfo className='str-chat__channel-detail__action-icon' />
);

const ChannelMembersNavButtonIcon = () => (
  <IconUser className='str-chat__channel-detail__action-icon' />
);

const PinnedMessagesNavButtonIcon = () => (
  <IconPin className='str-chat__channel-detail__action-icon' />
);

const ChannelMediaNavButtonIcon = () => (
  <IconImage className='str-chat__channel-detail__action-icon' />
);

const ChannelFilesNavButtonIcon = () => (
  <IconFolder className='str-chat__channel-detail__action-icon' />
);

export const ChannelManagementNavButton = (props: SectionNavigatorNavButtonProps) => (
  <ChannelDetailNavButton
    {...props}
    LeadingIcon={ChannelManagementNavButtonIcon}
    title='Channel info'
  />
);

export const ChannelMembersNavButton = (props: SectionNavigatorNavButtonProps) => (
  <ChannelDetailNavButton
    {...props}
    LeadingIcon={ChannelMembersNavButtonIcon}
    title='Members'
  />
);

export const PinnedMessagesNavButton = (props: SectionNavigatorNavButtonProps) => (
  <ChannelDetailNavButton
    {...props}
    LeadingIcon={PinnedMessagesNavButtonIcon}
    title='Pinned messages'
  />
);

export const ChannelMediaNavButton = (props: SectionNavigatorNavButtonProps) => (
  <ChannelDetailNavButton
    {...props}
    LeadingIcon={ChannelMediaNavButtonIcon}
    title='Photos & videos'
  />
);

export const ChannelFilesNavButton = (props: SectionNavigatorNavButtonProps) => (
  <ChannelDetailNavButton
    {...props}
    LeadingIcon={ChannelFilesNavButtonIcon}
    title='Files'
  />
);

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
  sections?: SectionNavigatorSection[];
};

export const ChannelDetail = ({
  channel,
  className,
  defaultLayout = SECTION_NAVIGATOR_LAYOUT.tabs,
  sections = defaultChannelDetailSections,
  ...props
}: ChannelDetailProps) => {
  const [layout, setLayout] = useState<SectionNavigatorLayout>(defaultLayout);

  return (
    <ChannelDetailProvider channel={channel}>
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
          onLayoutChange={setLayout}
          sections={sections}
        />
      </Prompt.Root>
    </ChannelDetailProvider>
  );
};
