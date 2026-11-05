import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  AIConversation,
  type AIMessage,
  type AIUIAction,
  type AIUIClientTool,
  AIUIHost,
  defineAIUIComponent,
  fromStreamMessage,
  parseAIUIComponentDefinition,
} from '../../AIComponents';
import { ResizeObserverMock } from '../../../mock-builders/browser';
import { uiComponents } from '../../A2UI/__tests__/ohrid';
import {
  createOpenUIRenderer,
  OPENUI_FENCE,
  type OpenUIError,
  openUIInstructions,
  type OpenUIRendererOptions,
} from '..';
import { actOn, hostToolProvider, openUIDescriptionOf, openUITypeName } from '../runtime';
import type { OpenUIEngine } from '../OpenUIRenderer';
import { ohridProgram } from './ohrid';

// OpenUI's Tabs measure their list, and jsdom has no ResizeObserver to measure it with.
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

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

const setup = (options: OpenUIRendererOptions = {}) => {
  const sent: AIUIAction[] = [];
  const errors: OpenUIError[] = [];
  const open = vi.fn();
  const ui = new AIUIHost({
    components: [placeCard, tripMap, calendarCheck],
    open,
    renderers: [
      createOpenUIRenderer({ ...options, onError: (error) => errors.push(error) }),
    ],
    send: (action) => {
      sent.push(action);
    },
  });
  return { errors, open, sent, ui };
};

const question: AIMessage = { id: 'u1', role: 'user', text: 'Plan a weekend in Ohrid' };
const replyWith = (program: string, status = 'complete', text = 'A weekend in Ohrid.') =>
  fromStreamMessage({
    attachments: [],
    custom: {
      ai_generated: true,
      ai_ui: { content: program, format: 'openui', status, v: 1 },
    },
    id: 'a1',
    text,
  });

const show = (ui: AIUIHost, program: string, status = 'complete') =>
  render(<AIConversation messages={[question, replyWith(program, status)]} ui={ui} />);

describe('a reply written in OpenUI', () => {
  it('shows the Ohrid plan with OpenUI’s chat library and the app’s components', async () => {
    const { errors, ui } = setup();
    show(ui, ohridProgram);

    await waitFor(() =>
      expect(screen.getByTestId('trip-map')).toHaveTextContent(
        'Church of St. John at Kaneo',
      ),
    );
    expect(screen.getByTestId('calendar-check')).toHaveTextContent('14–15');
    expect(document.body).toHaveTextContent('A weekend in Ohrid');
    expect(document.body).toHaveTextContent('Two easy days by the lake');
    expect(screen.getByText('Find a hotel by the lake')).toBeInTheDocument();
    expect(screen.queryByText('A weekend in Ohrid.')).not.toBeInTheDocument();
    expect(errors).toEqual([]);
  });

  it('tells the agent what the person chose and submitted, in their words', async () => {
    const { sent, ui } = setup();
    show(ui, ohridProgram);

    const packed = await screen.findByText('Packed');
    act(() => {
      fireEvent.click(packed);
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Update the plan' }));
    });
    await waitFor(() => expect(sent).toHaveLength(1));
    // The person's message is what the button they pressed says; what the program wrote for
    // the agent goes with it.
    expect(sent[0]).toMatchObject({
      format: 'openui',
      label: 'Update the plan',
      messageId: 'a1',
      name: 'continue_conversation',
      payload: { form: 'refine', message: 'Update the plan with my choices' },
    });
    expect(JSON.stringify(sent[0].payload.values)).toContain('packed');

    act(() => {
      fireEvent.click(screen.getByText('Where should we eat?'));
    });
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]).toMatchObject({
      label: 'Where should we eat?',
      name: 'continue_conversation',
    });
    expect(sent[1].payload).not.toHaveProperty('values');
  });

  it('places the app’s components where the agent wrote them, and they report their events', async () => {
    const { sent, ui } = setup();
    show(ui, ohridProgram);

    // OpenUI opens the tab written last; Saturday's places are on the first.
    const saturday = await screen.findByRole('tab', { name: 'Saturday' });
    act(() => {
      fireEvent.mouseDown(saturday, { button: 0 });
    });
    const plaosnik = (await screen.findAllByTestId('place-card')).find((card) =>
      card.textContent?.startsWith('Plaošnik'),
    );
    expect(plaosnik).toHaveTextContent('Plaošnik (1 hour)');
    act(() => {
      fireEvent.click(plaosnik as HTMLElement);
    });
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toEqual({
      format: 'openui',
      label: 'Tell me more about Plaošnik',
      messageId: 'a1',
      name: 'ask_about',
      payload: { component: 'place_card', title: 'Plaošnik' },
    });
  });

  it('opens links the way the host allows', async () => {
    const { open, ui } = setup();
    const program = [
      'root = Card([intro, read])',
      'intro = TextContent("Read [about Ohrid](https://en.wikipedia.org/wiki/Ohrid) first.")',
      'read = Buttons([Button("Read about Ohrid", @OpenUrl("https://en.wikipedia.org/wiki/Ohrid"))])',
    ].join('\n');
    show(ui, program);

    await screen.findByRole('link', { name: 'about Ohrid' });
    // OpenUI renders its Markdown once more after it first shows.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    const link = screen.getByRole('link', { name: 'about Ohrid' });
    expect(fireEvent.click(link)).toBe(false);
    expect(open).toHaveBeenCalledWith(new URL('https://en.wikipedia.org/wiki/Ohrid'));
    open.mockClear();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Read about Ohrid' }));
    });
    await waitFor(() =>
      expect(open).toHaveBeenCalledWith(new URL('https://en.wikipedia.org/wiki/Ohrid')),
    );
  });

  it('keeps what the person chose when the reply shows again', async () => {
    const { ui } = setup();
    const { unmount } = show(ui, ohridProgram);
    const packed = await screen.findByText('Packed');
    act(() => {
      fireEvent.click(packed);
    });
    await waitFor(() => expect(JSON.stringify(ui.state('a1'))).toContain('packed'));
    unmount();

    show(ui, ohridProgram);
    await screen.findByText('Packed');
    expect(JSON.stringify(ui.state('a1'))).toContain('packed');
  });

  it('follows a program as the agent writes it, and says what is wrong once it is written', async () => {
    const { errors, ui } = setup();
    const lines = ohridProgram.split('\n');
    const { rerender } = show(ui, lines.slice(0, 3).join('\n'), 'streaming');
    await waitFor(() => expect(document.body).toHaveTextContent('A weekend in Ohrid'));
    expect(errors).toEqual([]);

    const wrong = `${lines.slice(0, 3).join('\n')}\nmap = Globe("Ohrid")`;
    rerender(
      <AIConversation messages={[question, replyWith(wrong, 'streaming')]} ui={ui} />,
    );
    rerender(<AIConversation messages={[question, replyWith(wrong)]} ui={ui} />);
    await waitFor(() => expect(errors.length).toBeGreaterThan(0));
    const reported = errors.length;
    rerender(<AIConversation messages={[question, replyWith(wrong)]} ui={ui} />);
    expect(errors).toHaveLength(reported);
    expect(document.body).toHaveTextContent('Two easy days by the lake');
  });
});

describe('a reply whose OpenUI draws nothing', () => {
  it('shows the reply’s text once it is written, from history too', async () => {
    const { ui } = setup();
    render(
      <AIConversation
        messages={[
          question,
          replyWith(
            'Here is your weekend:\n\n- Saturday: the old town\n- Sunday: the lake',
            'complete',
            'A weekend in Ohrid, in words.',
          ),
        ]}
        ui={ui}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText('A weekend in Ohrid, in words.')).toBeInTheDocument(),
    );
  });
});

describe('what is wrong with the renderer rather than a reply', () => {
  it('is told without a reply’s id, such as an app’s component whose name OpenUI has', async () => {
    const told: { code: string; messageId?: string }[] = [];
    const card = defineAIUIComponent(
      { ...definitionOf('place_card'), name: 'card' },
      () => null,
    );
    const ui = new AIUIHost({
      components: [card],
      renderers: [
        createOpenUIRenderer({
          onError: ({ code }, messageId) => told.push({ code, messageId }),
        }),
      ],
      send: vi.fn(),
    });
    show(ui, 'root = Card([TextContent("A weekend in Ohrid")])');
    await waitFor(() =>
      expect(told).toContainEqual({ code: 'component-name-taken', messageId: undefined }),
    );
  });
});

describe('the app’s page', () => {
  it('keeps OpenUI’s development inspector off it', async () => {
    const { ui } = setup();
    show(ui, ohridProgram);
    await screen.findByTestId('trip-map');
    expect(
      (globalThis as Record<symbol, unknown>)[Symbol.for('openui.devtools.autoMount')],
    ).toBe(true);
    expect(document.querySelector('[data-openui-devtools-auto-mount]')).toBeNull();
  });
});

describe('OpenUI actions', () => {
  it('leaves what the person typed in a password field out of what goes to the agent', () => {
    const sent: AIUIAction[] = [];
    const engine = {
      host: { open: vi.fn(), send: (action: AIUIAction) => sent.push(action) },
    } as unknown as OpenUIEngine;
    actOn(
      engine,
      'a1',
      {
        formName: 'sign_in',
        formState: {
          sign_in: {
            email: { componentType: 'Input', value: 'ana@example.com' },
            password: { componentType: 'Input', value: 'hunter2' },
          },
        },
        humanFriendlyMessage: 'Sign in as ana with hunter2',
        params: { context: { echo: 'hunter2', plan: 'weekend' } },
        type: 'continue_conversation',
      },
      {
        pressed: { at: Date.now(), words: 'Sign in' },
        secrets: { fields: new Set(['password']), variables: new Set() },
      },
    );
    expect(sent[0]).toMatchObject({ label: 'Sign in' });
    expect(sent[0].payload).toEqual({
      context: { echo: '', plan: 'weekend' },
      form: 'sign_in',
      message: 'Sign in as ana with',
      values: {
        sign_in: { email: { componentType: 'Input', value: 'ana@example.com' } },
      },
    });
    expect(JSON.stringify(sent[0])).not.toContain('hunter2');
  });

  it('keeps a password the person types out of the action and of what the host keeps', async () => {
    const { sent, ui } = setup();
    show(
      ui,
      [
        'root = Card([f])',
        'f = Form("sign_in", b, [c1, c2])',
        'c1 = FormControl("Email", Input("email", "Email"))',
        'c2 = FormControl("Password", Input("password", "Password", "password"))',
        'b = Buttons([Button("Sign in", Action([@ToAssistant("Sign me in")]), "primary")])',
      ].join('\n'),
    );
    const [email, password] = (await screen.findAllByRole('textbox')).concat([
      ...document.querySelectorAll('input[type="password"]'),
    ] as HTMLElement[]);
    act(() => {
      fireEvent.change(email, { target: { value: 'ana@example.com' } });
      fireEvent.change(password, { target: { value: 'hunter2' } });
    });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0].label).toBe('Sign in');
    expect(JSON.stringify(sent[0])).toContain('ana@example.com');
    expect(JSON.stringify(sent[0])).not.toContain('hunter2');
    expect(JSON.stringify(ui.state('a1') ?? {})).not.toContain('hunter2');
  });

  it('sends no action the library defines but the agent can’t take, and says so', () => {
    const sent: AIUIAction[] = [];
    const report = vi.fn();
    const engine = {
      host: { open: vi.fn(), send: (action: AIUIAction) => sent.push(action) },
      report,
    } as unknown as OpenUIEngine;
    actOn(engine, 'a1', {
      formName: undefined,
      formState: undefined,
      humanFriendlyMessage: 'Delete everything',
      params: {},
      type: 'delete_all',
    });
    expect(sent).toEqual([]);
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'unknown-action' }),
      'a1',
    );
  });
});

describe('the app’s tools in a program', () => {
  const engineWith = (tools: AIUIClientTool[]) =>
    ({ host: new AIUIHost({ renderers: [], send: vi.fn(), tools }) }) as OpenUIEngine;

  it('runs one that changes something only while the person acts', async () => {
    const book = vi.fn(() => ({ booked: true }));
    const provider = hostToolProvider(engineWith([{ name: 'book_table', run: book }]));
    await expect(provider.book_table({ table: 4 })).rejects.toThrow(
      'changes something, so it runs only from something the person did',
    );
    expect(book).not.toHaveBeenCalled();
    // A tap gives the page the browser's activation for a moment.
    Object.defineProperty(navigator, 'userActivation', {
      configurable: true,
      value: { isActive: true },
    });
    try {
      await expect(provider.book_table({ table: 4 })).resolves.toEqual({ booked: true });
    } finally {
      delete (navigator as { userActivation?: unknown }).userActivation;
    }
  });

  it('answers a Query that asks again within 5 s with what it got, rather than running the tool', async () => {
    const weather = vi.fn(() => ({ celsius: 12 }));
    const provider = hostToolProvider(
      engineWith([{ name: 'weather', readOnly: true, run: weather }]),
    );
    for (let i = 0; i < 5; i++) await provider.weather({ city: 'Ohrid' });
    expect(weather).toHaveBeenCalledTimes(1);
    await provider.weather({ city: 'Struga' });
    expect(weather).toHaveBeenCalledTimes(2);
  });
});

describe('media a program links to', () => {
  it('loads public web images and leaves out others, such as one on the person’s network', async () => {
    const { ui } = setup();
    show(
      ui,
      [
        'root = Card([a, b, c])',
        'a = ImageBlock("https://upload.wikimedia.org/ohrid.jpg", "Ohrid")',
        'b = ImageBlock("http://192.168.1.1/admin.png", "Router")',
        'c = ImageBlock("data:image/png;base64,AAAA", "Pixel")',
      ].join('\n'),
    );
    await waitFor(() =>
      expect(
        [...document.querySelectorAll('img')].some((img) =>
          img.getAttribute('src')?.startsWith('https://upload.wikimedia.org'),
        ),
      ).toBe(true),
    );
    const sources = [...document.querySelectorAll('img')].map((img) =>
      img.getAttribute('src'),
    );
    expect(sources.join(' ')).not.toContain('192.168.1.1');
    expect(sources.join(' ')).not.toContain('data:');
  });
});

describe('what the agent is told', () => {
  it('names and describes the app’s components as StreamChatOpenUI does', () => {
    expect(openUITypeName('calendar_check')).toBe('CalendarCheck');
    expect(openUIDescriptionOf(definitionOf('place_card'))).toMatch(
      /^One place of a plan.*title: The place's exact English Wikipedia article title.*Tapping the card asks you about the place\.$/,
    );
  });

  it('tells the agent’s backend its fence and instructions with the app’s components, as StreamChatOpenUI does', async () => {
    const { ui } = setup();
    const { renderers } = await ui.capabilities();
    const instructions = await openUIInstructions([placeCard, tripMap, calendarCheck]);
    expect(renderers).toEqual([{ fence: OPENUI_FENCE, format: 'openui', instructions }]);
    expect(instructions).toContain('PlaceCard(title: string, note?: string)');
    expect(instructions).toContain('TripMap(places:');
    expect(instructions).toMatch(
      /TabItem\(value: string, trigger: string, content: \([^)]*PlaceCard/,
    );
  });

  it('lists the app’s tools, saying which a Query can run, after the app’s own instructions', async () => {
    const ui = new AIUIHost({
      renderers: [
        createOpenUIRenderer({ instructions: 'Answer trip questions with UI.' }),
      ],
      send: vi.fn(),
      tools: [
        {
          description: 'Today’s weather in a city.',
          inputSchema: { properties: { city: { type: 'string' } }, type: 'object' },
          name: 'weather',
          readOnly: true,
          run: vi.fn(),
        },
        { description: 'Books a table.', name: 'book_table', run: vi.fn() },
      ],
    });
    const { renderers, tools } = await ui.capabilities();
    const instructions = String(
      (renderers[0] as unknown as { instructions: string }).instructions,
    );
    expect(instructions.startsWith('Answer trip questions with UI.')).toBe(true);
    expect(instructions).toContain('weather');
    expect(instructions).toContain('Read-only: use it in Query() or Mutation().');
    expect(instructions).toContain('book_table');
    expect(instructions).toContain('use it only in Mutation()');
    expect(tools).toEqual([
      expect.objectContaining({ annotations: { readOnlyHint: true }, name: 'weather' }),
      expect.objectContaining({
        annotations: { readOnlyHint: false },
        name: 'book_table',
      }),
    ]);
  });
});
