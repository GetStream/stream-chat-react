import clsx from 'clsx';
import type { Ref } from 'react';
import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { useMessageComposer } from '../../MessageInput';
import type { TextComposerSuggestion } from 'stream-chat';
import type { UserItemProps } from './UserItem';
import type { CommandItemProps } from './CommandItem';
import type { EmoticonItemProps } from './EmoticonItem';
import { useMessageInputContext } from '../../../context';

export type DefaultSuggestionListItemEntity =
  | UserItemProps['entity']
  | CommandItemProps['entity']
  | EmoticonItemProps['entity'];

export type SuggestionListItemComponentProps = {
  entity: DefaultSuggestionListItemEntity | unknown;
  focused: boolean;
};

export type SuggestionItemProps = {
  component: React.ComponentType<SuggestionListItemComponentProps>;
  item: TextComposerSuggestion;
  focused: boolean;
  className?: string;
  onMouseEnter?: () => void;
};

export const SuggestionListItem = React.forwardRef<
  HTMLButtonElement,
  SuggestionItemProps
>(function SuggestionListItem(
  { className, component: Component, focused, item, onMouseEnter }: SuggestionItemProps,
  innerRef: Ref<HTMLButtonElement>,
) {
  const { textComposer } = useMessageComposer();
  const { textareaRef } = useMessageInputContext();
  const containerRef = useRef<HTMLLIElement>(null);

  const handleSelect = useCallback(() => {
    textComposer.handleSelect(item);
    textareaRef.current?.focus();
  }, [item, textareaRef, textComposer]);

  useLayoutEffect(() => {
    if (!focused) return;
    containerRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }, [focused, containerRef]);

  return (
    <li
      className={clsx('str-chat__suggestion-list-item', className, {
        'str-chat__suggestion-item--selected': focused,
      })}
      onMouseEnter={onMouseEnter}
      ref={containerRef}
    >
      <button
        onClick={handleSelect}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleSelect();
          }
        }}
        ref={innerRef}
      >
        <Component entity={item} focused={focused} />
      </button>
    </li>
  );
});
