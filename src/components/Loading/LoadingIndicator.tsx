import React, { type ComponentProps } from 'react';
import { useComponentContextIcons } from '../../context';
import type { IconLoading as DefaultIconLoading } from '../Icons';

export type LoadingIndicatorProps = ComponentProps<typeof DefaultIconLoading>;

export const LoadingIndicator = (props: LoadingIndicatorProps) => {
  const { IconLoading } = useComponentContextIcons();
  return <IconLoading {...props} className='str-chat__loading-indicator' />;
};
