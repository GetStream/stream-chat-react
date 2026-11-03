import type { ChangeEventHandler, ReactNode } from 'react';
import type { LocalAttachment, ScheduledMessageResponse } from 'stream-chat';

import type { ScheduleMessageNoticeSeverity, ScheduleTimeError } from './constants';

export type UseScheduledMessagesParams = {
  cid?: string;
  parentId?: string;
};

export type ScheduledMessagesSnapshot = {
  isDisabled: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  scheduledMessages: ScheduledMessageResponse[];
};

export type UseScheduledMessageCountParams = {
  cid: string;
  parentId?: string;
};

export type ScheduleTimeBounds = {
  earliest: Date;
  latest: Date;
};

export type ScheduledMessagePreviewSource = {
  attachments: LocalAttachment[];
  id: string;
  text: string;
};

export type ScheduleTimeForm = {
  bounds: ScheduleTimeBounds;
  dateValue: string;
  onDateChange: ChangeEventHandler<HTMLInputElement>;
  onTimeChange: ChangeEventHandler<HTMLInputElement>;
  timeValue: string;
  scheduledAt?: Date;
  timeError?: ScheduleTimeError;
};

export type ScheduleMessageSubmit = {
  hasFailed: boolean;
  isScheduling: boolean;
  submit: (scheduledAt: Date) => Promise<void>;
};

export type ScheduleMessageDialogState = {
  closeDialog: () => void;
  isDialogOpen: boolean;
  openDialog: () => void;
};

export type ScheduleMessageMenuProps = {
  onCustomTimeSelect: () => void;
  onPresetSelect: (scheduledAt: Date) => void;
  presets: Date[];
};

export type ScheduleMessagePresetButtonProps = {
  onSelect: (scheduledAt: Date) => void;
  scheduledAt: Date;
};

export type ScheduleMessageDialogProps = {
  close: () => void;
};

export type ScheduleMessageDialogNoticeProps = {
  children: ReactNode;
  severity: ScheduleMessageNoticeSeverity;
};
