import { useEffect, useRef } from 'react';
import {
  Avatar,
  messageHasReactions,
  SimpleReactionsList,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
} from 'stream-chat-react';
import { Emoji, BaseEmoji } from 'emoji-mart';

import { useActionsContext } from '../../contexts/ActionsContext';

import './SocialReactionList.scss';

export const customReactions: BaseEmoji[] = [
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
  const { reactionsOpenId } = useActionsContext();
  const { isMyMessage, message } = useMessageContext();
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();

  const isGroup =
    Object.values(channel.state.members).filter(({ user }) => user?.id !== client.userID).length >
    2;

  const myMessage = isMyMessage();
  const hasReactions = messageHasReactions(message);

  return (
    <>
      {hasReactions && reactionsOpenId === message.id ? (
        <div className={`participants-wrapper ${myMessage ? 'my-message' : ''}`}>
          <div>{`${isGroup ? message.latest_reactions?.length : ''} Message Reactions`}</div>
          <div className='participants-wrapper-users'>
            {message.latest_reactions?.map((reaction) => (
              <div key={reaction.updated_at} className='participants-wrapper__user'>
                <Avatar
                  size={64}
                  image={reaction.user?.image}
                  name={reaction.user?.name || reaction.user?.id}
                />
                <div className={`${reaction.user?.id === client.user?.id ? 'my-reaction' : ''}`}>
                  <div className='avatar-bubble-1'>
                    <div className='avatar-bubble-2'>
                      <div className='avatar-bubble-3'></div>
                    </div>
                  </div>
                  <span className='avatar-emoji'>
                    <Emoji emoji={reaction.type} size={16} />
                  </span>
                </div>
                <div className='participants-wrapper__user-name'>
                  {reaction.user?.id === client.user?.id
                    ? 'You'
                    : reaction.user?.name?.split('-').join('- ') || reaction.user?.id}
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
  const { reactionsOpenId, setReactionsOpenId } = useActionsContext();
  const { message } = useMessageContext();

  const reactionsRef = useRef<HTMLDivElement | null>(null);

  const hasReactions = messageHasReactions(message);

  useEffect(() => {
    const checkIfClickedOutside = (event: MouseEvent) => {
      if (
        reactionsOpenId &&
        reactionsRef.current &&
        event.target instanceof HTMLElement &&
        !reactionsRef.current?.contains(event.target)
      ) {
        setReactionsOpenId('');
      }
    };

    document.addEventListener('mousedown', checkIfClickedOutside);
    return () => {
      document.removeEventListener('mousedown', checkIfClickedOutside);
    };
  }, [reactionsOpenId]); // eslint-disable-line

  return (
    <>
      {hasReactions && (
        <div
          ref={reactionsRef}
          onClick={() => setReactionsOpenId(message.id)}
          className='reaction-list'
        >
          <SimpleReactionsList reactionOptions={customReactions} />
          <div className='bubble-1'>
            <div className='bubble-2'></div>
          </div>
        </div>
      )}
    </>
  );
};
