import React from 'react';

export class Tooltip extends React.PureComponent {
  render() {
    return <div className="str-chat__tooltip">{this.props.children}</div>;
  }
}
