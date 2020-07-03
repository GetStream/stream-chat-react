// @ts-check
import React from 'react';
import PropTypes from 'prop-types';

/** @type {React.FC<import("types").EmoticonItemProps>} */
const EmoticonItem = ({ entity }) => (
  <div className="str-chat__emoji-item">
    <span className="str-chat__emoji-item--entity">{entity.native}</span>
    <span className="str-chat__emoji-item--name">{entity.name}</span>
  </div>
);

EmoticonItem.propTypes = {
  entity: PropTypes.shape({
    /** Name for emoticon */
    name: PropTypes.string.isRequired,
    /** Native value or actual emoticon */
    native: PropTypes.string.isRequired,
  }).isRequired,
};

export default React.memo(EmoticonItem);
