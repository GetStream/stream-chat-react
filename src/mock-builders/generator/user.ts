import { nanoid } from 'nanoid';
import type { UserResponse } from 'stream-chat';

export const generateUser = (options: Partial<UserResponse> = {}) =>
  ({
    banned: false,
    created_at: '2020-04-27T13:39:49.331742Z',
    id: nanoid(),
    image: nanoid(),
    name: nanoid(),
    online: false,
    role: 'user',
    updated_at: '2020-04-27T13:39:49.332087Z',
    ...options,
  }) as UserResponse;
