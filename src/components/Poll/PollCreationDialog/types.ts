import type { VotingVisibility } from 'stream-chat';

type Id = string;

export type PollOptionFormData = {
  id: Id;
  text: string;
};

export type PollFormState = {
  id: Id;
  max_votes_allowed: string;
  name: string;
  options: PollOptionFormData[];
  allow_answers?: boolean;
  allow_user_suggested_options?: boolean;
  description?: string;
  enforce_unique_vote?: boolean;
  is_closed?: boolean;
  user_id?: string;
  voting_visibility?: VotingVisibility;
};

export type OptionErrors = Record<Id, string>;
