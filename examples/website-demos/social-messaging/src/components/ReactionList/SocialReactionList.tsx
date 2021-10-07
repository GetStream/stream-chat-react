import React from 'react';
import {
  Avatar,
  messageHasReactions,
  SimpleReactionsList,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
} from 'stream-chat-react';

import './SocialReactionList.scss';

export const customReactions = [
  {
    colons: ':heart:',
    emoticons: ['<3'],
    id: 'heart',
    name: 'Heart',
    native: '❤️',
    skin: null,
    unified: '2764',
  },
  {
    colons: ':+1:',
    emoticons: ['b'],
    id: '+1',
    name: 'Thumbs Up',
    native: '👍',
    skin: null,
    unified: '1F44D',
  },
  {
    colons: ':-1:',
    emoticons: ['p'],
    id: '-1',
    name: 'Thumbs Down',
    native: '👎',
    skin: null,
    unified: '1f44e',
  },
  {
    colons: ':laughing:',
    emoticons: ['x)'],
    id: 'laughing',
    name: 'Grinning Squinting Face',
    native: '😆',
    skin: null,
    unified: '1F606',
  },
  {
    colons: ':angry:',
    emoticons: ['=/', '>=('],
    id: 'angry',
    name: 'Angry',
    native: '😠',
    skin: null,
    unified: '1F620',
  },
];

export const ReactionParticipants: React.FC = () => {
  const { isMyMessage, message } = useMessageContext();
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();

  const isGroup =
    Object.values(channel.state.members).filter(({ user }) => user?.id !== client.userID).length >
    2;

  const myMessage = isMyMessage();

  return (
    <>
      {message.latest_reactions?.length ? (
        <div className={`participants-wrapper ${myMessage && 'my-message'}`}>
          <div>{`${isGroup ? message.latest_reactions?.length : ''} Message Reactions`}</div>
          <div className='participants-wrapper-users'>
            {message.latest_reactions?.map((reaction) => (
              <div className='participants-wrapper__user'>
                <Avatar
                  size={64}
                  image={message.user?.image}
                  name={message.user?.name || message.user?.id}
                />
                <div className='participants-wrapper__user-name'>
                  {myMessage
                    ? 'You'
                    : message.user?.name?.split('-').join('- ') ||
                      message.user?.id.split('-').join('- ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};

export const SocialReactionList: React.FC = () => {
  const { isReactionEnabled, message } = useMessageContext();

  const hasReactions = messageHasReactions(message);

  return (
    <>
      {hasReactions && isReactionEnabled && (
        <div className='reaction-list'>
          <SimpleReactionsList reactionOptions={customReactions} />
          <div className='bubble-1'>
            <div className='bubble-2'></div>
          </div>
        </div>
      )}
    </>
  );
};
