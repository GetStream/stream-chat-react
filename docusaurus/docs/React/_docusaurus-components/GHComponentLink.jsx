import React from 'react';

const GHComponentLink = ({text, path}) => {
  return <a target='_blank' href={`https://github.com/GetStream/stream-chat-react/blob/master/src/components${path}`}>{text}</a>
}

export default GHComponentLink;
