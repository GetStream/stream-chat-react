import React, { MouseEventHandler, Ref, useCallback } from 'react';
import clsx from 'clsx';
import { SuggestionItem } from '../ChatAutoComplete';
import type { DefaultStreamChatGenerics } from '../../types';
import type { UnknownType } from '../../types/types';

export type SuggestionItemProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  EmojiData extends UnknownType = UnknownType,
> = {
  component: React.ComponentType<{
    entity: SuggestionItem<StreamChatGenerics, EmojiData>;
    selected: boolean;
  }>;
  item: SuggestionItem<StreamChatGenerics, EmojiData>;
  onClickHandler: (
    event: React.MouseEvent<Element, MouseEvent>,
    item: SuggestionItem<StreamChatGenerics, EmojiData>,
  ) => void;
  onSelectHandler: (item: SuggestionItem<StreamChatGenerics, EmojiData>) => void;
  selected: boolean;
  className?: string;
  value?: string;
};

export const SuggestionListItem = React.forwardRef<
  HTMLAnchorElement,
  SuggestionItemProps
>(function SuggestionListItem<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  T extends UnknownType = UnknownType,
>(props: SuggestionItemProps<StreamChatGenerics, T>, innerRef: Ref<HTMLAnchorElement>) {
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
