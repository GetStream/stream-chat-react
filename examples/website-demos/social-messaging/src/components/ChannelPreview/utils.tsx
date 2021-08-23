import type { Channel, ChannelMemberResponse } from 'stream-chat';

import { Avatar } from 'stream-chat-react';
import { BlankAvatar } from '../../assets';
// import { SocialUserType } from '../ChatContainer/ChatContainer';

type Props = {
  members: ChannelMemberResponse[] | undefined;
  size: number | undefined;
}

export const AvatarGroup: React.FC<Props> = (props) => {
  const { members, size } = props;

  if (!members) return <BlankAvatar size={size || 56}  />

  let modifiedSize = size === 56 ? 30 : 20;

  if (members.length === 1) {
    return (
      <Avatar
        image={(members[0].user?.image as string) || ''}
        name={members[0].user?.name || 'User'}
        size={size || 56}
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
            size={modifiedSize}
          />
        </span>
        <span>
          <Avatar
            image={(members[1].user?.image as string) || ''}
            name={members[1].user?.name || 'User'}
            shape='square'
            size={modifiedSize}
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
            size={modifiedSize}
          />
        </span>
        <span>
          <Avatar
            image={(members[1].user?.image as string) || ''}
            name={members[1].user?.name || 'User'}
            shape='square'
            size={modifiedSize}
          />
          <Avatar
            image={(members[2].user?.image as string) || ''}
            name={members[2].user?.name || 'User'}
            shape='square'
            size={modifiedSize}
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
            size={modifiedSize}
          />
          <Avatar
            image={(members[members.length - 2].user?.image as string) || ''}
            name={members[members.length - 2].user?.name || 'User'}
            shape='square'
            size={modifiedSize}
          />
        </span>
        <span>
          <Avatar
            image={(members[members.length - 3].user?.image as string) || ''}
            name={members[members.length - 3].user?.name || 'User'}
            shape='square'
            size={modifiedSize}
          />
          <Avatar
            image={(members[members.length - 4].user?.image as string) || ''}
            name={members[members.length - 4].user?.name || 'User'}
            shape='square'
            size={modifiedSize}
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
