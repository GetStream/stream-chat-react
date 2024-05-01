import React, { useState } from 'react';
import { DefaultStreamChatGenerics } from '../../types';
import { StreamMessage, useChatContext } from '../../context';

interface PollProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> {
  message: StreamMessage<StreamChatGenerics>;
}

export const PollSuggestionForm = <
StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(props: PollProps<StreamChatGenerics>) => {
  const message = props.message;
  const poll = message.poll;

  const { client } = useChatContext<StreamChatGenerics>();
  const [suggestion, setSuggestion] = useState('');
  const addSuggestion  = async () => {
    const res = await client.createPollOption(poll.id, {
      text: suggestion,
    })
    console.log('>> addSuggestion response: ', res);
  }

  return (
    <div>
      <div>
        <label>Question:</label>
        <input type='text' value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
         />
      </div>
      <button onClick={() => {
        addSuggestion();
      }} >Submit</button>
    </div>
  );
};
