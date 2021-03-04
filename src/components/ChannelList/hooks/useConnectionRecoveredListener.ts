import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../../types/types';

export const useConnectionRecoveredListener = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  forceUpdate?: () => void,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = () => {
      if (forceUpdate) {
        forceUpdate();
      }
    };

    client.on('connection.recovered', handleEvent);

    return () => {
      client.off('connection.recovered', handleEvent);
    };
  }, []);
};
