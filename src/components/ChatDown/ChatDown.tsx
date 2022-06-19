import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { ConnectionErrorIcon } from './icons';

export type ChatDownProps = {
  /** The image url for this error or ReactElement representing the image */
  image?: string | React.ReactElement;
  /** The error message to show */
  text?: string;
  /** The type of error */
  type?: string;
};

const UnMemoizedChatDown = ({
  image = <ConnectionErrorIcon />,
  text,
  type = 'Error',
}: ChatDownProps) => {
  const { t } = useTranslationContext('ChatDown');

  return (
    <div className='str-chat__down'>
      <div className='str-chat__down-main'>
        {typeof image === 'string' ? (
          <img alt='Connection error' data-testid='chatdown-img' src={image} />
        ) : (
          image
        )}
        <h1>{type}</h1>
        <h3 aria-live='assertive'>
          {text || t<string>('Error connecting to chat, refresh the page to try again.')}
        </h3>
      </div>
    </div>
  );
};

/**
 * A simple indicator that chat functionality isn't available, triggered when the Chat API is unavailable or your network isn't working.
 */
export const ChatDown = React.memo(UnMemoizedChatDown) as typeof UnMemoizedChatDown;
