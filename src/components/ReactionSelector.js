import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { Emoji } from 'emoji-mart';

import { Avatar } from './Avatar';

export const REACTIONS = [
  {
    name: 'like',
    emoji: 'thumbsup',
  },
  {
    name: 'love',
    emoji: 'heart',
  },
  {
    name: 'haha',
    emoji: 'joy',
  },
  {
    name: 'wow',
    emoji: 'astonished',
  },
  {
    name: 'sad',
    emoji: 'pensive',
  },
  {
    name: 'angry',
    emoji: 'angry',
  },
];

/**
 * ReactionSelector - A component for selecting a reaction. Examples are love, wow, like etc.
 *
 * @example ./docs/ReactionSelector.md
 * @extends PureComponent
 */
export class ReactionSelector extends PureComponent {
  static propTypes = {
    /** The message object */
    message: PropTypes.object.isRequired,

    /** Callback to handle the reaction */
    handleReaction: PropTypes.func.isRequired,

    /** Set the direction to either left or right */
    direction: PropTypes.oneOf(['left', 'right']),

    /** Enable the avatar display */
    detailedView: PropTypes.bool,

    /** Provide a list of reaction options [{name: 'angry', emoji: 'angry'}] */
    reactionOptions: PropTypes.array,
  };

  static defaultProps = {
    direction: 'left',
    detailedView: true,
    reactionOptions: REACTIONS,
  };

  constructor(props) {
    super(props);
    this.state = {
      reverse: true,
      elRect: null,
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

  getUsersPerReaction = (reactions, type) => {
    const filtered = reactions.filter((item) => item.type === type);
    return filtered;
  };

  getLatestUser = (reactions, type) => {
    const filtered = this.getUsersPerReaction(reactions, type);
    if (filtered[0] && filtered[0].user) {
      return filtered[0].user;
    } else {
      return 'NotFound';
    }
  };

  getUserNames = (reactions, type) => {
    const filtered = this.getUsersPerReaction(reactions, type);
    const users = filtered.map((item) => item.user || 'NotFound');
    return users;
  };

  getContainerDimensions = () =>
    this.reactionSelectorInner.current.getBoundingClientRect();
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
    const { message } = this.props;
    const lis = this.props.reactionOptions.map((reaction) => {
      const users = this.getUserNames(message.latest_reactions, reaction.name);
      const latestUser = this.getLatestUser(
        message.latest_reactions,
        reaction.name,
      );

      const count =
        message.reaction_counts && message.reaction_counts[reaction.name];
      return (
        <li
          key={`item-${reaction.name}`}
          className="str-chat__message-reactions-list-item"
          data-text={reaction.name}
          onClick={this.props.handleReaction.bind(this, reaction.name)}
        >
          {this.props.message && count && this.props.detailedView && (
            <React.Fragment>
              <div
                className="latest-user"
                onMouseEnter={(e) => this.showTooltip(e, users)}
                onMouseLeave={this.hideTooltip}
              >
                {latestUser !== 'NotFound' ? (
                  <Avatar
                    source={latestUser.image}
                    alt={latestUser.id}
                    size={20}
                    name={latestUser.id}
                  /> // todo: add avatar component
                ) : (
                  <div className="latest-user-not-found" />
                )}
              </div>
            </React.Fragment>
          )}
          <Emoji emoji={reaction.emoji} set="apple" size={20} />

          {message && count && this.props.detailedView && (
            <span className="str-chat__message-reactions-list-item__count">
              {count || ''}
            </span>
          )}
        </li>
      );
    });
    return lis;
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
        <div
          className={`str-chat__reaction-selector-inner`}
          ref={this.reactionSelectorInner}
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
              <div
                className="arrow"
                style={{ left: this.state.arrowPosition }}
              />
              {this.renderUsers(this.state.users)}
            </div>
          )}

          <ul className="str-chat__message-reactions-list">
            {this.renderReactionItems()}
          </ul>
        </div>
      </div>
    );
  }
}
