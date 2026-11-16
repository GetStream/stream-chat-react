import React, { type ReactNode, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { useTranslationContext } from '../../../context/TranslationContext';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import {
  type AIToolApprover,
  type AIToolAuthorizer,
  useAIToolApprover,
} from '../ToolCalls/AIToolApprover';
import { AIConnectorSignInError } from '../ToolCalls/popupAuthorizer';
import { useNow } from '../utils';
import { isAuthorizationExpired, isAwaitingAuthorization } from './parseMessageParts';
import type { AIToolAuthorizationData, AIToolCallPart } from './types';
import { ThemeScopeProvider, useAIThemeScopeClassName } from '../themeScope';

/** Where the person's answer to a sign-in is. */
export type AIToolAuthorizationState = {
  /** The sign-in couldn't be opened, and the person can try again. */
  connectFailed: boolean;
  /** Their "not now" couldn't be sent, and the person can answer again. */
  declineFailed: boolean;
  /** The sign-in is open, or done and the call's step hasn't changed yet. */
  isConnecting: boolean;
  /** Their "not now" is on its way, or arrived and the call's step hasn't changed yet. */
  isDeclining: boolean;
  /** The browser blocked the sign-in's popup. */
  popupBlocked?: boolean;
};

const idle: AIToolAuthorizationState = {
  connectFailed: false,
  declineFailed: false,
  isConnecting: false,
  isDeclining: false,
};

export type AIToolAuthorizationCardProps = {
  authorization: AIToolAuthorizationData;
  onConnect: () => void;
  onDecline: () => void;
  className?: string;
  state?: AIToolAuthorizationState;
};

/**
 * Asks the person to sign in at a provider a tool call needs, such as "Connect Linear", with a
 * Connect and a Not now button. Once the sign-in is over it says how it ended (connected,
 * declined, expired or failed), and a sign-in past its expiry can no longer be opened. The
 * counterpart of `AIToolAuthorizationCard`.
 */
export const AIToolAuthorizationCard = ({
  authorization,
  className,
  onConnect,
  onDecline,
  state = idle,
}: AIToolAuthorizationCardProps) => {
  const themeScopeClassName = useAIThemeScopeClassName();
  const { t } = useTranslationContext();
  const { IconLoading } = useComponentContextIcons();
  const open = authorization.status === undefined;
  // Re-checked every few seconds while it is open, so it turns expired on its own.
  const now = useNow(open && authorization.expiresAt !== undefined, 5000);
  const expired = isAuthorizationExpired(authorization, now);
  const provider = authorization.providerName ?? authorization.provider;
  const busy = state.isConnecting || state.isDeclining;

  const outcome = (() => {
    if (expired) return t('This sign-in has expired.');
    switch (authorization.status) {
      case undefined:
        return undefined;
      case 'connected':
        return t('Connected to {{ provider }}', { provider });
      case 'declined':
        return t('Not connected');
      default:
        return t("The sign-in didn't complete.");
    }
  })();

  const failure = (() => {
    if (state.popupBlocked)
      return t('Your browser blocked the sign-in window. Allow pop-ups and try again.');
    if (state.connectFailed) return t("The sign-in couldn't be opened. Try again.");
    if (state.declineFailed) return t("Your answer couldn't be sent. Try again.");
    return undefined;
  })();

  return (
    <ThemeScopeProvider>
      <div
        aria-busy={busy}
        className={clsx(
          themeScopeClassName,
          'str-chat__ai-tool-authorization-card',
          authorization.status &&
            `str-chat__ai-tool-authorization-card--${authorization.status}`,
          expired && 'str-chat__ai-tool-authorization-card--expired',
          className,
        )}
        role='group'
      >
        <div className='str-chat__ai-tool-approval-card__text'>
          <div className='str-chat__ai-tool-approval-card__title'>
            {authorization.title}
          </div>
          {authorization.message && (
            <div className='str-chat__ai-tool-approval-card__message'>
              {authorization.message}
            </div>
          )}
        </div>
        {outcome && (
          <div className='str-chat__ai-tool-authorization-card__outcome' role='status'>
            {outcome}
          </div>
        )}
        {open && (
          <div className='str-chat__ai-tool-approval-card__actions'>
            {!expired && (
              <button
                className='str-chat__ai-button str-chat__ai-button--primary'
                disabled={busy}
                onClick={onConnect}
                type='button'
              >
                {state.isConnecting ? t('Connecting…') : t('Connect')}
              </button>
            )}
            {/* Left enabled while the sign-in is open, so one that never comes back leaves a way out. */}
            <button
              className='str-chat__ai-button str-chat__ai-button--secondary'
              disabled={state.isDeclining}
              onClick={onDecline}
              type='button'
            >
              {t('Not now')}
            </button>
            {busy && (
              <span className='str-chat__ai-spinner'>
                <IconLoading />
              </span>
            )}
          </div>
        )}
        {failure && (
          <div className='str-chat__ai-tool-approval-card__failure' role='alert'>
            {failure}
          </div>
        )}
      </div>
    </ThemeScopeProvider>
  );
};

/**
 * The sign-in this person is asked for on `call` here: one the call waits for them to finish,
 * of a kind this device opens, and only when they can sign in on it.
 */
export const signInFor = (call: AIToolCallPart, approver: AIToolApprover | undefined) => {
  if (!approver?.authorizer || !isAwaitingAuthorization(call, approver.userId)) return;
  return call.authorization?.type === 'oauth' ? call.authorization : undefined;
};

export type AIToolAuthorizationProps = {
  part: AIToolCallPart;
  /** Who answers on this device, with the `authorizer` the sign-in needs. Defaults to the one of the nearest `AIToolApproverProvider`. */
  approver?: AIToolApprover;
  /** Renders the sign-in, instead of `AIToolAuthorizationCard`. */
  children?: (
    authorization: AIToolAuthorizationData,
    state: AIToolAuthorizationState,
    actions: { connect: () => void; decline: () => void },
  ) => ReactNode;
};

/**
 * Asks for the sign-in of a tool call that waits for this person, and runs it with
 * `approver.authorizer`. Renders nothing for a call that does not wait for them, or without an
 * authorizer. The counterpart of `AIToolAuthorizationView`.
 */
export const AIToolAuthorization = ({
  approver: approverProp,
  children,
  part,
}: AIToolAuthorizationProps) => {
  const approver = useAIToolApprover(approverProp);
  const [state, setState] = useState<AIToolAuthorizationState>(idle);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const authorization = signInFor(part, approver);
  const authorizer = approver?.authorizer;
  if (!authorization || !authorizer) return null;

  const update = (next: AIToolAuthorizationState) => {
    if (mounted.current) setState(next);
  };

  const connect = (signIn: AIToolAuthorizer) => {
    if (state.isConnecting || state.isDeclining) return;
    setState({ ...idle, isConnecting: true });
    // Called in the click itself: a popup opened before anything is awaited is not blocked.
    signIn.connect(part).then(
      // Your backend has the provider's answer before the popup comes back, and its change to
      // the step hides this. Until then it says it is connecting, unless the person closed the
      // popup or the provider did not connect them.
      (connected) => {
        if (!connected) update(idle);
      },
      (error: unknown) =>
        update({
          ...idle,
          connectFailed: true,
          popupBlocked:
            error instanceof AIConnectorSignInError && error.reason === 'blocked',
        }),
    );
  };

  const decline = (signIn: AIToolAuthorizer) => {
    if (state.isDeclining) return;
    setState({ ...idle, isDeclining: true });
    signIn.decline(part).catch(() => update({ ...idle, declineFailed: true }));
  };

  const actions = {
    connect: () => connect(authorizer),
    decline: () => decline(authorizer),
  };

  return (
    <>
      {children ? (
        children(authorization, state, actions)
      ) : (
        <AIToolAuthorizationCard
          authorization={authorization}
          onConnect={actions.connect}
          onDecline={actions.decline}
          state={state}
        />
      )}
    </>
  );
};
