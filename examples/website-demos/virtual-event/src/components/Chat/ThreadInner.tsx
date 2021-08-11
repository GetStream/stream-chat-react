import React, { useState } from 'react';
import { Thread } from 'stream-chat-react';

import { MessageUI } from './MessageUI';
import { ThreadInputUI } from './ThreadInputUI';

import { useThreadOverrideSubmit } from '../../hooks/useThreadOverrideSubmit';

export const ThreadInner = () => {
  const [checked, setChecked] = useState(false);

  const threadOverrideSubmitHandler = useThreadOverrideSubmit({ checked });

  return (
    <>
      <Thread
        additionalMessageInputProps={
          checked ? { overrideSubmitHandler: threadOverrideSubmitHandler } : undefined
        }
        Input={(props) => <ThreadInputUI {...props} checked={checked} setChecked={setChecked} />}
        Message={MessageUI}
      />
    </>
  );
};
