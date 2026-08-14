import React from 'react';

import { cleanup, render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { CommandResponse } from 'stream-chat';

import { CommandItem } from '../SuggestionList';

const isCommandDisabledMock = vi.fn();

vi.mock('../../MessageComposer/hooks', () => ({
  useMessageComposerController: () => ({
    isCommandDisabled: isCommandDisabledMock,
    state: {
      getLatestValue: () => ({
        editedMessage: null,
        quotedMessage: null,
      }),
      subscribeWithSelector: () => () => undefined,
    },
  }),
}));

vi.mock('../../../context', () => ({
  useTranslationContext: () => ({
    t: (key: string, second?: unknown, third?: unknown) => {
      const defaultValue = typeof second === 'string' ? second : undefined;
      const options = ((typeof second === 'object' ? second : third) ?? {}) as Record<
        string,
        unknown
      >;
      let template = defaultValue;
      if (template === undefined && typeof options.count === 'number') {
        template = (
          options.count === 1 ? options.defaultValue_one : options.defaultValue_other
        ) as string | undefined;
      }
      template ??= options.defaultValue as string | undefined;
      template ??= key;
      return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, name: string) => {
        const value = options[name];
        return value === undefined || value === null ? whole : String(value);
      });
    },
  }),
}));

afterEach(cleanup);

describe('commandItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing with empty entity (no name)', () => {
    const { container } = render(<CommandItem entity={fromPartial({})} />);
    // CommandItem returns null when entity.name is falsy
    expect(container).toBeEmptyDOMElement();
  });

  it('should render component with custom entity prop', () => {
    const entity = fromPartial<CommandResponse>({
      args: 'args',
      description: 'description',
      name: 'name',
    });
    const Component = <CommandItem entity={entity} />;

    const { getByText } = render(Component);
    // Component now renders via CommandContextMenuItem (ContextMenuButton)
    // name appears as label, args combined with name as details ("/name args")
    expect(getByText(entity.name)).toBeInTheDocument();

    const { container } = render(Component);
    const button = container.querySelector(
      'button.str-chat__context-menu__button--command',
    );
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute(
      'aria-label',
      `${entity.description}, /${entity.name} ${entity.args}`,
    );
    expect(
      container.querySelector('.str-chat__context-menu__button__label'),
    ).toHaveTextContent(entity.name);
    expect(
      container.querySelector('.str-chat__context-menu__button__details'),
    ).toHaveTextContent(`/${entity.name} ${entity.args}`);
  });

  it('renders disabled state for unavailable commands', () => {
    const entity = fromPartial<CommandResponse>({
      args: 'args',
      description: 'description',
      name: 'name',
    });

    isCommandDisabledMock.mockReturnValue(true);

    const { container } = render(<CommandItem entity={entity} />);
    const button = container.querySelector(
      'button.str-chat__context-menu__button--command',
    );

    expect(button).toBeDisabled();
    expect(
      container.querySelector('.str-chat__context-menu__button__details'),
    ).toHaveTextContent(`/${entity.name} ${entity.args}`);
  });
});
