import React, { useState } from 'react';
import { useChannelStateContext, useChatContext } from '../../context';
import { VotingVisibility } from 'stream-chat';

export const PollForm = () => {
  const [question, setQuestion] = useState('Favorite Pizza topping?');
  const [options, setOptions] = useState(['Pineapple', 'Chilly', 'French fries']); // Initial empty options
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false); // Initial false value
  const [allowUserSuggestions, setAllowUserSuggestions] = useState(false); // Initial false value
  const [allowComments, setAllowComments] = useState(false); // Initial false value
  const [isAnonymous, setIsAnonymous] = useState(false); // Initial false value
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const handleQuestionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    ) => {
    setQuestion(e.target.value);
  };

  const handleOptionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number) => {
    const updatedOptions = [...options];
    updatedOptions[index] = e.target.value;
    setOptions(updatedOptions);
  };

  const handleMultipleVotesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    ) => {
    setAllowMultipleVotes(e.target.checked);
  };
  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleAllowUserSuggestionsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    ) => {
    setAllowUserSuggestions(e.target.checked);
  }

  const handleAllowCommentsChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    ) => {
    setAllowComments(e.target.checked);
  }

  const handleRemoveOption = (index: number) => {
    const updatedOptions = [...options];
    updatedOptions.splice(index, 1);
    setOptions(updatedOptions);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    ) => {
    e.preventDefault();

    const { poll } = await client.createPoll({
      name: question,
      description: 'TIME TO VOTE!',
      options: options.map((option) => ({ text: option })),
      enforce_unique_vote: !allowMultipleVotes,
      voting_visibility: isAnonymous ? VotingVisibility.anonymous : VotingVisibility.public,
      // max_votes_allowed: allowMultipleVotes ? options.length : 1,
      allow_user_suggestions: allowUserSuggestions,
      allow_comments: allowComments,
    });

    await channel.sendMessage({
      poll_id: poll.id,
    });

    // Process and submit the form data here
    // You can access the question and options state values to send to your API or handle the form submission
    console.log('Question:', question);
    console.log('Options:', options);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
    }}>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Question:</label>
          <input onChange={handleQuestionChange} type='text' value={question} />
        </div>

        <div>
          <label>Options:</label>
          {options.map((option, index) => (
            <div key={index}>
              <input onChange={(e) => handleOptionChange(e, index)} type='text' value={option} />
              {index > 1 && (
                <button onClick={() => handleRemoveOption(index)} type='button'>
                  Remove
                </button>
              )}
            </div>
          ))}
          {/* Allow multiple selection */}
          <div>
            <label>Allow multiple votes:</label>
            <input
              onChange={(e) => handleMultipleVotesChange(e)}
              type='checkbox'
              checked={allowMultipleVotes}
            />
          </div>
          <div>
            <label>Allow user suggestions:</label>
            <input
              onChange={(e) => handleAllowUserSuggestionsChange(e)}
              type='checkbox'
              checked={allowUserSuggestions}
            />
          </div>
          <div>
            <label>Allow comments:</label>
            <input
              onChange={(e) => handleAllowCommentsChange(e)}
              type='checkbox'
              checked={allowComments}
            />
          </div>
          <div>
            <label>Is Anonymous:</label>
            <input
              onChange={(e) => setIsAnonymous(e.target.checked)}
              type='checkbox'
              checked={isAnonymous}
            />
          </div>

          <button onClick={handleAddOption} type='button'>
            Add Option
          </button>
        </div>

        <button type='submit'>Submit</button>
      </form>
      <div>
        <h2>Choose from existing polls</h2>
      </div>
    </div>

  );
};
