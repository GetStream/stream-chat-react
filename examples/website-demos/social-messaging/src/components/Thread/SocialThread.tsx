import React, { useEffect, useState } from 'react';
import { Thread, useChannelStateContext } from 'stream-chat-react';

import { SocialMessageInput } from '../MessageInput/SocialMessageInput';

import { useOverrideSubmit } from '../../hooks/useOverrideSubmit';

export const SocialThread: React.FC = () => {
  const [checked, setChecked] = useState(false);

  const { thread } = useChannelStateContext();

  useEffect(() => {
    if (!thread) {
      setChecked(false);
    }
  }, [thread]);

  const threadOverrideSubmitHandler = useOverrideSubmit(checked);

  return (
    <>
      <Thread
        additionalMessageInputProps={{ overrideSubmitHandler: threadOverrideSubmitHandler }}
        Input={(props) => (
          <SocialMessageInput {...props} checked={checked} setChecked={setChecked} threadInput />
        )}
      />
    </>
  );
};
