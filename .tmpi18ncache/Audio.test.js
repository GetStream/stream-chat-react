'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _Audio = _interopRequireDefault(require('../Audio'));

var mockAudioAsset = (0, _mockBuilders.generateAudioAttachment)();

var renderComponent = function renderComponent() {
  var props =
    arguments.length > 0 && arguments[0] !== undefined
      ? arguments[0]
      : {
          og: mockAudioAsset,
        };
  return (0, _react2.render)(
    /*#__PURE__*/ _react.default.createElement(_Audio.default, props),
  );
};

var playButtonTestId = 'play-audio';
var pauseButtonTestId = 'pause-audio';
describe('Audio', function () {
  beforeAll(function () {
    // jsdom doesn't define these, so mock them instead
    // see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#Methods
    jest
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(function () {});
    jest
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(function () {});
  });
  afterEach(_react2.cleanup);
  it('should render title and description as text, and render the image with description as alt tag', function () {
    var _renderComponent = renderComponent(),
      getByText = _renderComponent.getByText,
      getByAltText = _renderComponent.getByAltText;

    expect(getByText(mockAudioAsset.title)).toBeInTheDocument();
    expect(getByText(mockAudioAsset.text)).toBeInTheDocument();
    var image = getByAltText(mockAudioAsset.description);
    expect(image).toBeInTheDocument();
    expect(image.src).toBe(mockAudioAsset.image_url);
  });
  it('should render an audio element with the right source', function () {
    var _renderComponent2 = renderComponent(),
      getByTestId = _renderComponent2.getByTestId;

    var source = getByTestId('audio-source');
    expect(source).toBeInTheDocument();
    expect(source.src).toBe(mockAudioAsset.asset_url);
    expect(source.parentElement).toBeInstanceOf(HTMLAudioElement);
  });
  it(
    'should show the correct button if the song is paused/playing',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var _renderComponent3, queryByTestId, playButton, pauseButton;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                (_renderComponent3 = renderComponent()),
                  (queryByTestId = _renderComponent3.queryByTestId);

                playButton = function playButton() {
                  return queryByTestId(playButtonTestId);
                };

                pauseButton = function pauseButton() {
                  return queryByTestId(pauseButtonTestId);
                };

                _context.t0 = expect;
                _context.next = 6;
                return playButton();

              case 6:
                _context.t1 = _context.sent;
                (0, _context.t0)(_context.t1).toBeInTheDocument();
                _context.t2 = expect;
                _context.next = 11;
                return pauseButton();

              case 11:
                _context.t3 = _context.sent;
                (0, _context.t2)(_context.t3).not.toBeInTheDocument();

                _react2.fireEvent.click(playButton());

                _context.t4 = expect;
                _context.next = 17;
                return playButton();

              case 17:
                _context.t5 = _context.sent;
                (0, _context.t4)(_context.t5).not.toBeInTheDocument();
                _context.t6 = expect;
                _context.next = 22;
                return pauseButton();

              case 22:
                _context.t7 = _context.sent;
                (0, _context.t6)(_context.t7).toBeInTheDocument();

                _react2.fireEvent.click(pauseButton());

                _context.t8 = expect;
                _context.next = 28;
                return playButton();

              case 28:
                _context.t9 = _context.sent;
                (0, _context.t8)(_context.t9).toBeInTheDocument();
                _context.t10 = expect;
                _context.next = 33;
                return pauseButton();

              case 33:
                _context.t11 = _context.sent;
                (0, _context.t10)(_context.t11).not.toBeInTheDocument();

              case 35:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it('should poll for progress every 500ms if the file is played, and stop doing that when it is paused', function () {
    var _renderComponent4 = renderComponent(),
      getByTestId = _renderComponent4.getByTestId;

    var intervalId;
    var setIntervalSpy = jest
      .spyOn(window, 'setInterval')
      .mockImplementationOnce(function () {
        intervalId = 'something';
        return intervalId;
      });
    var clearIntervalSpy = jest.spyOn(window, 'clearInterval');

    _react2.fireEvent.click(getByTestId(playButtonTestId));

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 500);

    _react2.fireEvent.click(getByTestId(pauseButtonTestId));

    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
  });
  it('should clean up the progress interval if the component is unmounted while the file is playing', function () {
    var _renderComponent5 = renderComponent(),
      getByTestId = _renderComponent5.getByTestId,
      _renderComponent5$unm = _renderComponent5.unmount,
      unmount =
        _renderComponent5$unm === void 0
          ? _react2.cleanup
          : _renderComponent5$unm;

    var intervalId;
    jest.spyOn(window, 'setInterval').mockImplementationOnce(function () {
      intervalId = 'something';
      return intervalId;
    });

    _react2.fireEvent.click(getByTestId(playButtonTestId));

    var clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
  });
  it(
    'should show the correct progress',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var _renderComponent6, getByTestId;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                (_renderComponent6 = renderComponent()),
                  (getByTestId = _renderComponent6.getByTestId);
                jest
                  .spyOn(HTMLAudioElement.prototype, 'duration', 'get')
                  .mockImplementationOnce(function () {
                    return 100;
                  });
                jest
                  .spyOn(HTMLAudioElement.prototype, 'currentTime', 'get')
                  .mockImplementationOnce(function () {
                    return 50;
                  });

                _react2.fireEvent.click(getByTestId(playButtonTestId));

                _context2.next = 6;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('audio-progress')).toHaveStyle({
                    width: '50%',
                  });
                });

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
});
