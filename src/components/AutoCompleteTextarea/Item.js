//

import React from 'react';

export class Item extends React.Component {
  selectItem = () => {
    const { item, onSelectHandler } = this.props;
    onSelectHandler(item);
  };

  render() {
    const {
      component: Component,
      style,
      onClickHandler,
      item,
      selected,
      className,
      innerRef,
    } = this.props;

    return (
      <li className={`rta__item ${className || ''}`} style={style}>
        <div
          className={`rta__entity ${
            selected === true ? 'rta__entity--selected' : ''
          }`}
          role="button"
          tabIndex={0}
          onClick={onClickHandler}
          onFocus={this.selectItem}
          onMouseEnter={this.selectItem}
          /* $FlowFixMe */
          ref={innerRef}
        >
          <Component selected={selected} entity={item} />
        </div>
      </li>
    );
  }
}

export default Item;
