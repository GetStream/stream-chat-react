'use client';

import { useMemo } from 'react';

const MESSAGES = [
  'Thinking really hard',
  'Putting on my thinking cap',
  'Consulting the AI gods',
  'Brewing up an answer',
  'Crunching the numbers',
  'Reading the digital tea leaves',
  'Firing up the neurons',
  'Summoning my inner genius',
  'Connecting the dots',
  'Working my magic',
  'Channeling my inner Einstein',
  'Cooking up something good',
];

export const AIStateIndicator = () => {
  const messageIndex = useMemo(
    () => Math.floor(Math.random() * MESSAGES.length),
    [],
  );

  return (
    <div className="aicr__state-indicator">
      <div className="aicr__state-indicator__content">
        <div className="aicr__state-indicator__dots">
          <span className="aicr__state-indicator__dot" />
          <span className="aicr__state-indicator__dot" />
          <span className="aicr__state-indicator__dot" />
        </div>
        <span className="aicr__state-indicator__text">
          {MESSAGES[messageIndex]}
        </span>
      </div>
    </div>
  );
};
