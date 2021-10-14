import React, { useCallback, useEffect, useState } from 'react';

import { useComponentContext } from '../../context/ComponentContext';
import { escapeRegExp } from '../../utils';

import { Item } from './Item';
import { DefaultSuggestionListHeader } from './Header';
import { KEY_CODES } from './listener';

export const List = (props) => {
  const {
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
  } = props;

  const { AutocompleteSuggestionHeader, AutocompleteSuggestionItem } = useComponentContext();
  const SuggestionItem = PropSuggestionItem || AutocompleteSuggestionItem || Item;
  const SuggestionHeader =
    PropHeader || AutocompleteSuggestionHeader || DefaultSuggestionListHeader;

  const [selectedItem, setSelectedItem] = useState(undefined);

  const itemsRef = [];

  const isSelected = (item) =>
    selectedItem === values.findIndex((value) => getId(value) === getId(item));

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

  const modifyText = (value) => {
    if (!value) return;

    onSelect(getTextToReplace(value));
    if (getSelectedItem) getSelectedItem(value);
  };

  const handleClick = (e) => {
    if (e) e.preventDefault?.();
    modifyText(values[selectedItem]);
  };

  const selectItem = (item) => {
    const index = values.findIndex((value) =>
      value.id ? value.id === item.id : value.name === item.name,
    );
    setSelectedItem(index);
  };

  const handleKeyDown = useCallback(
    (event) => {
      if (event.which === KEY_CODES.UP) {
        setSelectedItem((prevSelected) => {
          if (prevSelected === undefined) return 0;
          const newID = prevSelected === 0 ? values.length - 1 : prevSelected - 1;
          dropdownScroll(itemsRef[newID]);
          return newID;
        });
      }

      if (event.which === KEY_CODES.DOWN) {
        setSelectedItem((prevSelected) => {
          if (prevSelected === undefined) return 0;
          const newID = prevSelected === values.length - 1 ? 0 : prevSelected + 1;
          dropdownScroll(itemsRef[newID]);
          return newID;
        });
      }

      if (
        (event.which === KEY_CODES.ENTER || event.which === KEY_CODES.TAB) &&
        selectedItem !== undefined
      ) {
        handleClick(event);
        return setSelectedItem(undefined);
      }

      return null;
    },
    [selectedItem, values], // eslint-disable-line
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, false);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (values?.length) selectItem(values[0]);
  }, [values]); // eslint-disable-line

  const restructureItem = (item) => {
    const matched = item.name || item.id;

    const textBeforeCursor = propValue.slice(0, selectionEnd);
    const triggerIndex = textBeforeCursor.lastIndexOf(currentTrigger);
    const editedPropValue = escapeRegExp(textBeforeCursor.slice(triggerIndex + 1));

    const parts = matched.split(new RegExp(`(${editedPropValue})`, 'gi'));

    const itemNameParts = { match: editedPropValue, parts };

    return { ...item, itemNameParts };
  };

  return (
    <ul className={`rta__list ${className || ''}`} style={style}>
      <li className='rta__list-header'>
        <SuggestionHeader currentTrigger={currentTrigger} value={propValue} />
      </li>
      {values.map((item, i) => (
        <SuggestionItem
          className={itemClassName}
          component={component}
          item={restructureItem(item)}
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
