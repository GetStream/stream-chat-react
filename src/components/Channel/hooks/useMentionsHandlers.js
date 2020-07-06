// @ts-check
import { useCallback } from 'react';

/**
 * @typedef {import('stream-chat').UserResponse} UserResponse
 * @typedef {(e: React.MouseEvent, user?: UserResponse) => void} MentionsHandler
 * @param {MentionsHandler=} onMentionsHover
 * @param {MentionsHandler=} onMentionsClick
 */
const useMentionsHandlers = (onMentionsHover, onMentionsClick) => {
  return useCallback(
    /** @type {(e: React.MouseEvent<HTMLSpanElement>, mentioned_users: UserResponse[]) => void} */
    (e, mentioned_users) => {
      if (!onMentionsHover && !onMentionsClick) return;
      // eslint-disable-next-line prefer-destructuring
      const target = /** @type {HTMLSpanElement} */ (e.target);
      const tagName = target?.tagName.toLowerCase();
      const textContent = target?.innerHTML.replace('*', '');
      if (tagName === 'strong' && textContent[0] === '@') {
        const userName = textContent.replace('@', '');
        const user = mentioned_users.find(
          ({ name, id }) => name === userName || id === userName,
        );
        if (
          onMentionsHover &&
          typeof onMentionsHover === 'function' &&
          e.type === 'mouseover'
        ) {
          onMentionsHover(e, user);
        }
        if (
          onMentionsClick &&
          e.type === 'click' &&
          typeof onMentionsClick === 'function'
        ) {
          onMentionsClick(e, user);
        }
      }
    },
    [onMentionsClick, onMentionsHover],
  );
};

export default useMentionsHandlers;
