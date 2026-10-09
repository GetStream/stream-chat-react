'use client';

import './EmptyState.scss';

export const EmptyState = () => (
  <div className='ai-demo-empty-state'>
    <div className='ai-demo-empty-state__content'>
      <h1 className='ai-demo-empty-state__title'>Start a conversation</h1>
      <p className='ai-demo-empty-state__subtitle'>
        Ask me anything, and I&apos;ll do my best to help.
      </p>
    </div>
  </div>
);
