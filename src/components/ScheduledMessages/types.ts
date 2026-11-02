import type { ChangeEventHandler, ReactNode } from 'react';
import type {
  Attachment,
  Channel,
  LocalMessageBase,
  ScheduledMessageResponse,
} from 'stream-chat';

import type { IconComponent } from '../Icons';

import type {
  ScheduledMessageAction,
  ScheduledMessageGroupType,
  ScheduleMessageNoticeSeverity,
  ScheduleTimeError,
} from './constants';

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
  attachments: Attachment[];
  id: string;
  text: string;
};

export type ScheduledMessageGroup = {
  id: string;
  scheduledMessages: ScheduledMessageResponse[];
  type: ScheduledMessageGroupType;
  day?: Date;
};

export type UseScheduledMessageGroupsParams = UseScheduledMessagesParams & {
  searchQuery?: string;
};

export type ScheduledMessageGroups = {
  groups: ScheduledMessageGroup[];
  hasScheduledMessages: boolean;
  isLoaded: boolean;
};

export type ScheduledMessagesLoadState = {
  hasLoadFailed: boolean;
  isFirstLoad: boolean;
  reload: () => void;
};

export type ScheduledMessagesPagination = {
  canLoadMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
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

export type ScheduleTimeFormParams = {
  channel: Channel;
  initialScheduledAt?: Date;
};

export type SubmitScheduledAt = (scheduledAt: Date) => Promise<unknown>;

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

export type ScheduleTimeDialogProps = {
  channel: Channel;
  close: () => void;
  errorMessage: string;
  previewMessage: LocalMessageBase;
  submit: SubmitScheduledAt;
  title: string;
  initialScheduledAt?: Date;
};

export type RescheduleMessageDialogProps = {
  close: () => void;
  scheduledMessage: ScheduledMessageResponse;
};

export type DeleteScheduledMessageAlertProps = {
  onCancel: () => void;
  onDelete: () => void;
};

export type ScheduleMessageDialogNoticeProps = {
  children: ReactNode;
  severity: ScheduleMessageNoticeSeverity;
};

export type EditScheduledMessage = (scheduledMessage: ScheduledMessageResponse) => void;

export type ScheduledMessageListProps = {
  cid: string;
  onEdit?: EditScheduledMessage;
  parentId?: string;
  searchQuery?: string;
};

export type ScheduledMessagesEmptyStateProps = {
  Icon: IconComponent;
  title: string;
  children?: ReactNode;
  description?: string;
};

export type ScheduledMessagesLoadErrorProps = {
  onRetry: () => void;
};

export type ScheduledMessageListDialogProps = ScheduledMessageListProps & {
  close: () => void;
};

export type ScheduledMessageGroupHeaderProps = {
  group: ScheduledMessageGroup;
};

export type ScheduledMessageItemProps = {
  scheduledMessage: ScheduledMessageResponse;
  onEdit?: EditScheduledMessage;
};

export type ScheduledMessageActionsProps = ScheduledMessageItemProps;

export type ScheduledMessageActionsOptions = {
  canEdit: boolean;
};

export type ScheduledMessageActionsMenuProps = {
  actions: ScheduledMessageAction[];
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onReschedule: () => void;
  onSendNow: () => void;
};

export type ScheduledMessageActionHandlers = {
  copyText: () => void;
  deleteScheduledMessage: () => Promise<void>;
  isPending: boolean;
  sendNow: () => Promise<void>;
};

export type EditedScheduledMessagePreviewProps = {
  onCancel: () => void;
  scheduledMessage: ScheduledMessageResponse;
};

export type FailedScheduledMessagePreviewProps = EditedScheduledMessagePreviewProps;

export type ScheduledMessageStatusBadgeProps = {
  scheduledMessage: ScheduledMessageResponse;
};
