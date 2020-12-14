// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { MML as MMLReact } from 'mml-react';

import { ChatContext } from '../../context';

/**
 * MML - A wrapper component around MML-React library
 *
 * @example ../../docs/MML.md
 * @typedef {import('types').MMLProps} Props
 * @type { React.FC<Props>}
 */
const MML = ({ source, actionHandler, align = 'right' }) => {
  const { theme } = useContext(ChatContext);

  if (!source) return null;

  return (
    <MMLReact
      source={source}
      className={`mml-align-${align}`}
      onSubmit={actionHandler}
      Loading={null}
      Success={null}
      theme={(theme || '').replace(' ', '-')}
    />
  );
};

MML.propTypes = {
  /** mml source string */
  source: PropTypes.string.isRequired,
  /** submit handler for mml actions */
  actionHandler: PropTypes.func,
  /** align mml components to left/right */
  align: PropTypes.oneOf(['left', 'right']),
};

export default MML;
