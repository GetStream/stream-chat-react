import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isFailedUpload, isFinishedUpload, isPendingUpload } from 'stream-chat';
import { MediaRecorderController, MediaRecordingState } from '../classes';
import { useTranslationContext } from '../../../context';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';
import { useInteractionAnnouncements } from '../../Accessibility';
import { uploadAttachmentIfEnabled } from '../../MessageComposer/uploadAttachmentIfEnabled';

import type {
  AttachmentManager,
  LocalAttachment,
  LocalVoiceRecordingAttachment,
  MessageComposer,
} from 'stream-chat';
import type { CustomAudioRecordingConfig } from '../classes';
import type { MessageComposerContextValue } from '../../../context';

/**
 * The composer's copy of `attachment`, which carries its upload state. The upload filter and the upload
 * middleware can leave an attachment out, and there is none to find while uploads are off.
 */
const findInComposer = (
  attachmentManager: AttachmentManager,
  attachment: LocalAttachment | undefined,
) =>
  attachment ? attachmentManager.attachmentsById[attachment.localMetadata.id] : undefined;

/**
 * Resolves once the composer holds `attachment`, or once `upload` ends without adding it (or there is
 * no upload, while uploads are off).
 */
const untilComposerHolds = async (
  attachmentManager: AttachmentManager,
  attachment: LocalAttachment,
  upload: Promise<unknown> | undefined,
) => {
  let unsubscribe: (() => void) | undefined;
  const added = new Promise<void>((resolve) => {
    unsubscribe = attachmentManager.state.subscribe(() => {
      if (findInComposer(attachmentManager, attachment)) resolve();
    });
  });
  try {
    await Promise.race([added, upload]);
  } finally {
    unsubscribe?.();
  }
};

/**
 * Whether a send carries `attachment`. A finished upload does. With pending uploads allowed, so does
 * one still uploading or failed, as the send waits for it or retries it. A blocked upload never does,
 * and a send that keeps the composition (`retainsCompositionOnSubmit`) carries none of it.
 */
const isSentWithMessage = (
  messageComposer: MessageComposer,
  attachment: LocalAttachment,
) =>
  !messageComposer.retainsCompositionOnSubmit &&
  (isFinishedUpload(attachment) ||
    (messageComposer.allowsPendingUploads &&
      (isPendingUpload(attachment) || isFailedUpload(attachment))));

export type RecordingController = {
  completeRecording: () => void;
  permissionState?: PermissionState;
  recorder?: MediaRecorderController;
  recording?: LocalVoiceRecordingAttachment;
  recordingState?: MediaRecordingState;
};

type UseMediaRecorderParams = Pick<
  MessageComposerContextValue,
  'asyncMessagesMultiSendEnabled'
> & {
  enabled: boolean;
  generateRecordingTitle?: (mimeType: string) => string;
  recordingConfig?: CustomAudioRecordingConfig;
};

export const useMediaRecorder = ({
  asyncMessagesMultiSendEnabled,
  enabled,
  generateRecordingTitle,
  recordingConfig,
}: UseMediaRecorderParams): RecordingController => {
  const { t } = useTranslationContext();
  const { announceInteraction } = useInteractionAnnouncements();
  const messageComposer = useMessageComposerController();
  const sendMessageFn = messageComposer.send;
  const [recording, setRecording] = useState<LocalVoiceRecordingAttachment>();
  const [recordingState, setRecordingState] = useState<MediaRecordingState>();
  const [permissionState, setPermissionState] = useState<PermissionState>();

  const recorder = useMemo(
    () =>
      enabled
        ? new MediaRecorderController({
            config: recordingConfig ?? {},
            generateRecordingTitle,
            t,
          })
        : undefined,
    [recordingConfig, enabled, generateRecordingTitle, t],
  );

  const completeRecording = useCallback(async () => {
    if (!recorder) return;
    const recording = await recorder.stop();
    if (!recording) return;
    const { attachmentManager } = messageComposer;
    const upload = uploadAttachmentIfEnabled(attachmentManager, recording);
    // With pending uploads allowed, a send waits for the upload itself, so the recording only has to
    // be in the composer. Otherwise the upload has to end first. The recorder then no longer holds a
    // recording that the upload drops later (post-upload middleware discarding it).
    if (messageComposer.allowsPendingUploads) {
      await untilComposerHolds(attachmentManager, recording, upload);
    } else {
      await upload;
    }
    // Uploads can be off, and the upload filter and middleware can leave the recording out. It then
    // stays with the recorder, so it is neither sent nor lost, and only the microphone is released.
    // An upload that dropped it may have revoked its URL, so the recorder gives it a new one.
    const recordingInComposer = findInComposer(attachmentManager, recording);
    if (!recordingInComposer) {
      if (upload) recorder.renewRecordingUri();
      recorder.releaseMicrophone();
      return;
    }
    // The composer holds the recording now, so the recorder lets it go without waiting for a send,
    // which with pending uploads allowed lasts until the upload ends.
    recorder.handOverRecording();
    if (asyncMessagesMultiSendEnabled) {
      announceInteraction('voiceRecording.attached');
      return;
    }
    // A recording the send would leave out is not sent. It stays in the composer, where a failed one
    // can be retried.
    if (
      isSentWithMessage(messageComposer, recordingInComposer) &&
      (await sendMessageFn()) === 'sent'
    ) {
      announceInteraction('voiceRecording.sent');
    }
  }, [
    announceInteraction,
    asyncMessagesMultiSendEnabled,
    messageComposer,
    recorder,
    sendMessageFn,
  ]);

  const previousRecordingStateRef = useRef(recordingState);
  useEffect(() => {
    const previous = previousRecordingStateRef.current;
    previousRecordingStateRef.current = recordingState;
    if (previous === recordingState) return;
    if (recordingState === MediaRecordingState.RECORDING) {
      announceInteraction(
        previous === MediaRecordingState.PAUSED
          ? 'voiceRecording.resumed'
          : 'voiceRecording.started',
      );
    } else if (recordingState === MediaRecordingState.PAUSED) {
      announceInteraction('voiceRecording.paused');
    }
  }, [announceInteraction, recordingState]);

  useEffect(() => {
    if (!recorder) return;
    recorder.permission.watch();
    const recordingSubscription = recorder.recording.subscribe(setRecording);
    const recordingStateSubscription =
      recorder.recordingState.subscribe(setRecordingState);
    const permissionStateSubscription =
      recorder.permission.state.subscribe(setPermissionState);

    return () => {
      recorder.cancel();
      recorder.permission.unwatch();
      recordingSubscription.unsubscribe();
      recordingStateSubscription.unsubscribe();
      permissionStateSubscription.unsubscribe();
    };
  }, [recorder]);

  return {
    completeRecording,
    permissionState,
    recorder,
    recording,
    recordingState,
  };
};
