import React from 'react';

const GHComponentLink = ({ text, path, branch = 'master' }) => {
  return (
    <a
      target='_blank'
      href={`https://github.com/GetStream/stream-chat-react/blob/${branch}/src/components${path}`}
    >
      {text}
    </a>
  );
};

export default GHComponentLink;
