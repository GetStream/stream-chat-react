import React from 'react';
import {
  Avatar,
  SuggestionCommand,
  SuggestionItemProps,
  SuggestionListHeaderProps,
  SuggestionUser,
} from 'stream-chat-react';
import type { BaseEmoji } from 'emoji-mart';

export const SuggestionHeader: React.FC<SuggestionListHeaderProps> = (props) => {
  const { value } = props;
  const initialCharacter = value[0];

  switch (initialCharacter) {
    case '@':
      return <div className='suggestion-header'>People Matching</div>;

    case '/':
      return <div className='suggestion-header'>Commands Matching</div>;

    case ':':
      return <div className='suggestion-header'>Emojis Matching</div>;

    default:
      return null;
  }
};

type SuggestionItem = BaseEmoji | SuggestionUser | SuggestionCommand;

const isEmoji = (output: SuggestionItem): output is BaseEmoji =>
  (output as BaseEmoji).native != null;

const isMention = (output: SuggestionItem): output is SuggestionUser =>
  (output as SuggestionUser).id != null && (output as SuggestionUser).native == null;

const isEmojiOrMention = (output: SuggestionItem): output is BaseEmoji | SuggestionUser =>
  (output as BaseEmoji | SuggestionUser).id != null;

export const SuggestionListItem = React.forwardRef(
  (props: SuggestionItemProps, ref: React.Ref<HTMLDivElement>) => {
    const { item, onClickHandler, onSelectHandler, selected } = props;
    console.log(props);

    const selectItem = () => onSelectHandler(item);

    const itemName = isEmojiOrMention(item) ? item.name || item.id : item.name;
    const displayText = isEmoji(item) ? `${item.native} - ${itemName}` : itemName;

    return (
      <div
        className={`suggestion-item ${selected ? 'selected' : ''}`}
        onClick={onClickHandler}
        onMouseEnter={selectItem}
        ref={ref}
        role='button'
        tabIndex={0}
      >
        {isMention(item) && <Avatar image={item.image} size={20} />}
        {displayText}
      </div>
    );
  },
);
