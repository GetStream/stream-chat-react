/* eslint-disable react/display-name */
import React from 'react';

import { StreamEmoji } from './StreamEmoji';

export type ReactionOptions = Record<
  string,
  { Component: React.ComponentType; aliases?: string[]; name?: string }
>;

export const defaultReactionOptions: ReactionOptions = {
  angry: { Component: () => <StreamEmoji fallback='😠' type='angry' />, name: 'Angry' },
  haha: { Component: () => <StreamEmoji fallback='😂' type='haha' />, name: 'Joy' },
  like: { Component: () => <StreamEmoji fallback='👍' type='like' />, name: 'Thumbs up' },
  love: { Component: () => <StreamEmoji fallback='❤️' type='love' />, name: 'Heart' },
  sad: { Component: () => <StreamEmoji fallback='😔' type='sad' />, name: 'Sad' },
  wow: { Component: () => <StreamEmoji fallback='😲' type='wow' />, name: 'Astonished' },
};
