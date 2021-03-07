'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _MessageRepliesCountButton = _interopRequireDefault(
  require('./MessageRepliesCountButton'),
);

var _utils = require('../../utils');

var _context = require('../../context');

var _Attachment = require('../Attachment');

var _Avatar = require('../Avatar');

var _MML = require('../MML');

var _MessageInput = require('../MessageInput');

var _MessageActions = require('../MessageActions');

var _Tooltip = require('../Tooltip');

var _Loading = require('../Loading');

var _Reactions = require('../Reactions');

var _hooks = require('./hooks');

var _utils2 = require('./utils');

var _icons = require('./icons');

var _MessageTimestamp = _interopRequireDefault(require('./MessageTimestamp'));

/**
 * MessageTeam - Render component, should be used together with the Message component
 * Implements the look and feel for a team style collaboration environment
 *
 * @example ../../docs/MessageTeam.md
 * @typedef { import('types').MessageTeamProps } Props
 *
 * @type {React.FC<Props>}
 */
var MessageTeam = function MessageTeam(props) {
  var _message$i18n,
    _message$user4,
    _message$user5,
    _message$user6,
    _message$user7,
    _message$user8;

  var message = props.message,
    threadList = props.threadList,
    formatDate = props.formatDate,
    initialMessage = props.initialMessage,
    unsafeHTML = props.unsafeHTML,
    getMessageActions = props.getMessageActions,
    _props$Avatar = props.Avatar,
    Avatar = _props$Avatar === void 0 ? _Avatar.Avatar : _props$Avatar,
    _props$EditMessageInp = props.EditMessageInput,
    EditMessageInput =
      _props$EditMessageInp === void 0
        ? _MessageInput.EditMessageForm
        : _props$EditMessageInp,
    MessageDeleted = props.MessageDeleted,
    _props$PinIndicator = props.PinIndicator,
    PinIndicator =
      _props$PinIndicator === void 0
        ? _icons.PinIndicator
        : _props$PinIndicator,
    _props$ReactionsList = props.ReactionsList,
    ReactionsList =
      _props$ReactionsList === void 0
        ? _Reactions.SimpleReactionsList
        : _props$ReactionsList,
    _props$ReactionSelect = props.ReactionSelector,
    ReactionSelector =
      _props$ReactionSelect === void 0
        ? _Reactions.ReactionSelector
        : _props$ReactionSelect,
    propEditing = props.editing,
    propSetEdit = props.setEditingState,
    propClearEdit = props.clearEditingState,
    propOnMentionsHover = props.onMentionsHoverMessage,
    propOnMentionsClick = props.onMentionsClickMessage,
    propChannelConfig = props.channelConfig,
    propHandleAction = props.handleAction,
    propHandleOpenThread = props.handleOpenThread,
    propHandleReaction = props.handleReaction,
    propHandleRetry = props.handleRetry,
    propUpdateMessage = props.updateMessage,
    propOnUserClick = props.onUserClick,
    propOnUserHover = props.onUserHover,
    propT = props.t;
  /**
   *@type {import('types').ChannelContextValue}
   */

  var _useContext = (0, _react.useContext)(_context.ChannelContext),
    channel = _useContext.channel,
    channelUpdateMessage = _useContext.updateMessage;

  var channelConfig =
    propChannelConfig ||
    (channel === null || channel === void 0 ? void 0 : channel.getConfig());

  var _useContext2 = (0, _react.useContext)(_context.TranslationContext),
    contextT = _useContext2.t,
    userLanguage = _useContext2.userLanguage;

  var t = propT || contextT;
  var groupStyles = props.groupStyles || ['single'];
  var reactionSelectorRef = (0, _react.useRef)(null);
  var messageWrapperRef = (0, _react.useRef)(null);

  var _useEditHandler = (0, _hooks.useEditHandler)(),
    ownEditing = _useEditHandler.editing,
    ownSetEditing = _useEditHandler.setEdit,
    ownClearEditing = _useEditHandler.clearEdit;

  var editing = propEditing || ownEditing;
  var setEdit = propSetEdit || ownSetEditing;
  var clearEdit = propClearEdit || ownClearEditing;
  var handleOpenThread = (0, _hooks.useOpenThreadHandler)(message);
  var handleReaction = (0, _hooks.useReactionHandler)(message);
  var handleAction = (0, _hooks.useActionHandler)(message);
  var retryHandler = (0, _hooks.useRetryHandler)();
  var retry = propHandleRetry || retryHandler;

  var _useMentionsUIHandler = (0, _hooks.useMentionsUIHandler)(message, {
      onMentionsClick: propOnMentionsClick,
      onMentionsHover: propOnMentionsHover,
    }),
    onMentionsClick = _useMentionsUIHandler.onMentionsClick,
    onMentionsHover = _useMentionsUIHandler.onMentionsHover;

  var _useReactionClick = (0, _hooks.useReactionClick)(
      message,
      reactionSelectorRef,
      messageWrapperRef,
    ),
    onReactionListClick = _useReactionClick.onReactionListClick,
    showDetailedReactions = _useReactionClick.showDetailedReactions,
    isReactionEnabled = _useReactionClick.isReactionEnabled;

  var _useUserHandler = (0, _hooks.useUserHandler)(message, {
      onUserClickHandler: propOnUserClick,
      onUserHoverHandler: propOnUserHover,
    }),
    onUserClick = _useUserHandler.onUserClick,
    onUserHover = _useUserHandler.onUserHover;

  var messageTextToRender =
    (message === null || message === void 0
      ? void 0
      : (_message$i18n = message.i18n) === null || _message$i18n === void 0
      ? void 0
      : _message$i18n[''.concat(userLanguage, '_text')]) ||
    (message === null || message === void 0 ? void 0 : message.text);
  var messageMentionedUsersItem =
    message === null || message === void 0 ? void 0 : message.mentioned_users; // eslint-disable-next-line react-hooks/rules-of-hooks

  var messageText = (0, _react.useMemo)(
    function () {
      return (0, _utils.renderText)(
        messageTextToRender,
        messageMentionedUsersItem,
      );
    },
    [messageMentionedUsersItem, messageTextToRender],
  );
  var firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if (
    (message === null || message === void 0 ? void 0 : message.type) ===
    'message.read'
  ) {
    return null;
  }

  if (message !== null && message !== void 0 && message.deleted_at) {
    return (0, _utils.smartRender)(MessageDeleted, props, null);
  }

  if (editing) {
    var _message$user, _message$user2, _message$user3;

    return /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'message-team-edit',
        className: 'str-chat__message-team str-chat__message-team--'.concat(
          firstGroupStyle,
          ' str-chat__message-team--editing',
        ),
      },
      (firstGroupStyle === 'top' || firstGroupStyle === 'single') &&
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__message-team-meta',
          },
          /*#__PURE__*/ _react.default.createElement(Avatar, {
            image:
              message === null || message === void 0
                ? void 0
                : (_message$user = message.user) === null ||
                  _message$user === void 0
                ? void 0
                : _message$user.image,
            name:
              (message === null || message === void 0
                ? void 0
                : (_message$user2 = message.user) === null ||
                  _message$user2 === void 0
                ? void 0
                : _message$user2.name) ||
              (message === null || message === void 0
                ? void 0
                : (_message$user3 = message.user) === null ||
                  _message$user3 === void 0
                ? void 0
                : _message$user3.id),
            size: 40,
            onClick: onUserClick,
            onMouseOver: onUserHover,
          }),
        ),
      /*#__PURE__*/ _react.default.createElement(_MessageInput.MessageInput, {
        Input: EditMessageInput,
        message: message,
        clearEditingState: clearEdit,
        updateMessage: propUpdateMessage || channelUpdateMessage,
      }),
    );
  }

  return /*#__PURE__*/ _react.default.createElement(
    _react.default.Fragment,
    null,
    (message === null || message === void 0 ? void 0 : message.pinned) &&
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-team-pin-indicator',
        },
        /*#__PURE__*/ _react.default.createElement(PinIndicator, {
          message: message,
          t: t,
        }),
      ),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'message-team',
        className: 'str-chat__message-team str-chat__message-team--'
          .concat(firstGroupStyle, ' str-chat__message-team--')
          .concat(
            message === null || message === void 0 ? void 0 : message.type,
            ' ',
          )
          .concat(threadList ? 'thread-list' : '', ' str-chat__message-team--')
          .concat(
            message === null || message === void 0 ? void 0 : message.status,
            ' ',
          )
          .concat(
            message !== null && message !== void 0 && message.pinned
              ? 'pinned-message'
              : '',
          ),
        ref: messageWrapperRef,
      },
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-team-meta',
        },
        firstGroupStyle === 'top' ||
          firstGroupStyle === 'single' ||
          initialMessage
          ? /*#__PURE__*/ _react.default.createElement(Avatar, {
              image:
                message === null || message === void 0
                  ? void 0
                  : (_message$user4 = message.user) === null ||
                    _message$user4 === void 0
                  ? void 0
                  : _message$user4.image,
              name:
                (message === null || message === void 0
                  ? void 0
                  : (_message$user5 = message.user) === null ||
                    _message$user5 === void 0
                  ? void 0
                  : _message$user5.name) ||
                (message === null || message === void 0
                  ? void 0
                  : (_message$user6 = message.user) === null ||
                    _message$user6 === void 0
                  ? void 0
                  : _message$user6.id),
              size: 40,
              onClick: onUserClick,
              onMouseOver: onUserHover,
            })
          : /*#__PURE__*/ _react.default.createElement('div', {
              'data-testid': 'team-meta-spacer',
              style: {
                width: 40,
                marginRight: 0,
              },
            }),
        /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
          message: message,
          tDateTimeParser: props.tDateTimeParser,
          formatDate: formatDate,
        }),
      ),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-team-group',
        },
        message &&
          (firstGroupStyle === 'top' ||
            firstGroupStyle === 'single' ||
            initialMessage) &&
          /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              'data-testid': 'message-team-author',
              className: 'str-chat__message-team-author',
              onClick: onUserClick,
            },
            /*#__PURE__*/ _react.default.createElement(
              'strong',
              null,
              ((_message$user7 = message.user) === null ||
              _message$user7 === void 0
                ? void 0
                : _message$user7.name) ||
                ((_message$user8 = message.user) === null ||
                _message$user8 === void 0
                  ? void 0
                  : _message$user8.id),
            ),
            message.type === 'error' &&
              /*#__PURE__*/ _react.default.createElement(
                'div',
                {
                  className: 'str-chat__message-team-error-header',
                },
                t('Only visible to you'),
              ),
          ),
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            'data-testid': 'message-team-content',
            className: 'str-chat__message-team-content str-chat__message-team-content--'
              .concat(firstGroupStyle, ' str-chat__message-team-content--')
              .concat(
                (message === null || message === void 0
                  ? void 0
                  : message.text) === ''
                  ? 'image'
                  : 'text',
              ),
          },
          !initialMessage &&
            message &&
            message.status !== 'sending' &&
            message.status !== 'failed' &&
            message.type !== 'system' &&
            message.type !== 'ephemeral' &&
            message.type !== 'error' &&
            /*#__PURE__*/ _react.default.createElement(
              'div',
              {
                'data-testid': 'message-team-actions',
                className: 'str-chat__message-team-actions',
              },
              message &&
                showDetailedReactions &&
                /*#__PURE__*/ _react.default.createElement(ReactionSelector, {
                  handleReaction: propHandleReaction || handleReaction,
                  latest_reactions: message.latest_reactions,
                  reaction_counts: message.reaction_counts || undefined,
                  own_reactions: message.own_reactions,
                  detailedView: true,
                  ref: reactionSelectorRef,
                }),
              isReactionEnabled &&
                /*#__PURE__*/ _react.default.createElement(
                  'span',
                  {
                    'data-testid': 'message-team-reaction-icon',
                    title: 'Reactions',
                    onClick: onReactionListClick,
                  },
                  /*#__PURE__*/ _react.default.createElement(
                    _icons.ReactionIcon,
                    null,
                  ),
                ),
              !threadList &&
                (channelConfig === null || channelConfig === void 0
                  ? void 0
                  : channelConfig.replies) !== false &&
                /*#__PURE__*/ _react.default.createElement(
                  'span',
                  {
                    'data-testid': 'message-team-thread-icon',
                    title: 'Start a thread',
                    onClick: propHandleOpenThread || handleOpenThread,
                  },
                  /*#__PURE__*/ _react.default.createElement(
                    _icons.ThreadIcon,
                    null,
                  ),
                ),
              message &&
                getMessageActions &&
                getMessageActions().length > 0 &&
                /*#__PURE__*/ _react.default.createElement(
                  _MessageActions.MessageActions,
                  {
                    addNotification: props.addNotification,
                    message: message,
                    getMessageActions: props.getMessageActions,
                    messageListRect: props.messageListRect,
                    messageWrapperRef: messageWrapperRef,
                    setEditingState: setEdit,
                    getMuteUserSuccessNotification:
                      props.getMuteUserSuccessNotification,
                    getMuteUserErrorNotification:
                      props.getMuteUserErrorNotification,
                    getFlagMessageErrorNotification:
                      props.getFlagMessageErrorNotification,
                    getFlagMessageSuccessNotification:
                      props.getFlagMessageSuccessNotification,
                    handleFlag: props.handleFlag,
                    handleMute: props.handleMute,
                    handleEdit: props.handleEdit,
                    handleDelete: props.handleDelete,
                    handlePin: props.handlePin,
                    customWrapperClass: '',
                    inline: true,
                  },
                ),
            ),
          message &&
            /*#__PURE__*/ _react.default.createElement(
              'span',
              {
                'data-testid': 'message-team-message',
                className: (0, _utils.isOnlyEmojis)(message.text)
                  ? 'str-chat__message-team-text--is-emoji'
                  : '',
                onMouseOver: onMentionsHover,
                onClick: onMentionsClick,
              },
              unsafeHTML && message.html
                ? /*#__PURE__*/ _react.default.createElement('div', {
                    dangerouslySetInnerHTML: {
                      __html: message.html,
                    },
                  })
                : messageText,
            ),
          (message === null || message === void 0 ? void 0 : message.mml) &&
            /*#__PURE__*/ _react.default.createElement(_MML.MML, {
              source: message.mml,
              actionHandler: handleAction,
              align: 'left',
            }),
          message &&
            message.text === '' &&
            /*#__PURE__*/ _react.default.createElement(MessageTeamAttachments, {
              Attachment: props.Attachment,
              message: message,
              handleAction: propHandleAction || handleAction,
            }),
          (message === null || message === void 0
            ? void 0
            : message.latest_reactions) &&
            message.latest_reactions.length !== 0 &&
            message.text !== '' &&
            isReactionEnabled &&
            /*#__PURE__*/ _react.default.createElement(ReactionsList, {
              reaction_counts: message.reaction_counts || undefined,
              handleReaction: propHandleReaction || handleReaction,
              reactions: message.latest_reactions,
              own_reactions: message.own_reactions,
            }),
          (message === null || message === void 0 ? void 0 : message.status) ===
            'failed' &&
            /*#__PURE__*/ _react.default.createElement(
              'button',
              {
                'data-testid': 'message-team-failed',
                className: 'str-chat__message-team-failed',
                onClick: function onClick() {
                  if (message.status === 'failed' && retry) {
                    // FIXME: type checking fails here because in the case of a failed message,
                    // `message` is of type Client.Message (i.e. request object)
                    // instead of Client.MessageResponse (i.e. server response object)
                    // @ts-expect-error
                    retry(message);
                  }
                },
              },
              /*#__PURE__*/ _react.default.createElement(
                _icons.ErrorIcon,
                null,
              ),
              t('Message failed. Click to try again.'),
            ),
        ),
        /*#__PURE__*/ _react.default.createElement(MessageTeamStatus, {
          Avatar: Avatar,
          readBy: props.readBy,
          message: message,
          threadList: threadList,
          lastReceivedId: props.lastReceivedId,
          t: propT,
        }),
        message &&
          message.text !== '' &&
          message.attachments &&
          /*#__PURE__*/ _react.default.createElement(MessageTeamAttachments, {
            Attachment: props.Attachment,
            message: message,
            handleAction: propHandleAction || handleAction,
          }),
        (message === null || message === void 0
          ? void 0
          : message.latest_reactions) &&
          message.latest_reactions.length !== 0 &&
          message.text === '' &&
          isReactionEnabled &&
          /*#__PURE__*/ _react.default.createElement(ReactionsList, {
            reaction_counts: message.reaction_counts || undefined,
            handleReaction: propHandleReaction || handleReaction,
            reactions: message.latest_reactions,
            own_reactions: message.own_reactions,
          }),
        !threadList &&
          message &&
          /*#__PURE__*/ _react.default.createElement(
            _MessageRepliesCountButton.default,
            {
              onClick: propHandleOpenThread || handleOpenThread,
              reply_count: message.reply_count,
            },
          ),
      ),
    ),
  );
};
/** @type {(props: import('types').MessageTeamStatusProps) => React.ReactElement | null} */

var MessageTeamStatus = function MessageTeamStatus(props) {
  var _props$Avatar2 = props.Avatar,
    Avatar = _props$Avatar2 === void 0 ? _Avatar.Avatar : _props$Avatar2,
    readBy = props.readBy,
    message = props.message,
    threadList = props.threadList,
    lastReceivedId = props.lastReceivedId,
    propT = props.t;

  var _useContext3 = (0, _react.useContext)(_context.ChannelContext),
    client = _useContext3.client;

  var _useContext4 = (0, _react.useContext)(_context.TranslationContext),
    contextT = _useContext4.t;

  var t = propT || contextT;

  var _useUserRole = (0, _hooks.useUserRole)(message),
    isMyMessage = _useUserRole.isMyMessage;

  if (
    !isMyMessage ||
    (message === null || message === void 0 ? void 0 : message.type) === 'error'
  ) {
    return null;
  }

  var justReadByMe =
    readBy &&
    (client === null || client === void 0 ? void 0 : client.user) &&
    readBy.length === 1 &&
    readBy[0] &&
    readBy[0].id === client.user.id;

  if (message && message.status === 'sending') {
    return /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        className: 'str-chat__message-team-status',
        'data-testid': 'message-team-sending',
      },
      /*#__PURE__*/ _react.default.createElement(
        _Tooltip.Tooltip,
        null,
        t && t('Sending...'),
      ),
      /*#__PURE__*/ _react.default.createElement(
        _Loading.LoadingIndicator,
        null,
      ),
    );
  }

  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    var lastReadUser = readBy.filter(function (item) {
      return (
        item &&
        (client === null || client === void 0 ? void 0 : client.user) &&
        item.id !== client.user.id
      );
    })[0];
    return /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        className: 'str-chat__message-team-status',
      },
      /*#__PURE__*/ _react.default.createElement(
        _Tooltip.Tooltip,
        null,
        (0, _utils2.getReadByTooltipText)(readBy, t, client),
      ),
      /*#__PURE__*/ _react.default.createElement(Avatar, {
        name:
          lastReadUser === null || lastReadUser === void 0
            ? void 0
            : lastReadUser.name,
        image:
          lastReadUser === null || lastReadUser === void 0
            ? void 0
            : lastReadUser.image,
        size: 15,
      }),
      readBy.length - 1 > 1 &&
        /*#__PURE__*/ _react.default.createElement(
          'span',
          {
            'data-testid': 'message-team-read-by-count',
            className: 'str-chat__message-team-status-number',
          },
          readBy.length - 1,
        ),
    );
  }

  if (
    message &&
    message.status === 'received' &&
    message.id === lastReceivedId &&
    !threadList
  ) {
    return /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        'data-testid': 'message-team-received',
        className: 'str-chat__message-team-status',
      },
      /*#__PURE__*/ _react.default.createElement(
        _Tooltip.Tooltip,
        null,
        t && t('Delivered'),
      ),
      /*#__PURE__*/ _react.default.createElement(
        _icons.DeliveredCheckIcon,
        null,
      ),
    );
  }

  return null;
};
/** @type {(props: import('types').MessageTeamAttachmentsProps) => React.ReactElement | null} Typescript syntax */

var MessageTeamAttachments = function MessageTeamAttachments(props) {
  var _props$Attachment = props.Attachment,
    Attachment =
      _props$Attachment === void 0 ? _Attachment.Attachment : _props$Attachment,
    message = props.message,
    handleAction = props.handleAction;

  if (
    message !== null &&
    message !== void 0 &&
    message.attachments &&
    Attachment
  ) {
    return /*#__PURE__*/ _react.default.createElement(Attachment, {
      attachments: message.attachments,
      actionHandler: handleAction,
    });
  }

  return null;
};

MessageTeam.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message:
    /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */
    _propTypes.default.object.isRequired,

  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  Attachment:
    /** @type {PropTypes.Validator<React.ElementType<import('types').WrapperAttachmentUIComponentProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar:
    /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component to override default edit message input
   *
   * Defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.js)
   * */
  EditMessageInput:
    /** @type {PropTypes.Validator<React.FC<import("types").MessageInputProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component to override default pinned message indicator
   *
   * Defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icon.js)
   * */
  PinIndicator:
    /** @type {PropTypes.Validator<React.FC<import("types").PinIndicatorProps>>} */
    _propTypes.default.elementType,

  /**
   *
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   * */
  Message:
    /** @type {PropTypes.Validator<React.ElementType<import('types').MessageUIComponentProps>>} */
    _propTypes.default.oneOfType([
      _propTypes.default.node,
      _propTypes.default.func,
      _propTypes.default.object,
    ]),

  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: _propTypes.default.bool,

  /** Client object */
  client:
    /** @type {PropTypes.Validator<import('stream-chat').StreamChat>} */
    _propTypes.default.object,

  /** If its parent message in thread. */
  initialMessage: _propTypes.default.bool,

  /** Channel config object */
  channelConfig:
    /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */
    _propTypes.default.object,

  /** If component is in thread list */
  threadList: _propTypes.default.bool,

  /** Function to open thread on current message */
  handleOpenThread: _propTypes.default.func,

  /** If the message is in edit state */
  editing: _propTypes.default.bool,

  /** Function to exit edit state */
  clearEditingState: _propTypes.default.func,

  /** Returns true if message belongs to current user */
  isMyMessage: _propTypes.default.func,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: _propTypes.default.func,

  /**
   * Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'react', 'reply']
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   * */
  getMessageActions:
    /** @type {PropTypes.Validator<() => Array<string>>} */
    _propTypes.default.func,

  /**
   * Function to publish updates on message to channel
   *
   * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
   * */
  updateMessage: _propTypes.default.func,

  /**
   * Reattempt sending a message
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
   */
  handleRetry: _propTypes.default.func,

  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   */
  handleReaction: _propTypes.default.func,

  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector:
    /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionSelectorProps>>} */
    _propTypes.default.elementType,

  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList:
    /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionsListProps>>} */
    _propTypes.default.elementType,

  /** DOMRect object for parent MessageList component */
  messageListRect:
    /** @type {PropTypes.Validator<DOMRect>} */
    _propTypes.default.object,

  /**
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   */
  handleAction: _propTypes.default.func,

  /**
   * Handler for pinning a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handlePin: _propTypes.default.func,

  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   */
  onMentionsHoverMessage: _propTypes.default.func,

  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
   */
  onMentionsClickMessage: _propTypes.default.func,

  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   */
  onUserClick: _propTypes.default.func,

  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   */
  onUserHover: _propTypes.default.func,

  /** Position of message in group. Possible values: top, bottom, middle, single */
  groupStyles: _propTypes.default.array,

  /**
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted:
    /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */
    _propTypes.default.elementType,
};

var _default = /*#__PURE__*/ _react.default.memo(
  MessageTeam,
  _utils2.areMessagePropsEqual,
);

exports.default = _default;
