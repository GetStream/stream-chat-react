import type { Channel, UserResponse } from 'stream-chat';

export const getFormattedTime = (time: number) => {
  if (!time) return '';
  if (time < 60) return 'Less than 1 min';
  if (time < 120) return '1 min';
  if (time < 3600) return `${Math.floor(time / 60)} mins`;
  if (time < 86400) return `${Math.floor(time / 3600)} hours`;
  return `${Math.floor(time / 86400)} days`;
};

export const isChannel = (output: Channel | UserResponse): output is Channel =>
  (output as Channel).cid != null;
