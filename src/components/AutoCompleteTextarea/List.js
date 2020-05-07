/* eslint-disable */
import React from 'react';

import Listeners, { KEY_CODES } from './listener';
import Item from './Item';

export class List extends React.Component {
  state = {
    selectedItem: null,
  };

  cachedValues = null;

  componentDidMount() {
    this.listeners.push(
      Listeners.add([KEY_CODES.DOWN, KEY_CODES.UP], this.scroll),
      Listeners.add([KEY_CODES.ENTER, KEY_CODES.TAB], this.onPressEnter),
    );

    const { values } = this.props;
    if (values && values[0]) this.selectItem(values[0]);
  }

  UNSAFE_componentWillReceiveProps({ values }) {
    const newValues = values.map((val) => this.getId(val)).join('');

    if (this.cachedValues !== newValues && values && values[0]) {
      this.selectItem(values[0]);
      this.cachedValues = newValues;
    }
  }

  componentWillUnmount() {
    let listener;
    while (this.listeners.length) {
      listener = this.listeners.pop();
      Listeners.remove(listener);
    }
  }

  onPressEnter = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const { values } = this.props;

    this.modifyText(values[this.getPositionInList()]);
  };

  getPositionInList = () => {
    const { values } = this.props;
    const { selectedItem } = this.state;

    if (!selectedItem) return 0;

    return values.findIndex((a) => this.getId(a) === this.getId(selectedItem));
  };

  getId = (item) => {
    const textToReplace = this.props.getTextToReplace(item);
    if (textToReplace.key) {
      return textToReplace.key;
    }

    if (typeof item === 'string' || !item.key) {
      return textToReplace.text;
    }

    return item.key;
  };

  listeners = [];

  itemsRef = {};

  modifyText = (value) => {
    if (!value) return;

    const { onSelect, getTextToReplace, getSelectedItem } = this.props;

    onSelect(getTextToReplace(value));
    if (getSelectedItem) {
      getSelectedItem(value);
    }
  };

  selectItem = (item, keyboard = false) => {
    this.setState({ selectedItem: item }, () => {
      if (keyboard) {
        this.props.dropdownScroll(this.itemsRef[this.getId(item)]);
      }
    });
  };

  scroll = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const { values } = this.props;

    const code = e.keyCode || e.which;

    const oldPosition = this.getPositionInList();
    let newPosition;
    switch (code) {
      case KEY_CODES.DOWN:
        newPosition = oldPosition + 1;
        break;
      case KEY_CODES.UP:
        newPosition = oldPosition - 1;
        break;
      default:
        newPosition = oldPosition;
        break;
    }

    newPosition =
      ((newPosition % values.length) + values.length) % values.length; // eslint-disable-line
    this.selectItem(
      values[newPosition],
      [KEY_CODES.DOWN, KEY_CODES.UP].includes(code),
    );
  };

  isSelected = (item) => {
    const { selectedItem } = this.state;
    if (!selectedItem) return false;

    return this.getId(selectedItem) === this.getId(item);
  };

  renderHeader = (value) => {
    if (value[0] === '/') {
      return `Commands matching <strong>${value.replace('/', '')}</strong>`;
    }

    if (value[0] === ':') {
      return `Emoji matching <strong>${value.replace(':', '')}</strong>`;
    }

    if (value[0] === '@') {
      return `Searching for people`;
    }
  };

  render() {
    const {
      values,
      component,
      style,
      itemClassName,
      className,
      itemStyle,
    } = this.props;

    return (
      <ul className={`rta__list ${className || ''}`} style={style}>
        <li
          className="rta__list-header"
          dangerouslySetInnerHTML={{
            __html: this.renderHeader(this.props.value),
          }}
        />
        {values.map((item) => (
          <Item
            key={this.getId(item)}
            innerRef={(ref) => {
              this.itemsRef[this.getId(item)] = ref;
            }}
            selected={this.isSelected(item)}
            item={item}
            className={itemClassName}
            style={itemStyle}
            onClickHandler={this.onPressEnter}
            onSelectHandler={this.selectItem}
            component={component}
          />
        ))}
      </ul>
    );
  }
}

export default List;
