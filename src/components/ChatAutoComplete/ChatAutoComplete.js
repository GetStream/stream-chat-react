// @ts-check
import React, { useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { emojiIndex } from 'emoji-mart';
// ignore TS error because the type definitions for this package requires generics, which you can't do in jsdoc
// @ts-ignore
import debounce from 'lodash.debounce';

import { AutoCompleteTextarea } from '../AutoCompleteTextarea';
import { LoadingIndicator } from '../Loading';
import { EmoticonItem } from '../EmoticonItem';
import { UserItem } from '../UserItem';
import { CommandItem } from '../CommandItem';
import { ChannelContext } from '../../context/ChannelContext';

/** @param {string} word */
const emojiReplace = (word) => {
  const found = emojiIndex.search(word) || [];
  const emoji = found
    .slice(0, 10)
    .find(({ emoticons }) => emoticons?.includes(word));
  if (!emoji || !('native' in emoji)) return null;
  return emoji.native;
};

/** @type {React.FC<import("types").ChatAutoCompleteProps>} */
const ChatAutoComplete = (props) => {
  const { commands, onSelectItem, triggers } = props;

  const { channel } = useContext(ChannelContext);

  const members = channel?.state?.members;
  const watchers = channel?.state?.watchers;

  const getMembersAndWatchers = useCallback(() => {
    const memberUsers = members
      ? Object.values(members).map(({ user }) => user)
      : [];
    const watcherUsers = watchers ? Object.values(watchers) : [];
    const users = [...memberUsers, ...watcherUsers];
    // make sure we don't list users twice
    /** @type {{ [key: string]: import('seamless-immutable').ImmutableObject<import('stream-chat').UserResponse<import('types').StreamChatReactUserType>> }} */
    const uniqueUsers = {};
    users.forEach((user) => {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    });
    return Object.values(uniqueUsers);
  }, [members, watchers]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queryMembersdebounced = useCallback(
    debounce(
      /**
       * @param {string} query
       * @param {(data: any[]) => void} onReady
       */
      async (query, onReady) => {
        if (!channel?.queryMembers) return;
        const response = await channel?.queryMembers({
          name: { $autocomplete: query },
        });
        const users = response.members.map((m) => m.user);
        if (onReady) onReady(users);
      },
      200,
    ),
    [channel?.queryMembers],
  );

  /**
   * dataProvider accepts `onReady` function, which will executed once the data is ready.
   * Another approach would have been to simply return the data from dataProvider and let the
   * component await for it and then execute the required logic. We are going for callback instead
   * of async-await since we have debounce function in dataProvider. Which will delay the execution
   * of api call on trailing end of debounce (lets call it a1) but will return with result of
   * previous call without waiting for a1. So in this case, we want to execute onReady, when trailing
   * end of debounce executes.
   * @type {() => import("../AutoCompleteTextarea/types").TriggerMap | object}
   */
  const getTriggers = useCallback(
    // eslint-disable-next-line sonarjs/cognitive-complexity
    () =>
      triggers || {
        ':': {
          dataProvider: (q, text, onReady) => {
            if (q.length === 0 || q.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
              return [];
            }
            const emojis = emojiIndex.search(q) || [];
            const result = emojis.slice(0, 10);

            if (onReady) onReady(result, q);

            return result;
          },
          component: EmoticonItem,
          output: (entity) => ({
            key: entity.id,
            text: `${entity.native}`,
            caretPosition: 'next',
          }),
        },
        '@': {
          dataProvider: (query, text, onReady) => {
            // By default, we return maximum 100 members via queryChannels api call.
            // Thus it is safe to assume, that if number of members in channel.state is < 100,
            // then all the members are already available on client side and we don't need to
            // make any api call to queryMembers endpoint.
            if (!query || Object.values(members || {}).length < 100) {
              const users = getMembersAndWatchers();

              const matchingUsers = users.filter((user) => {
                if (!query) return true;
                if (
                  user.name !== undefined &&
                  user.name.toLowerCase().includes(query.toLowerCase())
                ) {
                  return true;
                }
                return user.id.toLowerCase().includes(query.toLowerCase());
              });
              const data = matchingUsers.slice(0, 10);

              if (onReady) onReady(data, query);

              return data;
            }
            return queryMembersdebounced(
              query,
              /** @param {any[]} data */
              (data) => {
                if (onReady) onReady(data, query);
              },
            );
          },
          component: UserItem,
          output: (entity) => ({
            key: entity.id,
            text: `@${entity.name || entity.id}`,
            caretPosition: 'next',
          }),
          callback: (item) => onSelectItem && onSelectItem(item),
        },
        '/': {
          dataProvider: (q, text, onReady) => {
            if (text.indexOf('/') !== 0 || !commands) {
              return [];
            }
            const selectedCommands = commands.filter(
              (c) => c.name?.indexOf(q) !== -1,
            );

            // sort alphabetically unless the you're matching the first char
            selectedCommands.sort((a, b) => {
              let nameA = a.name?.toLowerCase();
              let nameB = b.name?.toLowerCase();
              if (nameA?.indexOf(q) === 0) {
                nameA = `0${nameA}`;
              }
              if (nameB?.indexOf(q) === 0) {
                nameB = `0${nameB}`;
              }
              // Should confirm possible null / undefined when TS is fully implemented
              if (nameA != null && nameB != null) {
                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }
              }

              return 0;
            });

            const result = selectedCommands.slice(0, 10);
            if (onReady) onReady(result, q);

            return result;
          },
          component: CommandItem,
          output: (entity) => ({
            key: entity.id,
            text: `/${entity.name}`,
            caretPosition: 'next',
          }),
        },
      },
    [
      commands,
      getMembersAndWatchers,
      members,
      onSelectItem,
      queryMembersdebounced,
      triggers,
    ],
  );

  const { innerRef } = props;

  const updateInnerRef = useCallback(
    (ref) => {
      if (innerRef) innerRef.current = ref;
    },
    [innerRef],
  );

  return (
    <AutoCompleteTextarea
      loadingComponent={LoadingIndicator}
      trigger={getTriggers()}
      replaceWord={emojiReplace}
      minChar={0}
      maxRows={props.maxRows}
      innerRef={updateInnerRef}
      onFocus={props.onFocus}
      rows={props.rows}
      className="str-chat__textarea__textarea"
      containerClassName="str-chat__textarea"
      dropdownClassName="str-chat__emojisearch"
      listClassName="str-chat__emojisearch__list"
      itemClassName="str-chat__emojisearch__item"
      placeholder={props.placeholder}
      onChange={props.onChange}
      handleSubmit={props.handleSubmit}
      onPaste={props.onPaste}
      value={props.value}
      grow={props.grow}
      disabled={props.disabled}
      disableMentions={props.disableMentions}
      SuggestionList={props.SuggestionList}
      additionalTextareaProps={props.additionalTextareaProps}
    />
  );
};

ChatAutoComplete.propTypes = {
  /** The number of rows you want the textarea to have */
  rows: PropTypes.number,
  /** Grow the number of rows of the textarea while you're typing */
  grow: PropTypes.bool,
  /** Maximum number of rows */
  maxRows: PropTypes.number,
  /** Make the textarea disabled */
  disabled: PropTypes.bool,
  /** Disable mentions */
  disableMentions: PropTypes.bool,
  /** The value of the textarea */
  value: PropTypes.string,
  /** Function to run on pasting within the textarea */
  onPaste: PropTypes.func,
  /** Function that runs on submit */
  handleSubmit: PropTypes.func,
  /** Function that runs on change */
  onChange: PropTypes.func,
  /** Placeholder for the textarea */
  placeholder: PropTypes.string,
  /** What loading component to use for the auto complete when loading results. */
  LoadingIndicator: /** @type {PropTypes.Validator<React.ElementType<import('types').LoadingIndicatorProps>>} */ (PropTypes.elementType),
  /** Minimum number of Character */
  minChar: PropTypes.number,
  /**
   * Handler for selecting item from suggestions list
   *
   * @param item Selected item object.
   *  */
  onSelectItem: PropTypes.func,
  /** Array of [commands](https://getstream.io/chat/docs/#channel_commands) */
  commands: PropTypes.array,
  /** Listener for onfocus event on textarea */
  onFocus: PropTypes.func,
  /** Optional UI component prop to override the default List component that displays suggestions */
  SuggestionList: /** @type {PropTypes.Validator<React.ElementType<import('types').SuggestionListProps>>} */ (PropTypes.elementType),
  /**
   * Any additional attributes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: PropTypes.object,
};

ChatAutoComplete.defaultProps = {
  rows: 3,
};

export default React.memo(ChatAutoComplete);
