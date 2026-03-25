import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PollCreationDialog } from '../PollCreationDialog';
import { MessageComposerContextProvider } from '../../../context';
import { generateUser, initClientWithChannels } from '../../../mock-builders';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

const NAME_FIELD_PLACEHOLDER = 'Ask a Question';
const OPTION_FIELD_PLACEHOLDER = 'Add an Option';
const CANCEL_BUTTON_TEXT = 'Cancel';

const getPollSwitch = (id) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
};

const getVoteLimitSwitch = () => {
  const el = document.querySelector(
    '.str-chat__multiple-answers-field__votes-limit-field .str-chat__form__switch-field__switch',
  );
  if (!el) throw new Error('missing vote limit switch');
  return el;
};

const getMaxVoteCountInput = () => document.getElementById('max_votes_allowed');
const NAME_INPUT_FIELD_ERROR_TEST_ID = 'poll-name-input-field-error';
const OPTION_INPUT_FIELD_ERROR_TEST_ID = 'poll-option-input-field-error';
const DUPLICATE_OPTION_FIELD_ERROR_TEXT = 'Option already exists';
const MAX_VOTE_COUNT_FIELD_ERROR_TEXT = 'Type a number from 2 to 10';

const getNameInput = () => screen.getByPlaceholderText(NAME_FIELD_PLACEHOLDER);
const getOptionInput = () => screen.getByPlaceholderText(OPTION_FIELD_PLACEHOLDER);
const getSubmitPollButton = () => screen.getByRole('button', { name: /send poll/i });

const close = vi.fn();
const handleSubmit = vi.fn();
const user = generateUser();

const renderComponent = async (
  { channel: customChannel, client: customClient } = {} as {
    channel?: ChannelType;
    client?: StreamChat;
  },
) => {
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
          <MessageComposerContextProvider value={{ handleSubmit } as any}>
            <PollCreationDialog close={close} />
          </MessageComposerContextProvider>
        </Channel>
      </Chat>,
    );
  });
  return { channel, client, ...result };
};

describe('PollCreationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initiates with default state', async () => {
    await renderComponent();
    expect(getNameInput()).toHaveValue('');
    const optionFieldCount = screen.getAllByPlaceholderText(
      OPTION_FIELD_PLACEHOLDER,
    ).length;
    expect(optionFieldCount).toBe(1);
    expect(getOptionInput()).toHaveValue('');
    expect(getPollSwitch('enforce_unique_vote')).not.toBeChecked();
    expect(getMaxVoteCountInput()).toBeNull();
    expect(getPollSwitch('voting_visibility')).not.toBeChecked();
    expect(getPollSwitch('allow_user_suggested_options')).not.toBeChecked();
    expect(getPollSwitch('allow_answers')).not.toBeChecked();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeDisabled();
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
    expect(getSubmitPollButton()).toBeDisabled();
  });

  it('registers name field error and prevents submission', async () => {
    await renderComponent();
    const nameInput = getNameInput();
    expect(screen.queryByTestId(NAME_INPUT_FIELD_ERROR_TEST_ID)).not.toBeInTheDocument();
    await act(async () => {
      await fireEvent.focus(nameInput);
    });
    await act(async () => {
      await fireEvent.blur(nameInput);
    });
    expect(screen.getByTestId(NAME_INPUT_FIELD_ERROR_TEST_ID)).toHaveTextContent(
      'Question is required',
    );
    expect(nameInput).toHaveValue('');
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeDisabled();
  });

  it('removes name field error when the field is filled', async () => {
    const text = 'Abc';
    await renderComponent();
    const nameInput = getNameInput();
    expect(screen.queryByTestId(NAME_INPUT_FIELD_ERROR_TEST_ID)).not.toBeInTheDocument();
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
    expect(screen.queryByTestId(NAME_INPUT_FIELD_ERROR_TEST_ID)).not.toBeInTheDocument();
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
    expect(getSubmitPollButton()).toBeDisabled();
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
    expect(getSubmitPollButton()).toBeEnabled();
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

    expect(optionErrors).toHaveLength(1);
    expect(optionErrors[0]).toHaveTextContent(DUPLICATE_OPTION_FIELD_ERROR_TEXT);
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeDisabled();
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
    expect(screen.queryAllByTestId(OPTION_INPUT_FIELD_ERROR_TEST_ID)).toHaveLength(0);
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeDisabled();
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
    expect(getSubmitPollButton()).toBeDisabled();
  });

  it('shows max vote count input on max vote count enabling', async () => {
    await renderComponent();
    const enforceUniqueToggle = getPollSwitch('enforce_unique_vote');
    await act(async () => {
      await fireEvent.click(enforceUniqueToggle);
    });
    expect(enforceUniqueToggle).toBeChecked();
    await act(async () => {
      await fireEvent.click(getVoteLimitSwitch());
    });
    expect((getMaxVoteCountInput() as any)?.value).toBe('2');
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeDisabled();
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
    const enforceUniqueToggle = getPollSwitch('enforce_unique_vote');
    await act(async () => {
      await fireEvent.click(enforceUniqueToggle);
    });
    await act(async () => {
      await fireEvent.click(getVoteLimitSwitch());
    });
    const maxVoteCountInput = getMaxVoteCountInput();
    await act(async () => {
      await fireEvent.change(maxVoteCountInput, { target: { value: '2' } });
    });
    expect((getMaxVoteCountInput() as any).value).toBe('2');
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeEnabled();
  });

  it('clamps max vote count field value to valid range', async () => {
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
    const enforceUniqueToggle = getPollSwitch('enforce_unique_vote');
    await act(async () => {
      await fireEvent.click(enforceUniqueToggle);
    });
    await act(async () => {
      await fireEvent.click(getVoteLimitSwitch());
    });
    const maxVoteCountInput = getMaxVoteCountInput();
    await act(async () => {
      await fireEvent.change(maxVoteCountInput, { target: { value: '11' } });
    });
    await act(async () => {
      await fireEvent.blur(maxVoteCountInput);
    });

    // SDK clamps max_votes_allowed to valid range [2, 10]
    expect((getMaxVoteCountInput() as any).value).toBe('10');
    expect(screen.queryByText(MAX_VOTE_COUNT_FIELD_ERROR_TEXT)).not.toBeInTheDocument();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeEnabled();
  });

  it('toggles voting visibility', async () => {
    await renderComponent();
    const votingVisibilityToggle = getPollSwitch('voting_visibility');
    await act(async () => {
      await fireEvent.click(votingVisibilityToggle);
    });
    expect(votingVisibilityToggle).toBeChecked();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeDisabled();
  });

  it('toggles allowing user suggested options', async () => {
    await renderComponent();
    const suggestOptionToggle = getPollSwitch('allow_user_suggested_options');
    await act(async () => {
      await fireEvent.click(suggestOptionToggle);
    });
    expect(suggestOptionToggle).toBeChecked();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeDisabled();
  });

  it('toggles allowing user comments', async () => {
    await renderComponent();
    const allowCommentsToggle = getPollSwitch('allow_answers');
    await act(async () => {
      await fireEvent.click(allowCommentsToggle);
    });
    expect(allowCommentsToggle).toBeChecked();
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    expect(getSubmitPollButton()).toBeDisabled();
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
    const createPollSpy = vi
      .spyOn(client, 'createPoll')
      .mockImplementationOnce(() => Promise.resolve({ poll }) as any);
    const initPollStateSpy = vi
      .spyOn(channel.messageComposer.pollComposer, 'initState')
      .mockImplementation(() => {});

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
      await fireEvent.click(getPollSwitch('enforce_unique_vote'));
    });
    await act(async () => {
      await fireEvent.click(getVoteLimitSwitch());
    });
    await act(async () => {
      await fireEvent.change(getMaxVoteCountInput(), {
        target: { value: formState.max_votes_allowed },
      });
    });
    await act(async () => {
      await fireEvent.click(getPollSwitch('voting_visibility'));
    });
    await act(async () => {
      await fireEvent.click(getPollSwitch('allow_user_suggested_options'));
    });
    await act(async () => {
      await fireEvent.click(getPollSwitch('allow_answers'));
    });
    expect(screen.getByText(CANCEL_BUTTON_TEXT)).toBeEnabled();
    const submitButton = getSubmitPollButton();
    expect(submitButton).toBeEnabled();
    await act(async () => {
      await fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(createPollSpy).toHaveBeenCalledWith(
        expect.objectContaining(expectedPollPayload),
      );
      expect(close).toHaveBeenCalledTimes(1);
      expect(initPollStateSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('closes the form on cancel', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({ customUser: user });
    const initPollStateSpy = vi
      .spyOn(channel.messageComposer.pollComposer, 'initState')
      .mockImplementation(() => {});

    await renderComponent({ channel, client });

    act(() => {
      fireEvent.click(screen.getByText(CANCEL_BUTTON_TEXT));
    });
    expect(close).toHaveBeenCalledTimes(1);
    expect(initPollStateSpy).toHaveBeenCalledTimes(1);
  });
});
