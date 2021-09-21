import React, { useEffect, useState } from 'react';
import { Thread, useChannelStateContext } from 'stream-chat-react';

import { SocialMessageInput } from '../MessageInput/SocialMessageInput';

import { useOverrideSubmit } from '../../hooks/useOverrideSubmit';

export const SocialThreadInner = () => {
  const [checked, setChecked] = useState(false);

  const { thread } = useChannelStateContext();
  // const thread = true; // work around until message actions exist
console.log('thread', thread);

  useEffect(() => {
    if (!thread) {
      setChecked(false);
    }
  }, [thread]);

  const threadOverrideSubmitHandler = useOverrideSubmit(checked);

  // const threadMessage = { id: 'Zachery-12e94d53-1f0b-4fa1-97c4-875fa4f80b46', text: 'cat', created_at: '2021-09-21T16:00:43.307Z', type: 'regular', user: { id: 'Zachery-12e94d53-1f0b-4fa1-97c4-875fa4f80b46', role: 'user', name: 'Zachery' }  }

  return (
    <>
      <Thread
        // fullWidth
        additionalMessageInputProps={{ overrideSubmitHandler: threadOverrideSubmitHandler }}
        Input={(props) => (
          <SocialMessageInput {...props} checked={checked} setChecked={setChecked} threadInput />
        )}
      />
    </>
  );
};
