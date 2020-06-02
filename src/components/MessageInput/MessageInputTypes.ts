import { UserResponse } from 'stream-chat';

type SetEmojiPickerIsOpenAction = {
  type: 'setEmojiPickerIsOpen';
  value: boolean;
};
type SetTextAction = {
  type: 'setText';
  getNewText: (currentStateText: string) => string;
};
type ClearAction = {
  type: 'clear';
};
type SetImageUploadAction = {
  type: 'setImageUpload';
  id: string;
  state?: string;
  file?: File;
  url?: string;
  previewUri?: string;
};
type SetFileUploadAction = {
  type: 'setFileUpload';
  id: string;
  state?: string;
  file?: File;
  url?: string;
};
type RemoveImageUploadAction = {
  type: 'removeImageUpload';
  id: string;
};
type RemoveFileUploadAction = {
  type: 'removeFileUpload';
  id: string;
};
type ReduceNumberOfUploadsAction = {
  type: 'reduceNumberOfUploads';
};
type AddMentionedUserAction = {
  type: 'addMentionedUser';
  user: UserResponse;
};

export type MessageInputReducerAction =
  | SetEmojiPickerIsOpenAction
  | SetTextAction
  | ClearAction
  | SetImageUploadAction
  | SetFileUploadAction
  | RemoveImageUploadAction
  | RemoveFileUploadAction
  | ReduceNumberOfUploadsAction
  | AddMentionedUserAction;
