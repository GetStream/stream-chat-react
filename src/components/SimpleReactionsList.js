import React from 'react';
import PropTypes from 'prop-types';

import { NimbleEmoji } from 'emoji-mart';

import { defaultMinimalEmojis, emojiSetDef, emojiData } from '../utils';

export class SimpleReactionsList extends React.PureComponent {
  static propTypes = {
    reactions: PropTypes.array,
    reaction_coutns: PropTypes.object,
    renderReactions: PropTypes.func,
    showTooltip: PropTypes.bool,
    /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
    reactionOptions: PropTypes.array,
  };

  static defaultProps = {
    showTooltip: true,
    reactionOptions: defaultMinimalEmojis,
    emojiSetDef,
  };

  state = {
    showTooltip: false,
    users: [],
  };

  showTooltip = () => {
    this.setState({
      showTooltip: true,
    });
  };

  hideTooltip = () => {
    this.setState({
      showTooltip: false,
    });
  };

  handleReaction = (e, type) => {
    if (e !== undefined && e.preventDefault) {
      e.preventDefault();
    }
    this.props.handleReaction(type);
    this.setUsernames(type);
  };

  getReactionCount = () => {
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

  renderUsers = (users) =>
    users.map((user, i) => {
      let text = user;
      if (i + 1 < users.length) {
        text += ', ';
      }
      return (
        <span className="latest-user-username" key={`key-${i}-${user}`}>
          {text}
        </span>
      );
    });

  getReactionsByType = (reactions) => {
    const reactionsByType = {};
    reactions.map((item) => {
      if (reactionsByType[item.type] === undefined) {
        return (reactionsByType[item.type] = [item]);
      } else {
        return (reactionsByType[item.type] = [
          ...reactionsByType[item.type],
          item,
        ]);
      }
    });
    return reactionsByType;
  };

  renderReactions = (reactions) => {
    const reactionsByType = this.getReactionsByType(reactions);
    const reactionsEmojis = this.props.reactionOptions.reduce(
      (acc, cur) => ({ ...acc, [cur.id]: cur }),
      {},
    );
    return Object.keys(reactionsByType).map((type, i) => (
      <li
        className="str-chat__simple-reactions-list-item"
        key={`${reactionsByType[type][0].id}-${i}`}
        onClick={(e) => this.handleReaction(e, type)}
      >
        <span onMouseEnter={() => this.setUsernames(type)}>
          <NimbleEmoji
            emoji={reactionsEmojis[type]}
            {...emojiSetDef}
            size={13}
            data={emojiData}
          />
          &nbsp;
        </span>
      </li>
    ));
  };

  getUsernames = (reactions) =>
    reactions.map((item) =>
      item.user !== null ? item.user.name || item.user.id : 'null',
    );

  setUsernames = (type) => {
    const reactionsByType = this.getReactionsByType(this.props.reactions);

    const reactions = reactionsByType[type];
    const users = this.getUsernames(reactions);

    this.setState(
      {
        users,
      },
      () => this.showTooltip(),
    );
  };

  renderUsernames = (users) => users.join(', ');

  render() {
    const { reactions } = this.props;
    if (!reactions || reactions.length === 0) {
      return null;
    }
    return (
      <ul
        className="str-chat__simple-reactions-list"
        onMouseLeave={this.hideTooltip}
      >
        {this.state.showTooltip && (
          <div
            className="str-chat__simple-reactions-list-tooltip"
            ref={this.reactionSelectorTooltip}
          >
            <div className="arrow" />
            {this.renderUsernames(this.state.users)}
          </div>
        )}
        {this.renderReactions(reactions)}
        {reactions.length !== 0 && (
          <li className="str-chat__simple-reactions-list-item--last-number">
            {this.getReactionCount()}
          </li>
        )}
      </ul>
    );
  }
}
