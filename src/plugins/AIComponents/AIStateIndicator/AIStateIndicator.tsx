import { useMemo } from 'react';
import { useTranslationContext } from '../../../context/TranslationContext';

export const AIStateIndicator = ({ text }: { text?: string }) => {
  const { t } = useTranslationContext();
  const messages = useMemo(
    () => [
      t('Thinking really hard'),
      t('Putting on my thinking cap'),
      t('Consulting the AI gods'),
      t('Brewing up an answer'),
      t('Crunching the numbers'),
      t('Reading the digital tea leaves'),
      t('Firing up the neurons'),
      t('Summoning my inner genius'),
      t('Connecting the dots'),
      t('Working my magic'),
      t('Channeling my inner Einstein'),
      t('Cooking up something good'),
    ],
    [t],
  );
  const messageIndex = useMemo(
    () => Math.floor(Math.random() * messages.length),
    [messages.length],
  );

  return (
    <div className='aicr__state-indicator'>
      <div className='aicr__state-indicator__content'>
        <div className='aicr__state-indicator__dots'>
          <span className='aicr__state-indicator__dot' />
          <span className='aicr__state-indicator__dot' />
          <span className='aicr__state-indicator__dot' />
        </div>
        <span className='aicr__state-indicator__text'>
          {typeof text === 'string' ? text : messages[messageIndex]}
        </span>
      </div>
    </div>
  );
};
