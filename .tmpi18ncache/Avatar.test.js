'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _Avatar = _interopRequireDefault(require('../Avatar'));

afterEach(_react2.cleanup); // eslint-disable-line

describe('Avatar', function () {
  it('should render component with default props', function () {
    var tree = _reactTestRenderer.default
      .create(/*#__PURE__*/ _react.default.createElement(_Avatar.default, null))
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__avatar str-chat__avatar--circle"\n        data-testid="avatar"\n        onClick={[Function]}\n        onMouseOver={[Function]}\n        style={\n          Object {\n            "flexBasis": "32px",\n            "fontSize": "16px",\n            "height": "32px",\n            "lineHeight": "32px",\n            "width": "32px",\n          }\n        }\n      >\n        <div\n          className="str-chat__avatar-fallback"\n          data-testid="avatar-fallback"\n        >\n          \n        </div>\n      </div>\n    ',
    );
  });
  it('should render component with default props and image prop', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          image: 'random',
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__avatar str-chat__avatar--circle"\n        data-testid="avatar"\n        onClick={[Function]}\n        onMouseOver={[Function]}\n        style={\n          Object {\n            "flexBasis": "32px",\n            "fontSize": "16px",\n            "height": "32px",\n            "lineHeight": "32px",\n            "width": "32px",\n          }\n        }\n      >\n        <img\n          alt=""\n          className="str-chat__avatar-image"\n          data-testid="avatar-img"\n          onError={[Function]}\n          onLoad={[Function]}\n          src="random"\n          style={\n            Object {\n              "flexBasis": "32px",\n              "height": "32px",\n              "objectFit": "cover",\n              "width": "32px",\n            }\n          }\n        />\n      </div>\n    ',
    );
  });
  it('should render with different shape', function () {
    var shape = 'square';

    var _render = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          shape: shape,
        }),
      ),
      getByTestId = _render.getByTestId;

    expect(getByTestId('avatar')).toHaveClass(
      'str-chat__avatar--'.concat(shape),
    );
  });
  it('should render with different size', function () {
    var size = 24;

    var _render2 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          size: size,
        }),
      ),
      getByTestId = _render2.getByTestId;

    expect(getByTestId('avatar')).toHaveStyle({
      width: ''.concat(size, 'px'),
      height: ''.concat(size, 'px'),
      flexBasis: ''.concat(size, 'px'),
      lineHeight: ''.concat(size, 'px'),
      fontSize: ''.concat(size / 2, 'px'),
    });
  });
  it('should render with different size and image', function () {
    var size = 24;

    var _render3 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          size: size,
          image: 'randomImage',
        }),
      ),
      getByTestId = _render3.getByTestId;

    expect(getByTestId('avatar-img')).toHaveStyle({
      width: ''.concat(size, 'px'),
      height: ''.concat(size, 'px'),
      flexBasis: ''.concat(size, 'px'),
      objectFit: 'cover',
    });
  });
  it('should render initials as alt and title', function () {
    var name = 'Cherry Blossom';

    var _render4 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          name: name,
          image: 'randomImage',
        }),
      ),
      getByTitle = _render4.getByTitle,
      getByAltText = _render4.getByAltText;

    expect(getByTitle(name)).toBeInTheDocument();
    expect(getByAltText(name[0])).toBeInTheDocument();
  });
  it('should render initials as fallback when no image is supplied', function () {
    var _render5 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          name: 'frank N. Stein',
        }),
      ),
      getByTestId = _render5.getByTestId,
      queryByTestId = _render5.queryByTestId;

    expect(getByTestId('avatar-fallback')).toHaveTextContent('f');
    expect(queryByTestId('avatar-img')).toBeNull();
  });
  it('should call onClick prop on user click', function () {
    var onClick = jest.fn();

    var _render6 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          onClick: onClick,
        }),
      ),
      getByTestId = _render6.getByTestId;

    expect(onClick).toHaveBeenCalledTimes(0);

    _react2.fireEvent.click(getByTestId('avatar'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should call onMouseOver prop on user hover', function () {
    var onMouseOver = jest.fn();

    var _render7 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          onMouseOver: onMouseOver,
        }),
      ),
      getByTestId = _render7.getByTestId;

    expect(onMouseOver).toHaveBeenCalledTimes(0);

    _react2.fireEvent.mouseOver(getByTestId('avatar'));

    expect(onMouseOver).toHaveBeenCalledTimes(1);
  });
  it('should update img class on img load', function () {
    var _render8 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          image: 'randomImage',
        }),
      ),
      getByTestId = _render8.getByTestId;

    var img = getByTestId('avatar-img');
    expect(img).not.toHaveClass('str-chat__avatar-image--loaded');

    _react2.fireEvent.load(img);

    expect(img).toHaveClass('str-chat__avatar-image--loaded');
  });
  it('should render fallback initials on img error', function () {
    var _render9 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          name: 'Olive',
          image: 'randomImage',
        }),
      ),
      getByTestId = _render9.getByTestId,
      queryByTestId = _render9.queryByTestId;

    var img = getByTestId('avatar-img');
    expect(img).toBeInTheDocument();
    expect(queryByTestId('avatar-fallback')).toBeNull();

    _react2.fireEvent.error(img);

    expect(img).not.toBeInTheDocument();
    expect(getByTestId('avatar-fallback')).toBeInTheDocument();
  });
  it('should render new img on props change for errored img', function () {
    var _render10 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
          image: 'randomImage',
        }),
      ),
      getByTestId = _render10.getByTestId,
      queryByTestId = _render10.queryByTestId,
      rerender = _render10.rerender;

    _react2.fireEvent.error(getByTestId('avatar-img'));

    expect(queryByTestId('avatar-img')).toBeNull();
    rerender(
      /*#__PURE__*/ _react.default.createElement(_Avatar.default, {
        image: 'anotherImage',
      }),
    );
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'anotherImage');
  });
});
