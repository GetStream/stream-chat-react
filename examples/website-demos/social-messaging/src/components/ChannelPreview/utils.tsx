import type { Channel, ChannelMemberResponse } from 'stream-chat';
import { Avatar } from 'stream-chat-react';

import { StreamChatGenerics } from '../../types';

import { BlankAvatar } from '../../assets';

type Props<SocialStreamChatGenerics extends StreamChatGenerics = StreamChatGenerics> = {
  members: ChannelMemberResponse<SocialStreamChatGenerics>[] | undefined;
  size?: number;
};

export const AvatarGroup = (props: Props<StreamChatGenerics>) => {
  const { members, size } = props;

  if (!members) return <BlankAvatar size={size} />;

  const modifiedSize = size === 56 ? 30 : 20;

  if (members.length === 1) {
    return (
      <Avatar
        image={(members[0].user?.image as string) || ''}
        name={members[0].user?.name || members[0].user?.id}
        size={size || 56}
      />
    );
  }

  if (members.length === 2) {
    return (
      <div className='channel-preview-avatar-avatars'>
        <span>
          <Avatar
            image={(members[0].user?.image as string) || ''}
            name={members[0].user?.name || members[0].user?.id}
            shape='square'
            size={modifiedSize}
          />
        </span>
        <span>
          <Avatar
            image={(members[1].user?.image as string) || ''}
            name={members[1].user?.name || members[1].user?.id}
            shape='square'
            size={modifiedSize}
          />
        </span>
      </div>
    );
  }

  if (members.length === 3) {
    return (
      <div className='channel-preview-avatar-avatars'>
        <span>
          <Avatar
            image={(members[0].user?.image as string) || ''}
            name={members[0].user?.name || members[0].user?.id}
            shape='square'
            size={modifiedSize}
          />
          <Avatar image={''} name={''} shape='square' size={modifiedSize} />
        </span>
        <span>
          <Avatar
            image={(members[1].user?.image as string) || ''}
            name={members[1].user?.name || members[1].user?.id}
            shape='square'
            size={modifiedSize}
          />
          <Avatar
            image={(members[2].user?.image as string) || ''}
            name={members[2].user?.name || members[2].user?.id}
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
            name={members[members.length - 1].user?.name || members[members.length - 1].user?.id}
            shape='square'
            size={modifiedSize}
          />
          <Avatar
            image={(members[members.length - 2].user?.image as string) || ''}
            name={members[members.length - 2].user?.name || members[members.length - 2].user?.id}
            shape='square'
            size={modifiedSize}
          />
        </span>
        <span>
          <Avatar
            image={(members[members.length - 3].user?.image as string) || ''}
            name={members[members.length - 3].user?.name || members[members.length - 3].user?.id}
            shape='square'
            size={modifiedSize}
          />
          <Avatar
            image={(members[members.length - 4].user?.image as string) || ''}
            name={members[members.length - 4].user?.name || members[members.length - 4].user?.id}
            shape='square'
            size={modifiedSize}
          />
        </span>
      </div>
    );
  }

  return null;
};

export const getTimeStamp = (channel: Channel<StreamChatGenerics>) => {
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
