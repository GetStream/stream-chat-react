import React from 'react';
import PropTypes from 'prop-types';

const CommandItem = ({ entity }) => (
  <div className="str-chat__slash-command">
    <span className="str-chat__slash-command-header">
      <strong>{entity.name}</strong> {entity.args}
    </span>
    <br />
    <span className="str-chat__slash-command-description">
      {entity.description}
    </span>
  </div>
);

CommandItem.propTypes = {
  entity: PropTypes.shape({
    /** Name of the command */
    name: PropTypes.string,
    /** Arguments of command */
    args: PropTypes.string,
    /** Description of command */
    description: PropTypes.string,
  }),
};

export default React.useMemo(CommandItem);
