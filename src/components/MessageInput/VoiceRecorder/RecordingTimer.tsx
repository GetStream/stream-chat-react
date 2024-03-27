import clsx from 'clsx';
import { displayDuration } from '../../Attachment';
import React from 'react';

export type RecordingTimerProps = {
  durationSeconds: number;
};

export const RecordingTimer = ({ durationSeconds }: RecordingTimerProps) => (
  <div
    className={clsx('str-chat__audio_recorder__timer', {
      'str-chat__audio_recorder__timer--hours': durationSeconds >= 3600,
    })}
  >
    {displayDuration(durationSeconds)}
  </div>
);
