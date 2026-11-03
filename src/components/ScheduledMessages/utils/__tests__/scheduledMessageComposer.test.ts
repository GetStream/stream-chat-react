import { MessageComposer, ScheduledMessageStatus } from 'stream-chat';

import { openScheduledMessageInComposer } from '../scheduledMessageComposer';
import {
  generateScheduledMessage,
  getTestClientWithUser,
} from '../../../../mock-builders';

const setup = async () => {
  const client = await getTestClientWithUser({ id: 'user-id' });
  const channel = client.channel('messaging', 'general');
  const composer = new MessageComposer({ client, compositionContext: channel });
  const editScheduledMessage = vi
    .spyOn(composer, 'editScheduledMessage')
    .mockResolvedValue(undefined);
  const rescheduleFailedMessage = vi
    .spyOn(composer, 'rescheduleFailedMessage')
    .mockResolvedValue(undefined);

  return { composer, editScheduledMessage, rescheduleFailedMessage };
};

describe('openScheduledMessageInComposer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('edits a pending scheduled message', async () => {
    const { composer, editScheduledMessage, rescheduleFailedMessage } = await setup();
    const scheduledMessage = generateScheduledMessage();

    await openScheduledMessageInComposer(composer, scheduledMessage);

    expect(editScheduledMessage).toHaveBeenCalledWith(scheduledMessage);
    expect(rescheduleFailedMessage).not.toHaveBeenCalled();
  });

  it('schedules a failed message again', async () => {
    const { composer, editScheduledMessage, rescheduleFailedMessage } = await setup();
    const scheduledMessage = generateScheduledMessage({
      status: ScheduledMessageStatus.Failed,
    });

    await openScheduledMessageInComposer(composer, scheduledMessage);

    expect(rescheduleFailedMessage).toHaveBeenCalledWith(scheduledMessage);
    expect(editScheduledMessage).not.toHaveBeenCalled();
  });
});
