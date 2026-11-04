import React, { type ReactNode, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { type AIToolApprover, useAIToolApprover } from '../ToolCalls/AIToolApprover';
import { isAwaitingApproval } from './parseMessageParts';
import type { AIToolApprovalData, AIToolCallPart } from './types';

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

export type AIToolApprovalCardProps = {
  approval: AIToolApprovalData;
  /** Called with the person's answer. */
  onDecide: (allowed: boolean) => void;
  className?: string;
  state?: AIToolApprovalState;
};

/**
 * Asks the person a tool call's question, such as "Share your location?", with the agent's
 * reason and what allowing it shares, and an Allow and a Don't Allow button. Used inline under
 * a step by `AIToolApproval`, and on its own, such as on a voice call. The counterpart of
 * `AIToolApprovalCard`.
 */
export const AIToolApprovalCard = ({
  approval,
  className,
  onDecide,
  state = idle,
}: AIToolApprovalCardProps) => {
  const { t } = useTranslationContext();
  const { IconLoading } = useComponentContextIcons();
  return (
    <div
      aria-busy={state.isSending}
      className={clsx('str-chat__ai-tool-approval-card', className)}
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
  );
};

export type AIToolApprovalProps = {
  part: AIToolCallPart;
  /** Who answers on this device. Defaults to the one of the nearest `AIToolApproverProvider`. */
  approver?: AIToolApprover;
  /** Renders the question, instead of `AIToolApprovalCard`. */
  children?: (
    approval: AIToolApprovalData,
    state: AIToolApprovalState,
    decide: (allowed: boolean) => void,
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

  return (
    <>
      {children ? (
        children(part.approval, state, decide)
      ) : (
        <AIToolApprovalCard approval={part.approval} onDecide={decide} state={state} />
      )}
    </>
  );
};
