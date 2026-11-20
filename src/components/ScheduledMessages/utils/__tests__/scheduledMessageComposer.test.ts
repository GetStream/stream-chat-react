import { MessageComposer, SCHEDULED_MESSAGE_STATUS } from 'stream-chat';

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
    .spyOn(composer.scheduledMessageComposition, 'editScheduledMessage')
    .mockResolvedValue(undefined);

  return { composer, editScheduledMessage };
};

describe('openScheduledMessageInComposer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('edits a pending scheduled message', async () => {
    const { composer, editScheduledMessage } = await setup();
    const scheduledMessage = generateScheduledMessage();

    await openScheduledMessageInComposer(composer, scheduledMessage);

    expect(editScheduledMessage).toHaveBeenCalledWith(scheduledMessage);
  });

  it('schedules a failed message again', async () => {
    const { composer, editScheduledMessage } = await setup();
    const scheduledMessage = generateScheduledMessage({
      status: SCHEDULED_MESSAGE_STATUS.Failed,
    });

    await openScheduledMessageInComposer(composer, scheduledMessage);

    expect(editScheduledMessage).toHaveBeenCalledWith(scheduledMessage);
  });
});
