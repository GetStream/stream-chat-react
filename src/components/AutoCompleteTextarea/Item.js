import React from 'react';

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

  const selectItem = () => onSelectHandler(item);

  return (
    <li className={`rta__item ${className || ''}`} style={style}>
      <div
        className={`rta__entity ${selected ? 'rta__entity--selected' : ''}`}
        onClick={onClickHandler}
        onFocus={selectItem}
        onMouseEnter={selectItem}
        ref={innerRef}
        role='button'
        tabIndex={0}
      >
        <Component entity={item} selected={selected} />
      </div>
    </li>
  );
});
