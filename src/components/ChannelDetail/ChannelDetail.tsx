import clsx from 'clsx';
import React, { useMemo } from 'react';
import type { Channel } from 'stream-chat';

import {
  SectionNavigator,
  type SectionNavigatorNavButtonProps,
  type SectionNavigatorProps,
  type SectionNavigatorSection,
} from '../SectionNavigator';
import { ChannelDetailProvider } from './ChannelDetailContext';
import { ChannelManagementView } from './Views/ChannelManagementView';
import { ChannelMembersView } from './Views/ChannelMembersView';
import { PinnedMessagesView } from './Views/PinnedMessagesView';
import { Prompt } from '../Dialog';
import { IconInfo, IconPin, IconUser } from '../Icons';
import { ListItemLayout } from '../ListItemLayout';

const ChannelDetailNavButtonClassName = 'str-chat__channel-detail__nav-button';

const ChannelManagementNavButtonIcon = () => (
  <IconInfo className='str-chat__channel-detail__action-icon' />
);

const ChannelMembersNavButtonIcon = () => (
  <IconUser className='str-chat__channel-detail__action-icon' />
);

const PinnedMessagesNavButtonIcon = () => (
  <IconPin className='str-chat__channel-detail__action-icon' />
);

export const ChannelManagementNavButton = ({
  select,
  selected,
}: SectionNavigatorNavButtonProps) => {
  const rootProps = useMemo(
    () => ({
      'aria-current': selected ? ('page' as const) : undefined,
      className: ChannelDetailNavButtonClassName,
      onClick: select,
    }),
    [select, selected],
  );

  return (
    <ListItemLayout
      LeadingIcon={ChannelManagementNavButtonIcon}
      RootElement='button'
      rootProps={rootProps}
      selected={selected}
      title='Channel info'
    />
  );
};

export const ChannelMembersNavButton = ({
  select,
  selected,
}: SectionNavigatorNavButtonProps) => {
  const rootProps = useMemo(
    () => ({
      'aria-current': selected ? ('page' as const) : undefined,
      className: ChannelDetailNavButtonClassName,
      onClick: select,
    }),
    [select, selected],
  );

  return (
    <ListItemLayout
      LeadingIcon={ChannelMembersNavButtonIcon}
      RootElement='button'
      rootProps={rootProps}
      selected={selected}
      title='Members'
    />
  );
};

export const PinnedMessagesNavButton = ({
  select,
  selected,
}: SectionNavigatorNavButtonProps) => {
  const rootProps = useMemo(
    () => ({
      'aria-current': selected ? ('page' as const) : undefined,
      className: ChannelDetailNavButtonClassName,
      onClick: select,
    }),
    [select, selected],
  );

  return (
    <ListItemLayout
      LeadingIcon={PinnedMessagesNavButtonIcon}
      RootElement='button'
      rootProps={rootProps}
      selected={selected}
      title='Pinned messages'
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
];

export type ChannelDetailProps = Omit<SectionNavigatorProps, 'sections'> & {
  channel: Channel;
  sections?: SectionNavigatorSection[];
};

export const ChannelDetail = ({
  channel,
  className,
  sections = defaultChannelDetailSections,
  ...props
}: ChannelDetailProps) => (
  <ChannelDetailProvider channel={channel}>
    <Prompt.Root className={clsx('str-chat__channel-detail', className)}>
      <SectionNavigator {...props} sections={sections} />
    </Prompt.Root>
  </ChannelDetailProvider>
);
