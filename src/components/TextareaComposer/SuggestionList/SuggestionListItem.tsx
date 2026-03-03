import clsx from 'clsx';
import { type ComponentProps, useRef } from 'react';
import React, { useCallback, useLayoutEffect } from 'react';
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
} & ComponentProps<'button'>;

export type SuggestionItemProps = ComponentProps<'button'> & {
  component: React.ComponentType<SuggestionListItemComponentProps>;
  item: TextComposerSuggestion;
  focused: boolean;
};

export const SuggestionListItem = ({
  className,
  component: Component,
  focused,
  item,
  onClick,
  onKeyDown,
  onMouseEnter,
  ...restProps
}: SuggestionItemProps) => {
  const { textComposer } = useMessageComposer();
  const { textareaRef } = useMessageInputContext();
  const componentRef = useRef<HTMLButtonElement | null>(null);

  const handleSelect = useCallback(() => {
    textComposer.handleSelect(item);
    textareaRef.current?.focus();
  }, [item, textareaRef, textComposer]);

  useLayoutEffect(() => {
    if (!focused) return;
    componentRef.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' });
  }, [focused]);

  return (
    <Component
      {...restProps}
      className={clsx('str-chat__suggestion-list-item', className, {
        'str-chat__suggestion-list-item--selected': focused,
      })}
      entity={item}
      focused={focused}
      onClick={(e) => {
        handleSelect();
        onClick?.(e);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') handleSelect();
        onKeyDown?.(event);
      }}
      onMouseEnter={onMouseEnter}
      ref={componentRef}
    />
  );
};
