'use strict';

var _reactHooks = require('@testing-library/react-hooks');

var _useEditHandler = require('../useEditHandler');

var mouseEventMock = {
  preventDefault: jest.fn(function () {}),
};

function renderUseEditHandler() {
  var customInitialState =
    arguments.length > 0 && arguments[0] !== undefined
      ? arguments[0]
      : undefined;
  var customSetEditingHandler =
    arguments.length > 1 && arguments[1] !== undefined
      ? arguments[1]
      : undefined;
  var customClearEditing =
    arguments.length > 2 && arguments[2] !== undefined
      ? arguments[2]
      : undefined;

  var _renderHook = (0, _reactHooks.renderHook)(function () {
      return (0,
      _useEditHandler.useEditHandler)(customInitialState, customSetEditingHandler, customClearEditing);
    }),
    result = _renderHook.result;

  return result;
}

describe('useEditHandler custom hook', function () {
  afterEach(jest.clearAllMocks);
  it('should generate an editing state, a function to set it and a function to delete it', function () {
    var renderedHook = renderUseEditHandler();
    expect(renderedHook.current.editing).toBe(false);
    expect(typeof renderedHook.current.setEdit).toBe('function');
    expect(typeof renderedHook.current.clearEdit).toBe('function');
  });
  it('should initialize with a custom initial state when called', function () {
    var renderedHook = renderUseEditHandler(true);
    expect(renderedHook.current.editing).toBe(true);
  });
  it('should prevent click event from bubbling when setting edit state', function () {
    var renderedHook = renderUseEditHandler();
    (0, _reactHooks.act)(function () {
      return renderedHook.current.setEdit(mouseEventMock);
    });
    expect(mouseEventMock.preventDefault).toHaveBeenCalledWith();
  });
  it('should set editing to true when the set editing function is called', function () {
    var renderedHook = renderUseEditHandler();
    expect(renderedHook.current.editing).toBe(false);
    (0, _reactHooks.act)(function () {
      return renderedHook.current.setEdit(mouseEventMock);
    });
    expect(renderedHook.current.editing).toBe(true);
  });
  it('should call the custom editing handler when one is set', function () {
    var customSetEditingHandler = jest.fn();
    var renderedHook = renderUseEditHandler(undefined, customSetEditingHandler);
    expect(customSetEditingHandler).not.toHaveBeenCalled();
    (0, _reactHooks.act)(function () {
      return renderedHook.current.setEdit(mouseEventMock);
    });
    expect(customSetEditingHandler).toHaveBeenCalledWith(mouseEventMock);
  });
  it('should prevent click event from bubbling when clearing the edit state', function () {
    var renderedHook = renderUseEditHandler();
    (0, _reactHooks.act)(function () {
      return renderedHook.current.clearEdit(mouseEventMock);
    });
    expect(mouseEventMock.preventDefault).toHaveBeenCalledWith();
  });
  it('should set editing to false when the set editing function is called', function () {
    var renderedHook = renderUseEditHandler(true);
    expect(renderedHook.current.editing).toBe(true);
    (0, _reactHooks.act)(function () {
      return renderedHook.current.clearEdit(mouseEventMock);
    });
    expect(renderedHook.current.editing).toBe(false);
  });
  it('should call the custom clear editing handler when one is set', function () {
    var customClearEditingHandler = jest.fn();
    var renderedHook = renderUseEditHandler(
      undefined,
      undefined,
      customClearEditingHandler,
    );
    expect(customClearEditingHandler).not.toHaveBeenCalled();
    (0, _reactHooks.act)(function () {
      return renderedHook.current.clearEdit(mouseEventMock);
    });
    expect(customClearEditingHandler).toHaveBeenCalledWith(mouseEventMock);
  });
});
