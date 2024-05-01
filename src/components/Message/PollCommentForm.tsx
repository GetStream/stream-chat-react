import React, { useState } from 'react';
import { DefaultStreamChatGenerics } from '../../types';
import { StreamMessage, useChatContext } from '../../context';

interface PollProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> {
  message: StreamMessage<StreamChatGenerics>;
}

export const PollCommentForm = <
StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(props: PollProps<StreamChatGenerics>) => {
  const message = props.message;
  const poll = message.poll;

  const { client } = useChatContext<StreamChatGenerics>();
  const [comment, setComment] = useState('');
  const addComment  = async () => {
    await client.castPollVote(message.id, poll.id, {
     answer_text: comment,
    })
  }

  return (
    <div>
      <div>
        <label>Question:</label>
        <input type='text' value={comment}
          onChange={(e) => setComment(e.target.value)}
         />
      </div>
      <button onClick={() => {
        addComment();
      }} >Submit</button>
    </div>
  );
};
