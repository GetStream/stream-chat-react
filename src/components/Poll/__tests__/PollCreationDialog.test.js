import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PollCreationDialog } from '../PollCreationDialog';
import { MessageInputContextProvider } from '../../../context';
import { generateUser, initClientWithChannels } from '../../../mock-builders';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';

const NAME_FIELD_PLACEHOLDER = 'Ask a question';
const OPTION_FIELD_PLACEHOLDER = 'Add an option';
const MAX_VOTES_FIELD_PLACEHOLDER = 'Maximum number of votes (from 2 to 10)';
const MULTIPLE_ANSWERS_FIELD_LABEL = 'Multiple answers';
const VOTING_VISIBILITY_FIELD_LABEL = 'Anonymous poll';
const OPTION_SUGGESTION_FIELD_LABEL = 'Allow option suggestion';
const ALLOW_COMMENTS_FIELD_LABEL = 'Allow comments';
const CANCEL_BUTTON_TEXT = 'Cancel';
const CREATE_BUTTON_TEXT = 'Create';
const NAME_INPUT_FIELD_ERROR_TEST_ID = 'poll-name-input-field-error';
const OPTION_INPUT_FIELD_ERROR_TEST_ID = 'poll-option-input-field-error';
const MAX_VOTE_COUT_INPUT_FIELD_ERROR_TEST_ID =
  'poll-max-votes-allowed-input-field-error';
const DUPLICATE_OPTION_FIELD_ERROR_TEXT = 'Option already exists';
const MAX_VOTE_COUNT_FIELD_ERROR_TEXT = 'Type a number from 2 to 10';

const getNameInput = () => screen.getByPlaceholderText(NAME_FIELD_PLACEHOLDER);
const getOptionInput = () => screen.getByPlaceholderText(OPTION_FIELD_PLACEHOLDER);

const close = jest.fn();
const handleSubmit = jest.fn();
const user = generateUser();

const renderComponent = async ({ channel: customChannel, client: customClient } = {}) => {
  let channel = customChannel;
  let client = customClient;
  if (!(channel && client)) {
    const initiated = await initClientWithChannels();
    channel = initiated.channels[0];
    client = initiated.client;
  }
  let result;
  await act(() => {
    result = render(
      <Chat client={client}>
        <Channel channel={channel}>
          <MessageInputContextProvider value={{ handleSubmit }}>
            <PollCreationDialog close={close} />
          </MessageInputContextProvider>
        </Channel>
      </Chat>,
    );
  });
  return { channel, client, ...result };
};

describe('PollCreationDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initiates with default state', async () => {
    await renderComponent();
    expect(getNameInput()).toHaveValue('');
    const optionFieldCount = screen.getAllByPlaceholderText(
      OPTION_FIELD_PLACEHOLDER,
    ).length;
    expect(optionFieldCount).toBe(1);
    expect(getOptionInput()).toHaveValue('');
    expect(screen.getByLabelText(MULTIPLE_ANSWERS_FIELD_LABEL)).not.toBeChecked();
    expect(
      screen.queryByPlaceholderText(MAX_VOTES_FIELD_PLACEHOLDER),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(VOTING_VISIBILITY_FIELD_LABEL)).not.toBeChecked();
    expect(screen.getByLabelText(OPTION_SUGGESTION_FIELD_LABEL)).not.toBeChecked();
    expect(screen.getByLabelText(ALLOW_COMMENTS_FIELD_LABEL)).not.toBeChecked();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('updates name field', async () => {
    const text = 'Abc';
    await renderComponent();
    const nameInput = getNameInput();
    await act(async () => {
      await fireEvent.change(nameInput, { target: { value: text } });
    });
    expect(nameInput).toHaveValue(text);
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('registers name field error and prevents submission', async () => {
    await renderComponent();
    const nameInput = getNameInput();
    expect(screen.getByTestId(NAME_INPUT_FIELD_ERROR_TEST_ID)).not.toHaveTextContent();
    await act(async () => {
      await fireEvent.focus(nameInput);
    });
    await act(async () => {
      await fireEvent.blur(nameInput);
    });
    expect(screen.getByTestId(NAME_INPUT_FIELD_ERROR_TEST_ID)).toHaveTextContent(
      'Name is required',
    );
    expect(nameInput).toHaveValue('');
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('removes name field error when the field is filled', async () => {
    const text = 'Abc';
    await renderComponent();
    const nameInput = getNameInput();
    expect(screen.getByTestId(NAME_INPUT_FIELD_ERROR_TEST_ID)).not.toHaveTextContent();
    await act(async () => {
      await fireEvent.focus(nameInput);
    });
    await act(async () => {
      await fireEvent.blur(nameInput);
    });
    await act(async () => {
      await fireEvent.change(nameInput, { target: { value: text } });
    });
    await act(async () => {
      await fireEvent.blur(nameInput);
    });
    expect(screen.getByTestId(NAME_INPUT_FIELD_ERROR_TEST_ID)).not.toHaveTextContent();
    expect(nameInput).toHaveValue(text);
  });

  it('updates option input value', async () => {
    const text = 'Abc';
    await renderComponent();
    const optionInput = getOptionInput();
    await act(async () => {
      await fireEvent.change(optionInput, { target: { value: text } });
    });
    const optionFields = screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER);
    expect(optionFields).toHaveLength(2);
    expect(optionFields[0]).toHaveValue(text);
    expect(optionFields[1]).toHaveValue('');
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('allows submission with at least one option and name', async () => {
    const text = 'Abc';
    await renderComponent();
    const nameInput = getNameInput();
    await act(async () => {
      await fireEvent.change(nameInput, { target: { value: text } });
    });
    const optionInput = getOptionInput();
    await act(async () => {
      await fireEvent.change(optionInput, { target: { value: text } });
    });
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeEnabled();
  });

  it('registers duplicate option error and prevents submission', async () => {
    const text = 'Abc';
    await renderComponent();
    const optionInput = getOptionInput();
    await act(async () => {
      await fireEvent.change(optionInput, { target: { value: text } });
    });
    let optionFields = screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER);
    await act(async () => {
      await fireEvent.change(optionFields[1], { target: { value: text } });
    });
    optionFields = screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER);
    expect(optionFields).toHaveLength(3);
    expect(optionFields[0]).toHaveValue(text);
    expect(optionFields[1]).toHaveValue(text);
    expect(optionFields[2]).toHaveValue('');

    await act(async () => {
      await fireEvent.blur(optionFields[1]);
    });
    const optionErrors = screen.getAllByTestId(OPTION_INPUT_FIELD_ERROR_TEST_ID);

    expect(optionErrors).toHaveLength(3);
    expect(optionErrors[1]).toHaveTextContent(DUPLICATE_OPTION_FIELD_ERROR_TEXT);
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('removes the duplicate option error if duplicate text removed', async () => {
    const text = 'Abc';
    await renderComponent();
    const optionInput = getOptionInput();
    await act(async () => {
      await fireEvent.change(optionInput, { target: { value: text } });
    });
    let optionFields = screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER);
    await act(async () => {
      await fireEvent.change(optionFields[1], { target: { value: text } });
    });
    await act(async () => {
      await fireEvent.blur(optionFields[1]);
    });
    await act(async () => {
      await fireEvent.change(optionFields[0], { target: { value: 'a' } });
    });
    optionFields = screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER);
    expect(optionFields).toHaveLength(3);
    expect(optionFields[0]).toHaveValue('a');
    expect(optionFields[1]).toHaveValue(text);
    expect(optionFields[2]).toHaveValue('');
    const optionErrors = screen.getAllByTestId(OPTION_INPUT_FIELD_ERROR_TEST_ID);

    expect(optionErrors).toHaveLength(3);
    expect(optionErrors[0]).not.toHaveTextContent();
    expect(optionErrors[1]).not.toHaveTextContent();
    expect(optionErrors[2]).not.toHaveTextContent();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('removes the last option if any previous option has been cleared', async () => {
    const text = 'Abc';
    await renderComponent();
    const nameInput = getNameInput();
    act(() => {
      fireEvent.change(nameInput, { target: { value: text } });
    });
    const optionInput = getOptionInput();
    await act(async () => {
      await fireEvent.change(optionInput, { target: { value: text } });
    });
    let optionFields = screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER);
    await act(async () => {
      await fireEvent.change(optionFields[0], { target: { value: '' } });
    });
    optionFields = screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER);

    expect(optionFields).toHaveLength(1);
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('shows max vote count input on max vote count enabling', async () => {
    await renderComponent();
    const enforceUniqueToggle = screen.getByLabelText(MULTIPLE_ANSWERS_FIELD_LABEL);
    await act(async () => {
      await fireEvent.click(enforceUniqueToggle);
    });
    expect(enforceUniqueToggle).toBeChecked();
    expect(screen.getByPlaceholderText(MAX_VOTES_FIELD_PLACEHOLDER).value).toBe('');
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('updates max vote count field', async () => {
    const text = 'Abc';
    await renderComponent();
    const nameInput = getNameInput();
    await act(async () => {
      await fireEvent.change(nameInput, { target: { value: text } });
    });
    const optionInput = getOptionInput();
    await act(async () => {
      await fireEvent.change(optionInput, { target: { value: text } });
    });
    const enforceUniqueToggle = screen.getByLabelText(MULTIPLE_ANSWERS_FIELD_LABEL);
    await act(async () => {
      await fireEvent.click(enforceUniqueToggle);
    });
    const maxVoteCountInput = screen.getByPlaceholderText(MAX_VOTES_FIELD_PLACEHOLDER);
    await act(async () => {
      await fireEvent.change(maxVoteCountInput, { target: { value: '2' } });
    });
    expect(screen.getByPlaceholderText(MAX_VOTES_FIELD_PLACEHOLDER).value).toBe('2');
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeEnabled();
  });

  it('registers max vote count field error and prevents submission', async () => {
    const text = 'Abc';
    await renderComponent();
    const nameInput = getNameInput();
    await act(async () => {
      await fireEvent.change(nameInput, { target: { value: text } });
    });
    const optionInput = getOptionInput();
    await act(async () => {
      await fireEvent.change(optionInput, { target: { value: text } });
    });
    const enforceUniqueToggle = screen.getByLabelText(MULTIPLE_ANSWERS_FIELD_LABEL);
    await act(async () => {
      await fireEvent.click(enforceUniqueToggle);
    });
    const maxVoteCountInput = screen.getByPlaceholderText(MAX_VOTES_FIELD_PLACEHOLDER);
    await act(async () => {
      await fireEvent.change(maxVoteCountInput, { target: { value: '11' } });
    });

    const maxVoteCountErrors = screen.getAllByTestId(
      MAX_VOTE_COUT_INPUT_FIELD_ERROR_TEST_ID,
    );

    expect(maxVoteCountErrors).toHaveLength(1);
    expect(maxVoteCountErrors[0]).toHaveTextContent(MAX_VOTE_COUNT_FIELD_ERROR_TEXT);
    expect(screen.getByPlaceholderText(MAX_VOTES_FIELD_PLACEHOLDER).value).toBe('11');
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('toggles voting visibility', async () => {
    await renderComponent();
    const votingVisibilityToggle = screen.getByLabelText(VOTING_VISIBILITY_FIELD_LABEL);
    await act(async () => {
      await fireEvent.click(votingVisibilityToggle);
    });
    expect(votingVisibilityToggle).toBeChecked();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('toggles allowing user suggested options', async () => {
    await renderComponent();
    const suggestOptionToggle = screen.getByLabelText(OPTION_SUGGESTION_FIELD_LABEL);
    await act(async () => {
      await fireEvent.click(suggestOptionToggle);
    });
    expect(suggestOptionToggle).toBeChecked();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('toggles allowing user comments', async () => {
    await renderComponent();
    const allowCommentsToggle = screen.getByLabelText(ALLOW_COMMENTS_FIELD_LABEL);
    await act(async () => {
      await fireEvent.click(allowCommentsToggle);
    });
    expect(allowCommentsToggle).toBeChecked();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(screen.getByText(CREATE_BUTTON_TEXT)).toBeDisabled();
  });

  it('submits the form', async () => {
    const formState = {
      allow_answers: true,
      allow_user_suggested_options: true,
      description: '',
      enforce_unique_vote: false,
      max_votes_allowed: '10',
      name: 'AAAA',
      options: [{ text: 'Option 1' }, { text: 'Option 2' }],
      user_id: user.id,
      voting_visibility: 'anonymous',
    };
    const expectedPollPayload = { ...formState, max_votes_allowed: 10 };

    const poll = { id: 'pollId' };
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({ customUser: user });
    await renderComponent({ channel, client });
    const createPollSpy = jest
      .spyOn(client, 'createPoll')
      .mockImplementationOnce(() => Promise.resolve({ poll }));

    await act(async () => {
      await fireEvent.change(getNameInput(), { target: { value: formState.name } });
    });
    await act(async () => {
      await fireEvent.change(getOptionInput(), {
        target: { value: formState.options[0].text },
      });
    });
    const optionFields = screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER);
    await act(async () => {
      await fireEvent.change(optionFields[1], {
        target: { value: formState.options[1].text },
      });
    });
    await act(async () => {
      await fireEvent.click(screen.getByLabelText(MULTIPLE_ANSWERS_FIELD_LABEL));
    });
    await act(async () => {
      await fireEvent.change(screen.getByPlaceholderText(MAX_VOTES_FIELD_PLACEHOLDER), {
        target: { value: formState.max_votes_allowed },
      });
    });
    await act(async () => {
      await fireEvent.click(screen.getByLabelText(VOTING_VISIBILITY_FIELD_LABEL));
    });
    await act(async () => {
      await fireEvent.click(screen.getByLabelText(OPTION_SUGGESTION_FIELD_LABEL));
    });
    await act(async () => {
      await fireEvent.click(screen.getByLabelText(ALLOW_COMMENTS_FIELD_LABEL));
    });
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    const submitButton = screen.getByText(CREATE_BUTTON_TEXT);
    expect(submitButton).toBeEnabled();
    await act(async () => {
      await fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(createPollSpy).toHaveBeenCalledWith(
        expect.objectContaining(expectedPollPayload),
      );
      expect(close).toHaveBeenCalledTimes(1);
    });
  });

  it('closes the form on cancel', async () => {
    await renderComponent();
    act(() => {
      fireEvent.click(screen.getByText(CANCEL_BUTTON_TEXT));
    });
    expect(close).toHaveBeenCalledTimes(1);
  });
});
