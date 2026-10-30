import { useId, useState } from 'react';
import type { Poll, PollState } from 'stream-chat';
import {
  Button,
  GlobalModal,
  NumericInput,
  Prompt,
  SwitchField,
  SwitchFieldLabel,
  TextInput,
  TextInputFieldSet,
  useComponentContextIcons,
  useStateStore,
} from 'stream-chat-react';
import {
  hasErrors,
  pollFormFromState,
  restoreOptions,
  savePollForm,
  validatePollForm,
} from './pollForm';
import type { ConfirmedVoteLoss, PollForm, PollFormOption, PollOption } from './pollForm';
import './EditPollDialog.css';

export type EditPollTarget = {
  /** Deletes the message that carries the poll; rejects when the request fails. */
  deleteMessage: () => Promise<void>;
  poll: Poll;
};

const votesSelector = ({ vote_count, vote_counts_by_option }: PollState) => ({
  vote_count,
  vote_counts_by_option,
});

const votesLabel = (votes: number) => `${votes} ${votes === 1 ? 'vote' : 'votes'}`;

/** Why Save sent nothing: these options got votes after the user removed them. */
const newVotesNotice = (options: PollOption[]) => {
  const names = options.map(({ text }) => `"${text}"`).join(', ');
  const [pronoun, isBack] =
    options.length === 1 ? ['it', "it's back"] : ['them', "they're back"];
  return `${names} got votes after you removed ${pronoun}, so ${isBack}. Nothing was saved yet: press Save again to keep your other changes.`;
};

let newOptionCount = 0;
const newOption = (): PollFormOption => ({ key: `new-${++newOptionCount}`, text: '' });

type EditPollFormProps = { onClose: () => void; target: EditPollTarget };

const EditPollForm = ({
  onClose,
  target: { deleteMessage, poll },
}: EditPollFormProps) => {
  const { IconMinusCircle, IconPlus } = useComponentContextIcons();
  // The poll as it was when the dialog opened: the form starts from it, and Save sends only what
  // differs from it.
  const [saved] = useState(() => poll.data);
  const [form, setForm] = useState(() => pollFormFromState(saved));
  const [showErrors, setShowErrors] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [alertText, setAlertText] = useState<string>();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  // The row whose removal waits for the user to confirm that its votes go with it.
  const [confirmingRemovalKey, setConfirmingRemovalKey] = useState<string>();
  const [confirmedVoteLoss, setConfirmedVoteLoss] = useState<ConfirmedVoteLoss>({});
  // Set once `Poll.delete()` succeeded, so trying again deletes only the message.
  const [isPollDeleted, setIsPollDeleted] = useState(false);
  // Live, so the counts and the removal confirmation follow votes cast while the dialog is open.
  const { vote_count, vote_counts_by_option } = useStateStore(poll.state, votesSelector);
  // A row whose votes dropped to zero needs no confirmation any more, so its prompt is dropped
  // for good rather than coming back with the next vote.
  const confirmingOption = form.options.find(
    (option: PollFormOption) => option.key === confirmingRemovalKey,
  );
  if (
    confirmingRemovalKey &&
    !(confirmingOption?.id && vote_counts_by_option[confirmingOption.id])
  ) {
    setConfirmingRemovalKey(undefined);
  }

  const id = useId();
  const errors = validatePollForm(form);
  const maxVotesError = showErrors && !!errors.max_votes_allowed;
  const update = (changes: Partial<PollForm>) =>
    setForm((prev: PollForm) => ({ ...prev, ...changes }));
  const updateOption = (key: string, text: string) =>
    update({
      options: form.options.map((option: PollFormOption) =>
        option.key === key ? { ...option, text } : option,
      ),
    });
  const removeOption = (key: string) =>
    update({
      options: form.options.filter((option: PollFormOption) => option.key !== key),
    });
  /** Removes a row with votes once the user confirmed, and notes the votes they agreed to delete. */
  const confirmRemoval = (option: PollFormOption, votes: number) => {
    const { id } = option;
    if (id) setConfirmedVoteLoss((prev: ConfirmedVoteLoss) => ({ ...prev, [id]: votes }));
    setConfirmingRemovalKey(undefined);
    removeOption(option.key);
  };

  /**
   * Runs the requests, then closes the dialog. A notice the requests return, or a failure, keeps
   * it open and says so.
   */
  const run = async (requests: () => Promise<string | void>, failure: string) => {
    setIsBusy(true);
    setAlertText(undefined);
    try {
      const notice = await requests();
      if (!notice) {
        onClose();
        return;
      }
      setAlertText(notice);
    } catch {
      setAlertText(failure);
    }
    setIsBusy(false);
  };

  const save = () => {
    if (hasErrors(errors)) {
      setShowErrors(true);
      return;
    }
    void run(async () => {
      const { optionsWithNewVotes } = await savePollForm(
        poll,
        saved,
        form,
        confirmedVoteLoss,
      );
      if (!optionsWithNewVotes.length) return;
      setForm((prev: PollForm) => restoreOptions(prev, saved, optionsWithNewVotes));
      return newVotesNotice(optionsWithNewVotes);
    }, 'Not every change was saved. Close the dialog and open it again to see the poll as it is now.');
  };

  /**
   * The poll first: if that fails, nothing has changed. Then its message, which would otherwise go
   * on showing the deleted poll.
   */
  const deletePollAndMessage = () =>
    run(async () => {
      if (!isPollDeleted) {
        try {
          await poll.delete();
        } catch {
          return 'The poll could not be deleted. Nothing has changed.';
        }
        setIsPollDeleted(true);
      }
      try {
        await deleteMessage();
      } catch {
        return 'The poll was deleted, but its message could not be. Press Delete to try again.';
      }
    }, 'The poll could not be deleted.');

  return (
    <Prompt.Root className='str-chat__poll-creation-dialog cookbook-edit-poll'>
      <Prompt.Header close={onClose} title='Edit poll' />
      <Prompt.Body>
        <form autoComplete='off' onSubmit={(event) => event.preventDefault()}>
          <TextInput
            className='str-chat__form__input-field__value'
            error={showErrors && !!errors.name}
            errorMessage={errors.name}
            label='Question'
            onChange={(event) => update({ name: event.target.value })}
            value={form.name}
          />
          <TextInputFieldSet draggable={false} label='Options'>
            {form.options.map((option: PollFormOption, index: number) => {
              const votes = option.id ? (vote_counts_by_option[option.id] ?? 0) : 0;
              const error = showErrors ? errors.options[option.key] : undefined;
              const isConfirmingRemoval =
                votes > 0 && confirmingRemovalKey === option.key;
              return (
                <div className='str-chat__form__input-field' key={option.key}>
                  <TextInput
                    className='str-chat__form__input-field__value'
                    error={!!error}
                    errorMessage={error}
                    fieldMessagePlacement='inside'
                    message={votes ? votesLabel(votes) : undefined}
                    onChange={(event) => updateOption(option.key, event.target.value)}
                    placeholder='Add an option'
                    trailing={
                      <Button
                        appearance='ghost'
                        aria-label={`Remove option: ${option.text || index + 1}`}
                        circular
                        className='str-chat__form__remove-option-button'
                        // An option with votes asks first: deleting it deletes its votes.
                        onClick={() =>
                          votes
                            ? setConfirmingRemovalKey(option.key)
                            : removeOption(option.key)
                        }
                        size='xs'
                        variant='secondary'
                      >
                        <IconMinusCircle />
                      </Button>
                    }
                    value={option.text}
                  />
                  {isConfirmingRemoval && (
                    <div className='cookbook-edit-poll__remove-confirm' role='alert'>
                      <p className='cookbook-edit-poll__remove-confirm-text'>
                        Removing it deletes its {votesLabel(votes)}.
                      </p>
                      <Button
                        appearance='ghost'
                        onClick={() => setConfirmingRemovalKey(undefined)}
                        size='sm'
                        variant='secondary'
                      >
                        Keep
                      </Button>
                      <Button
                        appearance='solid'
                        onClick={() => confirmRemoval(option, votes)}
                        size='sm'
                        variant='danger'
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </TextInputFieldSet>
          <Button
            appearance='outline'
            className='cookbook-edit-poll__add-option'
            onClick={() => update({ options: [...form.options, newOption()] })}
            size='sm'
            variant='secondary'
          >
            <IconPlus />
            Add an option
          </Button>
          <div className='str-chat__poll-creation-dialog__features-selectors'>
            <SwitchField
              checked={!form.enforce_unique_vote}
              description='Select more than one option'
              onChange={(event) =>
                update({ enforce_unique_vote: !event.target.checked, limitVotes: false })
              }
              title='Multiple votes'
            />
            {!form.enforce_unique_vote && (
              // The layout of the SDK's own vote limit field: the label and, once the switch is
              // on, the number beside it.
              <SwitchField
                aria-labelledby={`${id}-limit-label`}
                checked={form.limitVotes}
                fieldClassName='str-chat__multiple-answers-field__votes-limit-field'
                id={`${id}-limit`}
                onChange={(event) =>
                  update({
                    limitVotes: event.target.checked,
                    max_votes_allowed: form.max_votes_allowed || '2',
                  })
                }
              >
                <div className='str-chat__multiple-answers-field__votes-limit-field__numeric-field'>
                  <SwitchFieldLabel
                    asError={maxVotesError}
                    description={
                      maxVotesError
                        ? errors.max_votes_allowed
                        : 'Choose between 2 and 10 votes'
                    }
                    htmlFor={`${id}-limit`}
                    id={`${id}-limit-label`}
                    title='Limit votes per person'
                  />
                  {form.limitVotes && (
                    <NumericInput
                      aria-label='Maximum votes per person'
                      max={10}
                      min={2}
                      onChange={(event) =>
                        update({ max_votes_allowed: event.target.value })
                      }
                      value={form.max_votes_allowed}
                    />
                  )}
                </div>
              </SwitchField>
            )}
            <SwitchField
              checked={form.voting_visibility === 'anonymous'}
              description={
                vote_count ? "Can't change once people have voted" : 'Hide who voted'
              }
              // Making an anonymous poll public would reveal who cast its votes.
              disabled={vote_count > 0}
              onChange={(event) =>
                update({
                  voting_visibility: event.target.checked ? 'anonymous' : 'public',
                })
              }
              title='Anonymous poll'
            />
            <SwitchField
              checked={form.allow_user_suggested_options}
              description='Let others add options'
              onChange={(event) =>
                update({ allow_user_suggested_options: event.target.checked })
              }
              title='Suggest an option'
            />
            <SwitchField
              checked={form.allow_answers}
              description='Allow others to add comments'
              onChange={(event) => update({ allow_answers: event.target.checked })}
              title='Add a comment'
            />
          </div>
        </form>
      </Prompt.Body>
      <Prompt.Footer>
        {alertText && (
          <p className='cookbook-edit-poll__error' role='alert'>
            {alertText}
          </p>
        )}
        {isConfirmingDelete ? (
          <div className='cookbook-edit-poll__footer'>
            <p className='cookbook-edit-poll__confirm'>
              Delete the poll, its votes and its message?
            </p>
            <Prompt.FooterControls>
              <Prompt.FooterControlsButtonSecondary
                // Once the poll is gone, there is nothing left to keep.
                disabled={isBusy || isPollDeleted}
                onClick={() => setIsConfirmingDelete(false)}
              >
                Keep
              </Prompt.FooterControlsButtonSecondary>
              <Button
                appearance='solid'
                disabled={isBusy}
                onClick={() => void deletePollAndMessage()}
                size='md'
                variant='danger'
              >
                Delete
              </Button>
            </Prompt.FooterControls>
          </div>
        ) : (
          <div className='cookbook-edit-poll__footer'>
            <div className='cookbook-edit-poll__poll-actions'>
              <Prompt.FooterControlsButtonSecondary
                disabled={isBusy}
                onClick={() =>
                  void run(async () => {
                    await poll.close();
                  }, 'The poll could not be closed.')
                }
              >
                Close poll
              </Prompt.FooterControlsButtonSecondary>
              <Button
                appearance='ghost'
                disabled={isBusy}
                onClick={() => setIsConfirmingDelete(true)}
                size='md'
                variant='danger'
              >
                Delete poll
              </Button>
            </div>
            <Prompt.FooterControls>
              <Prompt.FooterControlsButtonSecondary disabled={isBusy} onClick={onClose}>
                Cancel
              </Prompt.FooterControlsButtonSecondary>
              <Prompt.FooterControlsButtonPrimary disabled={isBusy} onClick={save}>
                Save
              </Prompt.FooterControlsButtonPrimary>
            </Prompt.FooterControls>
          </div>
        )}
      </Prompt.Footer>
    </Prompt.Root>
  );
};

type EditPollDialogProps = { onClose: () => void; target?: EditPollTarget };

/** A dialog filled from `target.poll`; a new form starts each time it opens. */
export const EditPollDialog = ({ onClose, target }: EditPollDialogProps) => (
  <GlobalModal onClose={onClose} open={!!target}>
    {target && <EditPollForm key={target.poll.id} onClose={onClose} target={target} />}
  </GlobalModal>
);
