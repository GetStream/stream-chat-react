'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

require('@testing-library/jest-dom');

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _FileAttachment = _interopRequireDefault(require('../FileAttachment'));

var getComponent = function getComponent(attachment) {
  return /*#__PURE__*/ _react.default.createElement(_FileAttachment.default, {
    attachment: attachment,
  });
};

describe('File', function () {
  it('should render File component', function () {
    var file = {
      type: 'file',
      mime_type: 'application/pdf',
      title: 'Nice file',
      asset_url:
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: 1337,
      text: 'My file',
    };

    var tree = _reactTestRenderer.default.create(getComponent(file)).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
