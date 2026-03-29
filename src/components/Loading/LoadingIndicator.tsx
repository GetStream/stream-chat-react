import React, { type ComponentProps } from 'react';
import { IconLoading } from '../Icons';

export type LoadingIndicatorProps = ComponentProps<typeof IconLoading>;

export const LoadingIndicator = (props: LoadingIndicatorProps) => (
  <IconLoading {...props} className='str-chat__loading-indicator' />
);
