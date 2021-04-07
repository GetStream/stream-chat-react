import React, { PureComponent, RefObject } from 'react';

import { Center } from './Center';
import { ConnectionStatus } from './ConnectionStatus';
import { CustomNotification } from './CustomNotification';
import { MessageListInner, MessageListInnerProps } from './MessageListInner';
import { MessageNotification } from './MessageNotification';

import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { EventComponent } from '../EventComponent';
import { LoadingIndicator as DefaultLoadingIndicator, LoadingIndicatorProps } from '../Loading';
import { MessageSimple } from '../Message';
import { defaultPinPermissions, MESSAGE_ACTIONS } from '../Message/utils';
import { TypingIndicator as DefaultTypingIndicator } from '../TypingIndicator';

import {
  ChannelContextValue,
  TranslationContextValue,
  useChannelContext,
  useChatContext,
  useTranslationContext,
} from '../../context';

import type { StreamChat } from 'stream-chat';

import type { MessageProps } from '../Message/types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

type Snapshot = { offsetBottom: number; offsetTop: number } | null;

export type MessageListWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Omit<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client' | 'typing'> &
  TranslationContextValue &
  MessageListProps<At, Ch, Co, Ev, Me, Re, Us> & {
    /** The client connection object for connecting to Stream */
    client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  };

class MessageListWithContext<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> extends PureComponent<
  MessageListWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
  {
    newMessagesNotification: boolean;
    messageListRect?: DOMRect;
  }
> {
  static defaultProps = {
    messages: [],
    scrolledUpThreshold: 200,
    threadList: false,
  };

  bottomRef: RefObject<HTMLDivElement>;
  messageList: RefObject<HTMLDivElement>;
  closeToTop: boolean | undefined;
  scrollOffset: number | undefined;

  constructor(props: MessageListWithContextProps<At, Ch, Co, Ev, Me, Re, Us>) {
    super(props);

    this.state = {
      newMessagesNotification: false,
    };

    this.bottomRef = React.createRef();
    this.messageList = React.createRef();
  }

  componentDidMount() {
    // start at the bottom
    this.scrollToBottom();
    const messageListRect = this.messageList.current?.getBoundingClientRect();

    this.setState({
      messageListRect,
    });
  }

  getSnapshotBeforeUpdate(prevProps: MessageListWithContextProps<At, Ch, Co, Ev, Me, Re, Us>) {
    if (this.props.threadList) {
      return null;
    }
    // Are we adding new items to the list?
    // Capture the scroll position so we can adjust scroll later.

    if ((prevProps.messages?.length || 0) < (this.props.messages?.length || 0)) {
      const list = this.messageList.current;
      if (list) {
        return {
          offsetBottom: list.scrollHeight - list.scrollTop,
          offsetTop: list.scrollTop,
        };
      } else {
        return null;
      }
    }
    return null;
  }

  componentDidUpdate(
    prevProps: MessageListWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
    _: unknown,
    snapshot: Snapshot,
  ) {
    // If we have a snapshot value, we've just added new items.
    // Adjust scroll so these new items don't push the old ones out of view.
    // (snapshot here is the value returned from getSnapshotBeforeUpdate)
    const userScrolledUp = this.userScrolledUp();
    const currentLastMessage = this.props.messages?.[this.props.messages?.length - 1];
    const previousLastMessage = prevProps.messages?.[prevProps.messages?.length - 1];
    if (!previousLastMessage || !currentLastMessage) {
      return;
    }

    const hasNewMessage = currentLastMessage.id !== previousLastMessage.id;
    const isOwner = currentLastMessage?.user?.id === this.props.client.userID;

    const list = this.messageList.current;

    // always scroll down when it's your own message that you added...
    const scrollToBottom = hasNewMessage && (isOwner || !userScrolledUp);

    if (scrollToBottom) {
      this.scrollToBottom();

      // remove the scroll notification if we already scrolled down...
      if (this.state.newMessagesNotification) this.setState({ newMessagesNotification: false });

      return;
    }

    if (snapshot !== null) {
      // Maintain the offsetTop of scroll so that content in viewport doesn't move.
      // This is for the case where user has scroll up significantly and a new message arrives from someone.
      if (hasNewMessage) {
        if (this.messageList.current) {
          this.scrollToTarget(snapshot.offsetTop, this.messageList.current);
        }
      } else {
        // Maintain the bottomOffset of scroll.
        // This is for the case of pagination, when more messages get loaded.
        if (this.messageList.current) {
          this.scrollToTarget(
            (list?.scrollHeight || 0) - snapshot.offsetBottom,
            this.messageList.current,
          );
        }
      }
    }

    // Check the scroll position... if you're scrolled up show a little notification
    if (hasNewMessage && !this.state.newMessagesNotification) {
      this.setState({ newMessagesNotification: true });
    }
  }

  scrollToBottom = () => {
    this._scrollToRef(this.bottomRef, this.messageList);
  };

  _scrollToRef = (el: RefObject<HTMLElement>, parent: RefObject<HTMLElement>) => {
    const scrollDown = () => {
      if (el && el.current && parent && parent.current) {
        this.scrollToTarget(el.current, parent.current);
      }
    };

    scrollDown();
    // scroll down after images load again
    setTimeout(scrollDown, 200);
  };

  /**
   * target - target to scroll to (DOM element, scrollTop Number, 'top', or 'bottom'
   * containerEl - DOM element for the container with scrollbars
   * source: https://stackoverflow.com/a/48429314
   */
  scrollToTarget = (target: HTMLElement | number | 'top' | 'bottom', containerEl: HTMLElement) => {
    let scrollTop: number | undefined;

    if (target instanceof HTMLElement) {
      scrollTop = target.offsetTop;
    } else if (typeof target === 'number') {
      scrollTop = target;
    } else if (target === 'top') {
      scrollTop = 0;
    } else if (target === 'bottom') {
      scrollTop = containerEl.scrollHeight - containerEl.offsetHeight;
    }

    if (scrollTop !== undefined) {
      containerEl.scrollTop = scrollTop;
    }
  };

  goToNewMessages = () => {
    this.scrollToBottom();
    this.setState({ newMessagesNotification: false });
  };

  userScrolledUp = () =>
    (this.scrollOffset || 0) > ((this.props.scrolledUpThreshold as unknown) as number);

  listenToScroll = (offset: number, reverseOffset: number, threshold: number) => {
    this.scrollOffset = offset;
    this.closeToTop = reverseOffset < threshold;
    if (this.state.newMessagesNotification && !this.userScrolledUp()) {
      this.setState({ newMessagesNotification: false });
    }
  };

  onMessageLoadCaptured = () => {
    // A load event (emitted by e.g. an <img>) was captured on a message.
    // In some cases, the loaded asset is larger than the placeholder, which means we have to scroll down.
    if (!this.userScrolledUp() && !this.closeToTop) {
      this.scrollToBottom();
    }
  };

  loadMore = () => {
    if (this.props.loadMore) {
      if (this.props.messageLimit) {
        this.props.loadMore(this.props.messageLimit);
      } else {
        this.props.loadMore(100);
      }
    }
  };

  render() {
    const {
      addNotification,
      Attachment = DefaultAttachment,
      Avatar = DefaultAvatar,
      DateSeparator = DefaultDateSeparator,
      EmptyStateIndicator = DefaultEmptyStateIndicator,
      internalInfiniteScrollProps,
      LoadingIndicator = DefaultLoadingIndicator,
      Message = MessageSimple,
      messageActions = Object.keys(MESSAGE_ACTIONS),
      messages = [],
      MessageSystem = EventComponent,
      notifications,
      noGroupByUser = false,
      pinPermissions = defaultPinPermissions,
      t,
      threadList = false,
      TypingIndicator = DefaultTypingIndicator,
      unsafeHTML = false,
    } = this.props;

    return (
      <>
        <div
          className={`str-chat__list ${this.props.threadList ? 'str-chat__list--thread' : ''}`}
          ref={this.messageList}
        >
          <MessageListInner<At, Ch, Co, Ev, Me, Re, Us>
            bottomRef={this.bottomRef}
            channel={this.props.channel}
            client={this.props.client}
            DateSeparator={DateSeparator}
            disableDateSeparator={this.props.disableDateSeparator}
            EmptyStateIndicator={EmptyStateIndicator}
            HeaderComponent={this.props.HeaderComponent}
            headerPosition={this.props.headerPosition}
            hideDeletedMessages={this.props.hideDeletedMessages}
            hideNewMessageSeparator={this.props.hideNewMessageSeparator}
            internalInfiniteScrollProps={{
              hasMore: this.props.hasMore,
              isLoading: this.props.loadingMore,
              listenToScroll: this.listenToScroll,
              loader: (
                <Center key='loadingindicator'>
                  <LoadingIndicator size={20} />
                </Center>
              ),
              loadMore: this.loadMore,
              ...internalInfiniteScrollProps,
            }}
            internalMessageProps={{
              additionalMessageInputProps: this.props.additionalMessageInputProps,
              addNotification,
              Attachment,
              Avatar,
              channel: this.props.channel,
              getFlagMessageErrorNotification: this.props.getFlagMessageErrorNotification,
              getFlagMessageSuccessNotification: this.props.getFlagMessageSuccessNotification,
              getMuteUserErrorNotification: this.props.getMuteUserErrorNotification,
              getMuteUserSuccessNotification: this.props.getMuteUserSuccessNotification,
              getPinMessageErrorNotification: this.props.getPinMessageErrorNotification,
              members: this.props.members,
              Message,
              messageActions,
              messageListRect: this.state.messageListRect,
              mutes: this.props.mutes,
              onMentionsClick: this.props.onMentionsClick,
              onMentionsHover: this.props.onMentionsHover,
              onUserClick: this.props.onUserClick,
              onUserHover: this.props.onUserHover,
              openThread: this.props.openThread,
              pinPermissions,
              removeMessage: this.props.removeMessage,
              retrySendMessage: this.props.retrySendMessage,
              unsafeHTML,
              updateMessage: this.props.updateMessage,
              watchers: this.props.watchers,
            }}
            messages={messages}
            MessageSystem={MessageSystem}
            noGroupByUser={noGroupByUser}
            onMessageLoadCaptured={this.onMessageLoadCaptured}
            read={this.props.read}
            threadList={threadList}
            TypingIndicator={TypingIndicator}
          />
        </div>
        <div className='str-chat__list-notifications'>
          {notifications.map((notification) => (
            <CustomNotification active={true} key={notification.id} type={notification.type}>
              {notification.text}
            </CustomNotification>
          ))}
          <ConnectionStatus />
          <MessageNotification
            onClick={this.goToNewMessages}
            showNotification={this.state.newMessagesNotification}
          >
            {t('New Messages!')}
          </MessageNotification>
        </div>
      </>
    );
  }
}

type PropsDrilledToMessage =
  | 'additionalMessageInputProps'
  | 'Attachment'
  | 'Avatar'
  | 'Message'
  | 'getFlagMessageErrorNotification'
  | 'getFlagMessageErrorNotification'
  | 'getFlagMessageSuccessNotification'
  | 'getMuteUserErrorNotification'
  | 'getMuteUserSuccessNotification'
  | 'getPinMessageErrorNotification'
  | 'messageActions'
  | 'mutes'
  | 'onMentionsClick'
  | 'onMentionsHover'
  | 'onUserClick'
  | 'onUserHover'
  | 'pinPermissions'
  | 'unsafeHTML';

type PropsDrilledToMessageListInner =
  | 'DateSeparator'
  | 'disableDateSeparator'
  | 'EmptyStateIndicator'
  | 'HeaderComponent'
  | 'headerPosition'
  | 'hideDeletedMessages'
  | 'hideNewMessageSeparator'
  | 'internalInfiniteScrollProps'
  | 'messages'
  | 'MessageSystem'
  | 'noGroupByUser'
  | 'read'
  | 'threadList'
  | 'TypingIndicator';

export type MessageListProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Partial<Pick<MessageProps<At, Ch, Co, Ev, Me, Re, Us>, PropsDrilledToMessage>> &
  Partial<
    Pick<MessageListInnerProps<At, Ch, Co, Ev, Me, Re, Us>, PropsDrilledToMessageListInner>
  > & {
    /** Whether or not the list has more items to load */
    hasMore?: boolean;
    /** Component to render at the top of the MessageList while loading new messages */
    LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
    /** Whether or not the list is currently loading more items */
    loadingMore?: boolean;
    /** Function called when more messages are to be loaded */
    loadMore?: ((limit: number) => Promise<number>) | (() => Promise<void>);
    /** The limit to use when paginating messages. */
    messageLimit?: number;
    /** The pixel threshold to determine whether or not the user is scrolled up in the list.
     * @default 200px
     */
    scrolledUpThreshold?: number;
  };

/**
 * The MessageList component renders a list of Messages.
 * It is a consumer of the [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext).
 * @example ./MessageList.md
 */
export const MessageList = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    client: channelClient, // eslint-disable-line
    typing, // eslint-disable-line
    ...channelContext
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const translation = useTranslationContext();

  return <MessageListWithContext client={client} {...channelContext} {...translation} {...props} />;
};
