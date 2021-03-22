import { act, renderHook } from '@testing-library/react-hooks';
import { useIsMounted } from '../hooks/useIsMounted';

describe('useIsMounted hook', () => {
  it('should set the value to false after unmounting', () => {
    const renderResult = renderHook(() => useIsMounted());
    const ref = renderResult.result.current;
    expect(ref.current).toBe(true);
    act(() => {
      renderResult.unmount();
    });
    expect(ref.current).toBe(false);
  });
});
