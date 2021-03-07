'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _uuid = require('uuid');

var _mockBuilders = require('mock-builders');

var _Attachment = _interopRequireWildcard(require('../Attachment'));

var Audio = function Audio() {
  return /*#__PURE__*/ _react.default.createElement('div', {
    'data-testid': 'audio-attachment',
  });
};

var Card = function Card() {
  return /*#__PURE__*/ _react.default.createElement('div', {
    'data-testid': 'card-attachment',
  });
};

var Media = function Media() {
  return /*#__PURE__*/ _react.default.createElement('div', {
    'data-testid': 'media-attachment',
  });
};

var AttachmentActions = function AttachmentActions() {
  return /*#__PURE__*/ _react.default.createElement('div', {
    'data-testid': 'attachment-actions',
  });
};

var Image = function Image() {
  return /*#__PURE__*/ _react.default.createElement('div', {
    'data-testid': 'image-attachment',
  });
};

var File = function File() {
  return /*#__PURE__*/ _react.default.createElement('div', {
    'data-testid': 'file-attachment',
  });
};

var Gallery = function Gallery() {
  return /*#__PURE__*/ _react.default.createElement('div', {
    'data-testid': 'gallery-attachment',
  });
};

var getAttachmentComponent = function getAttachmentComponent(props) {
  return /*#__PURE__*/ _react.default.createElement(
    _Attachment.default,
    (0, _extends2.default)(
      {
        Audio: Audio,
        Card: Card,
        Media: Media,
        AttachmentActions: AttachmentActions,
        Image: Image,
        File: File,
        Gallery: Gallery,
      },
      props,
    ),
  );
};

describe('Attachment', function () {
  it(
    'should render Audio component for "audio" type attachment',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var attachment, _render, getByTestId;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                attachment = (0, _mockBuilders.generateAudioAttachment)();
                (_render = (0, _react2.render)(
                  getAttachmentComponent({
                    attachments: [attachment],
                  }),
                )),
                  (getByTestId = _render.getByTestId);
                _context.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('audio-attachment')).toBeInTheDocument();
                });

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should render File component for "file" type attachment',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var attachment, _render2, getByTestId;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                attachment = (0, _mockBuilders.generateFileAttachment)();
                (_render2 = (0, _react2.render)(
                  getAttachmentComponent({
                    attachments: [attachment],
                  }),
                )),
                  (getByTestId = _render2.getByTestId);
                _context2.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('file-attachment')).toBeInTheDocument();
                });

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it(
    'should render Card component for "imgur" type attachment',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var attachment, _render3, getByTestId;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                attachment = (0, _mockBuilders.generateImgurAttachment)();
                (_render3 = (0, _react2.render)(
                  getAttachmentComponent({
                    attachments: [attachment],
                  }),
                )),
                  (getByTestId = _render3.getByTestId);
                _context3.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('card-attachment')).toBeInTheDocument();
                });

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should render Card component for "giphy" type attachment',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var attachment, _render4, getByTestId;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                attachment = (0, _mockBuilders.generateGiphyAttachment)();
                (_render4 = (0, _react2.render)(
                  getAttachmentComponent({
                    attachments: [attachment],
                  }),
                )),
                  (getByTestId = _render4.getByTestId);
                _context4.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('card-attachment')).toBeInTheDocument();
                });

              case 4:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  describe('gallery  type attachment', function () {
    it(
      'should render Gallery component if attachments contains multiple type "image" attachments',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
          var image, attachments, _render5, getByTestId;

          return _regenerator.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch ((_context5.prev = _context5.next)) {
                case 0:
                  image = (0, _mockBuilders.generateImageAttachment)({
                    title_link: undefined,
                    og_scrape_url: undefined,
                  });
                  attachments = [image, image, image];
                  (_render5 = (0, _react2.render)(
                    getAttachmentComponent({
                      attachments,
                    }),
                  )),
                    (getByTestId = _render5.getByTestId);
                  _context5.next = 5;
                  return (0, _react2.waitFor)(function () {
                    expect(
                      getByTestId('gallery-attachment'),
                    ).toBeInTheDocument();
                  });

                case 5:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5);
        }),
      ),
    );
    it(
      'should render Image and Card if one image has title_link or og_scrape_url',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
          var image, card, attachments, _render6, getByTestId;

          return _regenerator.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch ((_context6.prev = _context6.next)) {
                case 0:
                  image = (0, _mockBuilders.generateImageAttachment)({
                    title_link: undefined,
                    og_scrape_url: undefined,
                  });
                  card = (0, _mockBuilders.generateImageAttachment)();
                  attachments = [card, image];
                  (_render6 = (0, _react2.render)(
                    getAttachmentComponent({
                      attachments,
                    }),
                  )),
                    (getByTestId = _render6.getByTestId);
                  _context6.next = 6;
                  return (0, _react2.waitFor)(function () {
                    expect(getByTestId('image-attachment')).toBeInTheDocument();
                    expect(getByTestId('card-attachment')).toBeInTheDocument();
                  });

                case 6:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6);
        }),
      ),
    );
    it(
      'should render Gallery and Card if threres multiple images without and image with title_link or og_scrape_url',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
          var image, card, attachments, _render7, getByTestId;

          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch ((_context7.prev = _context7.next)) {
                case 0:
                  image = (0, _mockBuilders.generateImageAttachment)({
                    title_link: undefined,
                    og_scrape_url: undefined,
                  });
                  card = (0, _mockBuilders.generateImageAttachment)();
                  attachments = [image, image, card];
                  (_render7 = (0, _react2.render)(
                    getAttachmentComponent({
                      attachments,
                    }),
                  )),
                    (getByTestId = _render7.getByTestId);
                  _context7.next = 6;
                  return (0, _react2.waitFor)(function () {
                    expect(
                      getByTestId('gallery-attachment'),
                    ).toBeInTheDocument();
                    expect(getByTestId('card-attachment')).toBeInTheDocument();
                  });

                case 6:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7);
        }),
      ),
    );
  });
  describe('image type attachment', function () {
    it(
      'should render Card component if attachment has title_link or og_scrape_url',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
          var attachment, _render8, getByTestId;

          return _regenerator.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch ((_context8.prev = _context8.next)) {
                case 0:
                  attachment = (0, _mockBuilders.generateImageAttachment)();
                  (_render8 = (0, _react2.render)(
                    getAttachmentComponent({
                      attachments: [attachment],
                    }),
                  )),
                    (getByTestId = _render8.getByTestId);
                  _context8.next = 4;
                  return (0, _react2.waitFor)(function () {
                    expect(getByTestId('card-attachment')).toBeInTheDocument();
                  });

                case 4:
                case 'end':
                  return _context8.stop();
              }
            }
          }, _callee8);
        }),
      ),
    );
    it(
      'should otherwise render Image component',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
          var attachment, _render9, getByTestId;

          return _regenerator.default.wrap(function _callee9$(_context9) {
            while (1) {
              switch ((_context9.prev = _context9.next)) {
                case 0:
                  attachment = (0, _mockBuilders.generateImageAttachment)({
                    title_link: undefined,
                    og_scrape_url: undefined,
                  });
                  (_render9 = (0, _react2.render)(
                    getAttachmentComponent({
                      attachments: [attachment],
                    }),
                  )),
                    (getByTestId = _render9.getByTestId);
                  _context9.next = 4;
                  return (0, _react2.waitFor)(function () {
                    expect(getByTestId('image-attachment')).toBeInTheDocument();
                  });

                case 4:
                case 'end':
                  return _context9.stop();
              }
            }
          }, _callee9);
        }),
      ),
    );
    it(
      'should render AttachmentActions component if attachment has actions',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
          var attachment, _render10, getByTestId;

          return _regenerator.default.wrap(function _callee10$(_context10) {
            while (1) {
              switch ((_context10.prev = _context10.next)) {
                case 0:
                  attachment = (0, _mockBuilders.generateImageAttachment)({
                    actions: [
                      (0, _mockBuilders.generateAttachmentAction)(),
                      (0, _mockBuilders.generateAttachmentAction)(),
                    ],
                  });
                  (_render10 = (0, _react2.render)(
                    getAttachmentComponent({
                      attachments: [attachment],
                    }),
                  )),
                    (getByTestId = _render10.getByTestId);
                  _context10.next = 4;
                  return (0, _react2.waitFor)(function () {
                    expect(
                      getByTestId('attachment-actions'),
                    ).toBeInTheDocument();
                  });

                case 4:
                case 'end':
                  return _context10.stop();
              }
            }
          }, _callee10);
        }),
      ),
    );
  });
  describe('video type attachment', function () {
    it.each(
      _Attachment.SUPPORTED_VIDEO_FORMATS.map(function (f) {
        return [f];
      }),
    )(
      'should render Media component for video of %s mime-type attachment',
      /*#__PURE__*/ (function () {
        var _ref11 = (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee11(
            mime_type,
          ) {
            var attachment, _render11, getByTestId;

            return _regenerator.default.wrap(function _callee11$(_context11) {
              while (1) {
                switch ((_context11.prev = _context11.next)) {
                  case 0:
                    attachment = (0, _mockBuilders.generateVideoAttachment)({
                      mime_type,
                    });
                    (_render11 = (0, _react2.render)(
                      getAttachmentComponent({
                        attachments: [attachment],
                      }),
                    )),
                      (getByTestId = _render11.getByTestId);
                    _context11.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(
                        getByTestId('media-attachment'),
                      ).toBeInTheDocument();
                    });

                  case 4:
                  case 'end':
                    return _context11.stop();
                }
              }
            }, _callee11);
          }),
        );

        return function (_x) {
          return _ref11.apply(this, arguments);
        };
      })(),
    );
    it(
      'should render video player if video type is video',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
          var attachment, _render12, getByTestId;

          return _regenerator.default.wrap(function _callee12$(_context12) {
            while (1) {
              switch ((_context12.prev = _context12.next)) {
                case 0:
                  attachment = (0, _mockBuilders.generateVideoAttachment)({
                    asset_url: 'https://www.youtube.com/embed/UaeOlIa0LL8',
                    author_name: 'YouTube',
                    image_url:
                      'https://i.ytimg.com/vi/UaeOlIa0LL8/maxresdefault.jpg',
                    og_scrape_url:
                      'https://www.youtube.com/watch?v=UaeOlIa0LL8',
                    text:
                      "It's Gmod TTT! Praise Ben in the church of Bon! Hail the great jetstream in Gmod TTT! Confused? Check out the new roles here: https://twitter.com/yogscast/st...",
                    thumb_url:
                      'https://i.ytimg.com/vi/UaeOlIa0LL8/maxresdefault.jpg',
                    title: 'THE CHURCH OF BON! | Gmod TTT',
                    title_link: 'https://www.youtube.com/watch?v=UaeOlIa0LL8',
                    type: 'video',
                    mime_type: 'nothing',
                  });
                  (_render12 = (0, _react2.render)(
                    getAttachmentComponent({
                      attachments: [attachment],
                    }),
                  )),
                    (getByTestId = _render12.getByTestId);
                  _context12.next = 4;
                  return (0, _react2.waitFor)(function () {
                    expect(getByTestId('media-attachment')).toBeInTheDocument();
                  });

                case 4:
                case 'end':
                  return _context12.stop();
              }
            }
          }, _callee12);
        }),
      ),
    );
  });
  it(
    'should render "Card" if attachment type is not recognized, but has title_link or og_scrape_url',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
        var _render13, getByTestId;

        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch ((_context13.prev = _context13.next)) {
              case 0:
                (_render13 = (0, _react2.render)(
                  getAttachmentComponent({
                    attachments: [
                      (0, _mockBuilders.generateCardAttachment)({
                        type: (0, _uuid.v4)(),
                      }),
                    ],
                  }),
                )),
                  (getByTestId = _render13.getByTestId);
                _context13.next = 3;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('card-attachment')).toBeInTheDocument();
                });

              case 3:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13);
      }),
    ),
  );
});
