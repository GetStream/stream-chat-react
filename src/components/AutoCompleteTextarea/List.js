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

  const { t } = useContext(TranslationContext);

  const [selectedItem, setSelectedItem] = useState(undefined);

  const itemsRef = {};

  const isSelected = (item) => selectedItem === values.indexOf(item);

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

  const selectItem = (item, keyboard = false) => {
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

  return (
    <ul className={`rta__list ${className || ''}`} style={style}>
      <li
        className="rta__list-header"
        dangerouslySetInnerHTML={{
          __html: renderHeader(propValue),
        }}
      />
      {values.map((item) => (
        <Item
          className={itemClassName}
          component={component}
          item={item}
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
