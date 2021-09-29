import React from 'react';

import { EmoticonItem, SuggestionCommand, SuggestionUser, SuggestionItemProps } from 'stream-chat-react';

import type { BaseEmoji } from 'emoji-mart';

import { MentionItem } from './MentionItem';

type ExtendedEmoji = BaseEmoji & {
  itemNameParts: { match: string, parts: string[] };
  native: string;
};

type ExtendedSuggestionUser = SuggestionUser & {
  itemNameParts: { match: string, parts: string[] };
};

type SuggestionItem = ExtendedEmoji | ExtendedSuggestionUser | SuggestionCommand;

const isEmoji = (output: SuggestionItem): output is ExtendedEmoji =>
  (output as ExtendedEmoji).native != null;

const isMention = (output: SuggestionItem): output is ExtendedSuggestionUser =>
  (output as ExtendedSuggestionUser).id != null && (output as ExtendedSuggestionUser).native == null;

const isCommand = (output: SuggestionCommand): output is SuggestionCommand =>
  (output as SuggestionCommand).args != null && (output as SuggestionCommand).set !== null;

export const SocialSuggestionItem = React.forwardRef(
    (props: SuggestionItemProps, ref: React.Ref<HTMLDivElement>) => {
    const {
        item,
        onClickHandler,
        onSelectHandler,
        selected,
      } = props;
    
      const selectItem = () => onSelectHandler(item);
    
      return (
        <div
          className={`suggestion-item ${selected ? 'selected' : ''}`}
          onClick={onClickHandler}
          onMouseEnter={selectItem}
          ref={ref}
          role='button'
          tabIndex={0}
        >
          {isEmoji(item) && <EmoticonItem entity={{itemNameParts: item.itemNameParts, name: item.name, native: item.native}}  />}
          {isMention(item) && <MentionItem id={item.id} image={item.image} itemNameParts={item.itemNameParts} name={item.name} />}
        </div>
      );
    },
);