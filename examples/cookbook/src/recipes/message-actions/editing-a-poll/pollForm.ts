import type { PartialPollUpdate, Poll, PollState } from 'stream-chat';

/** One option row. `id` is the option's id on the server; a row the user added has none yet. */
export type PollFormOption = { id?: string; key: string; text: string };

/** What the dialog edits, named as in the poll. */
export type PollForm = {
  allow_answers: boolean;
  allow_user_suggested_options: boolean;
  enforce_unique_vote: boolean;
  /** Whether a multiple-vote poll limits the votes per user to `max_votes_allowed`. */
  limitVotes: boolean;
  /** The vote limit per user, as typed. */
  max_votes_allowed: string;
  name: string;
  options: PollFormOption[];
  voting_visibility: 'anonymous' | 'public';
};

export type PollFormErrors = {
  max_votes_allowed?: string;
  name?: string;
  /** Keyed by `PollFormOption.key`. */
  options: Record<string, string>;
};

export const pollFormFromState = (state: PollState): PollForm => ({
  allow_answers: state.allow_answers,
  allow_user_suggested_options: state.allow_user_suggested_options,
  enforce_unique_vote: state.enforce_unique_vote,
  limitVotes: !!state.max_votes_allowed,
  max_votes_allowed: state.max_votes_allowed ? String(state.max_votes_allowed) : '',
  name: state.name,
  options: state.options.map(({ id, text }) => ({ id, key: id, text })),
  voting_visibility: state.voting_visibility,
});

export const validatePollForm = (form: PollForm): PollFormErrors => {
  const errors: PollFormErrors = { options: {} };
  if (!form.name.trim()) errors.name = 'Question is required';

  const seen = new Set<string>();
  for (const option of form.options) {
    const text = option.text.trim();
    // An empty new row is left out on save; an existing option needs its text.
    if (!text) {
      if (option.id) errors.options[option.key] = 'Option is empty';
      continue;
    }
    if (seen.has(text.toLowerCase()))
      errors.options[option.key] = 'Option already exists';
    seen.add(text.toLowerCase());
  }

  const maxVotes = Number(form.max_votes_allowed);
  if (
    !form.enforce_unique_vote &&
    form.limitVotes &&
    !(Number.isInteger(maxVotes) && maxVotes >= 2 && maxVotes <= 10)
  ) {
    errors.max_votes_allowed = 'Type a number from 2 to 10';
  }
  return errors;
};

export const hasErrors = (errors: PollFormErrors) =>
  !!errors.name || !!errors.max_votes_allowed || Object.keys(errors.options).length > 0;

/** An option as the poll holds it. */
export type PollOption = PollState['options'][number];

/**
 * For each option the user removed while it had votes, the vote count the confirmation showed:
 * the votes the user agreed to delete with it. Keyed by option id.
 */
export type ConfirmedVoteLoss = Record<string, number>;

/**
 * The options the form removes that have more votes now than the user agreed to delete: any vote
 * for an option removed while it had none, or more than the confirmation showed. It reads
 * `poll.state` when it's called, so it sees a vote that arrived after the user removed the row.
 */
export const removedOptionsWithNewVotes = (
  poll: Poll,
  saved: PollState,
  form: PollForm,
  confirmedVoteLoss: ConfirmedVoteLoss,
): PollOption[] => {
  const { vote_counts_by_option } = poll.state.getLatestValue();
  return saved.options.filter(({ id }) => {
    const isRemoved = !form.options.some((row) => row.id === id);
    const votesNow = vote_counts_by_option[id] ?? 0;
    return isRemoved && votesNow > (confirmedVoteLoss[id] ?? 0);
  });
};

/** The form with the removed `options` back in the place they had when the dialog opened. */
export const restoreOptions = (
  form: PollForm,
  saved: PollState,
  options: PollOption[],
): PollForm => {
  const rows = [...form.options];
  for (const option of options) {
    const index = Math.min(saved.options.indexOf(option), rows.length);
    rows.splice(index, 0, { id: option.id, key: option.id, text: option.text });
  }
  return { ...form, options: rows };
};

/** The vote limit to store: none for a single-vote poll or without a limit. */
const maxVotesOf = (form: PollForm) =>
  form.enforce_unique_vote || !form.limitVotes
    ? undefined
    : Number(form.max_votes_allowed);

/**
 * Sends only what the user changed since the dialog opened (`saved`, the poll's state then), so a
 * change someone else made meanwhile isn't overwritten. The settings go in one
 * `Poll.partialUpdate()`; each option goes through its own request. None of these requests
 * updates `poll.state`: each one makes the server send `poll.updated`, and the client applies it.
 *
 * Deleting an option deletes its votes, so it sends nothing while the form removes an option that
 * has more votes now than the user agreed to delete, and returns those options instead. Renaming
 * an option keeps its votes.
 */
export const savePollForm = async (
  poll: Poll,
  saved: PollState,
  form: PollForm,
  confirmedVoteLoss: ConfirmedVoteLoss,
): Promise<{ optionsWithNewVotes: PollOption[] }> => {
  const optionsWithNewVotes = removedOptionsWithNewVotes(
    poll,
    saved,
    form,
    confirmedVoteLoss,
  );
  if (optionsWithNewVotes.length) return { optionsWithNewVotes };

  const before = pollFormFromState(saved);
  const after = { ...form, name: form.name.trim() };

  const set: NonNullable<PartialPollUpdate['set']> = {};
  const unset: NonNullable<PartialPollUpdate['unset']> = [];
  if (after.name !== before.name) set.name = after.name;
  if (after.allow_answers !== before.allow_answers)
    set.allow_answers = after.allow_answers;
  if (after.allow_user_suggested_options !== before.allow_user_suggested_options) {
    set.allow_user_suggested_options = after.allow_user_suggested_options;
  }
  if (after.enforce_unique_vote !== before.enforce_unique_vote) {
    set.enforce_unique_vote = after.enforce_unique_vote;
  }
  if (after.voting_visibility !== before.voting_visibility) {
    set.voting_visibility = after.voting_visibility;
  }
  const maxVotes = maxVotesOf(after);
  if (maxVotes !== maxVotesOf(before)) {
    if (maxVotes === undefined) unset.push('max_votes_allowed');
    else set.max_votes_allowed = maxVotes;
  }
  if (Object.keys(set).length || unset.length) await poll.partialUpdate({ set, unset });

  for (const option of saved.options) {
    if (!form.options.some(({ id }) => id === option.id))
      await poll.deleteOption(option.id);
  }
  for (const { id, text } of form.options) {
    const trimmed = text.trim();
    const savedOption = saved.options.find((option) => option.id === id);
    // `Poll.updateOption()` replaces the whole option, so its custom data goes along.
    if (savedOption && trimmed !== savedOption.text) {
      await poll.updateOption({
        custom: savedOption.custom,
        id: savedOption.id,
        text: trimmed,
      });
    }
    if (!id && trimmed) await poll.createOption({ text: trimmed });
  }
  return { optionsWithNewVotes: [] };
};
