import React, { useEffect, useState } from 'react';
import { Thread, useChannelStateContext } from 'stream-chat-react';

import { MessageInput } from '../MessageInput/MessageInput';

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
          <MessageInput {...props} checked={checked} setChecked={setChecked} threadInput />
        )}
        virtualized
      />
    </>
  );
};
