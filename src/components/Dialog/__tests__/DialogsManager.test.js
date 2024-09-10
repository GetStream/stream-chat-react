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
    expect(Object.keys(dm.state.getLatestValue().dialogs)).toHaveLength(0);
    expect(dm.getOrCreate({ id: dialogId })).toMatchObject({
      close: expect.any(Function),
      id: 'dialogId',
      isOpen: false,
      open: expect.any(Function),
      remove: expect.any(Function),
      toggle: expect.any(Function),
      toggleSingle: expect.any(Function),
    });
    expect(Object.keys(dm.state.getLatestValue().dialogs)).toHaveLength(1);
    expect(dm.state.getLatestValue().openDialogCount).toBe(0);
  });

  it('retrieves an existing dialog', () => {
    const dm = new DialogsManager();
    dm.state.next((current) => ({
      ...current,
      dialogs: { ...current.dialogs, [dialogId]: { id: dialogId, isOpen: true } },
    }));
    expect(dm.getOrCreate({ id: dialogId })).toMatchObject({
      id: 'dialogId',
      isOpen: true,
    });
    expect(Object.keys(dm.state.getLatestValue().dialogs)).toHaveLength(1);
  });

  it('creates a dialog if it does not exist on open', () => {
    const dm = new DialogsManager();
    dm.open({ id: dialogId });
    expect(dm.state.getLatestValue().dialogs[dialogId]).toMatchObject({
      close: expect.any(Function),
      id: 'dialogId',
      isOpen: true,
      open: expect.any(Function),
      remove: expect.any(Function),
      toggle: expect.any(Function),
      toggleSingle: expect.any(Function),
    });
    expect(dm.state.getLatestValue().openDialogCount).toBe(1);
  });

  it('opens existing dialog', () => {
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    dm.open({ id: dialogId });
    expect(dm.state.getLatestValue().dialogs[dialogId].isOpen).toBeTruthy();
    expect(dm.state.getLatestValue().openDialogCount).toBe(1);
  });

  it('does not open already open dialog', () => {
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    dm.open({ id: dialogId });
    dm.open({ id: dialogId });
    expect(dm.state.getLatestValue().openDialogCount).toBe(1);
  });

  it('closes all other dialogs before opening the target', () => {
    const dm = new DialogsManager();
    dm.open({ id: 'xxx' });
    dm.open({ id: 'yyy' });
    expect(dm.state.getLatestValue().openDialogCount).toBe(2);
    dm.open({ id: dialogId }, true);
    const dialogs = dm.state.getLatestValue().dialogs;
    expect(dialogs.xxx.isOpen).toBeFalsy();
    expect(dialogs.yyy.isOpen).toBeFalsy();
    expect(dm.state.getLatestValue().dialogs[dialogId].isOpen).toBeTruthy();
    expect(dm.state.getLatestValue().openDialogCount).toBe(1);
  });

  it('closes opened dialog', () => {
    const dm = new DialogsManager();
    dm.open({ id: dialogId });
    dm.close(dialogId);
    expect(dm.state.getLatestValue().dialogs[dialogId].isOpen).toBeFalsy();
    expect(dm.state.getLatestValue().openDialogCount).toBe(0);
  });

  it('does not close already closed dialog', () => {
    const dm = new DialogsManager();
    dm.open({ id: 'xxx' });
    dm.open({ id: dialogId });
    dm.close(dialogId);
    dm.close(dialogId);
    expect(dm.state.getLatestValue().openDialogCount).toBe(1);
  });

  it('toggles the open state of a dialog', () => {
    const dm = new DialogsManager();
    dm.open({ id: 'xxx' });
    dm.open({ id: 'yyy' });
    dm.toggleOpen({ id: dialogId });
    expect(dm.state.getLatestValue().openDialogCount).toBe(3);
    dm.toggleOpen({ id: dialogId });
    expect(dm.state.getLatestValue().openDialogCount).toBe(2);
  });

  it('keeps single opened dialog when the toggling open dialog state', () => {
    const dm = new DialogsManager();

    dm.open({ id: 'xxx' });
    dm.open({ id: 'yyy' });
    dm.toggleOpenSingle({ id: dialogId });
    expect(dm.state.getLatestValue().openDialogCount).toBe(1);

    dm.toggleOpenSingle({ id: dialogId });
    expect(dm.state.getLatestValue().openDialogCount).toBe(0);
  });

  it('removes a dialog', () => {
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    dm.open({ id: dialogId });
    dm.remove(dialogId);
    expect(dm.state.getLatestValue().openDialogCount).toBe(0);
    expect(Object.keys(dm.state.getLatestValue().dialogs)).toHaveLength(0);
  });

  it('handles attempt to remove non-existent dialog', () => {
    const dm = new DialogsManager();
    dm.getOrCreate({ id: dialogId });
    dm.open({ id: dialogId });
    dm.remove('xxx');
    expect(dm.state.getLatestValue().openDialogCount).toBe(1);
    expect(Object.keys(dm.state.getLatestValue().dialogs)).toHaveLength(1);
  });
});
