import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { SectionNavigatorHeader } from '../SectionNavigatorHeader';

const mocks = vi.hoisted(() => ({
  closeNavigation: vi.fn(),
  layout: 'tabs',
  openNavigation: vi.fn(),
}));

vi.mock('../../../../context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../context')>();

  return {
    ...actual,
    useModalContext: () => ({ close: vi.fn(), dialogId: 'dialog-1' }),
    useTranslationContext: () => ({ t: (key: string) => key }),
  };
});

vi.mock('../SectionNavigator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../SectionNavigator')>();

  return {
    ...actual,
    useSectionNavigatorContext: () => ({
      closeNavigation: mocks.closeNavigation,
      history: [],
      historyPop: vi.fn(),
      historyPush: vi.fn(),
      isNavigationOpen: false,
      layout: mocks.layout,
      openNavigation: mocks.openNavigation,
    }),
  };
});

describe('SectionNavigatorHeader', () => {
  beforeEach(() => {
    mocks.layout = 'tabs';
    mocks.openNavigation.mockClear();
  });

  it('does not render the menu button in the tabs layout', () => {
    render(<SectionNavigatorHeader title='Files' />);

    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
  });

  it('renders a menu button that opens the navigation in the inline layout', () => {
    mocks.layout = 'inline';

    render(<SectionNavigatorHeader title='Files' />);

    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(menuButton);

    expect(mocks.openNavigation).toHaveBeenCalledTimes(1);
  });

  it('does not render the menu button on nested views that allow going back', () => {
    mocks.layout = 'inline';

    render(<SectionNavigatorHeader goBack={vi.fn()} title='Member detail' />);

    expect(screen.getByText('Member detail')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
  });

  it('gives the close button a concise "Close" label for a string title', () => {
    render(<SectionNavigatorHeader close={vi.fn()} title='Files' />);

    // The dialog is already named by its title (aria-labelledby), so the close button stays concise.
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('renders a ReactNode title with the same concise close label', () => {
    render(<SectionNavigatorHeader close={vi.fn()} title={<span>Custom title</span>} />);

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
