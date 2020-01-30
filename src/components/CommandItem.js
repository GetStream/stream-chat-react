import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export class CommandItem extends PureComponent {
  static propTypes = {
    entity: PropTypes.shape({
      /** Name of the command */
      name: PropTypes.string,
      /** Arguments of command */
      args: PropTypes.string,
      /** Description of command */
      description: PropTypes.string,
    }),
  };

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
