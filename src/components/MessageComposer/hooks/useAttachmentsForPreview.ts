import { useMessageComposerController } from './useMessageComposerController';
import { useStateStore } from '../../../store';
import type {
  AttachmentManagerState,
  LocationComposerState,
  PollComposerState,
} from 'stream-chat';

const attachmentManagerStateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});
const pollComposerStateSelector = (state: PollComposerState) => ({
  poll: state.data,
});
const locationComposerStateSelector = (state: LocationComposerState) => ({
  location: state.location,
});

export const useAttachmentsForPreview = () => {
  const { attachmentManager, locationComposer, pollComposer } =
    useMessageComposerController();
  const { attachments } = useStateStore(
    attachmentManager.state,
    attachmentManagerStateSelector,
  );
  const { poll } = useStateStore(pollComposer.state, pollComposerStateSelector);
  const { location } = useStateStore(
    locationComposer.state,
    locationComposerStateSelector,
  );

  return {
    attachments,
    location,
    poll,
  };
};
