import React from 'react';

import { cleanup, render } from '@testing-library/react';
import { axe } from '../../../../axe-helper';

import { TranslationProvider } from '../../../context';
import type { RoleItemProps, UserItemProps } from '../SuggestionList';
import { MentionItem } from '../SuggestionList';
import { mockTranslationContextValue } from '../../../mock-builders';

afterEach(cleanup);

describe('MentionItem', () => {
  it('should render built-in mention rows with a fallback avatar icon and description', async () => {
    const { container, getByRole, getByText, queryByTestId } = render(
      <TranslationProvider value={mockTranslationContextValue()}>
        <div role='menu'>
          <MentionItem
            entity={{
              id: 'channel',
              mentionType: 'channel',
              name: 'channel',
              tokenizedDisplayName: { parts: ['chan', 'nel'], token: 'nel' },
            }}
          />
        </div>
      </TranslationProvider>,
    );

    expect(getByRole('menuitem')).toHaveAttribute('title', '@channel');
    expect(getByText('@channel')).toBeInTheDocument();
    expect(getByText('Notify everyone in this channel')).toBeInTheDocument();
    expect(queryByTestId('avatar-img')).not.toBeInTheDocument();
    expect(container.querySelector('.str-chat__icon--megaphone')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should fall back to default description copy when built-in translation resolves to a key', () => {
    const { getByText } = render(
      <TranslationProvider
        value={mockTranslationContextValue({ t: (key: string) => key })}
      >
        <div role='menu'>
          <MentionItem
            entity={{
              id: 'here',
              mentionType: 'here',
              name: 'here',
              tokenizedDisplayName: { parts: ['here'], token: '' },
            }}
          />
        </div>
      </TranslationProvider>,
    );

    expect(getByText('@here')).toBeInTheDocument();
    expect(getByText('Notify every online member in this channel')).toBeInTheDocument();
  });

  it('should render role mention rows', async () => {
    const { container, getByRole, getByText, queryByTestId } = render(
      <div role='menu'>
        <MentionItem
          entity={{
            id: 'admin',
            mentionType: 'role',
            name: 'admin',
            tokenizedDisplayName: { parts: ['ad', 'min'], token: 'min' },
          }}
        />
      </div>,
    );

    expect(getByRole('menuitem')).toHaveAttribute('title', 'admin');
    expect(getByText('ad')).toBeInTheDocument();
    expect(getByText('min')).toBeInTheDocument();
    expect(queryByTestId('avatar-img')).not.toBeInTheDocument();
    expect(container.querySelector('.str-chat__icon--user')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render user-group mention rows with member count metadata', async () => {
    const { container, getByRole, getByText, queryByTestId } = render(
      <TranslationProvider value={mockTranslationContextValue()}>
        <div role='menu'>
          <MentionItem
            entity={{
              id: 'backend-team',
              memberCount: 3,
              mentionType: 'user_group',
              name: 'Backend Team',
              tokenizedDisplayName: { parts: ['Backend', ' Team'], token: ' team' },
            }}
          />
        </div>
      </TranslationProvider>,
    );

    expect(getByRole('menuitem')).toHaveAttribute('title', '@Backend Team');
    expect(getByText('@')).toBeInTheDocument();
    expect(getByText('Backend')).toBeInTheDocument();
    expect(getByText(/Team/)).toBeInTheDocument();
    expect(getByText('3 members')).toBeInTheDocument();
    expect(queryByTestId('avatar-img')).not.toBeInTheDocument();
    expect(container.querySelector('.str-chat__icon--users')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should allow overriding the role mention row component', () => {
    const CustomRoleItem = ({ entity }: RoleItemProps) => (
      <button data-testid='custom-role-mention-item' type='button'>
        {entity.name}
      </button>
    );

    const { getByTestId } = render(
      <MentionItem
        entity={{
          id: 'admin',
          mentionType: 'role',
          name: 'admin',
          tokenizedDisplayName: { parts: ['admin'], token: '' },
        }}
        RoleItemComponent={CustomRoleItem}
      />,
    );

    expect(getByTestId('custom-role-mention-item')).toHaveTextContent('admin');
  });

  it('should allow overriding the user row component', () => {
    const CustomUserItem = ({ entity }: UserItemProps) => (
      <button data-testid='custom-user-item' type='button'>
        {entity.name}
      </button>
    );

    const { getByTestId } = render(
      <MentionItem
        entity={{
          id: 'user-1',
          image: 'https://example.com/avatar.png',
          mentionType: 'user',
          name: 'User 1',
          tokenizedDisplayName: { parts: ['User 1'], token: '' },
        }}
        UserItemComponent={CustomUserItem}
      />,
    );

    expect(getByTestId('custom-user-item')).toHaveTextContent('User 1');
  });
});
