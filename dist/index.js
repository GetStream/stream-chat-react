'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extends = _interopDefault(require('@babel/runtime/helpers/extends'));
var React = require('react');
var React__default = _interopDefault(React);
var streamChat = require('stream-chat');
var Dayjs = _interopDefault(require('dayjs'));
var LocalizedFormat = _interopDefault(require('dayjs/plugin/localizedFormat'));
var _defineProperty = _interopDefault(require('@babel/runtime/helpers/defineProperty'));
var emojiRegex = _interopDefault(require('emoji-regex'));
var ReactMarkdown = _interopDefault(require('react-markdown/with-html'));
var data = _interopDefault(require('emoji-mart/data/all.json'));
var linkify = require('linkifyjs/lib/linkify');
var _regeneratorRuntime = _interopDefault(require('@babel/runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('@babel/runtime/helpers/asyncToGenerator'));
var _classCallCheck = _interopDefault(require('@babel/runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('@babel/runtime/helpers/createClass'));
var i18n = _interopDefault(require('i18next'));
var calendar = _interopDefault(require('dayjs/plugin/calendar'));
var updateLocale = _interopDefault(require('dayjs/plugin/updateLocale'));
var localeData = _interopDefault(require('dayjs/plugin/localeData'));
var relativeTime = _interopDefault(require('dayjs/plugin/relativeTime'));
require('dayjs/locale/nl');
require('dayjs/locale/ru');
require('dayjs/locale/tr');
require('dayjs/locale/fr');
require('dayjs/locale/hi');
require('dayjs/locale/it');
require('dayjs/locale/en');
var _objectWithoutProperties = _interopDefault(require('@babel/runtime/helpers/objectWithoutProperties'));
var DefaultMedia = _interopDefault(require('react-player'));
var PropTypes = _interopDefault(require('prop-types'));
var _slicedToArray = _interopDefault(require('@babel/runtime/helpers/slicedToArray'));
var sanitizeUrl = require('@braintree/sanitize-url');
var reactFileUtils = require('react-file-utils');
var prettybytes = _interopDefault(require('pretty-bytes'));
var Carousel = require('react-images');
var Carousel__default = _interopDefault(Carousel);
var _assertThisInitialized = _interopDefault(require('@babel/runtime/helpers/assertThisInitialized'));
var _inherits = _interopDefault(require('@babel/runtime/helpers/inherits'));
var _possibleConstructorReturn = _interopDefault(require('@babel/runtime/helpers/possibleConstructorReturn'));
var _getPrototypeOf = _interopDefault(require('@babel/runtime/helpers/getPrototypeOf'));
var getCaretCoordinates = _interopDefault(require('textarea-caret'));
var CustomEvent = _interopDefault(require('custom-event'));
var reactIs = require('react-is');
var Textarea = _interopDefault(require('react-textarea-autosize'));
var uuid = require('uuid');
var debounce = _interopDefault(require('lodash.debounce'));
var throttle = _interopDefault(require('lodash.throttle'));
var _toConsumableArray = _interopDefault(require('@babel/runtime/helpers/toConsumableArray'));
var emojiMart = require('emoji-mart');
var Immutable = _interopDefault(require('seamless-immutable'));
var deepequal = _interopDefault(require('react-fast-compare'));
var uniqBy = _interopDefault(require('lodash.uniqby'));
var reactVirtuoso = require('react-virtuoso');

/**
 * @typedef {import('../types').ChatContextValue} ChatContextProps
 */

var ChatContext = /*#__PURE__*/React__default.createContext(
/** @type {ChatContextProps} */
{
  client: new streamChat.StreamChat(''),
  setActiveChannel: function setActiveChannel() {
    return null;
  }
});
/**
 * @function
 * @template P
 * @param {React.ComponentType<P>} OriginalComponent
 * @returns {React.ComponentType<Exclude<P, ChatContextProps>>}
 */

function withChatContext(OriginalComponent) {
  /** @param {Exclude<P, ChatContextProps>} props */
  var ContextAwareComponent = function ContextComponent(props) {
    return /*#__PURE__*/React__default.createElement(ChatContext.Consumer, null, function (context) {
      return /*#__PURE__*/React__default.createElement(OriginalComponent, _extends({}, context, props));
    });
  };

  ContextAwareComponent.displayName = (OriginalComponent.displayName || OriginalComponent.name || 'Component').replace('Base', '');
  return ContextAwareComponent;
}

/**
 * @typedef {import('../types').ChannelContextValue} ChannelContextProps
 */

var ChannelContext = /*#__PURE__*/React__default.createContext(
/** @type {ChannelContextProps} */
{});
/**
 * @function
 * @template P
 * @param { React.ComponentType<P> } OriginalComponent
 * @returns {React.ComponentType<Exclude<P, ChannelContextProps>>}
 */

function withChannelContext(OriginalComponent) {
  /** @param {Exclude<P, ChannelContextProps>} props */
  var ContextAwareComponent = function ContextComponent(props) {
    return /*#__PURE__*/React__default.createElement(ChannelContext.Consumer, null, function (context) {
      return /*#__PURE__*/React__default.createElement(OriginalComponent, _extends({}, context, props));
    });
  };

  ContextAwareComponent.displayName = (OriginalComponent.displayName || OriginalComponent.name || 'Component').replace('Base', '');
  return ContextAwareComponent;
}

Dayjs.extend(LocalizedFormat);
/**
 * @typedef {Required<import('../types').TranslationContextValue>} TranslationContextProps
 */

var TranslationContext = /*#__PURE__*/React__default.createContext(
/** @type {TranslationContextProps} */
{
  t:
  /** @param {string} key */
  function t(key) {
    return key;
  },
  tDateTimeParser: function tDateTimeParser(input) {
    return Dayjs(input);
  }
});
/**
 * @function
 * @template P
 * @param {React.ComponentType<P>} OriginalComponent
 * @returns {React.ComponentType<Exclude<P, TranslationContextProps>>}
 */

function withTranslationContext(OriginalComponent) {
  /** @param {Exclude<P, TranslationContextProps>} props */
  var ContextAwareComponent = function ContextComponent(props) {
    return /*#__PURE__*/React__default.createElement(TranslationContext.Consumer, null, function (context) {
      return /*#__PURE__*/React__default.createElement(OriginalComponent, _extends({}, context, props));
    });
  };

  ContextAwareComponent.displayName = (OriginalComponent.displayName || OriginalComponent.name || 'Component').replace('Base', '');
  return ContextAwareComponent;
}

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var emojiSetDef = {
  spriteUrl: 'https://getstream.imgix.net/images/emoji-sprite.png',
  size: 20,
  sheetColumns: 2,
  sheetRows: 3,
  sheetSize: 64
};
var commonEmoji = {
  emoticons: [],
  short_names: [],
  custom: true
};
/** @type {import("types").MinimalEmojiInterface[]} */

var defaultMinimalEmojis = [_objectSpread(_objectSpread({
  id: 'like',
  name: 'like',
  colons: ':+1:',
  sheet_x: 0,
  sheet_y: 0
}, commonEmoji), emojiSetDef), _objectSpread(_objectSpread({
  id: 'love',
  name: 'love',
  colons: ':heart:',
  sheet_x: 1,
  sheet_y: 2
}, commonEmoji), emojiSetDef), _objectSpread(_objectSpread({
  id: 'haha',
  name: 'haha',
  colons: ':joy:',
  sheet_x: 1,
  sheet_y: 0
}, commonEmoji), emojiSetDef), _objectSpread(_objectSpread({
  id: 'wow',
  name: 'wow',
  colons: ':astonished:',
  sheet_x: 0,
  sheet_y: 2
}, commonEmoji), emojiSetDef), _objectSpread(_objectSpread({
  id: 'sad',
  name: 'sad',
  colons: ':pensive:',
  sheet_x: 0,
  sheet_y: 1
}, commonEmoji), emojiSetDef), _objectSpread(_objectSpread({
  id: 'angry',
  name: 'angry',
  colons: ':angry:',
  sheet_x: 1,
  sheet_y: 1
}, commonEmoji), emojiSetDef)];
var d = Object.assign({}, data);
d.emojis = {}; // use this only for small lists like in ReactionSelector

var emojiData = d;
var isOnlyEmojis = function isOnlyEmojis(text) {
  if (!text) return false;
  var noEmojis = text.replace(emojiRegex(), '');
  var noSpace = noEmojis.replace(/[\s\n]/gm, '');
  return !noSpace;
};
var isPromise = function isPromise(thing) {
  return thing && typeof thing.then === 'function';
};
var byDate = function byDate(a, b) {
  return a.created_at - b.created_at;
}; // https://stackoverflow.com/a/29234240/7625485

/**
 * @deprecated This function is deprecated and will be removed in future major release.
 * @param {*} dict
 * @param {*} currentUserId
 */

var formatArray = function formatArray(dict, currentUserId) {
  var arr2 = Object.keys(dict);
  var arr3 = [];
  arr2.forEach(function (item, i) {
    if (currentUserId === dict[arr2[i]].user.id) {
      return;
    }

    arr3.push(dict[arr2[i]].user.name || dict[arr2[i]].user.id);
  });
  var outStr = '';

  if (arr3.length === 1) {
    outStr = arr3[0] + ' is typing...';
  } else if (arr3.length === 2) {
    //joins all with "and" but =no commas
    //example: "bob and sam"
    outStr = arr3.join(' and ') + ' are typing...';
  } else if (arr3.length > 2) {
    //joins all with commas, but last one gets ", and" (oxford comma!)
    //example: "bob, joe, and sam"
    outStr = arr3.slice(0, -1).join(', ') + ', and ' + arr3.slice(-1) + ' are typing...';
  }

  return outStr;
};
var allowedMarkups = ['html', 'root', 'text', 'break', 'paragraph', 'emphasis', 'strong', 'link', 'list', 'listItem', 'code', 'inlineCode', 'blockquote', 'delete'];

var matchMarkdownLinks = function matchMarkdownLinks(message) {
  var regexMdLinks = /\[([^\[]+)\](\(.*\))/gm;
  var matches = message.match(regexMdLinks);
  var singleMatch = /\[([^\[]+)\]\((.*)\)/;
  var links = matches ? matches.map(function (match) {
    return singleMatch.exec(match)[2];
  }) : [];
  return links;
};

var truncate = function truncate(input, length) {
  var end = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '...';

  if (input.length > length) {
    return "".concat(input.substring(0, length - end.length)).concat(end);
  }

  return input;
};
var renderText = function renderText(text, mentioned_users) {
  // take the @ mentions and turn them into markdown?
  // translate links
  if (!text) return null;
  var newText = text;
  var markdownLinks = matchMarkdownLinks(newText); // extract all valid links/emails within text and replace it with proper markup

  linkify.find(newText).forEach(function (_ref) {
    var type = _ref.type,
        href = _ref.href,
        value = _ref.value;
    // check if message is already  markdown
    var noParsingNeeded = markdownLinks && markdownLinks.filter(function (text) {
      return text.indexOf(href) !== -1;
    });
    if (noParsingNeeded.length > 0) return;
    var displayLink = type === 'email' ? value : truncate(value.replace(/(http(s?):\/\/)?(www\.)?/, ''), 20);
    newText = newText.replace(value, "[".concat(displayLink, "](").concat(encodeURI(href), ")"));
  });

  if (mentioned_users && mentioned_users.length) {
    for (var i = 0; i < mentioned_users.length; i++) {
      var username = mentioned_users[i].name || mentioned_users[i].id;
      var mkdown = "**@".concat(username, "**");
      var re = new RegExp("@".concat(username), 'g');
      newText = newText.replace(re, mkdown);
    }
  }

  return /*#__PURE__*/React__default.createElement(ReactMarkdown, {
    allowedTypes: allowedMarkups,
    source: newText,
    linkTarget: "_blank",
    plugins: [],
    escapeHtml: true,
    skipHtml: false,
    unwrapDisallowed: true,
    transformLinkUri: function transformLinkUri(uri) {
      if (uri.startsWith('app://')) {
        return uri;
      } else {
        return ReactMarkdown.uriTransformer(uri);
      }
    }
  });
}; // https://stackoverflow.com/a/6860916/2570866

function generateRandomId() {
  // prettier-ignore
  return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
}

function S4() {
  return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
}

var smartRender = function smartRender(ElementOrComponentOrLiteral, props, fallback) {
  if (ElementOrComponentOrLiteral === undefined) {
    ElementOrComponentOrLiteral = fallback;
  }

  if ( /*#__PURE__*/React__default.isValidElement(ElementOrComponentOrLiteral)) {
    // Flow cast through any, to make flow believe it's a React.Element
    var element = ElementOrComponentOrLiteral; // eslint-disable-line

    return element;
  } // Flow cast through any to remove React.Element after previous check


  var ComponentOrLiteral = ElementOrComponentOrLiteral;

  if (typeof ComponentOrLiteral === 'string' || typeof ComponentOrLiteral === 'number' || typeof ComponentOrLiteral === 'boolean' || ComponentOrLiteral == null) {
    return ComponentOrLiteral;
  }

  return /*#__PURE__*/React__default.createElement(ComponentOrLiteral, props);
};
var filterEmoji = function filterEmoji(emoji) {
  if (emoji.name === 'White Smiling Face' || emoji.name === 'White Frowning Face') {
    return false;
  }

  return true;
};
var getReadByTooltipText = function getReadByTooltipText(users, t, client) {
  var outStr = ''; // first filter out client user, so restLength won't count it

  var otherUsers = users.filter(function (item) {
    return item && item.id !== client.user.id;
  }).map(function (item) {
    return item.name || item.id;
  });
  var slicedArr = otherUsers.slice(0, 5);
  var restLength = otherUsers.length - slicedArr.length;

  if (slicedArr.length === 1) {
    outStr = slicedArr[0] + ' ';
  } else if (slicedArr.length === 2) {
    //joins all with "and" but =no commas
    //example: "bob and sam"
    outStr = t('{{ firstUser }} and {{ secondUser }}', {
      firstUser: slicedArr[0],
      secondUser: slicedArr[1]
    });
  } else if (slicedArr.length > 2) {
    //joins all with commas, but last one gets ", and" (oxford comma!)
    //example: "bob, joe, sam and 4 more"
    if (restLength === 0) {
      // mutate slicedArr to remove last user to display it separately
      var lastUser = slicedArr.splice(slicedArr.length - 2, 1);
      outStr = t('{{ commaSeparatedUsers }}, and {{ lastUser }}', {
        commaSeparatedUsers: slicedArr.join(', '),
        lastUser
      });
    } else {
      outStr = t('{{ commaSeparatedUsers }} and {{ moreCount }} more', {
        commaSeparatedUsers: slicedArr.join(', '),
        moreCount: restLength
      });
    }
  }

  return outStr;
};

var Cancel = "Cancel";
var Close = "Close";
var Delete = "Delete";
var Delivered = "Delivered";
var Flag = "Flag";
var Mute = "Mute";
var Send = "Send";
var Thread = "Thread";
var Unmute = "Unmute";
var live = "live";
var enTranslations = {
	"1 reply": "1 reply",
	"Attach files": "Attach files",
	Cancel: Cancel,
	"Channel Missing": "Channel Missing",
	Close: Close,
	"Connection failure, reconnecting now...": "Connection failure, reconnecting now...",
	Delete: Delete,
	Delivered: Delivered,
	"Edit Message": "Edit Message",
	"Empty message...": "Empty message...",
	"Error adding flag: Either the flag already exist or there is issue with network connection ...": "Error adding flag: Either the flag already exist or there is issue with network connection ...",
	"Error connecting to chat, refresh the page to try again.": "Error connecting to chat, refresh the page to try again.",
	"Error muting a user ...": "Error muting a user ...",
	"Error unmuting a user ...": "Error unmuting a user ...",
	"Error · Unsent": "Error · Unsent",
	"Error: {{ errorMessage }}": "Error: {{ errorMessage }}",
	Flag: Flag,
	"Message Failed · Click to try again": "Message Failed · Click to try again",
	"Message deleted": "Message deleted",
	"Message failed. Click to try again.": "Message failed. Click to try again.",
	"Message has been successfully flagged": "Message has been successfully flagged",
	Mute: Mute,
	"New Messages!": "New Messages!",
	"Nothing yet...": "Nothing yet...",
	"Only visible to you": "Only visible to you",
	"Open emoji picker": "Open emoji picker",
	"Pick your emoji": "Pick your emoji",
	Send: Send,
	"Sending...": "Sending...",
	"Start of a new thread": "Start of a new thread",
	"This message was deleted...": "This message was deleted...",
	Thread: Thread,
	"Type your message": "Type your message",
	Unmute: Unmute,
	"You have no channels currently": "You have no channels currently",
	live: live,
	"this content could not be displayed": "this content could not be displayed",
	"{{ commaSeparatedUsers }} and {{ lastUser }} are typing...": "{{ commaSeparatedUsers }} and {{ lastUser }} are typing...",
	"{{ commaSeparatedUsers }} and {{ moreCount }} more": "{{ commaSeparatedUsers }} and {{ moreCount }} more",
	"{{ commaSeparatedUsers }}, and {{ lastUser }}": "{{ commaSeparatedUsers }}, and {{ lastUser }}",
	"{{ firstUser }} and {{ secondUser }}": "{{ firstUser }} and {{ secondUser }}",
	"{{ firstUser }} and {{ secondUser }} are typing...": "{{ firstUser }} and {{ secondUser }} are typing...",
	"{{ imageCount }} more": "{{ imageCount }} more",
	"{{ memberCount }} members": "{{ memberCount }} members",
	"{{ replyCount }} replies": "{{ replyCount }} replies",
	"{{ user }} has been muted": "{{ user }} has been muted",
	"{{ user }} has been unmuted": "{{ user }} has been unmuted",
	"{{ user }} is typing...": "{{ user }} is typing...",
	"{{ watcherCount }} online": "{{ watcherCount }} online",
	"🏙 Attachment...": "🏙 Attachment..."
};

var Cancel$1 = "Annuleer";
var Close$1 = "Sluit";
var Delete$1 = "Verwijder";
var Delivered$1 = "Afgeleverd";
var Flag$1 = "Markeer";
var Mute$1 = "Mute";
var Send$1 = "Verstuur";
var Thread$1 = "Draadje";
var Unmute$1 = "Unmute";
var live$1 = "live";
var nlTranslations = {
	"1 reply": "1 antwoord",
	"Attach files": "Bijlage toevoegen",
	Cancel: Cancel$1,
	"Channel Missing": "Kanaal niet gevonden",
	Close: Close$1,
	"Connection failure, reconnecting now...": "Probleem met de verbinding, opnieuw verbinding maken...",
	Delete: Delete$1,
	Delivered: Delivered$1,
	"Edit Message": "Pas bericht aan",
	"Empty message...": "Leeg bericht...",
	"Error adding flag: Either the flag already exist or there is issue with network connection ...": "Fout bij het markeren: of het bericht is al gemarkeerd of er is een probleem met de netwerk verbinding",
	"Error connecting to chat, refresh the page to try again.": "Fout bij het verbinden, ververs de pagina om nogmaals te proberen",
	"Error muting a user ...": "Fout bij het muten van de gebruiker",
	"Error unmuting a user ...": "Fout bij het unmuten van de gebruiker",
	"Error · Unsent": "Error: · niet verzonden",
	"Error: {{ errorMessage }}": "Error: {{ errorMessage }}",
	Flag: Flag$1,
	"Message Failed · Click to try again": "Bericht mislukt, klik om het nogmaals te proberen",
	"Message deleted": "Bericht verwijderd",
	"Message failed. Click to try again.": "Bericht mislukt, klik om het nogmaals te proberen",
	"Message has been successfully flagged": "Bericht is succesvol gemarkeerd",
	Mute: Mute$1,
	"New Messages!": "Nieuwe Berichten!",
	"Nothing yet...": "Nog niets ...",
	"Only visible to you": "Alleen zichtbaar voor jou",
	"Open emoji picker": "Open emojipicker",
	"Pick your emoji": "Kies je emoji",
	Send: Send$1,
	"Sending...": "Aan het verzenden...",
	"Start of a new thread": "Begin van een nieuwe draadje",
	"This message was deleted...": "Dit bericht was verwijderd",
	Thread: Thread$1,
	"Type your message": "Type je bericht",
	Unmute: Unmute$1,
	"You have no channels currently": "Er zijn geen chats beschikbaar",
	live: live$1,
	"this content could not be displayed": "Deze inhoud kan niet weergegeven worden",
	"{{ commaSeparatedUsers }} and {{ lastUser }} are typing...": "{{ commaSeparatedUsers }} en {{ lastUser }} zijn aan het typen ...",
	"{{ commaSeparatedUsers }} and {{ moreCount }} more": "{{ commaSeparatedUsers }} en {{ moreCount }} meer",
	"{{ commaSeparatedUsers }}, and {{ lastUser }}": "{{ commaSeparatedUsers }} en {{ lastUser }}",
	"{{ firstUser }} and {{ secondUser }}": "{{ firstUser }} en {{ secondUser }}",
	"{{ firstUser }} and {{ secondUser }} are typing...": "{{ firstUser }} en {{ secondUser }} zijn aan het typen ...",
	"{{ imageCount }} more": "+{{ imageCount }}",
	"{{ memberCount }} members": "{{ memberCount }} deelnemers",
	"{{ replyCount }} replies": "{{ replyCount }} antwoorden",
	"{{ user }} has been muted": "{{ user }} is muted",
	"{{ user }} has been unmuted": "{{ user }} is unmuted",
	"{{ user }} is typing...": "{{ user }} is aan het typen...",
	"{{ watcherCount }} online": "{{ watcherCount }} online",
	"🏙 Attachment...": "🏙 Bijlage..."
};

var Cancel$2 = "Отмена";
var Close$2 = "Закрыть";
var Delete$2 = "Удалить";
var Delivered$2 = "Отправлено";
var Flag$2 = "Пожаловаться";
var Mute$2 = "Отключить уведомления";
var Send$2 = "Отправить";
var Thread$2 = "Ветка";
var Unmute$2 = "Включить уведомления";
var live$2 = "В прямом эфире";
var ruTranslations = {
	"1 reply": "1 ответ",
	"Attach files": "Прикрепить файлы",
	Cancel: Cancel$2,
	"Channel Missing": "Канал не найден",
	Close: Close$2,
	"Connection failure, reconnecting now...": "Ошибка соединения, переподключение...",
	Delete: Delete$2,
	Delivered: Delivered$2,
	"Edit Message": "Редактировать сообщение",
	"Empty message...": "Пустое сообщение...",
	"Error adding flag: Either the flag already exist or there is issue with network connection ...": "Ошибка добавления флага: флаг уже существует или ошибка подключения к сети...",
	"Error connecting to chat, refresh the page to try again.": "Ошибка подключения к чату, обновите страницу чтобы попробовать снова.",
	"Error muting a user ...": "Ошибка отключения уведомлений от пользователя...",
	"Error unmuting a user ...": "Ошибка включения уведомлений...",
	"Error · Unsent": "Ошибка · Не отправлено",
	"Error: {{ errorMessage }}": "Ошибка: {{ errorMessage }}",
	Flag: Flag$2,
	"Message Failed · Click to try again": "Ошибка отправки сообщения · Нажмите чтобы повторить",
	"Message deleted": "Сообщение удалено",
	"Message failed. Click to try again.": "Ошибка отправки сообщения · Нажмите чтобы повторить",
	"Message has been successfully flagged": "Жалоба на сообщение была принята",
	Mute: Mute$2,
	"New Messages!": "Новые сообщения!",
	"Nothing yet...": "Пока ничего нет...",
	"Only visible to you": "Только видно для вас",
	"Open emoji picker": "Выбрать emoji",
	"Pick your emoji": "Выберите свой emoji",
	Send: Send$2,
	"Sending...": "Отправка...",
	"Start of a new thread": "Начало новой ветки",
	"This message was deleted...": "Сообщение было удалено...",
	Thread: Thread$2,
	"Type your message": "Ваше сообщение",
	Unmute: Unmute$2,
	"You have no channels currently": "У вас нет каналов в данный момент",
	live: live$2,
	"this content could not be displayed": "Этот контент не может быть отображен в данный момент",
	"{{ commaSeparatedUsers }} and {{ lastUser }} are typing...": "{{ commaSeparatedUsers }} и {{ lastUser }} пишут...",
	"{{ commaSeparatedUsers }} and {{ moreCount }} more": "{{ commaSeparatedUsers }} и {{ moreCount }} еще",
	"{{ commaSeparatedUsers }}, and {{ lastUser }}": "{{ commaSeparatedUsers }} и {{ lastUser }}",
	"{{ firstUser }} and {{ secondUser }}": "{{ firstUser }} и {{ secondUser }}",
	"{{ firstUser }} and {{ secondUser }} are typing...": "{{ firstUser }} и {{ secondUser }} пишут...",
	"{{ imageCount }} more": "Ещё {{ imageCount }}",
	"{{ memberCount }} members": "{{ memberCount }} члены",
	"{{ replyCount }} replies": "{{ replyCount }} ответов",
	"{{ user }} has been muted": "Вы отписались от уведомлений от {{ user }}",
	"{{ user }} has been unmuted": "Уведомления от {{ user }} были включены",
	"{{ user }} is typing...": "{{ user }} пишет...",
	"{{ watcherCount }} online": "{{ watcherCount }} в сети",
	"🏙 Attachment...": "🏙 Вложение..."
};

var Cancel$3 = "İptal";
var Close$3 = "Kapat";
var Delete$3 = "Sil";
var Delivered$3 = "İletildi";
var Flag$3 = "Bayrak";
var Mute$3 = "Sessiz";
var Send$3 = "Gönder";
var Thread$3 = "Konu";
var Unmute$3 = "Sesini aç";
var live$3 = "canlı";
var trTranslations = {
	"1 reply": "1 cevap",
	"Attach files": "Dosya ekle",
	Cancel: Cancel$3,
	"Channel Missing": "Kanal bulunamıyor",
	Close: Close$3,
	"Connection failure, reconnecting now...": "Bağlantı hatası, tekrar bağlanılıyor...",
	Delete: Delete$3,
	Delivered: Delivered$3,
	"Edit Message": "Mesajı Düzenle",
	"Empty message...": "Boş mesaj...",
	"Error adding flag: Either the flag already exist or there is issue with network connection ...": "Bayraklama hatası: Bayrak zaten var veya bağlantı sorunlu",
	"Error connecting to chat, refresh the page to try again.": "Bağlantı hatası, sayfayı yenileyip tekrar deneyin.",
	"Error muting a user ...": "Kullanıcıyı sessize alırken hata oluştu ...",
	"Error unmuting a user ...": "Kullanıcının sesini açarken hata oluştu ...",
	"Error · Unsent": "Hata · Gönderilemedi",
	"Error: {{ errorMessage }}": "Hata: {{ errorMessage }}",
	Flag: Flag$3,
	"Message Failed · Click to try again": "Mesaj Başarısız · Tekrar denemek için tıklayın",
	"Message deleted": "Mesaj silindi",
	"Message failed. Click to try again.": "Mesaj başarısız oldu. Tekrar denemek için tıklayın",
	"Message has been successfully flagged": "Mesaj başarıyla bayraklandı",
	Mute: Mute$3,
	"New Messages!": "Yeni Mesajlar!",
	"Nothing yet...": "Şimdilik hiçbir şey...",
	"Only visible to you": "Sadece size görünür",
	"Open emoji picker": "Emoji klavyesini aç",
	"Pick your emoji": "Emoji seçin",
	Send: Send$3,
	"Sending...": "Gönderiliyor...",
	"Start of a new thread": "Yeni konunun başı",
	"This message was deleted...": "Bu mesaj silindi",
	Thread: Thread$3,
	"Type your message": "Mesajınızı yazın",
	Unmute: Unmute$3,
	"You have no channels currently": "Henüz kanalınız yok",
	live: live$3,
	"this content could not be displayed": "bu içerik gösterilemiyor",
	"{{ commaSeparatedUsers }} and {{ lastUser }} are typing...": "{{ commaSeparatedUsers }} ve {{ lastUser }} yazıyor...",
	"{{ commaSeparatedUsers }} and {{ moreCount }} more": "{{ commaSeparatedUsers }} ve {{ moreCount }} daha",
	"{{ commaSeparatedUsers }}, and {{ lastUser }}": "{{ commaSeparatedUsers }}, ve {{ lastUser }}",
	"{{ firstUser }} and {{ secondUser }}": "{{ firstUser }} ve {{ secondUser }}",
	"{{ firstUser }} and {{ secondUser }} are typing...": "{{ firstUser }} ve {{ secondUser }} yazıyor...",
	"{{ imageCount }} more": "{{ imageCount }} adet daha",
	"{{ memberCount }} members": "{{ memberCount }} üyeler",
	"{{ replyCount }} replies": "{{ replyCount }} cevaplar",
	"{{ user }} has been muted": "{{ user }} sessize alındı",
	"{{ user }} has been unmuted": "{{ user }} sesi açıldı",
	"{{ user }} is typing...": "{{ user }} yazıyor...",
	"{{ watcherCount }} online": "{{ watcherCount }} çevrimiçi",
	"🏙 Attachment...": "🏙 Ek..."
};

var Cancel$4 = "Annuler";
var Close$4 = "Fermer";
var Delete$4 = "Supprimer";
var Delivered$4 = "Publié";
var Flag$4 = "Signaler";
var Mute$4 = "Muet";
var Send$4 = "Envoyer";
var Thread$4 = "Fil de discussion";
var Unmute$4 = "Désactiver muet";
var live$4 = "en direct";
var frTranslations = {
	"1 reply": "1 réponse",
	"Attach files": "Pièces jointes",
	Cancel: Cancel$4,
	"Channel Missing": "Canal Manquant",
	Close: Close$4,
	"Connection failure, reconnecting now...": "Échec de la connexion, reconnexion en cours...",
	Delete: Delete$4,
	Delivered: Delivered$4,
	"Edit Message": "Éditer un message",
	"Empty message...": "Message vide...",
	"Error adding flag: Either the flag already exist or there is issue with network connection ...": "Erreur d'ajout du flag : le flag existe déjà ou vous rencontrez un problème de connexion au réseau ...",
	"Error connecting to chat, refresh the page to try again.": "Erreur de connexion au chat, rafraîchissez la page pour réessayer.",
	"Error muting a user ...": "Erreur de mise en sourdine d'un utilisateur ...",
	"Error unmuting a user ...": "Erreur de désactivation de la fonction sourdine pour un utilisateur ...",
	"Error · Unsent": "Erreur - Non envoyé",
	"Error: {{ errorMessage }}": "Erreur : {{ errorMessage }}",
	Flag: Flag$4,
	"Message Failed · Click to try again": "Échec de l'envoi du message - Cliquez pour réessayer",
	"Message deleted": "Message supprimé",
	"Message failed. Click to try again.": "Échec de l'envoi du message - Cliquez pour réessayer",
	"Message has been successfully flagged": "Le message a été signalé avec succès",
	Mute: Mute$4,
	"New Messages!": "Nouveaux Messages!",
	"Nothing yet...": "Aucun message...",
	"Only visible to you": "Visible uniquement pour vous",
	"Open emoji picker": "Ouvrez le sélecteur d'emoji",
	"Pick your emoji": "Choisissez votre emoji",
	Send: Send$4,
	"Sending...": "Envoi en cours...",
	"Start of a new thread": "Début d'un nouveau fil de discussion",
	"This message was deleted...": "Ce message a été supprimé...",
	Thread: Thread$4,
	"Type your message": "Saisissez votre message",
	Unmute: Unmute$4,
	"You have no channels currently": "Vous n'avez actuellement aucun canal",
	live: live$4,
	"this content could not be displayed": "ce contenu n'a pu être affiché",
	"{{ commaSeparatedUsers }} and {{ lastUser }} are typing...": "{{ commaSeparatedUsers }} et {{ lastUser }} sont en train d'écrire...",
	"{{ commaSeparatedUsers }} and {{ moreCount }} more": "{{ commaSeparatedUsers }} et {{ moreCount }} autres",
	"{{ commaSeparatedUsers }}, and {{ lastUser }}": "{{ commaSeparatedUsers }} et {{ lastUser }}",
	"{{ firstUser }} and {{ secondUser }}": "{{ firstUser }} et {{ secondUser }}",
	"{{ firstUser }} and {{ secondUser }} are typing...": "{{ firstUser }} et {{ secondUser }} sont en train d'écrire...",
	"{{ imageCount }} more": "{{ imageCount }} supplémentaires",
	"{{ memberCount }} members": "{{ memberCount }} membres",
	"{{ replyCount }} replies": "{{ replyCount }} réponses",
	"{{ user }} has been muted": "{{ user }} a été mis en sourdine",
	"{{ user }} has been unmuted": "{{ user }} n'est plus en sourdine",
	"{{ user }} is typing...": "{{ user }} est en train d'écrire...",
	"{{ watcherCount }} online": "{{ watcherCount }} en ligne",
	"🏙 Attachment...": "🏙 Pièce jointe..."
};

var Cancel$5 = "रद्द करें";
var Close$5 = "बंद करे";
var Delete$5 = "डिलीट";
var Delivered$5 = "पहुंच गया";
var Flag$5 = "फ्लैग करे";
var Mute$5 = "म्यूट करे";
var Send$5 = "भेजे";
var Thread$5 = "रिप्लाई थ्रेड";
var Unmute$5 = "अनम्यूट";
var live$5 = "लाइव";
var hiTranslations = {
	"1 reply": "1 रिप्लाई",
	"Attach files": "फाइल्स अटैच करे",
	Cancel: Cancel$5,
	"Channel Missing": "चैनल उपलब्ध नहीं है",
	Close: Close$5,
	"Connection failure, reconnecting now...": "कनेक्शन विफल रहा, अब पुनः कनेक्ट हो रहा है ...",
	Delete: Delete$5,
	Delivered: Delivered$5,
	"Edit Message": "मैसेज में बदलाव करे",
	"Empty message...": "खाली संदेश ...",
	"Error adding flag: Either the flag already exist or there is issue with network connection ...": "फ़ैल: या तो यह मैसेज के ऊपर पहले से फ्लैग है या तो आपके इंटरनेट कनेक्शन में कुछ परेशानी है",
	"Error connecting to chat, refresh the page to try again.": "चैट से कनेक्ट करने में त्रुटि, पेज को रिफ्रेश करें",
	"Error muting a user ...": "यूजर को म्यूट करने का प्रयास फेल हुआ",
	"Error unmuting a user ...": "यूजर को अनम्यूट करने का प्रयास फेल हुआ",
	"Error · Unsent": "फेल",
	"Error: {{ errorMessage }}": "फेल: {{ errorMessage }}",
	Flag: Flag$5,
	"Message Failed · Click to try again": "मैसेज फ़ैल - पुनः कोशिश करें",
	"Message deleted": "मैसेज हटा दिया गया",
	"Message failed. Click to try again.": "मैसेज फ़ैल - पुनः कोशिश करें",
	"Message has been successfully flagged": "मैसेज को फ्लैग कर दिया गया है",
	Mute: Mute$5,
	"New Messages!": "नए मैसेज!",
	"Nothing yet...": "कोई मैसेज नहीं है",
	"Only visible to you": "सिर्फ आपको दिखाई दे रहा है",
	"Open emoji picker": "इमोजी पिकर खोलिये",
	"Pick your emoji": "इमोजी चूस करे",
	Send: Send$5,
	"Sending...": "भेजा जा रहा है",
	"Start of a new thread": "एक नए थ्रेड की शुरुआत",
	"This message was deleted...": "मैसेज हटा दिया गया",
	Thread: Thread$5,
	"Type your message": "अपना मैसेज लिखे",
	Unmute: Unmute$5,
	"You have no channels currently": "आपके पास कोई चैनल नहीं है",
	live: live$5,
	"this content could not be displayed": "यह कॉन्टेंट लोड नहीं हो पाया",
	"{{ commaSeparatedUsers }} and {{ lastUser }} are typing...": "{{ commaSeparatedUsers }} और {{ lastUser }} टाइप कर रहे हैं...",
	"{{ commaSeparatedUsers }} and {{ moreCount }} more": "{{ commaSeparatedUsers }} और {{ moreCount }} और",
	"{{ commaSeparatedUsers }}, and {{ lastUser }}": "{{ commaSeparatedUsers }} और {{ lastUser }}",
	"{{ firstUser }} and {{ secondUser }}": "{{ firstUser }} और {{ secondUser }}",
	"{{ firstUser }} and {{ secondUser }} are typing...": "{{ firstUser }} और {{ secondUser }} टाइप कर रहे हैं...",
	"{{ imageCount }} more": "{{ imageCount }} और",
	"{{ memberCount }} members": "{{ memberCount }} मेंबर्स",
	"{{ replyCount }} replies": "{{ replyCount }} रिप्लाई",
	"{{ user }} has been muted": "{{ user }} को म्यूट कर दिया गया है",
	"{{ user }} has been unmuted": "{{ user }} को अनम्यूट कर दिया गया है",
	"{{ user }} is typing...": "{{ user }} टाइप कर रहा है...",
	"{{ watcherCount }} online": "{{ watcherCount }} online",
	"🏙 Attachment...": "🏙 अटैचमेंट"
};

var Cancel$6 = "Annulla";
var Close$6 = "Chiudi";
var Delete$6 = "Cancella";
var Delivered$6 = "Consegnato";
var Flag$6 = "Segnala";
var Mute$6 = "Silenzia";
var Send$6 = "Invia";
var Thread$6 = "Thread";
var Unmute$6 = "Riattiva le notifiche";
var live$6 = "live";
var itTranslations = {
	"1 reply": "Una risposta",
	"Attach files": "Allega file",
	Cancel: Cancel$6,
	"Channel Missing": "Il canale non esiste",
	Close: Close$6,
	"Connection failure, reconnecting now...": "Connessione fallitta, riconnessione in corso...",
	Delete: Delete$6,
	Delivered: Delivered$6,
	"Edit Message": "Modifica messaggio",
	"Empty message...": "Message vuoto...",
	"Error adding flag: Either the flag already exist or there is issue with network connection ...": "Errore durante la segnalazione: la segnalazione esiste giá o c'é un problema di connessione ...",
	"Error connecting to chat, refresh the page to try again.": "Errore di connessione alla chat, aggiorna la pagina per riprovare",
	"Error muting a user ...": "Errore silenziando un utente ...",
	"Error unmuting a user ...": "Errore riattivando le notifiche per l'utente ...",
	"Error · Unsent": "Errore · Non inviato",
	"Error: {{ errorMessage }}": "Errore: {{ errorMessage }}",
	Flag: Flag$6,
	"Message Failed · Click to try again": "Invio messaggio fallito · Clicca per riprovare",
	"Message deleted": "Messaggio cancellato",
	"Message failed. Click to try again.": "Invio messaggio fallito. Clicca per riprovare.",
	"Message has been successfully flagged": "Il messaggio é stato segnalato con successo",
	Mute: Mute$6,
	"New Messages!": "Nuovo messaggio!",
	"Nothing yet...": "Ancora niente...",
	"Only visible to you": "Visibile soltanto da te",
	"Open emoji picker": "Apri il selettore dellle emoji",
	"Pick your emoji": "Scegli la tua emoji",
	Send: Send$6,
	"Sending...": "Invio in corso...",
	"Start of a new thread": "Inizia un nuovo thread",
	"This message was deleted...": "Questo messaggio é stato cancellato",
	Thread: Thread$6,
	"Type your message": "Scrivi il tuo messaggio",
	Unmute: Unmute$6,
	"You have no channels currently": "Al momento non sono presenti canali",
	live: live$6,
	"this content could not be displayed": "questo contenuto non puó essere mostrato",
	"{{ commaSeparatedUsers }} and {{ lastUser }} are typing...": "{{ commaSeparatedUsers }} e {{ lastUser }} stanno scrivendo...",
	"{{ commaSeparatedUsers }} and {{ moreCount }} more": "{{ commaSeparatedUsers }} e altri {{ moreCount }}",
	"{{ commaSeparatedUsers }}, and {{ lastUser }}": "{{ commaSeparatedUsers }} e {{ lastUser }}",
	"{{ firstUser }} and {{ secondUser }}": "{{ firstUser }} e {{ secondUser }}",
	"{{ firstUser }} and {{ secondUser }} are typing...": "{{ firstUser }} e {{ secondUser }} stanno scrivendo...",
	"{{ imageCount }} more": "+ {{ imageCount }}",
	"{{ memberCount }} members": "{{ memberCount }} membri",
	"{{ replyCount }} replies": "{{ replyCount }} risposte",
	"{{ user }} has been muted": "{{ user }} é stato silenziato",
	"{{ user }} has been unmuted": "Notifiche riattivate per {{ user }}",
	"{{ user }} is typing...": "{{ user }} sta scrivendo...",
	"{{ watcherCount }} online": "{{ watcherCount }} online",
	"🏙 Attachment...": "🏙 Allegato..."
};

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var defaultNS = 'translation';
var defaultLng = 'en';
Dayjs.extend(updateLocale);
Dayjs.updateLocale('nl', {
  calendar: {
    sameDay: '[vandaag om] LT',
    nextDay: '[morgen om] LT',
    nextWeek: 'dddd [om] LT',
    lastDay: '[gisteren om] LT',
    lastWeek: '[afgelopen] dddd [om] LT',
    sameElse: 'L'
  }
});
Dayjs.updateLocale('it', {
  calendar: {
    sameDay: '[Oggi alle] LT',
    nextDay: '[Domani alle] LT',
    nextWeek: 'dddd [alle] LT',
    lastDay: '[Ieri alle] LT',
    lastWeek: '[lo scorso] dddd [alle] LT',
    sameElse: 'L'
  }
});
Dayjs.updateLocale('hi', {
  calendar: {
    sameDay: '[आज] LT',
    nextDay: '[कल] LT',
    nextWeek: 'dddd, LT',
    lastDay: '[कल] LT',
    lastWeek: '[पिछले] dddd, LT',
    sameElse: 'L'
  },
  // Hindi notation for meridiems are quite fuzzy in practice. While there exists
  // a rigid notion of a 'Pahar' it is not used as rigidly in modern Hindi.
  meridiemParse: /रात|सुबह|दोपहर|शाम/,

  meridiemHour(hour, meridiem) {
    if (hour === 12) {
      hour = 0;
    }

    if (meridiem === 'रात') {
      return hour < 4 ? hour : hour + 12;
    } else if (meridiem === 'सुबह') {
      return hour;
    } else if (meridiem === 'दोपहर') {
      return hour >= 10 ? hour : hour + 12;
    } else if (meridiem === 'शाम') {
      return hour + 12;
    }
  },

  meridiem(hour) {
    if (hour < 4) {
      return 'रात';
    } else if (hour < 10) {
      return 'सुबह';
    } else if (hour < 17) {
      return 'दोपहर';
    } else if (hour < 20) {
      return 'शाम';
    } else {
      return 'रात';
    }
  }

});
Dayjs.updateLocale('fr', {
  calendar: {
    sameDay: '[Aujourd’hui à] LT',
    nextDay: '[Demain à] LT',
    nextWeek: 'dddd [à] LT',
    lastDay: '[Hier à] LT',
    lastWeek: 'dddd [dernier à] LT',
    sameElse: 'L'
  }
});
Dayjs.updateLocale('tr', {
  calendar: {
    sameDay: '[bugün saat] LT',
    nextDay: '[yarın saat] LT',
    nextWeek: '[gelecek] dddd [saat] LT',
    lastDay: '[dün] LT',
    lastWeek: '[geçen] dddd [saat] LT',
    sameElse: 'L'
  }
});
Dayjs.updateLocale('ru', {
  calendar: {
    sameDay: '[Сегодня, в] LT',
    nextDay: '[Завтра, в] LT',
    lastDay: '[Вчера, в] LT'
  }
});
var en_locale = {
  weekdays: 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
  months: 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_')
};
/**
 * Wrapper around [i18next](https://www.i18next.com/) class for Stream related translations.
 * Instance of this class should be provided to Chat component to handle translations.
 * Stream provides following list of in-built translations:
 * 1. English (en)
 * 2. Dutch (nl)
 * 3. Russian (ru)
 * 4. Turkish (tr)
 * 5. French (fr)
 * 6. Italian (it)
 * 7. Hindi (hi)
 *
 * Simplest way to start using chat components in one of the in-built languages would be following:
 *
 * ```
 * const i18n = new Streami18n({ language 'nl' });
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * If you would like to override certain keys in in-built translation.
 * UI will be automatically updated in this case.
 *
 * ```
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  translationsForLanguage: {
 *    'Nothing yet...': 'Nog Niet ...',
 *    '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
 *  }
 * });
 *
 * If you would like to register additional languages, use registerTranslation. You can add as many languages as you want:
 *
 * i18n.registerTranslation('zh', {
 *  'Nothing yet...': 'Nog Niet ...',
 *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
 * });
 *
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * You can use the same function to add whole new language as well.
 *
 * ```
 * const i18n = new Streami18n();
 *
 * i18n.registerTranslation('mr', {
 *  'Nothing yet...': 'काहीही नाही  ...',
 *  '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
 * });
 *
 * // Make sure to call setLanguage to reflect new language in UI.
 * i18n.setLanguage('it');
 * <Chat client={chatClient} i18nInstance={i18n}>
 *  ...
 * </Chat>
 * ```
 *
 * ## Datetime translations
 *
 * Stream react chat components uses [dayjs](https://day.js.org/en/) internally by default to format datetime stamp.
 * e.g., in ChannelPreview, MessageContent components.
 * Dayjs has locale support as well - https://day.js.org/docs/en/i18n/i18n
 * Dayjs is a lightweight alternative to Momentjs with the same modern API.
 *
 * Dayjs provides locale config for plenty of languages, you can check the whole list of locale configs at following url
 * https://github.com/iamkun/dayjs/tree/dev/src/locale
 *
 * You can either provide the dayjs locale config while registering
 * language with Streami18n (either via constructor or registerTranslation()) or you can provide your own Dayjs or Moment instance
 * to Streami18n constructor, which will be then used internally (using the language locale) in components.
 *
 * 1. Via language registration
 *
 * e.g.,
 * ```
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  dayjsLocaleConfigForLanguage: {
 *    months: [...],
 *    monthsShort: [...],
 *    calendar: {
 *      sameDay: ...'
 *    }
 *  }
 * });
 * ```
 *
 * Similarly, you can add locale config for moment while registering translation via `registerTranslation` function.
 *
 * e.g.,
 * ```
 * const i18n = new Streami18n();
 *
 * i18n.registerTranslation(
 *  'mr',
 *  {
 *    'Nothing yet...': 'काहीही नाही  ...',
 *    '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
 *  },
 *  {
 *    months: [...],
 *    monthsShort: [...],
 *    calendar: {
 *      sameDay: ...'
 *    }
 *  }
 * );
 *```
 * 2. Provide your own Moment object
 *
 * ```js
 * import 'moment/locale/nl';
 * import 'moment/locale/it';
 * // or if you want to include all locales
 * import 'moment/min/locales';
 *
 * import Moment from moment
 *
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  DateTimeParser: Moment
 * })
 * ```
 *
 * 3. Provide your own Dayjs object
 *
 * ```js
 * import Dayjs from 'dayjs'
 *
 * import 'dayjs/locale/nl';
 * import 'dayjs/locale/it';
 * // or if you want to include all locales
 * import 'dayjs/min/locales';
 *
 * const i18n = new Streami18n({
 *  language: 'nl',
 *  DateTimeParser: Dayjs
 * })
 * ```
 * If you would like to stick with english language for datetimes in Stream compoments, you can set `disableDateTimeTranslations` to true.
 *
 */

var defaultStreami18nOptions = {
  language: 'en',
  disableDateTimeTranslations: false,
  debug: false,
  logger: function logger(msg) {
    return console.warn(msg);
  },
  dayjsLocaleConfigForLanguage: null,
  DateTimeParser: Dayjs
};
var Streami18n = /*#__PURE__*/function () {
  /**
   * dayjs.defineLanguage('nl') also changes the global locale. We don't want to do that
   * when user calls registerTranslation() function. So intead we will store the locale configs
   * given to registerTranslation() function in `dayjsLocales` object, and register the required locale
   * with moment, when setLanguage is called.
   * */

  /**
   * Contructor accepts following options:
   *  - language (String) default: 'en'
   *    Language code e.g., en, tr
   *
   *  - translationsForLanguage (object)
   *    Translations object. Please check src/i18n/en.json for example.
   *
   *  - disableDateTimeTranslations (boolean) default: false
   *    Disable translations for datetimes
   *
   *  - debug (boolean) default: false
   *    Enable debug mode in internal i18n class
   *
   *  - logger (function) default: () => {}
   *    Logger function to log warnings/errors from this class
   *
   *  - dayjsLocaleConfigForLanguage (object) default: 'enConfig'
   *    [Config object](https://momentjs.com/docs/#/i18n/changing-locale/) for internal moment object,
   *    corresponding to language (param)
   *
   *  - DateTimeParser (function) Moment or Dayjs instance/function.
   *    Make sure to load all the required locales in this Moment or Dayjs instance that you will be provide to Streami18n
   *
   * @param {*} options
   */
  function Streami18n() {
    var _this = this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Streami18n);

    _defineProperty(this, "i18nInstance", i18n.createInstance());

    _defineProperty(this, "Dayjs", null);

    _defineProperty(this, "setLanguageCallback", function () {
      return null;
    });

    _defineProperty(this, "initialized", false);

    _defineProperty(this, "t", null);

    _defineProperty(this, "tDateTimeParser", null);

    _defineProperty(this, "translations", {
      en: {
        [defaultNS]: enTranslations
      },
      nl: {
        [defaultNS]: nlTranslations
      },
      ru: {
        [defaultNS]: ruTranslations
      },
      tr: {
        [defaultNS]: trTranslations
      },
      fr: {
        [defaultNS]: frTranslations
      },
      hi: {
        [defaultNS]: hiTranslations
      },
      it: {
        [defaultNS]: itTranslations
      }
    });

    _defineProperty(this, "dayjsLocales", {});

    _defineProperty(this, "localeExists", function (language) {
      if (_this.isCustomDateTimeParser) return true;
      return Object.keys(Dayjs.Ls).indexOf(language) > -1;
    });

    _defineProperty(this, "validateCurrentLanguage", function () {
      var availableLanguages = Object.keys(_this.translations);

      if (availableLanguages.indexOf(_this.currentLanguage) === -1) {
        _this.logger("Streami18n: '".concat(_this.currentLanguage, "' language is not registered.") + " Please make sure to call streami18n.registerTranslation('".concat(_this.currentLanguage, "', {...}) or ") + "use one the built-in supported languages - ".concat(_this.getAvailableLanguages()));

        _this.currentLanguage = defaultLng;
      }
    });

    _defineProperty(this, "geti18Instance", function () {
      return _this.i18nInstance;
    });

    _defineProperty(this, "getAvailableLanguages", function () {
      return Object.keys(_this.translations);
    });

    _defineProperty(this, "getTranslations", function () {
      return _this.translations;
    });

    var finalOptions = _objectSpread$1(_objectSpread$1({}, defaultStreami18nOptions), options); // Prepare the i18next configuration.


    this.logger = finalOptions.logger;
    this.currentLanguage = finalOptions.language;
    this.DateTimeParser = finalOptions.DateTimeParser;

    try {
      // This is a shallow check to see if given parser is instance of Dayjs.
      // For some reason Dayjs.isDayjs(this.DateTimeParser()) doesn't work.
      if (this.DateTimeParser && this.DateTimeParser.extend) {
        this.DateTimeParser.extend(LocalizedFormat);
        this.DateTimeParser.extend(calendar);
        this.DateTimeParser.extend(localeData);
        this.DateTimeParser.extend(relativeTime);
      }
    } catch (error) {
      throw Error("Streami18n: Looks like you wanted to provide Dayjs instance, but something went wrong while adding plugins ".concat(error));
    }

    this.isCustomDateTimeParser = !!options.DateTimeParser;
    var translationsForLanguage = finalOptions.translationsForLanguage;

    if (translationsForLanguage) {
      this.translations[this.currentLanguage] = {
        [defaultNS]: translationsForLanguage
      };
    } // If translations don't exist for given language, then set it as empty object.


    if (!this.translations[this.currentLanguage]) {
      this.translations[this.currentLanguage] = {
        [defaultNS]: {}
      };
    }

    this.i18nextConfig = {
      nsSeparator: false,
      keySeparator: false,
      fallbackLng: false,
      debug: finalOptions.debug,
      lng: this.currentLanguage,
      interpolation: {
        escapeValue: false
      },
      parseMissingKeyHandler: function parseMissingKeyHandler(key) {
        _this.logger("Streami18n: Missing translation for key: ".concat(key));

        return key;
      }
    };
    this.validateCurrentLanguage(this.currentLanguage);
    var dayjsLocaleConfigForLanguage = finalOptions.dayjsLocaleConfigForLanguage;

    if (dayjsLocaleConfigForLanguage) {
      this.addOrUpdateLocale(this.currentLanguage, _objectSpread$1({}, dayjsLocaleConfigForLanguage));
    } else if (!this.localeExists(this.currentLanguage)) {
      this.logger("Streami18n: Streami18n(...) - Locale config for ".concat(this.currentLanguage, " does not exist in momentjs.") + "Please import the locale file using \"import 'moment/locale/".concat(this.currentLanguage, "';\" in your app or ") + "register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)");
    }

    this.tDateTimeParser = function (timestamp) {
      if (finalOptions.disableDateTimeTranslations || !_this.localeExists(_this.currentLanguage)) {
        return _this.DateTimeParser(timestamp).locale(defaultLng);
      }

      return _this.DateTimeParser(timestamp).locale(_this.currentLanguage);
    };
  }
  /**
   * Initializes the i18next instance with configuration (which enables natural language as default keys)
   */


  _createClass(Streami18n, [{
    key: "init",
    value: function () {
      var _init = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.validateCurrentLanguage();
                _context.prev = 1;
                _context.next = 4;
                return this.i18nInstance.init(_objectSpread$1(_objectSpread$1({}, this.i18nextConfig), {}, {
                  resources: this.translations,
                  lng: this.currentLanguage
                }));

              case 4:
                this.t = _context.sent;
                this.initialized = true;
                return _context.abrupt("return", {
                  t: this.t,
                  tDateTimeParser: this.tDateTimeParser
                });

              case 9:
                _context.prev = 9;
                _context.t0 = _context["catch"](1);
                this.logger("Something went wrong with init:", _context.t0);

              case 12:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 9]]);
      }));

      function init() {
        return _init.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: "getTranslators",

    /**
     * Returns current version translator function.
     */
    value: function () {
      var _getTranslators = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.initialized) {
                  _context2.next = 7;
                  break;
                }

                if (this.dayjsLocales[this.currentLanguage]) {
                  this.addOrUpdateLocale(this.currentLanguage, this.dayjsLocales[this.currentLanguage]);
                }

                _context2.next = 4;
                return this.init();

              case 4:
                return _context2.abrupt("return", _context2.sent);

              case 7:
                return _context2.abrupt("return", {
                  t: this.t,
                  tDateTimeParser: this.tDateTimeParser
                });

              case 8:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getTranslators() {
        return _getTranslators.apply(this, arguments);
      }

      return getTranslators;
    }()
    /**
     * Register translation
     *
     * @param {*} language
     * @param {*} translation
     * @param {*} customDayjsLocale
     */

  }, {
    key: "registerTranslation",
    value: function registerTranslation(language, translation, customDayjsLocale) {
      if (!translation) {
        this.logger("Streami18n: registerTranslation(language, translation, customDayjsLocale) called without translation");
        return;
      }

      if (!this.translations[language]) {
        this.translations[language] = {
          [defaultNS]: translation
        };
      } else {
        this.translations[language][defaultNS] = translation;
      }

      if (customDayjsLocale) {
        this.dayjsLocales[language] = _objectSpread$1({}, customDayjsLocale);
      } else if (!this.localeExists(language)) {
        this.logger("Streami18n: registerTranslation(language, translation, customDayjsLocale) - " + "Locale config for ".concat(language, " does not exist in Dayjs.") + "Please import the locale file using \"import 'dayjs/locale/".concat(language, "';\" in your app or ") + "register the locale config with Streami18n using registerTranslation(language, translation, customDayjsLocale)");
      }

      if (this.initialized) {
        this.i18nInstance.addResources(language, defaultNS, translation);
      }
    }
  }, {
    key: "addOrUpdateLocale",
    value: function addOrUpdateLocale(key, config) {
      if (this.localeExists(key)) {
        Dayjs.updateLocale(key, _objectSpread$1({}, config));
      } else {
        // Merging the custom locale config with en config, so missing keys can default to english.
        Dayjs.locale(_objectSpread$1({
          name: key
        }, _objectSpread$1(_objectSpread$1({}, en_locale), config)), null, true);
      }
    }
    /**
     * Changes the language.
     * @param {*} language
     */

  }, {
    key: "setLanguage",
    value: function () {
      var _setLanguage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(language) {
        var t;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.currentLanguage = language;

                if (this.initialized) {
                  _context3.next = 3;
                  break;
                }

                return _context3.abrupt("return");

              case 3:
                _context3.prev = 3;
                _context3.next = 6;
                return this.i18nInstance.changeLanguage(language);

              case 6:
                t = _context3.sent;

                if (this.dayjsLocales[language]) {
                  this.addOrUpdateLocale(this.currentLanguage, this.dayjsLocales[this.currentLanguage]);
                }

                this.setLanguageCallback(t);
                return _context3.abrupt("return", t);

              case 12:
                _context3.prev = 12;
                _context3.t0 = _context3["catch"](3);
                this.logger("Failed to set language:", _context3.t0);

              case 15:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[3, 12]]);
      }));

      function setLanguage(_x) {
        return _setLanguage.apply(this, arguments);
      }

      return setLanguage;
    }()
    /**
     * @param {(t: import('i18next').TFunction) => void} callback
     */

  }, {
    key: "registerSetLanguageCallback",
    value: function registerSetLanguageCallback(callback) {
      this.setLanguageCallback = callback;
    }
  }]);

  return Streami18n;
}();

/**
 * AttachmentActions - The actions you can take on an attachment
 *
 * @example ../../docs/AttachmentActions.md
 * @type {React.FC<import('type').AttachmentActionsProps>}
 */

var AttachmentActions = function AttachmentActions(_ref) {
  var text = _ref.text,
      id = _ref.id,
      actions = _ref.actions,
      actionHandler = _ref.actionHandler;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-actions"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-actions-form"
  }, /*#__PURE__*/React__default.createElement("span", {
    key: 0
  }, text), actions.map(function (action) {
    return /*#__PURE__*/React__default.createElement("button", {
      className: "str-chat__message-attachment-actions-button str-chat__message-attachment-actions-button--".concat(action.style),
      "data-testid": "".concat(action.name),
      key: "".concat(id, "-").concat(action.value),
      "data-value": action.value,
      onClick: function onClick(e) {
        return actionHandler(action.name, action.value, e);
      }
    }, action.text);
  })));
};

AttachmentActions.propTypes = {
  /** Unique id for action button key. Key is generated by concatenating this id with action value - {`${id}-${action.value}`} */
  id: PropTypes.string.isRequired,

  /** The text for the form input */
  text: PropTypes.string,

  /** A list of actions */
  actions: PropTypes.array.isRequired,

  /**
   *
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   */
  actionHandler: PropTypes.func.isRequired
};
var DefaultAttachmentActions = /*#__PURE__*/React__default.memo(AttachmentActions);

var progressUpdateInterval = 500;
/**
 * Audio attachment with play/pause button and progress bar
 * @param {import("types").AudioProps} props
 */

var Audio = function Audio(_ref) {
  var og = _ref.og;
  var audioRef = React.useRef(
  /** @type {HTMLAudioElement | null} */
  null);

  var _useState = React.useState(false),
      _useState2 = _slicedToArray(_useState, 2),
      isPlaying = _useState2[0],
      setIsPlaying = _useState2[1];

  var _useState3 = React.useState(0),
      _useState4 = _slicedToArray(_useState3, 2),
      progress = _useState4[0],
      setProgress = _useState4[1];

  var updateProgress = React.useCallback(function () {
    if (audioRef.current !== null) {
      var position = audioRef.current.currentTime;
      var duration = audioRef.current.duration;
      var currentProgress = 100 / duration * position;
      setProgress(currentProgress);

      if (position === duration) {
        setIsPlaying(false);
      }
    }
  }, [audioRef]);
  React.useEffect(function () {
    if (audioRef.current !== null) {
      if (isPlaying) {
        audioRef.current.play();
        var interval = setInterval(updateProgress, progressUpdateInterval);
        return function () {
          return clearInterval(interval);
        };
      }

      audioRef.current.pause();
    }

    return function () {};
  }, [isPlaying, updateProgress]);
  var asset_url = og.asset_url,
      image_url = og.image_url,
      title = og.title,
      description = og.description,
      text = og.text;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__audio"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__audio__wrapper"
  }, /*#__PURE__*/React__default.createElement("audio", {
    ref: audioRef
  }, /*#__PURE__*/React__default.createElement("source", {
    src: asset_url,
    type: "audio/mp3",
    "data-testid": "audio-source"
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__audio__image"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__audio__image--overlay"
  }, !isPlaying ? /*#__PURE__*/React__default.createElement("div", {
    onClick: function onClick() {
      return setIsPlaying(true);
    },
    className: "str-chat__audio__image--button",
    "data-testid": "play-audio"
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "40",
    height: "40",
    viewBox: "0 0 64 64",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M32 58c14.36 0 26-11.64 26-26S46.36 6 32 6 6 17.64 6 32s11.64 26 26 26zm0 6C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm13.237-28.412L26.135 45.625a3.27 3.27 0 0 1-4.426-1.4 3.319 3.319 0 0 1-.372-1.47L21 23.36c-.032-1.823 1.41-3.327 3.222-3.358a3.263 3.263 0 0 1 1.473.322l19.438 9.36a3.311 3.311 0 0 1 .103 5.905z",
    fillRule: "nonzero"
  }))) : /*#__PURE__*/React__default.createElement("div", {
    onClick: function onClick() {
      return setIsPlaying(false);
    },
    className: "str-chat__audio__image--button",
    "data-testid": "pause-audio"
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "40",
    height: "40",
    viewBox: "0 0 64 64",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M32 58.215c14.478 0 26.215-11.737 26.215-26.215S46.478 5.785 32 5.785 5.785 17.522 5.785 32 17.522 58.215 32 58.215zM32 64C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm-7.412-45.56h2.892a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.892a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17zm12.293 0h2.893a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.893a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17z",
    fillRule: "nonzero"
  })))), image_url && /*#__PURE__*/React__default.createElement("img", {
    src: image_url,
    alt: "".concat(description)
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__audio__content"
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__audio__content--title"
  }, /*#__PURE__*/React__default.createElement("strong", null, title)), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__audio__content--subtitle"
  }, text), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__audio__content--progress"
  }, /*#__PURE__*/React__default.createElement("div", {
    style: {
      width: "".concat(progress, "%")
    },
    "data-testid": "audio-progress"
  })))));
};

var DefaultAudio = /*#__PURE__*/React__default.memo(Audio);

var giphyLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAkCAYAAAB/up84AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABVhJREFUeNrsW6GS20AMdToGBgEGAQYBBgEBBQYFgQcP5hMO9jP6CYWFBwsPBgYUGBQEFAQUGAQYBBgYGHjmutt5O6NupbXXcZJrx5rJXGyv11o96Ukr52avr6/BJG9HZmMBMpvNYnxt1JzNZNoRAYFxM2Z8rT6FuueMcaH6s1KfhBn3U42r1Jg1rrfq+Bt5xgf1Z64+uQFQndNzLc1Ydfwg6F2p6wd1PVXfU+b6Gc9vHGuh8+jrsXVN61Sq64XggNw95tlH9XmP6y3W2OI+qvN3db6mN7/zBFAb8L2aNMJxRsDQC6jIuEyN039LnAvV8QJKRRijZUHmT8iiLpEFDHKJaB1TGN732WuAokEIDQCwhwGjsMEIMNgp6qY9JlsTgyXquCFG1d54IsbOsKAVPLDBcQJjUxB0RJwAltGntNQ46GhzqPnb0y0954RG/1iLQ7SRCkR+guiPtW6GFRg5gAlCrFvbJEZ0ngDAUn0/Y77fDCJFXuiB/AmGDC3PLg0YWLRW5CcJWWPglNxDKS6C59AcZBs/sYxbOQBqHHkuZYCsGCds4SQJDDx3RK3RjUb9EfMUcLQ57BHS64MAIYtYkvEt+d4wCzqr++ipkoTtkihOI2chREfA5KiC0GOAaMig05zoWJPjgMk39jxcPphDR0mSDrtq438g51iq8omQlEnYJfHoiAFxYQGko6bCPSmZ5wS+TRx0Zc5R4CtmHbEVJT+0p1uOYdNE1SMfOKNO0zXWEmItptApsfYa1LV0UZUPIHSCmlRYJhfokNWhX5IcsmIWbEAMCQWerWirhZK57MghNQyzgke3QuQWPUv4EAac9wCuJjmkNmvUNEwiobX+DgdEWoQGgNDPGtTWWhRRWONX5JlnePCZhP1JUCOzPN1O0C2MohP7xuiko8Qy9INUDBg2YPJMlzP8pRv0qYeUdu+Cy+RAKIYmtVqojM5kkS0DwkXlLuY0ICzgAEOlAd8fPe+rYJdppz61TiZ5G4AgcScWz05RcUtAkOwyJMtI4FzNt3suCWKfwLUhdqRC0yA/enB1CZ4vBZ2fhIptJ4x/5PYVavyzQ39N0V8ddnsQ+m3sfX02hjo3bIVJ7d5PhqojZxYdC3NEdv9oQMQWFFjHHqpLEsc9BZyF23c9cG0ZOJjUIN15V1mY8OOAhW0E77yWaP2eoO9VBFG/d6yX6/xuHT2z3AsQ5ImnjrZBF6XcUiKAEl0RlJzZ7ZtnbxmqSgRqfxmyD9k6wNDGzuExecB3Z1/ukBOjQH73MZbspChFp9nQ/EYY9+LaaIYOqlo7JjwISX+LcBwbjAOz2ZKS7BpOcq0o0R2HvZAbHpHPJGc+dm00paQuedmOA4O0WD5fyQ4V08Ip4ATxhYl8CCh76/0QLVyehlBVFyCpYJTcKmPjHoY8XNE2VQ8dbIkdr4Z95npBwcNVahKzNEMBSYSyz46iLm8sLunreG5O+xYTsaMUHYu6bMn79sRCT2+8l6SMV2cCT5e3UspBXbbd9n3nDIN/Q1KP3JDfWLcd8kZwCVX12hjeOlmOIMe+L6FGjJLC4QS5rz6hg/tThjZiU0Pr/g7D65/uCUafKgaUJu0lHjvox/XsjXA+GAOQUogIXV8/v7GoKOGJfYuHxvHjt7t3rEMHD2+E5PoR+5GCLCS+8g6Z2xgGt6anuwGC99MSKAl6RrfUs/ofje+b1PcjlJBlMMk4gKBUe77AqKVP/T1Jj30IQPmCTdkm6NeKb5BkJzCGdCA8XuFGZIOWCBEh/mwGiZ/rFZXk3xHEdkjHb6MknVOhypJe+Sac03XlL4fe3r81mH518q9GyCS3kV8CDADlsrVaJhTLAgAAAABJRU5ErkJggg==";

// @ts-check
/**
 * SafeAnchor - In all ways similar to a regular anchor tag.
 * The difference is that it sanitizes the href value and prevents XSS
 * @type {React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>}
 */

var SafeAnchor = function SafeAnchor(_ref) {
  var href = _ref.href,
      children = _ref.children,
      target = _ref.target,
      className = _ref.className;
  if (!href) return null;
  var sanitized = sanitizeUrl.sanitizeUrl(href);
  return /*#__PURE__*/React__default.createElement("a", {
    href: sanitized,
    target: target,
    className: className
  }, children);
};

var SafeAnchor$1 = /*#__PURE__*/React__default.memo(SafeAnchor);

/**
 * Card - Simple Card Layout
 *
 * @example ../../docs/Card.md
 * @typedef {import('../types').CardProps} Props
 * @type React.FC<Props>
 */

var Card = function Card(_ref) {
  var title = _ref.title,
      title_link = _ref.title_link,
      og_scrape_url = _ref.og_scrape_url,
      image_url = _ref.image_url,
      thumb_url = _ref.thumb_url,
      text = _ref.text,
      type = _ref.type;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var image = thumb_url || image_url;
  /** @type {(url?: string) => string | null} Typescript syntax */

  var trimUrl = function trimUrl(url) {
    if (url !== undefined && url !== null) {
      var _url$replace$split = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/'),
          _url$replace$split2 = _slicedToArray(_url$replace$split, 1),
          trimmedUrl = _url$replace$split2[0];

      return trimmedUrl;
    }

    return null;
  };

  if (!title && !title_link && !image) {
    return /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__message-attachment-card str-chat__message-attachment-card--".concat(type)
    }, /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__message-attachment-card--content"
    }, /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__message-attachment-card--text"
    }, t('this content could not be displayed'))));
  }

  if (!title_link && !og_scrape_url) {
    return null;
  }

  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-card str-chat__message-attachment-card--".concat(type)
  }, image && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-card--header"
  }, /*#__PURE__*/React__default.createElement("img", {
    src: image,
    alt: image
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-card--content"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-card--flex"
  }, title && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-card--title"
  }, title), text && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-card--text"
  }, text), (title_link || og_scrape_url) && /*#__PURE__*/React__default.createElement(SafeAnchor$1, {
    href: title_link || og_scrape_url,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "str-chat__message-attachment-card--url"
  }, trimUrl(title_link || og_scrape_url))), type === 'giphy' && /*#__PURE__*/React__default.createElement("img", {
    className: "str-chat__message-attachment-card__giphy-logo",
    "data-testid": "card-giphy",
    src: giphyLogo,
    alt: "giphy logo"
  })));
};

Card.propTypes = {
  /** Title returned by the OG scraper */
  title: PropTypes.string,

  /** Link returned by the OG scraper */
  title_link: PropTypes.string,

  /** The scraped url, used as a fallback if the OG-data doesn't include a link */
  og_scrape_url: PropTypes.string,

  /** The url of the full sized image */
  image_url: PropTypes.string,

  /** The url for thumbnail sized image */
  thumb_url: PropTypes.string,

  /** Description returned by the OG scraper */
  text: PropTypes.string
};
var DefaultCard = /*#__PURE__*/React__default.memo(Card);

/** @type React.FC<import('../types').FileAttachmentProps> */

var FileAttachment = function FileAttachment(_ref) {
  var attachment = _ref.attachment;
  return /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "attachment-file",
    className: "str-chat__message-attachment-file--item"
  }, /*#__PURE__*/React__default.createElement(reactFileUtils.FileIcon, {
    mimeType: attachment.mime_type,
    filename: attachment.title,
    big: true,
    size: 30
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-file--item-text"
  }, /*#__PURE__*/React__default.createElement(SafeAnchor$1, {
    href: attachment.asset_url,
    target: "_blank",
    download: true
  }, attachment.title), attachment.file_size && /*#__PURE__*/React__default.createElement("span", null, prettybytes(attachment.file_size))));
};

var DefaultFile = /*#__PURE__*/React__default.memo(FileAttachment);

// @ts-check
/**
 * Modal - Custom Image component used in modal
 * @type {React.FC<import('../types').ModalImageProps>}
 */

var ModalImage = function ModalImage(_ref) {
  var data = _ref.data;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__modal-image__wrapper",
    "data-testid": "modal-image"
  }, /*#__PURE__*/React__default.createElement("img", {
    src: data.src,
    className: "str-chat__modal-image__image"
  }));
};

ModalImage.propTypes = {
  data: PropTypes.shape({
    src: PropTypes.string.isRequired
  }).isRequired
};

// @ts-check
/**
 * ImageModal - Small modal component
 * @type { React.FC<import('../types').ModalWrapperProps>}
 */

var ModalComponent = function ModalComponent(_ref) {
  var images = _ref.images,
      toggleModal = _ref.toggleModal,
      index = _ref.index,
      modalIsOpen = _ref.modalIsOpen;
  return /*#__PURE__*/React__default.createElement(Carousel.ModalGateway, null, modalIsOpen ?
  /*#__PURE__*/
  // @ts-ignore
  React__default.createElement(Carousel.Modal, {
    onClose: toggleModal
  }, /*#__PURE__*/React__default.createElement(Carousel__default, {
    views: images,
    currentIndex: index,
    components: {
      // @ts-ignore
      View: ModalImage
    }
  })) : null);
};

ModalComponent.propTypes = {
  images: PropTypes.array.isRequired,
  toggleModal: PropTypes.func.isRequired,
  index: PropTypes.number,
  modalIsOpen: PropTypes.bool.isRequired
};

/**
 * Gallery - displays up to 4 images in a simple responsive grid with a lightbox to view the images.
 * @example ../../docs/Gallery.md
 * @typedef {import('../types').GalleryProps} Props
 * @type React.FC<Props>
 */

var Gallery = function Gallery(_ref) {
  var images = _ref.images;

  var _useState = React.useState(0),
      _useState2 = _slicedToArray(_useState, 2),
      index = _useState2[0],
      setIndex = _useState2[1];

  var _useState3 = React.useState(false),
      _useState4 = _slicedToArray(_useState3, 2),
      modalOpen = _useState4[0],
      setModalOpen = _useState4[1];

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;
  /**
   * @param {number} selectedIndex Index of image clicked
   */


  var toggleModal = function toggleModal(selectedIndex) {
    if (modalOpen) {
      setModalOpen(false);
    } else {
      setIndex(selectedIndex);
      setModalOpen(true);
    }
  };

  var formattedArray = React.useMemo(function () {
    return images.map(function (image) {
      return {
        src: image.image_url || image.thumb_url || '',
        source: image.image_url || image.thumb_url || ''
      };
    });
  }, [images]);
  var renderImages = images.slice(0, 3).map(function (image, i) {
    return /*#__PURE__*/React__default.createElement("div", {
      "data-testid": "gallery-image",
      className: "str-chat__gallery-image",
      key: "gallery-image-".concat(i),
      onClick: function onClick() {
        return toggleModal(i);
      }
    }, /*#__PURE__*/React__default.createElement("img", {
      src: image.image_url || image.thumb_url
    }));
  });
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__gallery ".concat(images.length > 3 ? 'str-chat__gallery--square' : '')
  }, renderImages, images.length > 3 && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__gallery-placeholder",
    style: {
      backgroundImage: "url(".concat(images[3].image_url, ")")
    },
    onClick: function onClick() {
      return toggleModal(3);
    }
  }, /*#__PURE__*/React__default.createElement("p", null, t('{{ imageCount }} more', {
    imageCount: images.length - 3
  }))), /*#__PURE__*/React__default.createElement(ModalComponent, {
    images: formattedArray,
    index: index // @ts-ignore
    ,
    toggleModal: toggleModal,
    modalIsOpen: modalOpen
  }));
};

Gallery.propTypes = {
  images: PropTypes.arrayOf(PropTypes.object.isRequired).isRequired
};
var Gallery$1 = /*#__PURE__*/React__default.memo(Gallery);

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
/**
 * Image - Small wrapper around an image tag, supports thumbnails
 *
 * @example ../../docs/Image.md
 * @extends {React.PureComponent<import('type').ImageProps>}
 */

var Image = /*#__PURE__*/function (_React$PureComponent) {
  _inherits(Image, _React$PureComponent);

  var _super = _createSuper(Image);

  function Image() {
    var _this;

    _classCallCheck(this, Image);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));

    _defineProperty(_assertThisInitialized(_this), "state", {
      modalIsOpen: false,
      currentIndex: 0
    });

    _defineProperty(_assertThisInitialized(_this), "toggleModal", function () {
      _this.setState(function (state) {
        return {
          modalIsOpen: !state.modalIsOpen
        };
      });
    });

    return _this;
  }

  _createClass(Image, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          image_url = _this$props.image_url,
          thumb_url = _this$props.thumb_url,
          fallback = _this$props.fallback;
      var formattedArray = [{
        src: image_url || thumb_url
      }];
      return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("img", {
        className: "str-chat__message-attachment--img",
        onClick: this.toggleModal,
        src: thumb_url || image_url,
        alt: fallback,
        "data-testid": "image-test"
      }), /*#__PURE__*/React__default.createElement(ModalComponent, {
        images: formattedArray,
        toggleModal: this.toggleModal,
        index: this.state.currentIndex,
        modalIsOpen: this.state.modalIsOpen
      }));
    }
  }]);

  return Image;
}(React__default.PureComponent);

_defineProperty(Image, "propTypes", {
  /** The full size image url */
  image_url: PropTypes.string,

  /** The thumb url */
  thumb_url: PropTypes.string,

  /** The text fallback for the image */
  fallback: PropTypes.string
});

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/ogg', 'video/webm', 'video/quicktime'];
/**
 * @typedef {import('../types').ExtendedAttachment} ExtendedAttachment
 * @typedef {Required<Pick<import('../types').AttachmentUIComponentProps, 'Card' | 'File' | 'Image' | 'Audio' | 'Media' | 'AttachmentActions'>>} DefaultProps
 * @typedef {Omit<import('../types').AttachmentUIComponentProps, 'Card' | 'File' | 'Image' | 'Audio' | 'Media' | 'AttachmentActions'> & DefaultProps} AttachmentProps
 */

/**
 * @param {ExtendedAttachment} a
 */

var isImageAttachment = function isImageAttachment(a) {
  return a.type === 'image' && !a.title_link && !a.og_scrape_url;
};
/**
 * @param {ExtendedAttachment} a
 */

var isMediaAttachment = function isMediaAttachment(a) {
  return a.mime_type && SUPPORTED_VIDEO_FORMATS.indexOf(a.mime_type) !== -1 || a.type === 'video';
};
/**
 * @param {ExtendedAttachment} a
 */

var isAudioAttachment = function isAudioAttachment(a) {
  return a.type === 'audio';
};
/**
 * @param {ExtendedAttachment} a
 */

var isFileAttachment = function isFileAttachment(a) {
  return a.type === 'file' || a.mime_type && SUPPORTED_VIDEO_FORMATS.indexOf(a.mime_type) === -1 && a.type !== 'video';
};
/**
 * @param {React.ReactNode} children
 * @param {ExtendedAttachment} attachment
 * @param {string} componentType
 */

var renderAttachmentWithinContainer = function renderAttachmentWithinContainer(children, attachment, componentType) {
  var extra = attachment && attachment.actions && attachment.actions.length ? 'actions' : '';

  if (componentType === 'card' && !attachment.image_url && !attachment.thumb_url) {
    extra = 'no-image';
  }

  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment str-chat__message-attachment--".concat(componentType, " str-chat__message-attachment--").concat(attachment.type, " str-chat__message-attachment--").concat(componentType, "--").concat(extra)
  }, children);
};
/**
 * @param {AttachmentProps} props
 */

var renderAttachmentActions = function renderAttachmentActions(props) {
  var a = props.attachment,
      AttachmentActions = props.AttachmentActions,
      actionHandler = props.actionHandler;

  if (!a.actions || !a.actions.length) {
    return null;
  }

  return /*#__PURE__*/React__default.createElement(AttachmentActions, _extends({}, a, {
    id: a.id || '',
    actions: a.actions || [],
    text: a.text || '',
    key: "key-actions-".concat(a.id),
    actionHandler: actionHandler
  }));
};
/**
 * @param {AttachmentProps} props
 */

var renderImage = function renderImage(props) {
  var a = props.attachment,
      Image = props.Image;

  if (a.actions && a.actions.length) {
    return renderAttachmentWithinContainer( /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__attachment",
      key: "key-image-".concat(a.id)
    }, /*#__PURE__*/React__default.createElement(Image, a), renderAttachmentActions(props)), a, 'image');
  }

  return renderAttachmentWithinContainer( /*#__PURE__*/React__default.createElement(Image, _extends({}, a, {
    key: "key-image-".concat(a.id)
  })), a, 'image');
};
/**
 * @param {AttachmentProps} props
 */

var renderCard = function renderCard(props) {
  var a = props.attachment,
      Card = props.Card;

  if (a.actions && a.actions.length) {
    return renderAttachmentWithinContainer( /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__attachment",
      key: "key-image-".concat(a.id)
    }, /*#__PURE__*/React__default.createElement(Card, _extends({}, a, {
      key: "key-card-".concat(a.id)
    })), renderAttachmentActions(props)), a, 'card');
  }

  return renderAttachmentWithinContainer( /*#__PURE__*/React__default.createElement(Card, _extends({}, a, {
    key: "key-card-".concat(a.id)
  })), a, 'card');
};
/**
 * @param {AttachmentProps} props
 */

var renderFile = function renderFile(props) {
  var a = props.attachment,
      File = props.File;
  if (!a.asset_url) return null;
  return renderAttachmentWithinContainer( /*#__PURE__*/React__default.createElement(File, {
    attachment: a,
    key: "key-file-".concat(a.id)
  }), a, 'file');
};
/**
 * @param {AttachmentProps} props
 */

var renderAudio = function renderAudio(props) {
  var a = props.attachment,
      Audio = props.Audio;
  return renderAttachmentWithinContainer( /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__attachment",
    key: "key-video-".concat(a.id)
  }, /*#__PURE__*/React__default.createElement(Audio, {
    og: a
  })), a, 'audio');
};
/**
 * @param {AttachmentProps} props
 */

var renderMedia = function renderMedia(props) {
  var a = props.attachment,
      Media = props.Media;

  if (a.actions && a.actions.length) {
    return renderAttachmentWithinContainer( /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__attachment str-chat__attachment-media",
      key: "key-video-".concat(a.id)
    }, /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__player-wrapper"
    }, /*#__PURE__*/React__default.createElement(Media, {
      className: "react-player",
      url: a.asset_url,
      width: "100%",
      height: "100%",
      controls: true
    })), renderAttachmentActions(props)), a, 'media');
  }

  return renderAttachmentWithinContainer( /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__player-wrapper",
    key: "key-video-".concat(a.id)
  }, /*#__PURE__*/React__default.createElement(Media, {
    className: "react-player",
    url: a.asset_url,
    width: "100%",
    height: "100%",
    controls: true
  })), a, 'media');
};
/**
 * Attachment - The message attachment
 *
 * @example ../../docs/Attachment.md
 * @type { React.FC<import('../types').AttachmentUIComponentProps> }
 */

var Attachment = function Attachment(_ref) {
  var attachment = _ref.attachment,
      _ref$Card = _ref.Card,
      Card = _ref$Card === void 0 ? DefaultCard : _ref$Card,
      _ref$Image = _ref.Image,
      Image$1 = _ref$Image === void 0 ? Image : _ref$Image,
      _ref$Audio = _ref.Audio,
      Audio = _ref$Audio === void 0 ? DefaultAudio : _ref$Audio,
      _ref$File = _ref.File,
      File = _ref$File === void 0 ? DefaultFile : _ref$File,
      _ref$Media = _ref.Media,
      Media = _ref$Media === void 0 ? DefaultMedia : _ref$Media,
      _ref$AttachmentAction = _ref.AttachmentActions,
      AttachmentActions = _ref$AttachmentAction === void 0 ? DefaultAttachmentActions : _ref$AttachmentAction,
      rest = _objectWithoutProperties(_ref, ["attachment", "Card", "Image", "Audio", "File", "Media", "AttachmentActions"]);

  var propsWithDefault = _objectSpread$2({
    attachment,
    Card,
    Image: Image$1,
    Audio,
    File,
    Media,
    AttachmentActions
  }, rest);

  if (isImageAttachment(attachment)) {
    return renderImage(propsWithDefault);
  }

  if (isFileAttachment(attachment)) {
    return renderFile(propsWithDefault);
  }

  if (isAudioAttachment(attachment)) {
    return renderAudio(propsWithDefault);
  }

  if (isMediaAttachment(attachment)) {
    return renderMedia(propsWithDefault);
  }

  return renderCard(propsWithDefault);
};

Attachment.propTypes = {
  /**
   * The attachment to render
   * @see See [Attachment structure](https://getstream.io/chat/docs/#message_format)
   *
   *  */
  attachment: PropTypes.object.isRequired,

  /**
   *
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   */
  actionHandler: PropTypes.func,

  /**
   * Custom UI component for card type attachment
   * Defaults to [Card](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Card.js)
   */
  Card:
  /** @type {PropTypes.Validator<React.ComponentType<import('../types').CardProps>>} */
  PropTypes.elementType,

  /**
   * Custom UI component for file type attachment
   * Defaults to [File](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/File.js)
   */
  File:
  /** @type {PropTypes.Validator<React.ComponentType<import('../types').FileAttachmentProps>>} */
  PropTypes.elementType,

  /**
   * Custom UI component for image type attachment
   * Defaults to [Image](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Gallery/Image.js)
   */
  Image:
  /** @type {PropTypes.Validator<React.ComponentType<import('../types').ImageProps>>} */
  PropTypes.elementType,

  /**
   * Custom UI component for audio type attachment
   * Defaults to [Audio](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/Audio.js)
   */
  Audio:
  /** @type {PropTypes.Validator<React.ComponentType<import('../types').AudioProps>>} */
  PropTypes.elementType,

  /**
   * Custom UI component for media type attachment
   * Defaults to [ReactPlayer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/ReactPlayer.js)
   */
  Media:
  /** @type {PropTypes.Validator<React.ComponentType<import('react-player').ReactPlayerProps>>} */
  PropTypes.elementType,

  /**
   * Custom UI component for attachment actions
   * Defaults to [AttachmentActions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment/AttachmentActions.js)
   */
  AttachmentActions:
  /** @type {PropTypes.Validator<React.ComponentType<import('../types').AttachmentActionsProps>>} */
  PropTypes.elementType
};

/* eslint-disable */
var KEY_CODES = {
  ESC: 27,
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  TAB: 9,
  SPACE: 32
}; // This is self-made key shortcuts manager, used for caching key strokes

var Listener = function Listener() {
  var _this = this;

  _classCallCheck(this, Listener);

  _defineProperty(this, "startListen", function () {
    if (!_this.refCount) {
      // prevent multiple listeners in case of multiple TextareaAutocomplete components on page
      document.addEventListener('keydown', _this.f);
    }

    _this.refCount++;
  });

  _defineProperty(this, "stopListen", function () {
    _this.refCount--;

    if (!_this.refCount) {
      // prevent disable listening in case of multiple TextareaAutocomplete components on page
      document.removeEventListener('keydown', _this.f);
    }
  });

  _defineProperty(this, "add", function (keyCodes, fn) {
    var keyCode = keyCodes;
    if (typeof keyCode !== 'object') keyCode = [keyCode];
    _this.listeners[_this.index] = {
      keyCode,
      fn
    };
    _this.index += 1;
    return _this.index;
  });

  _defineProperty(this, "remove", function (id) {
    delete _this.listeners[id];
  });

  _defineProperty(this, "removeAll", function () {
    _this.listeners = {};
    _this.index = 0;
  });

  this.index = 0;
  this.listeners = {};
  this.refCount = 0;

  this.f = function (e) {
    var code = e.keyCode || e.which;
    Object.values(_this.listeners).forEach(function (_ref) {
      var keyCode = _ref.keyCode,
          fn = _ref.fn;
      if (keyCode.includes(code)) fn(e);
    });
  };
};

var Listeners = new Listener();

function _createSuper$1(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$1(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$1() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var Item = /*#__PURE__*/function (_React$Component) {
  _inherits(Item, _React$Component);

  var _super = _createSuper$1(Item);

  function Item() {
    var _this;

    _classCallCheck(this, Item);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));

    _defineProperty(_assertThisInitialized(_this), "selectItem", function () {
      var _this$props = _this.props,
          item = _this$props.item,
          onSelectHandler = _this$props.onSelectHandler;
      onSelectHandler(item);
    });

    return _this;
  }

  _createClass(Item, [{
    key: "render",
    value: function render() {
      var _this$props2 = this.props,
          Component = _this$props2.component,
          style = _this$props2.style,
          onClickHandler = _this$props2.onClickHandler,
          item = _this$props2.item,
          selected = _this$props2.selected,
          className = _this$props2.className,
          innerRef = _this$props2.innerRef;
      return /*#__PURE__*/React__default.createElement("li", {
        className: "rta__item ".concat(className || ''),
        style: style
      }, /*#__PURE__*/React__default.createElement("div", {
        className: "rta__entity ".concat(selected === true ? 'rta__entity--selected' : ''),
        role: "button",
        tabIndex: 0,
        onClick: onClickHandler,
        onFocus: this.selectItem,
        onMouseEnter: this.selectItem
        /* $FlowFixMe */
        ,
        ref: innerRef
      }, /*#__PURE__*/React__default.createElement(Component, {
        selected: selected,
        entity: item
      })));
    }
  }]);

  return Item;
}(React__default.Component);

function _createSuper$2(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$2(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$2() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var List = /*#__PURE__*/function (_React$Component) {
  _inherits(List, _React$Component);

  var _super = _createSuper$2(List);

  function List() {
    var _this;

    _classCallCheck(this, List);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _super.call.apply(_super, [this].concat(args));

    _defineProperty(_assertThisInitialized(_this), "state", {
      selectedItem: null
    });

    _defineProperty(_assertThisInitialized(_this), "cachedValues", null);

    _defineProperty(_assertThisInitialized(_this), "onPressEnter", function (e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      var values = _this.props.values;

      _this.modifyText(values[_this.getPositionInList()]);
    });

    _defineProperty(_assertThisInitialized(_this), "getPositionInList", function () {
      var values = _this.props.values;
      var selectedItem = _this.state.selectedItem;
      if (!selectedItem) return 0;
      return values.findIndex(function (a) {
        return _this.getId(a) === _this.getId(selectedItem);
      });
    });

    _defineProperty(_assertThisInitialized(_this), "getId", function (item) {
      var textToReplace = _this.props.getTextToReplace(item);

      if (textToReplace.key) {
        return textToReplace.key;
      }

      if (typeof item === 'string' || !item.key) {
        return textToReplace.text;
      }

      return item.key;
    });

    _defineProperty(_assertThisInitialized(_this), "listeners", []);

    _defineProperty(_assertThisInitialized(_this), "itemsRef", {});

    _defineProperty(_assertThisInitialized(_this), "modifyText", function (value) {
      if (!value) return;
      var _this$props = _this.props,
          onSelect = _this$props.onSelect,
          getTextToReplace = _this$props.getTextToReplace,
          getSelectedItem = _this$props.getSelectedItem;
      onSelect(getTextToReplace(value));

      if (getSelectedItem) {
        getSelectedItem(value);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "selectItem", function (item) {
      var keyboard = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      _this.setState({
        selectedItem: item
      }, function () {
        if (keyboard) {
          _this.props.dropdownScroll(_this.itemsRef[_this.getId(item)]);
        }
      });
    });

    _defineProperty(_assertThisInitialized(_this), "scroll", function (e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      var values = _this.props.values;
      var code = e.keyCode || e.which;

      var oldPosition = _this.getPositionInList();

      var newPosition;

      switch (code) {
        case KEY_CODES.DOWN:
          newPosition = oldPosition + 1;
          break;

        case KEY_CODES.UP:
          newPosition = oldPosition - 1;
          break;

        default:
          newPosition = oldPosition;
          break;
      }

      newPosition = (newPosition % values.length + values.length) % values.length; // eslint-disable-line

      _this.selectItem(values[newPosition], [KEY_CODES.DOWN, KEY_CODES.UP].includes(code));
    });

    _defineProperty(_assertThisInitialized(_this), "isSelected", function (item) {
      var selectedItem = _this.state.selectedItem;
      if (!selectedItem) return false;
      return _this.getId(selectedItem) === _this.getId(item);
    });

    _defineProperty(_assertThisInitialized(_this), "renderHeader", function (value) {
      if (value[0] === '/') {
        return "Commands matching <strong>".concat(value.replace('/', ''), "</strong>");
      }

      if (value[0] === ':') {
        return "Emoji matching <strong>".concat(value.replace(':', ''), "</strong>");
      }

      if (value[0] === '@') {
        return "Searching for people";
      }
    });

    return _this;
  }

  _createClass(List, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.listeners.push(Listeners.add([KEY_CODES.DOWN, KEY_CODES.UP], this.scroll), Listeners.add([KEY_CODES.ENTER, KEY_CODES.TAB], this.onPressEnter));
      var values = this.props.values;
      if (values && values[0]) this.selectItem(values[0]);
    }
  }, {
    key: "UNSAFE_componentWillReceiveProps",
    value: function UNSAFE_componentWillReceiveProps(_ref) {
      var _this2 = this;

      var values = _ref.values;
      var newValues = values.map(function (val) {
        return _this2.getId(val);
      }).join('');

      if (this.cachedValues !== newValues && values && values[0]) {
        this.selectItem(values[0]);
        this.cachedValues = newValues;
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      var listener;

      while (this.listeners.length) {
        listener = this.listeners.pop();
        Listeners.remove(listener);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      var _this$props2 = this.props,
          values = _this$props2.values,
          component = _this$props2.component,
          style = _this$props2.style,
          itemClassName = _this$props2.itemClassName,
          className = _this$props2.className,
          itemStyle = _this$props2.itemStyle;
      return /*#__PURE__*/React__default.createElement("ul", {
        className: "rta__list ".concat(className || ''),
        style: style
      }, /*#__PURE__*/React__default.createElement("li", {
        className: "rta__list-header",
        dangerouslySetInnerHTML: {
          __html: this.renderHeader(this.props.value)
        }
      }), values.map(function (item) {
        return /*#__PURE__*/React__default.createElement(Item, {
          key: _this3.getId(item),
          innerRef: function innerRef(ref) {
            _this3.itemsRef[_this3.getId(item)] = ref;
          },
          selected: _this3.isSelected(item),
          item: item,
          className: itemClassName,
          style: itemStyle,
          onClickHandler: _this3.onPressEnter,
          onSelectHandler: _this3.selectItem,
          component: component
        });
      }));
    }
  }]);

  return List;
}(React__default.Component);

//
function defaultScrollToItem(container, item) {
  var itemHeight = parseInt(getComputedStyle(item).getPropertyValue('height'), 10);
  var containerHight = parseInt(getComputedStyle(container).getPropertyValue('height'), 10) - itemHeight;
  var itemOffsetTop = item.offsetTop;
  var actualScrollTop = container.scrollTop;

  if (itemOffsetTop < actualScrollTop + containerHight && actualScrollTop < itemOffsetTop) {
    return;
  } // eslint-disable-next-line


  container.scrollTop = itemOffsetTop;
}

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$3(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper$3(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$3(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$3() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var DEFAULT_CARET_POSITION = 'next';

var errorMessage = function errorMessage(message) {
  return console.error("RTA: dataProvider fails: ".concat(message, "\n    \nCheck the documentation or create issue if you think it's bug. https://github.com/webscopeio/react-textarea-autocomplete/issues"));
};

var ReactTextareaAutocomplete = /*#__PURE__*/function (_React$Component) {
  _inherits(ReactTextareaAutocomplete, _React$Component);

  var _super = _createSuper$3(ReactTextareaAutocomplete);

  function ReactTextareaAutocomplete(_props) {
    var _this;

    _classCallCheck(this, ReactTextareaAutocomplete);

    _this = _super.call(this, _props);

    _defineProperty(_assertThisInitialized(_this), "getSelectionPosition", function () {
      if (!_this.textareaRef) return null;
      return {
        selectionStart: _this.textareaRef.selectionStart,
        selectionEnd: _this.textareaRef.selectionEnd
      };
    });

    _defineProperty(_assertThisInitialized(_this), "getSelectedText", function () {
      if (!_this.textareaRef) return null;
      var _this$textareaRef = _this.textareaRef,
          selectionStart = _this$textareaRef.selectionStart,
          selectionEnd = _this$textareaRef.selectionEnd;
      if (selectionStart === selectionEnd) return null;
      return _this.state.value.substr(selectionStart, selectionEnd - selectionStart);
    });

    _defineProperty(_assertThisInitialized(_this), "setCaretPosition", function () {
      var position = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      if (!_this.textareaRef) return;

      _this.textareaRef.focus();

      _this.textareaRef.setSelectionRange(position, position);
    });

    _defineProperty(_assertThisInitialized(_this), "getCaretPosition", function () {
      if (!_this.textareaRef) {
        return 0;
      }

      return _this.textareaRef.selectionEnd;
    });

    _defineProperty(_assertThisInitialized(_this), "_onEnter", function (event) {
      var trigger = _this.state.currentTrigger;

      if (!_this.textareaRef) {
        return;
      }

      var hasFocus = _this.textareaRef.matches(':focus'); // don't submit if the element has focus or the shift key is pressed


      if (!hasFocus || event.shiftKey === true) {
        return;
      }

      if (!trigger || !_this.state.data) {
        // trigger a submit
        _this._replaceWord();

        if (_this.textareaRef) {
          _this.textareaRef.selectionEnd = 0;
        }

        _this.props.handleSubmit(event);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_onSpace", function () {
      if (!_this.props.replaceWord) {
        return;
      }

      if (!_this.textareaRef) {
        return;
      }

      var hasFocus = _this.textareaRef.matches(':focus'); // don't change characters if the element doesn't have focus


      if (!hasFocus) {
        return;
      }

      _this._replaceWord();
    });

    _defineProperty(_assertThisInitialized(_this), "_replaceWord", function () {
      var lastWordRegex = /([^\s]+)(\s*)$/;
      var value = _this.state.value;
      var match = lastWordRegex.exec(value.slice(0, _this.getCaretPosition()));
      var lastWord = match && match[1];

      if (!lastWord) {
        return;
      }

      var spaces = match[2];

      var newWord = _this.props.replaceWord(lastWord);

      if (newWord == null) {
        return;
      }

      var textBeforeWord = value.slice(0, _this.getCaretPosition() - match[0].length);
      var textAfterCaret = value.slice(_this.getCaretPosition(), -1);
      var newText = textBeforeWord + newWord + spaces + textAfterCaret;

      _this.setState({
        value: newText
      }, function () {
        // fire onChange event after successful selection
        var e = new CustomEvent('change', {
          bubbles: true
        });

        _this.textareaRef.dispatchEvent(e);

        if (_this.props.onChange) _this.props.onChange(e);
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_onSelect", function (newToken) {
      var _this$state = _this.state,
          selectionEnd = _this$state.selectionEnd,
          currentTrigger = _this$state.currentTrigger,
          textareaValue = _this$state.value;
      var _this$props = _this.props,
          onChange = _this$props.onChange,
          trigger = _this$props.trigger;
      if (!currentTrigger) return;

      var computeCaretPosition = function computeCaretPosition(position, token, startToken) {
        switch (position) {
          case 'start':
            return startToken;

          case 'next':
          case 'end':
            return startToken + token.length;

          default:
            if (!Number.isInteger(position)) {
              throw new Error('RTA: caretPosition should be "start", "next", "end" or number.');
            }

            return position;
        }
      };

      var textToModify = textareaValue.slice(0, selectionEnd);
      var startOfTokenPosition = textToModify.search(
      /**
       * It's important to escape the currentTrigger char for chars like [, (,...
       */
      new RegExp("\\".concat(currentTrigger, "[^\\".concat(currentTrigger, '\\s', "]"), "*$"))); // we add space after emoji is selected if a caret position is next

      var newTokenString = newToken.caretPosition === 'next' ? "".concat(newToken.text, " ") : newToken.text;
      var newCaretPosition = computeCaretPosition(newToken.caretPosition, newTokenString, startOfTokenPosition);
      var modifiedText = textToModify.substring(0, startOfTokenPosition) + newTokenString; // set the new textarea value and after that set the caret back to its position

      _this.setState({
        value: textareaValue.replace(textToModify, modifiedText),
        dataLoading: false
      }, function () {
        // fire onChange event after successful selection
        var e = new CustomEvent('change', {
          bubbles: true
        });

        _this.textareaRef.dispatchEvent(e);

        if (onChange) onChange(e);

        _this.setCaretPosition(newCaretPosition);
      });

      _this._closeAutocomplete();
    });

    _defineProperty(_assertThisInitialized(_this), "_getItemOnSelect", function () {
      var currentTrigger = _this.state.currentTrigger;

      var triggerSettings = _this._getCurrentTriggerSettings();

      if (!currentTrigger || !triggerSettings) return null;
      var callback = triggerSettings.callback;
      if (!callback) return null;
      return function (item) {
        if (typeof callback !== 'function') {
          throw new Error('Output functor is not defined! You have to define "output" function. https://github.com/webscopeio/react-textarea-autocomplete#trigger-type');
        }

        if (callback) {
          return callback(item, currentTrigger);
        }

        return null;
      };
    });

    _defineProperty(_assertThisInitialized(_this), "_getTextToReplace", function () {
      var _this$state2 = _this.state,
          currentTrigger = _this$state2.currentTrigger,
          actualToken = _this$state2.actualToken;

      var triggerSettings = _this._getCurrentTriggerSettings();

      if (!currentTrigger || !triggerSettings) return null;
      var output = triggerSettings.output;
      return function (item) {
        if (typeof item === 'object' && (!output || typeof output !== 'function')) {
          throw new Error('Output functor is not defined! If you are using items as object you have to define "output" function. https://github.com/webscopeio/react-textarea-autocomplete#trigger-type');
        }

        if (output) {
          var textToReplace = output(item, currentTrigger);

          if (!textToReplace || typeof textToReplace === 'number') {
            throw new Error("Output functor should return string or object in shape {text: string, caretPosition: string | number}.\nGot \"".concat(String(textToReplace), "\". Check the implementation for trigger \"").concat(currentTrigger, "\" and its token \"").concat(actualToken, "\"\n\nSee https://github.com/webscopeio/react-textarea-autocomplete#trigger-type for more informations.\n"));
          }

          if (typeof textToReplace === 'string') {
            return {
              text: textToReplace,
              caretPosition: DEFAULT_CARET_POSITION
            };
          }

          if (!textToReplace.text) {
            throw new Error("Output \"text\" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger \"".concat(currentTrigger, "\" and its token \"").concat(actualToken, "\"\n"));
          }

          if (!textToReplace.caretPosition) {
            throw new Error("Output \"caretPosition\" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger \"".concat(currentTrigger, "\" and its token \"").concat(actualToken, "\"\n"));
          }

          return textToReplace;
        }

        if (typeof item !== 'string') {
          throw new Error('Output item should be string\n');
        }

        return {
          text: "".concat(currentTrigger).concat(item).concat(currentTrigger),
          caretPosition: DEFAULT_CARET_POSITION
        };
      };
    });

    _defineProperty(_assertThisInitialized(_this), "_getCurrentTriggerSettings", function () {
      var currentTrigger = _this.state.currentTrigger;
      if (!currentTrigger) return null;
      return _this.props.trigger[currentTrigger];
    });

    _defineProperty(_assertThisInitialized(_this), "_getValuesFromProvider", function () {
      var _this$state3 = _this.state,
          currentTrigger = _this$state3.currentTrigger,
          actualToken = _this$state3.actualToken;

      var triggerSettings = _this._getCurrentTriggerSettings();

      if (!currentTrigger || !triggerSettings) {
        return;
      }

      var dataProvider = triggerSettings.dataProvider,
          component = triggerSettings.component;

      if (typeof dataProvider !== 'function') {
        throw new Error('Trigger provider has to be a function!');
      }

      _this.setState({
        dataLoading: true
      }); // Modified: send the full text to support / style commands


      dataProvider(actualToken, _this.state.value, function (data, token) {
        // Make sure that the result is still relevant for current query
        if (token !== _this.state.actualToken) return;

        if (!Array.isArray(data)) {
          throw new Error('Trigger provider has to provide an array!');
        }

        if (!reactIs.isValidElementType(component)) {
          throw new Error('Component should be defined!');
        } // throw away if we resolved old trigger


        if (currentTrigger !== _this.state.currentTrigger) return; // if we haven't resolved any data let's close the autocomplete

        if (!data.length) {
          _this._closeAutocomplete();

          return;
        }

        _this.setState({
          dataLoading: false,
          data,
          component
        });
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_getSuggestions", function () {
      var _this$state4 = _this.state,
          currentTrigger = _this$state4.currentTrigger,
          data = _this$state4.data;
      if (!currentTrigger || !data || data && !data.length) return null;
      return data;
    });

    _defineProperty(_assertThisInitialized(_this), "_createRegExp", function () {
      var trigger = _this.props.trigger; // negative lookahead to match only the trigger + the actual token = "bladhwd:adawd:word test" => ":word"
      // https://stackoverflow.com/a/8057827/2719917

      _this.tokenRegExp = new RegExp("([".concat(Object.keys(trigger).join(''), "])(?:(?!\\1)[^\\s])*$"));
    });

    _defineProperty(_assertThisInitialized(_this), "_closeAutocomplete", function () {
      _this.setState({
        data: null,
        dataLoading: false,
        currentTrigger: null,
        top: null,
        left: null
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_cleanUpProps", function () {
      var props = _objectSpread$3({}, _this.props);

      var notSafe = ['loadingComponent', 'containerStyle', 'minChar', 'scrollToItem', 'ref', 'innerRef', 'onChange', 'onCaretPositionChange', 'className', 'value', 'trigger', 'listStyle', 'itemStyle', 'containerStyle', 'loaderStyle', 'className', 'containerClassName', 'listClassName', 'itemClassName', 'loaderClassName', 'closeOnClickOutside', 'dropdownStyle', 'dropdownClassName', 'movePopupAsYouType', 'handleSubmit', 'replaceWord', 'grow', 'additionalTextareaProps']; // eslint-disable-next-line

      for (var prop in props) {
        if (notSafe.includes(prop)) delete props[prop];
      }

      return props;
    });

    _defineProperty(_assertThisInitialized(_this), "_isCommand", function (text) {
      if (text[0] !== '/') return false;
      var tokens = text.split(' ');
      if (tokens.length > 1) return false;
      return true;
    });

    _defineProperty(_assertThisInitialized(_this), "_changeHandler", function (e) {
      var _this$props2 = _this.props,
          trigger = _this$props2.trigger,
          onChange = _this$props2.onChange,
          minChar = _this$props2.minChar,
          onCaretPositionChange = _this$props2.onCaretPositionChange,
          movePopupAsYouType = _this$props2.movePopupAsYouType;
      var _this$state5 = _this.state,
          top = _this$state5.top,
          left = _this$state5.left;
      var textarea = e.target;
      var selectionEnd = textarea.selectionEnd,
          selectionStart = textarea.selectionStart;
      var value = textarea.value;

      if (onChange) {
        e.persist();
        onChange(e);
      }

      if (onCaretPositionChange) {
        var caretPosition = _this.getCaretPosition();

        onCaretPositionChange(caretPosition);
      }

      _this.setState({
        value
      });

      var currentTrigger;
      var lastToken;

      if (_this._isCommand(value)) {
        currentTrigger = '/';
        lastToken = value;
      } else {
        var tokenMatch = value.slice(0, selectionEnd).match(/(?!^|\W)?[:@][^\s]*\s?[^\s]*$/g);
        lastToken = tokenMatch && tokenMatch[tokenMatch.length - 1].trim();
        currentTrigger = lastToken && Object.keys(trigger).find(function (a) {
          return a === lastToken[0];
        }) || null;
      }
      /*
       if we lost the trigger token or there is no following character we want to close
       the autocomplete
      */


      if (!lastToken || lastToken.length <= minChar) {
        _this._closeAutocomplete();

        return;
      }

      var actualToken = lastToken.slice(1); // if trigger is not configured step out from the function, otherwise proceed

      if (!currentTrigger) {
        return;
      }

      if (movePopupAsYouType || top === null && left === null || // if we have single char - trigger it means we want to re-position the autocomplete
      lastToken.length === 1) {
        var _getCaretCoordinates = getCaretCoordinates(textarea, selectionEnd),
            newTop = _getCaretCoordinates.top,
            newLeft = _getCaretCoordinates.left;

        _this.setState({
          // make position relative to textarea
          top: newTop - _this.textareaRef.scrollTop || 0,
          left: newLeft
        });
      }

      _this.setState({
        selectionEnd,
        selectionStart,
        currentTrigger,
        actualToken
      }, function () {
        try {
          _this._getValuesFromProvider();
        } catch (err) {
          errorMessage(err.message);
        }
      });
    });

    _defineProperty(_assertThisInitialized(_this), "_selectHandler", function (e) {
      var _this$props3 = _this.props,
          onCaretPositionChange = _this$props3.onCaretPositionChange,
          onSelect = _this$props3.onSelect;

      if (onCaretPositionChange) {
        var caretPosition = _this.getCaretPosition();

        onCaretPositionChange(caretPosition);
      }

      if (onSelect) {
        e.persist();
        onSelect(e);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_onClickAndBlurHandler", function (e) {
      var _this$props4 = _this.props,
          closeOnClickOutside = _this$props4.closeOnClickOutside,
          onBlur = _this$props4.onBlur; // If this is a click: e.target is the textarea, and e.relatedTarget is the thing
      // that was actually clicked. If we clicked inside the autoselect dropdown, then
      // that's not a blur, from the autoselect's point of view, so then do nothing.

      var el = e.relatedTarget;

      if (_this.dropdownRef && el instanceof Node && _this.dropdownRef.contains(el)) {
        return;
      }

      if (closeOnClickOutside) {
        _this._closeAutocomplete();
      }

      if (onBlur) {
        e.persist();
        onBlur(e);
      }
    });

    _defineProperty(_assertThisInitialized(_this), "_onScrollHandler", function () {
      _this._closeAutocomplete();
    });

    _defineProperty(_assertThisInitialized(_this), "_dropdownScroll", function (item) {
      var scrollToItem = _this.props.scrollToItem;
      if (!scrollToItem) return;

      if (scrollToItem === true) {
        defaultScrollToItem(_this.dropdownRef, item);
        return;
      }

      if (typeof scrollToItem !== 'function' || scrollToItem.length !== 2) {
        throw new Error('`scrollToItem` has to be boolean (true for default implementation) or function with two parameters: container, item.');
      }

      scrollToItem(_this.dropdownRef, item);
    });

    var _this$props5 = _this.props,
        loadingComponent = _this$props5.loadingComponent,
        _trigger = _this$props5.trigger,
        _value = _this$props5.value; // TODO: it would be better to have the parent control state...
    // if (value) this.state.value = value;

    _this._createRegExp();

    if (!loadingComponent) {
      throw new Error('RTA: loadingComponent is not defined');
    }

    if (!_trigger) {
      throw new Error('RTA: trigger is not defined');
    }

    _this.state = {
      top: null,
      left: null,
      currentTrigger: null,
      actualToken: '',
      data: null,
      value: _value || '',
      dataLoading: false,
      selectionEnd: 0,
      selectionStart: 0,
      component: null,
      listenerIndex: 0
    };
    return _this;
  }

  _createClass(ReactTextareaAutocomplete, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      Listeners.add(KEY_CODES.ESC, function () {
        return _this2._closeAutocomplete();
      });
      Listeners.add(KEY_CODES.SPACE, function () {
        return _this2._onSpace();
      });
      var listenerIndex = Listeners.add(KEY_CODES.ENTER, function (e) {
        return _this2._onEnter(e);
      });
      this.setState({
        listenerIndex
      });
      Listeners.startListen();
    }
  }, {
    key: "UNSAFE_componentWillReceiveProps",
    value: function UNSAFE_componentWillReceiveProps(nextProps) {
      this._update(nextProps);
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      Listeners.stopListen();
      Listeners.remove(this.state.listenerIndex);
    }
  }, {
    key: "_update",
    // TODO: This is an anti pattern in react, should come up with a better way
    value: function _update(_ref) {
      var value = _ref.value,
          trigger = _ref.trigger;
      var oldValue = this.state.value;
      var oldTrigger = this.props.trigger;
      if (value !== oldValue || !oldValue) this.setState({
        value
      });
      /**
       * check if trigger chars are changed, if so, change the regexp accordingly
       */

      if (Object.keys(trigger).join('') !== Object.keys(oldTrigger).join('')) {
        this._createRegExp();
      }
    }
    /**
     * Close autocomplete, also clean up trigger (to avoid slow promises)
     */

  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      var _this$props6 = this.props,
          Loader = _this$props6.loadingComponent,
          style = _this$props6.style,
          className = _this$props6.className,
          itemStyle = _this$props6.itemStyle,
          listClassName = _this$props6.listClassName,
          itemClassName = _this$props6.itemClassName,
          dropdownClassName = _this$props6.dropdownClassName,
          dropdownStyle = _this$props6.dropdownStyle,
          containerStyle = _this$props6.containerStyle,
          containerClassName = _this$props6.containerClassName,
          loaderStyle = _this$props6.loaderStyle,
          loaderClassName = _this$props6.loaderClassName;
      var _this$state6 = this.state,
          dataLoading = _this$state6.dataLoading,
          currentTrigger = _this$state6.currentTrigger,
          component = _this$state6.component,
          value = _this$state6.value;

      var suggestionData = this._getSuggestions();

      var textToReplace = this._getTextToReplace();

      var selectedItem = this._getItemOnSelect();

      var maxRows = this.props.maxRows;

      if (!this.props.grow) {
        maxRows = 1;
      }

      return /*#__PURE__*/React__default.createElement("div", {
        className: "rta ".concat(dataLoading === true ? 'rta--loading' : '', " ").concat(containerClassName || ''),
        style: containerStyle
      }, (dataLoading || suggestionData) && currentTrigger && /*#__PURE__*/React__default.createElement("div", {
        ref: function ref(_ref2) {
          // $FlowFixMe
          _this3.dropdownRef = _ref2;
        },
        style: _objectSpread$3({}, dropdownStyle),
        className: "rta__autocomplete ".concat(dropdownClassName || '')
      }, suggestionData && component && textToReplace && /*#__PURE__*/React__default.createElement(List, {
        value: value,
        values: suggestionData,
        component: component,
        className: listClassName,
        itemClassName: itemClassName,
        itemStyle: itemStyle,
        getTextToReplace: textToReplace,
        getSelectedItem: selectedItem,
        onSelect: this._onSelect,
        dropdownScroll: this._dropdownScroll
      })), /*#__PURE__*/React__default.createElement(Textarea, _extends({}, this._cleanUpProps(), {
        ref: function ref(_ref3) {
          _this3.props.innerRef && _this3.props.innerRef(_ref3);
          _this3.textareaRef = _ref3;
        },
        maxRows: maxRows,
        className: "rta__textarea ".concat(className || ''),
        onChange: this._changeHandler,
        onSelect: this._selectHandler,
        onScroll: this._onScrollHandler,
        onClick: // The textarea itself is outside the autoselect dropdown.
        this._onClickAndBlurHandler,
        onBlur: this._onClickAndBlurHandler,
        onFocus: this.props.onFocus,
        value: value,
        style: style
      }, this.props.additionalTextareaProps)));
    }
  }]);

  return ReactTextareaAutocomplete;
}(React__default.Component);

_defineProperty(ReactTextareaAutocomplete, "defaultProps", {
  closeOnClickOutside: true,
  movePopupAsYouType: false,
  value: '',
  minChar: 1,
  scrollToItem: true,
  maxRows: 10
});

var triggerPropsCheck = function triggerPropsCheck(_ref4) {
  var trigger = _ref4.trigger;
  if (!trigger) return Error('Invalid prop trigger. Prop missing.');
  var triggers = Object.entries(trigger);

  for (var i = 0; i < triggers.length; i += 1) {
    var _triggers$i = _slicedToArray(triggers[i], 2),
        triggerChar = _triggers$i[0],
        settings = _triggers$i[1];

    if (typeof triggerChar !== 'string' || triggerChar.length !== 1) {
      return Error('Invalid prop trigger. Keys of the object has to be string / one character.');
    } // $FlowFixMe


    var triggerSetting = settings;
    var component = triggerSetting.component,
        dataProvider = triggerSetting.dataProvider,
        output = triggerSetting.output,
        callback = triggerSetting.callback;

    if (!reactIs.isValidElementType(component)) {
      return Error('Invalid prop trigger: component should be defined.');
    }

    if (!dataProvider || typeof dataProvider !== 'function') {
      return Error('Invalid prop trigger: dataProvider should be defined.');
    }

    if (output && typeof output !== 'function') {
      return Error('Invalid prop trigger: output should be a function.');
    }

    if (callback && typeof callback !== 'function') {
      return Error('Invalid prop trigger: callback should be a function.');
    }
  }

  return null;
};

ReactTextareaAutocomplete.propTypes = {
  loadingComponent: PropTypes.elementType,
  minChar: PropTypes.number,
  onChange: PropTypes.func,
  onSelect: PropTypes.func,
  onBlur: PropTypes.func,
  onCaretPositionChange: PropTypes.func,
  className: PropTypes.string,
  containerStyle: PropTypes.object,
  containerClassName: PropTypes.string,
  closeOnClickOutside: PropTypes.bool,
  style: PropTypes.object,
  listStyle: PropTypes.object,
  itemStyle: PropTypes.object,
  loaderStyle: PropTypes.object,
  dropdownStyle: PropTypes.object,
  listClassName: PropTypes.string,
  itemClassName: PropTypes.string,
  loaderClassName: PropTypes.string,
  dropdownClassName: PropTypes.string,
  value: PropTypes.string,
  trigger: triggerPropsCheck //eslint-disable-line

};

/**
 * Avatar - A round avatar image with fallback to username's first letter
 *
 * @example ../../docs/Avatar.md
 * @typedef {import('../types').AvatarProps} Props
 * @type { React.FC<Props>}
 */

var Avatar = function Avatar(_ref) {
  var _ref$size = _ref.size,
      size = _ref$size === void 0 ? 32 : _ref$size,
      name = _ref.name,
      _ref$shape = _ref.shape,
      shape = _ref$shape === void 0 ? 'circle' : _ref$shape,
      image = _ref.image,
      _ref$onClick = _ref.onClick,
      onClick = _ref$onClick === void 0 ? function () {} : _ref$onClick,
      _ref$onMouseOver = _ref.onMouseOver,
      onMouseOver = _ref$onMouseOver === void 0 ? function () {} : _ref$onMouseOver;

  var _useState = React.useState(false),
      _useState2 = _slicedToArray(_useState, 2),
      loaded = _useState2[0],
      setLoaded = _useState2[1];

  var _useState3 = React.useState(false),
      _useState4 = _slicedToArray(_useState3, 2),
      error = _useState4[0],
      setError = _useState4[1];

  React.useEffect(function () {
    setLoaded(false);
    setError(false);
  }, [image]);
  var initials = (name || '').charAt(0);
  return /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "avatar",
    className: "str-chat__avatar str-chat__avatar--".concat(shape),
    title: name,
    style: {
      width: size,
      height: size,
      flexBasis: size,
      lineHeight: "".concat(size, "px"),
      fontSize: size / 2
    },
    onClick: onClick,
    onMouseOver: onMouseOver
  }, image && !error ? /*#__PURE__*/React__default.createElement("img", {
    "data-testid": "avatar-img",
    src: image,
    alt: initials,
    className: "str-chat__avatar-image".concat(loaded ? ' str-chat__avatar-image--loaded' : ''),
    style: {
      width: size,
      height: size,
      flexBasis: size,
      objectFit: 'cover'
    },
    onLoad: function onLoad() {
      return setLoaded(true);
    },
    onError: function onError() {
      return setError(true);
    }
  }) : /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "avatar-fallback",
    className: "str-chat__avatar-fallback"
  }, initials));
};

Avatar.propTypes = {
  /** image url */
  image: PropTypes.string,

  /** name of the picture, used for title tag fallback */
  name: PropTypes.string,

  /** shape of the avatar, circle, rounded or square */
  shape: PropTypes.oneOf(['circle', 'rounded', 'square']),

  /** size in pixels */
  size: PropTypes.number,

  /** click event handler */
  onClick: PropTypes.func,

  /** mouseOver event handler */
  onMouseOver: PropTypes.func
};

/** @type {React.FC<import('../types').ChannelPreviewUIComponentProps>} */

var ChannelPreviewCountOnly = function ChannelPreviewCountOnly(_ref) {
  var channel = _ref.channel,
      setActiveChannel = _ref.setActiveChannel,
      watchers = _ref.watchers,
      unread = _ref.unread,
      displayTitle = _ref.displayTitle;
  return /*#__PURE__*/React__default.createElement("div", {
    className: unread >= 1 ? 'unread' : ''
  }, /*#__PURE__*/React__default.createElement("button", {
    onClick: function onClick() {
      return setActiveChannel(channel, watchers);
    }
  }, ' ', displayTitle, " ", /*#__PURE__*/React__default.createElement("span", null, unread)));
};

ChannelPreviewCountOnly.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,

  /** @see See [chat context](https://getstream.github.io/stream-chat-react/#chat) for doc */
  setActiveChannel: PropTypes.func.isRequired,

  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers:
  /** @type {PropTypes.Validator<{ limit?: number | undefined; offset?: number | undefined} | null | undefined> | undefined} */
  PropTypes.object,

  /** Number of unread messages */
  unread: PropTypes.number,

  /** Title of channel to display */
  displayTitle: PropTypes.string
};
var ChannelPreviewCountOnly$1 = /*#__PURE__*/React__default.memo(ChannelPreviewCountOnly);

var getLatestMessagePreview = function getLatestMessagePreview(channel, t) {
  var latestMessage = channel.state.messages[channel.state.messages.length - 1];

  if (!latestMessage) {
    return t('Nothing yet...');
  }

  if (latestMessage.deleted_at) {
    return t('Message deleted');
  }

  if (latestMessage.text) {
    return latestMessage.text;
  }

  if (latestMessage.command) {
    return "/".concat(latestMessage.command);
  }

  if (latestMessage.attachments.length) {
    return t('🏙 Attachment...');
  }

  return t('Empty message...');
};
var getDisplayTitle = function getDisplayTitle(channel, currentUser) {
  var title = channel.data.name;
  var members = Object.values(channel.state.members);

  if (!title && members.length === 2) {
    var otherMember = members.find(function (m) {
      return m.user.id !== currentUser.id;
    });
    title = otherMember.user.name;
  }

  return title;
};
var getDisplayImage = function getDisplayImage(channel, currentUser) {
  var image = channel.data.image;
  var members = Object.values(channel.state.members);

  if (!image && members.length === 2) {
    var otherMember = members.find(function (m) {
      return m.user.id !== currentUser.id;
    });
    image = otherMember.user.image;
  }

  return image;
};

/**
 * @type {React.FC<import('../types').ChannelPreviewProps>}
 */

var ChannelPreview = function ChannelPreview(props) {
  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var _useContext2 = React.useContext(ChatContext),
      client = _useContext2.client,
      activeChannel = _useContext2.channel,
      setActiveChannel = _useContext2.setActiveChannel;

  var channel = props.channel,
      _props$Preview = props.Preview,
      Preview = _props$Preview === void 0 ? ChannelPreviewCountOnly$1 : _props$Preview;

  var _useState = React.useState(
  /** @type {import('stream-chat').MessageResponse | undefined} */
  undefined),
      _useState2 = _slicedToArray(_useState, 2),
      lastMessage = _useState2[0],
      setLastMessage = _useState2[1];

  var _useState3 = React.useState(0),
      _useState4 = _slicedToArray(_useState3, 2),
      unread = _useState4[0],
      setUnread = _useState4[1];

  React.useEffect(function () {
    setUnread(channel.countUnread());
  }, [channel]);
  React.useEffect(function () {
    /** @type {(event: StreamChat.Event) => void} Typescript syntax */
    var handleEvent = function handleEvent(event) {
      var isActive = (activeChannel === null || activeChannel === void 0 ? void 0 : activeChannel.cid) === channel.cid;
      setLastMessage(event.message);

      if (!isActive) {
        setUnread(channel.countUnread());
      } else {
        setUnread(0);
      }
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);
    return function () {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
    };
  }, [channel, activeChannel]);
  React.useEffect(function () {
    var isActive = (activeChannel === null || activeChannel === void 0 ? void 0 : activeChannel.cid) === channel.cid;

    if (isActive) {
      setUnread(0);
    } else {
      setUnread(channel.countUnread());
    }
  }, [activeChannel, channel]);

  if (!Preview) {
    return null;
  }

  return /*#__PURE__*/React__default.createElement(Preview, _extends({}, props, {
    setActiveChannel: setActiveChannel,
    lastMessage: lastMessage,
    unread: unread,
    latestMessage: getLatestMessagePreview(channel, t),
    displayTitle: getDisplayTitle(channel, client.user),
    displayImage: getDisplayImage(channel, client.user),
    active: activeChannel && activeChannel.cid === channel.cid
  }));
};

ChannelPreview.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel:
  /** @type {PropTypes.Validator<import('stream-chat').Channel>} */
  PropTypes.object.isRequired,

  /** Current selected channel object */
  activeChannel:
  /** @type {PropTypes.Validator<import('stream-chat').Channel | null | undefined>} */
  PropTypes.object,

  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview:
  /** @type {PropTypes.Validator<React.ComponentType<import('../types').ChannelPreviewUIComponentProps>>} */
  PropTypes.elementType
};

// @ts-check
/**
 *
 * @example ../../docs/ChannelPreviewCompact.md
 * @type {import('../types').ChannelPreviewCompact}
 */

var ChannelPreviewCompact = function ChannelPreviewCompact(props) {
  /**
   * @type {React.MutableRefObject<HTMLButtonElement | null>} Typescript syntax
   */
  var channelPreviewButton = React.useRef(null);
  var unreadClass = props.unread_count >= 1 ? 'str-chat__channel-preview-compact--unread' : '';
  var activeClass = props.active ? 'str-chat__channel-preview-compact--active' : '';

  var onSelectChannel = function onSelectChannel() {
    var _channelPreviewButton;

    props.setActiveChannel(props.channel, props.watchers); // eslint-disable-next-line no-unused-expressions

    channelPreviewButton === null || channelPreviewButton === void 0 ? void 0 : (_channelPreviewButton = channelPreviewButton.current) === null || _channelPreviewButton === void 0 ? void 0 : _channelPreviewButton.blur();
  };

  return /*#__PURE__*/React__default.createElement("button", {
    "data-testid": "channel-preview-button",
    onClick: onSelectChannel,
    ref: channelPreviewButton,
    className: "str-chat__channel-preview-compact ".concat(unreadClass, " ").concat(activeClass)
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-preview-compact--left"
  }, /*#__PURE__*/React__default.createElement(Avatar, {
    image: props.displayImage,
    size: 20
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-preview-compact--right"
  }, props.displayTitle));
};

ChannelPreviewCompact.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.instanceOf(streamChat.Channel).isRequired,

  /** Current selected channel object */
  activeChannel: PropTypes.instanceOf(streamChat.Channel),

  /** Setter for selected channel */
  setActiveChannel: PropTypes.func.isRequired,

  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers:
  /** @type {PropTypes.Validator<{ limit?: number | undefined; offset?: number | undefined} | null | undefined> | undefined} */
  PropTypes.object,

  /** Number of unread messages */
  unread: PropTypes.number,

  /** If channel of component is active (selected) channel */
  active: PropTypes.bool,

  /** Latest message's text. */
  latestMessage: PropTypes.string,

  /** Title of channel to display */
  displayTitle: PropTypes.string,

  /** Image of channel to display */
  displayImage: PropTypes.string
};
var ChannelPreviewCompact$1 = /*#__PURE__*/React__default.memo(ChannelPreviewCompact);

// @ts-check
/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 *
 * @example ../../docs/ChannelPreviewLastMessage.md
 * @type {import('../types').ChannelPreviewLastMessage}
 */

var ChannelPreviewLastMessage = function ChannelPreviewLastMessage(props) {
  /** @type {React.MutableRefObject<HTMLButtonElement | null>} Typescript syntax */
  var channelPreviewButton = React.useRef(null);

  var onSelectChannel = function onSelectChannel() {
    var _channelPreviewButton;

    props.setActiveChannel(props.channel, props.watchers); // eslint-disable-next-line no-unused-expressions

    channelPreviewButton === null || channelPreviewButton === void 0 ? void 0 : (_channelPreviewButton = channelPreviewButton.current) === null || _channelPreviewButton === void 0 ? void 0 : _channelPreviewButton.blur();
  };

  var unreadClass = props.unread >= 1 ? 'str-chat__channel-preview--unread' : '';
  var activeClass = props.active ? 'str-chat__channel-preview--active' : '';
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-preview ".concat(unreadClass, " ").concat(activeClass)
  }, /*#__PURE__*/React__default.createElement("button", {
    onClick: onSelectChannel,
    ref: channelPreviewButton,
    "data-testid": "channel-preview-button"
  }, props.unread >= 1 && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-preview--dot"
  }), /*#__PURE__*/React__default.createElement(Avatar, {
    image: props.displayImage
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-preview-info"
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__channel-preview-title"
  }, props.displayTitle), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__channel-preview-last-message"
  }, truncate(props.latestMessage, props.latestMessageLength)), props.unread >= 1 && /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__channel-preview-unread-count"
  }, props.unread))));
};

ChannelPreviewLastMessage.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,

  /** Current selected channel object */
  activeChannel: PropTypes.object,

  /** Setter for selected channel */
  setActiveChannel: PropTypes.func.isRequired,

  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers: PropTypes.object,

  /** Number of unread messages */
  unread: PropTypes.number,

  /** If channel of component is active (selected) channel */
  active: PropTypes.bool,

  /** Latest message's text. */
  latestMessage: PropTypes.string,

  /** Length of latest message to truncate at */
  latestMessageLength: PropTypes.number,

  /** Title of channel to display */
  displayTitle: PropTypes.string,

  /** Image of channel to display */
  displayImage: PropTypes.string
};
ChannelPreviewLastMessage.defaultProps = {
  latestMessageLength: 20
};
var ChannelPreviewLastMessage$1 = /*#__PURE__*/React__default.memo(ChannelPreviewLastMessage);

// @ts-check
/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 *
 * @example ../../docs/ChannelPreviewMessenger.md
 * @type {import('../types').ChannelPreviewMessenger}
 */

var ChannelPreviewMessenger = function ChannelPreviewMessenger(props) {
  /** @type {React.MutableRefObject<HTMLButtonElement | null>} Typescript syntax */
  var channelPreviewButton = React.useRef(null);
  var unreadClass = props.unread >= 1 ? 'str-chat__channel-preview-messenger--unread' : '';
  var activeClass = props.active ? 'str-chat__channel-preview-messenger--active' : '';

  var onSelectChannel = function onSelectChannel() {
    var _channelPreviewButton;

    props.setActiveChannel(props.channel, props.watchers); // eslint-disable-next-line no-unused-expressions

    channelPreviewButton === null || channelPreviewButton === void 0 ? void 0 : (_channelPreviewButton = channelPreviewButton.current) === null || _channelPreviewButton === void 0 ? void 0 : _channelPreviewButton.blur();
  };

  return /*#__PURE__*/React__default.createElement("button", {
    onClick: onSelectChannel,
    ref: channelPreviewButton,
    className: "str-chat__channel-preview-messenger ".concat(unreadClass, " ").concat(activeClass),
    "data-testid": "channel-preview-button"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-preview-messenger--left"
  }, /*#__PURE__*/React__default.createElement(Avatar, {
    image: props.displayImage,
    size: 40
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-preview-messenger--right"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-preview-messenger--name"
  }, /*#__PURE__*/React__default.createElement("span", null, props.displayTitle)), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-preview-messenger--last-message"
  }, truncate(props.latestMessage, props.latestMessageLength))));
};

ChannelPreviewMessenger.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,

  /** Current selected channel object */
  activeChannel: PropTypes.object,

  /** Setter for selected channel */
  setActiveChannel: PropTypes.func.isRequired,

  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers: PropTypes.object,

  /** Number of unread messages */
  unread: PropTypes.number,

  /** If channel of component is active (selected) channel */
  active: PropTypes.bool,

  /** Latest message's text. */
  latestMessage: PropTypes.string,

  /** Length of latest message to truncate at */
  latestMessageLength: PropTypes.number,

  /** Title of channel to display */
  displayTitle: PropTypes.string,

  /** Image of channel to display */
  displayImage: PropTypes.string
};
ChannelPreviewMessenger.defaultProps = {
  latestMessageLength: 14
};
var ChannelPreviewMessenger$1 = /*#__PURE__*/React__default.memo(ChannelPreviewMessenger);

// @ts-check
var ReplyIcon = function ReplyIcon() {
  return /*#__PURE__*/React__default.createElement("svg", {
    width: "18",
    height: "15",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M.56 10.946H.06l-.002-.498L.025.92a.5.5 0 1 1 1-.004l.032 9.029H9.06v-4l9 4.5-9 4.5v-4H.56z",
    fillRule: "nonzero"
  }));
};
var DeliveredCheckIcon = function DeliveredCheckIcon() {
  return /*#__PURE__*/React__default.createElement("svg", {
    width: "16",
    height: "16",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.72 6.633a.955.955 0 1 0-1.352-1.352L6.986 8.663 5.633 7.31A.956.956 0 1 0 4.28 8.663l2.029 2.028a.956.956 0 0 0 1.353 0l4.058-4.058z",
    fill: "#006CFF",
    fillRule: "evenodd"
  }));
};
var ReactionIcon = function ReactionIcon() {
  return /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "14",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z",
    fillRule: "evenodd"
  }));
};
var ThreadIcon = function ThreadIcon() {
  return /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "10",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z",
    fillRule: "evenodd"
  }));
};
var ErrorIcon = function ErrorIcon() {
  return /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "14",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zm.875 10.938a.438.438 0 0 1-.438.437h-.875a.438.438 0 0 1-.437-.438v-.874c0-.242.196-.438.438-.438h.875c.241 0 .437.196.437.438v.874zm0-2.626a.438.438 0 0 1-.438.438h-.875a.438.438 0 0 1-.437-.438v-5.25c0-.241.196-.437.438-.437h.875c.241 0 .437.196.437.438v5.25z",
    fill: "#EA152F",
    fillRule: "evenodd"
  }));
};

// @ts-check
/** @type {React.FC<import("types").MessageRepliesCountButtonProps>} */

var MessageRepliesCountButton = function MessageRepliesCountButton(_ref) {
  var reply_count = _ref.reply_count,
      labelSingle = _ref.labelSingle,
      labelPlural = _ref.labelPlural,
      onClick = _ref.onClick;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var singleReplyText;
  var pluralReplyText;

  if (reply_count === 1) {
    if (labelSingle) {
      singleReplyText = "1 ".concat(labelSingle);
    } else {
      singleReplyText = t('1 reply');
    }
  }

  if (reply_count && reply_count > 1) {
    if (labelPlural) {
      pluralReplyText = "".concat(reply_count, " ").concat(labelPlural);
    } else {
      pluralReplyText = t('{{ replyCount }} replies', {
        replyCount: reply_count
      });
    }
  }

  if (reply_count && reply_count !== 0) {
    return /*#__PURE__*/React__default.createElement("button", {
      "data-testid": "replies-count-button",
      className: "str-chat__message-replies-count-button",
      onClick: onClick
    }, /*#__PURE__*/React__default.createElement(ReplyIcon, null), reply_count === 1 ? singleReplyText : pluralReplyText);
  }

  return null;
};

MessageRepliesCountButton.defaultProps = {
  reply_count: 0
};
MessageRepliesCountButton.propTypes = {
  /** Label for number of replies, when count is 1 */
  labelSingle: PropTypes.string,

  /** Label for number of replies, when count is more than 1 */
  labelPlural: PropTypes.string,

  /** Number of replies */
  reply_count: PropTypes.number,

  /**
   * click handler for button
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  onClick: PropTypes.func
};
var MessageRepliesCountButton$1 = /*#__PURE__*/React__default.memo(MessageRepliesCountButton);

// @ts-check
/** @type {React.FC<import("types").ModalProps>} */

var Modal = function Modal(_ref) {
  var children = _ref.children,
      onClose = _ref.onClose,
      open = _ref.open;

  /** @type {React.RefObject<HTMLDivElement>} */
  var innerRef = React.useRef(null);

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;
  /** @param {React.MouseEvent} e */


  var handleClick = function handleClick(e) {
    var _innerRef$current;

    if (e.target instanceof Node && !((_innerRef$current = innerRef.current) === null || _innerRef$current === void 0 ? void 0 : _innerRef$current.contains(e.target)) && onClose) {
      onClose();
    }
  };

  React.useEffect(function () {
    if (!open) return function () {};
    /** @type {EventListener} */

    var handleEscKey = function handleEscKey(e) {
      if (e instanceof KeyboardEvent && e.keyCode === 27 && onClose) {
        onClose();
      }
    };

    document.addEventListener('keyPress', handleEscKey, false);
    return function () {
      return document.removeEventListener('keyPress', handleEscKey, false);
    };
  }, [onClose, open]);
  var openClasses = open ? 'str-chat__modal--open' : 'str-chat__modal--closed';
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__modal ".concat(openClasses),
    onClick: handleClick
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__modal__close-button"
  }, t('Close'), /*#__PURE__*/React__default.createElement("svg", {
    width: "10",
    height: "10",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z",
    fillRule: "evenodd"
  }))), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__modal__inner",
    ref: innerRef
  }, children));
};

Modal.propTypes = {
  /** Callback handler for closing of modal. */
  onClose: PropTypes.func.isRequired,

  /** If true, modal is opened or visible. */
  open: PropTypes.bool.isRequired
};

// @ts-check

var LoadingItems = function LoadingItems() {
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__loading-channels-item"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__loading-channels-avatar"
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__loading-channels-meta"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__loading-channels-username"
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__loading-channels-status"
  })));
};
/**
 * LoadingChannels - Fancy loading indicator for the channel list
 *
 * @example ../../docs/LoadingChannels.md
 */


var LoadingChannels = function LoadingChannels() {
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__loading-channels"
  }, /*#__PURE__*/React__default.createElement(LoadingItems, null), /*#__PURE__*/React__default.createElement(LoadingItems, null), /*#__PURE__*/React__default.createElement(LoadingItems, null));
};

var LoadingChannels$1 = /*#__PURE__*/React__default.memo(LoadingChannels);

// @ts-check
/**
 * LoadingErrorIndicator - UI component for error indicator in Channel.
 *
 * @example ../../docs/LoadingErrorIndicator.md
 * @type {React.FC<import('../types').LoadingErrorIndicatorProps>}
 */

var LoadingErrorIndicator = function LoadingErrorIndicator(_ref) {
  var error = _ref.error;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  if (!error) return null;
  return (
    /*#__PURE__*/
    // @ts-ignore
    React__default.createElement("div", null, t('Error: {{ errorMessage }}', {
      errorMessage: error.message
    }))
  );
};

LoadingErrorIndicator.defaultProps = {
  error: null
};
LoadingErrorIndicator.propTypes = {
  /** Error object */
  error: PropTypes.instanceOf(Error)
};
var LoadingErrorIndicatorComponent = /*#__PURE__*/React__default.memo(LoadingErrorIndicator);

// @ts-check
/**
 * LoadingIndicator - Just a simple loading spinner..
 *
 * @example ../../docs/LoadingIndicator.md
 * @type { React.FC<import('../types').LoadingIndicatorProps>}
 */

var LoadingIndicator = function LoadingIndicator(_ref) {
  var _ref$size = _ref.size,
      size = _ref$size === void 0 ? 15 : _ref$size,
      _ref$color = _ref.color,
      color = _ref$color === void 0 ? '#006CFF' : _ref$color;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__loading-indicator ".concat(color),
    "data-testid": "loading-indicator-wrapper",
    style: {
      width: size,
      height: size
    }
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 30 30",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("defs", null, /*#__PURE__*/React__default.createElement("linearGradient", {
    x1: "50%",
    y1: "0%",
    x2: "50%",
    y2: "100%",
    id: "a"
  }, /*#__PURE__*/React__default.createElement("stop", {
    stopColor: "#FFF",
    stopOpacity: "0",
    offset: "0%"
  }), /*#__PURE__*/React__default.createElement("stop", {
    offset: "100%",
    "data-testid": "loading-indicator-circle",
    stopColor: color,
    stopOpacity: "1",
    style: {
      stopColor: color
    }
  }))), /*#__PURE__*/React__default.createElement("path", {
    d: "M2.518 23.321l1.664-1.11A12.988 12.988 0 0 0 15 28c7.18 0 13-5.82 13-13S22.18 2 15 2V0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-5.206 0-9.792-2.652-12.482-6.679z",
    fill: "url(#a)",
    fillRule: "evenodd"
  })));
};

var DefaultLoadingIndicator = /*#__PURE__*/React__default.memo(LoadingIndicator);

// @ts-check
/** @type {React.FC<import("types").EmoticonItemProps>} */

var EmoticonItem = function EmoticonItem(_ref) {
  var entity = _ref.entity;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__emoji-item"
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__emoji-item--entity"
  }, entity.native), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__emoji-item--name"
  }, entity.name));
};

EmoticonItem.propTypes = {
  entity: PropTypes.shape({
    /** Name for emoticon */
    name: PropTypes.string.isRequired,

    /** Native value or actual emoticon */
    native: PropTypes.string.isRequired
  }).isRequired
};
var EmoticonItem$1 = /*#__PURE__*/React__default.memo(EmoticonItem);

// @ts-check
/**
 * UserItem - Component rendered in commands menu
 * @typedef {import('../types').UserItemProps} Props
 * @type {React.FC<Props>}
 */

var UserItem = function UserItem(_ref) {
  var entity = _ref.entity;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__user-item"
  }, /*#__PURE__*/React__default.createElement(Avatar, {
    size: 20,
    image: entity.image
  }), /*#__PURE__*/React__default.createElement("div", null, /*#__PURE__*/React__default.createElement("strong", null, entity.name), " ", !entity.name ? entity.id : ''));
};

UserItem.propTypes = {
  entity: PropTypes.shape({
    /** Name of the user */
    name: PropTypes.string,

    /** Id of the user */
    id: PropTypes.string,

    /** Image of the user */
    image: PropTypes.string
  }).isRequired
};
var UserItem$1 = /*#__PURE__*/React__default.memo(UserItem);

// @ts-check
/**
 * @type {React.FC<import('../types').CommandItemProps>}
 */

var CommandItem = function CommandItem(_ref) {
  var entity = _ref.entity;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__slash-command"
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__slash-command-header"
  }, /*#__PURE__*/React__default.createElement("strong", null, entity.name), " ", entity.args), /*#__PURE__*/React__default.createElement("br", null), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__slash-command-description"
  }, entity.description));
};

CommandItem.propTypes = {
  entity: PropTypes.shape({
    /** Name of the command */
    name: PropTypes.string,

    /** Arguments of command */
    args: PropTypes.string,

    /** Description of command */
    description: PropTypes.string
  }).isRequired
};
var CommandItem$1 = /*#__PURE__*/React__default.memo(CommandItem);

/** @param {string} word */

var emojiReplace = function emojiReplace(word) {
  var found = emojiMart.emojiIndex.search(word) || [];
  var emoji = found.slice(0, 10).find(function (_ref) {
    var emoticons = _ref.emoticons;
    return emoticons === null || emoticons === void 0 ? void 0 : emoticons.includes(word);
  });
  if (!emoji || !('native' in emoji)) return null;
  return emoji.native;
};
/** @type {React.FC<import("types").ChatAutoCompleteProps>} */


var ChatAutoComplete = function ChatAutoComplete(props) {
  var _channel$state, _channel$state2;

  var _useContext = React.useContext(ChatContext),
      channel = _useContext.channel;

  var members = channel === null || channel === void 0 ? void 0 : (_channel$state = channel.state) === null || _channel$state === void 0 ? void 0 : _channel$state.members;
  var watchers = channel === null || channel === void 0 ? void 0 : (_channel$state2 = channel.state) === null || _channel$state2 === void 0 ? void 0 : _channel$state2.watchers;
  var getMembersAndWatchers = React.useCallback(function () {
    var memberUsers = members ? Object.values(members).map(function (_ref2) {
      var user = _ref2.user;
      return user;
    }) : [];
    var watcherUsers = watchers ? Object.values(watchers) : [];
    var users = [].concat(_toConsumableArray(memberUsers), _toConsumableArray(watcherUsers)); // make sure we don't list users twice

    /** @type {{ [key: string]: import('stream-chat').User}} */

    var uniqueUsers = {};
    users.forEach(function (user) {
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = user;
      }
    });
    return Object.values(uniqueUsers);
  }, [members, watchers]); // eslint-disable-next-line react-hooks/exhaustive-deps

  var queryMembersdebounced = React.useCallback(debounce(
  /*#__PURE__*/

  /**
   * @param {string} query
   * @param {(data: any[]) => void} onReady
   */
  function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(query, onReady) {
      var response, users;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (channel === null || channel === void 0 ? void 0 : channel.queryMembers) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return");

            case 2:
              _context.next = 4;
              return channel === null || channel === void 0 ? void 0 : channel.queryMembers({
                name: {
                  $autocomplete: query
                }
              });

            case 4:
              response = _context.sent;
              users = response.members.map(function (m) {
                return m.user;
              });
              if (onReady) onReady(users);

            case 7:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x, _x2) {
      return _ref3.apply(this, arguments);
    };
  }(), 200), [channel === null || channel === void 0 ? void 0 : channel.queryMembers]);
  var commands = props.commands,
      onSelectItem = props.onSelectItem,
      triggers = props.triggers;
  /**
   * dataProvider accepts `onReady` function, which will executed once the data is ready.
   * Another approach would have been to simply return the data from dataProvider and let the
   * component await for it and then execute the required logic. We are going for callback instead
   * of async-await since we have debounce function in dataProvider. Which will delay the execution
   * of api call on trailing end of debounce (lets call it a1) but will return with result of
   * previous call without waiting for a1. So in this case, we want to execute onReady, when trailing
   * end of debounce executes.
   * @type {() => import("../AutoCompleteTextarea/types").TriggerMap | object}
   */

  var getTriggers = React.useCallback( // eslint-disable-next-line sonarjs/cognitive-complexity
  function () {
    return triggers || {
      ':': {
        dataProvider: function dataProvider(q, text, onReady) {
          if (q.length === 0 || q.charAt(0).match(/[^a-zA-Z0-9+-]/)) {
            return [];
          }

          var emojis = emojiMart.emojiIndex.search(q) || [];
          var result = emojis.slice(0, 10);
          if (onReady) onReady(result, q);
          return result;
        },
        component: EmoticonItem$1,
        output: function output(entity) {
          return {
            key: entity.id,
            text: "".concat(entity.native),
            caretPosition: 'next'
          };
        }
      },
      '@': {
        dataProvider: function dataProvider(query, text, onReady) {
          // By default, we return maximum 100 members via queryChannels api call.
          // Thus it is safe to assume, that if number of members in channel.state is < 100,
          // then all the members are already available on client side and we don't need to
          // make any api call to queryMembers endpoint.
          if (!query || Object.values(members || {}).length < 100) {
            var users = getMembersAndWatchers();
            var matchingUsers = users.filter(function (user) {
              if (!query) return true;

              if (user.name !== undefined && user.name.toLowerCase().includes(query.toLowerCase())) {
                return true;
              }

              return user.id.toLowerCase().includes(query.toLowerCase());
            });
            var data = matchingUsers.slice(0, 10);
            if (onReady) onReady(data, query);
            return data;
          }

          return queryMembersdebounced(query,
          /** @param {any[]} data */
          function (data) {
            if (onReady) onReady(data, query);
          });
        },
        component: UserItem$1,
        output: function output(entity) {
          return {
            key: entity.id,
            text: "@".concat(entity.name || entity.id),
            caretPosition: 'next'
          };
        },
        callback: function callback(item) {
          return onSelectItem && onSelectItem(item);
        }
      },
      '/': {
        dataProvider: function dataProvider(q, text, onReady) {
          if (text.indexOf('/') !== 0 || !commands) {
            return [];
          }

          var selectedCommands = commands.filter(function (c) {
            return c.name.indexOf(q) !== -1;
          }); // sort alphabetically unless the you're matching the first char

          selectedCommands.sort(function (a, b) {
            var nameA = a.name.toLowerCase();
            var nameB = b.name.toLowerCase();

            if (nameA.indexOf(q) === 0) {
              nameA = "0".concat(nameA);
            }

            if (nameB.indexOf(q) === 0) {
              nameB = "0".concat(nameB);
            }

            if (nameA < nameB) {
              return -1;
            }

            if (nameA > nameB) {
              return 1;
            }

            return 0;
          });
          var result = selectedCommands.slice(0, 10);
          if (onReady) onReady(result, q);
          return result;
        },
        component: CommandItem$1,
        output: function output(entity) {
          return {
            key: entity.id,
            text: "/".concat(entity.name),
            caretPosition: 'next'
          };
        }
      }
    };
  }, [members, getMembersAndWatchers, commands, onSelectItem, queryMembersdebounced, triggers]);
  var innerRef = props.innerRef;
  var updateInnerRef = React.useCallback(function (ref) {
    if (innerRef) innerRef.current = ref;
  }, [innerRef]);
  return /*#__PURE__*/React__default.createElement(ReactTextareaAutocomplete, {
    loadingComponent: DefaultLoadingIndicator,
    trigger: getTriggers(),
    replaceWord: emojiReplace,
    minChar: 0,
    maxRows: props.maxRows,
    innerRef: updateInnerRef,
    onFocus: props.onFocus,
    rows: props.rows,
    className: "str-chat__textarea__textarea",
    containerClassName: "str-chat__textarea",
    dropdownClassName: "str-chat__emojisearch",
    listClassName: "str-chat__emojisearch__list",
    itemClassName: "str-chat__emojisearch__item",
    placeholder: props.placeholder,
    onChange: props.onChange,
    handleSubmit: props.handleSubmit,
    onPaste: props.onPaste,
    value: props.value,
    grow: props.grow,
    disabled: props.disabled,
    additionalTextareaProps: props.additionalTextareaProps
  });
};

ChatAutoComplete.propTypes = {
  /** The number of rows you want the textarea to have */
  rows: PropTypes.number,

  /** Grow the number of rows of the textarea while you're typing */
  grow: PropTypes.bool,

  /** Maximum number of rows */
  maxRows: PropTypes.number,

  /** Make the textarea disabled */
  disabled: PropTypes.bool,

  /** The value of the textarea */
  value: PropTypes.string,

  /** Function to run on pasting within the textarea */
  onPaste: PropTypes.func,

  /** Function that runs on submit */
  handleSubmit: PropTypes.func,

  /** Function that runs on change */
  onChange: PropTypes.func,

  /** Placeholder for the textare */
  placeholder: PropTypes.string,

  /** What loading component to use for the auto complete when loading results. */
  // @ts-ignore
  LoadingIndicator: PropTypes.elementType,

  /** Minimum number of Character */
  minChar: PropTypes.number,

  /**
   * Handler for selecting item from suggestions list
   *
   * @param item Selected item object.
   *  */
  onSelectItem: PropTypes.func,

  /** Array of [commands](https://getstream.io/chat/docs/#channel_commands) */
  commands: PropTypes.array,

  /** Listener for onfocus event on textarea */
  onFocus: PropTypes.func,

  /**
   * Any additional attrubutes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: PropTypes.object
};
ChatAutoComplete.defaultProps = {
  rows: 3
};
var ChatAutoComplete$1 = /*#__PURE__*/React__default.memo(ChatAutoComplete);

/**
 * @type {React.FC<import('../types').TooltipProps>}
 */

var Tooltip = function Tooltip(props) {
  return /*#__PURE__*/React__default.createElement("div", _extends({
    className: "str-chat__tooltip"
  }, props), props.children);
};

var Tooltip$1 = /*#__PURE__*/React__default.memo(Tooltip);

function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$4(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * @typedef {import("types").MessageInputState} State
 * @typedef {import("types").MessageInputProps} Props
 * @typedef {import("stream-chat").FileUploadAPIResponse} FileUploadAPIResponse
 * @typedef {import('stream-chat').UserResponse} UserResponse
 */

/**
 * Get attachment type from MIME type
 * @param {string} mime
 * @returns {string}
 */

var getAttachmentTypeFromMime = function getAttachmentTypeFromMime(mime) {
  if (mime.includes('video/')) return 'media';
  if (mime.includes('audio/')) return 'audio';
  return 'file';
};
/** @type {{ [id: string]: import('../types').FileUpload }} */


var emptyFileUploads = {};
/** @type {{ [id: string]: import('../types').ImageUpload }} */

var emptyImageUploads = {};
/**
 * Initializes the state. Empty if the message prop is falsy.
 * @param {import("stream-chat").MessageResponse | undefined} message
 * @returns {State}
 */

function initState(message) {
  var _message$attachments, _message$attachments2, _message$attachments3;

  if (!message) {
    return {
      text: '',
      imageOrder: [],
      imageUploads: Immutable(emptyImageUploads),
      fileOrder: [],
      fileUploads: Immutable(emptyFileUploads),
      numberOfUploads: 0,
      attachments: [],
      mentioned_users: [],
      emojiPickerIsOpen: false
    };
  } // if message prop is defined, get imageuploads, fileuploads, text, etc. from it


  var imageUploads = ((_message$attachments = message.attachments) === null || _message$attachments === void 0 ? void 0 : _message$attachments.filter(function (_ref) {
    var type = _ref.type;
    return type === 'image';
  }).reduce(function (acc, attachment) {
    var id = generateRandomId();
    return acc.setIn([id], {
      id,
      url: attachment.image_url,
      state: 'finished',
      file: {
        name: attachment.fallback
      }
    });
  }, Immutable(emptyImageUploads))) || Immutable(emptyImageUploads);
  var imageOrder = Object.keys(imageUploads);
  var fileUploads = ((_message$attachments2 = message.attachments) === null || _message$attachments2 === void 0 ? void 0 : _message$attachments2.filter(function (_ref2) {
    var type = _ref2.type;
    return type === 'file';
  }).reduce(function (acc, attachment) {
    var id = generateRandomId();
    return acc.setIn([id], {
      id,
      url: attachment.asset_url,
      state: 'finished',
      file: {
        name: attachment.title,
        type: attachment.mime_type,
        size: attachment.file_size
      }
    });
  }, Immutable(emptyFileUploads))) || Immutable(emptyFileUploads);
  var fileOrder = Object.keys(fileUploads);
  var numberOfUploads = fileOrder.length + imageOrder.length;
  var attachments = ((_message$attachments3 = message.attachments) === null || _message$attachments3 === void 0 ? void 0 : _message$attachments3.filter(function (_ref3) {
    var type = _ref3.type;
    return type !== 'file' && type !== 'image';
  })) || [];
  var mentioned_users = message.mentioned_users || [];
  return {
    text: message.text || '',
    imageOrder,
    imageUploads,
    fileOrder,
    fileUploads,
    numberOfUploads,
    attachments,
    mentioned_users,
    emojiPickerIsOpen: false
  };
}
/**
 * MessageInput state reducer
 * @param {State} state
 * @param {import("./types").MessageInputReducerAction} action
 * @returns {State}
 */


function messageInputReducer(state, action) {
  switch (action.type) {
    case 'setEmojiPickerIsOpen':
      return _objectSpread$4(_objectSpread$4({}, state), {}, {
        emojiPickerIsOpen: action.value
      });

    case 'setText':
      return _objectSpread$4(_objectSpread$4({}, state), {}, {
        text: action.getNewText(state.text)
      });

    case 'clear':
      return _objectSpread$4(_objectSpread$4({}, state), {}, {
        text: '',
        mentioned_users: [],
        imageOrder: [],
        imageUploads: Immutable(emptyImageUploads),
        fileOrder: [],
        fileUploads: Immutable(emptyFileUploads),
        numberOfUploads: 0
      });

    case 'setImageUpload':
      {
        var imageAlreadyExists = state.imageUploads[action.id];
        var imageOrder = imageAlreadyExists ? state.imageOrder : state.imageOrder.concat(action.id);

        var type = action.type,
            newUploadFields = _objectWithoutProperties(action, ["type"]);

        return _objectSpread$4(_objectSpread$4({}, state), {}, {
          imageOrder,
          imageUploads: state.imageUploads.setIn([action.id], _objectSpread$4(_objectSpread$4({}, state.imageUploads[action.id]), newUploadFields)),
          numberOfUploads: imageAlreadyExists ? state.numberOfUploads : state.numberOfUploads + 1
        });
      }

    case 'setFileUpload':
      {
        var fileAlreadyExists = state.fileUploads[action.id];
        var fileOrder = fileAlreadyExists ? state.fileOrder : state.fileOrder.concat(action.id);

        var _type = action.type,
            _newUploadFields = _objectWithoutProperties(action, ["type"]);

        return _objectSpread$4(_objectSpread$4({}, state), {}, {
          fileOrder,
          fileUploads: state.fileUploads.setIn([action.id], _objectSpread$4(_objectSpread$4({}, state.fileUploads[action.id]), _newUploadFields)),
          numberOfUploads: fileAlreadyExists ? state.numberOfUploads : state.numberOfUploads + 1
        });
      }

    case 'removeImageUpload':
      if (!state.imageUploads[action.id]) return state; // cannot remove anything

      return _objectSpread$4(_objectSpread$4({}, state), {}, {
        numberOfUploads: state.numberOfUploads - 1,
        imageOrder: state.imageOrder.filter(function (_id) {
          return _id !== action.id;
        }),
        imageUploads: state.imageUploads.without(action.id)
      });

    case 'removeFileUpload':
      if (!state.fileUploads[action.id]) return state; // cannot remove anything

      return _objectSpread$4(_objectSpread$4({}, state), {}, {
        numberOfUploads: state.numberOfUploads - 1,
        fileOrder: state.fileOrder.filter(function (_id) {
          return _id !== action.id;
        }),
        fileUploads: state.fileUploads.without(action.id)
      });

    case 'reduceNumberOfUploads':
      // TODO: figure out if we can just use uploadOrder instead
      return _objectSpread$4(_objectSpread$4({}, state), {}, {
        numberOfUploads: state.numberOfUploads - 1
      });

    case 'addMentionedUser':
      return _objectSpread$4(_objectSpread$4({}, state), {}, {
        mentioned_users: state.mentioned_users.concat(action.user)
      });

    default:
      return state;
  }
}
/**
 * hook for MessageInput state
 * @param {Props} props
 */


function useMessageInputState(props) {
  var doImageUploadRequest = props.doImageUploadRequest,
      doFileUploadRequest = props.doFileUploadRequest,
      focus = props.focus,
      message = props.message,
      clearEditingState = props.clearEditingState,
      overrideSubmitHandler = props.overrideSubmitHandler,
      parent = props.parent,
      noFiles = props.noFiles,
      errorHandler = props.errorHandler,
      publishTypingEvent = props.publishTypingEvent;

  var _useReducer = React.useReducer(messageInputReducer, message, initState),
      _useReducer2 = _slicedToArray(_useReducer, 2),
      state = _useReducer2[0],
      dispatch = _useReducer2[1];

  var textareaRef = React.useRef(
  /** @type {HTMLTextAreaElement | undefined} */
  undefined);
  var emojiPickerRef = React.useRef(
  /** @type {HTMLDivElement | null} */
  null);
  var channelContext = React.useContext(ChannelContext);
  var text = state.text,
      imageOrder = state.imageOrder,
      imageUploads = state.imageUploads,
      fileOrder = state.fileOrder,
      fileUploads = state.fileUploads,
      attachments = state.attachments,
      numberOfUploads = state.numberOfUploads,
      mentioned_users = state.mentioned_users;
  var channel = channelContext.channel,
      editMessage = channelContext.editMessage,
      sendMessage = channelContext.sendMessage; // Focus

  React.useEffect(function () {
    if (focus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [focus]); // Text + cursor position

  var newCursorPosition = React.useRef(
  /** @type {number | null} */
  null);
  var insertText = React.useCallback(function (textToInsert) {
    if (!textareaRef.current) {
      dispatch({
        type: 'setText',
        getNewText: function getNewText(t) {
          return t + textToInsert;
        }
      });
      return;
    }

    var textareaElement = textareaRef.current;
    var selectionStart = textareaElement.selectionStart,
        selectionEnd = textareaElement.selectionEnd;
    newCursorPosition.current = selectionStart + textToInsert.length;
    dispatch({
      type: 'setText',
      getNewText: function getNewText(prevText) {
        return prevText.slice(0, selectionStart) + textToInsert + prevText.slice(selectionEnd);
      }
    });
  }, [textareaRef, newCursorPosition]);
  React.useEffect(function () {
    var textareaElement = textareaRef.current;

    if (textareaElement && newCursorPosition.current !== null) {
      textareaElement.selectionStart = newCursorPosition.current;
      textareaElement.selectionEnd = newCursorPosition.current;
      newCursorPosition.current = null;
    }
  }, [text, newCursorPosition]);
  var handleChange = React.useCallback(function (event) {
    event.preventDefault();

    if (!event || !event.target) {
      return;
    }

    var newText = event.target.value;
    dispatch({
      type: 'setText',
      getNewText: function getNewText() {
        return newText;
      }
    });

    if (publishTypingEvent && newText && channel) {
      streamChat.logChatPromiseExecution(channel.keystroke(), 'start typing event');
    }
  }, [channel, publishTypingEvent]); // Emoji

  var closeEmojiPicker = React.useCallback(function (e) {
    if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
      dispatch({
        type: 'setEmojiPickerIsOpen',
        value: false
      });
      document.removeEventListener('click', closeEmojiPicker, false);
    }
  }, [emojiPickerRef]);
  var openEmojiPicker = React.useCallback(function () {
    dispatch({
      type: 'setEmojiPickerIsOpen',
      value: true
    });
    document.addEventListener('click', closeEmojiPicker, false);
  }, [closeEmojiPicker]);
  var onSelectEmoji = React.useCallback(function (emoji) {
    return insertText(emoji.native);
  }, [insertText]); // Commands / mentions

  var getCommands = React.useCallback(function () {
    return channel && channel.getConfig().commands;
  }, [channel]);
  var getUsers = React.useCallback(function () {
    if (!channel) return [];
    return [].concat(_toConsumableArray(Object.values(channel.state.members).map(function (_ref4) {
      var user = _ref4.user;
      return user;
    })), _toConsumableArray(Object.values(channel.state.watchers))).filter(function (_user, index, self) {
      return self.findIndex(function (user) {
        return (user === null || user === void 0 ? void 0 : user.id) === (_user === null || _user === void 0 ? void 0 : _user.id);
      }) === index;
    } // filter out non-unique ids
    );
  }, [channel]);
  var onSelectItem = React.useCallback(
  /** @param {UserResponse} item */
  function (item) {
    dispatch({
      type: 'addMentionedUser',
      user: item
    });
  }, []); // Submitting

  var getAttachmentsFromUploads = React.useCallback(function () {
    var imageAttachments = imageOrder.map(function (id) {
      return imageUploads[id];
    }).filter(function (upload) {
      return upload.state !== 'failed';
    }).filter(function (_ref5, index, self) {
      var id = _ref5.id,
          url = _ref5.url;
      return (// filter out duplicates based on url
        self.every(function (upload) {
          return upload.id === id || upload.url !== url;
        })
      );
    }).map(function (upload) {
      return {
        type: 'image',
        image_url: upload.url,
        fallback: upload.file.name
      };
    });
    var fileAttachments = fileOrder.map(function (id) {
      return fileUploads[id];
    }).filter(function (upload) {
      return upload.state !== 'failed';
    }).map(function (upload) {
      return {
        type: getAttachmentTypeFromMime(upload.file.type),
        asset_url: upload.url,
        title: upload.file.name,
        mime_type: upload.file.type,
        file_size: upload.file.size
      };
    });
    return [].concat(_toConsumableArray(attachments), _toConsumableArray(imageAttachments), _toConsumableArray(fileAttachments));
  }, [imageOrder, imageUploads, fileOrder, fileUploads, attachments]);
  /**
   * @param {React.FormEvent | React.MouseEvent} event
   */

  var handleSubmit = function handleSubmit(event) {
    event.preventDefault();
    var trimmedMessage = text.trim();
    var isEmptyMessage = trimmedMessage === '' || trimmedMessage === '>' || trimmedMessage === '``````' || trimmedMessage === '``' || trimmedMessage === '**' || trimmedMessage === '____' || trimmedMessage === '__' || trimmedMessage === '****';

    if (isEmptyMessage && numberOfUploads === 0) {
      return;
    } // the channel component handles the actual sending of the message


    var someAttachmentsUploading = Object.values(imageUploads).some(function (upload) {
      return upload.state === 'uploading';
    }) || Object.values(fileUploads).some(function (upload) {
      return upload.state === 'uploading';
    });

    if (someAttachmentsUploading) {
      // TODO: show error to user that they should wait until image is uploaded
      return;
    }

    var newAttachments = getAttachmentsFromUploads(); // Instead of checking if a user is still mentioned every time the text changes,
    // just filter out non-mentioned users before submit, which is cheaper
    // and allows users to easily undo any accidental deletion

    var actualMentionedUsers = Array.from(new Set(mentioned_users.filter(function (_ref6) {
      var name = _ref6.name,
          id = _ref6.id;
      return text.includes("@".concat(id)) || text.includes("@".concat(name));
    }).map(function (_ref7) {
      var id = _ref7.id;
      return id;
    })));
    var updatedMessage = {
      text,
      attachments: newAttachments,
      mentioned_users: actualMentionedUsers
    };

    if (!!message && editMessage) {
      // TODO: Remove this line and show an error when submit fails
      if (clearEditingState) clearEditingState();
      var updateMessagePromise = editMessage(_objectSpread$4(_objectSpread$4({}, updatedMessage), {}, {
        id: message.id
      })).then(clearEditingState);
      streamChat.logChatPromiseExecution(updateMessagePromise, 'update message');
    } else if (overrideSubmitHandler && typeof overrideSubmitHandler === 'function' && channel) {
      overrideSubmitHandler(_objectSpread$4(_objectSpread$4({}, updatedMessage), {}, {
        parent
      }), channel.cid);
      dispatch({
        type: 'clear'
      });
    } else if (sendMessage) {
      var sendMessagePromise = sendMessage(_objectSpread$4(_objectSpread$4({}, updatedMessage), {}, {
        parent
      }));
      streamChat.logChatPromiseExecution(sendMessagePromise, 'send message');
      dispatch({
        type: 'clear'
      });
    }

    if (channel && publishTypingEvent) streamChat.logChatPromiseExecution(channel.stopTyping(), 'stop typing');
  }; // Attachments
  // Files


  var uploadFile = React.useCallback(function (id) {
    dispatch({
      type: 'setFileUpload',
      id,
      state: 'uploading'
    });
  }, []);
  React.useEffect(function () {
    _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var upload, id, file, response, alreadyRemoved;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (channel) {
                _context.next = 2;
                break;
              }

              return _context.abrupt("return");

            case 2:
              upload = Object.values(fileUploads).find(function (fileUpload) {
                return fileUpload.state === 'uploading' && fileUpload.file;
              });

              if (upload) {
                _context.next = 5;
                break;
              }

              return _context.abrupt("return");

            case 5:
              id = upload.id, file = upload.file;
              /** @type FileUploadAPIResponse */

              _context.prev = 6;

              if (!doFileUploadRequest) {
                _context.next = 13;
                break;
              }

              _context.next = 10;
              return doFileUploadRequest(file, channel);

            case 10:
              response = _context.sent;
              _context.next = 16;
              break;

            case 13:
              _context.next = 15;
              return channel.sendFile(file);

            case 15:
              response = _context.sent;

            case 16:
              _context.next = 26;
              break;

            case 18:
              _context.prev = 18;
              _context.t0 = _context["catch"](6);
              console.warn(_context.t0);
              alreadyRemoved = false;
              dispatch({
                type: 'reduceNumberOfUploads'
              });

              if (!fileUploads[id]) {
                alreadyRemoved = true;
              } else {
                dispatch({
                  type: 'setFileUpload',
                  id,
                  state: 'failed'
                });
              }

              if (!alreadyRemoved && errorHandler) {
                // TODO: verify if the paramaters passed to the error handler actually make sense
                errorHandler(_context.t0, 'upload-file', file);
              }

              return _context.abrupt("return");

            case 26:
              dispatch({
                type: 'setFileUpload',
                id,
                state: 'finished',
                url: response.file
              });

            case 27:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[6, 18]]);
    }))();
  }, [fileUploads, channel, doFileUploadRequest, errorHandler]);
  var removeFile = React.useCallback(function (id) {
    // TODO: cancel upload if still uploading
    dispatch({
      type: 'removeFileUpload',
      id
    });
  }, []); // Images

  var uploadImage = React.useCallback( /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(id) {
      var img, file, response, alreadyRemoved;
      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              img = imageUploads[id];

              if (!(!img || !channel)) {
                _context2.next = 3;
                break;
              }

              return _context2.abrupt("return");

            case 3:
              file = img.file;

              if (img.state !== 'uploading') {
                dispatch({
                  type: 'setImageUpload',
                  id,
                  state: 'uploading'
                });
              }
              /** @type FileUploadAPIResponse */


              _context2.prev = 5;

              if (!doImageUploadRequest) {
                _context2.next = 12;
                break;
              }

              _context2.next = 9;
              return doImageUploadRequest(file, channel);

            case 9:
              response = _context2.sent;
              _context2.next = 15;
              break;

            case 12:
              _context2.next = 14;
              return channel.sendImage(file);

            case 14:
              response = _context2.sent;

            case 15:
              _context2.next = 25;
              break;

            case 17:
              _context2.prev = 17;
              _context2.t0 = _context2["catch"](5);
              console.warn(_context2.t0);
              alreadyRemoved = false;
              dispatch({
                type: 'reduceNumberOfUploads'
              });

              if (!imageUploads[id]) {
                alreadyRemoved = true;
              } else {
                dispatch({
                  type: 'setImageUpload',
                  id,
                  state: 'failed'
                });
              }

              if (!alreadyRemoved && errorHandler) {
                // TODO: verify if the paramaters passed to the error handler actually make sense
                errorHandler(_context2.t0, 'upload-image', {
                  id,
                  file
                });
              }

              return _context2.abrupt("return");

            case 25:
              if (imageUploads[id]) {
                _context2.next = 27;
                break;
              }

              return _context2.abrupt("return");

            case 27:
              // removed before done
              dispatch({
                type: 'setImageUpload',
                id,
                state: 'finished',
                url: response.file
              });

            case 28:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[5, 17]]);
    }));

    return function (_x) {
      return _ref9.apply(this, arguments);
    };
  }(), [imageUploads, channel, doImageUploadRequest, errorHandler]);
  React.useEffect(function () {
    if (FileReader) {
      var upload = Object.values(imageUploads).find(function (imageUpload) {
        return imageUpload.state === 'uploading' && !!imageUpload.file && !imageUpload.previewUri;
      });

      if (upload) {
        var id = upload.id,
            file = upload.file; // TODO: Possibly use URL.createObjectURL instead. However, then we need
        // to release the previews when not used anymore though.

        var reader = new FileReader();

        reader.onload = function (event) {
          var _event$target;

          if (typeof ((_event$target = event.target) === null || _event$target === void 0 ? void 0 : _event$target.result) !== 'string') return;
          dispatch({
            type: 'setImageUpload',
            id,
            previewUri: event.target.result
          });
        };

        reader.readAsDataURL(file);
        uploadImage(id);
        return function () {
          reader.onload = null;
        };
      }
    }

    return function () {};
  }, [imageUploads, uploadImage]);
  var removeImage = React.useCallback(function (id) {
    dispatch({
      type: 'removeImageUpload',
      id
    }); // TODO: cancel upload if still uploading
  }, []);
  var uploadNewFiles = React.useCallback(
  /**
   * @param {FileList} files
   */
  function (files) {
    Array.from(files).forEach(function (file) {
      var id = generateRandomId();

      if (file.type.startsWith('image/')) {
        dispatch({
          type: 'setImageUpload',
          id,
          file,
          state: 'uploading'
        });
      } else if (file instanceof File && !noFiles) {
        dispatch({
          type: 'setFileUpload',
          id,
          file,
          state: 'uploading'
        });
      }
    });
  }, [noFiles]);
  var onPaste = React.useCallback(function (e) {
    (function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(event) {
        var items, plainTextPromise, plainTextItem, fileLikes, s;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // TODO: Move this handler to package with ImageDropzone
                items = event.clipboardData.items;

                if (reactFileUtils.dataTransferItemsHaveFiles(items)) {
                  _context3.next = 3;
                  break;
                }

                return _context3.abrupt("return");

              case 3:
                event.preventDefault(); // Get a promise for the plain text in case no files are
                // found. This needs to be done here because chrome cleans
                // up the DataTransferItems after resolving of a promise.

                /** @type {DataTransferItem} */
                plainTextItem = _toConsumableArray(items).find(function (_ref11) {
                  var kind = _ref11.kind,
                      type = _ref11.type;
                  return kind === 'string' && type === 'text/plain';
                });

                if (plainTextItem) {
                  plainTextPromise = new Promise(function (resolve) {
                    plainTextItem.getAsString(function (s) {
                      resolve(s);
                    });
                  });
                }

                _context3.next = 8;
                return reactFileUtils.dataTransferItemsToFiles(items);

              case 8:
                fileLikes = _context3.sent;

                if (!fileLikes.length) {
                  _context3.next = 12;
                  break;
                }

                uploadNewFiles(fileLikes);
                return _context3.abrupt("return");

              case 12:
                if (!plainTextPromise) {
                  _context3.next = 17;
                  break;
                }

                _context3.next = 15;
                return plainTextPromise;

              case 15:
                s = _context3.sent;
                insertText(s);

              case 17:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      return function (_x2) {
        return _ref10.apply(this, arguments);
      };
    })()(e);
  }, [uploadNewFiles, insertText]);
  return _objectSpread$4(_objectSpread$4({}, state), {}, {
    // refs
    textareaRef,
    emojiPickerRef,
    // handlers
    uploadNewFiles,
    removeImage,
    uploadImage,
    removeFile,
    uploadFile,
    onSelectEmoji,
    getUsers,
    getCommands,
    handleSubmit,
    handleChange,
    onPaste,
    onSelectItem,
    openEmojiPicker
  });
}

// @ts-check
/** @type {React.FC<import("types").MessageInputEmojiPickerProps>} */

var EmojiPicker = function EmojiPicker(_ref) {
  var emojiPickerIsOpen = _ref.emojiPickerIsOpen,
      emojiPickerRef = _ref.emojiPickerRef,
      onSelectEmoji = _ref.onSelectEmoji,
      small = _ref.small;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  if (emojiPickerIsOpen) {
    var className = small ? 'str-chat__small-message-input-emojipicker' : 'str-chat__input--emojipicker';
    return /*#__PURE__*/React__default.createElement("div", {
      className: className,
      ref: emojiPickerRef
    }, /*#__PURE__*/React__default.createElement(emojiMart.Picker, {
      native: true,
      emoji: "point_up",
      title: t('Pick your emoji'),
      onSelect: onSelectEmoji,
      color: "#006CFF",
      showPreview: false,
      useButton: true,
      emojisToShowFilter: filterEmoji
    }));
  }

  return null;
};

// @ts-check
/** @type {React.FC<import("types").MessageInputUploadsProps>} */

var UploadsPreview = function UploadsPreview(_ref) {
  var imageOrder = _ref.imageOrder,
      imageUploads = _ref.imageUploads,
      removeImage = _ref.removeImage,
      uploadImage = _ref.uploadImage,
      uploadNewFiles = _ref.uploadNewFiles,
      numberOfUploads = _ref.numberOfUploads,
      fileOrder = _ref.fileOrder,
      fileUploads = _ref.fileUploads,
      removeFile = _ref.removeFile,
      uploadFile = _ref.uploadFile;
  var channelContext = React.useContext(ChannelContext);
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, imageOrder.length > 0 && /*#__PURE__*/React__default.createElement(reactFileUtils.ImagePreviewer, {
    imageUploads: imageOrder.map(function (id) {
      return imageUploads[id];
    }),
    handleRemove: removeImage,
    handleRetry: uploadImage,
    handleFiles: uploadNewFiles,
    multiple: channelContext.multipleUploads,
    disabled: channelContext.maxNumberOfFiles !== undefined && numberOfUploads >= channelContext.maxNumberOfFiles
  }), fileOrder.length > 0 && /*#__PURE__*/React__default.createElement(reactFileUtils.FilePreviewer, {
    uploads: fileOrder.map(function (id) {
      return fileUploads[id];
    }),
    handleRemove: removeFile,
    handleRetry: uploadFile,
    handleFiles: uploadNewFiles
  }));
};

// @ts-check
/** @type {React.FC<import("types").SendButtonProps>} */

var SendButton = function SendButton(_ref) {
  var sendMessage = _ref.sendMessage;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  return /*#__PURE__*/React__default.createElement("button", {
    className: "str-chat__send-button",
    onClick: sendMessage
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "18",
    height: "17",
    viewBox: "0 0 18 17",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("title", null, t('Send')), /*#__PURE__*/React__default.createElement("path", {
    d: "M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z",
    fillRule: "evenodd",
    fill: "#006cff"
  })));
};

var SendButtonComponent = /*#__PURE__*/React__default.memo(SendButton);

// @ts-check
/** @type {React.FC<import("types").MessageInputProps>} */

var MessageInputLarge = function MessageInputLarge(props) {
  var messageInput = useMessageInputState(props);

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var channelContext = React.useContext(ChannelContext);
  /**
   * @typedef {import("stream-chat").Event} ClientEvent
   * @param {{ [userid: string]: ClientEvent } | {}} typingUsers
   */

  var constructTypingString = function constructTypingString(typingUsers) {
    var otherTypingUsers = Object.values(typingUsers).filter(function (_ref) {
      var _channelContext$clien;

      var user = _ref.user;
      return ((_channelContext$clien = channelContext.client) === null || _channelContext$clien === void 0 ? void 0 : _channelContext$clien.user.id) !== (user === null || user === void 0 ? void 0 : user.id);
    }).map(function (_ref2) {
      var user = _ref2.user;
      return (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.id);
    });
    if (otherTypingUsers.length === 0) return '';

    if (otherTypingUsers.length === 1) {
      return t('{{ user }} is typing...', {
        user: otherTypingUsers[0]
      });
    }

    if (otherTypingUsers.length === 2) {
      // joins all with "and" but =no commas
      // example: "bob and sam"
      return t('{{ firstUser }} and {{ secondUser }} are typing...', {
        firstUser: otherTypingUsers[0],
        secondUser: otherTypingUsers[1]
      });
    } // joins all with commas, but last one gets ", and" (oxford comma!)
    // example: "bob, joe, and sam"


    return t('{{ commaSeparatedUsers }} and {{ lastUser }} are typing...', {
      commaSeparatedUsers: otherTypingUsers.slice(0, -1).join(', '),
      lastUser: otherTypingUsers[otherTypingUsers.length - 1]
    });
  };

  var SendButton = props.SendButton;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__input-large"
  }, /*#__PURE__*/React__default.createElement(reactFileUtils.ImageDropzone, {
    accept: channelContext.acceptedFiles,
    multiple: channelContext.multipleUploads,
    disabled: channelContext.maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= channelContext.maxNumberOfFiles,
    handleFiles: messageInput.uploadNewFiles
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__input"
  }, /*#__PURE__*/React__default.createElement(EmojiPicker, messageInput), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__input--textarea-wrapper"
  }, /*#__PURE__*/React__default.createElement(UploadsPreview, messageInput), /*#__PURE__*/React__default.createElement(ChatAutoComplete$1, {
    commands: messageInput.getCommands(),
    innerRef: messageInput.textareaRef,
    handleSubmit: messageInput.handleSubmit,
    onChange: messageInput.handleChange,
    onSelectItem: messageInput.onSelectItem,
    value: messageInput.text,
    rows: 1,
    maxRows: props.maxRows,
    placeholder: t('Type your message'),
    onPaste: messageInput.onPaste,
    triggers: props.autocompleteTriggers,
    grow: props.grow,
    disabled: props.disabled,
    additionalTextareaProps: props.additionalTextareaProps
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__emojiselect-wrapper"
  }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t('Open emoji picker')), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__input-emojiselect",
    onClick: messageInput.openEmojiPicker,
    ref: messageInput.emojiPickerRef
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "14",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("title", null, t('Open emoji picker')), /*#__PURE__*/React__default.createElement("path", {
    d: "M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z",
    fillRule: "evenodd"
  })))), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__fileupload-wrapper",
    "data-testid": "fileinput"
  }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t('Attach files')), /*#__PURE__*/React__default.createElement(reactFileUtils.FileUploadButton, {
    multiple: channelContext.multipleUploads,
    disabled: channelContext.maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= channelContext.maxNumberOfFiles,
    accepts: channelContext.acceptedFiles,
    handleFiles: messageInput.uploadNewFiles
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__input-fileupload"
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "14",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("title", null, t('Attach files')), /*#__PURE__*/React__default.createElement("path", {
    d: "M7 .5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5S.5 10.59.5 7 3.41.5 7 .5zm0 12c3.031 0 5.5-2.469 5.5-5.5S10.031 1.5 7 1.5A5.506 5.506 0 0 0 1.5 7c0 3.034 2.469 5.5 5.5 5.5zM7.506 3v3.494H11v1.05H7.506V11h-1.05V7.544H3v-1.05h3.456V3h1.05z",
    fillRule: "nonzero"
  })))))), SendButton && /*#__PURE__*/React__default.createElement(SendButton, {
    sendMessage: messageInput.handleSubmit
  })), /*#__PURE__*/React__default.createElement("div", null, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__input-footer"
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__input-footer--count ".concat(!channelContext.watcher_count ? 'str-chat__input-footer--count--hidden' : '')
  }, t('{{ watcherCount }} online', {
    watcherCount: channelContext.watcher_count
  })), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__input-footer--typing"
  }, constructTypingString(channelContext.typing || {}))))));
};

MessageInputLarge.propTypes = {
  /** Set focus to the text input if this is enabled */
  focus: PropTypes.bool.isRequired,

  /** Grow the textarea while you're typing */
  grow: PropTypes.bool.isRequired,

  /** Specify the max amount of rows the textarea is able to grow */
  maxRows: PropTypes.number.isRequired,

  /** Make the textarea disabled */
  disabled: PropTypes.bool,

  /** enable/disable firing the typing event */
  publishTypingEvent: PropTypes.bool,

  /**
   * Any additional attrubutes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: PropTypes.object,

  /**
   * Override the default triggers of the ChatAutoComplete component
   */
  autocompleteTriggers: PropTypes.object,

  /**
   * @param message: the Message object to be sent
   * @param cid: the channel id
   */
  overrideSubmitHandler: PropTypes.func,

  /** Override image upload request */
  doImageUploadRequest: PropTypes.func,

  /** Override file upload request */
  doFileUploadRequest: PropTypes.func,

  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
   * */
  // @ts-ignore
  SendButton: PropTypes.elementType
};
MessageInputLarge.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  Input: MessageInputLarge,
  SendButton: SendButtonComponent,
  additionalTextareaProps: {}
};

var MessageInput = function MessageInput(props) {
  var Input = props.Input;
  return /*#__PURE__*/React__default.createElement(Input, props);
};

MessageInput.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  Input: MessageInputLarge,
  SendButton: SendButtonComponent,
  additionalTextareaProps: {}
};
var MessageInput$1 = /*#__PURE__*/React__default.memo(MessageInput);

// @ts-check
/** @type {React.FC<import("types").MessageInputProps>} */

var MessageInputFlat = function MessageInputFlat(props) {
  var messageInput = useMessageInputState(props);
  var channelContext = React.useContext(ChannelContext);

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var SendButton = props.SendButton;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__input-flat ".concat(SendButton ? 'str-chat__input-flat--send-button-active' : null)
  }, /*#__PURE__*/React__default.createElement(reactFileUtils.ImageDropzone, {
    accept: channelContext.acceptedFiles,
    multiple: channelContext.multipleUploads,
    disabled: channelContext.maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= channelContext.maxNumberOfFiles,
    handleFiles: messageInput.uploadNewFiles
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__input-flat-wrapper"
  }, /*#__PURE__*/React__default.createElement(EmojiPicker, messageInput), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__input-flat--textarea-wrapper"
  }, /*#__PURE__*/React__default.createElement(UploadsPreview, messageInput), /*#__PURE__*/React__default.createElement(ChatAutoComplete$1, {
    commands: messageInput.getCommands(),
    innerRef: messageInput.textareaRef,
    handleSubmit: messageInput.handleSubmit,
    onSelectItem: messageInput.onSelectItem,
    onChange: messageInput.handleChange,
    value: messageInput.text,
    rows: 1,
    maxRows: props.maxRows,
    placeholder: t('Type your message'),
    onPaste: messageInput.onPaste,
    triggers: props.autocompleteTriggers,
    grow: props.grow,
    disabled: props.disabled,
    additionalTextareaProps: props.additionalTextareaProps
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__emojiselect-wrapper"
  }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t('Open emoji picker')), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__input-flat-emojiselect",
    onClick: messageInput.openEmojiPicker
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "28",
    height: "28",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("title", null, t('Open emoji picker')), /*#__PURE__*/React__default.createElement("path", {
    d: "M22.217 16.1c.483.25.674.849.423 1.334C21.163 20.294 17.771 22 14 22c-3.867 0-7.347-1.765-8.66-4.605a.994.994 0 0 1 .9-1.407c.385 0 .739.225.9.575C8.135 18.715 10.892 20 14 20c3.038 0 5.738-1.267 6.879-3.476a.99.99 0 0 1 1.338-.424zm1.583-3.652c.341.443.235 1.064-.237 1.384a1.082 1.082 0 0 1-.62.168c-.338 0-.659-.132-.858-.389-.212-.276-.476-.611-1.076-.611-.598 0-.864.337-1.08.614-.197.254-.517.386-.854.386-.224 0-.438-.045-.62-.167-.517-.349-.578-.947-.235-1.388.66-.847 1.483-1.445 2.789-1.445 1.305 0 2.136.6 2.79 1.448zm-14 0c.341.443.235 1.064-.237 1.384a1.082 1.082 0 0 1-.62.168c-.339 0-.659-.132-.858-.389C7.873 13.335 7.61 13 7.01 13c-.598 0-.864.337-1.08.614-.197.254-.517.386-.854.386-.224 0-.438-.045-.62-.167-.518-.349-.579-.947-.235-1.388C4.88 11.598 5.703 11 7.01 11c1.305 0 2.136.6 2.79 1.448zM14 0c7.732 0 14 6.268 14 14s-6.268 14-14 14S0 21.732 0 14 6.268 0 14 0zm8.485 22.485A11.922 11.922 0 0 0 26 14c0-3.205-1.248-6.219-3.515-8.485A11.922 11.922 0 0 0 14 2a11.922 11.922 0 0 0-8.485 3.515A11.922 11.922 0 0 0 2 14c0 3.205 1.248 6.219 3.515 8.485A11.922 11.922 0 0 0 14 26c3.205 0 6.219-1.248 8.485-3.515z",
    fillRule: "evenodd"
  })))), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__fileupload-wrapper",
    "data-testid": "fileinput"
  }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t('Attach files')), /*#__PURE__*/React__default.createElement(reactFileUtils.FileUploadButton, {
    multiple: channelContext.multipleUploads,
    disabled: channelContext.maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= channelContext.maxNumberOfFiles,
    accepts: channelContext.acceptedFiles,
    handleFiles: messageInput.uploadNewFiles
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__input-flat-fileupload"
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "14",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("title", null, t('Attach files')), /*#__PURE__*/React__default.createElement("path", {
    d: "M1.667.333h10.666c.737 0 1.334.597 1.334 1.334v10.666c0 .737-.597 1.334-1.334 1.334H1.667a1.333 1.333 0 0 1-1.334-1.334V1.667C.333.93.93.333 1.667.333zm2 1.334a1.667 1.667 0 1 0 0 3.333 1.667 1.667 0 0 0 0-3.333zm-2 9.333v1.333h10.666v-4l-2-2-4 4-2-2L1.667 11z",
    fillRule: "nonzero"
  })))))), SendButton && /*#__PURE__*/React__default.createElement(SendButton, {
    sendMessage: messageInput.handleSubmit
  }))));
};

MessageInputFlat.propTypes = {
  /** Set focus to the text input if this is enabled */
  focus: PropTypes.bool.isRequired,

  /** Grow the textarea while you're typing */
  grow: PropTypes.bool.isRequired,

  /** Specify the max amount of rows the textarea is able to grow */
  maxRows: PropTypes.number.isRequired,

  /** Make the textarea disabled */
  disabled: PropTypes.bool,

  /** enable/disable firing the typing event */
  publishTypingEvent: PropTypes.bool,

  /**
   * Any additional attrubutes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: PropTypes.object,

  /**
   * Override the default triggers of the ChatAutoComplete component
   */
  autocompleteTriggers: PropTypes.object,

  /**
   * @param message: the Message object to be sent
   * @param cid: the channel id
   */
  overrideSubmitHandler: PropTypes.func,

  /** Override image upload request */
  doImageUploadRequest: PropTypes.func,

  /** Override file upload request */
  doFileUploadRequest: PropTypes.func,

  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
   * */
  // @ts-ignore
  SendButton: PropTypes.elementType
};
MessageInputFlat.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  SendButton: SendButtonComponent,
  additionalTextareaProps: {}
};

/** @type {React.FC<import("types").MessageInputProps>} */

var MessageInputSmall = function MessageInputSmall(props) {
  var messageInput = useMessageInputState(props);
  var channelContext = React.useContext(ChannelContext);

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var SendButton = props.SendButton;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__small-message-input__wrapper"
  }, /*#__PURE__*/React__default.createElement(reactFileUtils.ImageDropzone, {
    accept: channelContext.acceptedFiles,
    multiple: channelContext.multipleUploads,
    disabled: channelContext.maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= channelContext.maxNumberOfFiles,
    handleFiles: messageInput.uploadNewFiles
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__small-message-input ".concat(SendButton ? 'str-chat__small-message-input--send-button-active' : null)
  }, /*#__PURE__*/React__default.createElement(EmojiPicker, _extends({}, messageInput, {
    small: true
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__small-message-input--textarea-wrapper"
  }, /*#__PURE__*/React__default.createElement(UploadsPreview, messageInput), /*#__PURE__*/React__default.createElement(ChatAutoComplete$1, {
    commands: messageInput.getCommands(),
    innerRef: messageInput.textareaRef,
    handleSubmit: messageInput.handleSubmit,
    onChange: messageInput.handleChange,
    value: messageInput.text,
    rows: 1,
    maxRows: props.maxRows,
    onSelectItem: messageInput.onSelectItem,
    placeholder: t('Type your message'),
    onPaste: messageInput.onPaste,
    triggers: props.autocompleteTriggers,
    grow: props.grow,
    disabled: props.disabled,
    additionalTextareaProps: props.additionalTextareaProps
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__emojiselect-wrapper"
  }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t('Open emoji picker')), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__small-message-input-emojiselect",
    onClick: messageInput.openEmojiPicker
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "14",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("title", null, t('Open emoji picker')), /*#__PURE__*/React__default.createElement("path", {
    d: "M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z",
    fillRule: "evenodd"
  })))), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__fileupload-wrapper",
    "data-testid": "fileinput"
  }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t('Attach files')), /*#__PURE__*/React__default.createElement(reactFileUtils.FileUploadButton, {
    multiple: channelContext.multipleUploads,
    disabled: channelContext.maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= channelContext.maxNumberOfFiles,
    accepts: channelContext.acceptedFiles,
    handleFiles: messageInput.uploadNewFiles
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__small-message-input-fileupload"
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "14",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("title", null, t('Attach files')), /*#__PURE__*/React__default.createElement("path", {
    d: "M7 .5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5S.5 10.59.5 7 3.41.5 7 .5zm0 12c3.031 0 5.5-2.469 5.5-5.5S10.031 1.5 7 1.5A5.506 5.506 0 0 0 1.5 7c0 3.034 2.469 5.5 5.5 5.5zM7.506 3v3.494H11v1.05H7.506V11h-1.05V7.544H3v-1.05h3.456V3h1.05z",
    fillRule: "nonzero"
  })))))), SendButton && /*#__PURE__*/React__default.createElement(SendButton, {
    sendMessage: messageInput.handleSubmit
  }))));
};

MessageInputSmall.propTypes = {
  /** Set focus to the text input if this is enabled */
  focus: PropTypes.bool.isRequired,

  /** Grow the textarea while you're typing */
  grow: PropTypes.bool.isRequired,

  /** Specify the max amount of rows the textarea is able to grow */
  maxRows: PropTypes.number.isRequired,

  /** Make the textarea disabled */
  disabled: PropTypes.bool,

  /** enable/disable firing the typing event */
  publishTypingEvent: PropTypes.bool,

  /**
   * Any additional attrubutes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: PropTypes.object,

  /**
   * Override the default triggers of the ChatAutoComplete component
   */
  autocompleteTriggers: PropTypes.object,

  /**
   * @param message: the Message object to be sent
   * @param cid: the channel id
   */
  overrideSubmitHandler: PropTypes.func,

  /** Override image upload request */
  doImageUploadRequest: PropTypes.func,

  /** Override file upload request */
  doFileUploadRequest: PropTypes.func,

  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
   * */
  // @ts-ignore
  SendButton: PropTypes.elementType
};
MessageInputSmall.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  SendButton: SendButtonComponent,
  additionalTextareaProps: {}
};

/** @type {React.FC<import("types").MessageInputProps>} */

var EditMessageForm = function EditMessageForm(props) {
  var messageInput = useMessageInputState(props);
  var channelContext = React.useContext(ChannelContext);

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var clearEditingState = props.clearEditingState;
  React.useEffect(function () {
    /** @type {(event: KeyboardEvent) => void} Typescript syntax */
    var onKeyDown = function onKeyDown(event) {
      console.log('event.keyCode :>> ', event.keyCode);
      if (event.keyCode === KEY_CODES.ESC && clearEditingState) clearEditingState();
    };

    document.addEventListener('keydown', onKeyDown);
    return function () {
      return document.removeEventListener('keydown', onKeyDown);
    };
  }, [clearEditingState]);
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__edit-message-form"
  }, /*#__PURE__*/React__default.createElement(reactFileUtils.ImageDropzone, {
    accept: channelContext.acceptedFiles,
    multiple: channelContext.multipleUploads,
    disabled: channelContext.maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= channelContext.maxNumberOfFiles,
    handleFiles: messageInput.uploadNewFiles
  }, /*#__PURE__*/React__default.createElement("form", {
    onSubmit: messageInput.handleSubmit
  }, /*#__PURE__*/React__default.createElement(UploadsPreview, messageInput), /*#__PURE__*/React__default.createElement(EmojiPicker, _extends({}, messageInput, {
    small: true
  })), /*#__PURE__*/React__default.createElement(ChatAutoComplete$1, {
    commands: messageInput.getCommands(),
    innerRef: messageInput.textareaRef,
    handleSubmit: messageInput.handleSubmit,
    onChange: messageInput.handleChange,
    onSelectItem: messageInput.onSelectItem,
    placeholder: t('Type your message'),
    value: messageInput.text,
    rows: 1,
    maxRows: props.maxRows,
    onPaste: messageInput.onPaste,
    grow: props.grow,
    additionalTextareaProps: props.additionalTextareaProps
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-team-form-footer"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__edit-message-form-options"
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__input-emojiselect",
    onClick: messageInput.openEmojiPicker
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "14",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("title", null, t('Open emoji picker')), /*#__PURE__*/React__default.createElement("path", {
    d: "M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z",
    fillRule: "evenodd"
  }))), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__fileupload-wrapper",
    "data-testid": "fileinput"
  }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t('Attach files')), /*#__PURE__*/React__default.createElement(reactFileUtils.FileUploadButton, {
    multiple: channelContext.multipleUploads,
    disabled: channelContext.maxNumberOfFiles !== undefined && messageInput.numberOfUploads >= channelContext.maxNumberOfFiles,
    accepts: channelContext.acceptedFiles,
    handleFiles: messageInput.uploadNewFiles
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__input-fileupload"
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "14",
    height: "14",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("title", null, t('Attach files')), /*#__PURE__*/React__default.createElement("path", {
    d: "M7 .5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5S.5 10.59.5 7 3.41.5 7 .5zm0 12c3.031 0 5.5-2.469 5.5-5.5S10.031 1.5 7 1.5A5.506 5.506 0 0 0 1.5 7c0 3.034 2.469 5.5 5.5 5.5zM7.506 3v3.494H11v1.05H7.506V11h-1.05V7.544H3v-1.05h3.456V3h1.05z",
    fillRule: "nonzero"
  })))))), /*#__PURE__*/React__default.createElement("div", null, /*#__PURE__*/React__default.createElement("button", {
    onClick: props.clearEditingState
  }, t('Cancel')), /*#__PURE__*/React__default.createElement("button", {
    type: "submit"
  }, t('Send')))))));
};

EditMessageForm.propTypes = {
  /** Set focus to the text input if this is enabled */
  focus: PropTypes.bool.isRequired,

  /** Grow the textarea while you're typing */
  grow: PropTypes.bool.isRequired,

  /** Specify the max amount of rows the textarea is able to grow */
  maxRows: PropTypes.number.isRequired,

  /** Make the textarea disabled */
  disabled: PropTypes.bool,

  /** enable/disable firing the typing event */
  publishTypingEvent: PropTypes.bool,

  /**
   * Any additional attrubutes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: PropTypes.object,

  /**
   * @param message: the Message object to be sent
   * @param cid: the channel id
   */
  overrideSubmitHandler: PropTypes.func,

  /** Override image upload request */
  doImageUploadRequest: PropTypes.func,

  /** Override file upload request */
  doFileUploadRequest: PropTypes.func,

  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
   * */
  // @ts-ignore
  SendButton: PropTypes.elementType,

  /**
   * Clears edit state for current message (passed down from message component)
   */
  clearEditingState: PropTypes.func
};
EditMessageForm.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  SendButton: SendButtonComponent,
  additionalTextareaProps: {}
};

/** @type {React.ForwardRefRenderFunction<HTMLDivElement | null, import("types").ReactionSelectorProps>} */

var ReactionSelectorWithRef = function ReactionSelectorWithRef(_ref, ref) {
  var _getUsersPerReactionT;

  var latest_reactions = _ref.latest_reactions,
      reaction_counts = _ref.reaction_counts,
      _ref$reactionOptions = _ref.reactionOptions,
      reactionOptions = _ref$reactionOptions === void 0 ? defaultMinimalEmojis : _ref$reactionOptions,
      _ref$reverse = _ref.reverse,
      reverse = _ref$reverse === void 0 ? false : _ref$reverse,
      handleReaction = _ref.handleReaction,
      _ref$detailedView = _ref.detailedView,
      detailedView = _ref$detailedView === void 0 ? true : _ref$detailedView;

  var _useState = React.useState(null),
      _useState2 = _slicedToArray(_useState, 2),
      tooltipReactionType = _useState2[0],
      setTooltipReactionType = _useState2[1];

  var _useState3 = React.useState(
  /** @type {{ tooltip: number, arrow: number } | null} */
  null),
      _useState4 = _slicedToArray(_useState3, 2),
      tooltipPositions = _useState4[0],
      setTooltipPositions = _useState4[1];

  var containerRef = React.useRef(
  /** @type {HTMLDivElement | null} */
  null);
  var tooltipRef = React.useRef(
  /** @type {HTMLDivElement | null} */
  null);
  var targetRef = React.useRef(
  /** @type {HTMLDivElement | null} */
  null); // @ts-ignore because it's okay for our ref to be null in the parent component.

  React.useImperativeHandle(ref, function () {
    return containerRef.current;
  });
  var showTooltip = React.useCallback(function (e, reactionType) {
    targetRef.current = e.target;
    setTooltipReactionType(reactionType);
  }, []);
  var hideTooltip = React.useCallback(function () {
    setTooltipReactionType(null);
    setTooltipPositions(null);
  }, []);
  React.useEffect(function () {
    if (tooltipReactionType) {
      var _tooltipRef$current, _targetRef$current, _containerRef$current;

      var tooltip = (_tooltipRef$current = tooltipRef.current) === null || _tooltipRef$current === void 0 ? void 0 : _tooltipRef$current.getBoundingClientRect();
      var target = (_targetRef$current = targetRef.current) === null || _targetRef$current === void 0 ? void 0 : _targetRef$current.getBoundingClientRect();
      var container = (_containerRef$current = containerRef.current) === null || _containerRef$current === void 0 ? void 0 : _containerRef$current.getBoundingClientRect();
      if (!tooltip || !target || !container) return;
      var tooltipPosition = tooltip.width === container.width || tooltip.x < container.x ? 0 : target.left + target.width / 2 - container.left - tooltip.width / 2;
      var arrowPosition = target.x - tooltip.x + target.width / 2 - tooltipPosition;
      setTooltipPositions({
        tooltip: tooltipPosition,
        arrow: arrowPosition
      });
    }
  }, [tooltipReactionType, containerRef]);
  /**
   * @param {string | null} type
   * @returns {string[] | undefined}
   * */

  var getUsersPerReactionType = function getUsersPerReactionType(type) {
    return latest_reactions === null || latest_reactions === void 0 ? void 0 : latest_reactions.map(function (reaction) {
      if (reaction.type === type) {
        var _reaction$user, _reaction$user2;

        return ((_reaction$user = reaction.user) === null || _reaction$user === void 0 ? void 0 : _reaction$user.name) || ((_reaction$user2 = reaction.user) === null || _reaction$user2 === void 0 ? void 0 : _reaction$user2.id);
      }

      return null;
    }).filter(Boolean);
  };
  /**
   * @param {string | null} type
   * @returns {import("stream-chat").User | undefined}
   * */


  var getLatestUserForReactionType = function getLatestUserForReactionType(type) {
    var _latest_reactions$fin;

    return latest_reactions === null || latest_reactions === void 0 ? void 0 : (_latest_reactions$fin = latest_reactions.find(function (reaction) {
      return reaction.type === type && !!reaction.user;
    })) === null || _latest_reactions$fin === void 0 ? void 0 : _latest_reactions$fin.user;
  };

  return /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "reaction-selector",
    className: "str-chat__reaction-selector ".concat(reverse ? 'str-chat__reaction-selector--reverse' : ''),
    ref: containerRef
  }, !!tooltipReactionType && detailedView && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__reaction-selector-tooltip",
    ref: tooltipRef,
    style: {
      left: tooltipPositions === null || tooltipPositions === void 0 ? void 0 : tooltipPositions.tooltip,
      visibility: tooltipPositions ? 'visible' : 'hidden'
    }
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "arrow",
    style: {
      left: tooltipPositions === null || tooltipPositions === void 0 ? void 0 : tooltipPositions.arrow
    }
  }), (_getUsersPerReactionT = getUsersPerReactionType(tooltipReactionType)) === null || _getUsersPerReactionT === void 0 ? void 0 : _getUsersPerReactionT.map(function (user, i, users) {
    return /*#__PURE__*/React__default.createElement("span", {
      className: "latest-user-username",
      key: "key-".concat(i, "-").concat(user)
    }, "".concat(user).concat(i < users.length - 1 ? ', ' : ''));
  })), /*#__PURE__*/React__default.createElement("ul", {
    className: "str-chat__message-reactions-list"
  }, reactionOptions.map(function (reactionOption) {
    var latestUser = getLatestUserForReactionType(reactionOption.id);
    var count = reaction_counts && reaction_counts[reactionOption.id];
    return /*#__PURE__*/React__default.createElement("li", {
      key: "item-".concat(reactionOption.id),
      className: "str-chat__message-reactions-list-item",
      "data-text": reactionOption.id,
      onClick: function onClick() {
        return handleReaction && handleReaction(reactionOption.id);
      }
    }, !!count && detailedView && /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", {
      className: "latest-user",
      onMouseEnter: function onMouseEnter(e) {
        return showTooltip(e, reactionOption.id);
      },
      onMouseLeave: hideTooltip
    }, latestUser ? /*#__PURE__*/React__default.createElement(Avatar, {
      image: latestUser.image,
      size: 20,
      name: latestUser.name || null
    }) : /*#__PURE__*/React__default.createElement("div", {
      className: "latest-user-not-found"
    }))), /*#__PURE__*/React__default.createElement(emojiMart.NimbleEmoji // @ts-ignore because emoji-mart types don't support specifying
    // spriteUrl instead of imageUrl, while the implementation does
    , _extends({
      emoji: reactionOption
    }, emojiSetDef, {
      data: emojiData
    })), Boolean(count) && detailedView && /*#__PURE__*/React__default.createElement("span", {
      className: "str-chat__message-reactions-list-item__count"
    }, count || ''));
  })));
};

var ReactionSelector = /*#__PURE__*/React__default.forwardRef(ReactionSelectorWithRef);
ReactionSelector.propTypes = {
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
  reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),

  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions: PropTypes.array,
  reverse: PropTypes.bool,

  /**
   * Handler to set/unset reaction on message.
   *
   * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * */
  handleReaction: PropTypes.func.isRequired,

  /** Enable the avatar display */
  detailedView: PropTypes.bool
};
var DefaultReactionSelector = /*#__PURE__*/React__default.memo(ReactionSelector);

/** @type {React.FC<import("types").ReactionsListProps>} */

var ReactionsList = function ReactionsList(_ref) {
  var reactions = _ref.reactions,
      reaction_counts = _ref.reaction_counts,
      _ref$reactionOptions = _ref.reactionOptions,
      reactionOptions = _ref$reactionOptions === void 0 ? defaultMinimalEmojis : _ref$reactionOptions,
      _ref$reverse = _ref.reverse,
      reverse = _ref$reverse === void 0 ? false : _ref$reverse,
      onClick = _ref.onClick;

  var getTotalReactionCount = function getTotalReactionCount() {
    return Object.values(reaction_counts || {}).reduce(function (total, count) {
      return total + count;
    }, 0);
  };
  /** @param {string} type */


  var getOptionForType = function getOptionForType(type) {
    return reactionOptions.find(function (option) {
      return option.id === type;
    });
  };

  var getReactionTypes = function getReactionTypes() {
    if (!reactions) return [];
    var allTypes = new Set();
    reactions.forEach(function (_ref2) {
      var type = _ref2.type;
      allTypes.add(type);
    });
    return Array.from(allTypes);
  };

  return /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "reaction-list",
    className: "str-chat__reaction-list ".concat(reverse ? 'str-chat__reaction-list--reverse' : ''),
    onClick: onClick
  }, /*#__PURE__*/React__default.createElement("ul", null, getReactionTypes().map(function (reactionType) {
    var emojiDefinition = getOptionForType(reactionType);
    return emojiDefinition ? /*#__PURE__*/React__default.createElement("li", {
      key: emojiDefinition.id
    }, /*#__PURE__*/React__default.createElement(emojiMart.NimbleEmoji // emoji-mart type defs don't support spriteSheet use case
    // (but implementation does)
    // @ts-ignore
    , _extends({
      emoji: emojiDefinition
    }, emojiSetDef, {
      size: 16,
      data: emojiData
    })), ' ', "\xA0") : null;
  }), /*#__PURE__*/React__default.createElement("li", null, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__reaction-list--counter"
  }, getTotalReactionCount()))));
};

ReactionsList.propTypes = {
  reactions: PropTypes.array,

  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),

  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions: PropTypes.array,
  reverse: PropTypes.bool,
  onClick: PropTypes.func
};
var DefaultReactionsList = /*#__PURE__*/React__default.memo(ReactionsList);

/** @type {React.FC<import("types").SimpleReactionsListProps>} */

var SimpleReactionsList = function SimpleReactionsList(_ref) {
  var reactions = _ref.reactions,
      reaction_counts = _ref.reaction_counts,
      _ref$reactionOptions = _ref.reactionOptions,
      reactionOptions = _ref$reactionOptions === void 0 ? defaultMinimalEmojis : _ref$reactionOptions,
      handleReaction = _ref.handleReaction;

  var _useState = React.useState(null),
      _useState2 = _slicedToArray(_useState, 2),
      tooltipReactionType = _useState2[0],
      setTooltipReactionType = _useState2[1];

  if (!reactions || reactions.length === 0) {
    return null;
  }
  /** @param {string | null} type */


  var getUsersPerReactionType = function getUsersPerReactionType(type) {
    return reactions === null || reactions === void 0 ? void 0 : reactions.map(function (reaction) {
      if (reaction.type === type) {
        var _reaction$user, _reaction$user2;

        return ((_reaction$user = reaction.user) === null || _reaction$user === void 0 ? void 0 : _reaction$user.name) || ((_reaction$user2 = reaction.user) === null || _reaction$user2 === void 0 ? void 0 : _reaction$user2.id);
      }

      return null;
    }).filter(Boolean);
  };

  var getTotalReactionCount = function getTotalReactionCount() {
    return Object.values(reaction_counts || {}).reduce(function (total, count) {
      return total + count;
    }, 0);
  };

  var getReactionTypes = function getReactionTypes() {
    if (!reactions) return [];
    var allTypes = new Set();
    reactions.forEach(function (_ref2) {
      var type = _ref2.type;
      allTypes.add(type);
    });
    return Array.from(allTypes);
  };
  /** @param {string} type */


  var getOptionForType = function getOptionForType(type) {
    return reactionOptions.find(function (option) {
      return option.id === type;
    });
  };

  return /*#__PURE__*/React__default.createElement("ul", {
    "data-testid": "simple-reaction-list",
    className: "str-chat__simple-reactions-list",
    onMouseLeave: function onMouseLeave() {
      return setTooltipReactionType(null);
    }
  }, getReactionTypes().map(function (reactionType, i) {
    var _getOptionForType, _getUsersPerReactionT;

    var emojiDefinition = getOptionForType(reactionType);
    return emojiDefinition ? /*#__PURE__*/React__default.createElement("li", {
      className: "str-chat__simple-reactions-list-item",
      key: "".concat(emojiDefinition === null || emojiDefinition === void 0 ? void 0 : emojiDefinition.id, "-").concat(i),
      onClick: function onClick() {
        return handleReaction && handleReaction(reactionType);
      }
    }, /*#__PURE__*/React__default.createElement("span", {
      onMouseEnter: function onMouseEnter() {
        return setTooltipReactionType(reactionType);
      }
    }, /*#__PURE__*/React__default.createElement(emojiMart.NimbleEmoji // emoji-mart type defs don't support spriteSheet use case
    // (but implementation does)
    // @ts-ignore
    , _extends({
      emoji: emojiDefinition
    }, emojiSetDef, {
      size: 13,
      data: emojiData
    })), "\xA0"), tooltipReactionType === ((_getOptionForType = getOptionForType(reactionType)) === null || _getOptionForType === void 0 ? void 0 : _getOptionForType.id) && /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__simple-reactions-list-tooltip"
    }, /*#__PURE__*/React__default.createElement("div", {
      className: "arrow"
    }), (_getUsersPerReactionT = getUsersPerReactionType(tooltipReactionType)) === null || _getUsersPerReactionT === void 0 ? void 0 : _getUsersPerReactionT.join(', '))) : null;
  }), (reactions === null || reactions === void 0 ? void 0 : reactions.length) !== 0 && /*#__PURE__*/React__default.createElement("li", {
    className: "str-chat__simple-reactions-list-item--last-number"
  }, getTotalReactionCount()));
};

SimpleReactionsList.propTypes = {
  reactions: PropTypes.array,

  /** Object/map of reaction id/type (e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry') vs count */
  reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),

  /** Provide a list of reaction options [{id: 'angry', emoji: 'angry'}] */
  reactionOptions: PropTypes.array,

  /**
   * Handler to set/unset reaction on message.
   *
   * @param type e.g. 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * */
  handleReaction: PropTypes.func
};
var DefaultReactionsList$1 = /*#__PURE__*/React__default.memo(SimpleReactionsList);

var handleActionWarning = "Action handler was called, but it is missing one of its required arguments.\n      Make sure the ChannelContext was properly set and that this hook was initialized with a valid message.";
/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) => (name: string, value: string, event: React.MouseEvent<HTMLElement>) => Promise<void>}
 */

var useActionHandler = function useActionHandler(message) {
  var _useContext = React.useContext(ChannelContext),
      channel = _useContext.channel,
      updateMessage = _useContext.updateMessage,
      removeMessage = _useContext.removeMessage;

  return /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(name, value, event) {
      var messageID, formData, data;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              event.preventDefault();

              if (!(!message || !updateMessage || !removeMessage || !channel)) {
                _context.next = 4;
                break;
              }

              console.warn(handleActionWarning);
              return _context.abrupt("return");

            case 4:
              messageID = message.id;
              formData = {
                [name]: value
              };
              _context.next = 8;
              return channel.sendAction(messageID, formData);

            case 8:
              data = _context.sent;

              if (data && data.message) {
                updateMessage(data.message);
              } else {
                removeMessage(message);
              }

            case 10:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x, _x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }();
};

/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) =>  (event: React.MouseEvent<HTMLElement>) => Promise<void>}
 */

var useDeleteHandler = function useDeleteHandler(message) {
  var _useContext = React.useContext(ChannelContext),
      updateMessage = _useContext.updateMessage,
      client = _useContext.client;

  return /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(event) {
      var data;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              event.preventDefault();

              if (!(!message || !client || !updateMessage)) {
                _context.next = 3;
                break;
              }

              return _context.abrupt("return");

            case 3:
              _context.next = 5;
              return client.deleteMessage(message.id);

            case 5:
              data = _context.sent;
              updateMessage(data.message);

            case 7:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
};

/**
 * @type {(
 *   customInitialState?: boolean,
 *   customSetEditing?: (event: React.MouseEvent<HTMLElement>) => void,
 *   customClearEditing?: (event: React.MouseEvent<HTMLElement>) => void
 * ) => {
 *   editing: boolean,
 *   setEdit: (event: React.MouseEvent<HTMLElement>) => void,
 *   clearEdit: (event: React.MouseEvent<HTMLElement>) => void
 * }}
 */

var useEditHandler = function useEditHandler() {
  var customInitialState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var customSetEditing = arguments.length > 1 ? arguments[1] : undefined;
  var customClearEditingHandler = arguments.length > 2 ? arguments[2] : undefined;

  var _useState = React.useState(customInitialState),
      _useState2 = _slicedToArray(_useState, 2),
      editing = _useState2[0],
      setEditing = _useState2[1];

  var setEdit = customSetEditing || function (event) {
    event === null || event === void 0 ? void 0 : event.preventDefault();
    setEditing(true);
  };

  var clearEdit = customClearEditingHandler || function (event) {
    event === null || event === void 0 ? void 0 : event.preventDefault();
    setEditing(false);
  };

  return {
    editing,
    setEdit,
    clearEdit
  };
};

/**
 * Following function validates a function which returns notification message.
 * It validates if the first parameter is function and also if return value of function is string or no.
 *
 * @type {(func: Function, args: any) => null | string}
 */

var validateAndGetMessage = function validateAndGetMessage(func, args) {
  if (!func || typeof func !== 'function') return null;
  var returnValue = func.apply(void 0, _toConsumableArray(args));
  if (typeof returnValue !== 'string') return null;
  return returnValue;
};
/**
 * Tell if the owner of the current message is muted
 *
 * @type {(message?: import('stream-chat').MessageResponse, mutes?: import('stream-chat').Mute[]) => boolean}
 */

var isUserMuted = function isUserMuted(message, mutes) {
  if (!mutes || !message) {
    return false;
  }

  var userMuted = mutes.filter(
  /** @type {(el: import('stream-chat').Mute) => boolean} Typescript syntax */
  function (el) {
    var _message$user;

    return el.target.id === ((_message$user = message.user) === null || _message$user === void 0 ? void 0 : _message$user.id);
  });
  return !!userMuted.length;
};
var MESSAGE_ACTIONS = {
  edit: 'edit',
  delete: 'delete',
  flag: 'flag',
  mute: 'mute'
};
/**
 * @typedef {{
 *   canEdit: boolean;
 *   canDelete: boolean;
 *   canMute: boolean;
 *   canFlag: boolean;
 * }} Capabilities
 * @type {(actions: string[] | boolean, capabilities: Capabilities) => string[]} Typescript syntax
 */

var getMessageActions = function getMessageActions(actions, _ref) {
  var canDelete = _ref.canDelete,
      canFlag = _ref.canFlag,
      canEdit = _ref.canEdit,
      canMute = _ref.canMute;
  var messageActionsAfterPermission = [];
  var messageActions = [];

  if (actions && typeof actions === 'boolean') {
    // If value of actions is true, then populate all the possible values
    messageActions = Object.keys(MESSAGE_ACTIONS);
  } else if (actions && actions.length > 0) {
    messageActions = _toConsumableArray(actions);
  } else {
    return [];
  }

  if (canEdit && messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.edit);
  }

  if (canDelete && messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.delete);
  }

  if (canFlag && messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.flag);
  }

  if (canMute && messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.mute);
  }

  return messageActionsAfterPermission;
};
/**
 * @typedef {Pick<import('../types').MessageComponentProps, 'message' | 'readBy' | 'groupStyles' | 'lastReceivedId' | 'messageListRect'>} MessageEqualProps
 * @type {(props: MessageEqualProps, nextProps: MessageEqualProps) => boolean} Typescript syntax
 */

var areMessagePropsEqual = function areMessagePropsEqual(props, nextProps) {
  return (// Message content is equal
    nextProps.message === props.message && // Message was read by someone
    deepequal(nextProps.readBy, props.readBy) && // Group style changes (it often happens that the last 3 messages of a channel have different group styles)
    deepequal(nextProps.groupStyles, props.groupStyles) && // @ts-ignore
    deepequal(nextProps.mutes, props.mutes) && // Last message received in the channel changes
    deepequal(nextProps.lastReceivedId, props.lastReceivedId) && // User toggles edit state
    // @ts-ignore // TODO: fix
    nextProps.editing === props.editing && // Message wrapper layout changes
    nextProps.messageListRect === props.messageListRect
  );
};
/**
 * @type {(nextProps: import('../types').MessageComponentProps, props: import('../types').MessageComponentProps ) => boolean} Typescript syntax
 */

var shouldMessageComponentUpdate = function shouldMessageComponentUpdate(props, nextProps) {
  // Component should only update if:
  return !areMessagePropsEqual(props, nextProps);
};
/** @type {(message: import('stream-chat').MessageResponse | undefined) => boolean} */

var messageHasReactions = function messageHasReactions(message) {
  return !!(message === null || message === void 0 ? void 0 : message.latest_reactions) && !!message.latest_reactions.length;
};
/** @type {(message: import('stream-chat').MessageResponse | undefined) => boolean} */

var messageHasAttachments = function messageHasAttachments(message) {
  return !!(message === null || message === void 0 ? void 0 : message.attachments) && !!message.attachments.length;
};
/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) => import('stream-chat').Attachment[] }
 */

var getImages = function getImages(message) {
  if (!(message === null || message === void 0 ? void 0 : message.attachments)) {
    return [];
  }

  return message.attachments.filter(
  /** @type {(item: import('stream-chat').Attachment) => boolean} Typescript syntax */
  function (item) {
    return item.type === 'image';
  });
};
/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) => import('stream-chat').Attachment[] }
 */

var getNonImageAttachments = function getNonImageAttachments(message) {
  if (!(message === null || message === void 0 ? void 0 : message.attachments)) {
    return [];
  }

  return message.attachments.filter(
  /** @type {(item: import('stream-chat').Attachment) => boolean} Typescript syntax */
  function (item) {
    return item.type !== 'image';
  });
};
var MessagePropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  html: PropTypes.string.isRequired,
  created_at: PropTypes.instanceOf(Date).isRequired,
  updated_at: PropTypes.instanceOf(Date).isRequired
}).isRequired;

var missingUseFlagHandlerParameterWarning = 'useFlagHandler was called but it is missing one or more necessary parameters.';
/**
 * @typedef {{
 *   notify?: import('../types').MessageComponentProps['addNotification'],
 *   getSuccessNotification?: import('../types').MessageComponentProps['getMuteUserSuccessNotification'],
 *   getErrorNotification?: import('../types').MessageComponentProps['getMuteUserErrorNotification'],
 * }} NotificationArg
 * @type {(message: import('stream-chat').MessageResponse | undefined, notification: NotificationArg) => (event: React.MouseEvent<HTMLElement>) => Promise<void>}
 */

var useFlagHandler = function useFlagHandler(message) {
  var notifications = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var _useContext = React.useContext(ChannelContext),
      client = _useContext.client;

  var _useContext2 = React.useContext(TranslationContext),
      t = _useContext2.t;
  /** @type {(event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */


  return /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(event) {
      var notify, getSuccessNotification, getErrorNotification, successMessage, errorMessage;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              event.preventDefault();
              notify = notifications.notify, getSuccessNotification = notifications.getSuccessNotification, getErrorNotification = notifications.getErrorNotification;

              if (!(!client || !t || !notify || !message)) {
                _context.next = 5;
                break;
              }

              console.warn(missingUseFlagHandlerParameterWarning);
              return _context.abrupt("return");

            case 5:
              _context.prev = 5;
              _context.next = 8;
              return client.flagMessage(message.id);

            case 8:
              successMessage = getSuccessNotification && validateAndGetMessage(getSuccessNotification, [message]);
              notify(successMessage || t('Message has been successfully flagged'), 'success');
              _context.next = 16;
              break;

            case 12:
              _context.prev = 12;
              _context.t0 = _context["catch"](5);
              errorMessage = getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);
              notify(errorMessage || t('Error adding flag: Either the flag already exist or there is issue with network connection ...'), 'error');

            case 16:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[5, 12]]);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
};

// @ts-check
/** @type {(fn: Function | undefined, message: import('stream-chat').MessageResponse | undefined) => Handler} * */

function createEventHandler(fn, message) {
  return function (e) {
    if (typeof fn !== 'function' || !(message === null || message === void 0 ? void 0 : message.mentioned_users)) {
      return;
    }

    fn(e, message.mentioned_users);
  };
}
/**
 * @typedef {React.EventHandler<React.SyntheticEvent>} Handler
 * @typedef { import('stream-chat').MessageResponse | undefined } Message
 * @typedef { (event: React.MouseEvent, user: import('stream-chat').UserResponse[] ) => void } CustomMentionHandler
 * @type {(
 *   message: Message,
 *   customMentionHandler?: {
 *     onMentionsClick?: CustomMentionHandler,
 *     onMentionsHover?: CustomMentionHandler
 *   }
 * ) => { onMentionsClick: Handler, onMentionsHover: Handler }}
 */


var useMentionsHandler = function useMentionsHandler(message, customMentionHandler) {
  /**
   * @type{import('../types').ChannelContextValue}
   */
  var _useContext = React.useContext(ChannelContext),
      channelOnMentionsClick = _useContext.onMentionsClick,
      channelOnMentionsHover = _useContext.onMentionsHover;

  var onMentionsClick = (customMentionHandler === null || customMentionHandler === void 0 ? void 0 : customMentionHandler.onMentionsClick) || channelOnMentionsClick || function () {};

  var onMentionsHover = (customMentionHandler === null || customMentionHandler === void 0 ? void 0 : customMentionHandler.onMentionsHover) || channelOnMentionsHover || function () {};

  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsClick: createEventHandler(onMentionsClick, message),

    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsHover: createEventHandler(onMentionsHover, message)
  };
};
/**
 * @type {(
 *   message: Message,
 *   eventHandlers?: {
 *     onMentionsClick?: Handler,
 *     onMentionsHover?: Handler,
 *   },
 * ) => { onMentionsClick: Handler, onMentionsHover: Handler }}
 */

var useMentionsUIHandler = function useMentionsUIHandler(message, eventHandlers) {
  /**
   * @type{import('../types').ChannelContextValue}
   */
  var _useContext2 = React.useContext(ChannelContext),
      onMentionsClick = _useContext2.onMentionsClick,
      onMentionsHover = _useContext2.onMentionsHover;

  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsClick: (eventHandlers === null || eventHandlers === void 0 ? void 0 : eventHandlers.onMentionsClick) || createEventHandler(onMentionsClick, message),

    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onMentionsHover: (eventHandlers === null || eventHandlers === void 0 ? void 0 : eventHandlers.onMentionsHover) || createEventHandler(onMentionsHover, message)
  };
};

var missingUseMuteHandlerParamsWarning = 'useMuteHandler was called but it is missing one or more necessary parameter.';
/**
 * @typedef {{
 *   notify?: import('../types').MessageComponentProps['addNotification'],
 *   getSuccessNotification?: import('../types').MessageComponentProps['getMuteUserSuccessNotification'],
 *   getErrorNotification?: import('../types').MessageComponentProps['getMuteUserErrorNotification'],
 * }} NotificationArg
 * @type {(message: import('stream-chat').MessageResponse | undefined, notification: NotificationArg) => (event: React.MouseEvent<HTMLElement>) => Promise<void>}
 */

var useMuteHandler = function useMuteHandler(message) {
  var notifications = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var _useContext = React.useContext(ChannelContext),
      client = _useContext.client,
      mutes = _useContext.mutes;

  var _useContext2 = React.useContext(TranslationContext),
      t = _useContext2.t;
  /** @type {(event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */


  return /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(event) {
      var notify, getSuccessNotification, getErrorNotification, successMessage, errorMessage, fallbackMessage, _successMessage, _errorMessage;

      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              event.preventDefault();
              notify = notifications.notify, getSuccessNotification = notifications.getSuccessNotification, getErrorNotification = notifications.getErrorNotification;

              if (!(!t || !(message === null || message === void 0 ? void 0 : message.user) || !notify || !client)) {
                _context.next = 5;
                break;
              }

              console.warn(missingUseMuteHandlerParamsWarning);
              return _context.abrupt("return");

            case 5:
              if (isUserMuted(message, mutes)) {
                _context.next = 19;
                break;
              }

              _context.prev = 6;
              _context.next = 9;
              return client.muteUser(message.user.id);

            case 9:
              successMessage = getSuccessNotification && validateAndGetMessage(getSuccessNotification, [message.user]);
              notify(successMessage || t("{{ user }} has been muted", {
                user: message.user.name || message.user.id
              }), 'success');
              _context.next = 17;
              break;

            case 13:
              _context.prev = 13;
              _context.t0 = _context["catch"](6);
              errorMessage = getErrorNotification && validateAndGetMessage(getErrorNotification, [message.user]);
              notify(errorMessage || t('Error muting a user ...'), 'error');

            case 17:
              _context.next = 31;
              break;

            case 19:
              _context.prev = 19;
              _context.next = 22;
              return client.unmuteUser(message.user.id);

            case 22:
              fallbackMessage = t("{{ user }} has been unmuted", {
                user: message.user.name || message.user.id
              });
              _successMessage = getSuccessNotification && validateAndGetMessage(getSuccessNotification, [message.user]) || fallbackMessage;

              if (typeof _successMessage === 'string') {
                notify(_successMessage, 'success');
              }

              _context.next = 31;
              break;

            case 27:
              _context.prev = 27;
              _context.t1 = _context["catch"](19);
              _errorMessage = getErrorNotification && validateAndGetMessage(getErrorNotification, [message.user]) || t('Error unmuting a user ...');

              if (typeof _errorMessage === 'string') {
                notify(_errorMessage, 'error');
              }

            case 31:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[6, 13], [19, 27]]);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
};

// @ts-check
/**
 * @type {(
 *   message: import('stream-chat').MessageResponse | undefined,
 *   customOpenThread?: (message: import('stream-chat').MessageResponse, event: React.SyntheticEvent) => void
 * ) => (event: React.SyntheticEvent) => void}
 */

var useOpenThreadHandler = function useOpenThreadHandler(message, customOpenThread) {
  /**
   * @type{import('../types').ChannelContextValue}
   */
  var _useContext = React.useContext(ChannelContext),
      channelOpenThread = _useContext.openThread;

  var openThread = customOpenThread || channelOpenThread;
  return function (event) {
    if (!openThread || !message) {
      console.warn('Open thread handler was called but it is missing one of its parameters');
      return;
    }

    openThread(message, event);
  };
};

var reactionHandlerWarning = "Reaction handler was called, but it is missing one of its required arguments.\n      Make sure the ChannelContext was properly set and that this hook was initialized with a valid message.";
/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) => (reactionType: string, event: React.MouseEvent) => Promise<void>}
 */

var useReactionHandler = function useReactionHandler(message) {
  var _useContext = React.useContext(ChannelContext),
      client = _useContext.client,
      channel = _useContext.channel,
      updateMessage = _useContext.updateMessage;

  return /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(reactionType, event) {
      var userExistingReaction, currentUser, originalMessage, reactionChangePromise, messageID, reaction;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (event && event.preventDefault) {
                event.preventDefault();
              }

              if (!(!updateMessage || !message || !channel || !client)) {
                _context.next = 4;
                break;
              }

              console.warn(reactionHandlerWarning);
              return _context.abrupt("return");

            case 4:
              userExistingReaction = null;
              currentUser = client.userID;

              if (message.own_reactions) {
                message.own_reactions.forEach(function (reaction) {
                  // own user should only ever contain the current user id
                  // just in case we check to prevent bugs with message updates from breaking reactions
                  if (reaction.user && currentUser === reaction.user.id && reaction.type === reactionType) {
                    userExistingReaction = reaction;
                  } else if (reaction.user && currentUser !== reaction.user.id) {
                    console.warn("message.own_reactions contained reactions from a different user, this indicates a bug");
                  }
                });
              }

              originalMessage = message;

              /*
              - Make the API call in the background
              - If it fails, revert to the old message...
               */
              if (userExistingReaction) {
                reactionChangePromise = channel.deleteReaction(message.id, // @ts-ignore Typescript doesn't understand that the userExistingReaction variable might have been mutated inside the foreach loop
                userExistingReaction.type);
              } else {
                // add the reaction
                messageID = message.id;
                reaction = {
                  type: reactionType
                }; // this.props.channel.state.addReaction(tmpReaction, this.props.message);

                reactionChangePromise = channel.sendReaction(messageID, reaction);
              }

              _context.prev = 9;
              _context.next = 12;
              return reactionChangePromise;

            case 12:
              _context.next = 17;
              break;

            case 14:
              _context.prev = 14;
              _context.t0 = _context["catch"](9);
              // revert to the original message if the API call fails
              updateMessage(originalMessage);

            case 17:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[9, 14]]);
    }));

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }();
};
/**
 * @typedef {{ onReactionListClick: () => void, showDetailedReactions: boolean }} ReactionClickHandler
 * @type {(
 *   message: import('stream-chat').MessageResponse | undefined,
 *   reactionSelectorRef: React.RefObject<HTMLDivElement | null>,
 *   messageWrapperRef?: React.RefObject<HTMLElement | null>
 * ) => ReactionClickHandler}
 */

var useReactionClick = function useReactionClick(message, reactionSelectorRef, messageWrapperRef) {
  var _useState = React.useState(false),
      _useState2 = _slicedToArray(_useState, 2),
      showDetailedReactions = _useState2[0],
      setShowDetailedReactions = _useState2[1];

  var messageDeleted = !!(message === null || message === void 0 ? void 0 : message.deleted_at);
  var hasListener = React.useRef(false);
  /** @type {EventListener} */

  var closeDetailedReactions = React.useCallback(function (event) {
    var _reactionSelectorRef$;

    if (event.target && ( // @ts-ignore
    reactionSelectorRef === null || reactionSelectorRef === void 0 ? void 0 : (_reactionSelectorRef$ = reactionSelectorRef.current) === null || _reactionSelectorRef$ === void 0 ? void 0 : _reactionSelectorRef$.contains(event.target))) {
      return;
    }

    setShowDetailedReactions(false);
  }, [setShowDetailedReactions, reactionSelectorRef]);
  React.useEffect(function () {
    var messageWrapper = messageWrapperRef === null || messageWrapperRef === void 0 ? void 0 : messageWrapperRef.current;

    if (showDetailedReactions && !hasListener.current) {
      hasListener.current = true;
      document.addEventListener('click', closeDetailedReactions);
      document.addEventListener('touchend', closeDetailedReactions);

      if (messageWrapper) {
        messageWrapper.addEventListener('mouseleave', closeDetailedReactions);
      }
    }

    if (!showDetailedReactions && hasListener.current) {
      document.removeEventListener('click', closeDetailedReactions);
      document.removeEventListener('touchend', closeDetailedReactions);

      if (messageWrapper) {
        messageWrapper.removeEventListener('mouseleave', closeDetailedReactions);
      }

      hasListener.current = false;
    }

    return function () {
      if (hasListener.current) {
        document.removeEventListener('click', closeDetailedReactions);
        document.removeEventListener('touchend', closeDetailedReactions);

        if (messageWrapper) {
          messageWrapper.removeEventListener('mouseleave', closeDetailedReactions);
        }

        hasListener.current = false;
      }
    };
  }, [showDetailedReactions, closeDetailedReactions, messageWrapperRef]);
  React.useEffect(function () {
    var messageWrapper = messageWrapperRef === null || messageWrapperRef === void 0 ? void 0 : messageWrapperRef.current;

    if (messageDeleted && hasListener.current) {
      document.removeEventListener('click', closeDetailedReactions);
      document.removeEventListener('touchend', closeDetailedReactions);

      if (messageWrapper) {
        messageWrapper.removeEventListener('mouseleave', closeDetailedReactions);
      }

      hasListener.current = false;
    }
  }, [messageDeleted, closeDetailedReactions, messageWrapperRef]);
  /** @type {() => void} Typescript syntax */

  var onReactionListClick = function onReactionListClick() {
    setShowDetailedReactions(true);
  };

  return {
    onReactionListClick,
    showDetailedReactions
  };
};

/**
 * @type {(
 *  customRetrySendMessage?: (message: import('stream-chat').Message) => Promise<void>
 * ) => (message: import('stream-chat').Message | undefined) => Promise<void>}
 */

var useRetryHandler = function useRetryHandler(customRetrySendMessage) {
  /**
   *@type {import('../types').ChannelContextValue}
   */
  var _useContext = React.useContext(ChannelContext),
      contextRetrySendMessage = _useContext.retrySendMessage;

  var retrySendMessage = customRetrySendMessage || contextRetrySendMessage;
  return /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(message) {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (!(retrySendMessage && message)) {
                _context.next = 3;
                break;
              }

              _context.next = 3;
              return retrySendMessage(message);

            case 3:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();
};

// @ts-check

/**
 * @typedef {React.EventHandler<React.SyntheticEvent>} Handler
 * @typedef {(e: React.MouseEvent, user: import('stream-chat').User) => void} UserEventHandler
 * @type {(message: import('stream-chat').MessageResponse | undefined, eventHandlers: {onUserClickHandler?: UserEventHandler, onUserHoverHandler?: UserEventHandler}) => { onUserClick: Handler, onUserHover: Handler }}
 */
var useUserHandler = function useUserHandler(message, eventHandlers) {
  return {
    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onUserClick: function onUserClick(e) {
      if (typeof (eventHandlers === null || eventHandlers === void 0 ? void 0 : eventHandlers.onUserClickHandler) !== 'function' || !(message === null || message === void 0 ? void 0 : message.user)) {
        return;
      }

      eventHandlers.onUserClickHandler(e, message.user);
    },

    /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
    onUserHover: function onUserHover(e) {
      if (typeof (eventHandlers === null || eventHandlers === void 0 ? void 0 : eventHandlers.onUserHoverHandler) !== 'function' || !(message === null || message === void 0 ? void 0 : message.user)) {
        return;
      }

      eventHandlers.onUserHoverHandler(e, message.user);
    }
  };
};

// @ts-check
/**
 * @typedef {{
 *   isMyMessage: boolean;
 *   isAdmin: boolean;
 *   isModerator: boolean;
 *   isOwner: boolean;
 *   canEditMessage: boolean;
 *   canDeleteMessage: boolean;
 * }} UserRoles
 * @type {(message: import('stream-chat').MessageResponse | undefined) => UserRoles} Typescript syntax
 */

var useUserRole = function useUserRole(message) {
  var _client$user, _channel$state, _channel$state$member, _channel$state2, _channel$state2$membe, _channel$state3, _channel$state3$membe, _channel$state4, _channel$state4$membe;

  var _useContext = React.useContext(ChannelContext),
      client = _useContext.client,
      channel = _useContext.channel;

  var isMyMessage = !!(message === null || message === void 0 ? void 0 : message.user) && !!(client === null || client === void 0 ? void 0 : client.user) && client.user.id === message.user.id;
  var isAdmin = (client === null || client === void 0 ? void 0 : (_client$user = client.user) === null || _client$user === void 0 ? void 0 : _client$user.role) === 'admin' || (channel === null || channel === void 0 ? void 0 : (_channel$state = channel.state) === null || _channel$state === void 0 ? void 0 : (_channel$state$member = _channel$state.membership) === null || _channel$state$member === void 0 ? void 0 : _channel$state$member.role) === 'admin';
  var isOwner = (channel === null || channel === void 0 ? void 0 : (_channel$state2 = channel.state) === null || _channel$state2 === void 0 ? void 0 : (_channel$state2$membe = _channel$state2.membership) === null || _channel$state2$membe === void 0 ? void 0 : _channel$state2$membe.role) === 'owner';
  var isModerator = (channel === null || channel === void 0 ? void 0 : (_channel$state3 = channel.state) === null || _channel$state3 === void 0 ? void 0 : (_channel$state3$membe = _channel$state3.membership) === null || _channel$state3$membe === void 0 ? void 0 : _channel$state3$membe.role) === 'channel_moderator' || (channel === null || channel === void 0 ? void 0 : (_channel$state4 = channel.state) === null || _channel$state4 === void 0 ? void 0 : (_channel$state4$membe = _channel$state4.membership) === null || _channel$state4$membe === void 0 ? void 0 : _channel$state4$membe.role) === 'moderator';
  var canEditMessage = isMyMessage || isModerator || isOwner || isAdmin;
  var canDeleteMessage = canEditMessage;
  return {
    isMyMessage,
    isAdmin,
    isOwner,
    isModerator,
    canEditMessage,
    canDeleteMessage
  };
};

/** @type {React.FC<import("types").MessageActionsBoxProps>} */

var MessageActionsBox = function MessageActionsBox(_ref) {
  var handleFlag = _ref.handleFlag,
      handleMute = _ref.handleMute,
      handleEdit = _ref.handleEdit,
      handleDelete = _ref.handleDelete,
      getMessageActions = _ref.getMessageActions,
      isUserMuted = _ref.isUserMuted,
      _ref$open = _ref.open,
      open = _ref$open === void 0 ? false : _ref$open,
      mine = _ref.mine,
      messageListRect = _ref.messageListRect;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var messageActions = getMessageActions();

  var _useState = React.useState(false),
      _useState2 = _slicedToArray(_useState, 2),
      reverse = _useState2[0],
      setReverse = _useState2[1];

  var checkIfReverse = React.useCallback(function (containerElement) {
    if (!containerElement) {
      setReverse(false);
      return;
    }

    if (open) {
      var containerRect = containerElement.getBoundingClientRect();

      if (mine) {
        setReverse(!!messageListRect && containerRect.left < messageListRect.left);
      } else {
        setReverse(!!messageListRect && containerRect.right + 5 > messageListRect.right);
      }
    }
  }, [messageListRect, mine, open]);
  return /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-actions-box",
    className: "str-chat__message-actions-box\n        ".concat(open ? 'str-chat__message-actions-box--open' : '', "\n        ").concat(mine ? 'str-chat__message-actions-box--mine' : '', "\n        ").concat(reverse ? 'str-chat__message-actions-box--reverse' : '', "\n      "),
    ref: checkIfReverse
  }, /*#__PURE__*/React__default.createElement("ul", {
    className: "str-chat__message-actions-list"
  }, messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1 && /*#__PURE__*/React__default.createElement("button", {
    onClick: handleFlag
  }, /*#__PURE__*/React__default.createElement("li", {
    className: "str-chat__message-actions-list-item"
  }, t('Flag'))), messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1 && /*#__PURE__*/React__default.createElement("button", {
    onClick: handleMute
  }, /*#__PURE__*/React__default.createElement("li", {
    className: "str-chat__message-actions-list-item"
  }, isUserMuted && isUserMuted() ? t('Unmute') : t('Mute'))), messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1 && /*#__PURE__*/React__default.createElement("button", {
    onClick: handleEdit
  }, /*#__PURE__*/React__default.createElement("li", {
    className: "str-chat__message-actions-list-item"
  }, t('Edit Message'))), messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1 && /*#__PURE__*/React__default.createElement("button", {
    onClick: handleDelete
  }, /*#__PURE__*/React__default.createElement("li", {
    className: "str-chat__message-actions-list-item"
  }, t('Delete')))));
};

MessageActionsBox.propTypes = {
  /** If the message actions box should be open or not */
  open: PropTypes.bool,

  /** If message belongs to current user. */
  mine: PropTypes.bool,

  /** DOMRect object for parent MessageList component */
  messageListRect:
  /** @type {PropTypes.Validator<DOMRect>} */
  PropTypes.object,

  /**
   * Handler for flaging a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleFlag: PropTypes.func,

  /**
   * Handler for muting a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleMute: PropTypes.func,

  /**
   * Handler for editing a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleEdit: PropTypes.func,

  /**
   * Handler for deleting a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleDelete: PropTypes.func,

  /**
   * Returns array of avalable message actions for current message.
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   */
  getMessageActions: PropTypes.func.isRequired
};
var MessageActionsBox$1 = /*#__PURE__*/React__default.memo(MessageActionsBox);

/**
 * @type { React.FC<import('../types').MessageActionsProps> }
 */

var MessageActions = function MessageActions(props) {
  var addNotification = props.addNotification,
      message = props.message,
      getMessageActions = props.getMessageActions,
      messageListRect = props.messageListRect,
      messageWrapperRef = props.messageWrapperRef,
      setEditingState = props.setEditingState,
      getMuteUserSuccessNotification = props.getMuteUserSuccessNotification,
      getMuteUserErrorNotification = props.getMuteUserErrorNotification,
      getFlagMessageErrorNotification = props.getFlagMessageErrorNotification,
      getFlagMessageSuccessNotification = props.getFlagMessageSuccessNotification,
      propHandleFlag = props.handleFlag,
      propHandleMute = props.handleMute,
      propHandleDelete = props.handleDelete,
      inline = props.inline,
      customWrapperClass = props.customWrapperClass;

  var _useContext = React.useContext(ChatContext),
      mutes = _useContext.mutes;

  var messageActions = getMessageActions();

  var _useState = React.useState(false),
      _useState2 = _slicedToArray(_useState, 2),
      actionsBoxOpen = _useState2[0],
      setActionsBoxOpen = _useState2[1];

  var _useUserRole = useUserRole(message),
      isMyMessage = _useUserRole.isMyMessage;

  var handleDelete = useDeleteHandler(message);
  var handleFlag = useFlagHandler(message, {
    notify: addNotification,
    getSuccessNotification: getFlagMessageErrorNotification,
    getErrorNotification: getFlagMessageSuccessNotification
  });
  var handleMute = useMuteHandler(message, {
    notify: addNotification,
    getErrorNotification: getMuteUserSuccessNotification,
    getSuccessNotification: getMuteUserErrorNotification
  });
  var isMuted = React.useCallback(function () {
    return isUserMuted(message, mutes);
  }, [message, mutes]);
  /** @type {() => void} Typescript syntax */

  var hideOptions = React.useCallback(function () {
    return setActionsBoxOpen(false);
  }, []);
  var messageDeletedAt = !!(message === null || message === void 0 ? void 0 : message.deleted_at);
  React.useEffect(function () {
    if (messageWrapperRef === null || messageWrapperRef === void 0 ? void 0 : messageWrapperRef.current) {
      messageWrapperRef.current.addEventListener('onMouseLeave', hideOptions);
    }
  }, [messageWrapperRef, hideOptions]);
  React.useEffect(function () {
    if (messageDeletedAt) {
      document.removeEventListener('click', hideOptions);
    }
  }, [messageDeletedAt, hideOptions]);
  React.useEffect(function () {
    if (actionsBoxOpen) {
      document.addEventListener('click', hideOptions);
    } else {
      document.removeEventListener('click', hideOptions);
    }

    return function () {
      document.removeEventListener('click', hideOptions);
    };
  }, [actionsBoxOpen, hideOptions]);

  if (messageActions.length === 0) {
    return null;
  }

  return /*#__PURE__*/React__default.createElement(MessageActionsWrapper, {
    inline: inline,
    customWrapperClass: customWrapperClass,
    setActionsBoxOpen: setActionsBoxOpen
  }, /*#__PURE__*/React__default.createElement(MessageActionsBox$1, {
    getMessageActions: getMessageActions,
    open: actionsBoxOpen,
    messageListRect: messageListRect,
    handleFlag: propHandleFlag || handleFlag,
    isUserMuted: isMuted,
    handleMute: propHandleMute || handleMute,
    handleEdit: setEditingState,
    handleDelete: propHandleDelete || handleDelete,
    mine: isMyMessage
  }), /*#__PURE__*/React__default.createElement("svg", {
    width: "11",
    height: "4",
    viewBox: "0 0 11 4",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z",
    fillRule: "nonzero"
  })));
};
/**
 * This is a workaround to encompass the different styles message actions can have at the moment
 * while allowing for sharing the component's stateful logic.
 * @type { React.FC<import('../types').MessageActionsWrapperProps> }
 */

var MessageActionsWrapper = function MessageActionsWrapper(props) {
  var children = props.children,
      customWrapperClass = props.customWrapperClass,
      inline = props.inline,
      setActionsBoxOpen = props.setActionsBoxOpen;
  var defaultWrapperClass = 'str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options';
  var wrapperClass = typeof customWrapperClass === 'string' ? customWrapperClass : defaultWrapperClass;
  /** @type {() => void} Typescript syntax */

  var onClickOptionsAction = function onClickOptionsAction() {
    return setActionsBoxOpen(true);
  };

  var wrapperProps = {
    'data-testid': 'message-actions',
    onClick: onClickOptionsAction,
    className: wrapperClass
  };

  if (inline) {
    return /*#__PURE__*/React__default.createElement("span", wrapperProps, children);
  }

  return /*#__PURE__*/React__default.createElement("div", wrapperProps, children);
};

/**
 * @type { React.FC<import('../types').MessageOptionsProps> }
 */

var MessageOptionsComponent = function MessageOptionsComponent(props) {
  var _props$displayActions = props.displayActions,
      displayActions = _props$displayActions === void 0 ? true : _props$displayActions,
      _props$displayLeft = props.displayLeft,
      displayLeft = _props$displayLeft === void 0 ? true : _props$displayLeft,
      _props$displayReplies = props.displayReplies,
      displayReplies = _props$displayReplies === void 0 ? true : _props$displayReplies,
      propHandleOpenThread = props.handleOpenThread,
      initialMessage = props.initialMessage,
      message = props.message,
      messageWrapperRef = props.messageWrapperRef,
      onReactionListClick = props.onReactionListClick,
      _props$theme = props.theme,
      theme = _props$theme === void 0 ? 'simple' : _props$theme,
      threadList = props.threadList;

  var _useUserRole = useUserRole(message),
      isMyMessage = _useUserRole.isMyMessage;

  var handleOpenThread = useOpenThreadHandler(message);
  /**
   * @type {import('../types').ChannelContextValue}
   */

  var _useContext = React.useContext(ChannelContext),
      channel = _useContext.channel;

  var channelConfig = channel === null || channel === void 0 ? void 0 : channel.getConfig();
  var shouldShowReplies = displayReplies && !threadList && channelConfig && channelConfig.replies;
  var shouldShowReactions = channelConfig && channelConfig.reactions;

  if (!message || message.type === 'error' || message.type === 'system' || message.type === 'ephemeral' || message.status === 'failed' || message.status === 'sending' || initialMessage) {
    return null;
  }

  if (isMyMessage && displayLeft) {
    return /*#__PURE__*/React__default.createElement("div", {
      "data-testid": "message-options-left",
      className: "str-chat__message-".concat(theme, "__actions")
    }, /*#__PURE__*/React__default.createElement(MessageActions, _extends({}, props, {
      messageWrapperRef: messageWrapperRef
    })), shouldShowReplies && /*#__PURE__*/React__default.createElement("div", {
      "data-testid": "thread-action",
      onClick: propHandleOpenThread || handleOpenThread,
      className: "str-chat__message-".concat(theme, " str-chat__message-").concat(theme, "__actions__action--thread")
    }, /*#__PURE__*/React__default.createElement(ThreadIcon, null)), shouldShowReactions && /*#__PURE__*/React__default.createElement("div", {
      "data-testid": "message-reaction-action",
      className: "str-chat__message-".concat(theme, "__actions__action str-chat__message-").concat(theme, "__actions__action--reactions"),
      onClick: onReactionListClick
    }, /*#__PURE__*/React__default.createElement(ReactionIcon, null)));
  }

  return /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-options",
    className: "str-chat__message-".concat(theme, "__actions")
  }, shouldShowReactions && /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-reaction-action",
    className: "str-chat__message-".concat(theme, "__actions__action str-chat__message-").concat(theme, "__actions__action--reactions"),
    onClick: onReactionListClick
  }, /*#__PURE__*/React__default.createElement(ReactionIcon, null)), shouldShowReplies && /*#__PURE__*/React__default.createElement("div", {
    onClick: propHandleOpenThread || handleOpenThread,
    "data-testid": "thread-action",
    className: "str-chat__message-".concat(theme, "__actions__action str-chat__message-").concat(theme, "__actions__action--thread")
  }, /*#__PURE__*/React__default.createElement(ThreadIcon, null)), displayActions && /*#__PURE__*/React__default.createElement(MessageActions, _extends({}, props, {
    messageWrapperRef: messageWrapperRef
  })));
};

var MessageOptions = /*#__PURE__*/React__default.memo(MessageOptionsComponent);

/**
 * @type { React.FC<import('../types').MessageTextProps> }
 */

var MessageTextComponent = function MessageTextComponent(props) {
  var _props$ReactionsList = props.ReactionsList,
      ReactionsList = _props$ReactionsList === void 0 ? DefaultReactionsList : _props$ReactionsList,
      _props$ReactionSelect = props.ReactionSelector,
      ReactionSelector = _props$ReactionSelect === void 0 ? DefaultReactionSelector : _props$ReactionSelect,
      propOnMentionsClick = props.onMentionsClickMessage,
      propOnMentionsHover = props.onMentionsHoverMessage,
      customWrapperClass = props.customWrapperClass,
      customInnerClass = props.customInnerClass,
      _props$theme = props.theme,
      theme = _props$theme === void 0 ? 'simple' : _props$theme,
      message = props.message,
      unsafeHTML = props.unsafeHTML,
      customOptionProps = props.customOptionProps;
  var reactionSelectorRef = React.useRef(
  /** @type {HTMLDivElement | null} */
  null);

  var _useMentionsUIHandler = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover
  }),
      onMentionsClick = _useMentionsUIHandler.onMentionsClick,
      onMentionsHover = _useMentionsUIHandler.onMentionsHover;

  var _useReactionClick = useReactionClick(message, reactionSelectorRef),
      onReactionListClick = _useReactionClick.onReactionListClick,
      showDetailedReactions = _useReactionClick.showDetailedReactions;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var hasReactions = messageHasReactions(message);
  var hasAttachment = messageHasAttachments(message);
  var handleReaction = useReactionHandler(message);
  var messageText = React.useMemo(function () {
    return renderText(message === null || message === void 0 ? void 0 : message.text, message === null || message === void 0 ? void 0 : message.mentioned_users);
  }, [message === null || message === void 0 ? void 0 : message.text, message === null || message === void 0 ? void 0 : message.mentioned_users]);
  var wrapperClass = customWrapperClass || 'str-chat__message-text';
  var innerClass = customInnerClass || "str-chat__message-text-inner str-chat__message-".concat(theme, "-text-inner");

  if (!(message === null || message === void 0 ? void 0 : message.text)) {
    return null;
  }

  return /*#__PURE__*/React__default.createElement("div", {
    className: wrapperClass
  }, /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-text-inner-wrapper",
    className: "\n          ".concat(innerClass, "\n          ").concat(hasAttachment ? " str-chat__message-".concat(theme, "-text-inner--has-attachment") : '', "\n          ").concat(isOnlyEmojis(message.text) ? " str-chat__message-".concat(theme, "-text-inner--is-emoji") : '', "\n        ").trim(),
    onMouseOver: onMentionsHover,
    onClick: onMentionsClick
  }, message.type === 'error' && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__".concat(theme, "-message--error-message")
  }, t && t('Error · Unsent')), message.status === 'failed' && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__".concat(theme, "-message--error-message")
  }, t && t('Message Failed · Click to try again')), unsafeHTML ? /*#__PURE__*/React__default.createElement("div", {
    dangerouslySetInnerHTML: {
      __html: message.html
    }
  }) : messageText, hasReactions && !showDetailedReactions && /*#__PURE__*/React__default.createElement(ReactionsList, {
    reactions: message.latest_reactions,
    reaction_counts: message.reaction_counts,
    onClick: onReactionListClick,
    reverse: true
  }), showDetailedReactions && /*#__PURE__*/React__default.createElement(ReactionSelector, {
    handleReaction: handleReaction,
    detailedView: true,
    reaction_counts: message.reaction_counts,
    latest_reactions: message.latest_reactions,
    ref: reactionSelectorRef
  })), /*#__PURE__*/React__default.createElement(MessageOptions, _extends({}, props, customOptionProps, {
    onReactionListClick: onReactionListClick
  })));
};

var MessageText = /*#__PURE__*/React__default.memo(MessageTextComponent);

// @ts-check
/**
 * @type{React.FC<import('../types').MessageDeletedProps>}
 */

var MessageDeleted = function MessageDeleted(props) {
  var message = props.message;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  var _useUserRole = useUserRole(message),
      isMyMessage = _useUserRole.isMyMessage;

  if (props.isMyMessage) {
    console.warn('The isMyMessage is deprecated, and will be removed in the next major release.');
  }

  var messageClasses = props.isMyMessage && props.isMyMessage(message) || isMyMessage ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me' : 'str-chat__message str-chat__message-simple';
  return /*#__PURE__*/React__default.createElement("div", {
    key: message.id,
    className: "".concat(messageClasses, " str-chat__message--deleted ").concat(message.type, " "),
    "data-testid": 'message-deleted-component'
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message--deleted-inner"
  }, t && t('This message was deleted...')));
};

MessageDeleted.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  // @ts-ignore
  // Ignoring this for now as Typescript definitions on 'strem-chat' are wrong.
  message: MessagePropTypes,

  /** @deprecated This is no longer needed. The component should now rely on the user role custom hook */
  isMyMessage: PropTypes.func
};

// @ts-check
var defaultTimestampFormat = 'h:mmA';
var notValidDateWarning = 'MessageTimestamp was called without a message, or message has invalid created_at date.';
var noParsingFunctionWarning = 'MessageTimestamp was called but there is no datetime parsing function available';
/**
 * @type { (
 *   messageCreatedAt?: string,
 *   formatDate?: import('../types').MessageTimestampProps['formatDate'],
 *   calendar?: boolean,
 *   tDateTimeParser?: import('../types').MessageTimestampProps['tDateTimeParser'],
 *   format?: string,
 * ) => string | null }
 */

function getDateString(messageCreatedAt, formatDate, calendar, tDateTimeParser, format) {
  if (!messageCreatedAt || !Date.parse(messageCreatedAt)) {
    console.warn(notValidDateWarning);
    return null;
  }

  if (typeof formatDate === 'function') {
    return formatDate(new Date(messageCreatedAt));
  }

  if (!tDateTimeParser) {
    console.warn(noParsingFunctionWarning);
    return null;
  }

  var parsedTime = tDateTimeParser(messageCreatedAt);

  if (calendar && typeof parsedTime.calendar !== 'function') {
    return null;
  }

  return calendar ? parsedTime.calendar() : parsedTime.format(format);
}
/**
 * @typedef { import('../types').MessageTimestampProps } Props
 * @type { React.FC<Props> }
 */


var MessageTimestamp = function MessageTimestamp(props) {
  var message = props.message,
      formatDate = props.formatDate,
      propTDatetimeParser = props.tDateTimeParser,
      _props$customClass = props.customClass,
      customClass = _props$customClass === void 0 ? '' : _props$customClass,
      _props$format = props.format,
      format = _props$format === void 0 ? defaultTimestampFormat : _props$format,
      _props$calendar = props.calendar,
      calendar = _props$calendar === void 0 ? false : _props$calendar;

  var _useContext = React.useContext(TranslationContext),
      contextTDateTimeParser = _useContext.tDateTimeParser;

  var tDateTimeParser = propTDatetimeParser || contextTDateTimeParser;
  var when = React.useMemo(function () {
    return getDateString(message === null || message === void 0 ? void 0 : message.created_at, formatDate, calendar, tDateTimeParser, format);
  }, [formatDate, calendar, tDateTimeParser, format, message === null || message === void 0 ? void 0 : message.created_at]);

  if (!when) {
    return null;
  }

  return /*#__PURE__*/React__default.createElement("time", {
    className: customClass,
    dateTime: message === null || message === void 0 ? void 0 : message.created_at,
    title: message === null || message === void 0 ? void 0 : message.created_at
  }, when);
};

var MessageTimestamp$1 = /*#__PURE__*/React__default.memo(MessageTimestamp);

/**
 * MessageSimple - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageSimple.md
 * @type { React.FC<import('../types').MessageSimpleProps> }
 */
// eslint-disable-next-line sonarjs/cognitive-complexity

var MessageSimple = function MessageSimple(props) {
  var _message$attachments, _message$attachments2;

  var clearEditingState = props.clearEditingState,
      editing = props.editing,
      message = props.message,
      threadList = props.threadList,
      formatDate = props.formatDate,
      propUpdateMessage = props.updateMessage,
      propHandleAction = props.handleAction,
      propHandleOpenThread = props.handleOpenThread,
      propHandleReaction = props.handleReaction,
      propHandleRetry = props.handleRetry,
      onUserClickCustomHandler = props.onUserClick,
      onUserHoverCustomHandler = props.onUserHover,
      propTDateTimeParser = props.tDateTimeParser;

  var _useContext = React.useContext(ChannelContext),
      channelUpdateMessage = _useContext.updateMessage;

  var updateMessage = propUpdateMessage || channelUpdateMessage;

  var _useUserRole = useUserRole(message),
      isMyMessage = _useUserRole.isMyMessage;

  var handleOpenThread = useOpenThreadHandler(message);
  var handleReaction = useReactionHandler(message);
  var handleAction = useActionHandler(message);
  var handleRetry = useRetryHandler();

  var _useUserHandler = useUserHandler(message, {
    onUserClickHandler: onUserClickCustomHandler,
    onUserHoverHandler: onUserHoverCustomHandler
  }),
      onUserClick = _useUserHandler.onUserClick,
      onUserHover = _useUserHandler.onUserHover;

  var reactionSelectorRef = /*#__PURE__*/React__default.createRef();
  var messageWrapperRef = React.useRef(null);

  var _useReactionClick = useReactionClick(message, reactionSelectorRef),
      onReactionListClick = _useReactionClick.onReactionListClick,
      showDetailedReactions = _useReactionClick.showDetailedReactions;

  var _props$Attachment = props.Attachment,
      Attachment$1 = _props$Attachment === void 0 ? Attachment : _props$Attachment,
      _props$MessageDeleted = props.MessageDeleted,
      MessageDeleted$1 = _props$MessageDeleted === void 0 ? MessageDeleted : _props$MessageDeleted,
      _props$ReactionSelect = props.ReactionSelector,
      ReactionSelector = _props$ReactionSelect === void 0 ? DefaultReactionSelector : _props$ReactionSelect,
      _props$ReactionsList = props.ReactionsList,
      ReactionsList = _props$ReactionsList === void 0 ? DefaultReactionsList : _props$ReactionsList;
  var hasReactions = messageHasReactions(message);
  var hasAttachment = messageHasAttachments(message);
  var messageClasses = isMyMessage ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me' : 'str-chat__message str-chat__message-simple';
  var images = hasAttachment && (message === null || message === void 0 ? void 0 : (_message$attachments = message.attachments) === null || _message$attachments === void 0 ? void 0 : _message$attachments.filter(
  /** @type {(item: import('stream-chat').Attachment) => boolean} Typescript syntax */
  function (item) {
    return item.type === 'image';
  }));

  if ((message === null || message === void 0 ? void 0 : message.type) === 'message.read' || (message === null || message === void 0 ? void 0 : message.type) === 'message.date') {
    return null;
  }

  if (message === null || message === void 0 ? void 0 : message.deleted_at) {
    return smartRender(MessageDeleted$1, {
      message
    }, null);
  }

  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, editing && /*#__PURE__*/React__default.createElement(Modal, {
    open: editing,
    onClose: clearEditingState
  }, /*#__PURE__*/React__default.createElement(MessageInput$1, _extends({
    Input: EditMessageForm,
    message: message,
    clearEditingState: clearEditingState,
    updateMessage: updateMessage
  }, props.additionalMessageInputProps))), message && /*#__PURE__*/React__default.createElement("div", {
    key: message.id || '',
    className: "\n\t\t\t\t\t\t".concat(messageClasses, "\n\t\t\t\t\t\tstr-chat__message--").concat(message.type, "\n\t\t\t\t\t\tstr-chat__message--").concat(message.status, "\n\t\t\t\t\t\t").concat(message.text ? 'str-chat__message--has-text' : 'has-no-text', "\n\t\t\t\t\t\t").concat(hasAttachment ? 'str-chat__message--has-attachment' : '', "\n\t\t\t\t\t\t").concat(hasReactions ? 'str-chat__message--with-reactions' : '', "\n\t\t\t\t\t").trim(),
    ref: messageWrapperRef
  }, /*#__PURE__*/React__default.createElement(MessageSimpleStatus, props), message.user && /*#__PURE__*/React__default.createElement(Avatar, {
    image: message.user.image,
    name: message.user.name || message.user.id,
    onClick: onUserClick,
    onMouseOver: onUserHover
  }), /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-inner",
    className: "str-chat__message-inner",
    onClick: function onClick() {
      if (message.status === 'failed' && (propHandleRetry || handleRetry)) {
        var retryHandler = propHandleRetry || handleRetry; // FIXME: type checking fails here because in the case of a failed message,
        // `message` is of type Client.Message (i.e. request object)
        // instead of Client.MessageResponse (i.e. server response object)
        // @ts-ignore

        retryHandler(message);
      }
    }
  }, !message.text && /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement(MessageOptions, _extends({}, props, {
    messageWrapperRef: messageWrapperRef,
    onReactionListClick: onReactionListClick,
    handleOpenThread: propHandleOpenThread
  })), hasReactions && !showDetailedReactions && /*#__PURE__*/React__default.createElement(ReactionsList, {
    reactions: message.latest_reactions,
    reaction_counts: message.reaction_counts,
    onClick: onReactionListClick,
    reverse: true
  }), showDetailedReactions && /*#__PURE__*/React__default.createElement(ReactionSelector, {
    handleReaction: propHandleReaction || handleReaction,
    detailedView: true,
    reaction_counts: message.reaction_counts,
    latest_reactions: message.latest_reactions,
    ref: reactionSelectorRef
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-attachment-container"
  }, hasAttachment && ((_message$attachments2 = message.attachments) === null || _message$attachments2 === void 0 ? void 0 : _message$attachments2.map(
  /** @type {(item: import('stream-chat').Attachment) => React.ReactElement | null} Typescript syntax */
  function (attachment, index) {
    if (attachment.type === 'image' && images && images.length > 1) return null;
    return /*#__PURE__*/React__default.createElement(Attachment$1, {
      key: "".concat(message.id, "-").concat(index),
      attachment: attachment,
      actionHandler: propHandleAction || handleAction
    });
  }))), images && images.length > 1 && /*#__PURE__*/React__default.createElement(Gallery$1, {
    images: images
  }), message.text && /*#__PURE__*/React__default.createElement(MessageText, _extends({}, props, {
    customOptionProps: {
      messageWrapperRef,
      handleOpenThread: propHandleOpenThread
    } // FIXME: There's some unmatched definition between the infered and the declared
    // ReactionSelector reference
    // @ts-ignore
    ,
    reactionSelectorRef: reactionSelectorRef
  })), !threadList && message.reply_count !== 0 && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-simple-reply-button"
  }, /*#__PURE__*/React__default.createElement(MessageRepliesCountButton$1, {
    onClick: propHandleOpenThread || handleOpenThread,
    reply_count: message.reply_count
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-data str-chat__message-simple-data"
  }, !isMyMessage && message.user ? /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__message-simple-name"
  }, message.user.name || message.user.id) : null, /*#__PURE__*/React__default.createElement(MessageTimestamp$1, {
    customClass: "str-chat__message-simple-timestamp",
    tDateTimeParser: propTDateTimeParser,
    formatDate: formatDate,
    message: message,
    calendar: true
  })))));
};
/** @type { React.FC<import('../types').MessageSimpleProps> } */


var MessageSimpleStatus = function MessageSimpleStatus(_ref) {
  var readBy = _ref.readBy,
      message = _ref.message,
      threadList = _ref.threadList,
      lastReceivedId = _ref.lastReceivedId;

  var _useContext2 = React.useContext(TranslationContext),
      t = _useContext2.t;

  var _useContext3 = React.useContext(ChannelContext),
      client = _useContext3.client;

  var _useUserRole2 = useUserRole(message),
      isMyMessage = _useUserRole2.isMyMessage;

  if (!isMyMessage || (message === null || message === void 0 ? void 0 : message.type) === 'error') {
    return null;
  }

  var justReadByMe = readBy && readBy.length === 1 && readBy[0] && client && readBy[0].id === client.user.id;

  if (message && message.status === 'sending') {
    return /*#__PURE__*/React__default.createElement("span", {
      className: "str-chat__message-simple-status",
      "data-testid": "message-status-sending"
    }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t && t('Sending...')), /*#__PURE__*/React__default.createElement(DefaultLoadingIndicator, null));
  }

  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    var lastReadUser = readBy.filter(
    /** @type {(item: import('stream-chat').UserResponse) => boolean} Typescript syntax */
    function (item) {
      return !!item && !!client && item.id !== client.user.id;
    })[0];
    return /*#__PURE__*/React__default.createElement("span", {
      className: "str-chat__message-simple-status",
      "data-testid": "message-status-read-by"
    }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, readBy && getReadByTooltipText(readBy, t, client)), /*#__PURE__*/React__default.createElement(Avatar, {
      name: lastReadUser && lastReadUser.name ? lastReadUser.name : null,
      image: lastReadUser && lastReadUser.image ? lastReadUser.image : null,
      size: 15
    }), readBy.length > 2 && /*#__PURE__*/React__default.createElement("span", {
      className: "str-chat__message-simple-status-number",
      "data-testid": "message-status-read-by-many"
    }, readBy.length - 1));
  }

  if (message && message.status === 'received' && message.id === lastReceivedId && !threadList) {
    return /*#__PURE__*/React__default.createElement("span", {
      className: "str-chat__message-simple-status",
      "data-testid": "message-status-received"
    }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t && t('Delivered')), /*#__PURE__*/React__default.createElement(DeliveredCheckIcon, null));
  }

  return null;
};

MessageSimple.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message:
  /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */
  PropTypes.object.isRequired,

  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  Attachment:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').AttachmentUIComponentProps>>} */
  PropTypes.elementType,

  /**
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   *
   * */
  Message:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageUIComponentProps>>} */
  PropTypes.oneOfType([PropTypes.node, PropTypes.func, PropTypes.object]),

  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,

  /** Client object */
  // @ts-ignore
  client: PropTypes.object,

  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,

  /** Channel config object */
  channelConfig:
  /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */
  PropTypes.object,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,

  /** If component is in thread list */
  threadList: PropTypes.bool,

  /**
   * Function to open thread on current messxage
   * @deprecated The component now relies on the useThreadHandler custom hook
   * You can customize the behaviour for your thread handler on the <Channel> component instead.
   */
  handleOpenThread: PropTypes.func,

  /** If the message is in edit state */
  editing: PropTypes.bool,

  /** Function to exit edit state */
  clearEditingState: PropTypes.func,

  /** Returns true if message belongs to current user */
  isMyMessage: PropTypes.func,

  /**
   * Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute]
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   * */
  getMessageActions: PropTypes.func.isRequired,

  /**
   * Function to publish updates on message to channel
   *
   * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
   * */
  updateMessage: PropTypes.func,

  /**
   * Reattempt sending a message
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
   * @deprecated This component now relies on the useRetryHandler custom hook.
   */
  handleRetry: PropTypes.func,

  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   * @deprecated This component now relies on the useReactionHandler custom hook.
   */
  handleReaction: PropTypes.func,

  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionSelectorProps>>} */
  PropTypes.elementType,

  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionsListProps>>} */
  PropTypes.elementType,

  /** If actions such as edit, delete, flag, mute are enabled on message */
  actionsEnabled: PropTypes.bool,

  /** DOMRect object for parent MessageList component */
  messageListRect: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    right: PropTypes.number.isRequired,
    bottom: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
    toJSON: PropTypes.func.isRequired
  }),

  /**
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   * @deprecated This component now relies on the useActionHandler custom hook, and this prop will be removed on the next major release.
   */
  handleAction: PropTypes.func,

  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   * @deprecated This component now relies on the useMentionsHandler custom hook, and this prop will be removed on the next major release.
   * You can customize the behaviour for your mention handler on the <Channel> component instead.
   */
  onMentionsHoverMessage: PropTypes.func,

  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
   * @deprecated This component now relies on the useMentionsHandler custom hook, and this prop will be removed on the next major release.
   * You can customize the behaviour for your mention handler on the <Channel> component instead.
   */
  onMentionsClickMessage: PropTypes.func,

  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   */
  onUserClick: PropTypes.func,

  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   */
  onUserHover: PropTypes.func,

  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object,

  /**
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageDeletedProps>>} */
  PropTypes.elementType
};
var MessageSimple$1 = /*#__PURE__*/React__default.memo(MessageSimple, areMessagePropsEqual);

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ../../docs/Message.md
 * @type { React.FC<import('../types').MessageComponentProps> }
 */

var Message = function Message(props) {
  var addNotification = props.addNotification,
      getFlagMessageErrorNotification = props.getFlagMessageErrorNotification,
      getFlagMessageSuccessNotification = props.getFlagMessageSuccessNotification,
      getMuteUserErrorNotification = props.getMuteUserErrorNotification,
      getMuteUserSuccessNotification = props.getMuteUserSuccessNotification,
      message = props.message,
      propChannel = props.channel,
      propOnUserClick = props.onUserClick,
      propOnUserHover = props.onUserHover,
      propOpenThread = props.openThread,
      propRetrySendMessage = props.retrySendMessage,
      propOnMentionsClick = props.onMentionsClick,
      propOnMentionsHover = props.onMentionsHover,
      _props$Message = props.Message,
      MessageUIComponent = _props$Message === void 0 ? MessageSimple$1 : _props$Message,
      _props$messageActions = props.messageActions,
      messageActions = _props$messageActions === void 0 ? Object.keys(MESSAGE_ACTIONS) : _props$messageActions,
      formatDate = props.formatDate,
      _props$groupStyles = props.groupStyles,
      groupStyles = _props$groupStyles === void 0 ? [] : _props$groupStyles;

  var _useContext = React.useContext(ChannelContext),
      contextChannel = _useContext.channel;

  var channel = propChannel || contextChannel;
  var channelConfig = (channel === null || channel === void 0 ? void 0 : channel.getConfig) && channel.getConfig();

  var _useEditHandler = useEditHandler(),
      editing = _useEditHandler.editing,
      setEdit = _useEditHandler.setEdit,
      clearEdit = _useEditHandler.clearEdit;

  var handleDelete = useDeleteHandler(message);
  var handleReaction = useReactionHandler(message);
  var handleAction = useActionHandler(message);
  var handleRetry = useRetryHandler(propRetrySendMessage);
  var handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  var handleFlag = useFlagHandler(message, {
    notify: addNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
    getErrorNotification: getFlagMessageErrorNotification
  });
  var handleMute = useMuteHandler(message, {
    notify: addNotification,
    getSuccessNotification: getMuteUserSuccessNotification,
    getErrorNotification: getMuteUserErrorNotification
  });

  var _useMentionsHandler = useMentionsHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover
  }),
      onMentionsClick = _useMentionsHandler.onMentionsClick,
      onMentionsHover = _useMentionsHandler.onMentionsHover;

  var _useUserHandler = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover
  }),
      onUserClick = _useUserHandler.onUserClick,
      onUserHover = _useUserHandler.onUserHover;

  var _useUserRole = useUserRole(message),
      _isMyMessage = _useUserRole.isMyMessage,
      isAdmin = _useUserRole.isAdmin,
      isModerator = _useUserRole.isModerator,
      isOwner = _useUserRole.isOwner;

  var canEdit = _isMyMessage || isModerator || isOwner || isAdmin;
  var canDelete = canEdit;
  var messageActionsHandler = React.useCallback(function () {
    if (!message || !messageActions) {
      return [];
    }

    return getMessageActions(messageActions, {
      canDelete,
      canEdit,
      canFlag: !_isMyMessage,
      canMute: !_isMyMessage && !!(channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.mutes)
    });
  }, [channelConfig, message, messageActions, canDelete, canEdit, _isMyMessage]);
  var actionsEnabled = message && message.type === 'regular' && message.status === 'received';
  return MessageUIComponent && /*#__PURE__*/React__default.createElement(MessageUIComponent, _extends({}, props, {
    editing: editing,
    formatDate: formatDate,
    clearEditingState: clearEdit,
    setEditingState: setEdit,
    groupStyles: groupStyles,
    actionsEnabled: actionsEnabled,
    Message: MessageUIComponent,
    handleReaction: handleReaction,
    getMessageActions: messageActionsHandler,
    handleFlag: handleFlag,
    handleMute: handleMute,
    handleAction: handleAction,
    handleDelete: handleDelete,
    handleEdit: setEdit,
    handleRetry: handleRetry,
    handleOpenThread: handleOpenThread,
    isMyMessage: function isMyMessage() {
      return _isMyMessage;
    },
    channelConfig: channelConfig,
    onMentionsClickMessage: onMentionsClick,
    onMentionsHoverMessage: onMentionsHover,
    onUserClick: onUserClick,
    onUserHover: onUserHover
  }));
};

Message.propTypes = {
  /** The message object */
  message:
  /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */
  PropTypes.shape({
    text: PropTypes.string.isRequired,
    html: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),
    reaction_scores: PropTypes.objectOf(PropTypes.number.isRequired),
    created_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string.isRequired
  }).isRequired,

  /** The client connection object for connecting to Stream */
  client: PropTypes.instanceOf(streamChat.StreamChat).isRequired,

  /** The current channel this message is displayed in */
  channel: PropTypes.instanceOf(streamChat.Channel).isRequired,

  /** A list of users that have read this message */
  readBy: PropTypes.array,

  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles: PropTypes.array,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,

  /**
   * Message UI component to display a message in message list.
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Message:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageUIComponentProps>>} */
  PropTypes.elementType,

  /**
   * The component that will be rendered if the message has been deleted.
   * All props are passed into this component.
   */
  MessageDeleted:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageDeletedProps>>} */
  PropTypes.elementType,

  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionSelectorProps>>} */
  PropTypes.elementType,

  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionsListProps>>} */
  PropTypes.elementType,

  /**
   * Attachment UI component to display attachment in individual message.
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Attachment:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').AttachmentUIComponentProps>>} */
  PropTypes.elementType,

  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,

  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),

  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
   *
   * This function should accept following params:
   *
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   *
   * */
  getFlagMessageSuccessNotification: PropTypes.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error
   *
   * This function should accept following params:
   *
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   *
   * */
  getFlagMessageErrorNotification: PropTypes.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user is successful
   *
   * This function should accept following params:
   *
   * @param user A user object which is being muted
   *
   * */
  getMuteUserSuccessNotification: PropTypes.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
   *
   * This function should accept following params:
   *
   * @param user A user object which is being muted
   *
   * */
  getMuteUserErrorNotification: PropTypes.func,

  /** Latest message id on current channel */
  lastReceivedId: PropTypes.string,

  /** DOMRect object for parent MessageList component */
  messageListRect:
  /** @type {PropTypes.Validator<DOMRect>} */
  PropTypes.object,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  members:
  /** @type {PropTypes.Validator<import('seamless-immutable').ImmutableObject<{[user_id: string]: import('stream-chat').Member}> | null | undefined>} */
  PropTypes.object,

  /**
   * Function to add custom notification on messagelist
   *
   * @param text Notification text to display
   * @param type Type of notification. 'success' | 'error'
   * */
  addNotification: PropTypes.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  updateMessage: PropTypes.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  removeMessage: PropTypes.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  retrySendMessage: PropTypes.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  onMentionsClick: PropTypes.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  onMentionsHover: PropTypes.func,

  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   * @param user the User object for the corresponding user.
   */
  onUserClick: PropTypes.func,

  /**
   * The handler for hover events on the user that posted the message
   *
   * @param event Dom hover event which triggered handler.
   * @param user the User object for the corresponding user.
   */
  onUserHover: PropTypes.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  openThread: PropTypes.func,

  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object
};
Message.defaultProps = {
  Message: MessageSimple$1,
  readBy: [],
  groupStyles: [],
  messageActions: Object.keys(MESSAGE_ACTIONS)
};
var Message$1 = /*#__PURE__*/React__default.memo(Message, areMessagePropsEqual);

/**
 * MessageCommerce - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageCommerce.md
 * @type { React.FC<import('../types').MessageCommerceProps> }
 */

var MessageCommerce = function MessageCommerce(props) {
  var _message$user, _message$user2, _message$user3, _message$user4, _message$user5;

  var message = props.message,
      formatDate = props.formatDate,
      groupStyles = props.groupStyles,
      actionsEnabled = props.actionsEnabled,
      threadList = props.threadList,
      MessageDeleted = props.MessageDeleted,
      getMessageActions = props.getMessageActions,
      _props$ReactionsList = props.ReactionsList,
      ReactionsList = _props$ReactionsList === void 0 ? DefaultReactionsList : _props$ReactionsList,
      _props$ReactionSelect = props.ReactionSelector,
      ReactionSelector = _props$ReactionSelect === void 0 ? DefaultReactionSelector : _props$ReactionSelect,
      propHandleReaction = props.handleReaction,
      propHandleAction = props.handleAction,
      propHandleOpenThread = props.handleOpenThread,
      propOnUserClick = props.onUserClick,
      propOnUserHover = props.onUserHover,
      propTDateTimeParser = props.tDateTimeParser;
  var Attachment$1 = props.Attachment || Attachment;
  var hasReactions = messageHasReactions(message);
  var handleAction = useActionHandler(message);
  var handleReaction = useReactionHandler(message);
  var handleOpenThread = useOpenThreadHandler(message);
  var reactionSelectorRef = React.useRef(null);

  var _useReactionClick = useReactionClick(message, reactionSelectorRef),
      onReactionListClick = _useReactionClick.onReactionListClick,
      showDetailedReactions = _useReactionClick.showDetailedReactions;

  var _useUserHandler = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover
  }),
      onUserClick = _useUserHandler.onUserClick,
      onUserHover = _useUserHandler.onUserHover;

  var _useUserRole = useUserRole(message),
      isMyMessage = _useUserRole.isMyMessage;

  var messageClasses = "str-chat__message-commerce str-chat__message-commerce--".concat(isMyMessage ? 'right' : 'left');
  var hasAttachment = messageHasAttachments(message);
  var images = getImages(message);
  var firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if (message === null || message === void 0 ? void 0 : message.deleted_at) {
    return smartRender(MessageDeleted, props, null);
  }

  if (message && (message.type === 'message.read' || message.type === 'message.date')) {
    return null;
  } // eslint-disable-next-line sonarjs/cognitive-complexity


  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-commerce-wrapper",
    key: (message === null || message === void 0 ? void 0 : message.id) || '',
    className: "\n\t\t\t\t\t\t".concat(messageClasses, "\n\t\t\t\t\t\tstr-chat__message-commerce--").concat(message === null || message === void 0 ? void 0 : message.type, "\n\t\t\t\t\t\t").concat((message === null || message === void 0 ? void 0 : message.text) ? 'str-chat__message-commerce--has-text' : 'str-chat__message-commerce--has-no-text', "\n\t\t\t\t\t\t").concat(hasAttachment ? 'str-chat__message-commerce--has-attachment' : '', "\n\t\t\t\t\t\t").concat(hasReactions ? 'str-chat__message-commerce--with-reactions' : '', "\n\t\t\t\t\t\t", "str-chat__message-commerce--".concat(firstGroupStyle), "\n\t\t\t\t\t").trim()
  }, (firstGroupStyle === 'bottom' || firstGroupStyle === 'single') && /*#__PURE__*/React__default.createElement(Avatar, {
    image: message === null || message === void 0 ? void 0 : (_message$user = message.user) === null || _message$user === void 0 ? void 0 : _message$user.image,
    size: 32,
    name: (message === null || message === void 0 ? void 0 : (_message$user2 = message.user) === null || _message$user2 === void 0 ? void 0 : _message$user2.name) || (message === null || message === void 0 ? void 0 : (_message$user3 = message.user) === null || _message$user3 === void 0 ? void 0 : _message$user3.id),
    onClick: onUserClick,
    onMouseOver: onUserHover
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-commerce-inner"
  }, message && !message.text && /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement(MessageOptions, _extends({}, props, {
    displayLeft: false,
    displayReplies: false,
    displayActions: false,
    onReactionListClick: onReactionListClick,
    theme: 'commerce'
  })), hasReactions && !showDetailedReactions && /*#__PURE__*/React__default.createElement(ReactionsList, {
    reactions: message.latest_reactions,
    reaction_counts: message.reaction_counts,
    onClick: onReactionListClick
  }), showDetailedReactions && /*#__PURE__*/React__default.createElement(ReactionSelector, {
    reverse: false,
    handleReaction: propHandleReaction || handleReaction,
    detailedView: true,
    reaction_counts: message.reaction_counts,
    latest_reactions: message.latest_reactions,
    ref: reactionSelectorRef
  })), (message === null || message === void 0 ? void 0 : message.attachments) && (!images || images.length <= 1) && message.attachments.map(function (attachment, index) {
    return /*#__PURE__*/React__default.createElement(Attachment$1, {
      key: "".concat(message.id, "-").concat(index),
      attachment: attachment,
      actionHandler: propHandleAction || handleAction
    });
  }), !!images.length && /*#__PURE__*/React__default.createElement(Gallery$1, {
    images: images
  }), (message === null || message === void 0 ? void 0 : message.text) && /*#__PURE__*/React__default.createElement(MessageText, {
    ReactionSelector: ReactionSelector,
    ReactionsList: ReactionsList,
    actionsEnabled: actionsEnabled,
    customWrapperClass: "str-chat__message-commerce-text",
    customInnerClass: "str-chat__message-commerce-text-inner",
    customOptionProps: {
      displayLeft: false,
      displayReplies: false,
      displayActions: false,
      theme: 'commerce'
    },
    getMessageActions: getMessageActions,
    message: message,
    messageListRect: props.messageListRect,
    unsafeHTML: props.unsafeHTML,
    onMentionsClickMessage: props.onMentionsClickMessage,
    onMentionsHoverMessage: props.onMentionsHoverMessage,
    theme: "commerce"
  }), !threadList && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-commerce-reply-button"
  }, /*#__PURE__*/React__default.createElement(MessageRepliesCountButton$1, {
    onClick: propHandleOpenThread || handleOpenThread,
    reply_count: message === null || message === void 0 ? void 0 : message.reply_count
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-commerce-data"
  }, !isMyMessage ? /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__message-commerce-name"
  }, (message === null || message === void 0 ? void 0 : (_message$user4 = message.user) === null || _message$user4 === void 0 ? void 0 : _message$user4.name) || (message === null || message === void 0 ? void 0 : (_message$user5 = message.user) === null || _message$user5 === void 0 ? void 0 : _message$user5.id)) : null, /*#__PURE__*/React__default.createElement(MessageTimestamp$1, {
    formatDate: formatDate,
    customClass: "str-chat__message-commerce-timestamp",
    message: message,
    tDateTimeParser: propTDateTimeParser,
    format: "LT"
  })))));
};

MessageCommerce.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message:
  /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */
  PropTypes.object.isRequired,

  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  Attachment:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').AttachmentUIComponentProps>>} */
  PropTypes.elementType,

  /**
   *
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   *
   */
  Message:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageUIComponentProps>>} */
  PropTypes.oneOfType([PropTypes.node, PropTypes.func, PropTypes.object]),

  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,

  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,

  /** Channel config object */
  channelConfig:
  /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */
  PropTypes.object,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,

  /** If component is in thread list */
  threadList: PropTypes.bool,

  /**
   * Function to open thread on current messxage
   * @deprecated The component now relies on the useThreadHandler custom hook
   * You can customize the behaviour for your thread handler on the <Channel> component instead.
   */
  handleOpenThread: PropTypes.func,

  /** Returns true if message belongs to current user */
  isMyMessage: PropTypes.func,

  /** Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute] */
  getMessageActions: PropTypes.func.isRequired,

  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   * @deprecated This component now relies on the useReactionHandler custom hook.
   */
  handleReaction: PropTypes.func,

  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionSelectorProps>>} */
  PropTypes.elementType,

  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionsListProps>>} */
  PropTypes.elementType,

  /** If actions such as edit, delete, flag, mute are enabled on message */
  actionsEnabled: PropTypes.bool,

  /**
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   * @deprecated This component now relies on the useActionHandler custom hook, and this prop will be removed on the next major release.
   */
  handleAction: PropTypes.func,

  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   */
  onMentionsHoverMessage: PropTypes.func,

  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
   */
  onMentionsClickMessage: PropTypes.func,

  /** Position of message in group. Possible values: top, bottom, middle, single */
  groupStyles: PropTypes.array,

  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   * @deprecated This component now relies on the useUserHandler custom hook, and this prop will be removed on the next major release.
   */
  onUserClick: PropTypes.func,

  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   * @deprecated This component now relies on the useUserHandler custom hook, and this prop will be removed on the next major release.
   */
  onUserHover: PropTypes.func,

  /** The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageDeletedProps>>} */
  PropTypes.elementType
};
var MessageCommerce$1 = /*#__PURE__*/React__default.memo(MessageCommerce, areMessagePropsEqual);

/**
 * MessageLivestream - Render component, should be used together with the Message component
 * Implements the look and feel for a livestream use case.
 *
 * @example ../../docs/MessageLivestream.md
 * @typedef { import('../../../types').MessageLivestreamProps } Props
 * @type { React.FC<Props> }
 */
// eslint-disable-next-line sonarjs/cognitive-complexity

var MessageLivestreamComponent = function MessageLivestreamComponent(props) {
  var _message$user4, _message$user5, _message$user6, _message$user7, _message$user8;

  var message = props.message,
      groupStyles = props.groupStyles,
      propEditing = props.editing,
      propSetEdit = props.setEditingState,
      propClearEdit = props.clearEditingState,
      initialMessage = props.initialMessage,
      unsafeHTML = props.unsafeHTML,
      formatDate = props.formatDate,
      propChannelConfig = props.channelConfig,
      _props$ReactionsList = props.ReactionsList,
      ReactionsList = _props$ReactionsList === void 0 ? DefaultReactionsList$1 : _props$ReactionsList,
      _props$ReactionSelect = props.ReactionSelector,
      ReactionSelector = _props$ReactionSelect === void 0 ? DefaultReactionSelector : _props$ReactionSelect,
      propOnUserClick = props.onUserClick,
      propHandleReaction = props.handleReaction,
      propHandleOpenThread = props.handleOpenThread,
      propOnUserHover = props.onUserHover,
      propHandleRetry = props.handleRetry,
      propHandleAction = props.handleAction,
      propUpdateMessage = props.updateMessage,
      propOnMentionsClick = props.onMentionsClickMessage,
      propOnMentionsHover = props.onMentionsHoverMessage,
      _props$Attachment = props.Attachment,
      Attachment$1 = _props$Attachment === void 0 ? Attachment : _props$Attachment,
      propT = props.t,
      propTDateTimeParser = props.tDateTimeParser,
      MessageDeleted = props.MessageDeleted;

  var _useContext = React.useContext(TranslationContext),
      contextT = _useContext.t;

  var t = propT || contextT;
  var messageWrapperRef = React.useRef(null);
  var reactionSelectorRef = React.useRef(null);
  /**
   *@type {import('../types').ChannelContextValue}
   */

  var _useContext2 = React.useContext(ChannelContext),
      channelUpdateMessage = _useContext2.updateMessage,
      channel = _useContext2.channel;

  var channelConfig = propChannelConfig || (channel === null || channel === void 0 ? void 0 : channel.getConfig());

  var _useMentionsUIHandler = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover
  }),
      onMentionsClick = _useMentionsUIHandler.onMentionsClick,
      onMentionsHover = _useMentionsUIHandler.onMentionsHover;

  var handleAction = useActionHandler(message);
  var handleReaction = useReactionHandler(message);
  var handleOpenThread = useOpenThreadHandler(message);

  var _useEditHandler = useEditHandler(),
      ownEditing = _useEditHandler.editing,
      ownSetEditing = _useEditHandler.setEdit,
      ownClearEditing = _useEditHandler.clearEdit;

  var editing = propEditing || ownEditing;
  var setEdit = propSetEdit || ownSetEditing;
  var clearEdit = propClearEdit || ownClearEditing;
  var handleRetry = useRetryHandler();
  var retryHandler = propHandleRetry || handleRetry;

  var _useReactionClick = useReactionClick(message, reactionSelectorRef, messageWrapperRef),
      onReactionListClick = _useReactionClick.onReactionListClick,
      showDetailedReactions = _useReactionClick.showDetailedReactions;

  var _useUserHandler = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover
  }),
      onUserClick = _useUserHandler.onUserClick,
      onUserHover = _useUserHandler.onUserHover;

  var messageText = React.useMemo(function () {
    return renderText(message === null || message === void 0 ? void 0 : message.text, message === null || message === void 0 ? void 0 : message.mentioned_users);
  }, [message === null || message === void 0 ? void 0 : message.text, message === null || message === void 0 ? void 0 : message.mentioned_users]);
  var hasAttachment = messageHasAttachments(message);
  var galleryImages = getImages(message);
  var attachments = getNonImageAttachments(message);
  var firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if (!message || message.type === 'message.read' || message.type === 'message.date') {
    return null;
  }

  if (message.deleted_at) {
    return smartRender(MessageDeleted, props, null);
  }

  if (editing) {
    var _message$user, _message$user2, _message$user3;

    return /*#__PURE__*/React__default.createElement("div", {
      "data-testid": 'message-livestream-edit',
      className: "str-chat__message-team str-chat__message-team--".concat(firstGroupStyle, " str-chat__message-team--editing")
    }, (firstGroupStyle === 'top' || firstGroupStyle === 'single') && /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__message-team-meta"
    }, /*#__PURE__*/React__default.createElement(Avatar, {
      image: (_message$user = message.user) === null || _message$user === void 0 ? void 0 : _message$user.image,
      name: ((_message$user2 = message.user) === null || _message$user2 === void 0 ? void 0 : _message$user2.name) || ((_message$user3 = message.user) === null || _message$user3 === void 0 ? void 0 : _message$user3.id),
      size: 40,
      onClick: onUserClick,
      onMouseOver: onUserHover
    })), /*#__PURE__*/React__default.createElement(MessageInput$1, {
      Input: EditMessageForm,
      message: message,
      clearEditingState: clearEdit,
      updateMessage: propUpdateMessage || channelUpdateMessage
    }));
  }

  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-livestream",
    className: "str-chat__message-livestream str-chat__message-livestream--".concat(firstGroupStyle, " str-chat__message-livestream--").concat(message.type, " str-chat__message-livestream--").concat(message.status, " ").concat(initialMessage ? 'str-chat__message-livestream--initial-message' : ''),
    ref: messageWrapperRef
  }, showDetailedReactions && /*#__PURE__*/React__default.createElement(ReactionSelector, {
    reverse: false,
    handleReaction: handleReaction,
    detailedView: true,
    latest_reactions: message === null || message === void 0 ? void 0 : message.latest_reactions,
    reaction_counts: message === null || message === void 0 ? void 0 : message.reaction_counts,
    ref: reactionSelectorRef
  }), /*#__PURE__*/React__default.createElement(MessageLivestreamActions, {
    initialMessage: initialMessage,
    message: message,
    formatDate: formatDate,
    onReactionListClick: onReactionListClick,
    messageWrapperRef: messageWrapperRef,
    getMessageActions: props.getMessageActions,
    tDateTimeParser: propTDateTimeParser,
    channelConfig: channelConfig,
    threadList: props.threadList,
    handleOpenThread: propHandleOpenThread || handleOpenThread,
    setEditingState: setEdit
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-livestream-left"
  }, /*#__PURE__*/React__default.createElement(Avatar, {
    image: (_message$user4 = message.user) === null || _message$user4 === void 0 ? void 0 : _message$user4.image,
    name: ((_message$user5 = message.user) === null || _message$user5 === void 0 ? void 0 : _message$user5.name) || (message === null || message === void 0 ? void 0 : (_message$user6 = message.user) === null || _message$user6 === void 0 ? void 0 : _message$user6.id),
    size: 30,
    onClick: onUserClick,
    onMouseOver: onUserHover
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-livestream-right"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-livestream-content"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-livestream-author"
  }, /*#__PURE__*/React__default.createElement("strong", null, ((_message$user7 = message.user) === null || _message$user7 === void 0 ? void 0 : _message$user7.name) || ((_message$user8 = message.user) === null || _message$user8 === void 0 ? void 0 : _message$user8.id)), (message === null || message === void 0 ? void 0 : message.type) === 'error' && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-team-error-header"
  }, t('Only visible to you'))), /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-livestream-text",
    className: isOnlyEmojis(message.text) ? 'str-chat__message-livestream-text--is-emoji' : '',
    onMouseOver: onMentionsHover,
    onClick: onMentionsClick
  }, message.type !== 'error' && message.status !== 'failed' && !unsafeHTML && messageText, message.type !== 'error' && message.status !== 'failed' && unsafeHTML && /*#__PURE__*/React__default.createElement("div", {
    dangerouslySetInnerHTML: {
      __html: message.html
    }
  }), message.type === 'error' && !message.command && /*#__PURE__*/React__default.createElement("p", {
    "data-testid": "message-livestream-error"
  }, /*#__PURE__*/React__default.createElement(ErrorIcon, null), message.text), message.type === 'error' && message.command && /*#__PURE__*/React__default.createElement("p", {
    "data-testid": "message-livestream-command-error"
  }, /*#__PURE__*/React__default.createElement(ErrorIcon, null), /*#__PURE__*/React__default.createElement("strong", null, "/", message.command), " is not a valid command"), message.status === 'failed' && /*#__PURE__*/React__default.createElement("p", {
    onClick: function onClick() {
      if (retryHandler) {
        // FIXME: type checking fails here because in the case of a failed message,
        // `message` is of type Client.Message (i.e. request object)
        // instead of Client.MessageResponse (i.e. server response object)
        // @ts-ignore
        retryHandler(message);
      }
    }
  }, /*#__PURE__*/React__default.createElement(ErrorIcon, null), t('Message failed. Click to try again.'))), hasAttachment && attachments.map(
  /** @type {(item: import('stream-chat').Attachment) => React.ReactElement | null} Typescript syntax */
  function (attachment, index) {
    return /*#__PURE__*/React__default.createElement(Attachment$1, {
      key: "".concat(message === null || message === void 0 ? void 0 : message.id, "-").concat(index),
      attachment: attachment,
      actionHandler: propHandleAction || handleAction
    });
  }), galleryImages.length !== 0 && /*#__PURE__*/React__default.createElement(Gallery$1, {
    images: galleryImages
  }), /*#__PURE__*/React__default.createElement(ReactionsList, {
    reaction_counts: message.reaction_counts,
    reactions: message.latest_reactions,
    handleReaction: propHandleReaction || handleReaction
  }), !initialMessage && /*#__PURE__*/React__default.createElement(MessageRepliesCountButton$1, {
    onClick: propHandleOpenThread || handleOpenThread,
    reply_count: message.reply_count
  })))));
};
/**
 * @type { React.FC<import('../types').MessageLivestreamActionProps> }
 */


var MessageLivestreamActions = function MessageLivestreamActions(props) {
  var initialMessage = props.initialMessage,
      message = props.message,
      channelConfig = props.channelConfig,
      threadList = props.threadList,
      formatDate = props.formatDate,
      messageWrapperRef = props.messageWrapperRef,
      onReactionListClick = props.onReactionListClick,
      getMessageActions = props.getMessageActions,
      handleOpenThread = props.handleOpenThread,
      propTDateTimeParser = props.tDateTimeParser;

  var _useState = React.useState(false),
      _useState2 = _slicedToArray(_useState, 2),
      actionsBoxOpen = _useState2[0],
      setActionsBoxOpen = _useState2[1];
  /** @type {() => void} Typescript syntax */


  var hideOptions = React.useCallback(function () {
    return setActionsBoxOpen(false);
  }, []);
  var messageDeletedAt = !!(message === null || message === void 0 ? void 0 : message.deleted_at);
  var messageWrapper = messageWrapperRef === null || messageWrapperRef === void 0 ? void 0 : messageWrapperRef.current;
  React.useEffect(function () {
    if (messageWrapper) {
      messageWrapper.addEventListener('mouseleave', hideOptions);
    }

    return function () {
      if (messageWrapper) {
        messageWrapper.removeEventListener('mouseleave', hideOptions);
      }
    };
  }, [messageWrapper, hideOptions]);
  React.useEffect(function () {
    if (messageDeletedAt) {
      document.removeEventListener('click', hideOptions);
    }
  }, [messageDeletedAt, hideOptions]);
  React.useEffect(function () {
    if (actionsBoxOpen) {
      document.addEventListener('click', hideOptions);
    } else {
      document.removeEventListener('click', hideOptions);
    }

    return function () {
      document.removeEventListener('click', hideOptions);
    };
  }, [actionsBoxOpen, hideOptions]);

  if (initialMessage || !message || message.type === 'error' || message.type === 'system' || message.type === 'ephemeral' || message.status === 'failed' || message.status === 'sending') {
    return null;
  }

  return /*#__PURE__*/React__default.createElement("div", {
    "data-testid": 'message-livestream-actions',
    className: "str-chat__message-livestream-actions"
  }, /*#__PURE__*/React__default.createElement(MessageTimestamp$1, {
    customClass: "str-chat__message-livestream-time",
    message: message,
    formatDate: formatDate,
    tDateTimeParser: propTDateTimeParser
  }), channelConfig && channelConfig.reactions && /*#__PURE__*/React__default.createElement("span", {
    onClick: onReactionListClick,
    "data-testid": "message-livestream-reactions-action"
  }, /*#__PURE__*/React__default.createElement("span", null, /*#__PURE__*/React__default.createElement(ReactionIcon, null))), !threadList && channelConfig && channelConfig.replies && /*#__PURE__*/React__default.createElement("span", {
    "data-testid": "message-livestream-thread-action",
    onClick: handleOpenThread
  }, /*#__PURE__*/React__default.createElement(ThreadIcon, null)), /*#__PURE__*/React__default.createElement(MessageActions, _extends({}, props, {
    getMessageActions: getMessageActions,
    customWrapperClass: '',
    inline: true
  })));
};

MessageLivestreamComponent.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message:
  /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */
  PropTypes.object.isRequired,

  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  Attachment:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').AttachmentUIComponentProps>>} */
  PropTypes.elementType,

  /**
   *
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   *
   * */
  Message:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageUIComponentProps>>} */
  PropTypes.oneOfType([PropTypes.node, PropTypes.func, PropTypes.object]),

  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,

  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,

  /** Channel config object */
  channelConfig:
  /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */
  PropTypes.object,

  /** If component is in thread list */
  threadList: PropTypes.bool,

  /** Function to open thread on current messxage */
  handleOpenThread: PropTypes.func,

  /** If the message is in edit state */
  editing: PropTypes.bool,

  /** Function to exit edit state */
  clearEditingState: PropTypes.func,

  /** Returns true if message belongs to current user */
  isMyMessage: PropTypes.func,

  /**
   * Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute]
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   * */
  getMessageActions: PropTypes.func.isRequired,

  /**
   * Function to publish updates on message to channel
   *
   * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
   * */
  updateMessage: PropTypes.func,

  /**
   * Reattempt sending a message
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
   */
  handleRetry: PropTypes.func,

  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   */
  handleReaction: PropTypes.func,

  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionSelectorProps>>} */
  PropTypes.elementType,

  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionsListProps>>} */
  PropTypes.elementType,

  /** If actions such as edit, delete, flag, mute are enabled on message */

  /** @deprecated This property is no longer used * */
  actionsEnabled: PropTypes.bool,

  /** DOMRect object for parent MessageList component */
  messageListRect: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    right: PropTypes.number.isRequired,
    bottom: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
    toJSON: PropTypes.func.isRequired
  }),

  /**
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   */
  handleAction: PropTypes.func,

  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   */
  onMentionsHoverMessage: PropTypes.func,

  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
   */
  onMentionsClickMessage: PropTypes.func,

  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   */
  onUserClick: PropTypes.func,

  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   */
  onUserHover: PropTypes.func,

  /**
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageDeletedProps>>} */
  PropTypes.elementType
};
var MessageLivestream = /*#__PURE__*/React__default.memo(MessageLivestreamComponent, areMessagePropsEqual);

// @ts-check
/**
 * MessageTeam - Render component, should be used together with the Message component
 * Implements the look and feel for a team style collaboration environment
 *
 * @example ../../docs/MessageTeam.md
 * @typedef { import('../types').MessageTeamProps } Props
 *
 * @type {React.FC<Props>}
 */
// eslint-disable-next-line sonarjs/cognitive-complexity

var MessageTeam = function MessageTeam(props) {
  var _message$user4, _message$user5, _message$user6, _message$user7, _message$user8;

  var message = props.message,
      threadList = props.threadList,
      formatDate = props.formatDate,
      initialMessage = props.initialMessage,
      unsafeHTML = props.unsafeHTML,
      getMessageActions = props.getMessageActions,
      MessageDeleted = props.MessageDeleted,
      _props$ReactionsList = props.ReactionsList,
      ReactionsList = _props$ReactionsList === void 0 ? DefaultReactionsList$1 : _props$ReactionsList,
      _props$ReactionSelect = props.ReactionSelector,
      ReactionSelector = _props$ReactionSelect === void 0 ? DefaultReactionSelector : _props$ReactionSelect,
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
   *@type {import('../types').ChannelContextValue}
   */

  var _useContext = React.useContext(ChannelContext),
      channel = _useContext.channel,
      channelUpdateMessage = _useContext.updateMessage;

  var channelConfig = propChannelConfig || (channel === null || channel === void 0 ? void 0 : channel.getConfig());

  var _useContext2 = React.useContext(TranslationContext),
      contextT = _useContext2.t;

  var t = propT || contextT;
  var groupStyles = props.groupStyles || ['single'];
  var reactionSelectorRef = React.useRef(null);
  var messageWrapperRef = React.useRef(null);

  var _useEditHandler = useEditHandler(),
      ownEditing = _useEditHandler.editing,
      ownSetEditing = _useEditHandler.setEdit,
      ownClearEditing = _useEditHandler.clearEdit;

  var editing = propEditing || ownEditing;
  var setEdit = propSetEdit || ownSetEditing;
  var clearEdit = propClearEdit || ownClearEditing;
  var handleOpenThread = useOpenThreadHandler(message);
  var handleReaction = useReactionHandler(message);
  var retryHandler = useRetryHandler();
  var retry = propHandleRetry || retryHandler;

  var _useMentionsUIHandler = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover
  }),
      onMentionsClick = _useMentionsUIHandler.onMentionsClick,
      onMentionsHover = _useMentionsUIHandler.onMentionsHover;

  var _useReactionClick = useReactionClick(message, reactionSelectorRef, messageWrapperRef),
      onReactionListClick = _useReactionClick.onReactionListClick,
      showDetailedReactions = _useReactionClick.showDetailedReactions;

  var _useUserHandler = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover
  }),
      onUserClick = _useUserHandler.onUserClick,
      onUserHover = _useUserHandler.onUserHover;

  var messageText = React.useMemo(function () {
    return renderText(message === null || message === void 0 ? void 0 : message.text, message === null || message === void 0 ? void 0 : message.mentioned_users);
  }, [message === null || message === void 0 ? void 0 : message.text, message === null || message === void 0 ? void 0 : message.mentioned_users]);
  var galleryImages = getImages(message);
  var attachments = getNonImageAttachments(message);
  var firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if ((message === null || message === void 0 ? void 0 : message.type) === 'message.read') {
    return null;
  }

  if (message === null || message === void 0 ? void 0 : message.deleted_at) {
    return smartRender(MessageDeleted, props, null);
  }

  if (editing) {
    var _message$user, _message$user2, _message$user3;

    return /*#__PURE__*/React__default.createElement("div", {
      "data-testid": "message-team-edit",
      className: "str-chat__message-team str-chat__message-team--".concat(firstGroupStyle, " str-chat__message-team--editing")
    }, (firstGroupStyle === 'top' || firstGroupStyle === 'single') && /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__message-team-meta"
    }, /*#__PURE__*/React__default.createElement(Avatar, {
      image: message === null || message === void 0 ? void 0 : (_message$user = message.user) === null || _message$user === void 0 ? void 0 : _message$user.image,
      name: (message === null || message === void 0 ? void 0 : (_message$user2 = message.user) === null || _message$user2 === void 0 ? void 0 : _message$user2.name) || (message === null || message === void 0 ? void 0 : (_message$user3 = message.user) === null || _message$user3 === void 0 ? void 0 : _message$user3.id),
      size: 40,
      onClick: onUserClick,
      onMouseOver: onUserHover
    })), /*#__PURE__*/React__default.createElement(MessageInput$1, {
      Input: EditMessageForm,
      message: message,
      clearEditingState: clearEdit,
      updateMessage: propUpdateMessage || channelUpdateMessage
    }));
  }

  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-team",
    className: "str-chat__message-team str-chat__message-team--".concat(firstGroupStyle, " str-chat__message-team--").concat(message === null || message === void 0 ? void 0 : message.type, " ").concat(threadList ? 'thread-list' : '', " str-chat__message-team--").concat(message === null || message === void 0 ? void 0 : message.status),
    ref: messageWrapperRef
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-team-meta"
  }, firstGroupStyle === 'top' || firstGroupStyle === 'single' || initialMessage ? /*#__PURE__*/React__default.createElement(Avatar, {
    image: message === null || message === void 0 ? void 0 : (_message$user4 = message.user) === null || _message$user4 === void 0 ? void 0 : _message$user4.image,
    name: (message === null || message === void 0 ? void 0 : (_message$user5 = message.user) === null || _message$user5 === void 0 ? void 0 : _message$user5.name) || (message === null || message === void 0 ? void 0 : (_message$user6 = message.user) === null || _message$user6 === void 0 ? void 0 : _message$user6.id),
    size: 40,
    onClick: onUserClick,
    onMouseOver: onUserHover
  }) : /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "team-meta-spacer",
    style: {
      width: 40,
      marginRight: 0
    }
  }), /*#__PURE__*/React__default.createElement(MessageTimestamp$1, {
    message: message,
    tDateTimeParser: props.tDateTimeParser,
    formatDate: formatDate
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-team-group"
  }, message && (firstGroupStyle === 'top' || firstGroupStyle === 'single' || initialMessage) && /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-team-author",
    className: "str-chat__message-team-author",
    onClick: onUserClick
  }, /*#__PURE__*/React__default.createElement("strong", null, ((_message$user7 = message.user) === null || _message$user7 === void 0 ? void 0 : _message$user7.name) || ((_message$user8 = message.user) === null || _message$user8 === void 0 ? void 0 : _message$user8.id)), message.type === 'error' && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message-team-error-header"
  }, t('Only visible to you'))), /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-team-content",
    className: "str-chat__message-team-content str-chat__message-team-content--".concat(firstGroupStyle, " str-chat__message-team-content--").concat((message === null || message === void 0 ? void 0 : message.text) === '' ? 'image' : 'text')
  }, !initialMessage && message && message.status !== 'sending' && message.status !== 'failed' && message.type !== 'system' && message.type !== 'ephemeral' && message.type !== 'error' && /*#__PURE__*/React__default.createElement("div", {
    "data-testid": "message-team-actions",
    className: "str-chat__message-team-actions"
  }, message && showDetailedReactions && /*#__PURE__*/React__default.createElement(ReactionSelector, {
    handleReaction: propHandleReaction || handleReaction,
    latest_reactions: message.latest_reactions,
    reaction_counts: message.reaction_counts,
    detailedView: true,
    ref: reactionSelectorRef
  }), channelConfig && channelConfig.reactions && /*#__PURE__*/React__default.createElement("span", {
    "data-testid": "message-team-reaction-icon",
    title: "Reactions",
    onClick: onReactionListClick
  }, /*#__PURE__*/React__default.createElement(ReactionIcon, null)), !threadList && channelConfig && channelConfig.replies && /*#__PURE__*/React__default.createElement("span", {
    "data-testid": "message-team-thread-icon",
    title: "Start a thread",
    onClick: propHandleOpenThread || handleOpenThread
  }, /*#__PURE__*/React__default.createElement(ThreadIcon, null)), message && getMessageActions && getMessageActions().length > 0 && /*#__PURE__*/React__default.createElement(MessageActions, {
    addNotification: props.addNotification,
    message: message,
    getMessageActions: props.getMessageActions,
    messageListRect: props.messageListRect,
    messageWrapperRef: messageWrapperRef,
    setEditingState: setEdit,
    getMuteUserSuccessNotification: props.getMuteUserSuccessNotification,
    getMuteUserErrorNotification: props.getMuteUserErrorNotification,
    getFlagMessageErrorNotification: props.getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification: props.getFlagMessageSuccessNotification,
    handleFlag: props.handleFlag,
    handleMute: props.handleMute,
    handleEdit: props.handleEdit,
    handleDelete: props.handleDelete,
    customWrapperClass: '',
    inline: true
  })), message && /*#__PURE__*/React__default.createElement("span", {
    "data-testid": "message-team-message",
    className: isOnlyEmojis(message.text) ? 'str-chat__message-team-text--is-emoji' : '',
    onMouseOver: onMentionsHover,
    onClick: onMentionsClick
  }, unsafeHTML ? /*#__PURE__*/React__default.createElement("div", {
    dangerouslySetInnerHTML: {
      __html: message.html
    }
  }) : messageText), galleryImages.length !== 0 && /*#__PURE__*/React__default.createElement(Gallery$1, {
    images: galleryImages
  }), message && message.text === '' && /*#__PURE__*/React__default.createElement(MessageTeamAttachments, {
    Attachment: props.Attachment,
    message: message,
    handleAction: propHandleAction
  }), (message === null || message === void 0 ? void 0 : message.latest_reactions) && message.latest_reactions.length !== 0 && message.text !== '' && /*#__PURE__*/React__default.createElement(ReactionsList, {
    reaction_counts: message.reaction_counts,
    handleReaction: propHandleReaction || handleReaction,
    reactions: message.latest_reactions
  }), (message === null || message === void 0 ? void 0 : message.status) === 'failed' && /*#__PURE__*/React__default.createElement("button", {
    "data-testid": "message-team-failed",
    className: "str-chat__message-team-failed",
    onClick: function onClick() {
      if (message.status === 'failed' && retry) {
        // FIXME: type checking fails here because in the case of a failed message,
        // `message` is of type Client.Message (i.e. request object)
        // instead of Client.MessageResponse (i.e. server response object)
        // @ts-ignore
        retry(message);
      }
    }
  }, /*#__PURE__*/React__default.createElement(ErrorIcon, null), t('Message failed. Click to try again.'))), /*#__PURE__*/React__default.createElement(MessageTeamStatus, {
    readBy: props.readBy,
    message: message,
    threadList: threadList,
    lastReceivedId: props.lastReceivedId,
    t: propT
  }), message && message.text !== '' && attachments && /*#__PURE__*/React__default.createElement(MessageTeamAttachments, {
    Attachment: props.Attachment,
    message: message,
    handleAction: propHandleAction
  }), (message === null || message === void 0 ? void 0 : message.latest_reactions) && message.latest_reactions.length !== 0 && message.text === '' && /*#__PURE__*/React__default.createElement(ReactionsList, {
    reaction_counts: message.reaction_counts,
    handleReaction: propHandleReaction || handleReaction,
    reactions: message.latest_reactions
  }), !threadList && message && /*#__PURE__*/React__default.createElement(MessageRepliesCountButton$1, {
    onClick: propHandleOpenThread || handleOpenThread,
    reply_count: message.reply_count
  }))));
};
/** @type {(props: import('../types').MessageTeamStatusProps) => React.ReactElement | null} */


var MessageTeamStatus = function MessageTeamStatus(props) {
  var readBy = props.readBy,
      message = props.message,
      threadList = props.threadList,
      lastReceivedId = props.lastReceivedId,
      propT = props.t;

  var _useContext3 = React.useContext(ChannelContext),
      client = _useContext3.client;

  var _useContext4 = React.useContext(TranslationContext),
      contextT = _useContext4.t;

  var t = propT || contextT;

  var _useUserRole = useUserRole(message),
      isMyMessage = _useUserRole.isMyMessage;

  if (!isMyMessage || (message === null || message === void 0 ? void 0 : message.type) === 'error') {
    return null;
  }

  var justReadByMe = readBy && (client === null || client === void 0 ? void 0 : client.user) && readBy.length === 1 && readBy[0] && readBy[0].id === client.user.id;

  if (message && message.status === 'sending') {
    return /*#__PURE__*/React__default.createElement("span", {
      className: "str-chat__message-team-status",
      "data-testid": "message-team-sending"
    }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t && t('Sending...')), /*#__PURE__*/React__default.createElement(DefaultLoadingIndicator, null));
  }

  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    var lastReadUser = readBy.filter(function (item) {
      return item && (client === null || client === void 0 ? void 0 : client.user) && item.id !== client.user.id;
    })[0];
    return /*#__PURE__*/React__default.createElement("span", {
      className: "str-chat__message-team-status"
    }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, getReadByTooltipText(readBy, t, client)), /*#__PURE__*/React__default.createElement(Avatar, {
      name: lastReadUser && lastReadUser.name ? lastReadUser.name : null,
      image: lastReadUser && lastReadUser.image ? lastReadUser.image : null,
      size: 15
    }), readBy.length - 1 > 1 && /*#__PURE__*/React__default.createElement("span", {
      "data-testid": "message-team-read-by-count",
      className: "str-chat__message-team-status-number"
    }, readBy.length - 1));
  }

  if (message && message.status === 'received' && message.id === lastReceivedId && !threadList) {
    return /*#__PURE__*/React__default.createElement("span", {
      "data-testid": "message-team-received",
      className: "str-chat__message-team-status"
    }, /*#__PURE__*/React__default.createElement(Tooltip$1, null, t && t('Delivered')), /*#__PURE__*/React__default.createElement(DeliveredCheckIcon, null));
  }

  return null;
};
/** @type {(props: import('../types').MessageTeamAttachmentsProps) => React.ReactElement | null} Typescript syntax */


var MessageTeamAttachments = function MessageTeamAttachments(props) {
  var _props$Attachment = props.Attachment,
      Attachment$1 = _props$Attachment === void 0 ? Attachment : _props$Attachment,
      message = props.message,
      propHandleAction = props.handleAction;
  var handleAction = useActionHandler(message);
  var attachments = getNonImageAttachments(message);

  if (attachments.length > 0 && Attachment$1) {
    return /*#__PURE__*/React__default.createElement(React.Fragment, null, attachments.map(
    /** @type {(item: import('stream-chat').Attachment) => React.ReactElement | null} Typescript syntax */
    function (attachment, index) {
      return /*#__PURE__*/React__default.createElement(Attachment$1, {
        key: "".concat(message === null || message === void 0 ? void 0 : message.id, "-").concat(index),
        attachment: attachment,
        actionHandler: propHandleAction || handleAction
      });
    }));
  }

  return null;
};

MessageTeam.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message:
  /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */
  PropTypes.object.isRequired,

  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  Attachment:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').AttachmentUIComponentProps>>} */
  PropTypes.elementType,

  /**
   *
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   * */
  Message:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageUIComponentProps>>} */
  PropTypes.oneOfType([PropTypes.node, PropTypes.func, PropTypes.object]),

  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,

  /** Client object */
  client:
  /** @type {PropTypes.Validator<import('stream-chat').StreamChat>} */
  PropTypes.object,

  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,

  /** Channel config object */
  channelConfig:
  /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */
  PropTypes.object,

  /** If component is in thread list */
  threadList: PropTypes.bool,

  /** Function to open thread on current messxage */
  handleOpenThread: PropTypes.func,

  /** If the message is in edit state */
  editing: PropTypes.bool,

  /** Function to exit edit state */
  clearEditingState: PropTypes.func,

  /** Returns true if message belongs to current user */
  isMyMessage: PropTypes.func,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,

  /**
   * Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute]
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   * */
  getMessageActions:
  /** @type {PropTypes.Validator<() => Array<string>>} */
  PropTypes.func,

  /**
   * Function to publish updates on message to channel
   *
   * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
   * */
  updateMessage: PropTypes.func,

  /**
   * Reattempt sending a message
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
   */
  handleRetry: PropTypes.func,

  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   */
  handleReaction: PropTypes.func,

  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionSelectorProps>>} */
  PropTypes.elementType,

  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ReactionsListProps>>} */
  PropTypes.elementType,

  /** DOMRect object for parent MessageList component */
  messageListRect:
  /** @type {PropTypes.Validator<DOMRect>} */
  PropTypes.object,

  /**
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   */
  handleAction: PropTypes.func,

  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   */
  onMentionsHoverMessage: PropTypes.func,

  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
   */
  onMentionsClickMessage: PropTypes.func,

  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   */
  onUserClick: PropTypes.func,

  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   */
  onUserHover: PropTypes.func,

  /** Position of message in group. Possible values: top, bottom, middle, single */
  groupStyles: PropTypes.array,

  /**
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').MessageDeletedProps>>} */
  PropTypes.elementType
};
var MessageTeam$1 = /*#__PURE__*/React__default.memo(MessageTeam, areMessagePropsEqual);

// @ts-check
/**
 * @typedef {import('stream-chat').UserResponse} UserResponse
 * @typedef {(e: React.MouseEvent, user?: UserResponse) => void} MentionsHandler
 * @param {MentionsHandler=} onMentionsHover
 * @param {MentionsHandler=} onMentionsClick
 */

var useMentionsHandlers = function useMentionsHandlers(onMentionsHover, onMentionsClick) {
  return React.useCallback(
  /** @type {(e: React.MouseEvent<HTMLSpanElement>, mentioned_users: UserResponse[]) => void} */
  function (e, mentioned_users) {
    if (!onMentionsHover && !onMentionsClick) return; // eslint-disable-next-line prefer-destructuring

    var target =
    /** @type {HTMLSpanElement} */
    e.target;
    var tagName = target === null || target === void 0 ? void 0 : target.tagName.toLowerCase();
    var textContent = target === null || target === void 0 ? void 0 : target.innerHTML.replace('*', '');

    if (tagName === 'strong' && textContent[0] === '@') {
      var userName = textContent.replace('@', '');
      var user = mentioned_users.find(function (_ref) {
        var name = _ref.name,
            id = _ref.id;
        return name === userName || id === userName;
      });

      if (onMentionsHover && typeof onMentionsHover === 'function' && e.type === 'mouseover') {
        onMentionsHover(e, user);
      }

      if (onMentionsClick && e.type === 'click' && typeof onMentionsClick === 'function') {
        onMentionsClick(e, user);
      }
    }
  }, [onMentionsClick, onMentionsHover]);
};

// @ts-check
/**
 * @typedef {import('stream-chat').Message} Message
 * @typedef {import('stream-chat').UpdateMessageAPIResponse} UpdateResponse
 * @param {((cid: string, updatedMessage: Message) => Promise<UpdateResponse>) | undefined} doUpdateMessageRequest
 * @returns {(updatedMessage: Message) => Promise<UpdateResponse>}
 */

var useEditMessageHandler = function useEditMessageHandler(doUpdateMessageRequest) {
  var _useContext = React.useContext(ChatContext),
      channel = _useContext.channel,
      client = _useContext.client;

  return function (updatedMessage) {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(doUpdateMessageRequest(channel.cid, updatedMessage));
    }

    return client.updateMessage(updatedMessage);
  };
};

function ownKeys$5(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$5(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$5(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/** @type {import('./types').ChannelStateReducer} */

var channelReducer = function channelReducer(state, action) {
  switch (action.type) {
    case 'initStateFromChannel':
      {
        var channel = action.channel;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          messages: channel.state.messages,
          read: channel.state.read,
          watchers: channel.state.watchers,
          members: channel.state.members,
          watcherCount: channel.state.watcher_count,
          loading: false
        });
      }

    case 'copyStateFromChannelOnEvent':
      {
        var _channel = action.channel;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          messages: _channel.state.messages,
          read: _channel.state.read,
          watchers: _channel.state.watchers,
          typing: _channel.state.typing,
          watcherCount: _channel.state.watcher_count
        });
      }

    case 'setThread':
      {
        var message = action.message;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          thread: message
        });
      }

    case 'loadMoreFinished':
      {
        var hasMore = action.hasMore,
            messages = action.messages;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          loadingMore: false,
          hasMore,
          messages
        });
      }

    case 'setLoadingMore':
      {
        var loadingMore = action.loadingMore;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          loadingMore
        });
      }

    case 'copyMessagesFromChannel':
      {
        var _channel2 = action.channel,
            parentId = action.parentId;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          messages: _channel2.state.messages,
          threadMessages: parentId ? _channel2.state.threads[parentId] || [] : state.threadMessages
        });
      }

    case 'updateThreadOnEvent':
      {
        var _channel3 = action.channel,
            _message = action.message;
        if (!state.thread) return state;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          threadMessages: _channel3.state.threads[state.thread.id],
          thread: (_message === null || _message === void 0 ? void 0 : _message.id) === state.thread.id ? _channel3.state.messageToImmutable(_message) : state.thread
        });
      }

    case 'openThread':
      {
        var _message2 = action.message,
            _channel4 = action.channel;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          thread: _message2,
          threadMessages: _channel4.state.threads[_message2.id] || []
        });
      }

    case 'startLoadingThread':
      {
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          threadLoadingMore: true
        });
      }

    case 'loadMoreThreadFinished':
      {
        var threadHasMore = action.threadHasMore,
            threadMessages = action.threadMessages;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          threadHasMore,
          threadMessages,
          threadLoadingMore: false
        });
      }

    case 'closeThread':
      {
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          thread: null,
          threadMessages: Immutable([]),
          threadLoadingMore: false
        });
      }

    case 'setError':
      {
        var error = action.error;
        return _objectSpread$5(_objectSpread$5({}, state), {}, {
          error
        });
      }

    default:
      return state;
  }
};
/** @type {import('./types').ChannelState} */

var initialState = {
  error: null,
  loading: true,
  loadingMore: false,
  hasMore: true,
  messages: Immutable([]),
  typing: Immutable(
  /** @type {any} infer from ChannelState */
  {}),
  members: Immutable(
  /** @type {any} infer from ChannelState */
  {}),
  watchers: Immutable(
  /** @type {any} infer from ChannelState */
  {}),
  watcherCount: 0,
  read: Immutable(
  /** @type {any} infer from ChannelState */
  {}),
  thread: null,
  threadMessages: Immutable([]),
  threadLoadingMore: false,
  threadHasMore: true
};

function ownKeys$6(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$6(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$6(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/** @type {React.FC<import('../types').ChannelProps>}>} */

var Channel = function Channel(_ref) {
  var _ref$EmptyPlaceholder = _ref.EmptyPlaceholder,
      EmptyPlaceholder = _ref$EmptyPlaceholder === void 0 ? null : _ref$EmptyPlaceholder,
      props = _objectWithoutProperties(_ref, ["EmptyPlaceholder"]);

  var _useContext = React.useContext(ChatContext),
      contextChannel = _useContext.channel;

  var channel = props.channel || contextChannel;

  if (!(channel === null || channel === void 0 ? void 0 : channel.cid)) {
    return EmptyPlaceholder;
  }

  return /*#__PURE__*/React__default.createElement(ChannelInner, _extends({}, props, {
    channel: channel,
    key: channel.cid
  }));
};

Channel.propTypes = {
  /** Which channel to connect to, will initialize the channel if it's not initialized yet */
  channel: PropTypes.instanceOf(streamChat.Channel),

  /**
   * Empty channel UI component. This will be shown on the screen if there is no active channel.
   *
   * Defaults to null which skips rendering the Channel
   *
   * */
  EmptyPlaceholder: PropTypes.element,

  /**
   * Error indicator UI component. This will be shown on the screen if channel query fails.
   *
   * Defaults to and accepts same props as: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react/#loadingerrorindicator)
   *
   * */
  // @ts-ignore elementType
  LoadingErrorIndicator: PropTypes.elementType,

  /**
   * Loading indicator UI component. This will be shown on the screen until the messages are
   * being queried from channelœ. Once the messages are loaded, loading indicator is removed from the screen
   * and replaced with children of the Channel component.
   *
   * Defaults to and accepts same props as: [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingIndicator.js)
   */
  // @ts-ignore elementType
  LoadingIndicator: PropTypes.elementType,

  /**
   * Message UI component to display a message in message list.
   *
   * Available built-in components (also accepts the same props as):
   *
   * 1. [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageSimple.js) (default)
   * 2. [MessageTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageTeam.js)
   * 3. [MessageLivestream](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageLivestream.js)
   * 3. [MessageCommerce](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageCommerce.js)
   *
   * */
  // @ts-ignore elementType
  Message: PropTypes.elementType,

  /**
   * Attachment UI component to display attachment in individual message.
   *
   * Defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  // @ts-ignore elementType
  Attachment: PropTypes.elementType,

  /**
   * Handle for click on @mention in message
   *
   * @param {Event} event DOM Click event
   * @param {User} user   Target [user object](https://getstream.io/chat/docs/#chat-doc-set-user) which is clicked
   */
  onMentionsClick: PropTypes.func,

  /**
   * Handle for hover on @mention in message
   *
   * @param {Event} event DOM hover event
   * @param {User} user   Target [user object](https://getstream.io/chat/docs/#chat-doc-set-user) which is hovered
   */
  onMentionsHover: PropTypes.func,

  /** Weather to allow multiple attachment uploads */
  multipleUploads: PropTypes.bool,

  /** List of accepted file types */
  acceptedFiles: PropTypes.array,

  /** Maximum number of attachments allowed per message */
  maxNumberOfFiles: PropTypes.number,

  /** Override send message request (Advanced usage only)
   *
   * @param {String} channelId full channel ID in format of `type:id`
   * @param {Object} message
   */
  doSendMessageRequest: PropTypes.func,

  /**
   * Override mark channel read request (Advanced usage only)
   *
   * @param {Channel} channel object
   * */
  doMarkReadRequest: PropTypes.func,

  /** Override update(edit) message request (Advanced usage only)
   *
   * @param {String} channelId full channel ID in format of `type:id`
   * @param {Object} updatedMessage
   */
  doUpdateMessageRequest: PropTypes.func
};
/** @type {React.FC<import('../types').ChannelProps & { channel: import('stream-chat').Channel }>} */

var ChannelInner = function ChannelInner(_ref2) {
  var _props$channel;

  var _ref2$LoadingIndicato = _ref2.LoadingIndicator,
      LoadingIndicator = _ref2$LoadingIndicato === void 0 ? DefaultLoadingIndicator : _ref2$LoadingIndicato,
      _ref2$LoadingErrorInd = _ref2.LoadingErrorIndicator,
      LoadingErrorIndicator = _ref2$LoadingErrorInd === void 0 ? LoadingErrorIndicatorComponent : _ref2$LoadingErrorInd,
      _ref2$Attachment = _ref2.Attachment,
      Attachment$1 = _ref2$Attachment === void 0 ? Attachment : _ref2$Attachment,
      _ref2$Message = _ref2.Message,
      Message = _ref2$Message === void 0 ? MessageSimple$1 : _ref2$Message,
      doMarkReadRequest = _ref2.doMarkReadRequest,
      props = _objectWithoutProperties(_ref2, ["LoadingIndicator", "LoadingErrorIndicator", "Attachment", "Message", "doMarkReadRequest"]);

  var channel = props.channel;

  var _useReducer = React.useReducer(channelReducer, initialState),
      _useReducer2 = _slicedToArray(_useReducer, 2),
      state = _useReducer2[0],
      dispatch = _useReducer2[1];

  var originalTitle = React.useRef('');
  var lastRead = React.useRef(new Date());
  var chatContext = React.useContext(ChatContext);

  var _useContext2 = React.useContext(TranslationContext),
      t = _useContext2.t; // eslint-disable-next-line react-hooks/exhaustive-deps


  var throttledCopyStateFromChannel = React.useCallback(throttle(function () {
    dispatch({
      type: 'copyStateFromChannelOnEvent',
      channel
    });
  }, 500, {
    leading: true,
    trailing: true
  }), [channel]);
  var markRead = React.useCallback(function () {
    if (channel.disconnected || !channel.getConfig().read_events) {
      return;
    }

    lastRead.current = new Date();

    if (doMarkReadRequest) {
      doMarkReadRequest(channel);
    } else {
      streamChat.logChatPromiseExecution(channel.markRead(), 'mark read');
    }

    if (originalTitle.current) {
      document.title = originalTitle.current;
    }
  }, [channel, doMarkReadRequest]); // eslint-disable-next-line react-hooks/exhaustive-deps

  var markReadThrottled = React.useCallback(throttle(markRead, 500, {
    leading: true,
    trailing: true
  }), [markRead]);
  var handleEvent = React.useCallback(function (e) {
    dispatch({
      type: 'updateThreadOnEvent',
      message: e.message,
      channel
    });

    if (e.type === 'message.new') {
      var mainChannelUpdated = true;

      if (e.message.parent_id && !e.message.show_in_channel) {
        mainChannelUpdated = false;
      }

      if (mainChannelUpdated && e.message.user.id !== chatContext.client.userID) {
        if (!document.hidden) {
          markReadThrottled();
        } else if (channel.getConfig().read_events) {
          var unread = channel.countUnread(lastRead.current);
          document.title = "(".concat(unread, ") ").concat(originalTitle.current);
        }
      }
    }

    throttledCopyStateFromChannel();
  }, [channel, throttledCopyStateFromChannel, chatContext.client.userID, markReadThrottled]); // useLayoutEffect here to prevent spinner. Use Suspense when it is available in stable release

  React.useLayoutEffect(function () {
    var errored = false;
    var done = false;

    var onVisibilityChange = function onVisibilityChange() {
      if (!document.hidden) {
        markRead();
      }
    };

    _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (channel.initialized) {
                _context.next = 10;
                break;
              }

              _context.prev = 1;
              _context.next = 4;
              return channel.watch();

            case 4:
              _context.next = 10;
              break;

            case 6:
              _context.prev = 6;
              _context.t0 = _context["catch"](1);
              dispatch({
                type: 'setError',
                error: _context.t0
              });
              errored = true;

            case 10:
              done = true;
              originalTitle.current = document.title;

              if (!errored) {
                dispatch({
                  type: 'initStateFromChannel',
                  channel
                });
                if (channel.countUnread() > 0) markRead(); // The more complex sync logic is done in chat.js
                // listen to client.connection.recovered and all channel events

                document.addEventListener('visibilitychange', onVisibilityChange);
                chatContext.client.on('connection.recovered', handleEvent);
                channel.on(handleEvent);
              }

            case 13:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[1, 6]]);
    }))();

    return function () {
      if (errored || !done) return;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      channel.off(handleEvent);
      chatContext.client.off('connection.recovered', handleEvent);
    };
  }, [channel, chatContext.client, handleEvent, markRead, props.channel]);
  React.useEffect(function () {
    if (state.thread) {
      for (var i = state.messages.length - 1; i >= 0; i -= 1) {
        if (state.messages[i].id === state.thread.id) {
          dispatch({
            type: 'setThread',
            message: state.messages[i]
          });
          break;
        }
      }
    }
  }, [state.messages, state.thread]); // Message
  // eslint-disable-next-line react-hooks/exhaustive-deps

  var loadMoreFinished = React.useCallback(debounce(
  /**
   * @param {boolean} hasMore
   * @param {import('seamless-immutable').ImmutableArray<import('stream-chat').MessageResponse>} messages
   */
  function (hasMore, messages) {
    dispatch({
      type: 'loadMoreFinished',
      hasMore,
      messages
    });
  }, 2000, {
    leading: true,
    trailing: true
  }), []);
  var loadMore = React.useCallback( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
    var limit,
        oldestMessage,
        oldestID,
        perPage,
        queryResponse,
        hasMoreMessages,
        _args2 = arguments;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            limit = _args2.length > 0 && _args2[0] !== undefined ? _args2[0] : 100;
            // prevent duplicate loading events...
            oldestMessage = state.messages[0];

            if (!(state.loadingMore || (oldestMessage === null || oldestMessage === void 0 ? void 0 : oldestMessage.status) !== 'received')) {
              _context2.next = 4;
              break;
            }

            return _context2.abrupt("return", 0);

          case 4:
            dispatch({
              type: 'setLoadingMore',
              loadingMore: true
            });
            oldestID = (oldestMessage === null || oldestMessage === void 0 ? void 0 : oldestMessage.id) || null;
            perPage = limit;
            _context2.prev = 7;
            _context2.next = 10;
            return channel.query({
              messages: {
                limit: perPage,
                id_lt: oldestID
              }
            });

          case 10:
            queryResponse = _context2.sent;
            _context2.next = 18;
            break;

          case 13:
            _context2.prev = 13;
            _context2.t0 = _context2["catch"](7);
            console.warn('message pagination request failed with error', _context2.t0);
            dispatch({
              type: 'setLoadingMore',
              loadingMore: false
            });
            return _context2.abrupt("return", 0);

          case 18:
            hasMoreMessages = queryResponse.messages.length === perPage;
            loadMoreFinished(hasMoreMessages, channel.state.messages);
            return _context2.abrupt("return", queryResponse.messages.length);

          case 21:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[7, 13]]);
  })), [channel, loadMoreFinished, state.loadingMore, state.messages]);
  var updateMessage = React.useCallback(function (updatedMessage) {
    // adds the message to the local channel state..
    // this adds to both the main channel state as well as any reply threads
    channel.state.addMessageSorted(updatedMessage);
    dispatch({
      type: 'copyMessagesFromChannel',
      parentId: state.thread && updatedMessage.parent_id,
      channel
    });
  }, [channel, state.thread]);
  var doSendMessageRequest = props.doSendMessageRequest;
  var doSendMessage = React.useCallback( /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(message) {
      var text, attachments, id, parent_id, mentioned_users, messageData, messageResponse;
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              text = message.text, attachments = message.attachments, id = message.id, parent_id = message.parent_id, mentioned_users = message.mentioned_users;
              messageData = {
                text,
                attachments,
                mentioned_users,
                id,
                parent_id
              };
              _context3.prev = 2;

              if (!doSendMessageRequest) {
                _context3.next = 9;
                break;
              }

              _context3.next = 6;
              return doSendMessageRequest(channel.cid, messageData);

            case 6:
              messageResponse = _context3.sent;
              _context3.next = 12;
              break;

            case 9:
              _context3.next = 11;
              return channel.sendMessage(messageData);

            case 11:
              messageResponse = _context3.sent;

            case 12:
              // replace it after send is completed
              if (messageResponse && messageResponse.message) {
                updateMessage(_objectSpread$6(_objectSpread$6({}, messageResponse.message), {}, {
                  status: 'received'
                }));
              }

              _context3.next = 18;
              break;

            case 15:
              _context3.prev = 15;
              _context3.t0 = _context3["catch"](2);
              // set the message to failed..
              updateMessage(_objectSpread$6(_objectSpread$6({}, message), {}, {
                status: 'failed'
              }));

            case 18:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, null, [[2, 15]]);
    }));

    return function (_x) {
      return _ref5.apply(this, arguments);
    };
  }(), [channel, doSendMessageRequest, updateMessage]);
  var createMessagePreview = React.useCallback(function (text, attachments, parent, mentioned_users) {
    // create a preview of the message
    var clientSideID = "".concat(chatContext.client.userID, "-").concat(uuid.v4());
    return _objectSpread$6({
      text,
      html: text,
      __html: text,
      id: clientSideID,
      type: 'regular',
      status: 'sending',
      user: chatContext.client.user,
      created_at: new Date(),
      attachments,
      mentioned_users,
      reactions: []
    }, (parent === null || parent === void 0 ? void 0 : parent.id) ? {
      parent_id: parent.id
    } : null);
  }, [chatContext.client.user, chatContext.client.userID]);
  var sendMessage = React.useCallback( /*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(_ref6) {
      var text, _ref6$attachments, attachments, _ref6$mentioned_users, mentioned_users, parent, messagePreview;

      return _regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              text = _ref6.text, _ref6$attachments = _ref6.attachments, attachments = _ref6$attachments === void 0 ? [] : _ref6$attachments, _ref6$mentioned_users = _ref6.mentioned_users, mentioned_users = _ref6$mentioned_users === void 0 ? [] : _ref6$mentioned_users, parent = _ref6.parent;
              // remove error messages upon submit
              channel.state.filterErrorMessages(); // create a local preview message to show in the UI

              messagePreview = createMessagePreview(text, attachments, parent, mentioned_users); // first we add the message to the UI

              updateMessage(messagePreview);
              _context4.next = 6;
              return doSendMessage(messagePreview);

            case 6:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4);
    }));

    return function (_x2) {
      return _ref7.apply(this, arguments);
    };
  }(), [channel.state, createMessagePreview, doSendMessage, updateMessage]);
  var retrySendMessage = React.useCallback( /*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(message) {
      return _regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              // set the message status to sending
              updateMessage(_objectSpread$6(_objectSpread$6({}, message), {}, {
                status: 'sending'
              })); // actually try to send the message...

              _context5.next = 3;
              return doSendMessage(message);

            case 3:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5);
    }));

    return function (_x3) {
      return _ref8.apply(this, arguments);
    };
  }(), [doSendMessage, updateMessage]);
  var removeMessage = React.useCallback(function (message) {
    channel.state.removeMessage(message);
    dispatch({
      type: 'copyMessagesFromChannel',
      parentId: state.thread && message.parent_id,
      channel
    });
  }, [channel, state.thread]); // Thread

  var openThread = React.useCallback(function (message, e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    dispatch({
      type: 'openThread',
      message,
      channel
    });
  }, [channel]); // eslint-disable-next-line react-hooks/exhaustive-deps

  var loadMoreThreadFinished = React.useCallback(debounce(
  /**
   * @param {boolean} threadHasMore
   * @param {import('seamless-immutable').ImmutableArray<import('stream-chat').MessageResponse>} threadMessages
   */
  function (threadHasMore, threadMessages) {
    dispatch({
      type: 'loadMoreThreadFinished',
      threadHasMore,
      threadMessages
    });
  }, 2000, {
    leading: true,
    trailing: true
  }), []);
  var loadMoreThread = React.useCallback( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6() {
    var parentID, oldMessages, oldestMessageID, limit, queryResponse, threadHasMoreMessages, newThreadMessages;
    return _regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            if (!(state.threadLoadingMore || !state.thread)) {
              _context6.next = 2;
              break;
            }

            return _context6.abrupt("return");

          case 2:
            dispatch({
              type: 'startLoadingThread'
            });
            parentID = state.thread.id;
            oldMessages = channel.state.threads[parentID] || [];
            oldestMessageID = oldMessages[0] ? oldMessages[0].id : null;
            limit = 50;
            _context6.next = 9;
            return channel.getReplies(parentID, {
              limit,
              id_lt: oldestMessageID
            });

          case 9:
            queryResponse = _context6.sent;
            threadHasMoreMessages = queryResponse.messages.length === limit;
            newThreadMessages = channel.state.threads[parentID] || []; // next set loadingMore to false so we can start asking for more data...

            loadMoreThreadFinished(threadHasMoreMessages, newThreadMessages);

          case 13:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  })), [channel, loadMoreThreadFinished, state.thread, state.threadLoadingMore]);
  var closeThread = React.useCallback(function (e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    dispatch({
      type: 'closeThread'
    });
  }, []);
  var onMentionsHoverOrClick = useMentionsHandlers(props.onMentionsHover, props.onMentionsClick);
  var editMessage = useEditMessageHandler(props.doUpdateMessageRequest);

  var channelContextValue = _objectSpread$6(_objectSpread$6({}, state), {}, {
    watcher_count: state.watcherCount,
    // props
    channel,
    Message,
    Attachment: Attachment$1,
    multipleUploads: props.multipleUploads,
    acceptedFiles: props.acceptedFiles,
    maxNumberOfFiles: props.maxNumberOfFiles,
    mutes: chatContext.mutes,
    // handlers
    loadMore,
    editMessage,
    updateMessage,
    sendMessage,
    retrySendMessage,
    removeMessage,
    openThread,
    loadMoreThread,
    closeThread,
    onMentionsClick: onMentionsHoverOrClick,
    onMentionsHover: onMentionsHoverOrClick,
    // from chatContext, for legacy reasons
    client: chatContext.client
  });

  var core;

  if (state.error) {
    core = /*#__PURE__*/React__default.createElement(LoadingErrorIndicator, {
      error: state.error
    });
  } else if (state.loading) {
    core = /*#__PURE__*/React__default.createElement(LoadingIndicator, {
      size: 25
    });
  } else if (!((_props$channel = props.channel) === null || _props$channel === void 0 ? void 0 : _props$channel.watch)) {
    core = /*#__PURE__*/React__default.createElement("div", null, t('Channel Missing'));
  } else {
    core = /*#__PURE__*/React__default.createElement(ChannelContext.Provider, {
      value: channelContextValue
    }, /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__container"
    }, props.children));
  }

  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat str-chat-channel ".concat(chatContext.theme)
  }, core);
};

var Channel$1 = /*#__PURE__*/React__default.memo(Channel);

// @ts-check
/**
 * ChannelHeader - Render some basic information about this channel
 * @example ../../docs/ChannelHeader.md
 * @type {React.FC<import('../types').ChannelHeaderProps>}
 */

var ChannelHeader = function ChannelHeader(_ref) {
  var title = _ref.title,
      live = _ref.live;

  /** @type {import("types").TranslationContextValue} */
  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;
  /** @type {import("types").ChannelContextValue} */


  var _useContext2 = React.useContext(ChannelContext),
      channel = _useContext2.channel,
      watcher_count = _useContext2.watcher_count;

  var _useContext3 = React.useContext(ChatContext),
      openMobileNav = _useContext3.openMobileNav;

  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__header-livestream"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__header-hamburger",
    onClick: openMobileNav
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__header-hamburger--line"
  }), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__header-hamburger--line"
  }), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__header-hamburger--line"
  })), channel && channel.data.image && /*#__PURE__*/React__default.createElement(Avatar, {
    image: channel.data.image,
    shape: "rounded",
    size: channel.type === 'commerce' ? 60 : 40
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__header-livestream-left"
  }, /*#__PURE__*/React__default.createElement("p", {
    className: "str-chat__header-livestream-left--title"
  }, title || channel && channel.data.name, ' ', live && /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__header-livestream-left--livelabel"
  }, t('live'))), channel && channel.data.subtitle && /*#__PURE__*/React__default.createElement("p", {
    className: "str-chat__header-livestream-left--subtitle"
  }, channel.data.subtitle), /*#__PURE__*/React__default.createElement("p", {
    className: "str-chat__header-livestream-left--members"
  }, !live && channel && channel.data.member_count && channel.data.member_count > 0 && /*#__PURE__*/React__default.createElement(React__default.Fragment, null, t('{{ memberCount }} members', {
    memberCount: channel.data.member_count
  }), ",", ' '), t('{{ watcherCount }} online', {
    watcherCount: watcher_count
  }))));
};

ChannelHeader.propTypes = {
  /** Set title manually */
  title: PropTypes.string,

  /** Show a little indicator that the channel is live right now */
  live: PropTypes.bool
};
var ChannelHeader$1 = /*#__PURE__*/React__default.memo(ChannelHeader);

var placeholder = "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22UTF-8%22%3F%3E%3Csvg%20width%3D%2278px%22%20height%3D%2278px%22%20viewBox%3D%220%200%2078%2078%22%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%3E%20%20%20%20%20%20%20%20%3Ctitle%3ECombined%20Shape%3C%2Ftitle%3E%20%20%20%20%3Cdesc%3ECreated%20with%20Sketch.%3C%2Fdesc%3E%20%20%20%20%3Cg%20id%3D%22Interactions%22%20stroke%3D%22none%22%20stroke-width%3D%221%22%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%20%20%20%20%20%20%20%20%3Cg%20id%3D%22Connection-Error-_-Connectivity%22%20transform%3D%22translate%28-270.000000%2C%20-30.000000%29%22%20fill%3D%22%23CF1F25%22%3E%20%20%20%20%20%20%20%20%20%20%20%20%3Cg%20id%3D%22109-network-connection%22%20transform%3D%22translate%28270.000000%2C%2030.000000%29%22%3E%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Cpath%20d%3D%22M66.4609744%2C11.414231%20C81.6225232%2C26.5757798%2081.6225232%2C51.157545%2066.4609744%2C66.3188467%20C51.2994256%2C81.4803954%2026.7176604%2C81.4803954%2011.5563587%2C66.3188467%20C-3.60519004%2C51.1572979%20-3.60519004%2C26.5755327%2011.5563587%2C11.414231%20C26.7179075%2C-3.74731776%2051.2996727%2C-3.74731776%2066.4609744%2C11.414231%20Z%20M54.7853215%2C45.8823776%20L54.7853215%2C40.5882574%20C54.7853215%2C39.613638%2053.9952341%2C38.8235506%2053.0206147%2C38.8235506%20L44.9576695%2C38.8235506%20L41.428256%2C42.3529641%20L51.255555%2C42.3529641%20L51.255555%2C45.8823776%20L54.7853215%2C45.8823776%20Z%20M40.6659027%2C43.1153174%20L37.8988425%2C45.8823776%20L40.6659027%2C45.8823776%20L40.6659027%2C43.1153174%20Z%20M51.1764962%2C56.4702653%20L58.2353232%2C56.4702653%20C59.2099355%2C56.4702653%2060.00003%2C55.6801708%2060.00003%2C54.7055585%20L60.00003%2C51.176145%20C60.00003%2C50.2015327%2059.2099355%2C49.4114382%2058.2353232%2C49.4114382%20L51.1764962%2C49.4114382%20C50.2018839%2C49.4114382%2049.4117894%2C50.2015327%2049.4117894%2C51.176145%20L49.4117894%2C54.7055585%20C49.4117894%2C55.6801708%2050.2018839%2C56.4702653%2051.1764962%2C56.4702653%20Z%20M35.2941353%2C56.4702653%20L42.3529624%2C56.4702653%20C43.3275746%2C56.4702653%2044.1176691%2C55.6801708%2044.1176691%2C54.7055585%20L44.1176691%2C51.176145%20C44.1176691%2C50.2015327%2043.3275746%2C49.4114382%2042.3529624%2C49.4114382%20L35.2941353%2C49.4114382%20C34.319523%2C49.4114382%2033.5294285%2C50.2015327%2033.5294285%2C51.176145%20L33.5294285%2C54.7055585%20C33.5294285%2C55.6801708%2034.319523%2C56.4702653%2035.2941353%2C56.4702653%20Z%20M56.6964989%2C19.0874231%20C56.007381%2C18.3985134%2054.8903216%2C18.3985134%2054.2012036%2C19.087423%20L45.882376%2C27.4062507%20L45.882376%2C19.4117761%20C45.882376%2C18.4371568%2045.0922885%2C17.6470693%2044.1176692%2C17.6470693%20L33.5294286%2C17.6470693%20C32.5548092%2C17.6470694%2031.7647218%2C18.4371568%2031.7647218%2C19.4117761%20L31.7647218%2C30.0000167%20C31.7647219%2C30.9746363%2032.5548092%2C31.7647237%2033.5294285%2C31.7647237%20L41.5239031%2C31.7647237%20L34.4650761%2C38.8235508%20L24.7058947%2C38.8235508%20C23.7312753%2C38.8235508%2022.9411879%2C39.6136382%2022.9411879%2C40.5882575%20L22.9411879%2C45.8823778%20L26.4706014%2C45.8823778%20L26.4706014%2C42.3529643%20L30.9356624%2C42.3529643%20L23.8768354%2C49.4117914%20L19.4117743%2C49.4117914%20C18.4371549%2C49.4117914%2017.6470675%2C50.2018788%2017.6470675%2C51.1764981%20L17.6470675%2C54.7059117%20C17.6504049%2C54.9674302%2017.7129076%2C55.2248042%2017.8298886%2C55.4587302%20L16.4456526%2C56.8429662%20C15.7446193%2C57.5200453%2015.7252005%2C58.6372282%2016.4022825%2C59.3382615%20C17.0793616%2C60.0392948%2018.1965445%2C60.0587136%2018.8975778%2C59.3816316%20C18.9122847%2C59.3674273%2018.9267436%2C59.3529684%2018.940948%2C59.3382615%20L56.6964963%2C21.5830662%20C57.3856425%2C20.8939094%2057.3856425%2C19.7765747%2056.6964963%2C19.0874179%20Z%22%20id%3D%22Combined-Shape%22%3E%3C%2Fpath%3E%20%20%20%20%20%20%20%20%20%20%20%20%3C%2Fg%3E%20%20%20%20%20%20%20%20%3C%2Fg%3E%20%20%20%20%3C%2Fg%3E%3C%2Fsvg%3E";

// @ts-check
/**
 * ChatDown - Indicator that chat is down or your network isn't working
 * @example ../../docs/ChatDown.md
 * @typedef {import('../types').ChatDownProps} Props
 * @type {React.FC<Props>}
 */

var ChatDown = function ChatDown(_ref) {
  var image = _ref.image,
      _ref$type = _ref.type,
      type = _ref$type === void 0 ? 'Error' : _ref$type,
      text = _ref.text;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__down"
  }, /*#__PURE__*/React__default.createElement(LoadingChannels$1, null), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__down-main"
  }, /*#__PURE__*/React__default.createElement("img", {
    "data-testid": "chatdown-img",
    src: image || placeholder
  }), /*#__PURE__*/React__default.createElement("h1", null, type), /*#__PURE__*/React__default.createElement("h3", null, text || t('Error connecting to chat, refresh the page to try again.'))));
};

ChatDown.propTypes = {
  /** The image url for this error */
  image: PropTypes.string,

  /** The type of error */
  type: PropTypes.string.isRequired,

  /** The error message to show */
  text: PropTypes.string
};
var ChatDown$1 = /*#__PURE__*/React__default.memo(ChatDown);

var chevrondown = "data:image/svg+xml,%3Csvg%20width%3D%228%22%20height%3D%225%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%3E%3Cdefs%3E%3Cpath%20id%3D%22b%22%20d%3D%22M.667.667L4%204%207.333.667z%22%2F%3E%3Cfilter%20x%3D%22-7.5%25%22%20y%3D%22-15%25%22%20width%3D%22115%25%22%20height%3D%22160%25%22%20filterUnits%3D%22objectBoundingBox%22%20id%3D%22a%22%3E%3CfeOffset%20dy%3D%221%22%20in%3D%22SourceAlpha%22%20result%3D%22shadowOffsetOuter1%22%2F%3E%3CfeComposite%20in%3D%22shadowOffsetOuter1%22%20in2%3D%22SourceAlpha%22%20operator%3D%22out%22%20result%3D%22shadowOffsetOuter1%22%2F%3E%3CfeColorMatrix%20values%3D%220%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200.685858243%200%22%20in%3D%22shadowOffsetOuter1%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cuse%20fill%3D%22%23000%22%20filter%3D%22url%28%23a%29%22%20xlink%3Ahref%3D%22%23b%22%2F%3E%3Cuse%20fill-opacity%3D%22.7%22%20fill%3D%22%23FFF%22%20xlink%3Ahref%3D%22%23b%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

// @ts-check
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 * @type React.FC<import('../types').ChannelListUIComponentProps>
 */

var ChannelListTeam = function ChannelListTeam(_ref) {
  var _ref$error = _ref.error,
      error = _ref$error === void 0 ? false : _ref$error,
      loading = _ref.loading,
      sidebarImage = _ref.sidebarImage,
      showSidebar = _ref.showSidebar,
      _ref$LoadingErrorIndi = _ref.LoadingErrorIndicator,
      LoadingErrorIndicator = _ref$LoadingErrorIndi === void 0 ? ChatDown$1 : _ref$LoadingErrorIndi,
      _ref$LoadingIndicator = _ref.LoadingIndicator,
      LoadingIndicator = _ref$LoadingIndicator === void 0 ? LoadingChannels$1 : _ref$LoadingIndicator,
      children = _ref.children;

  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  if (error) {
    return /*#__PURE__*/React__default.createElement(LoadingErrorIndicator, {
      type: "Connection Error"
    });
  }

  if (loading) {
    return /*#__PURE__*/React__default.createElement(LoadingIndicator, null);
  }

  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team"
  }, showSidebar && /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team__sidebar"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team__sidebar--top"
  }, /*#__PURE__*/React__default.createElement(Avatar, {
    image: sidebarImage,
    size: 50
  }))), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team__main"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team__header"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team__header--left"
  }, /*#__PURE__*/React__default.createElement(Avatar, {
    image: client.user.image,
    name: client.user.name || client.user.id,
    size: 40
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team__header--middle"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team__header--title"
  }, client.user.name || client.user.id), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team__header--status ".concat(client.user.status)
  }, client.user.status)), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-team__header--right"
  }, /*#__PURE__*/React__default.createElement("button", {
    className: "str-chat__channel-list-team__header--button"
  }, /*#__PURE__*/React__default.createElement("img", {
    src: chevrondown
  })))), children));
};

ChannelListTeam.propTypes = {
  /** When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js) */
  loading: PropTypes.bool,

  /** When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js) */
  error: PropTypes.bool,

  /** When true, sidebar containing logo of the team is visible */
  showSidebar: PropTypes.bool,

  /** Url for sidebar logo image. */
  sidebarImage: PropTypes.string,

  /**
   * Loading indicator UI Component. It will be displayed if `loading` prop is true.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').LoadingIndicatorProps>>} */
  PropTypes.elementType,

  /**
   * Error indicator UI Component. It will be displayed if `error` prop is true
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ChatDownProps>>} */
  PropTypes.elementType
};

// @ts-check
/**
 * @type {React.FC<import('../types').LoadMoreButtonProps>}
 */

var LoadMoreButton = function LoadMoreButton(_ref) {
  var onClick = _ref.onClick,
      refreshing = _ref.refreshing,
      _ref$children = _ref.children,
      children = _ref$children === void 0 ? 'Load more' : _ref$children;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__load-more-button"
  }, /*#__PURE__*/React__default.createElement("button", {
    className: "str-chat__load-more-button__button",
    onClick: onClick,
    "data-testid": "load-more-button",
    disabled: refreshing
  }, refreshing ? /*#__PURE__*/React__default.createElement(reactFileUtils.LoadingIndicator, null) : children));
};

LoadMoreButton.propTypes = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: PropTypes.func.isRequired,

  /** If true, LoadingIndicator is displayed instead of button */
  refreshing: PropTypes.bool.isRequired
};
var DefaultLoadMoreButton = /*#__PURE__*/React__default.memo(LoadMoreButton);

var LoadMorePaginator = function LoadMorePaginator(_ref) {
  var reverse = _ref.reverse,
      hasNextPage = _ref.hasNextPage,
      refreshing = _ref.refreshing,
      loadNextPage = _ref.loadNextPage,
      LoadMoreButton = _ref.LoadMoreButton,
      children = _ref.children;
  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, !reverse && children, hasNextPage && smartRender(LoadMoreButton, {
    refreshing,
    onClick: loadNextPage
  }), reverse && children);
};

LoadMorePaginator.defaultProps = {
  LoadMoreButton: DefaultLoadMoreButton
};
LoadMorePaginator.propTypes = {
  LoadMoreButton: PropTypes.oneOfType([PropTypes.node, PropTypes.func, PropTypes.object]),

  /** callback to load the next page */
  loadNextPage: PropTypes.func,

  /** indicates if there is a next page to load */
  hasNextPage: PropTypes.bool,

  /** display the items in opposite order */
  reverse: PropTypes.bool
};
var LoadMorePaginator$1 = /*#__PURE__*/React__default.memo(LoadMorePaginator);

// @ts-check
/**
 * @type {React.FC<import('../types').EmptyStateIndicatorProps>} param0
 */

var EmptyStateIndicator = function EmptyStateIndicator(_ref) {
  var listType = _ref.listType;

  var _useContext = React.useContext(TranslationContext),
      t = _useContext.t;

  if (listType === 'channel') return /*#__PURE__*/React__default.createElement("p", null, t('You have no channels currently'));
  if (listType === 'message') return null;
  return /*#__PURE__*/React__default.createElement("p", null, "No items exist");
};

EmptyStateIndicator.propTypes = {
  /** channel | message */
  listType: PropTypes.string.isRequired
};
var EmptyStateIndicator$1 = /*#__PURE__*/React__default.memo(EmptyStateIndicator);

// @ts-check

/**
 * @param {string} cid
 * @param {import('stream-chat').Channel[]} channels
 */
var moveChannelUp = function moveChannelUp(cid, channels) {
  // get channel index
  var channelIndex = channels.findIndex(function (channel) {
    return channel.cid === cid;
  });
  if (channelIndex <= 0) return channels; // get channel from channels

  var channel = channels[channelIndex]; // remove channel from current position

  channels.splice(channelIndex, 1); // add channel at the start

  channels.unshift(channel);
  return _toConsumableArray(channels);
};
/**
 * @param {import('stream-chat').StreamChat} client
 * @param {string} type
 * @param {string} [id]
 */

var getChannel = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(client, type, id) {
    var channel;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            channel = client.channel(type, id);
            _context.next = 3;
            return channel.watch();

          case 3:
            return _context.abrupt("return", channel);

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function getChannel(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();
var MAX_QUERY_CHANNELS_LIMIT = 30;

// @ts-check
/**
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {boolean} [lockChannelOrder]
 */

var useMessageNewListener = function useMessageNewListener(setChannels) {
  var lockChannelOrder = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = function handleEvent(e) {
      setChannels(function (channels) {
        if (!lockChannelOrder) return moveChannelUp(e.cid, channels);
        return channels;
      });
    };

    client.on('message.new', handleEvent);
    return function () {
      client.off('message.new', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockChannelOrder]);
};

/**
 * @typedef {import('stream-chat').Event<string>} NotificationAddedToChannelEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: NotificationAddedToChannelEvent) => void} [customHandler]
 */

var useNotificationMessageNewListener = function useNotificationMessageNewListener(setChannels, customHandler) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(e) {
        var _e$channel;

        var channel;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(customHandler && typeof customHandler === 'function')) {
                  _context.next = 4;
                  break;
                }

                customHandler(setChannels, e);
                _context.next = 9;
                break;

              case 4:
                if (!((_e$channel = e.channel) === null || _e$channel === void 0 ? void 0 : _e$channel.type)) {
                  _context.next = 9;
                  break;
                }

                _context.next = 7;
                return getChannel(client, e.channel.type, e.channel.id);

              case 7:
                channel = _context.sent;
                // move channel to starting position
                setChannels(function (channels) {
                  return uniqBy([channel].concat(_toConsumableArray(channels)), 'cid');
                });

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function handleEvent(_x) {
        return _ref.apply(this, arguments);
      };
    }();

    client.on('notification.message_new', handleEvent);
    return function () {
      client.off('notification.message_new', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};

/**
 * @typedef {import('stream-chat').Event<string>} NotificationAddedToChannelEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: NotificationAddedToChannelEvent) => void} [customHandler]
 */

var useNotificationAddedToChannelListener = function useNotificationAddedToChannelListener(setChannels, customHandler) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(e) {
        var _e$channel;

        var channel;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(customHandler && typeof customHandler === 'function')) {
                  _context.next = 4;
                  break;
                }

                customHandler(setChannels, e);
                _context.next = 9;
                break;

              case 4:
                if (!((_e$channel = e.channel) === null || _e$channel === void 0 ? void 0 : _e$channel.type)) {
                  _context.next = 9;
                  break;
                }

                _context.next = 7;
                return getChannel(client, e.channel.type, e.channel.id);

              case 7:
                channel = _context.sent;
                setChannels(function (channels) {
                  return uniqBy([channel].concat(_toConsumableArray(channels)), 'cid');
                });

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function handleEvent(_x) {
        return _ref.apply(this, arguments);
      };
    }();

    client.on('notification.added_to_channel', handleEvent);
    return function () {
      client.off('notification.added_to_channel', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};

// @ts-check
/**
 * @typedef {import('stream-chat').Event<string>} NotificationAddedToChannelEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: NotificationAddedToChannelEvent) => void} [customHandler]
 */

var useNotificationRemovedFromChannelListener = function useNotificationRemovedFromChannelListener(setChannels, customHandler) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = function handleEvent(e) {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else {
        setChannels(function (channels) {
          return channels.filter(function (channel) {
            var _e$channel;

            return channel.cid !== ((_e$channel = e.channel) === null || _e$channel === void 0 ? void 0 : _e$channel.cid);
          });
        });
      }
    };

    client.on('notification.removed_from_channel', handleEvent);
    return function () {
      client.off('notification.removed_from_channel', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};

/**
 * @typedef {import('stream-chat').Event<string>} ChannelDeletedEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelDeletedEvent) => void} [customHandler]
 */

var useChannelDeletedListener = function useChannelDeletedListener(setChannels, customHandler) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = function handleEvent(e) {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else {
        setChannels(function (channels) {
          var channelIndex = channels.findIndex(function (channel) {
            return channel.cid === (e === null || e === void 0 ? void 0 : e.cid);
          });
          if (channelIndex < 0) return _toConsumableArray(channels); // Remove the deleted channel from the list.s

          channels.splice(channelIndex, 1); // eslint-disable-next-line consistent-return

          return _toConsumableArray(channels);
        });
      }
    };

    client.on('channel.deleted', handleEvent);
    return function () {
      client.off('channel.deleted', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};

/**
 * @typedef {import('stream-chat').Event<string>} ChannelTruncatedEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelTruncatedEvent) => void} [customHandler]
 * @param {() => void} [forceUpdate]
 */

var useChannelTruncatedListener = function useChannelTruncatedListener(setChannels, customHandler, forceUpdate) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = function handleEvent(e) {
      setChannels(function (channels) {
        return _toConsumableArray(channels);
      });

      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      }

      forceUpdate === null || forceUpdate === void 0 ? void 0 : forceUpdate();
    };

    client.on('channel.truncated', handleEvent);
    return function () {
      client.off('channel.truncated', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};

/**
 * @typedef {import('stream-chat').Event<string>} ChannelUpdatedEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelUpdatedEvent) => void} [customHandler]
 * @param {() => void} [forceUpdate]
 */

var useChannelUpdatedListener = function useChannelUpdatedListener(setChannels, customHandler, forceUpdate) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = function handleEvent(e) {
      setChannels(function (channels) {
        var channelIndex = channels.findIndex(function (channel) {
          var _e$channel;

          return channel.cid === ((_e$channel = e.channel) === null || _e$channel === void 0 ? void 0 : _e$channel.cid);
        });

        if (channelIndex > -1 && e.channel) {
          var newChannels = channels;
          newChannels[channelIndex].data = e.channel;
          return _toConsumableArray(newChannels);
        }

        return channels;
      });
      forceUpdate === null || forceUpdate === void 0 ? void 0 : forceUpdate();

      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      }
    };

    client.on('channel.updated', handleEvent);
    return function () {
      client.off('channel.updated', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};

/**
 * @typedef {import('stream-chat').Event<string>} ChannelHiddenEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelHiddenEvent) => void} [customHandler]
 */

var useChannelHiddenListener = function useChannelHiddenListener(setChannels, customHandler) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = function handleEvent(e) {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else {
        setChannels(function (channels) {
          var channelIndex = channels.findIndex(function (channel) {
            return channel.cid === (e === null || e === void 0 ? void 0 : e.cid);
          });
          if (channelIndex < 0) return _toConsumableArray(channels); // Remove the hidden channel from the list.s

          channels.splice(channelIndex, 1); // eslint-disable-next-line consistent-return

          return _toConsumableArray(channels);
        });
      }
    };

    client.on('channel.hidden', handleEvent);
    return function () {
      client.off('channel.hidden', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};

/**
 * @typedef {import('stream-chat').Event<string>} ChannelVisibleEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelVisibleEvent) => void} [customHandler]
 */

var useChannelVisibleListener = function useChannelVisibleListener(setChannels, customHandler) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(e) {
        var channel;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(customHandler && typeof customHandler === 'function')) {
                  _context.next = 4;
                  break;
                }

                customHandler(setChannels, e);
                _context.next = 9;
                break;

              case 4:
                if (!(e === null || e === void 0 ? void 0 : e.type)) {
                  _context.next = 9;
                  break;
                }

                _context.next = 7;
                return getChannel(client, e.channel_type, e.channel_id);

              case 7:
                channel = _context.sent;
                setChannels(function (channels) {
                  return uniqBy([channel].concat(_toConsumableArray(channels)), 'cid');
                });

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      return function handleEvent(_x) {
        return _ref.apply(this, arguments);
      };
    }();

    client.on('channel.visible', handleEvent);
    return function () {
      client.off('channel.visible', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};

// @ts-check
/**
 * @param {() => void} [forceUpdate]
 */

var useConnectionRecoveredListener = function useConnectionRecoveredListener(forceUpdate) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    var handleEvent = function handleEvent() {
      forceUpdate === null || forceUpdate === void 0 ? void 0 : forceUpdate();
    };

    client.on('connection.recovered', handleEvent);
    return function () {
      client.off('connection.recovered', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 */

var useUserPresenceChangedListener = function useUserPresenceChangedListener(setChannels) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client;

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = function handleEvent(e) {
      setChannels(function (channels) {
        var newChannels = channels.map(function (channel) {
          var _e$user;

          if (!((_e$user = e.user) === null || _e$user === void 0 ? void 0 : _e$user.id) || !channel.state.members[e.user.id]) return channel;
          channel.state.members.setIn([e.user.id, 'user'], e.user);
          return channel;
        });
        return _toConsumableArray(newChannels);
      });
    };

    client.on('user.presence.changed', handleEvent);
    return function () {
      client.off('user.presence.changed', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

function ownKeys$7(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$7(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$7(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$7(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * @typedef {import('stream-chat').Channel} Channel
 * @param {import('stream-chat').StreamChat} client
 * @param {import('../types').ChannelFilters} filters
 * @param {import('../types').ChannelSort} [sort]
 * @param {import('../types').ChannelOptions} [options]
 * @param {(channels: Channel[], setChannels: React.Dispatch<React.SetStateAction<Channel[]>>) => void} [activeChannelHandler]
 */

var usePaginatedChannels = function usePaginatedChannels(client, filters, sort, options, activeChannelHandler) {
  var _useState = React.useState(
  /** @type {Channel[]} */
  []),
      _useState2 = _slicedToArray(_useState, 2),
      channels = _useState2[0],
      setChannels = _useState2[1];

  var _useState3 = React.useState(true),
      _useState4 = _slicedToArray(_useState3, 2),
      loadingChannels = _useState4[0],
      setLoadingChannels = _useState4[1];

  var _useState5 = React.useState(true),
      _useState6 = _slicedToArray(_useState5, 2),
      refreshing = _useState6[0],
      setRefreshing = _useState6[1];

  var _useState7 = React.useState(0),
      _useState8 = _slicedToArray(_useState7, 2),
      offset = _useState8[0],
      setOffset = _useState8[1];

  var _useState9 = React.useState(false),
      _useState10 = _slicedToArray(_useState9, 2),
      error = _useState10[0],
      setError = _useState10[1];

  var _useState11 = React.useState(true),
      _useState12 = _slicedToArray(_useState11, 2),
      hasNextPage = _useState12[0],
      setHasNextPage = _useState12[1];
  /**
   * @param {string} [queryType]
   */


  var queryChannels = /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(queryType) {
      var _options$limit;

      var newOptions, channelQueryResponse, newChannels;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (queryType === 'reload') {
                setChannels([]);
                setLoadingChannels(true);
              }

              setRefreshing(true);
              newOptions = _objectSpread$7(_objectSpread$7({
                offset: queryType === 'reload' ? 0 : offset
              }, options), {}, {
                limit: (_options$limit = options === null || options === void 0 ? void 0 : options.limit) !== null && _options$limit !== void 0 ? _options$limit : MAX_QUERY_CHANNELS_LIMIT
              });
              _context.prev = 3;
              _context.next = 6;
              return client.queryChannels(filters, sort || {}, newOptions);

            case 6:
              channelQueryResponse = _context.sent;

              if (queryType === 'reload') {
                newChannels = channelQueryResponse;
              } else {
                newChannels = [].concat(_toConsumableArray(channels), _toConsumableArray(channelQueryResponse));
              }

              setChannels(newChannels);
              setRefreshing(false);
              setHasNextPage(channelQueryResponse.length >= newOptions.limit); // Set active channel only after first page.

              if (offset === 0 && activeChannelHandler) {
                activeChannelHandler(newChannels, setChannels);
              }

              setOffset(newChannels.length);
              _context.next = 19;
              break;

            case 15:
              _context.prev = 15;
              _context.t0 = _context["catch"](3);
              console.warn(_context.t0);
              setError(true);

            case 19:
              setLoadingChannels(false);
              setRefreshing(false);

            case 21:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[3, 15]]);
    }));

    return function queryChannels(_x) {
      return _ref.apply(this, arguments);
    };
  }();

  var loadNextPage = function loadNextPage() {
    queryChannels();
  };

  React.useEffect(function () {
    queryChannels('reload'); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
  return {
    channels,
    loadNextPage,
    hasNextPage,
    status: {
      loadingChannels,
      refreshing,
      error
    },
    setChannels
  };
};

// @ts-check
/**
 * @param {React.MutableRefObject<HTMLDivElement | null>} channelListRef
 * @param {boolean} navOpen
 * @param {() => void} [closeMobileNav]
 */

var useMobileNavigation = function useMobileNavigation(channelListRef, navOpen, closeMobileNav) {
  React.useEffect(function () {
    /** @param {MouseEvent} e */
    var handleClickOutside = function handleClickOutside(e) {
      if (channelListRef.current && !channelListRef.current.contains(
      /** @type {Node | null} */
      e.target) && navOpen) {
        closeMobileNav === null || closeMobileNav === void 0 ? void 0 : closeMobileNav();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return function () {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [navOpen, channelListRef, closeMobileNav]);
};

function ownKeys$8(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$8(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$8(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$8(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 * @type {React.FC<import('../types').ChannelListProps>}
 */

var ChannelList = function ChannelList(props) {
  var _useContext = React.useContext(ChatContext),
      client = _useContext.client,
      setActiveChannel = _useContext.setActiveChannel,
      _useContext$navOpen = _useContext.navOpen,
      navOpen = _useContext$navOpen === void 0 ? false : _useContext$navOpen,
      closeMobileNav = _useContext.closeMobileNav,
      channel = _useContext.channel,
      theme = _useContext.theme;

  var channelListRef = React.useRef(
  /** @type {HTMLDivElement | null} */
  null);

  var _useState = React.useState(0),
      _useState2 = _slicedToArray(_useState, 2),
      channelUpdateCount = _useState2[0],
      setChannelUpdateCount = _useState2[1];
  /**
   * Set a channel with id {customActiveChannel} as active and move it to the top of the list.
   * If customActiveChannel prop is absent, then set the first channel in list as active channel.
   * @param {import('stream-chat').Channel[]} channels
   * @param {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} setChannels
   */


  var activeChannelHandler = function activeChannelHandler(channels, setChannels) {
    var _props$setActiveChann = props.setActiveChannelOnMount,
        setActiveChannelOnMount = _props$setActiveChann === void 0 ? true : _props$setActiveChann,
        customActiveChannel = props.customActiveChannel,
        watchers = props.watchers,
        _props$options = props.options,
        options = _props$options === void 0 ? {} : _props$options;

    if (!channels || channels.length === 0 || channels.length > (options.limit || MAX_QUERY_CHANNELS_LIMIT)) {
      return;
    }

    if (customActiveChannel) {
      var customActiveChannelObject = channels.find(function (chan) {
        return chan.id === customActiveChannel;
      });

      if (customActiveChannelObject) {
        setActiveChannel === null || setActiveChannel === void 0 ? void 0 : setActiveChannel(customActiveChannelObject, watchers);
        var newChannels = moveChannelUp(customActiveChannelObject.cid, channels);
        setChannels(newChannels);
      }

      return;
    }

    if (setActiveChannelOnMount) {
      setActiveChannel === null || setActiveChannel === void 0 ? void 0 : setActiveChannel(channels[0], watchers);
    }
  }; // When channel list (channels array) is updated without any shallow changes (or with only deep changes), then we want
  // to force the channel preview to re-render.
  // This happens in case of event channel.updated, channel.truncated etc. Inner properties of channel is updated but
  // react renderer will only make shallow comparison and choose to not to re-render the UI.
  // By updating the dummy prop - channelUpdateCount, we can force this re-render.


  var forceUpdate = function forceUpdate() {
    setChannelUpdateCount(function (count) {
      return count + 1;
    });
  };

  var _usePaginatedChannels = usePaginatedChannels(client, props.filters || {}, props.sort || {}, props.options || {}, activeChannelHandler),
      channels = _usePaginatedChannels.channels,
      loadNextPage = _usePaginatedChannels.loadNextPage,
      hasNextPage = _usePaginatedChannels.hasNextPage,
      status = _usePaginatedChannels.status,
      setChannels = _usePaginatedChannels.setChannels;

  useMobileNavigation(channelListRef, navOpen, closeMobileNav); // All the event listeners

  useMessageNewListener(setChannels, props.lockChannelOrder);
  useNotificationMessageNewListener(setChannels, props.onMessageNew);
  useNotificationAddedToChannelListener(setChannels, props.onAddedToChannel);
  useNotificationRemovedFromChannelListener(setChannels, props.onRemovedFromChannel);
  useChannelDeletedListener(setChannels, props.onChannelDeleted);
  useChannelHiddenListener(setChannels, props.onChannelHidden);
  useChannelVisibleListener(setChannels, props.onChannelVisible);
  useChannelTruncatedListener(setChannels, props.onChannelTruncated, forceUpdate);
  useChannelUpdatedListener(setChannels, props.onChannelUpdated, forceUpdate);
  useConnectionRecoveredListener(forceUpdate);
  useUserPresenceChangedListener(setChannels); // If the active channel is deleted, then unset the active channel.

  React.useEffect(function () {
    /** @param {import('stream-chat').Event<string>} e */
    var handleEvent = function handleEvent(e) {
      if ((e === null || e === void 0 ? void 0 : e.cid) === (channel === null || channel === void 0 ? void 0 : channel.cid)) {
        setActiveChannel === null || setActiveChannel === void 0 ? void 0 : setActiveChannel();
      }
    };

    client.on('channel.deleted', handleEvent);
    client.on('channel.hidden', handleEvent);
    return function () {
      client.off('channel.deleted', handleEvent);
      client.off('channel.hidden', handleEvent);
    }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]); // renders the channel preview or item

  /** @param {import('stream-chat').Channel} item */

  var renderChannel = function renderChannel(item) {
    if (!item) return null;
    var _props$Preview = props.Preview,
        Preview = _props$Preview === void 0 ? ChannelPreviewLastMessage$1 : _props$Preview,
        _props$watchers = props.watchers,
        watchers = _props$watchers === void 0 ? {} : _props$watchers;
    var previewProps = {
      channel: item,
      Preview,
      activeChannel: channel,
      setActiveChannel,
      watchers,
      key: item.id,
      // To force the update of preview component upon channel update.
      channelUpdateCount
    };
    return smartRender(ChannelPreview, _objectSpread$8({}, previewProps));
  }; // renders the empty state indicator (when there are no channels)


  var renderEmptyStateIndicator = function renderEmptyStateIndicator() {
    var _props$EmptyStateIndi = props.EmptyStateIndicator,
        EmptyStateIndicator = _props$EmptyStateIndi === void 0 ? EmptyStateIndicator$1 : _props$EmptyStateIndi;
    return /*#__PURE__*/React__default.createElement(EmptyStateIndicator, {
      listType: "channel"
    });
  }; // renders the list.


  var renderList = function renderList() {
    var _props$List = props.List,
        List = _props$List === void 0 ? ChannelListTeam : _props$List,
        _props$Paginator = props.Paginator,
        Paginator = _props$Paginator === void 0 ? LoadMorePaginator$1 : _props$Paginator,
        showSidebar = props.showSidebar,
        _props$LoadingIndicat = props.LoadingIndicator,
        LoadingIndicator = _props$LoadingIndicat === void 0 ? LoadingChannels$1 : _props$LoadingIndicat,
        _props$LoadingErrorIn = props.LoadingErrorIndicator,
        LoadingErrorIndicator = _props$LoadingErrorIn === void 0 ? ChatDown$1 : _props$LoadingErrorIn;
    return /*#__PURE__*/React__default.createElement(List, {
      loading: status.loadingChannels,
      error: status.error,
      showSidebar: showSidebar,
      LoadingIndicator: LoadingIndicator,
      LoadingErrorIndicator: LoadingErrorIndicator
    }, !channels || channels.length === 0 ? renderEmptyStateIndicator() : smartRender(Paginator, {
      loadNextPage,
      hasNextPage,
      refreshing: status.refreshing,
      children: channels.map(function (item) {
        return renderChannel(item);
      })
    }));
  };

  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat str-chat-channel-list ".concat(theme, " ").concat(navOpen ? 'str-chat-channel-list--open' : ''),
    ref: channelListRef
  }, renderList()));
};

ChannelList.propTypes = {
  /** Indicator for Empty State */
  EmptyStateIndicator:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').EmptyStateIndicatorProps>>} */
  PropTypes.elementType,

  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ChannelPreviewUIComponentProps>>} */
  PropTypes.elementType,

  /**
   * Loading indicator UI Component. It will be displayed until the channels are
   * being queried from API. Once the channels are loaded/queried, loading indicator is removed
   * and replaced with children of the Channel component.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').LoadingIndicatorProps>>} */
  PropTypes.elementType,

  /**
   * Error indicator UI Component. It will be displayed if there is any error if loading the channels.
   * This error could be related to network or failing API.
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ChatDownProps>>} */
  PropTypes.elementType,

  /**
   * Custom UI Component for container of list of channels. Note that, list (UI component) of channels is passed
   * to this component as children. This component is for the purpose of adding header to channel list or styling container
   * for list of channels.
   *
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelListTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelListTeam.js) (default)
   * 2. [ChannelListMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelListMessenger.js)
   *
   * It has access to some additional props:
   *
   * - `setActiveChannel` {function} Check [chat context](https://getstream.github.io/stream-chat-react/#chat)
   * - `activeChannel` Currently active channel object
   * - `channels` {array} List of channels in channel list
   */
  List:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ChannelListUIComponentProps>>} */
  PropTypes.elementType,

  /**
   * Paginator component for channels. It contains all the pagination logic such as
   * - fetching next page of results when needed e.g., when scroll reaches the end of list
   * - UI to display loading indicator when next page is being loaded
   * - call to action button to trigger loading of next page.
   *
   * Available built-in options (also accepts the same props as):
   *
   * 1. [LoadMorePaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadMorePaginator.js)
   * 2. [InfiniteScrollPaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/InfiniteScrollPaginator.js)
   */
  Paginator:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').PaginatorProps>>} */
  PropTypes.elementType,

  /**
   * Function that overrides default behaviour when new message is received on channel that is not being watched
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.message_new` event
   * */
  onMessageNew: PropTypes.func,

  /**
   * Function that overrides default behaviour when users gets added to a channel
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.added_to_channel` event
   * */
  onAddedToChannel: PropTypes.func,

  /**
   * Function that overrides default behaviour when users gets removed from a channel
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.removed_from_channel` event
   * */
  onRemovedFromChannel: PropTypes.func,

  /**
   * Function that overrides default behaviour when channel gets updated
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `notification.channel_updated` event
   * */
  onChannelUpdated: PropTypes.func,

  /**
   * Function to customize behaviour when channel gets truncated
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `channel.truncated` event
   * */
  onChannelTruncated: PropTypes.func,

  /**
   * Function that overrides default behaviour when channel gets deleted. In absence of this prop, channel will be removed from the list.
   *
   * @param {Component} setChannels Setter for channels value in state.
   * @param {Event}     event       [Event object](https://getstream.io/chat/docs/event_object/?language=js) corresponding to `channel.deleted` event
   * */
  onChannelDeleted: PropTypes.func,

  /**
   * Object containing query filters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for filter.
   * */
  filters:
  /** @type {PropTypes.Validator<import('../types').ChannelFilters>} */
  PropTypes.object,

  /**
   * Object containing query options
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for options.
   * */
  options: PropTypes.object,

  /**
   * Object containing sort parameters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels/?language=js) for a list of available fields for sort.
   * */
  sort:
  /** @type {PropTypes.Validator<import('../types').ChannelSort>} */
  PropTypes.object,

  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/channel_pagination/?language=js) for a list of available fields for sort.
   * */
  watchers:
  /** @type {PropTypes.Validator<{ limit?: number | undefined; offset?: number | undefined} | null | undefined> | undefined} */
  PropTypes.object,

  /**
   * Set a Channel (of this id) to be active and move it to the top of the list of channels by ID.
   * */
  customActiveChannel: PropTypes.string,

  /**
   * Last channel will be set as active channel if true, defaults to true
   */
  setActiveChannelOnMount: PropTypes.bool,

  /**
   * If true, channels won't be dynamically sorted by most recent message.
   */
  lockChannelOrder: PropTypes.bool
};
var ChannelList$1 = /*#__PURE__*/React__default.memo(ChannelList);

// @ts-check
/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 * @type React.FC<import('../types').ChannelListUIComponentProps>
 */

var ChannelListMessenger = function ChannelListMessenger(_ref) {
  var _ref$error = _ref.error,
      error = _ref$error === void 0 ? false : _ref$error,
      loading = _ref.loading,
      _ref$LoadingErrorIndi = _ref.LoadingErrorIndicator,
      LoadingErrorIndicator = _ref$LoadingErrorIndi === void 0 ? ChatDown$1 : _ref$LoadingErrorIndi,
      _ref$LoadingIndicator = _ref.LoadingIndicator,
      LoadingIndicator = _ref$LoadingIndicator === void 0 ? LoadingChannels$1 : _ref$LoadingIndicator,
      children = _ref.children;

  if (error) {
    return /*#__PURE__*/React__default.createElement(LoadingErrorIndicator, {
      type: "Connection Error"
    });
  }

  if (loading) {
    return /*#__PURE__*/React__default.createElement(LoadingIndicator, null);
  }

  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-messenger"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-list-messenger__main"
  }, children));
};
ChannelListMessenger.propTypes = {
  /** When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js) */
  loading: PropTypes.bool,

  /** When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js) */
  error: PropTypes.bool,

  /**
   * Loading indicator UI Component. It will be displayed if `loading` prop is true.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').LoadingIndicatorProps>>} */
  PropTypes.elementType,

  /**
   * Error indicator UI Component. It will be displayed if `error` prop is true
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator:
  /** @type {PropTypes.Validator<React.ElementType<import('../types').ChatDownProps>>} */
  PropTypes.elementType
};

// @ts-check
/**
 * @type {React.FC}
 */

var ChannelSearch = function ChannelSearch() {
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__channel-search"
  }, /*#__PURE__*/React__default.createElement("input", {
    type: "text",
    placeholder: "Search"
  }), /*#__PURE__*/React__default.createElement("button", {
    type: "submit"
  }, /*#__PURE__*/React__default.createElement("svg", {
    width: "18",
    height: "17",
    viewBox: "0 0 18 17",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React__default.createElement("path", {
    d: "M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z",
    fillRule: "evenodd"
  }))));
};

var ChannelSearch$1 = /*#__PURE__*/React__default.memo(ChannelSearch);

function ownKeys$9(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$9(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$9(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$9(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - client (the client connection)
 * - channels (the list of channels)
 * - setActiveChannel (a function to set the currently active channel)
 * - channel (the currently active channel)
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 *
 * @example ../../docs/Chat.md
 * @typedef {import('stream-chat').Channel | undefined} ChannelState
 * @type {React.FC<{ client: import('stream-chat').StreamChat, theme?: string, i18nInstance?: Streami18n, initialNavOpen?: boolean }>}
 */

var Chat = function Chat(_ref) {
  var _client$user;

  var client = _ref.client,
      _ref$theme = _ref.theme,
      theme = _ref$theme === void 0 ? 'messaging light' : _ref$theme,
      i18nInstance = _ref.i18nInstance,
      _ref$initialNavOpen = _ref.initialNavOpen,
      initialNavOpen = _ref$initialNavOpen === void 0 ? true : _ref$initialNavOpen,
      children = _ref.children;

  var _useState = React.useState(
  /** @type { Required<import('../types').TranslationContextValue>} */
  {
    t:
    /** @param {string} key */
    function t(key) {
      return key;
    },
    tDateTimeParser: function tDateTimeParser(input) {
      return Dayjs(input);
    }
  }),
      _useState2 = _slicedToArray(_useState, 2),
      translators = _useState2[0],
      setTranslators = _useState2[1];

  var _useState3 = React.useState(
  /** @type {import('stream-chat').Mute[]} */
  []),
      _useState4 = _slicedToArray(_useState3, 2),
      mutes = _useState4[0],
      setMutes = _useState4[1];

  var _useState5 = React.useState(initialNavOpen),
      _useState6 = _slicedToArray(_useState5, 2),
      navOpen = _useState6[0],
      setNavOpen = _useState6[1];

  var _useState7 = React.useState(
  /** @type {ChannelState} */
  undefined),
      _useState8 = _slicedToArray(_useState7, 2),
      channel = _useState8[0],
      setChannel = _useState8[1];

  var openMobileNav = function openMobileNav() {
    return setTimeout(function () {
      return setNavOpen(true);
    }, 100);
  };

  var closeMobileNav = function closeMobileNav() {
    return setNavOpen(false);
  };

  var clientMutes = client === null || client === void 0 ? void 0 : (_client$user = client.user) === null || _client$user === void 0 ? void 0 : _client$user.mutes;
  React.useEffect(function () {
    setMutes(clientMutes || []);
    /** @param {import('stream-chat').Event<string>} e */

    var handleEvent = function handleEvent(e) {
      var _e$me;

      if (e.type === 'notification.mutes_updated') setMutes(((_e$me = e.me) === null || _e$me === void 0 ? void 0 : _e$me.mutes) || []);
    };

    if (client) client.on(handleEvent);
    return function () {
      return client && client.off(handleEvent);
    };
  }, [client, clientMutes]);
  React.useEffect(function () {
    var streami18n;
    if (i18nInstance instanceof Streami18n) streami18n = i18nInstance;else streami18n = new Streami18n({
      language: 'en'
    });
    streami18n.registerSetLanguageCallback(function (t) {
      return setTranslators(function (prevTranslator) {
        return _objectSpread$9(_objectSpread$9({}, prevTranslator), {}, {
          t
        });
      });
    });
    streami18n.getTranslators().then(function (translator) {
      if (translator) setTranslators(translator);
    });
  }, [i18nInstance]);
  var setActiveChannel = React.useCallback(
  /*#__PURE__*/

  /**
   * @param {ChannelState} activeChannel
   * @param {{ limit?: number; offset?: number }} [watchers]
   * @param {React.BaseSyntheticEvent} [e]
   */
  function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(activeChannel) {
      var watchers,
          e,
          _args = arguments;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              watchers = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
              e = _args.length > 2 ? _args[2] : undefined;
              if (e && e.preventDefault) e.preventDefault();

              if (!(activeChannel && Object.keys(watchers).length)) {
                _context.next = 6;
                break;
              }

              _context.next = 6;
              return activeChannel.query({
                watch: true,
                watchers
              });

            case 6:
              setChannel(activeChannel);
              closeMobileNav();

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function (_x) {
      return _ref2.apply(this, arguments);
    };
  }(), []);
  if (!translators.t) return null;
  return /*#__PURE__*/React__default.createElement(ChatContext.Provider, {
    value: {
      client,
      theme,
      channel,
      mutes,
      navOpen,
      setActiveChannel,
      openMobileNav,
      closeMobileNav
    }
  }, /*#__PURE__*/React__default.createElement(TranslationContext.Provider, {
    value: translators
  }, children));
};

Chat.propTypes = {
  /** The StreamChat client object */
  client:
  /** @type {PropTypes.Validator<import('stream-chat').StreamChat>} */
  PropTypes.object.isRequired,

  /**
   *
   * Theme could be used for custom styling of the components.
   *
   * You can override the classes used in our components under parent theme class.
   *
   * e.g. If you want to build a theme where background of message is black
   *
   * ```
   *  <Chat client={client} theme={demo}>
   *    <Channel>
   *      <MessageList />
   *    </Channel>
   *  </Chat>
   * ```
   *
   * ```scss
   *  .demo.str-chat {
   *    .str-chat__message-simple {
   *      &-text-inner {
   *        background-color: black;
   *      }
   *    }
   *  }
   * ```
   *
   * Built in available themes:
   *
   *  - `messaging light`
   *  - `messaging dark`
   *  - `team light`
   *  - `team dark`
   *  - `commerce light`
   *  - `commerce dark`
   *  - `livestream light`
   *  - `livestream dark`
   */
  theme: PropTypes.string,

  /** navOpen initial status */
  initialNavOpen: PropTypes.bool
};

// @ts-check
/**
 * DateSeparator - A simple date separator
 *
 * @example ../../docs/DateSeparator.md
 * @type {React.FC<import('../types').DateSeparatorProps>}
 */

var DateSeparator = function DateSeparator(_ref) {
  var _ref$position = _ref.position,
      position = _ref$position === void 0 ? 'right' : _ref$position,
      formatDate = _ref.formatDate,
      date = _ref.date;

  var _useContext = React.useContext(TranslationContext),
      tDateTimeParser = _useContext.tDateTimeParser;

  if (typeof date === 'string') return null;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__date-separator"
  }, (position === 'right' || position === 'center') && /*#__PURE__*/React__default.createElement("hr", {
    className: "str-chat__date-separator-line"
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__date-separator-date"
  }, formatDate ? formatDate(date) : tDateTimeParser(date.toISOString()).calendar()), (position === 'left' || position === 'center') && /*#__PURE__*/React__default.createElement("hr", {
    className: "str-chat__date-separator-line"
  }));
};

DateSeparator.propTypes = {
  /** The date to format */
  date: PropTypes.instanceOf(Date).isRequired,

  /** Set the position of the date in the separator */
  position: PropTypes.oneOf(['left', 'center', 'right']),

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func
};
var DefaultDateSeparator = /*#__PURE__*/React__default.memo(DateSeparator);

// @ts-check
/**
 * EventComponent - Custom render component for system and channel event messages
 * @type {React.FC<import('../types').EventComponentProps>}
 */

var EventComponent = function EventComponent(_ref) {
  var message = _ref.message;

  var _useContext = React.useContext(TranslationContext),
      tDateTimeParser = _useContext.tDateTimeParser;

  var type = message.type,
      text = message.text,
      event = message.event,
      created_at = message.created_at;
  if (type === 'system') return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message--system"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message--system__text"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message--system__line"
  }), /*#__PURE__*/React__default.createElement("p", null, text), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message--system__line"
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__message--system__date"
  }, /*#__PURE__*/React__default.createElement("strong", null, tDateTimeParser(created_at).format('dddd'), " "), "at ", tDateTimeParser(created_at).format('hh:mm A')));

  if (type === 'channel.event' && (event.type === 'member.removed' || event.type === 'member.added')) {
    var name = event.user.name || event.user.id;
    var sentence = "".concat(name, " ").concat(event.type === 'member.added' ? 'has joined the chat' : 'was removed from the chat');
    return /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__event-component__channel-event"
    }, /*#__PURE__*/React__default.createElement(Avatar, {
      image: event.user.image,
      name: name
    }), /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__event-component__channel-event__content"
    }, /*#__PURE__*/React__default.createElement("em", {
      className: "str-chat__event-component__channel-event__sentence"
    }, sentence), /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__event-component__channel-event__date"
    }, tDateTimeParser(created_at).format('LT'))));
  }

  return null;
};

EventComponent.propTypes = {
  /** Message object */
  // @ts-ignore
  message: PropTypes.object.isRequired
};
var EventComponent$1 = /*#__PURE__*/React__default.memo(EventComponent);

function ownKeys$a(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$a(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$a(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$a(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * Prevents Chrome hangups
 * See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
 * @param {Event} e
 */

var mousewheelListener = function mousewheelListener(e) {
  if (e instanceof WheelEvent && e.deltaY === 1) {
    e.preventDefault();
  }
};
/**
 * @param {HTMLElement | Element | null} el
 * @returns {number}
 */


var calculateTopPosition = function calculateTopPosition(el) {
  if (el instanceof HTMLElement) {
    return el.offsetTop + calculateTopPosition(el.offsetParent);
  }

  return 0;
};
/**
 * Computes by recursively summing offsetTop until an element without offsetParent is reached
 * @param {HTMLElement} el
 * @param {number} scrollTop
 */


var calculateOffset = function calculateOffset(el, scrollTop) {
  if (!el) {
    return 0;
  }

  return calculateTopPosition(el) + (el.offsetHeight - scrollTop - window.innerHeight);
};
/** @param {import("types").InfiniteScrollProps} props */


var InfiniteScroll = function InfiniteScroll(_ref) {
  var children = _ref.children,
      _ref$element = _ref.element,
      element = _ref$element === void 0 ? 'div' : _ref$element,
      _ref$hasMore = _ref.hasMore,
      hasMore = _ref$hasMore === void 0 ? false : _ref$hasMore,
      _ref$initialLoad = _ref.initialLoad,
      initialLoad = _ref$initialLoad === void 0 ? true : _ref$initialLoad,
      _ref$isReverse = _ref.isReverse,
      isReverse = _ref$isReverse === void 0 ? false : _ref$isReverse,
      loader = _ref.loader,
      loadMore = _ref.loadMore,
      _ref$threshold = _ref.threshold,
      threshold = _ref$threshold === void 0 ? 250 : _ref$threshold,
      _ref$useCapture = _ref.useCapture,
      useCapture = _ref$useCapture === void 0 ? false : _ref$useCapture,
      _ref$useWindow = _ref.useWindow,
      useWindow = _ref$useWindow === void 0 ? true : _ref$useWindow,
      _ref$isLoading = _ref.isLoading,
      isLoading = _ref$isLoading === void 0 ? false : _ref$isLoading,
      listenToScroll = _ref.listenToScroll,
      elementProps = _objectWithoutProperties(_ref, ["children", "element", "hasMore", "initialLoad", "isReverse", "loader", "loadMore", "threshold", "useCapture", "useWindow", "isLoading", "listenToScroll"]);

  var scrollComponent = React.useRef(
  /** @type {HTMLElement | null} */
  null);
  var scrollListener = React.useCallback(function () {
    var el = scrollComponent.current;
    if (!el) return;
    var parentElement = el.parentElement;
    var offset = 0;
    var reverseOffset = 0;

    if (useWindow) {
      var doc = document.documentElement || document.body.parentNode || document.body;
      var scrollTop = window.pageYOffset !== undefined ? window.pageYOffset : doc.scrollTop;
      offset = calculateOffset(el, scrollTop);
      reverseOffset = scrollTop;
    } else if (parentElement) {
      offset = el.scrollHeight - parentElement.scrollTop - parentElement.clientHeight;
      reverseOffset = parentElement.scrollTop;
    }

    if (listenToScroll) listenToScroll(offset, reverseOffset); // Here we make sure the element is visible as well as checking the offset

    if ((isReverse ? reverseOffset : offset) < Number(threshold) && el.offsetParent !== null && typeof loadMore === 'function') {
      loadMore();
    }
  }, [useWindow, isReverse, threshold, listenToScroll, loadMore]);
  React.useEffect(function () {
    var _scrollComponent$curr;

    var scrollEl = useWindow ? window : (_scrollComponent$curr = scrollComponent.current) === null || _scrollComponent$curr === void 0 ? void 0 : _scrollComponent$curr.parentNode;

    if (!hasMore || isLoading || !scrollEl) {
      return function () {};
    }

    scrollEl.addEventListener('scroll', scrollListener, useCapture);
    scrollEl.addEventListener('resize', scrollListener, useCapture);

    if (initialLoad) {
      scrollListener();
    }

    return function () {
      scrollEl.removeEventListener('scroll', scrollListener, useCapture);
      scrollEl.removeEventListener('resize', scrollListener, useCapture);
    };
  }, [hasMore, initialLoad, isLoading, scrollListener, useCapture, useWindow]);
  React.useEffect(function () {
    var _scrollComponent$curr2;

    var scrollEl = useWindow ? window : (_scrollComponent$curr2 = scrollComponent.current) === null || _scrollComponent$curr2 === void 0 ? void 0 : _scrollComponent$curr2.parentNode;
    if (!scrollEl) return function () {};
    scrollEl.addEventListener('mousewheel', mousewheelListener, useCapture);
    return function () {
      return scrollEl.removeEventListener('mousewheel', mousewheelListener, useCapture);
    };
  }, [useCapture, useWindow]);

  var attributes = _objectSpread$a(_objectSpread$a({}, elementProps), {}, {
    /** @param {HTMLElement} e */
    ref: function ref(e) {
      scrollComponent.current = e;
    }
  });

  var childrenArray = [children];

  if (isLoading && loader) {
    if (isReverse) {
      childrenArray.unshift(loader);
    } else {
      childrenArray.push(loader);
    }
  }

  return /*#__PURE__*/React__default.createElement(element, attributes, childrenArray);
};

InfiniteScroll.propTypes = {
  element: PropTypes.elementType,
  hasMore: PropTypes.bool,
  initialLoad: PropTypes.bool,
  isReverse: PropTypes.bool,
  loader: PropTypes.node,
  loadMore: PropTypes.func.isRequired,
  pageStart: PropTypes.number,
  isLoading: PropTypes.bool,
  threshold: PropTypes.number,
  useCapture: PropTypes.bool,
  useWindow: PropTypes.bool
};

// @ts-check
/**
 * @type { React.FC<import('../types').InfiniteScrollPaginatorProps>}
 */

var InfiniteScrollPaginator = function InfiniteScrollPaginator(_ref) {
  var _ref$LoadingIndicator = _ref.LoadingIndicator,
      LoadingIndicator = _ref$LoadingIndicator === void 0 ? reactFileUtils.LoadingIndicator : _ref$LoadingIndicator,
      loadNextPage = _ref.loadNextPage,
      hasNextPage = _ref.hasNextPage,
      refreshing = _ref.refreshing,
      reverse = _ref.reverse,
      threshold = _ref.threshold,
      children = _ref.children;
  return /*#__PURE__*/React__default.createElement(InfiniteScroll, {
    loadMore: loadNextPage,
    hasMore: hasNextPage,
    isLoading: refreshing,
    isReverse: reverse,
    threshold: threshold,
    useWindow: false,
    loader: /*#__PURE__*/React__default.createElement("div", {
      className: "str-chat__infinite-scroll-paginator",
      key: "loadingindicator"
    }, /*#__PURE__*/React__default.createElement(LoadingIndicator, null))
  }, children);
};

InfiniteScrollPaginator.propTypes = {
  /** callback to load the next page */
  loadNextPage: PropTypes.func.isRequired,

  /** indicates if there is a next page to load */
  hasNextPage: PropTypes.bool,

  /** indicates if there there's currently any refreshing taking place */
  refreshing: PropTypes.bool,

  /** display the items in opposite order */
  reverse: PropTypes.bool,

  /** Offset from when to start the loadNextPage call */
  threshold: PropTypes.number,

  /** The loading indicator to use */
  // @ts-ignore
  LoadingIndicator: PropTypes.elementType
};

/** @type {React.FC<import("types").InfiniteScrollProps>} */

var ReverseInfiniteScroll = function ReverseInfiniteScroll(props) {
  return /*#__PURE__*/React__default.createElement(InfiniteScroll, _extends({}, props, {
    isReverse: true
  }));
};

var Center = function Center(_ref) {
  var children = _ref.children;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__list__center"
  }, children);
};

var Center$1 = /*#__PURE__*/React__default.memo(Center);

// @ts-check
/** @type {React.FC<import('../types').MessageNotificationProps>} */

var MessageNotification = function MessageNotification(_ref) {
  var showNotification = _ref.showNotification,
      onClick = _ref.onClick,
      children = _ref.children;
  if (!showNotification) return null;
  return /*#__PURE__*/React__default.createElement("button", {
    "data-testid": "message-notification",
    className: "str-chat__message-notification",
    onClick: onClick
  }, children);
};

MessageNotification.defaultProps = {
  showNotification: true
};
MessageNotification.propTypes = {
  /** If we should show the notification or not */
  showNotification: PropTypes.bool.isRequired,

  /** Onclick handler */
  onClick: PropTypes.func.isRequired
};
var MessageNotification$1 = /*#__PURE__*/React__default.memo(MessageNotification);

var CustomNotification = function CustomNotification(_ref) {
  var children = _ref.children,
      active = _ref.active,
      type = _ref.type;
  if (!active) return null;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__custom-notification notification-".concat(type),
    "data-testid": "custom-notification"
  }, children);
};

CustomNotification.propTypes = {
  active: PropTypes.bool,
  type: PropTypes.string
};
var CustomNotification$1 = /*#__PURE__*/React__default.memo(CustomNotification);

var getLastReceived = function getLastReceived(messages) {
  for (var i = messages.length - 1; i > 0; i -= 1) {
    if (messages[i].status === 'received') return messages[i].id;
  }

  return null;
};

var getReadStates = function getReadStates(messages, read) {
  // create object with empty array for each message id
  var readData = {};
  Object.values(read).forEach(function (readState) {
    if (!readState.last_read) return;
    var userLastReadMsgId;
    messages.forEach(function (msg) {
      if (msg.updated_at < readState.last_read) userLastReadMsgId = msg.id;
    });

    if (userLastReadMsgId) {
      if (!readData[userLastReadMsgId]) readData[userLastReadMsgId] = [];
      readData[userLastReadMsgId].push(readState.user);
    }
  });
  return readData;
};

var insertDates = function insertDates(messages) {
  var newMessages = [];

  for (var i = 0, l = messages.length; i < l; i += 1) {
    var message = messages[i];

    if (message.type === 'message.read') {
      newMessages.push(message);
      continue;
    }

    var messageDate = message.created_at.toDateString();
    var prevMessageDate = messageDate;

    if (i > 0) {
      prevMessageDate = messages[i - 1].created_at.toDateString();
    }

    if (i === 0 || messageDate !== prevMessageDate) {
      newMessages.push({
        type: 'message.date',
        date: message.created_at
      }, message);
    } else {
      newMessages.push(message);
    }
  }

  return newMessages;
};

var insertIntro = function insertIntro(messages, headerPosition) {
  var newMessages = messages; // if no headerPosition is set, HeaderComponent will go at the top

  if (!headerPosition) {
    newMessages.unshift({
      type: 'channel.intro'
    });
    return newMessages;
  } // if no messages, intro get's inserted


  if (!newMessages.length) {
    newMessages.unshift({
      type: 'channel.intro'
    });
    return newMessages;
  } // else loop over the messages


  for (var i = 0, l = messages.length; i < l; i += 1) {
    var message = messages[i];
    var messageTime = message.created_at ? message.created_at.getTime() : null;
    var nextMessageTime = messages[i + 1] && messages[i + 1].created_at ? messages[i + 1].created_at.getTime() : null; // headerposition is smaller than message time so comes after;

    if (messageTime < headerPosition) {
      // if header position is also smaller than message time continue;
      if (nextMessageTime < headerPosition) {
        if (messages[i + 1] && messages[i + 1].type === 'message.date') continue;

        if (!nextMessageTime) {
          newMessages.push({
            type: 'channel.intro'
          });
          return newMessages;
        }

        continue;
      } else {
        newMessages.splice(i + 1, 0, {
          type: 'channel.intro'
        });
        return newMessages;
      }
    }
  }

  return newMessages;
};

var getGroupStyles = function getGroupStyles(message, previousMessage, nextMessage, noGroupByUser) {
  if (message.type === 'message.date') return '';
  if (message.type === 'channel.event') return '';
  if (message.type === 'channel.intro') return '';
  if (noGroupByUser || message.attachments.length !== 0) return 'single';
  var isTopMessage = !previousMessage || previousMessage.type === 'channel.intro' || previousMessage.type === 'message.date' || previousMessage.type === 'system' || previousMessage.type === 'channel.event' || previousMessage.attachments.length !== 0 || message.user.id !== previousMessage.user.id || previousMessage.type === 'error' || previousMessage.deleted_at;
  var isBottomMessage = !nextMessage || nextMessage.type === 'message.date' || nextMessage.type === 'system' || nextMessage.type === 'channel.event' || nextMessage.type === 'channel.intro' || nextMessage.attachments.length !== 0 || message.user.id !== nextMessage.user.id || nextMessage.type === 'error' || nextMessage.deleted_at;

  if (!isTopMessage && !isBottomMessage) {
    if (message.deleted_at || message.type === 'error') return 'single';
    return 'middle';
  }

  if (isBottomMessage) {
    if (isTopMessage || message.deleted_at || message.type === 'error') return 'single';
    return 'bottom';
  }

  if (isTopMessage) return 'top';
  return '';
};

var MessageListInner = function MessageListInner(props) {
  var EmptyStateIndicator = props.EmptyStateIndicator,
      MessageSystem = props.MessageSystem,
      DateSeparator = props.DateSeparator,
      HeaderComponent = props.HeaderComponent,
      headerPosition = props.headerPosition,
      bottomRef = props.bottomRef,
      onMessageLoadCaptured = props.onMessageLoadCaptured,
      messages = props.messages,
      noGroupByUser = props.noGroupByUser,
      client = props.client,
      threadList = props.threadList,
      read = props.read,
      internalMessageProps = props.internalMessageProps,
      internalInfiniteScrollProps = props.internalInfiniteScrollProps;
  var enrichedMessages = React.useMemo(function () {
    var messageWithDates = insertDates(messages); // messageWithDates.sort((a, b) => a.created_at - b.created_at); // TODO: remove if no issue came up

    if (HeaderComponent) return insertIntro(messageWithDates, headerPosition);
    return messageWithDates;
  }, [HeaderComponent, headerPosition, messages]);
  var messageGroupStyles = React.useMemo(function () {
    return enrichedMessages.reduce(function (acc, message, i) {
      var style = getGroupStyles(message, enrichedMessages[i - 1], enrichedMessages[i + 1], noGroupByUser);
      if (style) acc[message.id] = style;
      return acc;
    }, {});
  }, [enrichedMessages, noGroupByUser]); // get the readData, but only for messages submitted by the user themselves

  var readData = React.useMemo(function () {
    return getReadStates(enrichedMessages.filter(function (_ref) {
      var user = _ref.user;
      return (user === null || user === void 0 ? void 0 : user.id) === client.userID;
    }), read);
  }, [client.userID, enrichedMessages, read]);
  var lastReceivedId = React.useMemo(function () {
    return getLastReceived(enrichedMessages);
  }, [enrichedMessages]);
  var elements = React.useMemo(function () {
    return enrichedMessages.map(function (message) {
      if (message.type === 'message.date') {
        if (threadList) return null;
        return /*#__PURE__*/React__default.createElement("li", {
          key: "".concat(message.date.toISOString(), "-i")
        }, /*#__PURE__*/React__default.createElement(DateSeparator, {
          date: message.date
        }));
      }

      if (message.type === 'channel.intro') {
        return /*#__PURE__*/React__default.createElement("li", {
          key: "intro"
        }, /*#__PURE__*/React__default.createElement(HeaderComponent, null));
      }

      if (message.type === 'channel.event' || message.type === 'system') {
        var _message$event;

        if (!MessageSystem) return null;
        return /*#__PURE__*/React__default.createElement("li", {
          key: ((_message$event = message.event) === null || _message$event === void 0 ? void 0 : _message$event.created_at) || message.created_at || ''
        }, /*#__PURE__*/React__default.createElement(MessageSystem, {
          message: message
        }));
      }

      if (message.type !== 'message.read') {
        var groupStyles = messageGroupStyles[message.id] || '';
        return /*#__PURE__*/React__default.createElement("li", {
          className: "str-chat__li str-chat__li--".concat(groupStyles),
          key: message.id || message.created_at,
          onLoadCapture: onMessageLoadCaptured
        }, /*#__PURE__*/React__default.createElement(Message$1, _extends({
          client: client,
          message: message,
          groupStyles: [groupStyles]
          /* TODO: convert to simple string */
          ,
          readBy: readData[message.id] || [],
          lastReceivedId: lastReceivedId,
          threadList: threadList
        }, internalMessageProps)));
      }

      return null;
    });
  }, [MessageSystem, client, enrichedMessages, internalMessageProps, lastReceivedId, messageGroupStyles, onMessageLoadCaptured, readData, threadList]);
  if (!elements.length) return /*#__PURE__*/React__default.createElement(EmptyStateIndicator, {
    listType: "message"
  });
  return /*#__PURE__*/React__default.createElement(InfiniteScroll, _extends({
    isReverse: true,
    useWindow: false,
    className: "str-chat__reverse-infinite-scroll",
    "data-testid": "reverse-infinite-scroll"
  }, internalInfiniteScrollProps), /*#__PURE__*/React__default.createElement("ul", {
    className: "str-chat__ul"
  }, elements), /*#__PURE__*/React__default.createElement("div", {
    key: "bottom",
    ref: bottomRef
  }));
};

var MessageListInner$1 = /*#__PURE__*/React__default.memo(MessageListInner, deepequal);

function _createSuper$4(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$4(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$4() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
/**
 * MessageList - The message list components renders a list of messages. Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
 *
 * @example ../../docs/MessageList.md
 * @extends PureComponent
 */

var MessageList = /*#__PURE__*/function (_PureComponent) {
  _inherits(MessageList, _PureComponent);

  var _super = _createSuper$4(MessageList);

  function MessageList(props) {
    var _this;

    _classCallCheck(this, MessageList);

    _this = _super.call(this, props);

    _defineProperty(_assertThisInitialized(_this), "connectionChanged", function (_ref) {
      var online = _ref.online;
      if (_this.state.online !== online) _this.setState({
        online
      });
    });

    _defineProperty(_assertThisInitialized(_this), "scrollToBottom", function () {
      _this._scrollToRef(_this.bottomRef, _this.messageList);
    });

    _defineProperty(_assertThisInitialized(_this), "_scrollToRef", function (el, parent) {
      var scrollDown = function scrollDown() {
        if (el && el.current && parent && parent.current) {
          _this.scrollToTarget(el.current, parent.current);
        }
      };

      scrollDown(); // scroll down after images load again

      setTimeout(scrollDown, 200);
    });

    _defineProperty(_assertThisInitialized(_this), "scrollToTarget", function (target, containerEl) {
      // Moved up here for readability:
      var isElement = target && target.nodeType === 1;
      var isNumber = Object.prototype.toString.call(target) === '[object Number]';
      var scrollTop;
      if (isElement) scrollTop = target.offsetTop;else if (isNumber) scrollTop = target;else if (target === 'top') scrollTop = 0;else if (target === 'bottom') scrollTop = containerEl.scrollHeight - containerEl.offsetHeight;
      if (scrollTop !== undefined) containerEl.scrollTop = scrollTop; // eslint-disable-line no-param-reassign
    });

    _defineProperty(_assertThisInitialized(_this), "goToNewMessages", function () {
      _this.scrollToBottom();

      _this.setState({
        newMessagesNotification: false
      });
    });

    _defineProperty(_assertThisInitialized(_this), "userScrolledUp", function () {
      return _this.scrollOffset > 310;
    });

    _defineProperty(_assertThisInitialized(_this), "listenToScroll", function (offset) {
      _this.scrollOffset = offset;

      if (_this.state.newMessagesNotification && !_this.userScrolledUp()) {
        _this.setState({
          newMessagesNotification: false
        });
      }
    });

    _defineProperty(_assertThisInitialized(_this), "addNotification", function (notificationText, type) {
      if (typeof notificationText !== 'string') return;
      if (type !== 'success' && type !== 'error') return;
      var id = uuid.v4();

      _this.setState(function (_ref2) {
        var notifications = _ref2.notifications;
        return {
          notifications: [].concat(_toConsumableArray(notifications), [{
            id,
            text: notificationText,
            type
          }])
        };
      }); // remove the notification after 5000 ms


      var ct = setTimeout(function () {
        return _this.setState(function (_ref3) {
          var notifications = _ref3.notifications;
          return {
            notifications: notifications.filter(function (n) {
              return n.id !== id;
            })
          };
        });
      }, 5000);

      _this.notificationTimeouts.push(ct);
    });

    _defineProperty(_assertThisInitialized(_this), "onMessageLoadCaptured", function () {
      // A load event (emitted by e.g. an <img>) was captured on a message.
      // In some cases, the loaded asset is larger than the placeholder, which means we have to scroll down.
      if (!_this.userScrolledUp()) {
        _this.scrollToBottom();
      }
    });

    _defineProperty(_assertThisInitialized(_this), "loadMore", function () {
      return _this.props.messageLimit ? _this.props.loadMore(_this.props.messageLimit) : _this.props.loadMore();
    });

    _this.state = {
      newMessagesNotification: false,
      online: true,
      notifications: []
    };
    _this.bottomRef = /*#__PURE__*/React__default.createRef();
    _this.messageList = /*#__PURE__*/React__default.createRef();
    _this.notificationTimeouts = [];
    return _this;
  }

  _createClass(MessageList, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      // start at the bottom
      this.scrollToBottom();
      var messageListRect = this.messageList.current.getBoundingClientRect();
      this.setState({
        messageListRect
      });
      this.props.client.on('connection.changed', this.connectionChanged);
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      this.props.client.off('connection.changed', this.connectionChanged);
      this.notificationTimeouts.forEach(clearTimeout);
    }
  }, {
    key: "getSnapshotBeforeUpdate",
    value: function getSnapshotBeforeUpdate(prevProps) {
      if (this.props.threadList) {
        return null;
      } // Are we adding new items to the list?
      // Capture the scroll position so we can adjust scroll later.


      if (prevProps.messages.length < this.props.messages.length) {
        var list = this.messageList.current;
        return {
          offsetTop: list.scrollTop,
          offsetBottom: list.scrollHeight - list.scrollTop
        };
      }

      return null;
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState, snapshot) {
      // If we have a snapshot value, we've just added new items.
      // Adjust scroll so these new items don't push the old ones out of view.
      // (snapshot here is the value returned from getSnapshotBeforeUpdate)
      var userScrolledUp = this.userScrolledUp();
      var currentLastMessage = this.props.messages[this.props.messages.length - 1];
      var previousLastMessage = prevProps.messages[prevProps.messages.length - 1];

      if (!previousLastMessage || !currentLastMessage) {
        return;
      }

      var hasNewMessage = currentLastMessage.id !== previousLastMessage.id;
      var isOwner = currentLastMessage.user.id === this.props.client.userID;
      var list = this.messageList.current; // always scroll down when it's your own message that you added...

      var scrollToBottom = hasNewMessage && (isOwner || !userScrolledUp);

      if (scrollToBottom) {
        this.scrollToBottom(); // remove the scroll notification if we already scrolled down...

        if (this.state.newMessagesNotification) this.setState({
          newMessagesNotification: false
        });
        return;
      }

      if (snapshot !== null) {
        // Maintain the offsetTop of scroll so that content in viewport doesn't move.
        // This is for the case where user has scroll up significantly and a new message arrives from someone.
        if (hasNewMessage) {
          this.scrollToTarget(snapshot.offsetTop, this.messageList.current);
        } else {
          // Maintain the bottomOffset of scroll.
          // This is for the case of pagination, when more messages get loaded.
          this.scrollToTarget(list.scrollHeight - snapshot.offsetBottom, this.messageList.current);
        }
      } // Check the scroll position... if you're scrolled up show a little notification


      if (hasNewMessage && !this.state.newMessagesNotification) {
        this.setState({
          newMessagesNotification: true
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      var t = this.props.t;
      return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", {
        className: "str-chat__list ".concat(this.props.threadList ? 'str-chat__list--thread' : ''),
        ref: this.messageList
      }, /*#__PURE__*/React__default.createElement(MessageListInner$1, {
        EmptyStateIndicator: this.props.EmptyStateIndicator,
        MessageSystem: this.props.MessageSystem,
        HeaderComponent: this.props.HeaderComponent,
        headerPosition: this.props.headerPosition,
        DateSeparator: this.props.DateSeparator || this.props.dateSeparator,
        messages: this.props.messages,
        noGroupByUser: this.props.noGroupByUser,
        threadList: this.props.threadList,
        client: this.props.client,
        read: this.props.read,
        bottomRef: this.bottomRef,
        onMessageLoadCaptured: this.onMessageLoadCaptured,
        internalInfiniteScrollProps: {
          hasMore: this.props.hasMore,
          isLoading: this.props.loadingMore,
          listenToScroll: this.listenToScroll,
          loadMore: this.loadMore,
          loader: /*#__PURE__*/React__default.createElement(Center$1, {
            key: "loadingindicator"
          }, smartRender(this.props.LoadingIndicator, {
            size: 20
          }, null))
        },
        internalMessageProps: {
          messageListRect: this.state.messageListRect,
          openThread: this.props.openThread,
          members: this.props.members,
          watchers: this.props.watchers,
          channel: this.props.channel,
          retrySendMessage: this.props.retrySendMessage,
          addNotification: this.addNotification,
          updateMessage: this.props.updateMessage,
          removeMessage: this.props.removeMessage,
          Message: this.props.Message,
          mutes: this.props.mutes,
          unsafeHTML: this.props.unsafeHTML,
          Attachment: this.props.Attachment,
          onMentionsClick: this.props.onMentionsClick,
          onMentionsHover: this.props.onMentionsHover,
          messageActions: this.props.messageActions,
          additionalMessageInputProps: this.props.additionalMessageInputProps,
          getFlagMessageSuccessNotification: this.props.getFlagMessageSuccessNotification,
          getFlagMessageErrorNotification: this.props.getFlagMessageErrorNotification,
          getMuteUserSuccessNotification: this.props.getMuteUserSuccessNotification,
          getMuteUserErrorNotification: this.props.getMuteUserErrorNotification
        }
      })), /*#__PURE__*/React__default.createElement("div", {
        className: "str-chat__list-notifications"
      }, this.state.notifications.map(function (notification) {
        return /*#__PURE__*/React__default.createElement(CustomNotification$1, {
          active: true,
          key: notification.id,
          type: notification.type
        }, notification.text);
      }), /*#__PURE__*/React__default.createElement(CustomNotification$1, {
        active: !this.state.online,
        type: "error"
      }, t('Connection failure, reconnecting now...')), /*#__PURE__*/React__default.createElement(MessageNotification$1, {
        showNotification: this.state.newMessagesNotification,
        onClick: this.goToNewMessages
      }, t('New Messages!'))));
    }
  }]);

  return MessageList;
}(React.PureComponent);

MessageList.propTypes = {
  /**
   * Date separator UI component to render
   *
   * Defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.js)
   * */
  dateSeparator: PropTypes.elementType,

  /** Turn off grouping of messages by user */
  noGroupByUser: PropTypes.bool,

  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,

  /** Set the limit to use when paginating messages */
  messageLimit: PropTypes.number,

  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),

  /**
   * Boolean weather current message list is a thread.
   */
  threadList: PropTypes.bool,

  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
   *
   * This function should accept following params:
   *
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   *
   * */
  getFlagMessageSuccessNotification: PropTypes.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error
   *
   * This function should accept following params:
   *
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   *
   * */
  getFlagMessageErrorNotification: PropTypes.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user is successful
   *
   * This function should accept following params:
   *
   * @param user A user object which is being muted
   *
   * */
  getMuteUserSuccessNotification: PropTypes.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
   *
   * This function should accept following params:
   *
   * @param user A user object which is being muted
   *
   * */
  getMuteUserErrorNotification: PropTypes.func,

  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  client: PropTypes.object,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  Attachment: PropTypes.elementType,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  Message: PropTypes.elementType,

  /**
   * Custom UI component to display system messages.
   *
   * Defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent.js)
   */
  MessageSystem: PropTypes.elementType,

  /**
   * The UI Indicator to use when MessagerList or ChannelList is empty
   * */
  EmptyStateIndicator: PropTypes.elementType,

  /**
   * Component to render at the top of the MessageList
   * */
  HeaderComponent: PropTypes.elementType,

  /**
   * Component to render at the top of the MessageList while loading new messages
   * */
  LoadingIndicator: PropTypes.elementType,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  messages: PropTypes.array.isRequired,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  channel: PropTypes.instanceOf(streamChat.Channel).isRequired,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  updateMessage: PropTypes.func.isRequired,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  retrySendMessage: PropTypes.func,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  removeMessage: PropTypes.func,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  onMentionsClick: PropTypes.func,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  onMentionsHover: PropTypes.func,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  openThread: PropTypes.func,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  members: PropTypes.object,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  watchers: PropTypes.object,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  read: PropTypes.object,

  /**
   * Additional props for underlying MessageInput component. We have instance of MessageInput
   * component in MessageSimple component, for handling edit state.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object
};
MessageList.defaultProps = {
  Message: MessageSimple$1,
  MessageSystem: EventComponent$1,
  threadList: false,
  Attachment,
  DateSeparator: DefaultDateSeparator,
  LoadingIndicator: DefaultLoadingIndicator,
  EmptyStateIndicator: EmptyStateIndicator$1,
  unsafeHTML: false,
  noGroupByUser: false,
  messageActions: Object.keys(MESSAGE_ACTIONS)
};
var MessageList$1 = withTranslationContext(function (props) {
  return /*#__PURE__*/React__default.createElement(ChannelContext.Consumer, null, function (_ref4) {
    var typing = _ref4.typing,
        channelContext = _objectWithoutProperties(_ref4, ["typing"]);

    return /*#__PURE__*/React__default.createElement(MessageList, _extends({}, channelContext, props));
  });
});

var Message$2 = /*#__PURE__*/React__default.memo(function Message(_ref2) {
  var client = _ref2.client,
      message = _ref2.message,
      prevMessage = _ref2.prevMessage;
  var renderedText = React.useMemo(function () {
    return renderText(message.text, message.mentioned_users);
  }, [message.text, message.mentioned_users]);
  var isOwner = message.user.id === client.userID;
  var prevMessageIsMine = (prevMessage === null || prevMessage === void 0 ? void 0 : prevMessage.user.id) === client.userID;
  var bubbleClass = isOwner ? 'str-chat__fast-message__bubble str-chat__fast-message__bubble--me' : 'str-chat__fast-message__bubble';
  var wrapperClass = isOwner ? 'str-chat__fast-message__wrapper str-chat__fast-message__wrapper--me' : 'str-chat__fast-message__wrapper';
  var metaClass = isOwner ? 'str-chat__fast-message__meta' : 'str-chat__fast-message__meta';
  return /*#__PURE__*/React__default.createElement("div", {
    key: message.id,
    className: wrapperClass
  }, /*#__PURE__*/React__default.createElement(Avatar, {
    image: message.user.image,
    name: message.user.name || message.user.id
  }), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__fast-message__content"
  }, /*#__PURE__*/React__default.createElement("div", {
    className: bubbleClass
  }, renderedText), /*#__PURE__*/React__default.createElement("div", {
    className: metaClass
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__fast-message__author"
  }, /*#__PURE__*/React__default.createElement("strong", null, message.user.name ? message.user.name : 'unknown')), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__fast-message__date"
  }, /*#__PURE__*/React__default.createElement(MessageTimestamp$1, {
    customClass: "str-chat__message-simple-timestamp",
    message: message,
    calendar: true
  })))));
}, deepequal);

var FastMessageList = function FastMessageList(_ref3) {
  var client = _ref3.client,
      messages = _ref3.messages,
      loadMore = _ref3.loadMore,
      hasMore = _ref3.hasMore,
      hackNumber = _ref3.hackNumber;
  var virtuoso = React.useRef();
  var mounted = React.useRef(false);
  React.useEffect(function () {
    if (!messages.length) return;
    var lastMessage = messages[messages.length - 1];
    var isOwner = lastMessage.user.id === client.userID;
    if (isOwner) virtuoso.current.scrollToIndex(messages.length);
  }, [client.userID, messages]);
  var itemRenderer = React.useCallback(function (message, prevMessage) {
    if (!message) return null;

    if (message.type === 'channel.event' || message.type === 'system') {
      return null;
    }

    return /*#__PURE__*/React__default.createElement(Message$2, {
      client: client,
      message: message,
      prevMessage: prevMessage
    });
  }, [client]);
  React.useEffect(function () {
    if (mounted.current) return;

    if (messages.length && virtuoso.current) {
      virtuoso.current.scrollToIndex(messages.length);
      mounted.current = true;
    }
  }, [messages.length]);
  if (!messages.length) return /*#__PURE__*/React__default.createElement(EmptyStateIndicator$1, {
    listType: "message"
  });
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__fast-list"
  }, /*#__PURE__*/React__default.createElement(reactVirtuoso.Virtuoso, {
    ref: virtuoso,
    style: {
      width: '100%',
      height: '100%'
    },
    totalCount: messages.length + (hackNumber || 0),
    item: function item(index) {
      return itemRenderer(messages[index], messages[index - 1]);
    },
    rangeChanged: function rangeChanged(_ref4) {
      var startIndex = _ref4.startIndex;
      if (mounted.current && hasMore && startIndex < 10) loadMore().then(virtuoso.current.adjustForPrependedItems);
    } // scrollSeek={{
    //   enter: (velocity) => Math.abs(velocity) > 220,
    //   exit: (velocity) => Math.abs(velocity) < 30,
    //   change: () => null,
    //   placeholder: ScrollSeekPlaceholder,
    // }}

  }));
};

var MemoizeFastMessageList = /*#__PURE__*/React__default.memo(FastMessageList, deepequal);
function FastMessageListWithContext(props) {
  return /*#__PURE__*/React__default.createElement(ChannelContext.Consumer, null, function (_ref5) {
    var messages = _ref5.messages,
        client = _ref5.client,
        loadMore = _ref5.loadMore,
        hasMore = _ref5.hasMore,
        loadingMore = _ref5.loadingMore;
    return /*#__PURE__*/React__default.createElement(MemoizeFastMessageList, _extends({
      messages: messages,
      client: client,
      loadMore: loadMore,
      hasMore: hasMore,
      isLoading: loadingMore
    }, props));
  });
}

function ownKeys$b(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$b(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$b(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$b(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper$5(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$5(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$5() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
/**
 * Thread - The Thread renders a parent message with a list of replies. Use the standard message list of the main channel's messages.
 * The thread is only used for the list of replies to a message.
 * Underlying MessageList, MessageInput and Message components can be customized using props:
 * - additionalParentMessageProps
 * - additionalMessageListProps
 * - additionalMessageInputProps
 *
 * @example ../../docs/Thread.md
 * @typedef { import('../types').ThreadProps & import('../types').ChannelContextValue & import('../types').TranslationContextValue} Props
 * @extends PureComponent<Props, any>
 */

var Thread$7 = /*#__PURE__*/function (_PureComponent) {
  _inherits(Thread, _PureComponent);

  var _super = _createSuper$5(Thread);

  function Thread() {
    _classCallCheck(this, Thread);

    return _super.apply(this, arguments);
  }

  _createClass(Thread, [{
    key: "render",
    value: function render() {
      if (!this.props.thread) {
        return null;
      }

      var parentID = this.props.thread.id;
      var cid = this.props.channel && this.props.channel.cid;
      var key = "thread-".concat(parentID, "-").concat(cid); // We use a wrapper to make sure the key variable is set.
      // this ensures that if you switch thread the component is recreated

      return /*#__PURE__*/React__default.createElement(ThreadInner, _extends({}, this.props, {
        key: key
      }));
    }
  }]);

  return Thread;
}(React.PureComponent);
/** @extends {PureComponent<Props, any>} */


_defineProperty(Thread$7, "propTypes", {
  /** Display the thread on 100% width of it's container. Useful for mobile style view */
  fullWidth: PropTypes.bool,

  /** Make input focus on mounting thread */
  autoFocus: PropTypes.bool,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  channel: PropTypes.instanceOf(streamChat.Channel).isRequired,

  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  Message:
  /** @type {PropTypes.Validator<React.ComponentType<import('../types').MessageUIComponentProps>>} */
  PropTypes.elementType,

  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   * The thread (the parent [message object](https://getstream.io/chat/docs/#message_format)) */
  thread:
  /** @type {PropTypes.Validator<import('seamless-immutable').ImmutableObject<import('stream-chat').MessageResponse>>} */
  PropTypes.object,

  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   * The array of immutable messages to render. By default they are provided by parent Channel component */
  threadMessages:
  /** @type {PropTypes.Validator<import('seamless-immutable').ImmutableArray<import('stream-chat').MessageResponse>>} */
  PropTypes.array,

  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   *
   * Function which provides next page of thread messages.
   * loadMoreThread is called when infinite scroll wants to load more messages
   * */
  loadMoreThread: PropTypes.func.isRequired,

  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   * If there are more messages available, set to false when the end of pagination is reached.
   * */
  threadHasMore: PropTypes.bool,

  /**
   * **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)**
   * If the thread is currently loading more messages. This is helpful to display a loading indicator on threadlist */
  threadLoadingMore: PropTypes.bool,

  /**
   * Additional props for underlying Message component of parent message at the top.
   * Available props - https://getstream.github.io/stream-chat-react/#message
   * */
  additionalParentMessageProps: PropTypes.object,

  /**
   * Additional props for underlying MessageList component.
   * Available props - https://getstream.github.io/stream-chat-react/#messagelist
   * */
  additionalMessageListProps: PropTypes.object,

  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object,

  /** Customized MessageInput component to used within Thread instead of default MessageInput 
      Useable as follows:
      ```
      <Thread MessageInput={(props) => <MessageInput parent={props.parent} Input={MessageInputSmall} /> }/>
      ```
  */
  MessageInput:
  /** @type {PropTypes.Validator<React.ComponentType<import('../types').MessageInputProps>>} */
  PropTypes.elementType
});

_defineProperty(Thread$7, "defaultProps", {
  threadHasMore: true,
  threadLoadingMore: true,
  fullWidth: false,
  autoFocus: true,
  MessageInput: MessageInput$1
});

var ThreadInner = /*#__PURE__*/function (_React$PureComponent) {
  _inherits(ThreadInner, _React$PureComponent);

  var _super2 = _createSuper$5(ThreadInner);

  /** @param { any } props */
  function ThreadInner(props) {
    var _this;

    _classCallCheck(this, ThreadInner);

    _this = _super2.call(this, props);
    _this.messageList = /*#__PURE__*/React__default.createRef();
    return _this;
  }

  _createClass(ThreadInner, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this$props = this.props,
          thread = _this$props.thread,
          loadMoreThread = _this$props.loadMoreThread;
      var parentID = thread && thread.id;

      if (parentID && (thread === null || thread === void 0 ? void 0 : thread.reply_count) && loadMoreThread) {
        loadMoreThread();
      }
    }
    /** @param {Props} prevProps */

  }, {
    key: "getSnapshotBeforeUpdate",
    value: function getSnapshotBeforeUpdate(prevProps) {
      // Are we adding new items to the list?
      // Capture the scroll position so we can adjust scroll later.
      if (prevProps.threadMessages && this.props.threadMessages && prevProps.threadMessages.length < this.props.threadMessages.length) {
        var list = this.messageList.current;
        return list.clientHeight + list.scrollTop === list.scrollHeight;
      }

      return null;
    }
    /**
     * @param {Props} prevProps
     * @param {any} prevState
     * @param {number} snapshot
     */

  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState, snapshot) {
      var _this2 = this;

      var _this$props2 = this.props,
          thread = _this$props2.thread,
          threadMessages = _this$props2.threadMessages,
          loadMoreThread = _this$props2.loadMoreThread;
      var parentID = thread === null || thread === void 0 ? void 0 : thread.id;

      if (parentID && (thread === null || thread === void 0 ? void 0 : thread.reply_count) && thread.reply_count > 0 && (threadMessages === null || threadMessages === void 0 ? void 0 : threadMessages.length) === 0 && loadMoreThread) {
        loadMoreThread();
      } // If we have a snapshot value, we've just added new items.
      // Adjust scroll so these new items don't push the old ones out of view.
      // (snapshot here is the value returned from getSnapshotBeforeUpdate)


      if (snapshot !== null) {
        var scrollDown = function scrollDown() {
          var list = _this2.messageList.current;
          if (snapshot) list.scrollTop = list.scrollHeight;
        };

        scrollDown(); // scroll down after images load again

        setTimeout(scrollDown, 100);
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props3 = this.props,
          t = _this$props3.t,
          closeThread = _this$props3.closeThread,
          thread = _this$props3.thread;

      if (!thread) {
        return null;
      }

      var read = {};
      return /*#__PURE__*/React__default.createElement("div", {
        className: "str-chat__thread ".concat(this.props.fullWidth ? 'str-chat__thread--full' : '')
      }, /*#__PURE__*/React__default.createElement("div", {
        className: "str-chat__thread-header"
      }, /*#__PURE__*/React__default.createElement("div", {
        className: "str-chat__thread-header-details"
      }, /*#__PURE__*/React__default.createElement("strong", null, t && t('Thread')), /*#__PURE__*/React__default.createElement("small", null, ' ', t && t('{{ replyCount }} replies', {
        replyCount: thread.reply_count
      }))), /*#__PURE__*/React__default.createElement("button", {
        onClick: function onClick(e) {
          return closeThread && closeThread(e);
        },
        className: "str-chat__square-button",
        "data-testid": "close-button"
      }, /*#__PURE__*/React__default.createElement("svg", {
        width: "10",
        height: "10",
        xmlns: "http://www.w3.org/2000/svg"
      }, /*#__PURE__*/React__default.createElement("path", {
        d: "M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z",
        fillRule: "evenodd"
      })))), /*#__PURE__*/React__default.createElement("div", {
        className: "str-chat__thread-list",
        ref: this.messageList
      }, /*#__PURE__*/React__default.createElement(Message$1 // @ts-ignore
      , _extends({
        message: thread,
        initialMessage: true,
        threadList: true,
        Message: this.props.Message // TODO: remove the following line in next release, since we already have additionalParentMessageProps now.

      }, this.props, this.props.additionalParentMessageProps)), /*#__PURE__*/React__default.createElement("div", {
        className: "str-chat__thread-start"
      }, t && t('Start of a new thread')), /*#__PURE__*/React__default.createElement(MessageList$1, _extends({
        messages: this.props.threadMessages,
        read: read,
        threadList: true,
        loadMore: this.props.loadMoreThread,
        hasMore: this.props.threadHasMore,
        loadingMore: this.props.threadLoadingMore,
        Message: this.props.Message
      }, this.props.additionalMessageListProps))), smartRender(this.props.MessageInput, _objectSpread$b({
        Input: MessageInputSmall,
        parent: this.props.thread,
        focus: this.props.autoFocus,
        publishTypingEvent: false
      }, this.props.additionalMessageInputProps)));
    }
  }]);

  return ThreadInner;
}(React__default.PureComponent);

_defineProperty(ThreadInner, "propTypes", {
  /** Channel is passed via the Channel Context */
  channel: PropTypes.object.isRequired,

  /** the thread (just a message) that we're rendering */
  thread: PropTypes.object.isRequired
});

var Thread$8 = withChannelContext(withTranslationContext(Thread$7));

// @ts-check
/**
 * TypingIndicator lists users currently typing
 * @typedef {import('../types').TypingIndicatorProps} Props
 * @type {React.FC<Props>}
 */

var TypingIndicator = function TypingIndicator(props) {
  var typing = Object.values(props.typing);
  var show;

  if (typing.length === 0 || typing.length === 1 && typing[0].user.id === props.client.user.id) {
    show = false;
  } else {
    show = true;
  }

  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__typing-indicator ".concat(show ? 'str-chat__typing-indicator--typing' : '')
  }, /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__typing-indicator__avatars"
  }, typing.filter(function (_ref) {
    var user = _ref.user;
    return user.id !== props.client.user.id;
  }).map(function (_ref2) {
    var user = _ref2.user;
    return /*#__PURE__*/React__default.createElement(Avatar, {
      image: user.image,
      size: 32,
      name: user.name || user.id,
      key: user.id
    });
  })), /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__typing-indicator__dots"
  }, /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__typing-indicator__dot"
  }), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__typing-indicator__dot"
  }), /*#__PURE__*/React__default.createElement("span", {
    className: "str-chat__typing-indicator__dot"
  })));
};

TypingIndicator.propTypes = {
  /** @see See [chat context](https://getstream.github.io/stream-chat-react/#chatcontext) doc */
  // @ts-ignore
  client: PropTypes.object,

  /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channelcontext) doc */
  typing: PropTypes.object.isRequired
};
var TypingIndicator$1 = /*#__PURE__*/React__default.memo(TypingIndicator);

// @ts-check
/**
 * Window - A UI component for conditionally displaying thread or channel.
 *
 * @example ../../docs/Window.md
 * @type { React.FC<import('../types').WindowProps>}
 */

var Window = function Window(_ref) {
  var children = _ref.children,
      _ref$hideOnThread = _ref.hideOnThread,
      hideOnThread = _ref$hideOnThread === void 0 ? false : _ref$hideOnThread;

  var _useContext = React.useContext(ChannelContext),
      thread = _useContext.thread; // If thread is active and window should hide on thread. Return null


  if (thread && hideOnThread) return null;
  return /*#__PURE__*/React__default.createElement("div", {
    className: "str-chat__main-panel"
  }, children);
};

Window.propTypes = {
  /** show or hide the window when a thread is active */
  hideOnThread: PropTypes.bool
};
var Window$1 = /*#__PURE__*/React__default.memo(Window);

exports.Attachment = Attachment;
exports.AttachmentActions = DefaultAttachmentActions;
exports.Audio = DefaultAudio;
exports.AutoCompleteTextarea = ReactTextareaAutocomplete;
exports.Avatar = Avatar;
exports.Card = DefaultCard;
exports.Channel = Channel$1;
exports.ChannelContext = ChannelContext;
exports.ChannelHeader = ChannelHeader$1;
exports.ChannelList = ChannelList$1;
exports.ChannelListMessenger = ChannelListMessenger;
exports.ChannelListTeam = ChannelListTeam;
exports.ChannelPreview = ChannelPreview;
exports.ChannelPreviewCompact = ChannelPreviewCompact$1;
exports.ChannelPreviewCountOnly = ChannelPreviewCountOnly$1;
exports.ChannelPreviewLastMessage = ChannelPreviewLastMessage$1;
exports.ChannelPreviewMessenger = ChannelPreviewMessenger$1;
exports.ChannelSearch = ChannelSearch$1;
exports.Chat = Chat;
exports.ChatAutoComplete = ChatAutoComplete$1;
exports.ChatContext = ChatContext;
exports.ChatDown = ChatDown$1;
exports.CommandItem = CommandItem$1;
exports.DateSeparator = DefaultDateSeparator;
exports.EditMessageForm = EditMessageForm;
exports.EmoticonItem = EmoticonItem$1;
exports.EmptyStateIndicator = EmptyStateIndicator$1;
exports.EventComponent = EventComponent$1;
exports.FastMessageList = FastMessageListWithContext;
exports.FileAttachment = DefaultFile;
exports.Gallery = Gallery$1;
exports.Image = Image;
exports.InfiniteScroll = InfiniteScroll;
exports.InfiniteScrollPaginator = InfiniteScrollPaginator;
exports.Item = Item;
exports.KEY_CODES = KEY_CODES;
exports.List = List;
exports.LoadMoreButton = DefaultLoadMoreButton;
exports.LoadMorePaginator = LoadMorePaginator$1;
exports.LoadingChannels = LoadingChannels$1;
exports.LoadingErrorIndicator = LoadingErrorIndicatorComponent;
exports.LoadingIndicator = DefaultLoadingIndicator;
exports.MESSAGE_ACTIONS = MESSAGE_ACTIONS;
exports.Message = Message$1;
exports.MessageActions = MessageActions;
exports.MessageActionsBox = MessageActionsBox$1;
exports.MessageCommerce = MessageCommerce$1;
exports.MessageInput = MessageInput$1;
exports.MessageInputFlat = MessageInputFlat;
exports.MessageInputLarge = MessageInputLarge;
exports.MessageInputSmall = MessageInputSmall;
exports.MessageList = MessageList$1;
exports.MessageLivestream = MessageLivestream;
exports.MessageNotification = MessageNotification$1;
exports.MessageOptions = MessageOptions;
exports.MessagePropTypes = MessagePropTypes;
exports.MessageRepliesCountButton = MessageRepliesCountButton$1;
exports.MessageSimple = MessageSimple$1;
exports.MessageTeam = MessageTeam$1;
exports.MessageText = MessageText;
exports.Modal = Modal;
exports.ModalImage = ModalImage;
exports.ModalWrapper = ModalComponent;
exports.ReactionSelector = DefaultReactionSelector;
exports.ReactionsList = DefaultReactionsList;
exports.ReverseInfiniteScroll = ReverseInfiniteScroll;
exports.SafeAnchor = SafeAnchor$1;
exports.SendButton = SendButtonComponent;
exports.SimpleReactionsList = DefaultReactionsList$1;
exports.Streami18n = Streami18n;
exports.Thread = Thread$8;
exports.Tooltip = Tooltip$1;
exports.TranslationContext = TranslationContext;
exports.TypingIndicator = TypingIndicator$1;
exports.UserItem = UserItem$1;
exports.Window = Window$1;
exports.areMessagePropsEqual = areMessagePropsEqual;
exports.byDate = byDate;
exports.commonEmoji = commonEmoji;
exports.defaultMinimalEmojis = defaultMinimalEmojis;
exports.defaultScrollToItem = defaultScrollToItem;
exports.emojiData = emojiData;
exports.emojiSetDef = emojiSetDef;
exports.enTranslations = enTranslations;
exports.filterEmoji = filterEmoji;
exports.formatArray = formatArray;
exports.frTranslations = frTranslations;
exports.generateRandomId = generateRandomId;
exports.getImages = getImages;
exports.getMessageActions = getMessageActions;
exports.getNonImageAttachments = getNonImageAttachments;
exports.getReadByTooltipText = getReadByTooltipText;
exports.handleActionWarning = handleActionWarning;
exports.hiTranslations = hiTranslations;
exports.isOnlyEmojis = isOnlyEmojis;
exports.isPromise = isPromise;
exports.isUserMuted = isUserMuted;
exports.itTranslations = itTranslations;
exports.listener = Listeners;
exports.messageHasAttachments = messageHasAttachments;
exports.messageHasReactions = messageHasReactions;
exports.missingUseFlagHandlerParameterWarning = missingUseFlagHandlerParameterWarning;
exports.missingUseMuteHandlerParamsWarning = missingUseMuteHandlerParamsWarning;
exports.nlTranslations = nlTranslations;
exports.reactionHandlerWarning = reactionHandlerWarning;
exports.renderText = renderText;
exports.ruTranslations = ruTranslations;
exports.shouldMessageComponentUpdate = shouldMessageComponentUpdate;
exports.smartRender = smartRender;
exports.trTranslations = trTranslations;
exports.truncate = truncate;
exports.useActionHandler = useActionHandler;
exports.useChannelEditMessageHandler = useEditMessageHandler;
exports.useChannelMentionsHandler = useMentionsHandlers;
exports.useDeleteHandler = useDeleteHandler;
exports.useEditHandler = useEditHandler;
exports.useFlagHandler = useFlagHandler;
exports.useMentionsHandler = useMentionsHandler;
exports.useMentionsUIHandler = useMentionsUIHandler;
exports.useMessageInput = useMessageInputState;
exports.useMuteHandler = useMuteHandler;
exports.useOpenThreadHandler = useOpenThreadHandler;
exports.useReactionClick = useReactionClick;
exports.useReactionHandler = useReactionHandler;
exports.useRetryHandler = useRetryHandler;
exports.useUserHandler = useUserHandler;
exports.useUserRole = useUserRole;
exports.validateAndGetMessage = validateAndGetMessage;
exports.withChannelContext = withChannelContext;
exports.withChatContext = withChatContext;
exports.withTranslationContext = withTranslationContext;
//# sourceMappingURL=index.js.map
