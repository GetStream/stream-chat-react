/* eslint-disable sort-keys */
/* eslint-disable react/display-name */
import React from 'react';

import { StreamEmoji } from './StreamEmoji';

export type ReactionOptions = Array<{
  Component: React.ComponentType;
  type: string;
  name?: string;
}>;

export const defaultReactionOptions: ReactionOptions = [
  { type: 'angry', Component: () => <StreamEmoji fallback='😠' type='angry' />, name: 'Angry' },
  { type: 'haha', Component: () => <StreamEmoji fallback='😂' type='haha' />, name: 'Joy' },
  { type: 'like', Component: () => <StreamEmoji fallback='👍' type='like' />, name: 'Thumbs up' },
  { type: 'love', Component: () => <StreamEmoji fallback='❤️' type='love' />, name: 'Heart' },
  { type: 'sad', Component: () => <StreamEmoji fallback='😔' type='sad' />, name: 'Sad' },
  { type: 'wow', Component: () => <StreamEmoji fallback='😲' type='wow' />, name: 'Astonished' },
];
