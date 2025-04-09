import clsx from 'clsx';
import type { Ref } from 'react';
import { useLayoutEffect } from 'react';
import React, { useCallback, useRef } from 'react';
import type { CommandResponse, TextComposerSuggestion, UserResponse } from 'stream-chat';
import type { EmojiSearchIndexResult } from '../../MessageInput';
import { useMessageComposer } from '../../MessageInput';

export type SuggestionCommand = CommandResponse;
export type SuggestionUser = UserResponse;
export type SuggestionEmoji = EmojiSearchIndexResult;
export type SuggestionItem = SuggestionUser | SuggestionCommand | SuggestionEmoji;

export type SuggestionItemProps = {
  component: React.ComponentType<{
    entity: SuggestionItem;
    focused: boolean;
  }>;
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
  const containerRef = useRef<HTMLLIElement>(null);

  const handleSelect = useCallback(() => {
    textComposer.handleSelect(item);
  }, [item, textComposer]);

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
