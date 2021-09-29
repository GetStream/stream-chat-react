import { Avatar, SuggestionUser } from 'stream-chat-react';

import { Mention } from '../../assets';

import { SocialUserType } from '../ChatContainer/ChatContainer';

import './SocialSuggestionItem.scss';

type Props = SuggestionUser<SocialUserType> & {
    itemNameParts?: { match: string, parts: string[] };
};

export const MentionItem = (props: Props) => {
    const { id, image, itemNameParts, name } = props;

    console.log('props IS:', props);

    const renderName = () => {      
        return (
          itemNameParts?.parts.map((part, i) =>
            part.toLowerCase() === itemNameParts.match.toLowerCase() ? (
              <span className='mention-item-contents-name-highlight' key={`part-${i}`}>
                {part}
              </span>
            ) : (
              <span className='mention-item-contents-name-part' key={`part-${i}`}>
                {part}
              </span>
            ),
          )
        );
      };

    return (
        <div className='mention-item'>
          <Avatar image={image || ''} name={name || id} size={56} />
          <div className='mention-item-contents'>
            <div className='mention-item-contents-name'>{renderName()}</div>
            <div className='mention-item-contents-mention'>
                <span>@{name || id}</span>
            </div>
          </div>
          <Mention />
        </div>
      );
};