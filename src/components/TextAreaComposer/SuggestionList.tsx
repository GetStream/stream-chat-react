import React from 'react';
import clsx from 'clsx';

import { useComponentContext } from '../../context/ComponentContext';

import { SuggestionListItem as DefaultSuggestionListItem } from './SuggestionListItem';

import type { CustomTrigger, UnknownType } from '../../types/types';
import type { SuggestionHeaderProps, SuggestionItemProps } from '../ChatAutoComplete';
import type { TriggerSettings } from '../MessageInput';
import type { TextComposerState } from 'stream-chat';
import { type SearchSourceState } from 'stream-chat';
import { useMessageComposer } from '../MessageInput/hooks/messageComposer/useMessageComposer';
import { useStateStore } from '../../store';
import { InfiniteScrollPaginator } from '../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { EmoticonItem } from '../EmoticonItem';
import { CommandItem } from '../CommandItem';
import { UserItem } from '../UserItem';

type ObjectUnion<T> = T[keyof T];

export type SuggestionListProps<
  V extends CustomTrigger = CustomTrigger,
  EmojiData extends UnknownType = UnknownType,
> = ObjectUnion<{
  [key in keyof TriggerSettings<V>]: Partial<{
    dropdownScroll: (element: HTMLElement) => void;
    getSelectedItem:
      | ((item: Parameters<TriggerSettings<V>[key]['output']>[0]) => void)
      | null;
    getTextToReplace: (item: Parameters<TriggerSettings<V>[key]['output']>[0]) => {
      caretPosition: 'start' | 'end' | 'next' | number;
      text: string;
      key?: string;
    };
    SuggestionItem: React.ComponentType<SuggestionItemProps<EmojiData>>;
    className?: string;
    Header?: React.ComponentType<SuggestionHeaderProps>;
    value?: string;
  }>;
}>;

const textComposerStateSelector = (state: TextComposerState) => ({
  suggestions: state.suggestions,
});

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  items: nextValue.items,
});

export const SuggestionList = <
  V extends CustomTrigger = CustomTrigger,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  EmojiData extends UnknownType = UnknownType,
>({
  className,
  value: propValue,
}: SuggestionListProps<V>) => {
  const { AutocompleteSuggestionItem = DefaultSuggestionListItem } =
    useComponentContext('SuggestionList');
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { suggestions } = useStateStore(textComposer.state, textComposerStateSelector);
  const { items } =
    useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  // const [selectedItemIndex, setSelectedItemIndex] = useState<number | undefined>(
  //   undefined,
  // );
  const component =
    suggestions?.trigger &&
    {
      '/': CommandItem,
      ':': EmoticonItem,
      '@': UserItem,
    }[suggestions?.trigger];
  const itemsRef: HTMLElement[] = [];

  // const isSelected = (item: SuggestionItem<EmojiData>) =>
  //   selectedItemIndex === values.findIndex((value) => getId(value) === getId(item));
  //
  // const getId = (item: SuggestionItem<EmojiData>) => {
  //   const textToReplace = getTextToReplace(item);
  //   if (textToReplace.key) {
  //     return textToReplace.key;
  //   }
  //
  //   if (typeof item === 'string' || !(item as SuggestionEmoji<EmojiData>).key) {
  //     return textToReplace.text;
  //   }
  //
  //   return (item as SuggestionEmoji<V>).key;
  // };
  //
  // const findItemIndex = useCallback(
  //   (item: SuggestionItem<V>) =>
  //     values.findIndex((value) =>
  //       value.id
  //         ? value.id === (item as SuggestionUser).id
  //         : value.name === item.name,
  //     ),
  //   [values],
  // );
  //
  // const modifyText = (
  //   value: SuggestionListProps<V>['values'][number],
  // ) => {
  //   if (!value) return;
  //
  //   onSelect(getTextToReplace(value));
  //   if (getSelectedItem) getSelectedItem(value);
  // };
  //
  // const handleClick = useCallback(
  //   (
  //     e: React.MouseEvent<Element, MouseEvent>,
  //     item: SuggestionItem<V>,
  //   ) => {
  //     e?.preventDefault();
  //
  //     const index = findItemIndex(item);
  //
  //     modifyText(values[index]);
  //   },
  //   [modifyText, findItemIndex, values],
  // );
  //
  // const selectItem = useCallback(
  //   (item: SuggestionItem<V>) => {
  //     const index = findItemIndex(item);
  //     setSelectedItemIndex(index);
  //   },
  //   [findItemIndex],
  // );
  //
  // const handleKeyDown = useCallback(
  //   (event: KeyboardEvent) => {
  //     if (event.key === 'ArrowUp') {
  //       setSelectedItemIndex((prevSelected) => {
  //         if (prevSelected === undefined) return 0;
  //         const newIndex = prevSelected === 0 ? values.length - 1 : prevSelected - 1;
  //         dropdownScroll(itemsRef[newIndex]);
  //         return newIndex;
  //       });
  //     }
  //
  //     if (event.key === 'ArrowDown') {
  //       setSelectedItemIndex((prevSelected) => {
  //         if (prevSelected === undefined) return 0;
  //         const newIndex = prevSelected === values.length - 1 ? 0 : prevSelected + 1;
  //         dropdownScroll(itemsRef[newIndex]);
  //         return newIndex;
  //       });
  //     }
  //
  //     if (
  //       (event.key === 'Enter' || event.key === 'Tab') &&
  //       selectedItemIndex !== undefined
  //     ) {
  //       modifyText(values[selectedItemIndex]);
  //     }
  //
  //     return null;
  //   },
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [selectedItemIndex, values],
  // );
  //
  // useEffect(() => {
  //   document.addEventListener('keydown', handleKeyDown, false);
  //   return () => document.removeEventListener('keydown', handleKeyDown);
  // }, [handleKeyDown]);
  //
  // useEffect(() => {
  //   if (values?.length) selectItem(values[0]);
  // }, [selectItem, values]);
  //
  // const restructureItem = useCallback(
  //   (item: SuggestionItem<V>) => {
  //     const matched = item.name || (item as SuggestionUser).id;
  //
  //     const textBeforeCursor = (propValue || '').slice(0, selectionEnd);
  //     const triggerIndex = textBeforeCursor.lastIndexOf(currentTrigger);
  //     const editedPropValue = escapeRegExp(textBeforeCursor.slice(triggerIndex + 1));
  //
  //     const parts = matched.split(new RegExp(`(${editedPropValue})`, 'gi'));
  //
  //     const itemNameParts = { match: editedPropValue, parts };
  //
  //     return { ...item, itemNameParts };
  //   },
  //   [propValue, selectionEnd, currentTrigger],
  // );
  //
  // const restructuredValues = useMemo(
  //   () => values.map(restructureItem),
  //   [values, restructureItem],
  // );

  if (!suggestions || !items) return null;

  return (
    <InfiniteScrollPaginator
      loadNextOnScrollToBottom={suggestions.searchSource.search}
      threshold={100}
    >
      <ul
        className={clsx(
          'str-chat__suggestion-list str-chat__suggestion-list--react',
          className,
        )}
      >
        {items.map((item, i) => (
          <AutocompleteSuggestionItem
            // @ts-expect-error type mismatch
            component={component}
            item={item}
            key={item.id.toString()}
            // onClickHandler={handleClick}
            // onSelectHandler={selectItem}
            ref={(ref: HTMLAnchorElement) => {
              itemsRef[i] = ref;
            }}
            // selected={isSelected(item)}
            value={propValue}
          />
        ))}
      </ul>
    </InfiniteScrollPaginator>
  );
};
