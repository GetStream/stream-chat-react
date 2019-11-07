import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { NimbleEmoji } from 'emoji-mart';

import { Avatar } from './Avatar';

import { defaultMinimalEmojis, emojiSetDef, emojiData } from '../utils';

/**
 * ReactionSelector - A component for selecting a reaction. Examples are love, wow, like etc.
 *
 * @example ./docs/ReactionSelector.md
 * @extends PureComponent
 */
export class ReactionSelector extends PureComponent {
  static propTypes = {
    /**
     * Array of latest reactions.
     * Reaction object has following structure:
     *
     * ```json
     * {
     *  "type": "love",
     *  "user_id": "demo_user_id",
     *  "user": {
     *    ...userObject
     *  },
     *  "created_at": "datetime";
     * }
     * ```
     * */
    latest_reactions: PropTypes.array,
    /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
    reaction_counts: PropTypes.object,
    /**
     * Callback to handle the reaction
     *
     * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
     * */
    handleReaction: PropTypes.func.isRequired,
    /** Enable the avatar display */
    detailedView: PropTypes.bool,
    /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
    reactionOptions: PropTypes.array,

    reverse: PropTypes.bool,
  };

  static defaultProps = {
    detailedView: true,
    reactionOptions: defaultMinimalEmojis,
    reverse: false,
    emojiSetDef,
  };

  constructor(props) {
    super(props);
    this.state = {
      showTooltip: false,
      users: [],
      position: 0,
      arrowPosition: 0,
      positionCalculated: false,
    };
    this.reactionSelector = React.createRef();
    this.reactionSelectorInner = React.createRef();
    this.reactionSelectorTooltip = React.createRef();
  }

  showTooltip = async (e, users) => {
    const target = e.target.getBoundingClientRect();
    await this.setState(
      () => ({
        showTooltip: true,
        users,
      }),
      async () => {
        await this.setTooltipPosition(target);
        await this.setArrowPosition(target);
      },
    );
  };

  hideTooltip = () => {
    this.setState(() => ({
      showTooltip: false,
      users: [],
      arrowPosition: 0,
      position: 0,
      positionCaculated: false,
    }));
  };

  getUsersPerReaction = (reactions, type) =>
    reactions && reactions.filter((item) => item.type === type);

  getLatestUser = (reactions, type) => {
    const filtered = this.getUsersPerReaction(reactions, type);
    if (filtered && filtered[0] && filtered[0].user) {
      return filtered[0].user;
    } else {
      return 'NotFound';
    }
  };

  getUserNames = (reactions, type) => {
    const filtered = this.getUsersPerReaction(reactions, type);
    return filtered && filtered.map((item) => item.user || 'NotFound');
  };

  getContainerDimensions = () =>
    this.reactionSelector.current.getBoundingClientRect();
  getToolTipDimensions = () =>
    this.reactionSelectorTooltip.current.getBoundingClientRect();

  setTooltipPosition = async (target) => {
    const container = await this.getContainerDimensions();
    const tooltip = await this.getToolTipDimensions();
    let position;

    if (tooltip.width === container.width || tooltip.x < container.x) {
      position = 0;
    } else {
      position =
        target.left + target.width / 2 - container.left - tooltip.width / 2;
    }

    await this.setState(() => ({
      position,
    }));
  };

  setArrowPosition = async (target) => {
    const tooltip = this.reactionSelectorTooltip.current.getBoundingClientRect();
    const position = target.x - tooltip.x + target.width / 2;

    await this.setState(() => ({
      arrowPosition: position,
      positionCaculated: true,
    }));
  };

  renderReactionItems = () => {
    const { reaction_counts, latest_reactions } = this.props;
    return this.props.reactionOptions.map((reaction) => {
      const users = this.getUserNames(latest_reactions, reaction.id);
      const latestUser = this.getLatestUser(latest_reactions, reaction.id);

      const count = reaction_counts && reaction_counts[reaction.id];

      return (
        <li
          key={`item-${reaction.id}`}
          className="str-chat__message-reactions-list-item"
          data-text={reaction.id}
          onClick={this.props.handleReaction.bind(this, reaction.id)}
        >
          {Boolean(count) && this.props.detailedView && (
            <React.Fragment>
              <div
                className="latest-user"
                onMouseEnter={(e) => this.showTooltip(e, users)}
                onMouseLeave={this.hideTooltip}
              >
                {latestUser !== 'NotFound' ? (
                  <Avatar
                    image={latestUser.image}
                    alt={latestUser.id}
                    size={20}
                    name={latestUser.id}
                  />
                ) : (
                  <div className="latest-user-not-found" />
                )}
              </div>
            </React.Fragment>
          )}
          <NimbleEmoji emoji={reaction} {...emojiSetDef} data={emojiData} />

          {Boolean(count) && this.props.detailedView && (
            <span className="str-chat__message-reactions-list-item__count">
              {count || ''}
            </span>
          )}
        </li>
      );
    });
  };

  renderUsers = (users) =>
    users.map((user, i) => {
      let text = user.name || user.id;
      if (i + 1 < users.length) {
        text += ', ';
      }
      return (
        <span className="latest-user-username" key={`key-${i}-${user}`}>
          {text}
        </span>
      );
    });

  render() {
    return (
      <div
        className={`str-chat__reaction-selector ${
          this.props.reverse ? 'str-chat__reaction-selector--reverse' : ''
        }`}
        ref={this.reactionSelector}
      >
        {this.props.detailedView && (
          <div
            className="str-chat__reaction-selector-tooltip"
            ref={this.reactionSelectorTooltip}
            style={{
              visibility: this.state.showTooltip ? 'visible' : 'hidden',
              left: this.state.position,
              opacity:
                this.state.showTooltip && this.state.positionCaculated
                  ? 1
                  : 0.01,
            }}
          >
            <div className="arrow" style={{ left: this.state.arrowPosition }} />
            {this.renderUsers(this.state.users)}
          </div>
        )}

        <ul className="str-chat__message-reactions-list">
          {this.renderReactionItems()}
        </ul>
      </div>
    );
  }
}
