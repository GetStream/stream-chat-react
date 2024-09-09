import { DialogsManager } from '../DialogsManager';

const dialogId = 'dialogId';

describe('DialogManager', () => {
  it('initiates with provided options', () => {
    const id = 'XX';
    const dm = new DialogsManager({ id });
    expect(dm.id).toBe(id);
  });
  it('initiates with default options', () => {
    const mockedId = '12345';
    const spy = jest.spyOn(Date.prototype, 'getTime').mockReturnValueOnce(mockedId);
    const dm = new DialogsManager();
    expect(dm.id).toBe(mockedId);
    spy.mockRestore();
  });
  it('creates a new closed dialog', () => {
    const dm = new DialogsManager();
    expect(Object.keys(dm.dialogs)).toHaveLength(0);
    expect(dm.getOrCreate({ id: dialogId })).toMatchObject({
      close: expect.any(Function),
      id: 'dialogId',
      isOpen: false,
      open: expect.any(Function),
      remove: expect.any(Function),
      toggle: expect.any(Function),
      toggleSingle: expect.any(Function),
    });
    expect(Object.keys(dm.dialogs)).toHaveLength(1);
    expect(dm.openDialogCount).toBe(0);
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);
    expect(Object.keys(dm.dialogsManagerEventListeners)).toHaveLength(1);
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(0);
  });

  it('retrieves an existing dialog', () => {
    const dm = new DialogsManager();
    dm.dialogs[dialogId] = { id: dialogId, isOpen: true };
    expect(dm.getOrCreate({ id: dialogId })).toMatchObject({
      id: 'dialogId',
      isOpen: true,
    });
  });

  it('registers dialog event listener for non-existent dialog', () => {
    const listener = jest.fn();
    const dm = new DialogsManager();
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);

    dm.on('open', { id: dialogId, listener });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(1);
    expect(Object.keys(dm.dialogEventListeners[dialogId])).toHaveLength(1);
    expect(dm.dialogEventListeners[dialogId].close).toBeUndefined();
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(1);
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(0);

    dm.on('close', { id: dialogId, listener });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(1);
    expect(Object.keys(dm.dialogEventListeners[dialogId])).toHaveLength(2);
    expect(dm.dialogEventListeners[dialogId].open).toHaveLength(1);
    expect(dm.dialogEventListeners[dialogId].close).toHaveLength(1);
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(0);
  });
  it('registers dialog event listener for existing dialog', () => {
    const listener = jest.fn();
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);

    dm.on('open', { id: dialogId, listener });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(1);
    expect(Object.keys(dm.dialogEventListeners[dialogId])).toHaveLength(1);
    expect(dm.dialogEventListeners[dialogId].close).toBeUndefined();
    expect(dm.dialogEventListeners[dialogId].open).toHaveLength(1);
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(0);

    dm.on('close', { id: dialogId, listener });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(1);
    expect(Object.keys(dm.dialogEventListeners[dialogId])).toHaveLength(2);
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(1);
    expect(Object.keys(dm.dialogEventListeners[dialogId].close)).toHaveLength(1);
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(0);
  });

  it('registers dialog manager event listener', () => {
    const listener = jest.fn();
    const dm = new DialogsManager();
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(0);

    dm.on('openCountChange', { listener });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(1);
  });

  it('does not register dialog event listener without dialog id', () => {
    const listener = jest.fn();
    const dm = new DialogsManager();
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);

    dm.on('open', { listener });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);

    dm.on('close', { listener });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);
  });

  it('unregisters dialog event listener for non-existent dialog', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const dm = new DialogsManager();
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);

    dm.on('open', { id: dialogId, listener: listener1 });
    dm.on('open', { id: dialogId, listener: listener2 });
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(2);
    dm.off('open', { id: dialogId, listener: listener1 });
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(1);

    const unsubscribe = dm.on('open', { id: dialogId, listener: listener1 });
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(2);
    unsubscribe();
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(1);
    dm.off('open', { id: dialogId, listener: listener2 });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);
  });

  it('unregisters dialog event listener for existing dialog', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);

    dm.on('open', { id: dialogId, listener: listener1 });
    dm.on('open', { id: dialogId, listener: listener2 });
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(2);
    dm.off('open', { id: dialogId, listener: listener1 });
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(1);

    const unsubscribe = dm.on('open', { id: dialogId, listener: listener1 });
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(2);
    unsubscribe();
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(1);
    dm.off('open', { id: dialogId, listener: listener2 });
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);
  });

  it('does not unregister dialog event listener without dialog id', () => {
    const listener = jest.fn();
    const dm = new DialogsManager();
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);

    dm.on('open', { id: dialogId, listener });
    dm.off('open', { listener });
    expect(Object.keys(dm.dialogEventListeners[dialogId].open)).toHaveLength(1);
  });

  it('unregisters dialog manager event listener', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(0);

    const unsubscribe = dm.on('openCountChange', { listener: listener1 });
    dm.on('openCountChange', { listener: listener2 });
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(2);
    dm.off('openCountChange', { listener: listener2 });
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(1);
    unsubscribe();
    expect(dm.dialogsManagerEventListeners.openCountChange).toHaveLength(0);
  });

  it('executes all the dialog event listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const dm = new DialogsManager();
    dm.on('open', { id: dialogId, listener: listener1 });
    dm.on('close', { id: dialogId, listener: listener2 });
    dm.open({ id: dialogId });
    dm.close(dialogId);
    expect(listener1).toHaveBeenCalledWith(dm.dialogs[dialogId]);
    expect(listener2).toHaveBeenCalledWith(dm.dialogs[dialogId]);
  });

  it('executes all the dialog manager event listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const dm = new DialogsManager();
    dm.on('openCountChange', { listener: listener1 });
    dm.on('openCountChange', { listener: listener2 });
    dm.open({ id: dialogId });
    expect(listener1).toHaveBeenCalledWith(dm);
    expect(listener2).toHaveBeenCalledWith(dm);
  });

  it('creates a dialog if it does not exist on open', () => {
    const dm = new DialogsManager();
    dm.open({ id: dialogId });
    expect(dm.dialogs[dialogId]).toMatchObject({
      close: expect.any(Function),
      id: 'dialogId',
      isOpen: true,
      open: expect.any(Function),
      remove: expect.any(Function),
      toggle: expect.any(Function),
      toggleSingle: expect.any(Function),
    });
    expect(dm.openDialogCount).toBe(1);
  });

  it('opens existing dialog', () => {
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    dm.open({ id: dialogId });
    expect(dm.dialogs[dialogId].isOpen).toBeTruthy();
    expect(dm.openDialogCount).toBe(1);
  });

  it('does not open already open dialog', () => {
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    dm.open({ id: dialogId });
    dm.open({ id: dialogId });
    expect(dm.openDialogCount).toBe(1);
  });

  it('closes all other dialogs before opening the target', () => {
    const dm = new DialogsManager();
    dm.open({ id: 'xxx' });
    dm.open({ id: 'yyy' });
    expect(dm.openDialogCount).toBe(2);
    dm.open({ id: dialogId }, true);
    expect(dm.dialogs.xxx.isOpen).toBeFalsy();
    expect(dm.dialogs.yyy.isOpen).toBeFalsy();
    expect(dm.dialogs[dialogId].isOpen).toBeTruthy();
    expect(dm.openDialogCount).toBe(1);
  });

  it('closes opened dialog', () => {
    const dm = new DialogsManager();
    dm.open({ id: dialogId });
    dm.close(dialogId);
    expect(dm.dialogs[dialogId].isOpen).toBeFalsy();
    expect(dm.openDialogCount).toBe(0);
  });

  it('does not close non-existent dialog', () => {
    const listener = jest.fn();
    const dm = new DialogsManager();
    dm.open({ id: 'xxx' });
    dm.on('close', { id: dialogId, listener });
    dm.close(dialogId);
    expect(listener).not.toHaveBeenCalled();
    expect(dm.openDialogCount).toBe(1);
  });

  it('does not close already closed dialog', () => {
    const listener = jest.fn();
    const dm = new DialogsManager();
    dm.open({ id: 'xxx' });
    dm.open({ id: dialogId });
    dm.on('close', { id: dialogId, listener });
    dm.close(dialogId);
    dm.close(dialogId);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(dm.openDialogCount).toBe(1);
  });

  it('toggles the open state of a dialog', () => {
    const openListener = jest.fn();
    const closeListener = jest.fn();
    const dm = new DialogsManager();
    dm.on('open', { id: dialogId, listener: openListener });
    dm.on('close', { id: dialogId, listener: closeListener });

    dm.open({ id: 'xxx' });
    dm.open({ id: 'yyy' });
    dm.toggleOpen({ id: dialogId });
    expect(openListener).toHaveBeenCalledTimes(1);
    expect(closeListener).toHaveBeenCalledTimes(0);
    expect(dm.openDialogCount).toBe(3);

    dm.toggleOpen({ id: dialogId });
    expect(openListener).toHaveBeenCalledTimes(1);
    expect(closeListener).toHaveBeenCalledTimes(1);
    expect(dm.openDialogCount).toBe(2);
  });

  it('keeps single opened dialog when the toggling open dialog state', () => {
    const openListener = jest.fn();
    const closeListener = jest.fn();
    const dm = new DialogsManager();
    dm.on('open', { id: dialogId, listener: openListener });
    dm.on('close', { id: dialogId, listener: closeListener });

    dm.open({ id: 'xxx' });
    dm.open({ id: 'yyy' });
    dm.toggleOpenSingle({ id: dialogId });
    expect(openListener).toHaveBeenCalledTimes(1);
    expect(closeListener).toHaveBeenCalledTimes(0);
    expect(dm.openDialogCount).toBe(1);

    dm.toggleOpenSingle({ id: dialogId });
    expect(openListener).toHaveBeenCalledTimes(1);
    expect(closeListener).toHaveBeenCalledTimes(1);
    expect(dm.openDialogCount).toBe(0);
  });

  it('removes a dialog if no associated dialog event listeners', () => {
    const openListener = jest.fn();
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    dm.on('open', { id: dialogId, listener: openListener });
    dm.open({ id: dialogId });
    dm.off('open', { id: dialogId, listener: openListener });
    dm.remove(dialogId);
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(0);
    expect(dm.openDialogCount).toBe(0);
    expect(Object.keys(dm.dialogs)).toHaveLength(0);
  });

  it('does not remove a dialog if associated dialog event listeners', () => {
    const openListener = jest.fn();
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    dm.on('open', { id: dialogId, listener: openListener });
    dm.open({ id: dialogId });
    dm.remove(dialogId);
    expect(Object.keys(dm.dialogEventListeners[dialogId])).toHaveLength(1);
    expect(dm.openDialogCount).toBe(1);
    expect(Object.keys(dm.dialogs)).toHaveLength(1);
  });

  it('handles attempt to remove non-existent dialog', () => {
    const openListener = jest.fn();
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    dm.on('open', { id: dialogId, listener: openListener });
    dm.open({ id: dialogId });
    dm.remove('xxx');
    expect(Object.keys(dm.dialogEventListeners)).toHaveLength(1);
    expect(dm.openDialogCount).toBe(1);
    expect(Object.keys(dm.dialogs)).toHaveLength(1);
  });
});
