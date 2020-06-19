/* eslint-disable */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { emojiIndex } from 'emoji-mart';

import { AutoCompleteTextarea } from '../AutoCompleteTextarea';
import { LoadingIndicator } from '../Loading';
import { EmoticonItem } from '../EmoticonItem';
import { UserItem } from '../UserItem';
import { CommandItem } from '../CommandItem';
import debounce from 'lodash/debounce';
import { withChannelContext } from '../../context';

/**
 * Textarea component with included autocomplete options. You can set your own commands and
 * @example ../../docs/ChatAutoComplete.md
 */
class ChatAutoComplete extends PureComponent {
  static propTypes = {
    /** The number of rows you want the textarea to have */
    rows: PropTypes.number,
    /** Grow the number of rows of the textarea while you're typing */
    grow: PropTypes.bool,
    /** Maximum number of rows */
    maxRows: PropTypes.number,
    /** Make the textarea disabled */
    disabled: PropTypes.bool,
    /** The value of the textarea */
    value: PropTypes.string,
    /** Function to run on pasting within the textarea */
    onPaste: PropTypes.func,
    /** Function that runs on submit */
    handleSubmit: PropTypes.func,
    /** Function that runs on change */
    onChange: PropTypes.func,
    /** Placeholder for the textare */
    placeholder: PropTypes.string,
    /** What loading component to use for the auto complete when loading results. */
    LoadingIndicator: PropTypes.node,
    /** Minimum number of Character */
    minChar: PropTypes.number,
    /** Array of [user object](https://getstream.io/chat/docs/#chat-doc-set-user). Used for mentions suggestions */
    users: PropTypes.array,
    /**
     * Handler for selecting item from suggestions list
     *
     * @param item Selected item object.
     *  */
    onSelectItem: PropTypes.func,
    /** Array of [commands](https://getstream.io/chat/docs/#channel_commands) */
    commands: PropTypes.array,
    /** Listener for onfocus event on textarea */
    onFocus: PropTypes.object,
    /**
     * Any additional attrubutes that you may want to add for underlying HTML textarea element.
     */
    additionalTextareaProps: PropTypes.object,
  };

  static defaultProps = {
    rows: 3,
  };

  getCommands = (channel) => {
    const config = channel.getConfig();

    if (!config) return [];

    const allCommands = config.commands;
    return allCommands;
  };

  getMembers = (channel) => {
    const result = [];
    const members = channel.state.members;
    if (members && Object.values(members).length) {
      Object.values(members).forEach((member) => result.push(member.user));
    }

    return result;
  };

  getWatchers = (channel) => {
    const result = [];
    const watchers = channel.state.watchers;
    if (watchers && Object.values(watchers).length) {
      result.push(...Object.values(watchers));
    }

    return result;
  };

  getMembersAndWatchers = (channel) => {
    const users = [...this.getMembers(channel), ...this.getWatchers(channel)];

    // make sure we don't list users twice
    const uniqueUsers = {};
    for (const user of users) {
      if (user !== undefined && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    }
    const usersArray = Object.values(uniqueUsers);

    return usersArray;
  };

  queryMembers = async (channel, query, onReady) => {
    const response = await channel.queryMembers({
      name: { $autocomplete: query },
    });

    const users = response.members.map((m) => m.user);
    onReady && onReady(users);
  };

  queryMembersdebounced = debounce(this.queryMembers, 200, {
    trailing: true,
    leading: false,
  });

  // dataProvider accepts `onReady` function, which will executed once the data is ready.
  // Another approach would have been to simply return the data from dataProvider and let the
  // component await for it and then execute the required logic. We are going for callback instead
  // of async-await since we have debounce function in dataProvider. Which will delay the execution
  // of api call on trailing end of debounce (lets call it a1) but will return with result of
  // previous call without waiting for a1. So in this case, we want to execute onReady, when trailing
  // end of debounce executes.
  getTriggers() {
    const { channel } = this.props;
    return {
      ':': {
        dataProvider: (q, text, onReady) => {
          if (q.length === 0 || q.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
            return [];
          }
          const emojis = emojiIndex.search(q) || [];
          const result = emojis.slice(0, 10);

          onReady && onReady(result, q);

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
          const members = channel.state.members;
          // By default, we return maximum 100 members via queryChannels api call.
          // Thus it is safe to assume, that if number of members in channel.state is < 100,
          // then all the members are already available on client side and we don't need to
          // make any api call to queryMembers endpoint.
          if (!query || Object.values(members).length < 100) {
            const users = this.getMembersAndWatchers(channel);

            const matchingUsers = users.filter((user) => {
              if (!query) return true;
              if (
                user.name !== undefined &&
                user.name.toLowerCase().indexOf(query.toLowerCase()) !== -1
              ) {
                return true;
              } else if (
                user.id.toLowerCase().indexOf(query.toLowerCase()) !== -1
              ) {
                return true;
              } else {
                return false;
              }
            });
            const data = matchingUsers.slice(0, 10);

            onReady && onReady(data, query);

            return data;
          }

          return this.queryMembersdebounced(channel, query, (data) => {
            onReady && onReady(data, query);
          });
        },
        component: UserItem,
        output: (entity) => ({
          key: entity.id,
          text: `@${entity.name || entity.id}`,
          caretPosition: 'next',
        }),
        callback: (item) => this.props.onSelectItem(item),
      },
      '/': {
        dataProvider: (q, text, onReady) => {
          if (text.indexOf('/') !== 0) {
            return [];
          }
          const selectedCommands = this.props.commands.filter(
            (c) => c.name.indexOf(q) !== -1,
          );

          // sort alphabetically unless the you're matching the first char
          selectedCommands.sort((a, b) => {
            let nameA = a.name.toLowerCase();
            let nameB = b.name.toLowerCase();
            if (nameA.indexOf(q) === 0) {
              nameA = `0${nameA}`;
            }
            if (nameB.indexOf(q) === 0) {
              nameB = `0${nameB}`;
            }
            if (nameA < nameB) {
              return -1;
            }
            if (nameA > nameB) {
              return 1;
            }

            return 0;
          });

          const result = selectedCommands.slice(0, 10);
          onReady && onReady(result, q);

          return result;
        },
        component: CommandItem,
        output: (entity) => ({
          key: entity.id,
          text: `/${entity.name}`,
          caretPosition: 'next',
        }),
      },
    };
  }

  emojiReplace(word) {
    const found = emojiIndex.search(word) || [];
    for (const emoji of found.slice(0, 10)) {
      if (emoji.emoticons.includes(word)) {
        return emoji.native;
      }
    }
  }

  render() {
    const { innerRef } = this.props;
    return (
      <AutoCompleteTextarea
        loadingComponent={LoadingIndicator}
        trigger={this.getTriggers()}
        replaceWord={this.emojiReplace}
        minChar={0}
        maxRows={this.props.maxRows}
        innerRef={
          innerRef &&
          ((ref) => {
            innerRef.current = ref;
          })
        }
        onFocus={this.props.onFocus}
        rows={this.props.rows}
        className="str-chat__textarea__textarea"
        containerClassName="str-chat__textarea"
        dropdownClassName="str-chat__emojisearch"
        listClassName="str-chat__emojisearch__list"
        itemClassName="str-chat__emojisearch__item"
        placeholder={this.props.placeholder}
        onChange={this.props.onChange}
        handleSubmit={this.props.handleSubmit}
        onPaste={this.props.onPaste}
        value={this.props.value}
        grow={this.props.grow}
        disabled={this.props.disabled}
        additionalTextareaProps={this.props.additionalTextareaProps}
      />
    );
  }
}

export default withChannelContext(ChatAutoComplete);
