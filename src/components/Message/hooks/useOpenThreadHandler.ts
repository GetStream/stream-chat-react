import { useChannelActionContext } from '../../../context/ChannelActionContext';

import type { ReactEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useOpenThreadHandler = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  customOpenThread?: (
    message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
    event: React.BaseSyntheticEvent,
  ) => void,
): ReactEventHandler => {
  const { openThread: channelOpenThread } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>(
    'useOpenThreadHandler',
  );

  const openThread = customOpenThread || channelOpenThread;

  return (event) => {
    if (!openThread || !message) {
      console.warn('Open thread handler was called but it is missing one of its parameters');
      return;
    }

    openThread(message, event);
  };
};
