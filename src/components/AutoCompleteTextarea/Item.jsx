import React, { useCallback } from 'react';
import clsx from 'clsx';

export const Item = React.forwardRef(function Item(props, innerRef) {
  const {
    className,
    component: Component,
    item,
    onClickHandler,
    onSelectHandler,
    selected,
    style,
  } = props;

  const handleSelect = useCallback(() => onSelectHandler(item), [item, onSelectHandler]);
  const handleClick = useCallback((event) => onClickHandler(event, item), [item, onClickHandler]);

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
});
