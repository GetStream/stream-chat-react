import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { useComponentContext } from '../../context/ComponentContext';
import { useChatContext } from '../../context/ChatContext';

import { Item } from './Item';
import { DefaultSuggestionListHeader } from './Header';
import { escapeRegExp } from '../Message/renderText';

export const List = ({
  className,
  component,
  currentTrigger,
  dropdownScroll,
  getSelectedItem,
  getTextToReplace,
  Header: PropHeader,
  itemClassName,
  itemStyle,
  onSelect,
  selectionEnd,
  style,
  SuggestionItem: PropSuggestionItem,
  value: propValue,
  values,
}) => {
  const { AutocompleteSuggestionHeader, AutocompleteSuggestionItem } = useComponentContext(
    'SuggestionList',
  );
  const { themeVersion } = useChatContext('SuggestionList');
  const SuggestionItem = PropSuggestionItem || AutocompleteSuggestionItem || Item;
  const SuggestionHeader =
    PropHeader || AutocompleteSuggestionHeader || DefaultSuggestionListHeader;

  const [selectedItemIndex, setSelectedItemIndex] = useState(undefined);

  const itemsRef = [];

  const isSelected = (item) =>
    selectedItemIndex === values.findIndex((value) => getId(value) === getId(item));

  const getId = (item) => {
    const textToReplace = getTextToReplace(item);
    if (textToReplace.key) {
      return textToReplace.key;
    }

    if (typeof item === 'string' || !item.key) {
      return textToReplace.text;
    }

    return item.key;
  };

  const findItemIndex = useCallback(
    (item) =>
      values.findIndex((value) => (value.id ? value.id === item.id : value.name === item.name)),
    [values],
  );

  const modifyText = (value) => {
    if (!value) return;

    onSelect(getTextToReplace(value));
    if (getSelectedItem) getSelectedItem(value);
  };

  const handleClick = useCallback(
    (e, item) => {
      e?.preventDefault();

      const index = findItemIndex(item);

      modifyText(values[index]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modifyText, findItemIndex],
  );

  const selectItem = useCallback(
    (item) => {
      const index = findItemIndex(item);
      setSelectedItemIndex(index);
    },
    [findItemIndex],
  );

  const handleKeyDown = useCallback(
    (event) => {
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

      if ((event.key === 'Enter' || event.key === 'Tab') && selectedItemIndex !== undefined) {
        handleClick(event, values[selectedItemIndex]);
      }

      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedItemIndex, values],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (values?.length) selectItem(values[0]);
  }, [values]); // eslint-disable-line

  const restructureItem = useCallback(
    (item) => {
      const matched = item.name || item.id;

      const textBeforeCursor = propValue.slice(0, selectionEnd);
      const triggerIndex = textBeforeCursor.lastIndexOf(currentTrigger);
      const editedPropValue = escapeRegExp(textBeforeCursor.slice(triggerIndex + 1));

      const parts = matched.split(new RegExp(`(${editedPropValue})`, 'gi'));

      const itemNameParts = { match: editedPropValue, parts };

      return { ...item, itemNameParts };
    },
    [propValue, selectionEnd, currentTrigger],
  );

  const restructuredValues = useMemo(() => values.map(restructureItem), [values, restructureItem]);

  return (
    <ul className={clsx('rta__list', className)} style={style}>
      {themeVersion === '1' && (
        <li className='rta__list-header'>
          <SuggestionHeader currentTrigger={currentTrigger} value={propValue} />
        </li>
      )}
      {restructuredValues.map((item, i) => (
        <SuggestionItem
          className={itemClassName}
          component={component}
          item={item}
          key={getId(item)}
          onClickHandler={handleClick}
          onSelectHandler={selectItem}
          ref={(ref) => {
            itemsRef[i] = ref;
          }}
          selected={isSelected(item)}
          style={itemStyle}
          value={propValue}
        />
      ))}
    </ul>
  );
};
