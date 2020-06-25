import { renderHook } from '@testing-library/react-hooks';
import { generateMessage } from 'mock-builders';
import { useEditHandler } from '../useEditHandler';

const setEditingStateMock = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

function renderUseEditHandler(
  message = generateMessage(),
  setEditingState = setEditingStateMock,
) {
  const { result } = renderHook(() => useEditHandler(message, setEditingState));
  return result.current;
}

describe('useEditHandler custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should generate function that handles message deletion', () => {
    const handleEdit = renderUseEditHandler();
    expect(typeof handleEdit).toBe('function');
  });

  it('should prevent click event from bubbling', () => {
    const handleEdit = renderUseEditHandler();
    handleEdit(mouseEventMock);
    expect(mouseEventMock.preventDefault).toHaveBeenCalledWith();
  });

  it('should set editing for message', () => {
    const message = generateMessage();
    const handleEdit = renderUseEditHandler(message);
    handleEdit(mouseEventMock);
    expect(setEditingStateMock).toHaveBeenCalledWith(message);
  });
});
