// @ts-check
import React from 'react';
import InfiniteScroll from './InfiniteScroll';

/** @type {React.FC<import("types").InfiniteScrollProps>} */
const ReverseInfiniteScroll = (props) => (
  <InfiniteScroll {...props} isReverse />
);

export default ReverseInfiniteScroll;
