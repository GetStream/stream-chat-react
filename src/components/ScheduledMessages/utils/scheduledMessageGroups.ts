import { ScheduledMessageStatus } from 'stream-chat';
import type { ScheduledMessageResponse } from 'stream-chat';

import {
  FAILED_SCHEDULED_MESSAGE_GROUP_ID,
  ScheduledMessageGroupType,
} from '../constants';
import type { ScheduledMessageGroup } from '../types';
import { toDateInputValue } from './dateTimeInputValues';

export const isFailedScheduledMessage = ({ status }: ScheduledMessageResponse) =>
  status === ScheduledMessageStatus.Failed;

const createFailedGroup = (
  scheduledMessages: ScheduledMessageResponse[],
): ScheduledMessageGroup => ({
  id: FAILED_SCHEDULED_MESSAGE_GROUP_ID,
  scheduledMessages,
  type: ScheduledMessageGroupType.Failed,
});

const createDayGroup = (id: string, day: Date): ScheduledMessageGroup => ({
  day,
  id,
  scheduledMessages: [],
  type: ScheduledMessageGroupType.Day,
});

export const groupScheduledMessagesByDay = (
  scheduledMessages: ScheduledMessageResponse[],
) => {
  const dayGroups = new Map<string, ScheduledMessageGroup>();

  scheduledMessages.forEach((scheduledMessage) => {
    const day = new Date(scheduledMessage.scheduled_at);
    const dayId = toDateInputValue(day);

    const dayGroup = dayGroups.get(dayId) ?? createDayGroup(dayId, day);

    dayGroup.scheduledMessages.push(scheduledMessage);
    dayGroups.set(dayId, dayGroup);
  });

  const groupsByDay = Array.from(dayGroups.values());

  return groupsByDay;
};

export const groupScheduledMessages = (scheduledMessages: ScheduledMessageResponse[]) => {
  const failedMessages = scheduledMessages.filter(isFailedScheduledMessage);
  const upcomingMessages = scheduledMessages.filter(
    (scheduledMessage) => !isFailedScheduledMessage(scheduledMessage),
  );

  const failedGroups = failedMessages.length ? [createFailedGroup(failedMessages)] : [];
  const dayGroups = groupScheduledMessagesByDay(upcomingMessages);

  const groups = [...failedGroups, ...dayGroups];

  return groups;
};
