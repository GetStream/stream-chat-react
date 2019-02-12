import React from 'react';
import PropTypes from 'prop-types';

import { Emoji } from 'emoji-mart';

import { REACTIONS } from '../utils';

export class ReactionsList extends React.Component {
	static propTypes = {
		reactions: PropTypes.array,
	};

	constructor(props) {
		super(props);
		this.state = {
			reverse: false,
		};
		this.reactionList = React.createRef();
	}

	componentDidMount() {
		if (this.props.mine && this.reactionList && this.props.messageList) {
			this.setState({
				reverse:
					this.reactionList.current.getBoundingClientRect().right >
					this.props.messageList.right
						? true
						: false,
			});
		} else if (!this.props.mine && this.reactionList && this.props.messageList) {
			this.setState({
				reverse:
					this.reactionList.current.getBoundingClientRect().left <
					this.props.messageList.left
						? true
						: false,
			});
		}
	}

	_renderReactions = reactions => {
		const reactionsByType = {};
		reactions.map(item => {
			if (reactions[item.type] === undefined) {
				return (reactionsByType[item.type] = [item]);
			} else {
				return (reactionsByType[item.type] = [
					...reactionsByType[item.type],
					item,
				]);
			}
		});

		return Object.keys(reactionsByType).map(type => (
			<li key={reactionsByType[type][0].id}>
				<Emoji emoji={REACTIONS[type]} set="apple" size={16} /> &nbsp;
			</li>
		));
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
			Object.keys(reaction_counts).map(key => (count += reaction_counts[key]));
		}
		return count;
	};

	render() {
		return (
			<div
				className={`str-chat__reaction-list ${
					this.state.reverse ? 'str-chat__reaction-list--reverse' : ''
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
