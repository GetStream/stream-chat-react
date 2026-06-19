import React, { type ComponentType } from 'react';

import type { SectionNavigatorNavButtonProps } from './SectionNavigator';
import { ListItemLayout } from '../../components/ListItemLayout';
import clsx from 'clsx';

export type ChannelDetailNavButtonProps = SectionNavigatorNavButtonProps & {
  /** Icon rendered as the leading element of the nav button. */
  LeadingIcon: ComponentType;
  /** Label displayed for the section. */
  title: string;
};

/**
 * Underlying button shared by all ChannelDetail section nav buttons. Renders a
 * `ListItemLayout` as a `<button>` and wires the SectionNavigator selection
 * state into `aria-current` and the click handler.
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
