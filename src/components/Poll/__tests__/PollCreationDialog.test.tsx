import React from 'react';
import {
  act,
  fireEvent,
  render,
  type RenderResult,
  screen,
  waitFor,
} from '@testing-library/react';
import { PollCreationDialog } from '../PollCreationDialog';
import { MessageComposerContextProvider } from '../../../context';
import { generateUser, initClientWithChannels } from '../../../mock-builders';
import { Chat } from '../../Chat';
import { Channel } from '../../Channel';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';
import type { MessageComposerContextValue } from '../../../context';

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

const getLatestLiveAnnouncement = (region: HTMLElement) =>
  region.lastElementChild?.textContent ?? '';

const getMaxVoteCountInput = () =>
  document.getElementById('max_votes_allowed') as HTMLInputElement | null;
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
  let result: RenderResult;
  await act(() => {
    result = render(
      <Chat client={client}>
        <Channel channel={channel}>
          <MessageComposerContextProvider
            value={fromPartial<MessageComposerContextValue>({ handleSubmit })}
          >
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

  it('describes the reorder/remove affordance on each option field once a second option exists', async () => {
    await renderComponent();
    // Single option: no reorder/remove controls yet, so the field carries no such description.
    expect(getOptionInput()).toHaveAccessibleDescription('');

    // Typing into the only option auto-adds a second one, making the controls available.
    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'First' } });
    });
    await waitFor(() =>
      expect(
        screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER).length,
      ).toBeGreaterThan(1),
    );

    // The affordance is attached to every option field's accessible description (aria-describedby),
    // so it is read in sequence as part of the field read-out rather than via a swallowed live region.
    screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER).forEach((input) => {
      expect(input).toHaveAccessibleDescription(
        'This option can be reordered and removed.',
      );
    });
  });

  it('drops the option-field affordance description when the options drop back to one', async () => {
    await renderComponent();

    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'First' } });
    });
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /^remove /i }).length).toBe(2),
    );

    // Removing back to a single option removes the controls, so the description goes away too.
    await act(async () => {
      await fireEvent.click(screen.getAllByRole('button', { name: /^remove /i })[0]);
    });
    await waitFor(() =>
      expect(screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER).length).toBe(1),
    );
    expect(getOptionInput()).toHaveAccessibleDescription('');
  });

  it('announces, once the option list settles, that the controls became available', async () => {
    await renderComponent();
    const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');

    // Adding a second option makes the reorder/remove controls available.
    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'First' } });
    });

    // Announced via a polite live region, debounced until the option list has been idle for a beat
    // (so it lands after the SR's typing echo / field re-read instead of being superseded by it).
    await waitFor(
      () =>
        expect(getLatestLiveAnnouncement(politeRegion)).toBe(
          'Options can now be reordered and removed.',
        ),
      { timeout: 3000 },
    );
  });

  it('announces a removed option by its text value', async () => {
    await renderComponent();
    const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');

    // Two named options so removing one still leaves the controls in place.
    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'First option' } });
    });
    await waitFor(() =>
      expect(screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER).length).toBe(2),
    );
    await act(async () => {
      await fireEvent.change(
        screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER)[1],
        { target: { value: 'Second option' } },
      );
    });
    await waitFor(() =>
      expect(screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER).length).toBe(3),
    );

    await act(async () => {
      await fireEvent.click(screen.getAllByRole('button', { name: /^remove /i })[0]);
    });

    await waitFor(() =>
      expect(getLatestLiveAnnouncement(politeRegion)).toBe('Removed option First option'),
    );
  });

  it('announces switch settings being turned on and off', async () => {
    await renderComponent();
    const politeRegion = screen.getByTestId('str-chat__aria-live-region--polite');
    const anonymousSwitch = screen.getByRole('switch', { name: /anonymous poll/i });

    await act(async () => {
      await fireEvent.click(anonymousSwitch);
    });
    await waitFor(() =>
      expect(getLatestLiveAnnouncement(politeRegion)).toBe('Anonymous Poll enabled'),
    );

    await act(async () => {
      await fireEvent.click(anonymousSwitch);
    });
    await waitFor(() =>
      expect(getLatestLiveAnnouncement(politeRegion)).toBe('Anonymous Poll disabled'),
    );
  });

  it('gives the close button a concise accessible name', async () => {
    await renderComponent();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAccessibleName('Close');
  });

  // The dialog description is exposed via aria-describedby, which SRs treat as a (often-skipped)
  // hint. On open we announce — assertively, so it is not dropped around the dialog's focus-entry
  // announcement — an open confirmation + the description + the Enter affordance to step into the
  // Question field (via the `poll.dialogOpened` interaction).
  it('announces the dialog open confirmation, description, and Enter hint via the live region', async () => {
    await renderComponent();
    const assertiveRegion = screen.getByTestId('str-chat__aria-live-region--assertive');
    await waitFor(
      () =>
        expect(getLatestLiveAnnouncement(assertiveRegion)).toBe(
          'Poll dialog opened. Create a question, add options, and configure poll settings. Press Enter to start typing.',
        ),
      { timeout: 2000 },
    );
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

  it('renders a remove option button for every draggable option row', async () => {
    await renderComponent();

    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'First option' } });
    });

    const removeOptionButtons = screen.getAllByRole('button', { name: /^remove /i });
    const reorderHandles = screen.getAllByRole('button', { name: /reorder option/i });

    expect(removeOptionButtons).toHaveLength(reorderHandles.length);
    for (const removeOptionButton of removeOptionButtons) {
      expect(removeOptionButton).toBeInTheDocument();
      expect(removeOptionButton.closest('[aria-hidden="true"]')).toBeNull();
    }
  });

  it('focuses the next option input after removing a focused option', async () => {
    await renderComponent();

    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'First option' } });
    });

    const removeOptionButton = screen.getAllByRole('button', {
      name: /^remove /i,
    })[0];
    removeOptionButton.focus();

    expect(removeOptionButton).toHaveFocus();

    await act(async () => {
      await fireEvent.click(removeOptionButton);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(OPTION_FIELD_PLACEHOLDER)).toHaveFocus();
    });
  });

  it('supports keyboard reorder mode from the drag handle', async () => {
    await renderComponent();

    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'First option' } });
    });

    const reorderHandle = screen.getByRole('button', { name: /reorder option 1/i });
    const assertiveLiveRegion = screen.getByTestId(
      'str-chat__aria-live-region--assertive',
    );
    const politeLiveRegion = screen.getByTestId('str-chat__aria-live-region--polite');
    await act(() => {
      reorderHandle.focus();
    });

    expect(reorderHandle).toHaveFocus();

    await waitFor(() => {
      expect(getLatestLiveAnnouncement(assertiveLiveRegion)).toBe(
        'Press Space to select this option, use the Up and Down arrow keys to move it, then press Space again to deselect it.',
      );
    });

    await act(async () => {
      await fireEvent.click(reorderHandle);
    });

    await waitFor(() => {
      expect(getLatestLiveAnnouncement(assertiveLiveRegion)).toBe(
        'Picked up "First option". Use arrow keys to reorder. Press Space or Tab to drop.',
      );
    });

    await act(async () => {
      await fireEvent.keyDown(reorderHandle, { key: 'ArrowDown' });
    });

    const optionFields = screen.getAllByPlaceholderText(OPTION_FIELD_PLACEHOLDER);
    expect(optionFields[0]).toHaveValue('');
    expect(optionFields[1]).toHaveValue('First option');
    // Focus follows the moved option to its new row, and the active handle's
    // aria-label embeds the option text + new position so VoiceOver's native
    // focus announcement carries the move information without duplicating a
    // live-region "moved to position" message.
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute(
        'aria-label',
        'Reorder "First option" at position 2 of 2',
      );
      expect(document.activeElement).toHaveAttribute('aria-pressed', 'true');
    });
    // The move itself emits no polite "moved to position" message (that info rides on the handle's
    // aria-label). The only polite message present is the one-time controls-available announcement
    // from when the second option appeared during setup — it must not mention a position.
    expect(getLatestLiveAnnouncement(politeLiveRegion)).not.toMatch(/position/i);

    await act(async () => {
      await fireEvent.click(document.activeElement as HTMLElement);
    });

    await waitFor(() => {
      expect(getLatestLiveAnnouncement(assertiveLiveRegion)).toBe(
        'Dropped "First option" at position 2.',
      );
    });
  });

  it('supports click activation for keyboard reorder mode', async () => {
    await renderComponent();

    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'First option' } });
    });

    const reorderHandle = screen.getByRole('button', { name: /reorder option 1/i });
    const assertiveLiveRegion = screen.getByTestId(
      'str-chat__aria-live-region--assertive',
    );

    await act(async () => {
      await fireEvent.click(reorderHandle);
    });

    await waitFor(() => {
      expect(getLatestLiveAnnouncement(assertiveLiveRegion)).toBe(
        'Picked up "First option". Use arrow keys to reorder. Press Space or Tab to drop.',
      );
    });

    await act(async () => {
      await fireEvent.click(reorderHandle);
    });

    await waitFor(() => {
      expect(getLatestLiveAnnouncement(assertiveLiveRegion)).toBe(
        'Dropped "First option" at position 1.',
      );
    });
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
    const voteLimitSwitch = screen.getByRole('switch', {
      name: /limit votes per person/i,
    });
    await act(async () => {
      await fireEvent.click(voteLimitSwitch);
    });
    expect(getMaxVoteCountInput()?.value).toBe('2');
    await waitFor(() => {
      expect(getMaxVoteCountInput()).toHaveFocus();
    });
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
    expect(getMaxVoteCountInput()?.value).toBe('2');
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
    expect(getMaxVoteCountInput()?.value).toBe('10');
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
      .mockImplementationOnce(() => Promise.resolve(fromPartial({ poll })));

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
    });
  });

  it('notifies on successful poll submission', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({ customUser: user });
    await renderComponent({ channel, client });
    vi.spyOn(client, 'createPoll').mockResolvedValueOnce(
      fromPartial({ poll: { id: 'pid' } }),
    );
    const addNotificationSpy = vi.spyOn(client.notifications, 'add');

    await act(async () => {
      await fireEvent.change(getNameInput(), { target: { value: 'Q' } });
    });
    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'Opt' } });
    });
    await act(async () => {
      await fireEvent.click(getSubmitPollButton());
    });

    await waitFor(() => {
      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Poll sent',
          options: expect.objectContaining({
            severity: 'success',
            type: 'api:poll:create:success',
          }),
        }),
      );
    });
  });

  it('does not emit success notification on poll submission failure', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({ customUser: user });
    await renderComponent({ channel, client });
    // createPoll() in stream-chat-js already publishes an
    // `api:poll:create:failed` notification on failure, so the React side must
    // not add its own error notification (avoids a duplicate). It also must
    // not emit the success notification.
    vi.spyOn(client, 'createPoll').mockRejectedValueOnce(new Error('create failed'));
    const addNotificationSpy = vi.spyOn(client.notifications, 'add');

    await act(async () => {
      await fireEvent.change(getNameInput(), { target: { value: 'Q' } });
    });
    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'Opt' } });
    });
    await act(async () => {
      await fireEvent.click(getSubmitPollButton());
    });

    await waitFor(() => {
      expect(addNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to create the poll',
          options: expect.objectContaining({
            severity: 'error',
            type: 'api:poll:create:failed',
          }),
        }),
      );
    });
    const successCalls = addNotificationSpy.mock.calls.filter(
      ([payload]) => payload?.message === 'Poll sent',
    );
    expect(successCalls).toHaveLength(0);
    expect(handleSubmit).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('returns focus to the composer input after a successful send', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({ customUser: user });
    vi.spyOn(client, 'createPoll').mockResolvedValueOnce(
      fromPartial({ poll: { id: 'pid' } }),
    );

    const composerTextarea = document.createElement('textarea');
    document.body.appendChild(composerTextarea);
    const textareaRef = { current: composerTextarea };

    await act(() => {
      render(
        <Chat client={client}>
          <Channel channel={channel}>
            <MessageComposerContextProvider
              value={fromPartial<MessageComposerContextValue>({
                handleSubmit,
                textareaRef,
              })}
            >
              <PollCreationDialog close={close} />
            </MessageComposerContextProvider>
          </Channel>
        </Chat>,
      );
    });

    await act(async () => {
      await fireEvent.change(getNameInput(), { target: { value: 'Q' } });
    });
    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'Opt' } });
    });
    await act(async () => {
      await fireEvent.click(getSubmitPollButton());
    });

    await waitFor(() => {
      expect(composerTextarea).toHaveFocus();
    });

    composerTextarea.remove();
  });

  it('closes the form on cancel', async () => {
    await renderComponent();

    act(() => {
      fireEvent.click(screen.getByText(CANCEL_BUTTON_TEXT));
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('closes the form optimistically before createPoll resolves', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({ customUser: user });
    await renderComponent({ channel, client });

    let resolveCreatePoll: (value: unknown) => void = () => {};
    const createPollPromise = new Promise((resolve) => {
      resolveCreatePoll = resolve;
    });
    vi.spyOn(client, 'createPoll').mockImplementationOnce(
      () => createPollPromise as ReturnType<StreamChat['createPoll']>,
    );

    await act(async () => {
      await fireEvent.change(getNameInput(), { target: { value: 'Q' } });
    });
    await act(async () => {
      await fireEvent.change(getOptionInput(), { target: { value: 'Opt' } });
    });

    await act(async () => {
      await fireEvent.click(getSubmitPollButton());
    });

    expect(close).toHaveBeenCalledTimes(1);
    expect(handleSubmit).not.toHaveBeenCalled();

    await act(async () => {
      resolveCreatePoll(fromPartial({ poll: { id: 'pid' } }));
      await createPollPromise;
    });

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
    expect(close).toHaveBeenCalledTimes(1);
  });
});
