import React, { type ComponentType } from 'react';

import type { SectionNavigatorNavButtonProps } from './SectionNavigator';
import { ListItemLayout } from '../../components/ListItemLayout';
import clsx from 'clsx';

export type ChannelDetailNavButtonProps = SectionNavigatorNavButtonProps & {
  /** Icon at the start of the button. */
  LeadingIcon: ComponentType;
  /** Section label. */
  title: string;
};

/**
 * Button shared by the ChannelDetail section nav buttons: a `ListItemLayout` rendered as a
 * `<button>` whose `aria-current` and click handler follow the `SectionNavigator` selection.
 */
export const ChannelDetailNavButton = ({
  className,
  LeadingIcon,
  // Dropped so it is not forwarded onto the DOM <button> via `...props`.
  sectionId: _sectionId, // eslint-disable-line @typescript-eslint/no-unused-vars
  select,
  selected,
  title,
  ...props
}: ChannelDetailNavButtonProps) => (
  <ListItemLayout
    LeadingIcon={LeadingIcon}
    RootElement='button'
    rootProps={{
      ...props,
      'aria-current': selected ? ('page' as const) : undefined,
      className: clsx('str-chat__channel-detail__nav-button', className),
      onClick: select,
    }}
    selected={selected}
    title={title}
  />
);
