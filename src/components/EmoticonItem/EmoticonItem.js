import React from 'react';
import PropTypes from 'prop-types';

const EmoticonItem = ({ entity }) => (
  <div className="str-chat__emoji-item">
    <span className="str-chat__emoji-item--entity">{entity.native}</span>
    <span className="str-chat__emoji-item--name">{entity.name}</span>
    <span className="str-chat__emoji-item--char">{entity.char}</span>
  </div>
);

EmoticonItem.propTypes = {
  entity: PropTypes.shape({
    /** Name for emoticon */
    name: PropTypes.string,
    /** Native value or actual emoticon */
    native: PropTypes.string,
    /** Representative character for emoticon */
    char: PropTypes.string,
  }).isRequired,
};

export default React.memo(EmoticonItem);
