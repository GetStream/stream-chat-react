import React, { type ComponentType, useMemo } from 'react';

import type { SectionNavigatorNavButtonProps } from '../SectionNavigator';
import { ListItemLayout } from '../ListItemLayout';
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
  select,
  selected,
  title,
  ...props
}: ChannelDetailNavButtonProps) => {
  const rootProps = useMemo(
    () => ({
      ...props,
      'aria-current': selected ? ('page' as const) : undefined,
      className: clsx('str-chat__channel-detail__nav-button', className),
      onClick: select,
    }),
    [className, props, select, selected],
  );

  return (
    <ListItemLayout
      LeadingIcon={LeadingIcon}
      RootElement='button'
      rootProps={rootProps}
      selected={selected}
      title={title}
    />
  );
};
