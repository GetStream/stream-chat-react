import { Avatar, SuggestionUser } from 'stream-chat-react';

import { Mention } from '../../assets';

import { StreamChatGenerics } from '../../types';

import type { BaseEmoji } from 'emoji-mart';

import './SocialSuggestionList.scss';

type Props = Partial<SuggestionUser<StreamChatGenerics>> &
  Partial<BaseEmoji> & {
    itemNameParts?: { match: string; parts: string[] };
  };

export const renderName = (itemNameParts?: { match: string; parts: string[] }) => {
  return itemNameParts?.parts.map((part, i) =>
    part.toLowerCase() === itemNameParts.match.toLowerCase() ? (
      <span className='suggestion-item-contents-name-highlight' key={`part-${i}`}>
        {part}
      </span>
    ) : (
      <span className='suggestion-item-contents-name-part' key={`part-${i}`}>
        {part}
      </span>
    ),
  );
};

export const MentionItem = (props: Props) => {
  const { id, image, itemNameParts, name } = props;

  return (
    <>
      <Avatar image={image || ''} name={name || id} size={56} />
      <div className='suggestion-item-contents'>
        <div className='suggestion-item-contents-name'>{renderName(itemNameParts)}</div>
        <div className='suggestion-item-contents-mention'>
          <span>@{name || id}</span>
        </div>
      </div>
      <Mention />
    </>
  );
};
