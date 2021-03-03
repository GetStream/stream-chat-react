import React, { useMemo, useRef } from 'react';

import {
  useMentionsUIHandler,
  useMobilePress,
  useReactionClick,
  useReactionHandler,
} from './hooks';
import { MessageOptions, MessageOptionsProps } from './MessageOptions';
import { messageHasAttachments, messageHasReactions } from './utils';

import {
  ReactionsList as DefaultReactionList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';

import { useTranslationContext } from '../../context/TranslationContext';
import { isOnlyEmojis, renderText } from '../../utils';

import type { TranslationLanguages } from 'stream-chat';

import type { MessageUIComponentProps } from './types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type MessageTextProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us> & {
  customInnerClass?: string;
  customOptionProps?: Partial<MessageOptionsProps<At, Ch, Co, Ev, Me, Re, Us>>;
  customWrapperClass?: string;
  messageWrapperRef?: React.RefObject<HTMLDivElement>;
  onReactionListClick?: () => void;
  reactionSelectorRef?: React.RefObject<HTMLDivElement>;
  showDetailedReactions?: boolean;
  theme?: string;
};

const UnMemoizedMessageTextComponent = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageTextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    customInnerClass,
    customOptionProps,
    customWrapperClass,
    message,
    onMentionsClickMessage: propOnMentionsClick,
    onMentionsHoverMessage: propOnMentionsHover,
    ReactionsList = DefaultReactionList,
    ReactionSelector = DefaultReactionSelector,
    theme = 'simple',
    unsafeHTML,
  } = props;

  const { t, userLanguage } = useTranslationContext();

  const reactionSelectorRef = useRef<HTMLDivElement>(null);

  const { handleMobilePress } = useMobilePress();

  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });

  const {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  } = useReactionClick(message, reactionSelectorRef);

  const hasReactions = messageHasReactions(message);
  const hasAttachment = messageHasAttachments(message);
  const handleReaction = useReactionHandler(message);

  const messageTextToRender =
    message?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    message?.text;

  const messageMentionedUsersItem = message?.mentioned_users;

  const messageText = useMemo(
    () => renderText(messageTextToRender, messageMentionedUsersItem),
    [messageMentionedUsersItem, messageTextToRender],
  );

  const wrapperClass = customWrapperClass || 'str-chat__message-text';
  const innerClass =
    customInnerClass ||
    `str-chat__message-text-inner str-chat__message-${theme}-text-inner`;

  if (!message?.text) return null;

  return (
    <div className={wrapperClass}>
      <div
        className={`
          ${innerClass}
          ${
            hasAttachment
              ? ` str-chat__message-${theme}-text-inner--has-attachment`
              : ''
          }
          ${
            isOnlyEmojis(message.text)
              ? ` str-chat__message-${theme}-text-inner--is-emoji`
              : ''
          }
        `.trim()}
        data-testid='message-text-inner-wrapper'
        onClick={onMentionsClick}
        onMouseOver={onMentionsHover}
      >
        {message.type === 'error' && (
          <div className={`str-chat__${theme}-message--error-message`}>
            {t('Error · Unsent')}
          </div>
        )}
        {message.status === 'failed' && (
          <div className={`str-chat__${theme}-message--error-message`}>
            {t('Message Failed · Click to try again')}
          </div>
        )}
        {unsafeHTML && message.html ? (
          <div dangerouslySetInnerHTML={{ __html: message.html }} />
        ) : (
          <div onClick={handleMobilePress}>{messageText}</div>
        )}
        {hasReactions && !showDetailedReactions && isReactionEnabled && (
          <ReactionsList
            // @ts-expect-error
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
            // @ts-expect-error
            handleReaction={handleReaction}
            latest_reactions={message.latest_reactions}
            own_reactions={message.own_reactions}
            reaction_counts={message.reaction_counts || undefined}
            ref={reactionSelectorRef}
          />
        )}
      </div>
      <MessageOptions
        {...props}
        {...customOptionProps}
        onReactionListClick={onReactionListClick}
      />
    </div>
  );
};

export const MessageText = React.memo(
  UnMemoizedMessageTextComponent,
) as typeof UnMemoizedMessageTextComponent;
