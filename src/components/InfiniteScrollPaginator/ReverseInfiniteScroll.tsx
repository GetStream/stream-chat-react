import React from 'react';

import { InfiniteScroll, InfiniteScrollProps } from './InfiniteScroll';

export const ReverseInfiniteScroll: React.FC<InfiniteScrollProps> = (props) => (
  <InfiniteScroll {...props} isReverse />
);
