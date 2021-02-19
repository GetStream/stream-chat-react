import React from 'react';

import { LoadingChannels } from '../Loading/LoadingChannels';

import placeholder from '../../assets/str-chat__connection-error.svg';
import { useTranslationContext } from '../../context/TranslationContext';

export type ChatDownProps = {
  /** The type of error */
  type: string;
  /** The image url for this error */
  image?: string;
  /** The error message to show */
  text?: string;
};

const UnMemoizedChatDown: React.FC<ChatDownProps> = (props) => {
  const { image, text, type = 'Error' } = props;

  const { t } = useTranslationContext();

  return (
    <div className='str-chat__down'>
      <LoadingChannels />
      <div className='str-chat__down-main'>
        <img data-testid='chatdown-img' src={image || placeholder} />
        <h1>{type}</h1>
        <h3>
          {text ||
            t('Error connecting to chat, refresh the page to try again.')}
        </h3>
      </div>
    </div>
  );
};

/**
 * ChatDown - Indicator that chat is down or your network isn't working
 * @example ./ChatDown.md
 */
export const ChatDown = React.memo(
  UnMemoizedChatDown,
) as typeof UnMemoizedChatDown;
