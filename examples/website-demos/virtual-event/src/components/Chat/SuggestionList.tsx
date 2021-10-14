import React from 'react';
import {
  Avatar,
  SuggestionCommand,
  SuggestionItemProps,
  SuggestionListHeaderProps,
  SuggestionUser,
} from 'stream-chat-react';

import { Ban, CommandBolt, Flag, Giphy, Mute, Unban, Unmute } from '../../assets';

import type { BaseEmoji } from 'emoji-mart';

const isEmoji = (output: SuggestionItem): output is BaseEmoji =>
  (output as BaseEmoji).native != null;

const isMention = (output: SuggestionItem): output is SuggestionUser =>
  (output as SuggestionUser).id != null && (output as SuggestionUser).native == null;

const isEmojiOrMention = (output: SuggestionItem): output is BaseEmoji | SuggestionUser =>
  (output as BaseEmoji | SuggestionUser).id != null;

export const SuggestionHeader: React.FC<SuggestionListHeaderProps> = (props) => {
  const { value } = props;
  const initialCharacter = value[0];

  switch (initialCharacter) {
    case '@':
      return (
        <div className='suggestion-header'>
          <span>@</span>
          <div>People Matching</div>
        </div>
      );

    case '/':
      return (
        <div className='suggestion-header'>
          <CommandBolt />
          <div>Commands Matching</div>
        </div>
      );

    case ':':
      return <div className='suggestion-header'>Emojis Matching</div>;

    default:
      return null;
  }
};

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

type SuggestionItem = BaseEmoji | SuggestionUser | SuggestionCommand;

export const SuggestionListItem = React.forwardRef(
  (props: SuggestionItemProps, ref: React.Ref<HTMLDivElement>) => {
    const { item, onClickHandler, onSelectHandler, selected } = props;

    const selectItem = () => onSelectHandler(item);

    const { description, Icon } = getCommandIcon(item.name);

    const itemName = isEmojiOrMention(item) ? item.name || item.id : item.name;
    const displayText = isEmoji(item) ? `${item.native}- ${itemName}` : itemName;

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
        {isMention(item) ? <Avatar image={item.image} size={24} /> : null}
        <div>{displayText}</div>
        <div className='suggestion-item-description'>{description}</div>
      </div>
    );
  },
);
