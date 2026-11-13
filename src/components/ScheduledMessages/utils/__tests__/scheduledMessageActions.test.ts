import { SCHEDULED_MESSAGE_FAILURE_REASON, SCHEDULED_MESSAGE_STATUS } from 'stream-chat';

import { ScheduledMessageAction } from '../../constants';
import { getScheduledMessageActions } from '../scheduledMessageActions';
import { generateScheduledMessage } from '../../../../mock-builders';

const { Copy, Delete, Edit, Reschedule, SendNow } = ScheduledMessageAction;

describe('getScheduledMessageActions', () => {
  it('offers every action for a scheduled message', () => {
    const scheduledMessage = generateScheduledMessage();

    expect(getScheduledMessageActions(scheduledMessage, { canEdit: true })).toEqual([
      Edit,
      Reschedule,
      SendNow,
      Delete,
    ]);
  });

  it('leaves out Edit when the host cannot edit', () => {
    const scheduledMessage = generateScheduledMessage();

    expect(getScheduledMessageActions(scheduledMessage, { canEdit: false })).toEqual([
      Reschedule,
      SendNow,
      Delete,
    ]);
  });

  it('offers nothing while the message is being sent', () => {
    const scheduledMessage = generateScheduledMessage({
      status: SCHEDULED_MESSAGE_STATUS.Sending,
    });

    expect(getScheduledMessageActions(scheduledMessage, { canEdit: true })).toEqual([]);
  });

  it('offers Edit and Delete for a failed message', () => {
    const scheduledMessage = generateScheduledMessage({
      failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelFrozen,
      status: SCHEDULED_MESSAGE_STATUS.Failed,
    });

    expect(getScheduledMessageActions(scheduledMessage, { canEdit: true })).toEqual([
      Edit,
      Delete,
    ]);
    expect(getScheduledMessageActions(scheduledMessage, { canEdit: false })).toEqual([
      Delete,
    ]);
  });

  it('offers Copy and Delete when the channel was deleted', () => {
    const scheduledMessage = generateScheduledMessage({
      failure_reason: SCHEDULED_MESSAGE_FAILURE_REASON.ChannelDeleted,
      status: SCHEDULED_MESSAGE_STATUS.Failed,
    });

    expect(getScheduledMessageActions(scheduledMessage, { canEdit: true })).toEqual([
      Copy,
      Delete,
    ]);
  });
});
