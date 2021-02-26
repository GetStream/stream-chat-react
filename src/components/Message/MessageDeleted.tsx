import React, { useContext } from 'react';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';
import type { MessageDeletedProps } from 'types';
import { TranslationContext } from '../../context';
import { useUserRole } from './hooks/useUserRole';

export const MessageDeleted = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageDeletedProps<At, Ch, Co, Me, Re, Us>,
) => {
  const { message } = props;
  const { t } = useContext(TranslationContext);
  const { isMyMessage } = useUserRole(message);
  if (props.isMyMessage) {
    console.warn(
      'The isMyMessage is deprecated, and will be removed in the next major release.',
    );
  }
  const messageClasses =
    (props.isMyMessage && props.isMyMessage(message)) || isMyMessage
      ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
      : 'str-chat__message str-chat__message-simple';

  return (
    <div
      className={`${messageClasses} str-chat__message--deleted ${message.type} `}
      data-testid={'message-deleted-component'}
      key={message.id}
    >
      <div className='str-chat__message--deleted-inner'>
        {t && t('This message was deleted...')}
      </div>
    </div>
  );
};
