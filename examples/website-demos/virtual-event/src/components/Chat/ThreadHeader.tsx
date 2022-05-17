import React from 'react';
import { useChannelActionContext, useChannelStateContext } from 'stream-chat-react';

import { CloseX, Ellipse } from '../../assets';

export const ThreadHeader = () => {
  const { thread } = useChannelStateContext();
  const { closeThread } = useChannelActionContext();

  if (!thread) return null;

  return (
    <div className='dm-header-container'>
      <div className='dm-header-close' onClick={closeThread}>
        <CloseX />
      </div>
      <div className='dm-header-title'>
        <div>Thread Reply</div>
        <div className='dm-header-title-sub-title'>
          with {thread.user?.name || thread.user?.id || ''}
        </div>
      </div>
      <div className='dm-header-actions'>
        <Ellipse />
      </div>
    </div>
  );
};
