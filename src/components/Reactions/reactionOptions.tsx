/* eslint-disable sort-keys */

import React from 'react';

export type ReactionOptions = Array<{
  Component: React.ComponentType;
  type: string;
  name?: string;
}>;

export const defaultReactionOptions: ReactionOptions = [
  {
    type: 'haha',
    Component: () => <>😂</>,
    name: 'Joy',
  },
  {
    type: 'like',
    Component: () => <>👍</>,
    name: 'Thumbs up',
  },
  {
    type: 'love',
    Component: () => <>❤️</>,
    name: 'Heart',
  },
  { type: 'sad', Component: () => <>😔</>, name: 'Sad' },
  {
    type: 'wow',
    Component: () => <>😮</>,
    name: 'Astonished',
  },
  {
    type: 'fire',
    Component: () => <>🔥</>,
    name: 'Fire',
  },
];
