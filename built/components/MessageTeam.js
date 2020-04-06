'use strict';
var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importStar(require('react'));
var Attachment_1 = require('./Attachment');
var Avatar_1 = require('./Avatar');
var MessageActionsBox_1 = require('./MessageActionsBox');
var ReactionSelector_1 = require('./ReactionSelector');
var EditMessageForm_1 = require('./EditMessageForm');
var SimpleReactionsList_1 = require('./SimpleReactionsList');
var MessageRepliesCountButton_1 = require('./MessageRepliesCountButton');
var LoadingIndicator_1 = require('./LoadingIndicator');
var Tooltip_1 = require('./Tooltip');
var Gallery_1 = require('./Gallery');
var MessageInput_1 = require('./MessageInput');
var prop_types_1 = __importDefault(require('prop-types'));
var utils_1 = require('../utils');
var context_1 = require('../context');
var reactionSvg =
  '<svg width="14" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z" fillRule="evenodd"/></svg>';
var threadSvg =
  '<svg width="14" height="10" xmlns="http://www.w3.org/2000/svg"><path d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z" fillRule="evenodd" /></svg>';
var optionsSvg =
  '<svg width="11" height="3" viewBox="0 0 11 3" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fillRule="nonzero" /></svg>';
/**
 * MessageTeam - Render component, should be used together with the Message component
 * Implements the look and feel for a team style collaboration environment
 *
 * @example ./docs/MessageTeam.md
 * @extends PureComponent
 */
var MessageTeam = /** @class */ (function(_super) {
  __extends(MessageTeam, _super);
  function MessageTeam() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.state = {
      actionsBoxOpen: false,
      reactionSelectorOpen: false,
    };
    _this.reactionSelectorRef = react_1.default.createRef();
    _this.editMessageFormRef = react_1.default.createRef();
    _this.onClickReactionsAction = function() {
      _this.setState(
        {
          reactionSelectorOpen: true,
        },
        function() {
          return document.addEventListener('click', _this.hideReactions, false);
        },
      );
    };
    _this.onClickOptionsAction = function() {
      _this.setState(
        {
          actionsBoxOpen: true,
        },
        function() {
          return document.addEventListener('click', _this.hideOptions, false);
        },
      );
    };
    _this.hideOptions = function() {
      _this.setState({
        actionsBoxOpen: false,
      });
      document.removeEventListener('click', _this.hideOptions, false);
    };
    _this.hideReactions = function(e) {
      if (
        !_this.reactionSelectorRef.current.reactionSelector.current.contains(
          e.target,
        )
      ) {
        _this.setState({
          reactionSelectorOpen: false,
        });
        document.removeEventListener('click', _this.hideReactions, false);
      }
    };
    _this.onMouseLeaveMessage = function() {
      _this.hideOptions();
      _this.setState(
        {
          reactionSelectorOpen: false,
        },
        function() {
          return document.removeEventListener(
            'click',
            _this.hideReactions,
            false,
          );
        },
      );
    };
    // https://stackoverflow.com/a/29234240/7625485
    _this.formatArray = function(arr) {
      var _a = _this.props,
        t = _a.t,
        client = _a.client;
      var outStr = '';
      var slicedArr = arr
        .filter(function(item) {
          return item.id !== client.user.id;
        })
        .map(function(item) {
          return item.name || item.id;
        })
        .slice(0, 5);
      var restLength = arr.length - slicedArr.length;
      if (slicedArr.length === 1) {
        outStr = slicedArr[0] + ' ';
      } else if (slicedArr.length === 2) {
        //joins all with "and" but =no commas
        //example: "bob and sam"
        outStr = t('{{ firstUser }} and {{ secondUser }}', {
          firstUser: slicedArr[0],
          secondUser: slicedArr[1],
        });
      } else if (slicedArr.length > 2) {
        //joins all with commas, but last one gets ", and" (oxford comma!)
        //example: "bob, joe, sam and 4 more"
        outStr = t('{{ commaSeparatedUsers }} and {{ moreCount }} more', {
          commaSeparatedUsers: slicedArr.join(', '),
          moreCount: restLength,
        });
      }
      return outStr;
    };
    _this.renderStatus = function() {
      var _a = _this.props,
        readBy = _a.readBy,
        message = _a.message,
        threadList = _a.threadList,
        client = _a.client,
        lastReceivedId = _a.lastReceivedId,
        t = _a.t;
      if (!_this.isMine() || message.type === 'error') {
        return null;
      }
      var justReadByMe = readBy.length === 1 && readBy[0].id === client.user.id;
      if (message.status === 'sending') {
        return react_1.default.createElement(
          'span',
          { className: 'str-chat__message-team-status' },
          react_1.default.createElement(
            Tooltip_1.Tooltip,
            null,
            t('Sending...'),
          ),
          react_1.default.createElement(LoadingIndicator_1.LoadingIndicator, {
            isLoading: true,
          }),
        );
      } else if (readBy.length !== 0 && !threadList && !justReadByMe) {
        var lastReadUser = readBy.filter(function(item) {
          return item.id !== client.user.id;
        })[0];
        return react_1.default.createElement(
          'span',
          { className: 'str-chat__message-team-status' },
          react_1.default.createElement(
            Tooltip_1.Tooltip,
            null,
            _this.formatArray(readBy),
          ),
          react_1.default.createElement(Avatar_1.Avatar, {
            name: lastReadUser.name || lastReadUser.id,
            image: lastReadUser.image,
            size: 15,
          }),
          readBy.length - 1 > 1 &&
            react_1.default.createElement(
              'span',
              { className: 'str-chat__message-team-status-number' },
              readBy.length - 1,
            ),
        );
      } else if (
        message.status === 'received' &&
        message.id === lastReceivedId &&
        !threadList
      ) {
        return react_1.default.createElement(
          'span',
          { className: 'str-chat__message-team-status' },
          react_1.default.createElement(
            Tooltip_1.Tooltip,
            null,
            t('Delivered'),
          ),
          react_1.default.createElement(
            'svg',
            { width: '16', height: '16', xmlns: 'http://www.w3.org/2000/svg' },
            react_1.default.createElement('path', {
              d:
                'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.72 6.633a.955.955 0 1 0-1.352-1.352L6.986 8.663 5.633 7.31A.956.956 0 1 0 4.28 8.663l2.029 2.028a.956.956 0 0 0 1.353 0l4.058-4.058z',
              fill: '#006CFF',
              fillRule: 'evenodd',
            }),
          ),
        );
      } else {
        return null;
      }
    };
    return _this;
  }
  MessageTeam.prototype.isMine = function() {
    return this.props.isMyMessage(this.props.message);
  };
  MessageTeam.prototype.componentWillUnmount = function() {
    document.removeEventListener('click', this.hideOptions, false);
    document.removeEventListener('click', this.hideReactions, false);
  };
  MessageTeam.prototype.renderAttachments = function(attachments) {
    var _a = this.props,
      Attachment = _a.Attachment,
      message = _a.message,
      handleAction = _a.handleAction;
    return attachments.map(function(attachment, index) {
      return react_1.default.createElement(Attachment, {
        key: message.id + '-' + index,
        attachment: attachment,
        actionHandler: handleAction,
      });
    });
  };
  // eslint-disable-next-line
  MessageTeam.prototype.render = function() {
    var _a = this.props,
      message = _a.message,
      groupStyles = _a.groupStyles,
      editing = _a.editing,
      clearEditingState = _a.clearEditingState,
      updateMessage = _a.updateMessage,
      threadList = _a.threadList,
      initialMessage = _a.initialMessage,
      handleReaction = _a.handleReaction,
      channelConfig = _a.channelConfig,
      handleOpenThread = _a.handleOpenThread,
      Message = _a.Message,
      messageListRect = _a.messageListRect,
      onMentionsHoverMessage = _a.onMentionsHoverMessage,
      onMentionsClickMessage = _a.onMentionsClickMessage,
      unsafeHTML = _a.unsafeHTML,
      handleRetry = _a.handleRetry,
      getMessageActions = _a.getMessageActions,
      isMyMessage = _a.isMyMessage,
      handleFlag = _a.handleFlag,
      handleMute = _a.handleMute,
      handleEdit = _a.handleEdit,
      handleDelete = _a.handleDelete,
      t = _a.t,
      tDateTimeParser = _a.tDateTimeParser;
    if (message.type === 'message.read') {
      return null;
    }
    var hasAttachment = Boolean(
      message.attachments && message.attachments.length,
    );
    if (message.deleted_at) {
      return null;
    }
    var galleryImages =
      message.attachments &&
      message.attachments.filter(function(item) {
        return item.type === 'image';
      });
    var attachments = message.attachments;
    if (galleryImages && galleryImages.length > 1) {
      attachments = message.attachments.filter(function(item) {
        return item.type !== 'image';
      });
    } else {
      galleryImages = [];
    }
    // determine reaction selector alignment
    var reactionDirection = 'left';
    if (editing) {
      return react_1.default.createElement(
        'div',
        {
          className:
            'str-chat__message-team str-chat__message-team--' +
            groupStyles[0] +
            ' str-chat__message-team--editing',
          onMouseLeave: this.onMouseLeaveMessage,
        },
        (groupStyles[0] === 'top' || groupStyles[0] === 'single') &&
          react_1.default.createElement(
            'div',
            { className: 'str-chat__message-team-meta' },
            react_1.default.createElement(Avatar_1.Avatar, {
              image: message.user.image,
              name: message.user.name || message.user.id,
              size: 40,
            }),
          ),
        react_1.default.createElement(MessageInput_1.MessageInput, {
          Input: EditMessageForm_1.EditMessageForm,
          message: message,
          clearEditingState: clearEditingState,
          updateMessage: updateMessage,
        }),
      );
    }
    return react_1.default.createElement(
      react_1.default.Fragment,
      null,
      react_1.default.createElement(
        'div',
        {
          className:
            'str-chat__message-team str-chat__message-team--' +
            groupStyles[0] +
            ' str-chat__message-team--' +
            message.type +
            ' ' +
            (threadList ? 'thread-list' : '') +
            ' str-chat__message-team--' +
            message.status,
          onMouseLeave: this.onMouseLeaveMessage,
        },
        react_1.default.createElement(
          'div',
          { className: 'str-chat__message-team-meta' },
          groupStyles[0] === 'top' ||
            groupStyles[0] === 'single' ||
            initialMessage
            ? react_1.default.createElement(Avatar_1.Avatar, {
                image: message.user.image,
                name: message.user.name || message.user.id,
                size: 40,
              })
            : react_1.default.createElement('div', {
                style: { width: 40, marginRight: 0 },
              }),
          react_1.default.createElement(
            'time',
            { dateTime: message.created_at, title: message.created_at },
            Boolean(Date.parse(message.created_at)) &&
              tDateTimeParser(message.created_at).format('h:mmA'),
          ),
        ),
        react_1.default.createElement(
          'div',
          { className: 'str-chat__message-team-group' },
          (groupStyles[0] === 'top' ||
            groupStyles[0] === 'single' ||
            initialMessage) &&
            react_1.default.createElement(
              'div',
              { className: 'str-chat__message-team-author' },
              react_1.default.createElement(
                'strong',
                null,
                message.user.name || message.user.id,
              ),
              message.type === 'error' &&
                react_1.default.createElement(
                  'div',
                  { className: 'str-chat__message-team-error-header' },
                  t('Only visible to you'),
                ),
            ),
          react_1.default.createElement(
            'div',
            {
              className:
                'str-chat__message-team-content str-chat__message-team-content--' +
                groupStyles[0] +
                ' str-chat__message-team-content--' +
                (message.text === '' ? 'image' : 'text'),
            },
            !initialMessage &&
              message.status !== 'sending' &&
              message.status !== 'failed' &&
              message.type !== 'system' &&
              message.type !== 'ephemeral' &&
              message.type !== 'error' &&
              react_1.default.createElement(
                'div',
                { className: 'str-chat__message-team-actions' },
                this.state.reactionSelectorOpen &&
                  react_1.default.createElement(
                    ReactionSelector_1.ReactionSelector,
                    {
                      handleReaction: handleReaction,
                      latest_reactions: message.latest_reactions,
                      reaction_counts: message.reaction_counts,
                      detailedView: true,
                      direction: reactionDirection,
                      ref: this.reactionSelectorRef,
                    },
                  ),
                channelConfig &&
                  channelConfig.reactions &&
                  react_1.default.createElement('span', {
                    title: 'Reactions',
                    dangerouslySetInnerHTML: {
                      __html: reactionSvg,
                    },
                    onClick: this.onClickReactionsAction,
                  }),
                !threadList &&
                  channelConfig &&
                  channelConfig.replies &&
                  react_1.default.createElement('span', {
                    title: 'Start a thread',
                    dangerouslySetInnerHTML: {
                      __html: threadSvg,
                    },
                    onClick: function(e) {
                      return handleOpenThread(e, message);
                    },
                  }),
                getMessageActions().length > 0 &&
                  react_1.default.createElement(
                    'span',
                    { onClick: this.onClickOptionsAction },
                    react_1.default.createElement('span', {
                      title: 'Message actions',
                      dangerouslySetInnerHTML: {
                        __html: optionsSvg,
                      },
                    }),
                    react_1.default.createElement(
                      MessageActionsBox_1.MessageActionsBox,
                      {
                        getMessageActions: getMessageActions,
                        Message: Message,
                        open: this.state.actionsBoxOpen,
                        message: message,
                        messageListRect: messageListRect,
                        mine: isMyMessage(message),
                        handleFlag: handleFlag,
                        handleMute: handleMute,
                        handleEdit: handleEdit,
                        handleDelete: handleDelete,
                      },
                    ),
                  ),
              ),
            react_1.default.createElement(
              'span',
              {
                className: utils_1.isOnlyEmojis(message.text)
                  ? 'str-chat__message-team-text--is-emoji'
                  : '',
                onMouseOver: onMentionsHoverMessage,
                onClick: onMentionsClickMessage,
              },
              unsafeHTML
                ? react_1.default.createElement('div', {
                    dangerouslySetInnerHTML: { __html: message.html },
                  })
                : utils_1.renderText(message),
            ),
            galleryImages.length !== 0 &&
              react_1.default.createElement(Gallery_1.Gallery, {
                images: galleryImages,
              }),
            message.text === '' && this.renderAttachments(attachments),
            message.latest_reactions &&
              message.latest_reactions.length !== 0 &&
              message.text !== '' &&
              react_1.default.createElement(
                SimpleReactionsList_1.SimpleReactionsList,
                {
                  reaction_counts: message.reaction_counts,
                  handleReaction: handleReaction,
                  reactions: message.latest_reactions,
                },
              ),
            message.status === 'failed' &&
              react_1.default.createElement(
                'button',
                {
                  className: 'str-chat__message-team-failed',
                  onClick: handleRetry.bind(this, message),
                },
                react_1.default.createElement(
                  'svg',
                  {
                    width: '14',
                    height: '14',
                    xmlns: 'http://www.w3.org/2000/svg',
                  },
                  react_1.default.createElement('path', {
                    d:
                      'M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zm.875 10.938a.438.438 0 0 1-.438.437h-.875a.438.438 0 0 1-.437-.438v-.874c0-.242.196-.438.438-.438h.875c.241 0 .437.196.437.438v.874zm0-2.626a.438.438 0 0 1-.438.438h-.875a.438.438 0 0 1-.437-.438v-5.25c0-.241.196-.437.438-.437h.875c.241 0 .437.196.437.438v5.25z',
                    fill: '#EA152F',
                    fillRule: 'evenodd',
                  }),
                ),
                t('Message failed. Click to try again.'),
              ),
          ),
          this.renderStatus(),
          message.text !== '' &&
            hasAttachment &&
            this.renderAttachments(attachments),
          message.latest_reactions &&
            message.latest_reactions.length !== 0 &&
            message.text === '' &&
            react_1.default.createElement(
              SimpleReactionsList_1.SimpleReactionsList,
              {
                reaction_counts: message.reaction_counts,
                handleReaction: handleReaction,
                reactions: message.latest_reactions,
              },
            ),
          !threadList &&
            react_1.default.createElement(
              MessageRepliesCountButton_1.MessageRepliesCountButton,
              { onClick: handleOpenThread, reply_count: message.reply_count },
            ),
        ),
      ),
    );
  };
  MessageTeam.propTypes = {
    /** The [message object](https://getstream.io/chat/docs/#message_format) */
    message: prop_types_1.default.object,
    /**
     * The attachment UI component.
     * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
     * */
    Attachment: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     *
     * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
     *
     * The higher order message component, most logic is delegated to this component
     * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
     * */
    Message: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
      prop_types_1.default.object,
    ]).isRequired,
    /** render HTML instead of markdown. Posting HTML is only allowed server-side */
    unsafeHTML: prop_types_1.default.bool,
    /** Client object */
    client: prop_types_1.default.object,
    /** If its parent message in thread. */
    initialMessage: prop_types_1.default.bool,
    /** Channel config object */
    channelConfig: prop_types_1.default.object,
    /** If component is in thread list */
    threadList: prop_types_1.default.bool,
    /** Function to open thread on current messxage */
    handleOpenThread: prop_types_1.default.func,
    /** If the message is in edit state */
    editing: prop_types_1.default.bool,
    /** Function to exit edit state */
    clearEditingState: prop_types_1.default.func,
    /** Returns true if message belongs to current user */
    isMyMessage: prop_types_1.default.func,
    /**
     * Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute]
     * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
     * */
    getMessageActions: prop_types_1.default.func,
    /**
     * Function to publish updates on message to channel
     *
     * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
     * */
    updateMessage: prop_types_1.default.func,
    /**
     * Reattempt sending a message
     * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
     */
    handleRetry: prop_types_1.default.func,
    /**
     * Add or remove reaction on message
     *
     * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
     * @param event Dom event which triggered this function
     */
    handleReaction: prop_types_1.default.func,
    /** DOMRect object for parent MessageList component */
    messageListRect: prop_types_1.default.object,
    /**
     * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
     *
     * @param name {string} Name of action
     * @param value {string} Value of action
     * @param event Dom event that triggered this handler
     */
    handleAction: prop_types_1.default.func,
    /**
     * The handler for hover event on @mention in message
     *
     * @param event Dom hover event which triggered handler.
     * @param user Target user object
     */
    onMentionsHoverMessage: prop_types_1.default.func,
    /**
     * The handler for click event on @mention in message
     *
     * @param event Dom click event which triggered handler.
     * @param user Target user object
     */
    onMentionsClickMessage: prop_types_1.default.func,
    /** Position of message in group. Possible values: top, bottom, middle, single */
    groupStyles: prop_types_1.default.array,
  };
  MessageTeam.defaultProps = {
    Attachment: Attachment_1.Attachment,
    groupStyles: ['single'],
  };
  return MessageTeam;
})(react_1.PureComponent);
exports.MessageTeam = MessageTeam;
exports.MessageTeam = MessageTeam = context_1.withTranslationContext(
  MessageTeam,
);
