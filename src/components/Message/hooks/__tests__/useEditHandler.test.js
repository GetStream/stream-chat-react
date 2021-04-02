import { act, renderHook } from '@testing-library/react-hooks';
import { useEditHandler } from '../useEditHandler';

const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

function renderUseEditHandler(
  customInitialState = undefined,
  customSetEditingHandler = undefined,
  customClearEditing = undefined,
) {
  const { result } = renderHook(() =>
    useEditHandler(customInitialState, customSetEditingHandler, customClearEditing),
  );
  return result;
}

describe('useEditHandler custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should generate an editing state, a function to set it and a function to delete it', () => {
    const renderedHook = renderUseEditHandler();
    expect(renderedHook.current.editing).toBe(false);
    expect(typeof renderedHook.current.setEdit).toBe('function');
    expect(typeof renderedHook.current.clearEdit).toBe('function');
  });

  it('should initialize with a custom initial state when called', () => {
    const renderedHook = renderUseEditHandler(true);
    expect(renderedHook.current.editing).toBe(true);
  });

  it('should prevent click event from bubbling when setting edit state', () => {
    const renderedHook = renderUseEditHandler();
    act(() => renderedHook.current.setEdit(mouseEventMock));
    expect(mouseEventMock.preventDefault).toHaveBeenCalledWith();
  });

  it('should set editing to true when the set editing function is called', () => {
    const renderedHook = renderUseEditHandler();
    expect(renderedHook.current.editing).toBe(false);
    act(() => renderedHook.current.setEdit(mouseEventMock));
    expect(renderedHook.current.editing).toBe(true);
  });

  it('should call the custom editing handler when one is set', () => {
    const customSetEditingHandler = jest.fn();
    const renderedHook = renderUseEditHandler(undefined, customSetEditingHandler);
    expect(customSetEditingHandler).not.toHaveBeenCalled();
    act(() => renderedHook.current.setEdit(mouseEventMock));
    expect(customSetEditingHandler).toHaveBeenCalledWith(mouseEventMock);
  });

  it('should prevent click event from bubbling when clearing the edit state', () => {
    const renderedHook = renderUseEditHandler();
    act(() => renderedHook.current.clearEdit(mouseEventMock));
    expect(mouseEventMock.preventDefault).toHaveBeenCalledWith();
  });

  it('should set editing to false when the set editing function is called', () => {
    const renderedHook = renderUseEditHandler(true);
    expect(renderedHook.current.editing).toBe(true);
    act(() => renderedHook.current.clearEdit(mouseEventMock));
    expect(renderedHook.current.editing).toBe(false);
  });

  it('should call the custom clear editing handler when one is set', () => {
    const customClearEditingHandler = jest.fn();
    const renderedHook = renderUseEditHandler(undefined, undefined, customClearEditingHandler);
    expect(customClearEditingHandler).not.toHaveBeenCalled();
    act(() => renderedHook.current.clearEdit(mouseEventMock));
    expect(customClearEditingHandler).toHaveBeenCalledWith(mouseEventMock);
  });
});
