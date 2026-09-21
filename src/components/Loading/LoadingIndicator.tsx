import React from 'react';
import { useComponentContextIcons } from '../../context';
import type { BaseIconProps } from '../Icons/BaseIcon';

// Typed off the icon contract rather than off a concrete icon: the rendered icon now comes from
// the `IconLoading` slot, which any override can replace.
export type LoadingIndicatorProps = BaseIconProps;

export const LoadingIndicator = (props: LoadingIndicatorProps) => {
  const { IconLoading } = useComponentContextIcons();

  return <IconLoading {...props} className='str-chat__loading-indicator' />;
};
