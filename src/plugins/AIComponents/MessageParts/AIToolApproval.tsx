import React, { type ReactNode, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { type AIToolApprover, useAIToolApprover } from '../ToolCalls/AIToolApprover';
import { isAwaitingApproval } from './parseMessageParts';
import { formatToolArguments } from './toolArguments';
import type { AIToolApprovalData, AIToolCallPart } from './types';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

/** Where the person's answer to a tool call's question is. */
export type AIToolApprovalState = {
  /** The answer couldn't be sent, and the person can answer again. */
  failed: boolean;
  /** The answer is on its way, or arrived and the call's step hasn't changed yet. */
  isSending: boolean;
};

const idle: AIToolApprovalState = { failed: false, isSending: false };

/** The agent's reason, as a sentence, then what allowing it shares. */
export const approvalLines = (approval: AIToolApprovalData) => {
  const lines: string[] = [];
  const reason = approval.reason?.trim();
  if (reason) {
    const sentence = reason[0].toUpperCase() + reason.slice(1);
    lines.push(/[.!?…]$/.test(sentence) ? sentence : `${sentence}.`);
  }
  if (approval.message) lines.push(approval.message);
  return lines;
};

// Arguments longer than this, in characters or lines, start collapsed.
const LONG_ARGUMENTS_CHARACTERS = 280;
const LONG_ARGUMENTS_LINES = 6;

// Formatted arguments, in full when short, else collapsed under "What it sends".
// Scoped on its own root, since `AIToolArguments` also renders it outside an approval card.
const ToolArgumentsText = ({ className, text }: { text: string; className?: string }) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const isLong =
    text.length > LONG_ARGUMENTS_CHARACTERS ||
    text.split('\n').length > LONG_ARGUMENTS_LINES;
  const code = <pre className='str-chat__ai-tool-arguments__code'>{text}</pre>;
  return isLong ? (
    <details
      className={clsx(themeScopeClassName, 'str-chat__ai-tool-arguments', className)}
    >
      <summary className='str-chat__ai-tool-arguments__label'>
        {t('aiComponents.toolApproval.arguments.label', 'What it sends')}
      </summary>
      {code}
    </details>
  ) : (
    <div
      aria-label={t('aiComponents.toolApproval.arguments.ariaLabel', 'What it sends')}
      className={clsx(themeScopeClassName, 'str-chat__ai-tool-arguments', className)}
      role='group'
    >
      {code}
    </div>
  );
};

export type AIToolArgumentsProps = {
  /** The call's arguments, as the agent sent them. */
  args: unknown;
  className?: string;
};

/**
 * What a tool call will send, as JSON: in full when short, else collapsed under "What it sends",
 * which the person opens to read it. Renders nothing for a call with no arguments. The default
 * of `AIToolApprover.argumentsPreview`.
 */
export const AIToolArguments = ({ args, className }: AIToolArgumentsProps) => {
  const text = formatToolArguments(args);
  return text === undefined ? null : (
    <ToolArgumentsText className={className} text={text} />
  );
};

// What an approval card shows of a call's arguments: the approver's `argumentsPreview`, else
// the arguments as `AIToolArguments` shows them, formatted once. `null` when it shows nothing.
const toolArgumentsPreview = (
  call: AIToolCallPart,
  approver?: AIToolApprover,
): ReactNode => {
  const own = approver?.argumentsPreview?.(call);
  if (own !== undefined) return own;
  const text = formatToolArguments(call.arguments);
  return text === undefined ? null : <ToolArgumentsText text={text} />;
};

export type AIToolApprovalCardProps = {
  approval: AIToolApprovalData;
  /** Called with the person's answer. */
  onDecide: (allowed: boolean) => void;
  /**
   * What the call will send, under the question, such as `<AIToolArguments args={…} />`.
   * `AIToolApproval` passes the approver's `argumentsPreview`, else the call's arguments.
   */
  argumentsPreview?: ReactNode;
  className?: string;
  state?: AIToolApprovalState;
};

/**
 * Asks the person a tool call's question, such as "Share your location?", with the agent's
 * reason, what allowing it shares and what the call will send (`argumentsPreview`), and an
 * Allow and a Don't Allow button. Used inline under a step by `AIToolApproval`, and on its own,
 * such as on a voice call. The counterpart of `AIToolApprovalCard`.
 */
export const AIToolApprovalCard = ({
  approval,
  argumentsPreview,
  className,
  onDecide,
  state = idle,
}: AIToolApprovalCardProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const { IconLoading } = useComponentContextIcons();
  return (
    <ThemeScopeProvider>
      <div
        aria-busy={state.isSending}
        className={clsx(
          themeScopeClassName,
          'str-chat__ai-tool-approval-card',
          className,
        )}
        role='group'
      >
        <div className='str-chat__ai-tool-approval-card__text'>
          <div className='str-chat__ai-tool-approval-card__title'>{approval.title}</div>
          {approvalLines(approval).map((line) => (
            <div className='str-chat__ai-tool-approval-card__message' key={line}>
              {line}
            </div>
          ))}
        </div>
        {argumentsPreview !== undefined && argumentsPreview !== null && (
          <div className='str-chat__ai-tool-approval-card__arguments'>
            {argumentsPreview}
          </div>
        )}
        <div className='str-chat__ai-tool-approval-card__actions'>
          <button
            className='str-chat__ai-button str-chat__ai-button--primary'
            disabled={state.isSending}
            onClick={() => onDecide(true)}
            type='button'
          >
            {approval.allowTitle ?? t('aiComponents.toolApproval.allow.label', 'Allow')}
          </button>
          <button
            className='str-chat__ai-button str-chat__ai-button--secondary'
            disabled={state.isSending}
            onClick={() => onDecide(false)}
            type='button'
          >
            {approval.declineTitle ??
              t('aiComponents.toolApproval.dontAllow.label', "Don't Allow")}
          </button>
          {state.isSending && (
            <span className='str-chat__ai-spinner'>
              <IconLoading />
            </span>
          )}
        </div>
        {state.failed && (
          <div className='str-chat__ai-tool-approval-card__failure' role='alert'>
            {t(
              'aiComponents.toolApproval.answerNotSent.text',
              "Your answer couldn't be sent. Try again.",
            )}
          </div>
        )}
      </div>
    </ThemeScopeProvider>
  );
};

export type AIToolApprovalProps = {
  part: AIToolCallPart;
  /** Who answers on this device. Defaults to the one of the nearest `AIToolApproverProvider`. */
  approver?: AIToolApprover;
  /**
   * Renders the question, instead of `AIToolApprovalCard`. `argumentsPreview` is what the card
   * would show of the call's arguments (see `AIToolApprover.argumentsPreview`), or `null`.
   */
  children?: (
    approval: AIToolApprovalData,
    state: AIToolApprovalState,
    decide: (allowed: boolean) => void,
    argumentsPreview: ReactNode,
  ) => ReactNode;
};

/**
 * Asks the question of a tool call that waits for this person on this device, and sends their
 * answer with `approver.decide`. Until the call's step changes the buttons wait; a failed send
 * lets them answer again. Renders nothing for a call that does not wait for them here. The
 * counterpart of `AIToolApprovalView`.
 */
export const AIToolApproval = ({
  approver: approverProp,
  children,
  part,
}: AIToolApprovalProps) => {
  const approver = useAIToolApprover(approverProp);
  const [state, setState] = useState<AIToolApprovalState>(idle);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  if (
    !approver ||
    !part.approval ||
    !isAwaitingApproval(part, approver.userId, approver.clientId)
  ) {
    return null;
  }

  const decide = (allowed: boolean) => {
    if (state.isSending) return;
    setState({ failed: false, isSending: true });
    approver.decide(part, allowed).catch(() => {
      if (mounted.current) setState({ failed: true, isSending: false });
    });
  };

  const argumentsPreview = toolArgumentsPreview(part, approver);

  return (
    <>
      {children ? (
        children(part.approval, state, decide, argumentsPreview)
      ) : (
        <AIToolApprovalCard
          approval={part.approval}
          argumentsPreview={argumentsPreview}
          onDecide={decide}
          state={state}
        />
      )}
    </>
  );
};
