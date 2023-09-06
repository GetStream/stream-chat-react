import React, { useState } from 'react';
import { useChannelStateContext, useChatContext } from '../../context';

export const PollForm = () => {
  const [question, setQuestion] = useState('Hows it going?');
  const [options, setOptions] = useState(['Good', 'Bad']); // Initial empty options
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false); // Initial false value
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleOptionChange = (e, index) => {
    const updatedOptions = [...options];
    updatedOptions[index] = e.target.value;
    setOptions(updatedOptions);
  };

  const handleMultipleVotesChange = (e) => {
    setAllowMultipleVotes(e.target.checked);
  };
  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    const updatedOptions = [...options];
    updatedOptions.splice(index, 1);
    setOptions(updatedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { id } = await client.createPoll({
      name: question,
      description: 'TIME TO VOTE!',
      options: options.map((option) => ({ text: option })),
      max_votes_allowed: allowMultipleVotes ? options.length : 1,
    });

    await channel.sendMessage({
      attachments: [
        {
          type: 'poll',
          poll_id: id,
        },
      ],
    });

    // Process and submit the form data here
    // You can access the question and options state values to send to your API or handle the form submission
    console.log('Question:', question);
    console.log('Options:', options);
  };

  return (
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
            value={allowMultipleVotes}
          />
        </div>
        <button onClick={handleAddOption} type='button'>
          Add Option
        </button>
      </div>

      <button type='submit'>Submit</button>
    </form>
  );
};
