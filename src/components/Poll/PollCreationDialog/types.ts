type Id = string;

export type PollOptionFormData = {
  id: Id;
  text: string;
};

export type OptionErrors = Record<Id, string>;
