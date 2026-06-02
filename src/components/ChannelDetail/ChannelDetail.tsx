import clsx from 'clsx';
import React, { useMemo } from 'react';

import {
  SectionNavigator,
  type SectionNavigatorNavButtonProps,
  type SectionNavigatorProps,
  type SectionNavigatorSection,
} from '../SectionNavigator';
import { ChannelManagementView } from './Views/ChannelManagementView';
import { Prompt } from '../Dialog';
import { IconInfo } from '../Icons';
import { ListItemLayout } from '../ListItemLayout';

const ChannelDetailNavButtonClassName = 'str-chat__channel-detail__nav-button';

const ChannelInfoNavButtonIcon = () => (
  <IconInfo className='str-chat__channel-detail__action-icon' />
);

const ChannelInfoNavButton = ({ select, selected }: SectionNavigatorNavButtonProps) => {
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
      LeadingIcon={ChannelInfoNavButtonIcon}
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
    NavButton: ChannelInfoNavButton,
    SectionContent: ChannelManagementView,
  },
];

export type ChannelDetailProps = Omit<SectionNavigatorProps, 'sections'> & {
  sections?: SectionNavigatorSection[];
};

export const ChannelDetail = ({
  className,
  sections = defaultSections,
  ...props
}: ChannelDetailProps) => (
  <Prompt.Root className={clsx('str-chat__channel-detail', className)}>
    <SectionNavigator {...props} sections={sections} />
  </Prompt.Root>
);
