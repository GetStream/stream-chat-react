import { BrowserPermission } from '../BrowserPermission';
import { EventEmitterMock } from '../../../../mock-builders/browser';

const defaultMockState = 'prompt';
window.navigator.permissions = {
  query: jest.fn(),
};

describe('BrowserPermission', () => {
  afterEach(jest.clearAllMocks);

  it('is initiated for microphone', () => {
    const permission = new BrowserPermission({ mediaType: 'audio' });
    expect(permission.name).toBe('microphone');
    expect(permission.state.value).toBeUndefined();
    expect(permission.status.value).toBeUndefined();
    expect(permission.isWatching).toBe(false);
  });

  it('is initiated for camera', () => {
    const permission = new BrowserPermission({ mediaType: 'video' });
    expect(permission.name).toBe('camera');
    expect(permission.state.value).toBeUndefined();
    expect(permission.status.value).toBeUndefined();
    expect(permission.isWatching).toBe(false);
  });

  describe('check', () => {
    it('registers error and returns on checking unsupported permission', async () => {
      const permission = new BrowserPermission({ mediaType: 'X' });
      let error;
      const errorSubscription = permission.error.subscribe((e) => {
        error = e;
      });
      await permission.check();
      expect(permission.state.value).toBeUndefined();
      expect(permission.status.value).toBeUndefined();
      expect(permission.isWatching).toBe(false);
      expect(error.message).toBe('Unknown media recording permission');
      errorSubscription.unsubscribe();
    });

    it('handles permission query error', async () => {
      const permission = new BrowserPermission({ mediaType: 'audio' });
      window.navigator.permissions.query.mockRejectedValueOnce('Query error');
      await permission.check();
      expect(permission.state.value).toBe('granted');
    });

    it('emits permission status and state', async () => {
      const permission = new BrowserPermission({ mediaType: 'audio' });
      const status = new EventEmitterMock();
      status.state = defaultMockState;
      window.navigator.permissions.query.mockResolvedValueOnce(status);
      await permission.check();

      expect(permission.status.value).toStrictEqual(status);
      expect(permission.state.value).toBe(defaultMockState);
    });
  });

  describe('listening to permission status change', () => {
    it('is prevented for unsupported permission', async () => {
      const permission = new BrowserPermission({ mediaType: 'X' });
      let error;
      const errorSubscription = permission.error.subscribe((e) => {
        error = e;
      });
      await permission.watch();
      expect(permission.state.value).toBeUndefined();
      expect(permission.status.value).toBeUndefined();
      expect(permission.isWatching).toBe(false);
      expect(error.message).toBe('Unknown media recording permission');
      errorSubscription.unsubscribe();
    });

    it('subscribes to permission status change event', async () => {
      const permission = new BrowserPermission({ mediaType: 'audio' });
      let error;
      const errorSubscription = permission.error.subscribe((e) => {
        error = e;
      });
      const status = new EventEmitterMock();
      status.state = defaultMockState;
      window.navigator.permissions.query.mockResolvedValueOnce(status);
      await permission.watch();

      expect(permission.state.value).toBe(defaultMockState);
      expect(permission.isWatching).toBe(true);
      expect(error).toBeUndefined();
      errorSubscription.unsubscribe();

      const registeredHandler = permission.status.value.addEventListener.mock.calls[0][1];
      registeredHandler({ target: { state: 'granted' } });
      expect(permission.state.value).toBe('granted');
    });

    it('allows to unsubscribe from watching permission status change event', async () => {
      const permission = new BrowserPermission({ mediaType: 'audio' });
      const status = new EventEmitterMock();
      status.state = defaultMockState;
      window.navigator.permissions.query.mockResolvedValueOnce(status);
      await permission.watch();
      expect(permission.status.value.removeEventListener).not.toHaveBeenCalled();
      permission.unwatch();
      expect(permission.status.value.removeEventListener).toHaveBeenCalledTimes(1);
      expect(permission.isWatching).toBe(false);
    });
  });
});
