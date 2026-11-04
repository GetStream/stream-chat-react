import { forwardRef, useMemo } from 'react';
import {
  MessageComposerPreviews,
  StartRecordingAudioButton,
  type StartRecordingAudioButtonProps,
} from 'stream-chat-react';

import { useAppSettingsSelector } from '../AppSettings';
import { buildPreviewSet } from './previewSections';

/** The composer's previews, in the order and selection set in Settings -> Composer. */
export const ConfigurableComposerPreviews = () => {
  const { disabledPreviewSections, previewSectionOrder } = useAppSettingsSelector(
    (state) => state.composer,
  );
  const previewSet = useMemo(
    () => buildPreviewSet(previewSectionOrder, disabledPreviewSections),
    [disabledPreviewSections, previewSectionOrder],
  );

  return <MessageComposerPreviews messageComposerPreviewSet={previewSet} />;
};

/** The record button, gone while the voice recording preview is left out of the composer. */
export const ConfigurableStartRecordingAudioButton = forwardRef<
  HTMLButtonElement,
  StartRecordingAudioButtonProps
>(function ConfigurableStartRecordingAudioButton(props, ref) {
  const { disabledPreviewSections } = useAppSettingsSelector((state) => state.composer);

  if (disabledPreviewSections.includes('voiceRecording')) return null;

  return <StartRecordingAudioButton {...props} ref={ref} />;
});
