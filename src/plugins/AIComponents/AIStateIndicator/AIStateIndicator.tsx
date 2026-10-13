import { useMemo } from 'react';
import { useTranslationContext } from '../../../context/TranslationContext';

export const AIStateIndicator = ({ text }: { text?: string }) => {
  const { t } = useTranslationContext();
  const messages = useMemo(
    () => [
      t('aiComponents.stateIndicator.thinkingReallyHard.text', 'Thinking really hard'),
      t(
        'aiComponents.stateIndicator.puttingOnMyThinkingCap.text',
        'Putting on my thinking cap',
      ),
      t('aiComponents.stateIndicator.consultingTheAiGods.text', 'Consulting the AI gods'),
      t('aiComponents.stateIndicator.brewingUpAnAnswer.text', 'Brewing up an answer'),
      t('aiComponents.stateIndicator.crunchingTheNumbers.text', 'Crunching the numbers'),
      t(
        'aiComponents.stateIndicator.readingTheDigitalTeaLeaves.text',
        'Reading the digital tea leaves',
      ),
      t('aiComponents.stateIndicator.firingUpTheNeurons.text', 'Firing up the neurons'),
      t(
        'aiComponents.stateIndicator.summoningMyInnerGenius.text',
        'Summoning my inner genius',
      ),
      t('aiComponents.stateIndicator.connectingTheDots.text', 'Connecting the dots'),
      t('aiComponents.stateIndicator.workingMyMagic.text', 'Working my magic'),
      t(
        'aiComponents.stateIndicator.channelingMyInnerEinstein.text',
        'Channeling my inner Einstein',
      ),
      t(
        'aiComponents.stateIndicator.cookingUpSomethingGood.text',
        'Cooking up something good',
      ),
    ],
    [t],
  );
  const messageIndex = useMemo(
    () => Math.floor(Math.random() * messages.length),
    [messages.length],
  );

  return (
    <div aria-live='polite' className='str-chat__ai-state-indicator' role='status'>
      <div className='str-chat__ai-state-indicator__content'>
        <div className='str-chat__ai-state-indicator__dots'>
          <span className='str-chat__ai-state-indicator__dot' />
          <span className='str-chat__ai-state-indicator__dot' />
          <span className='str-chat__ai-state-indicator__dot' />
        </div>
        <span className='str-chat__ai-state-indicator__text'>
          {typeof text === 'string' ? text : messages[messageIndex]}
        </span>
      </div>
    </div>
  );
};
