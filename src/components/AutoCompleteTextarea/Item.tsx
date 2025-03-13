import React, { MouseEventHandler, Ref, useCallback } from 'react';
import clsx from 'clsx';
import { SuggestionItemProps } from '../ChatAutoComplete';
import type { DefaultStreamChatGenerics } from '../../types';
import type { UnknownType } from '../../types/types';

export const Item = React.forwardRef<HTMLAnchorElement, SuggestionItemProps>(
  function Item<
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
      style,
    } = props;

    const handleSelect = useCallback(
      () => onSelectHandler(item),
      [item, onSelectHandler],
    );
    const handleClick: MouseEventHandler = useCallback(
      (event) => onClickHandler(event, item),
      [item, onClickHandler],
    );

    return (
      <li
        className={clsx(className, { 'str-chat__suggestion-item--selected': selected })}
        style={style}
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
  },
);
