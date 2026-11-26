import { useEffect, useState } from 'react';
import type {
  MessageComposer,
  ScheduledMessagePaginatorsManagerState,
} from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useMessageComposerController } from '../../MessageComposer/hooks/useMessageComposerController';

const selectIsDisabled = ({ isDisabled }: ScheduledMessagePaginatorsManagerState) => ({
  isDisabled,
});

const readComposerCanSchedule = (messageComposer: MessageComposer) =>
  !messageComposer.hasEditInProgress && !messageComposer.scheduleBlockReason;

export const useCanScheduleMessage = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();

  const { isDisabled } = useStateStore(
    client.scheduledMessagePaginators.state,
    selectIsDisabled,
  );

  const [composerCanSchedule, setComposerCanSchedule] = useState(() =>
    readComposerCanSchedule(messageComposer),
  );

  useEffect(() => {
    const { channel, locationComposer, textComposer } = messageComposer;
    const update = () => setComposerCanSchedule(readComposerCanSchedule(messageComposer));
    const unsubscribes = [
      messageComposer.state,
      textComposer.state,
      locationComposer.state,
      channel.state,
      channel.configState,
    ].map((store) => store.subscribe(update));
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [messageComposer]);

  const canSchedule = !isDisabled && composerCanSchedule;
  return canSchedule;
};
