import React from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { IconAIDevice, IconAIHandRaised, IconAIKey } from '../icons';
import { formatCallDuration } from '../utils';
import { isDeclined, isToolCallFinished } from './parseMessageParts';
import type { AIToolCallPart } from './types';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

export type AIToolCallProps = {
  part: AIToolCallPart;
  className?: string;
};

/**
 * One tool call of a reply: what it is doing (its `displayTitle`, else its name), how it is
 * going, and how long it took once it is done. The counterpart of `AIToolCallView`.
 */
export const AIToolCall = ({ className, part }: AIToolCallProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t, userLanguage } = useTranslationContext();
  const { IconCheckmark, IconExclamationCircleFill, IconLoading, IconMinusCircle } =
    useComponentContextIcons();

  const title = part.displayTitle ?? part.name.replace(/_/g, ' ');
  const detail = (() => {
    if (isDeclined(part))
      return part.summary ?? t('aiComponents.toolCall.declined.text', 'Declined');
    switch (part.status) {
      case 'awaiting_approval':
        return (
          part.summary ??
          t('aiComponents.toolCall.waitingForApproval.text', 'Waiting for approval')
        );
      case 'awaiting_authorization':
        return (
          part.summary ??
          t('aiComponents.toolCall.waitingForSignIn.text', 'Waiting for you to sign in')
        );
      case 'awaiting_client':
        return (
          part.summary ??
          t('aiComponents.toolCall.waitingForDevice.text', 'Waiting for the device')
        );
      case 'failed':
        return (
          part.summary ?? t('aiComponents.toolCall.didntComplete.text', "Didn't complete")
        );
      case 'cancelled':
        return part.summary ?? t('aiComponents.toolCall.cancelled.text', 'Cancelled');
      default:
        return part.summary;
    }
  })();

  // A status this SDK doesn't know reads as still in progress.
  const icon = (() => {
    switch (part.status) {
      case 'awaiting_approval':
        return <IconAIHandRaised />;
      case 'awaiting_authorization':
        return <IconAIKey />;
      case 'awaiting_client':
        return <IconAIDevice />;
      case 'completed':
        return <IconCheckmark />;
      case 'failed':
        return <IconExclamationCircleFill />;
      case 'cancelled':
        return <IconMinusCircle />;
      default:
        return <IconLoading />;
    }
  })();

  const finished = isToolCallFinished(part.status);
  const waiting = part.status.startsWith('awaiting_');

  return (
    <ThemeScopeProvider>
      <div
        className={clsx(
          themeScopeClassName,
          'str-chat__ai-tool-call',
          `str-chat__ai-tool-call--${finished || waiting ? part.status : 'running'}`,
          className,
        )}
        data-status={part.status}
      >
        <span
          className={clsx(
            'str-chat__ai-tool-call__icon',
            waiting && 'str-chat__ai-shimmer',
            !finished && !waiting && 'str-chat__ai-tool-call__icon--spinning',
          )}
        >
          {icon}
        </span>
        <span className='str-chat__ai-tool-call__text'>
          <span className={clsx('str-chat__ai-tool-call__title')}>{title}</span>
          {detail && <span className='str-chat__ai-tool-call__detail'>{detail}</span>}
        </span>
        {finished && part.durationMs !== undefined && (
          <span className='str-chat__ai-tool-call__duration'>
            {formatCallDuration(part.durationMs / 1000, userLanguage)}
          </span>
        )}
      </div>
    </ThemeScopeProvider>
  );
};
