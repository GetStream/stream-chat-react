import { useEffect, useRef } from 'react';
import {
  Avatar,
  messageHasReactions,
  SimpleReactionsList,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
} from 'stream-chat-react';

import { useViewContext } from '../../contexts/ViewContext';

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
  const { reactionsOpen } = useViewContext();

  const isGroup =
    Object.values(channel.state.members).filter(({ user }) => user?.id !== client.userID).length >
    2;

  const myMessage = isMyMessage();
  const hasReactions = messageHasReactions(message);

  return (
    <>
      {hasReactions && reactionsOpen === message.id ? (
        <div className={`participants-wrapper ${myMessage && 'my-message'}`}>
          <div>{`${isGroup ? message.latest_reactions?.length : ''} Message Reactions`}</div>
          <div className='participants-wrapper-users'>
            {message.latest_reactions?.map((reaction) => (
              <div key={reaction.updated_at} className='participants-wrapper__user'>
                <Avatar
                  size={64}
                  image={message.user?.image}
                  name={message.user?.name || message.user?.id}
                />
                <div className='participants-wrapper__user-name'>
                  {myMessage
                    ? 'You'
                    : message.user?.name?.split('-').join('- ') || message.user?.id}
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
  const { message } = useMessageContext();
  const { reactionsOpen, setReactionsOpen } = useViewContext();

  console.log({ reactionsOpen });


  const reactionsRef = useRef<HTMLDivElement | null>(null);


  const hasReactions = messageHasReactions(message);

  const handleReactionListClick = (id: string) => {
    setReactionsOpen(id);
  };

  useEffect(() => {
    const checkIfClickedOutside = (event: MouseEvent) => {
      if (
        reactionsOpen &&
        reactionsRef.current &&
        event.target instanceof Element &&
        !reactionsRef.current?.contains(event.target)
      ) {
        setReactionsOpen('');
      }
    };

    document.addEventListener('click', checkIfClickedOutside);
    return () => {
      document.removeEventListener('click', checkIfClickedOutside);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactionsOpen]);

  // useEffect(() => {
  //   const handleClickOutside = (event: Event) => {
  //     if (event.target instanceof HTMLElement) {
  //       const elements = document.getElementsByClassName('reaction-list');
  //       const reactionList = elements.item(0);

  //       if (!reactionList?.contains(event.target)) {
  //         setReactionsOpen('');
  //       }
  //     }
  //   };

  //   if (reactionsOpen) document.addEventListener('click', handleClickOutside);
  //   return () => document.removeEventListener('click', handleClickOutside);
  // }, [reactionsOpen]); // eslint-disable-line

  return (
    <>
      {hasReactions && (
        <div onClick={() => handleReactionListClick(message.id)} className='reaction-list'>
          <SimpleReactionsList reactionOptions={customReactions} />
          <div className='bubble-1'>
            <div className='bubble-2'></div>
          </div>
        </div>
      )}
    </>
  );
};
