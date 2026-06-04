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
import { Prompt } from '../Dialog';
import { IconInfo } from '../Icons';
import { ListItemLayout } from '../ListItemLayout';

const ChannelDetailNavButtonClassName = 'str-chat__channel-detail__nav-button';

const ChannelManagementNavButtonIcon = () => (
  <IconInfo className='str-chat__channel-detail__action-icon' />
);

const ChannelManagementNavButton = ({
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

const defaultSections: SectionNavigatorSection[] = [
  {
    id: 'channel-info',
    NavButton: ChannelManagementNavButton,
    SectionContent: ChannelManagementView,
  },
];

export type ChannelDetailProps = Omit<SectionNavigatorProps, 'sections'> & {
  channel: Channel;
  sections?: SectionNavigatorSection[];
};

export const ChannelDetail = ({
  channel,
  className,
  sections = defaultSections,
  ...props
}: ChannelDetailProps) => (
  <ChannelDetailProvider channel={channel}>
    <Prompt.Root className={clsx('str-chat__channel-detail', className)}>
      <SectionNavigator {...props} sections={sections} />
    </Prompt.Root>
  </ChannelDetailProvider>
);
