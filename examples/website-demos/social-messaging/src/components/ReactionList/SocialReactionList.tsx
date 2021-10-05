import { messageHasReactions, SimpleReactionsList, useMessageContext } from 'stream-chat-react';

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

export const SocialReactionList = () => {
  const {
    isReactionEnabled,
    message,
  } = useMessageContext();

  const hasReactions = messageHasReactions(message);

  return (
    <>
      {hasReactions && isReactionEnabled && (
        <>
          <div className='reaction-list'>
            <SimpleReactionsList reactionOptions={customReactions} />
            <div className='bubble-1'>
              <div className='bubble-2'></div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
