import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import AutoCompleteTextarea from './AutoCompleteTextarea';
import { LoadingIndicator } from './LoadingIndicator';

// import '@webscopeio/react-textarea-autocomplete/style.css';
import { emojiIndex } from 'emoji-mart';

import { EmoticonItem } from './EmoticonItem';
import { UserItem } from './UserItem';
import { CommandItem } from './CommandItem';
/**
 * Textarea component with included autocomplete options. You can set your own commands and
 * @example ./docs/ChatAutoComplete.md
 */
export class ChatAutoComplete extends PureComponent {
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
    /** function to set up your triggers for autocomplete(eg. '@' for mentions, '/' for commands) */
    trigger: PropTypes.func,
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
  };

  static defaultProps = {
    rows: 3,
  };

  getTriggers() {
    return {
      ':': {
        dataProvider: (q) => {
          if (q.length === 0 || q.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
            return [];
          }
          const emojis = emojiIndex.search(q) || [];
          return emojis.slice(0, 10);
        },
        component: EmoticonItem,
        output: (entity) => ({
          key: entity.id,
          text: `${entity.native}`,
          caretPosition: 'next',
        }),
      },
      '@': {
        dataProvider: (q) => {
          const matchingUsers = this.props.users.filter((user) => {
            if (
              user.name !== undefined &&
              user.name.toLowerCase().indexOf(q.toLowerCase()) !== -1
            ) {
              return true;
            } else if (user.id.toLowerCase().indexOf(q.toLowerCase()) !== -1) {
              return true;
            } else {
              return false;
            }
          });
          return matchingUsers.slice(0, 10);
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
        dataProvider: (q, text) => {
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

          return selectedCommands.slice(0, 10);
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
      />
    );
  }
}
