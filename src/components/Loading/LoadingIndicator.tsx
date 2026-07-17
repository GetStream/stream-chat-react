import React, { type ComponentProps } from 'react';
import { useComponentContext } from '../../context';
import { IconLoading as DefaultIconLoading } from '../Icons';

export type LoadingIndicatorProps = ComponentProps<typeof DefaultIconLoading>;

export const LoadingIndicator = (props: LoadingIndicatorProps) => {
  const { icons: { IconLoading = DefaultIconLoading } = {} } = useComponentContext();
  return <IconLoading {...props} className='str-chat__loading-indicator' />;
};
