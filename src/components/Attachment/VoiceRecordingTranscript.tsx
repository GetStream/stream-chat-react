import React from 'react';
import type { Attachment } from 'stream-chat';

import { useTranslationContext } from '../../context';

const rootClassName = 'str-chat__message-attachment__voice-recording-transcript';

export type VoiceRecordingTranscriptProps = {
  attachment: Attachment;
};

export const VoiceRecordingTranscript = ({
  attachment,
}: VoiceRecordingTranscriptProps) => {
  const { t } = useTranslationContext();

  const { voice_transcript: { text } = {} } = attachment;

  if (!text) return null;

  return (
    <div className={rootClassName} data-testid='voice-recording-transcript'>
      <div className={`${rootClassName}__title`}>
        {t('attachment.voiceRecording.transcript.title', 'Transcript')}
      </div>
      <p className={`${rootClassName}__text`}>{text}</p>
    </div>
  );
};
