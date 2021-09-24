import React from 'react';

import { SuggestionCommand, SuggestionUser, SuggestionItemProps } from 'stream-chat-react';

import type { BaseEmoji } from 'emoji-mart';

type SuggestionItem = BaseEmoji | SuggestionUser | SuggestionCommand;

const isEmoji = (output: SuggestionItem): output is BaseEmoji =>
  (output as BaseEmoji).native != null;

const isMention = (output: SuggestionItem): output is SuggestionUser =>
  (output as SuggestionUser).id != null && (output as SuggestionUser).native == null;

const isEmojiOrMention = (output: SuggestionItem): output is BaseEmoji | SuggestionUser =>
  (output as BaseEmoji | SuggestionUser).id != null;

export const SocialSuggestionList= React.forwardRef(
    (props: SuggestionItemProps, ref: React.Ref<HTMLDivElement>) => {
    const {
        item,
        onClickHandler,
        onSelectHandler,
        selected,
      } = props;
    
      const selectItem = () => onSelectHandler(item);
    
      return (
          <div>suggestion item</div>
        // <li className={`rta__item ${className || ''}`} style={style}>
        //   <div
        //     className={`rta__entity ${selected ? 'rta__entity--selected' : ''}`}
        //     onClick={onClickHandler}
        //     onFocus={selectItem}
        //     onMouseEnter={selectItem}
        //     // ref={innerRef}
        //     role='button'
        //     tabIndex={0}
        //   >
        //     <Component entity={item} selected={selected} />
        //   </div>
        // </li>
      );
}