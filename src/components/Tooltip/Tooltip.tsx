import React from 'react';

export const Tooltip: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => {
  const { children, ...rest } = props;
  return (
    <div className='str-chat__tooltip' {...rest}>
      {children}
    </div>
  );
};
