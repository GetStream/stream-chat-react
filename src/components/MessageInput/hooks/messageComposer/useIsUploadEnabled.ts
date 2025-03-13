import { useMessageComposer } from './useMessageComposer';
import type { DefaultStreamChatGenerics } from '../../../../types';
import { AttachmentManagerState } from 'stream-chat';
import { useStateStore } from '../../../../store';

const stateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
  hasUploadPermission: state.hasUploadPermission,
});

export const useIsUploadEnabled = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const messageComposer = useMessageComposer<StreamChatGenerics>();
  useStateStore(messageComposer.attachmentManager.state, stateSelector);
  return {
    availableUploadSlots: messageComposer.attachmentManager.availableUploadSlots,
    isUploadEnabled: messageComposer.attachmentManager.isUploadEnabled,
  };
};
