/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import { NimbleEmoji } from 'emoji-mart';

import { defaultMinimalEmojis, emojiSetDef, emojiData } from '../../utils';

class ReactionsList extends React.Component {
  static propTypes = {
    /** List of reactions */
    reactions: PropTypes.array,
    /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
    reactionOptions: PropTypes.array,
    /** If true, reaction list will be shown at trailing end of message bubble. */
    reverse: PropTypes.bool,
    /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
    reaction_counts: PropTypes.object,
  };

  static defaultProps = {
    reactionOptions: defaultMinimalEmojis,
    emojiSetDef,
    reverse: false,
  };

  constructor(props) {
    super(props);
  }

  _renderReactions = (reactions) => {
    const reactionsByType = {};
    reactions.map((item) => {
      if (reactions[item.type] === undefined) {
        return (reactionsByType[item.type] = [item]);
      } else {
        return (reactionsByType[item.type] = [
          ...reactionsByType[item.type],
          item,
        ]);
      }
    });

    const reactionsEmojis = this.props.reactionOptions.reduce(
      (acc, cur) => ({ ...acc, [cur.id]: cur }),
      {},
    );

    return Object.keys(reactionsByType).map((type) =>
      reactionsEmojis[type] ? (
        <li key={reactionsEmojis[type].id}>
          <NimbleEmoji
            emoji={reactionsEmojis[type]}
            {...emojiSetDef}
            size={16}
            data={emojiData}
          />{' '}
          &nbsp;
        </li>
      ) : null,
    );
  };

  _getReactionCount = () => {
    const reaction_counts = this.props.reaction_counts;
    let count = null;
    if (
      reaction_counts !== null &&
      reaction_counts !== undefined &&
      Object.keys(reaction_counts).length > 0
    ) {
      count = 0;
      Object.keys(reaction_counts).map(
        (key) => (count += reaction_counts[key]),
      );
    }
    return count;
  };

  render() {
    return (
      <div
        data-testid="reaction-list"
        className={`str-chat__reaction-list ${
          this.props.reverse ? 'str-chat__reaction-list--reverse' : ''
        }`}
        onClick={this.props.onClick}
        ref={this.reactionList}
      >
        <ul>
          {this._renderReactions(this.props.reactions)}
          <li>
            <span className="str-chat__reaction-list--counter">
              {this._getReactionCount()}
            </span>
          </li>
        </ul>
      </div>
    );
  }
}

export default ReactionsList;
