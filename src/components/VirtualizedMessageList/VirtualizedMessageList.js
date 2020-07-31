import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import { ChannelContext, withTranslationContext } from '../../context';
import { MessageSimple } from '../Message';
/**
 * VirtualizedMessageList - The message list components renders a list of messages. Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
 *
 * @example ../../docs/VirtualizedMessageList.md
 */

const VirtualizedMessageList = ({ messages }) => {
  const total = messages.length;
  console.log(messages);
  return (
    <Virtuoso
      initialTopMostItemIndex={messages.length - 1}
      totalCount={total}
      // atBottomStateChange={(atBottom) => {
      //   clearInterval(appendInterval.current);
      //   if (atBottom) {
      //     appendInterval.current = setInterval(() => {
      //       console.log('appending items');
      //       setTotal(total + 3);
      //     }, 200);
      //   }
      // }}
      item={(index) => {
        return (
          <MessageSimple
            getMessageActions={() => []}
            message={messages[index]}
          />
        );
      }}
      followOutput={true}
      style={{ height: '400px', width: '350px' }}
    />
  );
};

// VirtualizedMessageList.propTypes = {
//   /**
//    * Date separator UI component to render
//    *
//    * Defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.js)
//    * */
//   dateSeparator: PropTypes.elementType,
//   /** Turn off grouping of messages by user */
//   noGroupByUser: PropTypes.bool,
//   /** render HTML instead of markdown. Posting HTML is only allowed server-side */
//   unsafeHTML: PropTypes.bool,
//   /** Set the limit to use when paginating messages */
//   messageLimit: PropTypes.number,
//   /**
//    * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
//    * If all the actions need to be disabled, empty array or false should be provided as value of prop.
//    * */
//   messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
//   /**
//    * Boolean weather current message list is a thread.
//    */
//   threadList: PropTypes.bool,
//   /**
//    * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
//    *
//    * This function should accept following params:
//    *
//    * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
//    *
//    * */
//   getFlagMessageSuccessNotification: PropTypes.func,
//   /**
//    * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error
//    *
//    * This function should accept following params:
//    *
//    * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
//    *
//    * */
//   getFlagMessageErrorNotification: PropTypes.func,
//   /**
//    * Function that returns message/text as string to be shown as notification, when request for muting a user is successful
//    *
//    * This function should accept following params:
//    *
//    * @param user A user object which is being muted
//    *
//    * */
//   getMuteUserSuccessNotification: PropTypes.func,
//   /**
//    * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
//    *
//    * This function should accept following params:
//    *
//    * @param user A user object which is being muted
//    *
//    * */
//   getMuteUserErrorNotification: PropTypes.func,
//   /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
//   client: PropTypes.object,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   Attachment: PropTypes.elementType,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   Message: PropTypes.elementType,
//   /**
//    * Custom UI component to display system messages.
//    *
//    * Defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent.js)
//    */
//   MessageSystem: PropTypes.elementType,
//   /**
//    * The UI Indicator to use when MessagerList or ChannelList is empty
//    * */
//   EmptyStateIndicator: PropTypes.elementType,
//   /**
//    * Component to render at the top of the VirtualizedMessageList
//    * */
//   HeaderComponent: PropTypes.elementType,
//   /**
//    * Component to render at the top of the VirtualizedMessageList while loading new messages
//    * */
//   LoadingIndicator: PropTypes.elementType,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   messages: PropTypes.array.isRequired,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   channel: PropTypes.instanceOf(Channel).isRequired,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   updateMessage: PropTypes.func.isRequired,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   retrySendMessage: PropTypes.func,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   removeMessage: PropTypes.func,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   onMentionsClick: PropTypes.func,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   onMentionsHover: PropTypes.func,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   openThread: PropTypes.func,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   members: PropTypes.object,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   watchers: PropTypes.object,
//   /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
//   read: PropTypes.object,
//   /**
//    * Additional props for underlying MessageInput component. We have instance of MessageInput
//    * component in MessageSimple component, for handling edit state.
//    * Available props - https://getstream.github.io/stream-chat-react/#messageinput
//    * */
//   additionalMessageInputProps: PropTypes.object,
// };

// VirtualizedMessageList.defaultProps = {
//   Message: MessageSimple,
//   MessageSystem: EventComponent,
//   threadList: false,
//   Attachment,
//   DateSeparator: DefaultDateSeparator,
//   LoadingIndicator: DefaultLoadingIndicator,
//   EmptyStateIndicator: DefaultEmptyStateIndicator,
//   unsafeHTML: false,
//   noGroupByUser: false,
//   messageActions: Object.keys(MESSAGE_ACTIONS),
// };

export default withTranslationContext((props) => (
  <ChannelContext.Consumer>
    {/* TODO: only used props needs to be passed in */}
    {({ typing, ...channelContext }) => (
      <VirtualizedMessageList {...channelContext} {...props} />
    )}
  </ChannelContext.Consumer>
));
