// @ts-check
import React, { useContext, useRef } from 'react';
import { isOnlyEmojis, renderText } from '../../utils';
import { TranslationContext } from '../../context';
import { ReactionsList, ReactionSelector } from '../Reactions';
import {
  useReactionHandler,
  useReactionClick,
  useMentionsUIHandler,
} from './hooks';
import { messageHasReactions, messageHasAttachments } from './utils';
import { MessageOptions } from './MessageOptions';

/**
 * @type { React.FC<import('types').MessageTextProps> }
 */
const MessageTextComponent = (props) => {
  const {
    onMentionsClickMessage: propOnMentionsClick,
    onMentionsHoverMessage: propOnMentionsHover,
    customWrapperClass,
    customInnerClass,
    theme = 'simple',
    message,
    unsafeHTML,
    customOptionProps,
  } = props;
  const reactionSelectorRef = useRef(null);
  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
  const { onReactionListClick, showDetailedReactions } = useReactionClick(
    reactionSelectorRef,
    message,
  );
  const { t } = useContext(TranslationContext);
  const hasReactions = messageHasReactions(message);
  const hasAttachment = messageHasAttachments(message);
  const handleReaction = useReactionHandler(message);
  const wrapperClass = customWrapperClass || 'str-chat__message-text';
  const innerClass =
    customInnerClass ||
    `str-chat__message-text-inner str-chat__message-${theme}-text-inner`;

  if (!message || !message.text) {
    return null;
  }

  return (
    <div className={wrapperClass}>
      <div
        data-testid="message-text-inner-wrapper"
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
        onMouseOver={onMentionsHover}
        onClick={onMentionsClick}
      >
        {message.type === 'error' && (
          <div className={`str-chat__${theme}-message--error-message`}>
            {t && t('Error · Unsent')}
          </div>
        )}
        {message.status === 'failed' && (
          <div className={`str-chat__${theme}-message--error-message`}>
            {t && t('Message Failed · Click to try again')}
          </div>
        )}

        {unsafeHTML ? (
          <div dangerouslySetInnerHTML={{ __html: message.html }} />
        ) : (
          renderText(message)
        )}

        {/* if reactions show them */}
        {hasReactions && !showDetailedReactions && (
          <ReactionsList
            reactions={message.latest_reactions}
            reaction_counts={message.reaction_counts}
            onClick={onReactionListClick}
            reverse={true}
          />
        )}
        {showDetailedReactions && (
          <ReactionSelector
            handleReaction={handleReaction}
            detailedView
            reaction_counts={message.reaction_counts}
            latest_reactions={message.latest_reactions}
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

export const MessageText = React.memo(MessageTextComponent);
