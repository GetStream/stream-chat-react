// @ts-check
import React from 'react';
import PropTypes from 'prop-types';
import { MML as MMLReact } from 'mml-react';

/**
 * MML - A wrapper component around MML-React library
 *
 * @example ../../docs/MML.md
 * @typedef {import('types').MMLProps} Props
 * @type { React.FC<Props>}
 */
const MML = ({ mml, actionHandler }) => {
  if (!mml) return null;
  return <MMLReact source={mml} onSubmit={actionHandler} />;
};

MML.propTypes = {
  /** mml source string */
  mml: PropTypes.string.isRequired,
  /**
   * submit handler for mml actions
   * @param data {object}
   */
  actionHandler: PropTypes.func,
};

export default MML;
