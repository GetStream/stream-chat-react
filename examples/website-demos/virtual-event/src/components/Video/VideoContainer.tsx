import React from 'react';

import './VideoContainer.scss';

type Props = {
  setEvent: React.Dispatch<React.SetStateAction<string>>;
};

export const VideoContainer: React.FC<Props> = (props) => {
  return <div className='video-container'>Video</div>;
};
