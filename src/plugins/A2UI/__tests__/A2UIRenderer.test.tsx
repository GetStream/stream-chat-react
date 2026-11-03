import React from 'react';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';

import {
  AIConversation,
  type AIMessage,
  type AIUIAction,
  AIUIHost,
  defineAIUIComponent,
  fromStreamMessage,
  parseAIUIComponentDefinition,
} from '../../AIComponents';
import { renderWithEnglish } from '../../AIComponents/__tests__/renderWithEnglish';
import {
  A2UI_DEFAULT_CATALOG_ID,
  a2uiMessagesIn,
  type A2UIRendererOptions,
  createA2UIRenderer,
  supportsA2UIVersion,
} from '..';
import { normalizeA2UIMessage } from '../A2UIStream';
import { a2uiAppCatalogDocument, a2uiTypeName } from '../runtime';
import { ohridLines, uiComponents } from './ohrid';

const definitionOf = (name: string) => {
  const definition = parseAIUIComponentDefinition(
    uiComponents.find((component) => component.name === name),
  );
  if (!definition) throw new Error(`no ${name}`);
  return definition;
};

const placeCard = defineAIUIComponent<{ note?: string; title: string }>(
  definitionOf('place_card'),
  ({ args, context }) => (
    <button
      data-testid='place-card'
      onClick={() =>
        context.emit('ask_about', `Tell me more about ${args.title}`, {
          title: args.title,
        })
      }
      type='button'
    >
      {args.title}
      {args.note ? ` (${args.note})` : ''}
    </button>
  ),
);

const tripMap = defineAIUIComponent<{ places: { name: string }[] }>(
  definitionOf('trip_map'),
  ({ args }) => (
    <p data-testid='trip-map'>{args.places.map(({ name }) => name).join(', ')}</p>
  ),
);

const calendarCheck = defineAIUIComponent<{ end: Date; start: Date }>(
  definitionOf('calendar_check'),
  ({ args }) => (
    <p data-testid='calendar-check'>
      {args.start.getDate()}–{args.end.getDate()}
    </p>
  ),
);

const setup = (options: A2UIRendererOptions = {}) => {
  const sent: AIUIAction[] = [];
  const errors: { code: string; message: string }[] = [];
  const open = vi.fn();
  const ui = new AIUIHost({
    components: [placeCard, tripMap, calendarCheck],
    open,
    renderers: [
      createA2UIRenderer({ ...options, onError: (error) => errors.push(error) }),
    ],
    send: (action) => {
      sent.push(action);
    },
  });
  return { errors, open, sent, ui };
};

const question: AIMessage = { id: 'u1', role: 'user', text: 'Plan a weekend in Ohrid' };
const replyWith = (lines: string[], status = 'complete', text = 'A weekend in Ohrid.') =>
  fromStreamMessage({
    ai_generated: true,
    ai_ui: { content: lines.join('\n'), format: 'a2ui', status, v: 1, version: '1.0' },
    attachments: [],
    id: 'a1',
    text,
  });

const line = (message: Record<string, unknown>) =>
  JSON.stringify({ version: '1.0', ...message });

describe('a2uiMessagesIn', () => {
  it('reads the messages one per line, in an array, pretty-printed, or among words', () => {
    const one = '{"version":"1.0","deleteSurface":{"surfaceId":"a"}}';
    const two = '{"version":"1.0","deleteSurface":{"surfaceId":"b"}}';
    expect(a2uiMessagesIn(`${one}\n${two}`)).toEqual([one, two]);
    expect(a2uiMessagesIn(`[${one},${two}]`)).toEqual([one, two]);
    expect(a2uiMessagesIn(`Here it is:\n${one}\nand more.`)).toEqual([one]);
    expect(
      a2uiMessagesIn('{\n  "version": "1.0",\n  "deleteSurface": {"surfaceId": "a"}\n}'),
    ).toHaveLength(1);
  });

  it('leaves out a message still being written', () => {
    expect(a2uiMessagesIn('{"version":"1.0"}\n{"version":"1.0","updateComp')).toEqual([
      '{"version":"1.0"}',
    ]);
  });

  it('is not misled by braces and quotes inside strings', () => {
    const tricky = '{"text":"a } and a \\" and a {"}';
    expect(a2uiMessagesIn(tricky)).toEqual([tricky]);
  });
});

describe('the A2UI versions and catalog it reads', () => {
  it('reads 1.0 in the spellings an agent writes, and no other version', () => {
    for (const version of [undefined, '1', '1.0', '1.0.0', 'v1', 'v1.0']) {
      expect(supportsA2UIVersion(version)).toBe(true);
    }
    for (const version of ['0.9', '2.0', 'v0.8']) {
      expect(supportsA2UIVersion(version)).toBe(false);
    }
  });

  it('writes every message as 1.0, and names the app’s catalog for a surface naming none', () => {
    expect(normalizeA2UIMessage({ version: 'v1.0' }, 'app').version).toBe('1.0');
    expect(
      normalizeA2UIMessage({ createSurface: { surfaceId: 's' }, version: '1.0' }, 'app'),
    ).toEqual({ createSurface: { catalogId: 'app', surfaceId: 's' }, version: '1.0' });
    expect(
      normalizeA2UIMessage(
        { createSurface: { catalogId: 'other', surfaceId: 's' }, version: '1.0' },
        'app',
      ).createSurface,
    ).toEqual({ catalogId: 'other', surfaceId: 's' });
  });

  it('describes the app’s components to the agent as StreamChatA2UI does', () => {
    expect(a2uiTypeName('place_card')).toBe('PlaceCard');
    const document = a2uiAppCatalogDocument(A2UI_DEFAULT_CATALOG_ID, [placeCard]);
    expect(document.components.PlaceCard).toMatchObject({
      description:
        'One place of a plan, with its photo and a short summary, which the phone loads from Wikipedia, so it needs no image URL. Use one per sight, beach, monastery, village or day trip. Tapping the card asks you about the place.',
      required: ['component', 'title'],
    });
  });

  it('tells the agent’s backend its fence and catalog', () => {
    const { ui } = setup();
    expect(ui.capabilities.renderers).toEqual([
      { catalog_id: A2UI_DEFAULT_CATALOG_ID, fence: 'ui:a2ui@1.0', format: 'a2ui' },
    ]);
  });
});

describe('a reply written in A2UI', () => {
  it('shows the Ohrid plan with the basic catalog and the app’s components', async () => {
    const { errors, ui } = setup();
    renderWithEnglish(
      <AIConversation messages={[question, replyWith(ohridLines)]} ui={ui} />,
    );

    await waitFor(() =>
      expect(screen.getByTestId('trip-map')).toHaveTextContent(
        'Church of St. John at Kaneo',
      ),
    );
    expect(screen.getByTestId('calendar-check')).toHaveTextContent('14–15');
    expect(screen.getAllByTestId('place-card')[0]).toHaveTextContent('Plaošnik (1 hour)');
    expect(document.body).toHaveTextContent('Two easy days by the lake');
    expect(screen.queryByText('A weekend in Ohrid.')).not.toBeInTheDocument();
    expect(errors).toEqual([]);
  });

  it('tells the agent what the person did, in their words', async () => {
    const { sent, ui } = setup();
    renderWithEnglish(
      <AIConversation messages={[question, replyWith(ohridLines)]} ui={ui} />,
    );

    const update = await screen.findByRole('button', { name: 'Update the plan' });
    act(() => {
      fireEvent.click(update);
    });
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toEqual({
      format: 'a2ui',
      label: 'Update the plan',
      messageId: 'a1',
      name: 'update_plan',
      payload: {
        context: { interests: [], pace: ['relaxed'] },
        sourceComponentId: 'update',
        surfaceId: 'ohrid-weekend',
      },
    });

    fireEvent.click(screen.getAllByTestId('place-card')[0] as HTMLElement);
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]).toEqual({
      format: 'a2ui',
      label: 'Tell me more about Plaošnik',
      messageId: 'a1',
      name: 'ask_about',
      payload: { component: 'place_card', title: 'Plaošnik' },
    });
  });

  it('names an action by what its button says when the agent gave it no words', async () => {
    const { sent, ui } = setup();
    const lines = [
      line({ createSurface: { surfaceId: 's' } }),
      line({
        updateComponents: {
          components: [
            {
              action: { event: { name: 'book' } },
              child: 'label',
              component: 'Button',
              id: 'root',
            },
            { component: 'Text', id: 'label', text: 'Book the boat' },
          ],
          surfaceId: 's',
        },
      }),
    ];
    renderWithEnglish(<AIConversation messages={[question, replyWith(lines)]} ui={ui} />);
    const book = await screen.findByRole('button', { name: 'Book the boat' });
    act(() => {
      fireEvent.click(book);
    });
    await waitFor(() => expect(sent[0]?.label).toBe('Book the boat'));
  });

  it('follows a reply as the agent writes it, a message at a time', async () => {
    const { ui } = setup();
    const { rerender } = renderWithEnglish(
      <AIConversation
        messages={[
          question,
          replyWith(
            [...ohridLines.slice(0, 2), '{"version":"1.0","upd'],
            'streaming',
            '',
          ),
        ]}
        ui={ui}
      />,
    );
    await waitFor(() =>
      expect(document.body).toHaveTextContent('Two easy days by the lake'),
    );
    expect(screen.queryByTestId('trip-map')).not.toBeInTheDocument();

    rerender(
      <AIConversation
        messages={[question, replyWith(ohridLines.slice(0, 3), 'streaming', '')]}
        ui={ui}
      />,
    );
    await waitFor(() => expect(screen.getByTestId('trip-map')).toBeInTheDocument());
  });

  it('starts the surfaces again when the agent rewrites what it had written', async () => {
    const { ui } = setup();
    const surface = line({ createSurface: { surfaceId: 's' } });
    const text = (words: string) =>
      line({
        updateComponents: {
          components: [{ component: 'Text', id: 'root', text: words }],
          surfaceId: 's',
        },
      });
    const { rerender } = renderWithEnglish(
      <AIConversation
        messages={[question, replyWith([surface, text('First draft')])]}
        ui={ui}
      />,
    );
    await waitFor(() => expect(document.body).toHaveTextContent('First draft'));
    rerender(
      <AIConversation
        messages={[question, replyWith([surface, text('Second draft')])]}
        ui={ui}
      />,
    );
    await waitFor(() => expect(document.body).toHaveTextContent('Second draft'));
    expect(document.body).not.toHaveTextContent('First draft');
  });

  it('shows the rest of a batch that one bad component spoils, and says what went wrong', async () => {
    const { errors, ui } = setup();
    const lines = [
      line({ createSurface: { surfaceId: 's' } }),
      line({
        updateComponents: {
          components: [
            { children: ['good', 'bad'], component: 'Column', id: 'root' },
            { component: 'Text', id: 'good', text: 'Still here' },
            { component: 'Slider', id: 'bad', value: 'not a number' },
          ],
          surfaceId: 's',
        },
      }),
    ];
    renderWithEnglish(<AIConversation messages={[question, replyWith(lines)]} ui={ui} />);
    await waitFor(() => expect(document.body).toHaveTextContent('Still here'));
    expect(errors).toEqual([
      expect.objectContaining({ code: 'VALIDATION_FAILED', surfaceId: 's' }),
    ]);
  });

  it('says a message is not JSON, and shows the rest', async () => {
    const { errors, ui } = setup();
    const lines = [
      line({ createSurface: { surfaceId: 's' } }),
      '{not json}',
      line({
        updateComponents: {
          components: [{ component: 'Text', id: 'root', text: 'After the bad one' }],
          surfaceId: 's',
        },
      }),
    ];
    renderWithEnglish(<AIConversation messages={[question, replyWith(lines)]} ui={ui} />);
    await waitFor(() => expect(document.body).toHaveTextContent('After the bad one'));
    expect(errors.map(({ message }) => message)).toContain(
      'A message isn’t a JSON object',
    );
  });

  it('opens links the way the host allows, from the person’s tap only', async () => {
    const { open, ui } = setup();
    const lines = [
      line({ createSurface: { surfaceId: 's' } }),
      line({
        updateComponents: {
          components: [
            {
              action: {
                functionCall: {
                  '@call': 'openUrl',
                  args: { url: 'https://en.wikipedia.org/wiki/Ohrid' },
                },
              },
              child: 'label',
              component: 'Button',
              id: 'root',
            },
            { component: 'Text', id: 'label', text: 'Read about Ohrid' },
          ],
          surfaceId: 's',
        },
      }),
    ];
    renderWithEnglish(<AIConversation messages={[question, replyWith(lines)]} ui={ui} />);
    const read = await screen.findByRole('button', { name: 'Read about Ohrid' });
    expect(open).not.toHaveBeenCalled();
    act(() => {
      fireEvent.click(read);
    });
    await waitFor(() =>
      expect(open).toHaveBeenCalledWith(new URL('https://en.wikipedia.org/wiki/Ohrid')),
    );
  });

  it('opens the links of its Markdown the way the host allows, not wherever they point', async () => {
    const { open, ui } = setup();
    const lines = [
      line({ createSurface: { surfaceId: 's' } }),
      line({
        updateComponents: {
          components: [
            {
              component: 'Text',
              id: 'root',
              text: 'Read [about Ohrid](https://en.wikipedia.org/wiki/Ohrid) first.',
            },
          ],
          surfaceId: 's',
        },
      }),
    ];
    renderWithEnglish(<AIConversation messages={[question, replyWith(lines)]} ui={ui} />);
    const link = await screen.findByRole('link', { name: 'about Ohrid' });
    const followed = fireEvent.click(link);
    expect(followed).toBe(false);
    expect(open).toHaveBeenCalledWith(new URL('https://en.wikipedia.org/wiki/Ohrid'));
  });

  it('opens a Modal as a dialog from its trigger, and closes it from Escape and the backdrop', async () => {
    const { sent, ui } = setup();
    const lines = [
      line({ createSurface: { surfaceId: 's' } }),
      line({
        updateComponents: {
          components: [
            { component: 'Modal', content: 'details', id: 'root', trigger: 'open' },
            {
              action: { event: { name: 'opened_details' } },
              child: 'open_label',
              component: 'Button',
              id: 'open',
            },
            { component: 'Text', id: 'open_label', text: 'Opening times' },
            { component: 'Text', id: 'details', text: 'Open daily, 9 to 5.' },
          ],
          surfaceId: 's',
        },
      }),
    ];
    const { container } = renderWithEnglish(
      <AIConversation messages={[question, replyWith(lines)]} ui={ui} />,
    );
    const trigger = await screen.findByRole('button', { name: 'Opening times' });
    const dialog = container.querySelector(
      'dialog.str-chat__a2ui-modal',
    ) as HTMLDialogElement;
    expect(dialog.open).toBe(false);
    expect(document.body).not.toHaveTextContent('Open daily, 9 to 5.');

    act(() => {
      fireEvent.click(trigger);
    });
    await waitFor(() => expect(dialog.open).toBe(true));
    await waitFor(() => expect(dialog).toHaveTextContent('Open daily, 9 to 5.'));
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    // the trigger's own action still runs
    await waitFor(() => expect(sent[0]?.name).toBe('opened_details'));

    act(() => {
      fireEvent(dialog, new Event('cancel', { cancelable: true }));
    });
    await waitFor(() => expect(dialog.open).toBe(false));

    act(() => {
      fireEvent.click(trigger);
    });
    await waitFor(() => expect(dialog.open).toBe(true));
    act(() => {
      fireEvent.click(dialog);
    });
    await waitFor(() => expect(dialog.open).toBe(false));
  });

  it('opens a Modal whose trigger is not a button from the keyboard', async () => {
    const { ui } = setup();
    const lines = [
      line({ createSurface: { surfaceId: 's' } }),
      line({
        updateComponents: {
          components: [
            { component: 'Modal', content: 'details', id: 'root', trigger: 'label' },
            { component: 'Text', id: 'label', text: 'See the opening times' },
            { component: 'Text', id: 'details', text: 'Open daily, 9 to 5.' },
          ],
          surfaceId: 's',
        },
      }),
    ];
    const { container } = renderWithEnglish(
      <AIConversation messages={[question, replyWith(lines)]} ui={ui} />,
    );
    const trigger = await screen.findByRole('button', { name: /See the opening times/ });
    expect(trigger).toHaveAttribute('tabindex', '0');
    act(() => {
      fireEvent.keyDown(trigger, { key: 'Enter' });
    });
    const dialog = container.querySelector(
      'dialog.str-chat__a2ui-modal',
    ) as HTMLDialogElement;
    await waitFor(() => expect(dialog.open).toBe(true));
  });

  it('shows the text of a finished reply whose A2UI made no surface', async () => {
    const { ui } = setup();
    const { rerender } = renderWithEnglish(
      <AIConversation
        messages={[question, replyWith([line({ deleteSurface: { surfaceId: 'x' } })])]}
        ui={ui}
      />,
    );
    // once the renderer has loaded, which the first reply's view starts
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    rerender(
      <AIConversation
        messages={[
          question,
          replyWith(
            [line({ deleteSurface: { surfaceId: 'x' } })],
            'complete',
            'Just words',
          ),
        ]}
        ui={ui}
      />,
    );
    await waitFor(() => expect(screen.getByText('Just words')).toBeInTheDocument());
  });
});

const surfaceWith = (components: Record<string, unknown>[], dataModel = {}) => [
  line({ createSurface: { dataModel, surfaceId: 's' } }),
  line({ updateComponents: { components, surfaceId: 's' } }),
];

describe('the basic catalog in Stream’s look', () => {
  it('draws Buttons as Stream’s, with their label as words', async () => {
    const { ui } = setup();
    const lines = surfaceWith([
      { children: ['go', 'later'], component: 'Row', id: 'root' },
      {
        action: { event: { name: 'go' } },
        child: 'go_label',
        component: 'Button',
        id: 'go',
        variant: 'primary',
      },
      { component: 'Text', id: 'go_label', text: '**Book** it' },
      {
        action: { event: { name: 'later' } },
        child: 'later_label',
        component: 'Button',
        id: 'later',
        variant: 'borderless',
      },
      { component: 'Text', id: 'later_label', text: 'Later' },
    ]);
    renderWithEnglish(<AIConversation messages={[question, replyWith(lines)]} ui={ui} />);

    const book = await screen.findByRole('button', { name: '**Book** it' });
    expect(book).toHaveClass('str-chat__button--primary', 'str-chat__button--solid');
    expect(book.querySelector('p, strong')).toBeNull();
    expect(screen.getByRole('button', { name: 'Later' })).toHaveClass(
      'str-chat__button--ghost',
    );
  });

  it('draws Markdown and captions, in a Card', async () => {
    const { ui } = setup();
    const lines = surfaceWith([
      { child: 'column', component: 'Card', id: 'root' },
      { children: ['title', 'body', 'note'], component: 'Column', id: 'column' },
      { component: 'Text', id: 'title', text: '### Saturday' },
      { component: 'Text', id: 'body', text: 'Coffee by the **harbour**.' },
      { component: 'Text', id: 'note', text: 'Opens at 8', variant: 'caption' },
    ]);
    const { container } = renderWithEnglish(
      <AIConversation messages={[question, replyWith(lines)]} ui={ui} />,
    );

    const title = await screen.findByRole('heading', { level: 3, name: 'Saturday' });
    expect(title.closest('.str-chat__a2ui-card')).not.toBeNull();
    expect(screen.getByText('harbour').tagName).toBe('STRONG');
    expect(screen.getByText('Opens at 8')).toHaveClass('str-chat__a2ui-text--caption');
    expect(container.querySelector('a2ui-card, a2ui-basic-text')).toBeNull();
  });

  it('keeps what the person types in the data model, and says what its checks found', async () => {
    const { sent, ui } = setup();
    const lines = surfaceWith(
      [
        { children: ['name', 'notes', 'send'], component: 'Column', id: 'root' },
        {
          checks: [
            {
              condition: { '@call': 'required', args: { value: { '@path': '/name' } } },
              message: 'Say who is coming',
            },
          ],
          component: 'TextField',
          id: 'name',
          label: 'Who is coming',
          value: { '@path': '/name' },
        },
        {
          component: 'TextField',
          id: 'notes',
          label: 'Anything else',
          value: { '@path': '/notes' },
          variant: 'longText',
        },
        {
          action: {
            event: {
              context: { name: { '@path': '/name' }, notes: { '@path': '/notes' } },
              name: 'book',
            },
          },
          child: 'send_label',
          component: 'Button',
          id: 'send',
        },
        { component: 'Text', id: 'send_label', text: 'Book' },
      ],
      { name: '', notes: '' },
    );
    renderWithEnglish(<AIConversation messages={[question, replyWith(lines)]} ui={ui} />);

    const name = await screen.findByRole('textbox', { name: 'Who is coming' });
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Say who is coming');
    act(() => {
      fireEvent.change(name, { target: { value: 'Ana and Marko' } });
    });
    await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'false'));
    expect(screen.queryByText('Say who is coming')).not.toBeInTheDocument();

    const notes = screen.getByRole('textbox', { name: 'Anything else' });
    expect(notes.tagName).toBe('TEXTAREA');
    act(() => {
      fireEvent.change(notes, { target: { value: 'A room by the lake' } });
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    });
    await waitFor(() =>
      expect(sent[0]?.payload).toMatchObject({
        context: { name: 'Ana and Marko', notes: 'A room by the lake' },
      }),
    );
  });

  it('chooses one option or several, as chips or check marks, and filters them', async () => {
    const { sent, ui } = setup();
    const lines = surfaceWith(
      [
        { children: ['pace', 'interests', 'send'], component: 'Column', id: 'root' },
        {
          component: 'ChoicePicker',
          displayStyle: 'chips',
          id: 'pace',
          label: 'Pace',
          options: [
            { label: 'Relaxed', value: 'relaxed' },
            { label: 'Packed', value: 'packed' },
          ],
          value: { '@path': '/pace' },
        },
        {
          component: 'ChoicePicker',
          filterable: true,
          id: 'interests',
          label: 'More of',
          options: [
            { label: 'History', value: 'history' },
            { label: 'Food', value: 'food' },
            { label: 'Nature', value: 'nature' },
          ],
          value: { '@path': '/interests' },
          variant: 'multipleSelection',
        },
        {
          action: {
            event: {
              context: {
                interests: { '@path': '/interests' },
                pace: { '@path': '/pace' },
              },
              name: 'update_plan',
            },
          },
          child: 'send_label',
          component: 'Button',
          id: 'send',
        },
        { component: 'Text', id: 'send_label', text: 'Update the plan' },
      ],
      { interests: [], pace: ['relaxed'] },
    );
    renderWithEnglish(<AIConversation messages={[question, replyWith(lines)]} ui={ui} />);

    const pace = await screen.findByRole('group', { name: 'Pace' });
    const relaxed = within(pace).getByRole('button', { name: 'Relaxed' });
    const packed = within(pace).getByRole('button', { name: 'Packed' });
    expect(relaxed).toHaveAttribute('aria-pressed', 'true');
    act(() => {
      fireEvent.click(packed);
    });
    await waitFor(() => expect(packed).toHaveAttribute('aria-pressed', 'true'));
    expect(relaxed).toHaveAttribute('aria-pressed', 'false');

    const interests = screen.getByRole('group', { name: 'More of' });
    act(() => {
      fireEvent.click(within(interests).getByRole('checkbox', { name: 'History' }));
    });
    act(() => {
      fireEvent.click(within(interests).getByRole('checkbox', { name: 'Food' }));
    });
    act(() => {
      fireEvent.change(within(interests).getByRole('searchbox', { name: 'Search' }), {
        target: { value: 'nat' },
      });
    });
    expect(within(interests).queryByRole('checkbox', { name: 'Food' })).toBeNull();
    expect(within(interests).getByRole('checkbox', { name: 'Nature' })).not.toBeChecked();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Update the plan' }));
    });
    await waitFor(() =>
      expect(sent[0]?.payload).toMatchObject({
        context: { interests: ['history', 'food'], pace: ['packed'] },
      }),
    );
  });

  it('draws icons as Stream’s or the app’s, in its icon font, or as nothing', async () => {
    const Cart = () => <svg data-testid='cart' />;
    const icons = (names: string[]) =>
      surfaceWith([
        { children: names, component: 'Row', id: 'root' },
        ...names.map((name) => ({ component: 'Icon', id: name, name })),
      ]);
    const names = ['search', 'shoppingCart', 'payment'];

    const withFont = setup({
      iconFont: 'Material Symbols Outlined',
      icons: { shoppingCart: Cart },
    });
    const { unmount } = renderWithEnglish(
      <AIConversation messages={[question, replyWith(icons(names))]} ui={withFont.ui} />,
    );
    const search = await screen.findByRole('img', { name: 'search' });
    expect(search.querySelector('svg.str-chat__icon--search')).not.toBeNull();
    expect(
      within(screen.getByRole('img', { name: 'shopping cart' })).getByTestId('cart'),
    ).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'payment' })).toHaveTextContent('payment');
    unmount();

    const { ui } = setup();
    renderWithEnglish(
      <AIConversation messages={[question, replyWith(icons(names))]} ui={ui} />,
    );
    await screen.findByRole('img', { name: 'search' });
    expect(screen.getByRole('img', { name: 'payment' })).toHaveTextContent('');
    expect(screen.getByRole('img', { name: 'shopping cart' })).toHaveTextContent('');
  });
});

describe('a reply’s parts coming in', () => {
  const text = (id: string, words: string) => ({ component: 'Text', id, text: words });
  const column = (children: string[]) => ({ children, component: 'Column', id: 'root' });

  it('shows a reply from history whole, its parts with it', async () => {
    const { ui } = setup();
    const lines = surfaceWith([
      column(['a', 'b']),
      text('a', 'First'),
      text('b', 'Second'),
    ]);
    renderWithEnglish(<AIConversation messages={[question, replyWith(lines)]} ui={ui} />);
    const second = await screen.findByText('Second');
    expect(second.closest('[data-entrance]')).toHaveAttribute('data-entrance', 'shown');
    expect(screen.getByText('First').closest('[data-entrance]')).toHaveAttribute(
      'data-entrance',
      'shown',
    );
  });

  it('brings in a part the agent writes once the reply has come in', async () => {
    const { ui } = setup();
    const first = surfaceWith([column(['a']), text('a', 'First')]);
    const { rerender } = renderWithEnglish(
      <AIConversation messages={[question, replyWith(first, 'streaming', '')]} ui={ui} />,
    );
    const stage = (await screen.findByText('First')).closest('.str-chat__ai-ui');
    await waitFor(() => expect(stage).toHaveAttribute('data-entrance', 'shown'));
    const more = [
      ...first,
      line({
        updateComponents: {
          components: [column(['a', 'b']), text('b', 'Second')],
          surfaceId: 's',
        },
      }),
    ];
    rerender(
      <AIConversation messages={[question, replyWith(more, 'streaming', '')]} ui={ui} />,
    );
    const second = (await screen.findByText('Second')).closest('[data-entrance]');
    expect(second).toHaveAttribute('data-entrance', 'hidden');
    await waitFor(() => expect(second).toHaveAttribute('data-entrance', 'shown'));
  });
});
