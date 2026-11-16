import React, { type ReactNode } from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { AIReasoning } from '../Reasoning/AIReasoning';
import type { AIToolApprover } from '../ToolCalls/AIToolApprover';
import { AIToolApproval } from './AIToolApproval';
import { AIToolAuthorization } from './AIToolAuthorization';
import { AIToolCall } from './AIToolCall';
import type { AIMessagePartData } from './types';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

export type AIMessagePartProps = {
  part: AIMessagePartData;
  /**
   * Who answers tool calls' questions and sign-ins on this device, to ask them. Defaults to the
   * one of the nearest `AIToolApproverProvider`.
   */
  approver?: AIToolApprover;
  /** The whole of a reasoning step's thinking, when the app has it. */
  reasoningText?: (stepId: string) => string | undefined;
};

/**
 * One step of a reply: a round of reasoning (`AIReasoning`), a tool call (`AIToolCall`, with
 * its question or sign-in when it waits for this person here), or a neutral line for a step
 * this SDK can't show. The counterpart of `AIMessagePartView`.
 */
export const AIMessagePart = ({ approver, part, reasoningText }: AIMessagePartProps) => {
  const { t } = useTranslationContext();
  const { IconInfo } = useComponentContextIcons();

  if (part.reasoning) {
    return <AIReasoning part={part.reasoning} reasoningText={reasoningText} />;
  }
  if (part.toolCall) {
    return (
      <div className='str-chat__ai-message-part__tool'>
        <AIToolCall part={part.toolCall} />
        <AIToolApproval approver={approver} part={part.toolCall} />
        <AIToolAuthorization approver={approver} part={part.toolCall} />
      </div>
    );
  }
  return (
    <div className='str-chat__ai-message-part--unsupported'>
      <IconInfo />
      <span>{t("A step this app version can't show")}</span>
    </div>
  );
};

export type AIMessagePartsProps = Omit<AIMessagePartProps, 'part'> & {
  parts: AIMessagePartData[];
  /** Renders a step, instead of `AIMessagePart`. */
  children?: (part: AIMessagePartData) => ReactNode;
  className?: string;
};

/** The steps of a reply, in order. The counterpart of `AIMessagePartsView`. */
export const AIMessageParts = ({
  approver,
  children,
  className,
  parts,
  reasoningText,
}: AIMessagePartsProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  return (
    <ThemeScopeProvider>
      <div className={clsx(themeScopeClassName, 'str-chat__ai-message-parts', className)}>
        {parts.map((part) => (
          <div className='str-chat__ai-message-part' data-kind={part.kind} key={part.id}>
            {children ? (
              children(part)
            ) : (
              <AIMessagePart
                approver={approver}
                part={part}
                reasoningText={reasoningText}
              />
            )}
          </div>
        ))}
      </div>
    </ThemeScopeProvider>
  );
};
