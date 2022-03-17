import type { Channel, UserResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type ChannelOrUserResponse<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Channel<StreamChatGenerics> | UserResponse<StreamChatGenerics>;

export const isChannel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  output: ChannelOrUserResponse<StreamChatGenerics>,
): output is Channel<StreamChatGenerics> => (output as Channel<StreamChatGenerics>).cid != null;
