import type { MouseEventHandler, Ref } from 'react';
import React, { useCallback } from 'react';
import clsx from 'clsx';
import type { SuggestionItem } from '../ChatAutoComplete';

import type { UnknownType } from '../../types/types';

export type SuggestionItemProps<EmojiData extends UnknownType = UnknownType> = {
  component: React.ComponentType<{
    entity: SuggestionItem<EmojiData>;
    selected: boolean;
  }>;
  item: SuggestionItem<EmojiData>;
  onClickHandler: (
    event: React.MouseEvent<Element, MouseEvent>,
    item: SuggestionItem<EmojiData>,
  ) => void;
  onSelectHandler: (item: SuggestionItem<EmojiData>) => void;
  selected: boolean;
  className?: string;
  value?: string;
};

export const SuggestionListItem = React.forwardRef<
  HTMLAnchorElement,
  SuggestionItemProps
>(function SuggestionListItem<T extends UnknownType = UnknownType>(
  props: SuggestionItemProps<T>,
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
