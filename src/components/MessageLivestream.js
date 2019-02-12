import React from 'react';
import moment from 'moment';

import { Attachment } from './Attachment';
import { Avatar } from './Avatar';
import { MessageActionsBox } from './MessageActionsBox';
import { ReactionSelector } from './ReactionSelector';
import { SimpleReactionsList } from './SimpleReactionsList';
import { MessageInput } from './MessageInput';
import { EditMessageForm } from './EditMessageForm';
import { Gallery } from './Gallery';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';

import { isOnlyEmojis, renderText } from '../utils';

const svg1 =
	'<svg width="20" height="18" viewBox="0 0 20 18" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 4.5H15a.5.5 0 1 1 0-1h1.5V2a.5.5 0 1 1 1 0v1.5H19a.5.5 0 1 1 0 1h-1.5V6a.5.5 0 1 1-1 0V4.5zM9 13c-1.773 0-3.297-.82-4-2h8c-.703 1.18-2.227 2-4 2zm4.057-11.468a.5.5 0 1 1-.479.878A7.45 7.45 0 0 0 9 1.5C4.865 1.5 1.5 4.865 1.5 9s3.365 7.5 7.5 7.5 7.5-3.365 7.5-7.5c0-.315-.02-.628-.058-.937a.5.5 0 1 1 .992-.124c.044.35.066.704.066 1.06 0 4.688-3.813 8.501-8.5 8.501C4.313 17.5.5 13.687.5 9 .5 4.312 4.313.5 9 .5a8.45 8.45 0 0 1 4.057 1.032zM7.561 5.44a1.5 1.5 0 1 1-2.123 2.122 1.5 1.5 0 0 1 2.123-2.122zm5 0a1.5 1.5 0 1 1-2.122 2.122 1.5 1.5 0 0 1 2.122-2.122z" fillRule="evenodd" /></svg>';
const svg2 =
	'<svg width="18" height="17" xmlns="http://www.w3.org/2000/svg"><path d="M9.854 12.103a.5.5 0 0 1 .306-.105h1.759c2.79 0 5.018-2.398 5.018-5.5s-2.228-5.5-5.018-5.5H6.334C3.6.998 1.45 3.463 1.45 6.625c0 2.887 1.656 5.083 4.267 5.537a.5.5 0 0 1 .414.492v2.327l3.723-2.878zM.45 6.625C.45 2.94 3.015-.002 6.334-.002h5.585c3.36 0 6.018 2.861 6.018 6.5s-2.659 6.5-6.018 6.5H10.33l-4.394 3.398A.5.5 0 0 1 5.13 16v-2.939C2.257 12.367.45 9.826.45 6.625zm4.691.373a.5.5 0 0 1 0-1h7.84a.5.5 0 1 1 0 1h-7.84zm0-2a.5.5 0 0 1 0-1h7.84a.5.5 0 1 1 0 1h-7.84zm0 4a.5.5 0 0 1 0-1h3.92a.5.5 0 0 1 0 1h-3.92z" fillRule="nonzero" /></svg>';
const svg3 =
	'<svg width="11" height="3" viewBox="0 0 11 3" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fillRule="nonzero" /></svg>';

/**
 * MessageLivestream - Render component, should be used together with the Message component
 * Implements the look and feel for a livestream use case.
 *
 * @example ./docs/MessageLivestream.md
 * @extends PureComponent
 */
export class MessageLivestream extends React.PureComponent {
	state = {
		actionsBoxOpen: false,
		reactionSelectorOpen: false,
	};

	reactionSelectorRef = React.createRef();
	editMessageFormRef = React.createRef();

	isMine() {
		return this.props.message.user.id === this.props.client.user.id;
	}

	onClickReactionsAction = () => {
		this.setState(
			{
				reactionSelectorOpen: true,
			},
			() => document.addEventListener('click', this.hideReactions, false),
		);
	};

	onClickOptionsAction = () => {
		this.setState(
			{
				actionsBoxOpen: true,
			},
			() => document.addEventListener('click', this.hideOptions, false),
		);
	};

	hideOptions = () => {
		this.setState({
			actionsBoxOpen: false,
		});
		document.removeEventListener('click', this.hideOptions, false);
	};

	hideReactions = e => {
		if (
			!this.reactionSelectorRef.current.reactionSelectorInner.current.contains(
				e.target,
			)
		) {
			this.setState({
				reactionSelectorOpen: false,
			});
			document.removeEventListener('click', this.hideReactions, false);
		}
	};

	onMouseLeaveMessage = () => {
		this.hideOptions();
		this.setState(
			{
				reactionSelectorOpen: false,
			},
			() => document.removeEventListener('click', this.hideReactions, false),
		);
	};

	componentWillUnmount() {
		document.removeEventListener('click', this.hideOptions, false);
		document.removeEventListener('click', this.hideReactions, false);
	}

	render() {
		const { message, groupStyles } = this.props;
		const hasAttachment = Boolean(message.attachments && message.attachments.length);

		let galleryImages = message.attachments.filter(item => item.type === 'image');
		let attachments = message.attachments;
		if (galleryImages.length > 1) {
			attachments = message.attachments.filter(item => item.type !== 'image');
		} else {
			galleryImages = [];
		}

		if (message.type === 'message.seen') {
			return null;
		}

		if (message.type === 'message.date') {
			return null;
		}

		if (message.deleted_at) {
			return null;
		}

		if (this.props.editing) {
			return (
				<div
					className={`str-chat__message-team str-chat__message-team--${
						groupStyles[0]
					} str-chat__message-team--editing`}
					onMouseLeave={this.onMouseLeaveMessage}
				>
					{(groupStyles[0] === 'top' || groupStyles[0] === 'single') && (
						<div className="str-chat__message-team-meta">
							<Avatar
								source={message.user.image}
								name={message.user.name || message.user.id}
								size={40}
							/>
						</div>
					)}
					<MessageInput
						Input={EditMessageForm}
						message={this.props.message}
						clearEditingState={this.props.clearEditingState}
						updateMessage={this.props.updateMessage}
					/>
				</div>
			);
		}
		return (
			<React.Fragment>
				<div
					className={`str-chat__message-livestream str-chat__message-livestream--${
						groupStyles[0]
					}`}
					onMouseLeave={this.onMouseLeaveMessage}
				>
					<div className={`str-chat__message-livestream-left`}>
						{groupStyles[0] === 'top' || groupStyles[0] === 'single' ? (
							<Avatar
								source={message.user.image}
								name={message.user.name || message.user.id}
								size={30}
							/>
						) : (
							<div style={{ width: 30, marginRight: 10 }} />
						)}
					</div>
					<div className={`str-chat__message-livestream-right`}>
						<div className={`str-chat__message-livestream-content`}>
							{!this.props.initialMessage && (
								<div className={`str-chat__message-livestream-actions`}>
									<span className={`str-chat__message-livestream-time`}>
										{moment(message.created_at).format('h:mmA')}
									</span>
									<span onClick={this.onClickReactionsAction}>
										{this.state.reactionSelectorOpen && (
											<ReactionSelector
												mine={this.props.mine}
												reverse={false}
												handleReaction={this.props.handleReaction}
												actionsEnabled={this.props.actionsEnabled}
												detailedView
												message={this.props.message}
												messageList={this.props.messageListRect}
												ref={this.reactionSelectorRef}
											/>
										)}
										<span
											dangerouslySetInnerHTML={{ __html: svg1 }}
										/>
									</span>
									{!this.props.thread && (
										<span
											dangerouslySetInnerHTML={{ __html: svg2 }}
											onClick={e =>
												this.props.openThread(e, message)
											}
										/>
									)}
									<span onClick={this.onClickOptionsAction}>
										<span
											dangerouslySetInnerHTML={{ __html: svg3 }}
										/>
										<MessageActionsBox
											Message={this.props.messageBase}
											open={this.state.actionsBoxOpen}
											mine={this.props.mine}
										/>
									</span>
								</div>
							)}

							{(groupStyles[0] === 'top' ||
								groupStyles[0] === 'single') && (
								<div className="str-chat__message-livestream-author">
									<strong>
										{message.user.name || message.user.id}
									</strong>
								</div>
							)}

							<div
								className={
									isOnlyEmojis(message.text)
										? 'str-chat__message-livestream-text--is-emoji'
										: ''
								}
							>
								{renderText(message.text)}
							</div>

							{hasAttachment &&
								attachments.map((attachment, index) => (
									<Attachment
										key={`${message.id}-${index}`}
										attachment={attachment}
										actionHandler={this.props.handleAction}
									/>
								))}

							{galleryImages.length !== 0 && (
								<Gallery images={galleryImages} />
							)}

							<SimpleReactionsList
								reaction_counts={message.reaction_counts}
								reactions={this.props.message.latest_reactions}
								handleReaction={this.props.handleReaction}
							/>

							{!this.props.initialMessage && (
								<MessageRepliesCountButton
									onClick={this.props.openThread}
									reply_count={message.reply_count}
								/>
							)}
						</div>
					</div>
				</div>
				{this.props.initialMessage && (
					<div className="str-chat__message-livestream__thread-banner">
						Start of new Thread
					</div>
				)}
			</React.Fragment>
		);
	}
}
