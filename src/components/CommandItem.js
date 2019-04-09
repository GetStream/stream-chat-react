import React, { PureComponent } from 'react';

export class CommandItem extends PureComponent {
  render() {
    const c = this.props.entity;

    return (
      <div className="str-chat__slash-command">
        <span className="str-chat__slash-command-header">
          <strong>{c.name}</strong> {c.args}
        </span>
        <br />
        <span className="str-chat__slash-command-description">
          {c.description}
        </span>
      </div>
    );
  }
}
