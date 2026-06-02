import clsx from 'clsx';
import React from 'react';

import {
  SectionNavigator,
  type SectionNavigatorNavButtonProps,
  type SectionNavigatorProps,
  type SectionNavigatorSection,
} from '../SectionNavigator';
import { ChannelManagementView } from './Views/ChannelManagementView';
import { Prompt } from '../Dialog';
import { ListItemButton } from '../Button';
import { IconInfo } from '../Icons';

const ChannelDetailNavButtonClassName = 'str-chat__channel-detail__nav-button';

const defaultSections: SectionNavigatorSection[] = [
  {
    id: 'channel-info',
    NavButton: ({ select, selected }: SectionNavigatorNavButtonProps) => (
      <ListItemButton
        aria-current={selected ? 'page' : undefined}
        className={ChannelDetailNavButtonClassName}
        LeadingIcon={IconInfo}
        onClick={select}
        selected={selected}
        title='Channel info'
      />
    ),
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
