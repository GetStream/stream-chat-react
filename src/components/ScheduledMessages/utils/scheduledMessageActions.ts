import { ScheduledMessageFailureReason, ScheduledMessageStatus } from 'stream-chat';
import type { ScheduledMessageResponse } from 'stream-chat';

import { ScheduledMessageAction } from '../constants';
import type { ScheduledMessageActionsOptions } from '../types';

const PENDING_ACTIONS: ScheduledMessageAction[] = [
  ScheduledMessageAction.Edit,
  ScheduledMessageAction.Reschedule,
  ScheduledMessageAction.SendNow,
  ScheduledMessageAction.Delete,
];

const CHANNEL_DELETED_ACTIONS: ScheduledMessageAction[] = [
  ScheduledMessageAction.Copy,
  ScheduledMessageAction.Delete,
];

const FAILED_ACTIONS: ScheduledMessageAction[] = [
  ScheduledMessageAction.Edit,
  ScheduledMessageAction.Delete,
];

const NO_ACTIONS: ScheduledMessageAction[] = [];

const getActionsForStatus = ({ failure_reason, status }: ScheduledMessageResponse) => {
  if (status === ScheduledMessageStatus.Sending) return NO_ACTIONS;

  if (status !== ScheduledMessageStatus.Failed) return PENDING_ACTIONS;

  return failure_reason === ScheduledMessageFailureReason.ChannelDeleted
    ? CHANNEL_DELETED_ACTIONS
    : FAILED_ACTIONS;
};

export const getScheduledMessageActions = (
  scheduledMessage: ScheduledMessageResponse,
  { canEdit }: ScheduledMessageActionsOptions,
) => {
  const actions = getActionsForStatus(scheduledMessage).filter(
    (action) => canEdit || action !== ScheduledMessageAction.Edit,
  );

  return actions;
};
