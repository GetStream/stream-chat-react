import type { Channel } from 'stream-chat';

export const isDmChannel = ({
  channel,
  ownUserId,
}: {
  channel: Channel;
  ownUserId?: string;
}) => {
  const memberCount = channel.data?.member_count ?? 0;
  return (
    memberCount === 1 ||
    (memberCount === 2 &&
      !!ownUserId &&
      Object.values(channel.state?.members ?? {}).some(
        ({ user }) => user?.id === ownUserId,
      ))
  );
};
