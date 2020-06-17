// @ts-check
import React from 'react';

/**
 * @type {React.FC<import('types').TooltipProps>}
 */
const Tooltip = (props) => (
  <div className="str-chat__tooltip" {...props}>
    {props.children}
  </div>
);

export default React.memo(Tooltip);
