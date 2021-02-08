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
const MML = ({ actionHandler, align = 'right', source }) => {
  const { theme } = useContext(ChatContext);

  if (!source) return null;

  return (
    <MMLReact
      className={`mml-align-${align}`}
      Loading={null}
      onSubmit={actionHandler}
      source={source}
      Success={null}
      theme={(theme || '').replace(' ', '-')}
    />
  );
};

MML.propTypes = {
  /** submit handler for mml actions */
  actionHandler: PropTypes.func,
  /** align mml components to left/right */
  align: PropTypes.oneOf(['left', 'right']),
  /** mml source string */
  source: PropTypes.string.isRequired,
};

export default MML;
