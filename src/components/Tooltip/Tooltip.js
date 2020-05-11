import React from 'react';

const Tooltip = (props) => (
  <div className="str-chat__tooltip" {...props}>
    {props.children}
  </div>
);

export default React.memo(Tooltip);
