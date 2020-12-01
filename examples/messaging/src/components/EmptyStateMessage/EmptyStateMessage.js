import React from 'react';

const EmptyStateMessage = () => {
  const danMessage = () => {
    console.log('Hello I am empty State');
  };

  return (
    <div
      style={{
        width: '100px',
        height: '100px',
        backgroundColor: 'blue',
        borderRadius: '10px',
      }}
      onClick={danMessage}
    ></div>
  );
};

export default EmptyStateMessage;
