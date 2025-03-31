import type { MouseEventHandler, Ref } from 'react';
import React, { useCallback } from 'react';
import clsx from 'clsx';
import type { CommandResponse, UserResponse } from 'stream-chat';
import type { EmojiSearchIndexResult } from '../MessageInput';

export type SuggestionCommand = CommandResponse;
export type SuggestionUser = UserResponse;
export type SuggestionEmoji = EmojiSearchIndexResult;
export type SuggestionItem = SuggestionUser | SuggestionCommand | SuggestionEmoji;

export type SuggestionItemProps = {
  component: React.ComponentType<{
    entity: SuggestionItem;
    selected: boolean;
  }>;
  item: SuggestionItem;
  onClickHandler: (
    event: React.MouseEvent<Element, MouseEvent>,
    item: SuggestionItem,
  ) => void;
  onSelectHandler: (item: SuggestionItem) => void;
  selected: boolean;
  className?: string;
  value?: string;
};

export const SuggestionListItem = React.forwardRef<
  HTMLAnchorElement,
  SuggestionItemProps
>(function SuggestionListItem(
  props: SuggestionItemProps,
  innerRef: Ref<HTMLAnchorElement>,
) {
  const {
    className,
    component: Component,
    item,
    onClickHandler,
    onSelectHandler,
    selected,
  } = props;

  const handleSelect = useCallback(() => onSelectHandler(item), [item, onSelectHandler]);
  const handleClick: MouseEventHandler = useCallback(
    (event) => onClickHandler(event, item),
    [item, onClickHandler],
  );

  return (
    <li
      className={clsx('str-chat__suggestion-list-item', className, {
        'str-chat__suggestion-item--selected': selected,
      })}
    >
      <a
        href=''
        onClick={handleClick}
        onFocus={handleSelect}
        onMouseEnter={handleSelect}
        ref={innerRef}
      >
        <Component entity={item} selected={selected} />
      </a>
    </li>
  );
});
