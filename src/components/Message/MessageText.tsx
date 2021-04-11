import React, { useMemo } from 'react';

import { useMobilePress, useReactionClick, useReactionHandler } from './hooks';
import { MessageOptions, MessageOptionsProps } from './MessageOptions';
import { messageHasAttachments, messageHasReactions } from './utils';

import {
  ReactionsList as DefaultReactionList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';

import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { renderText as defaultRenderText, isOnlyEmojis } from '../../utils';

import type { TranslationLanguages } from 'stream-chat';

import type { MessageUIComponentProps, MouseEventHandler } from './types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type MessageTextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us> & {
  customInnerClass?: string;
  customOptionProps?: Partial<MessageOptionsProps<At, Ch, Co, Ev, Me, Re, Us>>;
  customWrapperClass?: string;
  messageWrapperRef?: React.RefObject<HTMLDivElement>;
  onReactionListClick?: MouseEventHandler;
  reactionSelectorRef?: React.RefObject<HTMLDivElement>;
  showDetailedReactions?: boolean;
  theme?: string;
};

const UnMemoizedMessageTextComponent = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageTextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    customInnerClass,
    customOptionProps,
    customWrapperClass,
    message,
    onMentionsClickMessage,
    onMentionsHoverMessage,
    reactionSelectorRef,
    renderText = defaultRenderText,
    theme = 'simple',
    unsafeHTML,
  } = props;

  const {
    ReactionsList = DefaultReactionList,
    ReactionSelector = DefaultReactionSelector,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t, userLanguage } = useTranslationContext();

  const { handleMobilePress } = useMobilePress();

  const { isReactionEnabled, onReactionListClick, showDetailedReactions } = useReactionClick(
    message,
    reactionSelectorRef,
  );

  const hasReactions = messageHasReactions(message);
  const hasAttachment = messageHasAttachments(message);
  const handleReaction = useReactionHandler(message);

  const messageTextToRender =
    message.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] || message.text;

  const messageText = useMemo(() => renderText(messageTextToRender, message.mentioned_users), [
    message.mentioned_users,
    messageTextToRender,
  ]);

  const wrapperClass = customWrapperClass || 'str-chat__message-text';
  const innerClass =
    customInnerClass || `str-chat__message-text-inner str-chat__message-${theme}-text-inner`;

  if (!messageTextToRender) return null;

  return (
    <div className={wrapperClass}>
      <div
        className={`
          ${innerClass}
          ${hasAttachment ? ` str-chat__message-${theme}-text-inner--has-attachment` : ''}
          ${isOnlyEmojis(message.text) ? ` str-chat__message-${theme}-text-inner--is-emoji` : ''}
        `.trim()}
        data-testid='message-text-inner-wrapper'
        onClick={onMentionsClickMessage}
        onMouseOver={onMentionsHoverMessage}
      >
        {message.type === 'error' && (
          <div className={`str-chat__${theme}-message--error-message`}>{t('Error · Unsent')}</div>
        )}
        {message.status === 'failed' && (
          <div className={`str-chat__${theme}-message--error-message`}>
            {message.errorStatusCode !== 403
              ? t('Message Failed · Click to try again')
              : t('Message Failed · Unauthorized')}
          </div>
        )}
        {unsafeHTML && message.html ? (
          <div dangerouslySetInnerHTML={{ __html: message.html }} />
        ) : (
          <div onClick={handleMobilePress}>{messageText}</div>
        )}
        {hasReactions && !showDetailedReactions && isReactionEnabled && (
          <ReactionsList
            onClick={onReactionListClick}
            own_reactions={message.own_reactions}
            reaction_counts={message.reaction_counts || undefined}
            reactions={message.latest_reactions}
            reverse={true}
          />
        )}
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector
            detailedView
            handleReaction={handleReaction}
            latest_reactions={message.latest_reactions}
            own_reactions={message.own_reactions}
            reaction_counts={message.reaction_counts || undefined}
            ref={reactionSelectorRef}
          />
        )}
      </div>
      <MessageOptions {...props} {...customOptionProps} onReactionListClick={onReactionListClick} />
    </div>
  );
};

export const MessageText = React.memo(
  UnMemoizedMessageTextComponent,
) as typeof UnMemoizedMessageTextComponent;
