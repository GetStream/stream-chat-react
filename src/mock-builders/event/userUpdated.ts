import { fromPartial } from '@total-typescript/shoehorn';
import type { Event, StreamChat, UserResponse } from 'stream-chat';
import { convertDateToTimestamp } from '../generator/time';

export default (client: StreamChat, user: Partial<UserResponse>) => {
  client.dispatchEvent(
    fromPartial<Event>({
      created_at: convertDateToTimestamp(),
      type: 'user.updated',
      user,
    }),
  );
};
