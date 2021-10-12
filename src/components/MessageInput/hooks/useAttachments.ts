import { useCallback } from 'react';

import { useImageUploads } from './useImageUploads';
import { useFileUploads } from './useFileUploads';

import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { generateRandomId } from '../../../utils';

import type { FileLike } from 'react-file-utils';

import type { MessageInputProps } from '../MessageInput';
import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

const apiMaxNumberOfFiles = 10;

export const useAttachments = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>,
  state: MessageInputState<At, Us>,
  dispatch: React.Dispatch<MessageInputReducerAction<Us>>,
) => {
  const { noFiles } = props;
  const { fileUploads, imageUploads } = state;

  const { maxNumberOfFiles, multipleUploads } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>(
    'useAttachments',
  );

  const { removeFile, uploadFile } = useFileUploads<At, Ch, Co, Ev, Me, Re, Us, V>(
    props,
    state,
    dispatch,
  );

  const { removeImage, uploadImage } = useImageUploads<At, Ch, Co, Ev, Me, Re, Us, V>(
    props,
    state,
    dispatch,
  );

  // Number of files that the user can still add. Should never be more than the amount allowed by the API.
  // If multipleUploads is false, we only want to allow a single upload.
  const maxFilesAllowed = !multipleUploads ? 1 : maxNumberOfFiles || apiMaxNumberOfFiles;

  const numberOfImages = Object.values(imageUploads).filter(({ state }) => state !== 'failed')
    .length;
  const numberOfFiles = Object.values(fileUploads).filter(({ state }) => state !== 'failed').length;
  const numberOfUploads = numberOfImages + numberOfFiles;

  const maxFilesLeft = maxFilesAllowed - numberOfUploads;

  const uploadNewFiles = useCallback(
    (files: FileList | File[] | FileLike[]) => {
      Array.from(files)
        .slice(0, maxFilesLeft)
        .forEach((file) => {
          const id = generateRandomId();

          if (
            file.type.startsWith('image/') &&
            !file.type.endsWith('.photoshop') // photoshop files begin with 'image/'
          ) {
            dispatch({ file, id, state: 'uploading', type: 'setImageUpload' });
          } else if (file instanceof File && !noFiles) {
            dispatch({ file, id, state: 'uploading', type: 'setFileUpload' });
          }
        });
    },
    [maxFilesLeft, noFiles],
  );

  return {
    maxFilesLeft,
    numberOfUploads,
    removeFile,
    removeImage,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  };
};
