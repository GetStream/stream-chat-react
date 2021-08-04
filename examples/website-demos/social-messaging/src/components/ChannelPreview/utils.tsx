import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { Avatar } from 'stream-chat-react';

export const AvatarGroup = ({ members }: { members: ChannelMemberResponse[] }) => {
  if (members.length === 1) {
    return (
      <Avatar
        image={(members[0].user?.image as string) || ''}
        name={members[0].user?.name || 'User'}
        size={56}
      />
    );
  }

  if (members.length === 2) {
    return (
      <div className='channel-preview-avatar-avatars two'>
        <span>
          <Avatar
            image={(members[0].user?.image as string) || ''}
            name={members[0].user?.name || 'User'}
            shape='square'
            size={25}
          />
        </span>
        <span>
          <Avatar
            image={(members[1].user?.image as string) || ''}
            name={members[1].user?.name || 'User'}
            shape='square'
            size={25}
          />
        </span>
      </div>
    );
  }

  if (members.length === 3) {
    return (
      <div className='channel-preview-avatar-avatars three'>
        <span>
          <Avatar
            image={(members[0].user?.image as string) || ''}
            name={members[0].user?.name || 'User'}
            shape='square'
            size={25}
          />
        </span>
        <span>
          <Avatar
            image={(members[1].user?.image as string) || ''}
            name={members[1].user?.name || 'User'}
            shape='square'
            size={25}
          />
          <Avatar
            image={(members[2].user?.image as string) || ''}
            name={members[2].user?.name || 'User'}
            shape='square'
            size={25}
          />
        </span>
      </div>
    );
  }

  if (members.length >= 4) {
    return (
      <div className='channel-preview-avatar-avatars'>
        <span>
          <Avatar
            image={(members[members.length - 1].user?.image as string) || ''}
            name={members[members.length - 1].user?.name || 'User'}
            shape='square'
            size={30}
          />
          <Avatar
            image={(members[members.length - 2].user?.image as string) || ''}
            name={members[members.length - 2].user?.name || 'User'}
            shape='square'
            size={30}
          />
        </span>
        <span>
          <Avatar
            image={(members[members.length - 3].user?.image as string) || ''}
            name={members[members.length - 3].user?.name || 'User'}
            shape='square'
            size={30}
          />
          <Avatar
            image={(members[members.length - 4].user?.image as string) || ''}
            name={members[members.length - 4].user?.name || 'User'}
            shape='square'
            size={30}
          />
        </span>
      </div>
    );
  }

  return null;
};

export const getTimeStamp = (channel: Channel) => {
  let lastHours = channel.state.last_message_at?.getHours();
  let lastMinutes: string | number | undefined = channel.state.last_message_at?.getMinutes();
  let half = 'AM';

  if (lastHours === undefined || lastMinutes === undefined) {
    return '';
  }

  if (lastHours > 12) {
    lastHours = lastHours - 12;
    half = 'PM';
  }

  if (lastHours === 0) lastHours = 12;
  if (lastHours === 12) half = 'PM';

  if (lastMinutes.toString().length === 1) {
    lastMinutes = `0${lastMinutes}`;
  }

  return `${lastHours}:${lastMinutes} ${half}`;
};
