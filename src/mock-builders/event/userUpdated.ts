import { nowNs } from 'stream-chat';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat, UserResponse } from 'stream-chat';

export default (client: StreamChat, user: Partial<UserResponse>) => {
  client.dispatchEvent(
    fromPartial<Event>({
      created_at: nowNs(),
      type: 'user.updated',
      user,
    }),
  );
};
