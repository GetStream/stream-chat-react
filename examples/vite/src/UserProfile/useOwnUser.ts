import { useEffect, useState } from 'react';
import type { CustomUserData, StreamChat } from 'stream-chat';

/** The connected user's fields the profile shows and edits. */
export type ProfileUser = {
  custom: Record<string, unknown>;
  id: string;
  image?: string;
  name?: string;
  role?: string;
};

/** Both `client.user` and the users an update returns carry these fields. */
type UserFields = {
  custom?: CustomUserData;
  id: string;
  image?: string;
  name?: string;
  role?: string;
};

export const toProfileUser = (user: UserFields): ProfileUser => ({
  custom: Object.fromEntries(Object.entries(user.custom ?? {})),
  id: user.id,
  image: user.image,
  name: user.name,
  role: user.role,
});

/**
 * The connected user, kept current with `user.updated` events for that user. `client.user` is not
 * reactive, so the event is what tells the profile that it changed, e.g. from another device. The
 * setter lets a save show the server's answer right away, before or without that event.
 */
export const useOwnUser = (client: StreamChat) => {
  const [user, setUser] = useState(() =>
    client.user ? toProfileUser(client.user) : undefined,
  );

  useEffect(() => {
    setUser(client.user ? toProfileUser(client.user) : undefined);
    const { unsubscribe } = client.on('user.updated', (event) => {
      if (event.user?.id !== client.userID || !client.user) return;
      setUser(toProfileUser(client.user));
    });
    return unsubscribe;
  }, [client]);

  return [user, setUser] as const;
};
