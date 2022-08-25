import React from 'react';

const GHComponentLink = ({name, path}) => {
  return <a target='_blank' href={`https://github.com/GetStream/stream-chat-react/blob/master/src/components${path}`}>{name}</a>
}

export default GHComponentLink;
