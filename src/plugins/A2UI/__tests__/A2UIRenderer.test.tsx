import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';

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

const setup = () => {
  const sent: AIUIAction[] = [];
  const errors: { code: string; message: string }[] = [];
  const open = vi.fn();
  const ui = new AIUIHost({
    components: [placeCard, tripMap, calendarCheck],
    open,
    renderers: [createA2UIRenderer({ onError: (error) => errors.push(error) })],
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
    const { container } = renderWithEnglish(
      <AIConversation messages={[question, replyWith(ohridLines)]} ui={ui} />,
    );

    await waitFor(() =>
      expect(container.querySelector('a2ui-basic-button button')).not.toBeNull(),
    );
    const update = [...container.querySelectorAll('a2ui-basic-button button')].find(
      (button) => button.textContent?.includes('Update the plan'),
    );
    if (!update) throw new Error('no Update the plan button');
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
    const { container } = renderWithEnglish(
      <AIConversation messages={[question, replyWith(lines)]} ui={ui} />,
    );
    await waitFor(() =>
      expect(container.querySelector('a2ui-basic-button button')).not.toBeNull(),
    );
    act(() => {
      fireEvent.click(container.querySelector('a2ui-basic-button button') as Element);
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
    const { container } = renderWithEnglish(
      <AIConversation messages={[question, replyWith(lines)]} ui={ui} />,
    );
    await waitFor(() =>
      expect(container.querySelector('a2ui-basic-button button')).not.toBeNull(),
    );
    expect(open).not.toHaveBeenCalled();
    act(() => {
      fireEvent.click(container.querySelector('a2ui-basic-button button') as Element);
    });
    await waitFor(() =>
      expect(open).toHaveBeenCalledWith(new URL('https://en.wikipedia.org/wiki/Ohrid')),
    );
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
