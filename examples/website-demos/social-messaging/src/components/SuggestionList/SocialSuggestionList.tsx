import React from 'react';
import { SuggestionCommand, SuggestionItemProps, SuggestionUser } from 'stream-chat-react';

import { Ban, Flag, Giphy, Mute, Unban, Unmute } from '../../assets';

import type { BaseEmoji } from 'emoji-mart';

import { MentionItem } from './MentionItem';

type ExtendedUser = SuggestionUser & {
  itemNameParts?: { match: string; parts: string[] };
};

const isEmoji = (output: SuggestionItem): output is BaseEmoji =>
  (output as BaseEmoji).native != null;

const isMention = (output: SuggestionItem): output is ExtendedUser =>
  (output as ExtendedUser).id != null && (output as ExtendedUser).native == null;

const isEmojiOrMention = (output: SuggestionItem): output is BaseEmoji | ExtendedUser =>
  (output as BaseEmoji | ExtendedUser).id != null;

const getCommandIcon = (name?: string) => {
  let description;
  let Icon;

  switch (name) {
    case 'ban':
      description = '/ban [@username] [text]';
      Icon = Ban;
      break;
    case 'flag':
      description = '/flag [@username]';
      Icon = Flag;
      break;
    case 'giphy':
      description = '/giphy [query]';
      Icon = Giphy;
      break;
    case 'mute':
      description = '[@username]';
      Icon = Mute;
      break;
    case 'unban':
      description = '[@username]';
      Icon = Unban;
      break;
    case 'unmute':
      description = '[@username]';
      Icon = Unmute;
      break;
    default:
      break;
  }

  return { description, Icon };
};

type SuggestionItem = BaseEmoji | ExtendedUser | SuggestionCommand;

export const SocialSuggestionList = React.forwardRef(
  (
    props: SuggestionItemProps & {
      itemNameParts?: { match: string; parts: string[] };
    },
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const { item, onClickHandler, onSelectHandler, selected } = props;

    const selectItem = () => onSelectHandler(item);

    const { description, Icon } = getCommandIcon(item.name);

    const itemName = isEmojiOrMention(item) ? item.name || item.id : item.name;
    const displayText = isEmoji(item) ? `${item.native} ${itemName}` : itemName;

    return (
      <div
        className={`suggestion-item ${selected ? 'selected' : ''}`}
        onClick={onClickHandler}
        onMouseEnter={selectItem}
        ref={ref}
        role='button'
        tabIndex={0}
      >
        {!isEmojiOrMention(item) && (
          <div className='suggestion-item-icon'>{Icon ? <Icon /> : null}</div>
        )}
        {!isMention(item) && <div className='suggestion-item-text'>{displayText}</div>}
        {!isMention(item) && <div className='suggestion-item-description'>{description}</div>}
        {isMention(item) && (
          <MentionItem
            id={item.id}
            image={item.image}
            itemNameParts={item.itemNameParts}
            name={item.name}
          />
        )}
      </div>
    );
  },
);
