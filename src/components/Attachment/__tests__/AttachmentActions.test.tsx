import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react';

import { nanoid } from 'nanoid';
import { AttachmentActions } from '../AttachmentActions';
import { axe } from '../../../../axe-helper';

const { announceInteractionMock, reserveMock, restoreMock } = vi.hoisted(() => ({
  announceInteractionMock: vi.fn(),
  reserveMock: vi.fn(),
  restoreMock: vi.fn(),
}));

vi.mock('../../Accessibility', () => ({
  useFocusReturn: () => ({ reserve: reserveMock, restore: restoreMock }),
  useInteractionAnnouncements: () => ({
    announceInteraction: announceInteractionMock,
  }),
}));

vi.mock('../../../context', () => ({
  useTranslationContext: () => ({ t: (key) => key.replace(/^aria\//, '') }),
}));

const getComponent = (props) => <AttachmentActions {...props} />;
const actions = [
  {
    name: 'action 1 name',
    text: 'action 1 text',
    value: 'action 1',
  },
  {
    name: 'action 2 name',
    text: 'action 2 text',
    value: 'action 2',
  },
];

const giphyActions = [
  { name: 'image_action', style: 'primary', text: 'Send', value: 'send' },
  { name: 'image_action', style: 'default', text: 'Shuffle', value: 'shuffle' },
  { name: 'image_action', style: 'default', text: 'Cancel', value: 'cancel' },
];

describe('AttachmentActions', () => {
  beforeEach(() => {
    announceInteractionMock.mockClear();
    reserveMock.mockClear();
    restoreMock.mockClear();
  });

  it('should render AttachmentActions component', () => {
    const { container } = render(
      getComponent({
        actionHandler: vi.fn(),
        actions,
        id: nanoid(),
      }),
    );
    expect(container).toMatchSnapshot();
  });
  it('should call actionHandler on click', async () => {
    const actionHandler = vi.fn();
    const { getByTestId } = render(
      getComponent({
        actionHandler,
        actions,
        id: nanoid(),
      }),
    );

    await waitFor(() => {
      expect(getByTestId(actions[0].name)).toBeInTheDocument();
    });

    fireEvent.click(getByTestId(actions[0].name));
    fireEvent.click(getByTestId(actions[1].name));

    await waitFor(() => {
      expect(actionHandler).toHaveBeenCalledTimes(2);
    });
  });

  it('should focus default action by value', async () => {
    const { getByTestId } = render(
      getComponent({
        actions,
        defaultFocusedActionValue: actions[1].value,
        id: nanoid(),
      }),
    );

    await waitFor(() => {
      expect(getByTestId(actions[1].name)).toHaveFocus();
    });
  });

  describe('giphy accessibility', () => {
    const renderGiphy = (overrides = {}) =>
      render(
        getComponent({
          actionHandler: vi.fn(),
          actions: giphyActions,
          id: nanoid(),
          text: 'cats',
          type: 'giphy',
          ...overrides,
        }),
      );

    it('describes the auto-focused action with the preview context, without a live announcement', () => {
      // The preview is focus-coupled: it auto-focuses the primary action, so the description
      // rides the focus event via aria-describedby — NOT a live-region announcement (which the
      // focus change would preempt). See decisions.md / SKILL.md §3.
      const { getByRole } = renderGiphy({ defaultFocusedActionValue: 'send' });

      expect(announceInteractionMock).not.toHaveBeenCalled();

      const send = getByRole('button', { name: 'Send' });
      const describedById = send.getAttribute('aria-describedby');
      expect(describedById).toBeTruthy();
      expect(document.getElementById(describedById as string)).toHaveTextContent(
        'Giphy preview, only visible to you. Use the Send, Shuffle, or Cancel actions.',
      );
    });

    it('describes only the auto-focused action, not the other giphy actions', () => {
      const { getByRole } = renderGiphy({ defaultFocusedActionValue: 'send' });
      expect(getByRole('button', { name: 'Shuffle' })).not.toHaveAttribute(
        'aria-describedby',
      );
      expect(getByRole('button', { name: 'Cancel' })).not.toHaveAttribute(
        'aria-describedby',
      );
    });

    it('does not describe or announce for non-giphy actions', () => {
      const { getByRole } = render(
        getComponent({
          actionHandler: vi.fn(),
          actions,
          defaultFocusedActionValue: 'action 1',
          id: nanoid(),
        }),
      );
      expect(announceInteractionMock).not.toHaveBeenCalled();
      expect(getByRole('button', { name: 'action 1 text' })).not.toHaveAttribute(
        'aria-describedby',
      );
    });

    it('wraps the actions in a labelled group with three reachable, named buttons', () => {
      const { getByRole } = renderGiphy();
      const group = getByRole('group', { name: 'Giphy actions' });

      expect(group).toBeInTheDocument();
      expect(within(group).getByRole('button', { name: 'Send' })).toBeInTheDocument();
      expect(within(group).getByRole('button', { name: 'Shuffle' })).toBeInTheDocument();
      expect(within(group).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('gives the Send button a self-contained accessible name (no list context)', () => {
      const { getByRole } = renderGiphy();
      const send = getByRole('button', { name: 'Send' });
      // explicit aria-label means the accessible name is exactly "Send"
      expect(send).toHaveAttribute('aria-label', 'Send');
    });

    it('returns focus synchronously on Send, then announces "giphy.sent" on the next frame', async () => {
      const { getByRole } = renderGiphy();
      announceInteractionMock.mockClear();
      restoreMock.mockClear();

      fireEvent.click(getByRole('button', { name: 'Send' }));

      // Focus moves immediately; the announcement is deferred (focus-first ordering) so the
      // screen reader speaks "Message input" then "Giphy sent" deterministically.
      expect(restoreMock).toHaveBeenCalledTimes(1);
      expect(announceInteractionMock).not.toHaveBeenCalled();

      await waitFor(() =>
        expect(announceInteractionMock).toHaveBeenCalledWith('giphy.sent'),
      );
      expect(announceInteractionMock).toHaveBeenCalledTimes(1);
      // focus is invoked before the announcement
      expect(restoreMock.mock.invocationCallOrder[0]).toBeLessThan(
        announceInteractionMock.mock.invocationCallOrder[0],
      );
    });

    it('returns focus synchronously on Cancel, then announces "giphy.canceled" on the next frame', async () => {
      const { getByRole } = renderGiphy();
      announceInteractionMock.mockClear();
      restoreMock.mockClear();

      fireEvent.click(getByRole('button', { name: 'Cancel' }));

      expect(restoreMock).toHaveBeenCalledTimes(1);
      expect(announceInteractionMock).not.toHaveBeenCalled();

      await waitFor(() =>
        expect(announceInteractionMock).toHaveBeenCalledWith('giphy.canceled'),
      );
      expect(announceInteractionMock).toHaveBeenCalledTimes(1);
      expect(restoreMock.mock.invocationCallOrder[0]).toBeLessThan(
        announceInteractionMock.mock.invocationCallOrder[0],
      );
    });

    it('clicking Shuffle alone announces nothing and does not return focus (the announcement is image-change driven)', () => {
      const { getByRole } = renderGiphy();
      announceInteractionMock.mockClear();

      fireEvent.click(getByRole('button', { name: 'Shuffle' }));

      expect(announceInteractionMock).not.toHaveBeenCalled();
      expect(restoreMock).not.toHaveBeenCalled();
    });

    it('announces "giphy.shuffled" when the GIF image changes after mount (not on mount)', () => {
      const props = {
        actionHandler: vi.fn(),
        actions: giphyActions,
        id: 'giphy-1',
        image_url: 'http://giphy/a',
        text: 'cats',
        type: 'giphy' as const,
      };
      const { rerender } = render(getComponent(props));

      // The preview appearing must NOT fire a shuffle announcement.
      expect(announceInteractionMock).not.toHaveBeenCalledWith(
        'giphy.shuffled',
        expect.anything(),
      );
      announceInteractionMock.mockClear();

      rerender(getComponent({ ...props, image_url: 'http://giphy/b' }));

      expect(announceInteractionMock).toHaveBeenCalledWith('giphy.shuffled', {
        title: undefined,
      });
    });

    it('includes a human (non-URL) title in the shuffle announcement when present', () => {
      const props = {
        actionHandler: vi.fn(),
        actions: giphyActions,
        id: 'giphy-2',
        image_url: 'http://giphy/a',
        text: 'cats',
        title: 'Dancing cat',
        type: 'giphy' as const,
      };
      const { rerender } = render(getComponent(props));
      announceInteractionMock.mockClear();

      rerender(getComponent({ ...props, image_url: 'http://giphy/b' }));

      expect(announceInteractionMock).toHaveBeenCalledWith('giphy.shuffled', {
        title: 'Dancing cat',
      });
    });

    it('announces a shuffle when only the giphy versions change (image_url constant)', () => {
      // Regression: a real shuffle changes thumb_url / giphy[*].url, not necessarily image_url.
      // A single-field (image_url) identity would announce at most once ("only first shuffle").
      const props = {
        actionHandler: vi.fn(),
        actions: giphyActions,
        giphy: { original: { url: 'http://giphy/v1' } },
        id: 'giphy-4',
        image_url: 'http://static-constant',
        text: 'cats',
        type: 'giphy' as const,
      };
      const { rerender } = render(getComponent(props));
      announceInteractionMock.mockClear();

      rerender(
        getComponent({ ...props, giphy: { original: { url: 'http://giphy/v2' } } }),
      );
      expect(announceInteractionMock).toHaveBeenCalledWith('giphy.shuffled', {
        title: undefined,
      });

      announceInteractionMock.mockClear();
      rerender(
        getComponent({ ...props, giphy: { original: { url: 'http://giphy/v3' } } }),
      );
      expect(announceInteractionMock).toHaveBeenCalledWith('giphy.shuffled', {
        title: undefined,
      });
    });

    it('does not announce a shuffle when the GIF image is unchanged', () => {
      const props = {
        actionHandler: vi.fn(),
        actions: giphyActions,
        id: 'giphy-3',
        image_url: 'http://giphy/a',
        text: 'cats',
        type: 'giphy' as const,
      };
      const { rerender } = render(getComponent(props));
      announceInteractionMock.mockClear();

      rerender(getComponent({ ...props, text: 'dogs' })); // unrelated change, same image

      expect(announceInteractionMock).not.toHaveBeenCalledWith(
        'giphy.shuffled',
        expect.anything(),
      );
    });

    it('is free of axe violations', async () => {
      const { container } = renderGiphy();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
