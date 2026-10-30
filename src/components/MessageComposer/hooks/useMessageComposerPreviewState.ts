import { useMemo } from 'react';
import type {
  AttachmentManagerState,
  CustomDataManagerState,
  LinkPreview,
  LinkPreviewsManagerState,
  LocationComposerState,
  MessageComposerState,
} from 'stream-chat';
import { LinkPreviewsManager } from 'stream-chat';

import { useStateStore } from '../../../store';
import { useMessageComposerController } from './useMessageComposerController';

const messageComposerStateSelector = ({
  editedMessage,
  pollId,
  quotedMessage,
}: MessageComposerState) => ({
  editedMessage,
  pollId,
  quotedMessage,
});

const attachmentManagerStateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

const linkPreviewsManagerStateSelector = (state: LinkPreviewsManagerState) => ({
  previews: state.previews,
});

const locationComposerStateSelector = (state: LocationComposerState) => ({
  location: state.location,
});

const customDataManagerStateSelector = (state: CustomDataManagerState) => ({
  customData: state.custom,
});

/**
 * The composer state that decides which previews show. Each item of a
 * `messageComposerPreviewSet` reads it in `isVisible`.
 */
export type MessageComposerPreviewVisibilityFilterParams = {
  attachments: AttachmentManagerState['attachments'];
  /** The composer's custom data (`messageComposer.customDataManager`). */
  customData: CustomDataManagerState['custom'];
  editedMessage: MessageComposerState['editedMessage'];
  /** Link previews that are loading or loaded. */
  linkPreviews: LinkPreview[];
  location: LocationComposerState['location'];
  /** A poll created with `messageComposer.createPoll()` that goes out with the message. */
  pollId: MessageComposerState['pollId'];
  quotedMessage: MessageComposerState['quotedMessage'];
};

/**
 * Subscribes to the composer state that decides which previews show, for the composer
 * `useMessageComposerController()` resolves.
 */
export const useMessageComposerPreviewState =
  (): MessageComposerPreviewVisibilityFilterParams => {
    const messageComposer = useMessageComposerController();
    const { editedMessage, pollId, quotedMessage } = useStateStore(
      messageComposer.state,
      messageComposerStateSelector,
    );
    const { attachments } = useStateStore(
      messageComposer.attachmentManager.state,
      attachmentManagerStateSelector,
    );
    const { previews } = useStateStore(
      messageComposer.linkPreviewsManager.state,
      linkPreviewsManagerStateSelector,
    );
    const { location } = useStateStore(
      messageComposer.locationComposer.state,
      locationComposerStateSelector,
    );
    const { customData } = useStateStore(
      messageComposer.customDataManager.state,
      customDataManagerStateSelector,
    );

    const linkPreviews = useMemo(
      () =>
        Array.from(previews.values()).filter(
          (preview) =>
            LinkPreviewsManager.previewIsLoaded(preview) ||
            LinkPreviewsManager.previewIsLoading(preview),
        ),
      [previews],
    );

    return useMemo(
      () => ({
        attachments,
        customData,
        editedMessage,
        linkPreviews,
        location,
        pollId,
        quotedMessage,
      }),
      [
        attachments,
        customData,
        editedMessage,
        linkPreviews,
        location,
        pollId,
        quotedMessage,
      ],
    );
  };
