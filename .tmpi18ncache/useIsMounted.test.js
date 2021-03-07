'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _reactHooks = require('@testing-library/react-hooks');

var _useIsMounted = _interopRequireDefault(require('../hooks/useIsMounted'));

describe('useIsMounted hook', function () {
  it('should set the value to false after unmounting', function () {
    var renderResult = (0, _reactHooks.renderHook)(function () {
      return (0, _useIsMounted.default)();
    });
    var ref = renderResult.result.current;
    expect(ref.current).toBe(true);
    (0, _reactHooks.act)(function () {
      renderResult.unmount();
    });
    expect(ref.current).toBe(false);
  });
});
