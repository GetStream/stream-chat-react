import React from 'react';

const GHComponentLink = ({ text, as: As = React.Fragment, path, branch = 'master' }) => {
  return (
    <a
      target='_blank'
      href={`https://github.com/GetStream/stream-chat-react/blob/${branch}/src/components${path}`}
    >
      <As>{text}</As>
    </a>
  );
};

export default GHComponentLink;
