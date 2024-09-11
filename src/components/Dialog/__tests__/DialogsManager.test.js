import { DialogManager } from '../DialogManager';

const dialogId = 'dialogId';

describe('DialogManager', () => {
  it('initiates with provided options', () => {
    const id = 'XX';
    const dialogManager = new DialogManager({ id });
    expect(dialogManager.id).toBe(id);
  });
  it('initiates with default options', () => {
    const mockedId = '12345';
    const spy = jest.spyOn(Date.prototype, 'getTime').mockReturnValueOnce(mockedId);
    const dialogManager = new DialogManager();
    expect(dialogManager.id).toBe(mockedId);
    spy.mockRestore();
  });
  it('creates a new closed dialog', () => {
    const dialogManager = new DialogManager();
    expect(Object.keys(dialogManager.state.getLatestValue().dialogsById)).toHaveLength(0);
    expect(dialogManager.getOrCreate({ id: dialogId })).toMatchObject({
      close: expect.any(Function),
      id: 'dialogId',
      isOpen: false,
      open: expect.any(Function),
      remove: expect.any(Function),
      toggle: expect.any(Function),
      toggleSingle: expect.any(Function),
    });
    expect(Object.keys(dialogManager.state.getLatestValue().dialogsById)).toHaveLength(1);
    expect(dialogManager.openDialogCount).toBe(0);
  });

  it('retrieves an existing dialog', () => {
    const dialogManager = new DialogManager();
    dialogManager.state.next((current) => ({
      ...current,
      dialogsById: { ...current.dialogsById, [dialogId]: { id: dialogId, isOpen: true } },
    }));
    expect(dialogManager.getOrCreate({ id: dialogId })).toMatchObject({
      id: 'dialogId',
      isOpen: true,
    });
    expect(Object.keys(dialogManager.state.getLatestValue().dialogsById)).toHaveLength(1);
  });

  it('creates a dialog if it does not exist on open', () => {
    const dialogManager = new DialogManager();
    dialogManager.open({ id: dialogId });
    expect(dialogManager.state.getLatestValue().dialogsById[dialogId]).toMatchObject({
      close: expect.any(Function),
      id: 'dialogId',
      isOpen: true,
      open: expect.any(Function),
      remove: expect.any(Function),
      toggle: expect.any(Function),
      toggleSingle: expect.any(Function),
    });
    expect(dialogManager.openDialogCount).toBe(1);
  });

  it('opens existing dialog', () => {
    const dialogManager = new DialogManager();
    dialogManager.getOrCreate({ id: dialogId });
    dialogManager.open({ id: dialogId });
    expect(dialogManager.state.getLatestValue().dialogsById[dialogId].isOpen).toBeTruthy();
    expect(dialogManager.openDialogCount).toBe(1);
  });

  it('does not open already open dialog', () => {
    const dialogManager = new DialogManager();
    dialogManager.getOrCreate({ id: dialogId });
    dialogManager.open({ id: dialogId });
    dialogManager.open({ id: dialogId });
    expect(dialogManager.openDialogCount).toBe(1);
  });

  it('closes all other dialogsById before opening the target', () => {
    const dialogManager = new DialogManager();
    dialogManager.open({ id: 'xxx' });
    dialogManager.open({ id: 'yyy' });
    expect(dialogManager.openDialogCount).toBe(2);
    dialogManager.open({ id: dialogId }, true);
    const dialogs = dialogManager.state.getLatestValue().dialogsById;
    expect(dialogs.xxx.isOpen).toBeFalsy();
    expect(dialogs.yyy.isOpen).toBeFalsy();
    expect(dialogManager.state.getLatestValue().dialogsById[dialogId].isOpen).toBeTruthy();
    expect(dialogManager.openDialogCount).toBe(1);
  });

  it('closes opened dialog', () => {
    const dialogManager = new DialogManager();
    dialogManager.open({ id: dialogId });
    dialogManager.close(dialogId);
    expect(dialogManager.state.getLatestValue().dialogsById[dialogId].isOpen).toBeFalsy();
    expect(dialogManager.openDialogCount).toBe(0);
  });

  it('does not close already closed dialog', () => {
    const dialogManager = new DialogManager();
    dialogManager.open({ id: 'xxx' });
    dialogManager.open({ id: dialogId });
    dialogManager.close(dialogId);
    dialogManager.close(dialogId);
    expect(dialogManager.openDialogCount).toBe(1);
  });

  it('toggles the open state of a dialog', () => {
    const dialogManager = new DialogManager();
    dialogManager.open({ id: 'xxx' });
    dialogManager.open({ id: 'yyy' });
    dialogManager.toggleOpen({ id: dialogId });
    expect(dialogManager.openDialogCount).toBe(3);
    dialogManager.toggleOpen({ id: dialogId });
    expect(dialogManager.openDialogCount).toBe(2);
  });

  it('keeps single opened dialog when the toggling open dialog state', () => {
    const dialogManager = new DialogManager();

    dialogManager.open({ id: 'xxx' });
    dialogManager.open({ id: 'yyy' });
    dialogManager.toggleOpenSingle({ id: dialogId });
    expect(dialogManager.openDialogCount).toBe(1);

    dialogManager.toggleOpenSingle({ id: dialogId });
    expect(dialogManager.openDialogCount).toBe(0);
  });

  it('removes a dialog', () => {
    const dialogManager = new DialogManager();
    dialogManager.getOrCreate({ id: dialogId });
    dialogManager.open({ id: dialogId });
    dialogManager.remove(dialogId);
    expect(dialogManager.openDialogCount).toBe(0);
    expect(Object.keys(dialogManager.state.getLatestValue().dialogsById)).toHaveLength(0);
  });

  it('handles attempt to remove non-existent dialog', () => {
    const dialogManager = new DialogManager();
    dialogManager.getOrCreate({ id: dialogId });
    dialogManager.open({ id: dialogId });
    dialogManager.remove('xxx');
    expect(dialogManager.openDialogCount).toBe(1);
    expect(Object.keys(dialogManager.state.getLatestValue().dialogsById)).toHaveLength(1);
  });
});
