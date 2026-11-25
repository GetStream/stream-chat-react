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

const useComposerCanSchedule = (messageComposer: MessageComposer) => {
  const [canSchedule, setCanSchedule] = useState(() =>
    readComposerCanSchedule(messageComposer),
  );

  useEffect(() => {
    const { channel, textComposer } = messageComposer;
    const update = () => setCanSchedule(readComposerCanSchedule(messageComposer));
    const unsubscribes = [
      messageComposer.state,
      textComposer.state,
      channel.state,
      channel.configState,
    ].map((store) => store.subscribe(update));
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [messageComposer]);

  return canSchedule;
};

export const useCanScheduleMessage = () => {
  const { client } = useChatContext();
  const messageComposer = useMessageComposerController();

  const { isDisabled } = useStateStore(
    client.scheduledMessagePaginators.state,
    selectIsDisabled,
  );
  const composerCanSchedule = useComposerCanSchedule(messageComposer);

  const canSchedule = !isDisabled && composerCanSchedule;
  return canSchedule;
};
