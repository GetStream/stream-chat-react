import React, { useState } from 'react';
import { Thread } from 'stream-chat-react';

import { MessageUI } from './MessageUI';

import { useThreadOverrideSubmit } from '../../hooks/useThreadOverrideSubmit';
import { MessageInputUI } from './MessageInputUI';

export const ThreadInner = () => {
  const [checked, setChecked] = useState(false);

  const threadOverrideSubmitHandler = useThreadOverrideSubmit({ checked });

  return (
    <>
      <Thread
        additionalMessageInputProps={{ overrideSubmitHandler: threadOverrideSubmitHandler }}
        Input={(props) => (
          <MessageInputUI {...props} checked={checked} setChecked={setChecked} threadInput />
        )}
        Message={MessageUI}
      />
    </>
  );
};
