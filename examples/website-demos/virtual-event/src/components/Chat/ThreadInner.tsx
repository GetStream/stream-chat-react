import React, { useState } from 'react';
import { useEffect } from 'react';
import { Thread, useChannelStateContext } from 'stream-chat-react';

import { useThreadOverrideSubmit } from '../../hooks/useThreadOverrideSubmit';
import { MessageInputUI } from './MessageInputUI';

export const ThreadInner = () => {
  const [checked, setChecked] = useState(false);

  const { thread } = useChannelStateContext();

  useEffect(() => {
    if (!thread) {
      setChecked(false);
    }
  }, [thread]);

  const threadOverrideSubmitHandler = useThreadOverrideSubmit({ checked });

  return (
    <>
      <Thread
        additionalMessageInputProps={{ overrideSubmitHandler: threadOverrideSubmitHandler }}
        Input={(props) => (
          <MessageInputUI {...props} checked={checked} setChecked={setChecked} threadInput />
        )}
        virtualized
      />
    </>
  );
};
