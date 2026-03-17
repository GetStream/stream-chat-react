import React, { type ComponentProps } from 'react';
import { IconLoadingCircle } from '../Icons';

export type LoadingIndicatorProps = ComponentProps<typeof IconLoadingCircle>;

export const LoadingIndicator = (props: LoadingIndicatorProps) => (
  <IconLoadingCircle {...props} className='str-chat__loading-indicator' />
);
