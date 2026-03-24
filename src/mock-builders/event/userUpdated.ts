import type { StreamChat, UserResponse } from 'stream-chat';

export default (client: StreamChat, user: UserResponse) => {
  client.dispatchEvent({
    created_at: new Date().toISOString(),
    type: 'user.updated',
    user,
  } as any);
};
