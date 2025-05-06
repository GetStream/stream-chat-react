import type { Channel, UserResponse } from 'stream-chat';

export type ChannelOrUserResponse = Channel | UserResponse;

export const isChannel = (output: ChannelOrUserResponse): output is Channel =>
  (output as Channel).cid != null;
