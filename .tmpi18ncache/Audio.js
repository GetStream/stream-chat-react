'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = _interopRequireWildcard(require('react'));

// @ts-check
var progressUpdateInterval = 500;
/**
 * Audio attachment with play/pause button and progress bar
 * @param {import("types").AudioProps} props
 */

var Audio = function Audio(_ref) {
  var og = _ref.og;
  var audioRef = (0, _react.useRef)(
    /** @type {HTMLAudioElement | null} */
    null,
  );

  var _useState = (0, _react.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    isPlaying = _useState2[0],
    setIsPlaying = _useState2[1];

  var _useState3 = (0, _react.useState)(0),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    progress = _useState4[0],
    setProgress = _useState4[1];

  var updateProgress = (0, _react.useCallback)(
    function () {
      if (audioRef.current !== null) {
        var position = audioRef.current.currentTime;
        var duration = audioRef.current.duration;
        var currentProgress = (100 / duration) * position;
        setProgress(currentProgress);

        if (position === duration) {
          setIsPlaying(false);
        }
      }
    },
    [audioRef],
  );
  (0, _react.useEffect)(
    function () {
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
    },
    [isPlaying, updateProgress],
  );
  var asset_url = og.asset_url,
    image_url = og.image_url,
    title = og.title,
    description = og.description,
    text = og.text;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__audio',
    },
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__audio__wrapper',
      },
      /*#__PURE__*/ _react.default.createElement(
        'audio',
        {
          ref: audioRef,
        },
        /*#__PURE__*/ _react.default.createElement('source', {
          src: asset_url,
          type: 'audio/mp3',
          'data-testid': 'audio-source',
        }),
      ),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__audio__image',
        },
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__audio__image--overlay',
          },
          !isPlaying
            ? /*#__PURE__*/ _react.default.createElement(
                'div',
                {
                  onClick: function onClick() {
                    return setIsPlaying(true);
                  },
                  className: 'str-chat__audio__image--button',
                  'data-testid': 'play-audio',
                },
                /*#__PURE__*/ _react.default.createElement(
                  'svg',
                  {
                    width: '40',
                    height: '40',
                    viewBox: '0 0 64 64',
                    xmlns: 'http://www.w3.org/2000/svg',
                  },
                  /*#__PURE__*/ _react.default.createElement('path', {
                    d:
                      'M32 58c14.36 0 26-11.64 26-26S46.36 6 32 6 6 17.64 6 32s11.64 26 26 26zm0 6C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm13.237-28.412L26.135 45.625a3.27 3.27 0 0 1-4.426-1.4 3.319 3.319 0 0 1-.372-1.47L21 23.36c-.032-1.823 1.41-3.327 3.222-3.358a3.263 3.263 0 0 1 1.473.322l19.438 9.36a3.311 3.311 0 0 1 .103 5.905z',
                    fillRule: 'nonzero',
                  }),
                ),
              )
            : /*#__PURE__*/ _react.default.createElement(
                'div',
                {
                  onClick: function onClick() {
                    return setIsPlaying(false);
                  },
                  className: 'str-chat__audio__image--button',
                  'data-testid': 'pause-audio',
                },
                /*#__PURE__*/ _react.default.createElement(
                  'svg',
                  {
                    width: '40',
                    height: '40',
                    viewBox: '0 0 64 64',
                    xmlns: 'http://www.w3.org/2000/svg',
                  },
                  /*#__PURE__*/ _react.default.createElement('path', {
                    d:
                      'M32 58.215c14.478 0 26.215-11.737 26.215-26.215S46.478 5.785 32 5.785 5.785 17.522 5.785 32 17.522 58.215 32 58.215zM32 64C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm-7.412-45.56h2.892a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.892a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17zm12.293 0h2.893a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.893a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17z',
                    fillRule: 'nonzero',
                  }),
                ),
              ),
        ),
        image_url &&
          /*#__PURE__*/ _react.default.createElement('img', {
            src: image_url,
            alt: ''.concat(description),
          }),
      ),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__audio__content',
        },
        /*#__PURE__*/ _react.default.createElement(
          'span',
          {
            className: 'str-chat__audio__content--title',
          },
          /*#__PURE__*/ _react.default.createElement('strong', null, title),
        ),
        /*#__PURE__*/ _react.default.createElement(
          'span',
          {
            className: 'str-chat__audio__content--subtitle',
          },
          text,
        ),
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__audio__content--progress',
          },
          /*#__PURE__*/ _react.default.createElement('div', {
            style: {
              width: ''.concat(progress, '%'),
            },
            'data-testid': 'audio-progress',
          }),
        ),
      ),
    ),
  );
};

var _default = /*#__PURE__*/ _react.default.memo(Audio);

exports.default = _default;
