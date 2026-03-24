import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat, UserResponse } from 'stream-chat';

export default (client: StreamChat, user: Partial<UserResponse>) => {
  client.dispatchEvent(
    fromPartial<Event>({
      created_at: new Date().toISOString(),
      type: 'user.updated',
      user,
    }),
  );
};
