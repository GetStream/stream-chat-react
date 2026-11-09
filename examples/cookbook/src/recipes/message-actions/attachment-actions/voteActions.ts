import type { Action } from 'stream-chat';

export const voteActions: Action[] = [
  { name: 'vote', text: 'Love', type: 'button', value: 'love' },
  { name: 'vote', text: 'Loathe', type: 'button', value: 'sad' },
];
