import { UserResponse } from 'stream-chat';

type SetEmojiPickerIsOpenAction = {
  type: 'setEmojiPickerIsOpen';
  value: boolean;
};
type SetTextAction = {
  getNewText: (currentStateText: string) => string;
  type: 'setText';
};
type ClearAction = {
  type: 'clear';
};
type SetImageUploadAction = {
  id: string;
  type: 'setImageUpload';
  file?: File;
  previewUri?: string;
  state?: string;
  url?: string;
};
type SetFileUploadAction = {
  id: string;
  type: 'setFileUpload';
  file?: File;
  state?: string;
  url?: string;
};
type RemoveImageUploadAction = {
  id: string;
  type: 'removeImageUpload';
};
type RemoveFileUploadAction = {
  id: string;
  type: 'removeFileUpload';
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
