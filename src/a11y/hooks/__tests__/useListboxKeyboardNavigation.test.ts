import { renderHook } from '@testing-library/react';

import {
  createRowActionKeyHandlers,
  useListboxKeyboardNavigation,
} from '../useListboxKeyboardNavigation';

const makeEvent = (key: string) => ({
  currentTarget: document.body,
  key,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

describe('useListboxKeyboardNavigation', () => {
  let container: HTMLDivElement;
  let options: HTMLButtonElement[];

  const addOptions = (count: number) => {
    options = Array.from({ length: count }, () => {
      const option = document.createElement('button');
      option.setAttribute('role', 'option');
      container.appendChild(option);
      return option;
    });
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  const render = (config?: Parameters<typeof useListboxKeyboardNavigation>[1]) =>
    renderHook(() => useListboxKeyboardNavigation({ current: container }, config));

  it('roves the options with ArrowDown/ArrowUp/Home/End', () => {
    addOptions(3);
    const { result } = render();
    options[0].focus();

    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(options[1]);
    result.current.onKeyDown(makeEvent('End'));
    expect(document.activeElement).toBe(options[2]);
    result.current.onKeyDown(makeEvent('Home'));
    expect(document.activeElement).toBe(options[0]);
  });

  it('stops propagation for keys it handles, so nothing else can move focus', () => {
    addOptions(3);
    const { result } = render();
    options[0].focus();

    const end = makeEvent('End');
    result.current.onKeyDown(end);
    expect(end.stopPropagation).toHaveBeenCalled();

    // A key it does not handle is left to propagate.
    const enter = makeEvent('Enter');
    result.current.onKeyDown(enter);
    expect(enter.stopPropagation).not.toHaveBeenCalled();
  });

  describe("enterScope 'option' (default)", () => {
    it('does not rove when focus is not on an option', () => {
      addOptions(2);
      const other = document.createElement('button');
      container.appendChild(other);
      const { result } = render();
      other.focus();

      result.current.onKeyDown(makeEvent('ArrowDown'));
      expect(document.activeElement).toBe(other);
    });
  });

  describe("enterScope 'container'", () => {
    it('enters the list from a non-option inside the container', () => {
      const other = document.createElement('button');
      container.appendChild(other);
      addOptions(2);
      const { result } = render({ enterScope: 'container' });
      other.focus();

      result.current.onKeyDown(makeEvent('ArrowDown'));
      expect(document.activeElement).toBe(options[0]);
    });
  });

  describe('resolveActiveOption (vertical keys from a non-option)', () => {
    it('moves relative to the resolved option instead of jumping to first/last', () => {
      addOptions(3);
      const sibling = document.createElement('button'); // not an option
      container.appendChild(sibling);
      const { result } = render({
        enterScope: 'container',
        resolveActiveOption: () => options[1],
      });
      sibling.focus();

      result.current.onKeyDown(makeEvent('ArrowDown'));
      expect(document.activeElement).toBe(options[2]); // next after the resolved option (1)

      sibling.focus();
      result.current.onKeyDown(makeEvent('ArrowUp'));
      expect(document.activeElement).toBe(options[0]); // previous
    });

    it('falls back to first/last when the resolver returns null', () => {
      addOptions(3);
      const sibling = document.createElement('button');
      container.appendChild(sibling);
      const { result } = render({
        enterScope: 'container',
        resolveActiveOption: () => null,
      });
      sibling.focus();

      result.current.onKeyDown(makeEvent('ArrowDown'));
      expect(document.activeElement).toBe(options[0]); // first
    });
  });

  describe('custom keyHandlers', () => {
    it('invokes the handler for its key and consumes the event when it returns true', () => {
      addOptions(1);
      const handler = vi.fn(() => true);
      const { result } = render({ keyHandlers: { Delete: handler } });
      options[0].focus();

      const del = makeEvent('Delete');
      result.current.onKeyDown(del);

      expect(handler).toHaveBeenCalledTimes(1);
      const ctx = handler.mock.calls[0][0];
      expect(ctx.active).toBe(options[0]);
      expect(ctx.onOption).toBe(true);
      expect(ctx.container).toBe(container);
      expect(del.preventDefault).toHaveBeenCalled();
      expect(del.stopPropagation).toHaveBeenCalled();
    });

    it('leaves the event to propagate when the handler returns falsy', () => {
      addOptions(1);
      const { result } = render({ keyHandlers: { Delete: () => undefined } });
      options[0].focus();

      const del = makeEvent('Delete');
      result.current.onKeyDown(del);
      expect(del.preventDefault).not.toHaveBeenCalled();
      expect(del.stopPropagation).not.toHaveBeenCalled();
    });

    it('does nothing for a key with no handler', () => {
      addOptions(1);
      const { result } = render();
      options[0].focus();

      const right = makeEvent('ArrowRight');
      result.current.onKeyDown(right);
      expect(document.activeElement).toBe(options[0]);
      expect(right.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('createRowActionKeyHandlers', () => {
    const ROW = 'div.row';
    const ACTION = '.actions button';
    const keyHandlers = createRowActionKeyHandlers({
      actionSelector: ACTION,
      rowSelector: ROW,
    });

    const addRowWithAction = () => {
      const row = document.createElement('div');
      row.className = 'row';
      const option = document.createElement('button');
      option.setAttribute('role', 'option');
      const actions = document.createElement('div');
      actions.className = 'actions';
      const actionButton = document.createElement('button');
      actions.appendChild(actionButton);
      row.append(option, actions);
      container.appendChild(row);
      return { actionButton, option };
    };

    const addRowWithActions = (actionCount: number) => {
      const row = document.createElement('div');
      row.className = 'row';
      const option = document.createElement('button');
      option.setAttribute('role', 'option');
      const actions = document.createElement('div');
      actions.className = 'actions';
      const actionButtons = Array.from({ length: actionCount }, () => {
        const button = document.createElement('button');
        actions.appendChild(button);
        return button;
      });
      row.append(option, actions);
      container.appendChild(row);
      return { actionButtons, option };
    };

    it('moves to the action with ArrowRight and back with ArrowLeft', () => {
      const { actionButton, option } = addRowWithAction();
      const { result } = render({ keyHandlers });
      option.focus();

      result.current.onKeyDown(makeEvent('ArrowRight'));
      expect(document.activeElement).toBe(actionButton);
      result.current.onKeyDown(makeEvent('ArrowLeft'));
      expect(document.activeElement).toBe(option);
    });

    it('cycles option → actions → option across multiple actions and both edges', () => {
      const { actionButtons, option } = addRowWithActions(2);
      const [a0, a1] = actionButtons;
      const { result } = render({ keyHandlers });
      option.focus();

      result.current.onKeyDown(makeEvent('ArrowRight'));
      expect(document.activeElement).toBe(a0);
      result.current.onKeyDown(makeEvent('ArrowRight'));
      expect(document.activeElement).toBe(a1);
      result.current.onKeyDown(makeEvent('ArrowRight')); // last action → option
      expect(document.activeElement).toBe(option);

      result.current.onKeyDown(makeEvent('ArrowLeft')); // option wraps to last action
      expect(document.activeElement).toBe(a1);
      result.current.onKeyDown(makeEvent('ArrowLeft'));
      expect(document.activeElement).toBe(a0);
      result.current.onKeyDown(makeEvent('ArrowLeft')); // first action → option
      expect(document.activeElement).toBe(option);
    });

    it('does nothing for an option whose row has no action', () => {
      addOptions(1); // a bare option, not inside a `.row`
      const { result } = render({ keyHandlers });
      options[0].focus();

      const right = makeEvent('ArrowRight');
      result.current.onKeyDown(right);
      expect(document.activeElement).toBe(options[0]);
      expect(right.preventDefault).not.toHaveBeenCalled();
    });
  });

  it('ignores keys when focus is outside the container', () => {
    addOptions(2);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    const { result } = render();

    result.current.onKeyDown(makeEvent('ArrowDown'));
    expect(document.activeElement).toBe(outside);

    outside.remove();
  });
});
