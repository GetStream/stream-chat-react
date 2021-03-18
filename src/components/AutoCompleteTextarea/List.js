import React, { useCallback, useContext, useEffect, useState } from 'react';

import { TranslationContext } from '../../context/TranslationContext';

import Item from './Item';
import { KEY_CODES } from './listener';

const List = (props) => {
  const {
    className,
    component,
    dropdownScroll,
    getSelectedItem,
    getTextToReplace,
    itemClassName,
    itemStyle,
    onSelect,
    style,
    value: propValue,
    values,
  } = props;

  // console.log('values IS:', values);

  const { t } = useContext(TranslationContext);

  const [selectedItem, setSelectedItem] = useState(undefined);

  const itemsRef = {};

  const isSelected = (item) => {
    console.log('item in isslected', item);
    selectedItem === values.indexOf(item)
  };

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
    console.log('e in click', e);
    if (e) e.preventDefault?.();
    console.log('selectedItem IN;', selectedItem);
    console.log('values[selectedItem]:', values[selectedItem]);
    console.log('values in click:', values);
    modifyText(values[selectedItem]);
    console.log('after modifytext');
  };

  const selectItem = (item, keyboard = false) => {
    console.log('item in selected IS:', item);
    setSelectedItem(values.indexOf(item));
    if (keyboard) dropdownScroll(itemsRef[getId(item)]);
  };

  const handleKeyDown = useCallback(
    (event) => {
      if (event.which === KEY_CODES.UP) {
        setSelectedItem((prevSelected) => {
          if (prevSelected === undefined) return 0;
          return prevSelected === 0 ? values.length - 1 : prevSelected - 1;
        });
      }

      if (event.which === KEY_CODES.DOWN) {
        setSelectedItem((prevSelected) => {
          if (prevSelected === undefined) return 0;
          return prevSelected === values.length - 1 ? 0 : prevSelected + 1;
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
    console.log('in the first useeffect');
    if (values?.length) selectItem(values[0]);
  }, [values]); // eslint-disable-line

  const renderHeader = (value) => {
    if (value[0] === '/') {
      const html = `<strong>${value.replace('/', '')}</strong>`;
      return `${t('Commands matching')} ${html}`;
    }

    if (value[0] === ':') {
      const html = `<strong>${value.replace(':', '')}</strong>`;
      return `${t('Emoji matching')} ${html}`;
    }

    if (value[0] === '@') {
      const html = `<strong>${value.replace('@', '')}</strong>`;
      return `${t('People matching')} ${html}`;
    }

    return null;
  };

  const restructureItem = (item) => {
    // Adds an object to the item containing the parts of the text split by the user input value
    const name = item.name;
    const editedPropValue = propValue.slice(1);
    const parts = name.split(new RegExp(`(${editedPropValue})`, 'gi'));

    const itemNameParts = { parts: parts, inputValue: editedPropValue };

    return {...item, itemNameParts};
  }

  return (
    <ul className={`rta__list ${className || ''}`} style={style}>
      <li
        className='rta__list-header'
        dangerouslySetInnerHTML={{
          __html: renderHeader(propValue),
        }}
      />
      {values.map((item) => (
        <Item
          className={itemClassName}
          component={component}
          item={restructureItem(item)}
          key={getId(item)}
          onClickHandler={handleClick}
          onSelectHandler={selectItem}
          ref={(ref) => {
            itemsRef[getId(item)] = ref;
          }}
          selected={isSelected(item)}
          style={itemStyle}
        />
      ))}
    </ul>
  );
};

export default List;
