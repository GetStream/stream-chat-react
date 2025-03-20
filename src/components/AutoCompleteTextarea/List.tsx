/* eslint-disable react-hooks/exhaustive-deps */
import type { CSSProperties } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { useComponentContext } from '../../context/ComponentContext';

import { Item } from './Item';
import { escapeRegExp } from '../Message/renderText';

import type {
  SuggestionEmoji,
  SuggestionItem,
  SuggestionListProps,
  SuggestionUser,
} from '../ChatAutoComplete';

export const List = ({
  className,
  component,
  currentTrigger,
  dropdownScroll,
  getSelectedItem,
  getTextToReplace,
  itemClassName,
  itemStyle,
  onSelect,
  selectionEnd,
  style,
  SuggestionItem: PropSuggestionItem,
  value: propValue,
  values,
}: SuggestionListProps) => {
  const { AutocompleteSuggestionItem } = useComponentContext('SuggestionList');
  const SuggestionItem = PropSuggestionItem || AutocompleteSuggestionItem || Item;

  const [selectedItemIndex, setSelectedItemIndex] = useState<number | undefined>(
    undefined,
  );

  const itemsRef: HTMLElement[] = [];

  const isSelected = (item: SuggestionItem) =>
    // @ts-expect-error tmp
    selectedItemIndex === values.findIndex((value) => getId(value) === getId(item));

  const getId = (item: SuggestionItem) => {
    const textToReplace = getTextToReplace(item);
    if (textToReplace.key) {
      return textToReplace.key;
    }

    if (typeof item === 'string' || !(item as SuggestionEmoji).key) {
      return textToReplace.text;
    }

    return (item as SuggestionEmoji).key;
  };

  const findItemIndex = useCallback(
    (item: SuggestionItem) =>
      // @ts-expect-error tmp
      values.findIndex((value) =>
        value.id ? value.id === (item as SuggestionUser).id : value.name === item.name,
      ),
    [values],
  );

  const modifyText = (value: SuggestionListProps['values'][number]) => {
    if (!value) return;
    onSelect(getTextToReplace(value));
    if (getSelectedItem) getSelectedItem(value);
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<Element, MouseEvent>, item: SuggestionItem) => {
      e?.preventDefault();

      const index = findItemIndex(item);

      modifyText(values[index]);
    },
    [modifyText, findItemIndex, values],
  );

  const selectItem = useCallback(
    (item: SuggestionItem) => {
      const index = findItemIndex(item);
      setSelectedItemIndex(index);
    },
    [findItemIndex],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setSelectedItemIndex((prevSelected) => {
          if (prevSelected === undefined) return 0;
          const newIndex = prevSelected === 0 ? values.length - 1 : prevSelected - 1;
          dropdownScroll(itemsRef[newIndex]);
          return newIndex;
        });
      }

      if (event.key === 'ArrowDown') {
        setSelectedItemIndex((prevSelected) => {
          if (prevSelected === undefined) return 0;
          const newIndex = prevSelected === values.length - 1 ? 0 : prevSelected + 1;
          dropdownScroll(itemsRef[newIndex]);
          return newIndex;
        });
      }

      if (
        (event.key === 'Enter' || event.key === 'Tab') &&
        selectedItemIndex !== undefined
      ) {
        modifyText(values[selectedItemIndex]);
      }

      return null;
    },
    [selectedItemIndex, values],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (values?.length) selectItem(values[0]);
  }, [selectItem, values]);

  const restructureItem = useCallback(
    (item: SuggestionItem) => {
      const matched = item.name || (item as SuggestionUser).id;

      const textBeforeCursor = (propValue || '').slice(0, selectionEnd);
      const triggerIndex = textBeforeCursor.lastIndexOf(currentTrigger);
      const editedPropValue = escapeRegExp(textBeforeCursor.slice(triggerIndex + 1));

      const parts = matched.split(new RegExp(`(${editedPropValue})`, 'gi'));

      const itemNameParts = { match: editedPropValue, parts };

      return { ...item, itemNameParts };
    },
    [propValue, selectionEnd, currentTrigger],
  );

  const restructuredValues = useMemo(
    () => values.map(restructureItem),
    [values, restructureItem],
  );

  return (
    <ul className={clsx('str-chat__suggestion-list', className)} style={style}>
      {/* @ts-expect-error tmp */}
      {restructuredValues.map((item, i) => (
        <SuggestionItem
          className={itemClassName}
          // @ts-expect-error tmp
          component={component}
          item={item}
          // @ts-expect-error tmp
          key={getId(item).toString()}
          onClickHandler={handleClick}
          onSelectHandler={selectItem}
          ref={(ref: HTMLAnchorElement) => {
            itemsRef[i] = ref;
          }}
          selected={isSelected(item)}
          style={itemStyle as CSSProperties}
          value={propValue}
        />
      ))}
    </ul>
  );
};
