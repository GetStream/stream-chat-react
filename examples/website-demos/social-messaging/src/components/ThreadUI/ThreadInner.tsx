import React, { useEffect, useState } from 'react';
import { Thread, useChannelStateContext } from 'stream-chat-react';

import { MessageInputUI } from '../MessageInputUI/MessageInputUI';

import { useOverrideSubmit } from '../../hooks/useOverrideSubmit';

export const ThreadInner = () => {
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
          <MessageInputUI {...props} checked={checked} setChecked={setChecked} threadInput />
        )}
        virtualized
      />
    </>
  );
};
