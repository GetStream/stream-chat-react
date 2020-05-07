import React from 'react';

const Tooltip = ({ children }) => (
  <div className="str-chat__tooltip">{children}</div>
);

export default React.memo(Tooltip);
