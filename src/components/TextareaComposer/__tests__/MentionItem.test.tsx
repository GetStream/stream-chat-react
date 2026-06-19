import React from 'react';

import { cleanup, render } from '@testing-library/react';
import { axe } from '../../../../axe-helper';

import { TranslationProvider } from '../../../context';
import type { BroadcastMentionItem } from '../SuggestionList/MentionItem/BroadcastMentionItem';
import { SpecialMentionItem } from '../SuggestionList/MentionItem/SpecialMentionItem';
import type {
  RoleItemProps,
  SpecialMentionItemProps,
  UserItemProps,
} from '../SuggestionList';
import { MentionItem } from '../SuggestionList';
import { mockTranslationContextValue } from '../../../mock-builders';

afterEach(cleanup);

describe('MentionItem', () => {
  it('should render built-in mention rows with a fallback avatar icon and description', async () => {
    const { container, getByRole, getByText, queryByTestId } = render(
      <TranslationProvider
        value={mockTranslationContextValue({
          t: (key: string) =>
            key === 'mention/Channel Description'
              ? 'Notify everyone in this channel'
              : key,
        })}
      >
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

  it('should render the built-in here mention description translation', () => {
    const { getByText } = render(
      <TranslationProvider
        value={mockTranslationContextValue({
          t: (key: string) =>
            key === 'mention/Here Description'
              ? 'Notify every online member in this channel'
              : key,
        })}
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
      <TranslationProvider
        value={mockTranslationContextValue({
          t: (key: string, options?: Record<string, string>) =>
            key === 'Notify all {{ role }} members' && options?.role
              ? `Notify all ${options.role} members`
              : key,
        })}
      >
        <div role='menu'>
          <MentionItem
            entity={{
              id: 'admin',
              mentionType: 'role',
              name: 'admin',
              tokenizedDisplayName: { parts: ['ad', 'min'], token: 'min' },
            }}
          />
        </div>
      </TranslationProvider>,
    );

    expect(getByRole('menuitem')).toHaveAttribute('title', '@admin');
    expect(getByText('ad')).toBeInTheDocument();
    expect(getByText('min')).toBeInTheDocument();
    expect(getByText('Notify all admin members')).toBeInTheDocument();
    expect(queryByTestId('avatar-img')).not.toBeInTheDocument();
    expect(container.querySelector('.str-chat__icon--shield')).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should render user-group mention rows with description metadata', async () => {
    const { container, getByRole, getByText, queryByTestId } = render(
      <TranslationProvider value={mockTranslationContextValue()}>
        <div role='menu'>
          <MentionItem
            entity={{
              description: 'Backend services and APIs',
              id: 'backend-team',
              mentionType: 'user_group',
              name: 'Backend Team',
              tokenizedDisplayName: { parts: ['Backend', ' Team'], token: ' team' },
            }}
          />
        </div>
      </TranslationProvider>,
    );

    expect(getByRole('menuitem')).toHaveAttribute('title', '@Backend Team');
    expect(getByText('Backend')).toBeInTheDocument();
    expect(getByText(/Team/)).toBeInTheDocument();
    expect(getByText('Backend services and APIs')).toBeInTheDocument();
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
        RoleItem={CustomRoleItem}
      />,
    );

    expect(getByTestId('custom-role-mention-item')).toHaveTextContent('admin');
  });

  it('should allow overriding the broadcast mention row component', () => {
    const CustomBroadcastMentionItem = ({
      entity,
    }: React.ComponentProps<typeof BroadcastMentionItem>) => (
      <button data-testid='custom-broadcast-mention-item' type='button'>
        {entity.name}
      </button>
    );

    const { getByTestId } = render(
      <MentionItem
        BroadcastMentionItem={CustomBroadcastMentionItem}
        entity={{
          id: 'channel',
          mentionType: 'channel',
          name: 'channel',
          tokenizedDisplayName: { parts: ['chan', 'nel'], token: 'nel' },
        }}
      />,
    );

    expect(getByTestId('custom-broadcast-mention-item')).toHaveTextContent('channel');
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
        UserItem={CustomUserItem}
      />,
    );

    expect(getByTestId('custom-user-item')).toHaveTextContent('User 1');
  });

  it('should render nothing for unsupported mention suggestions by default', () => {
    const { queryByRole } = render(
      <TranslationProvider value={mockTranslationContextValue()}>
        <div role='menu'>
          <MentionItem
            entity={
              {
                id: 'unsupported',
                mentionType: 'unsupported',
                name: 'Unsupported',
              } as unknown as React.ComponentProps<typeof MentionItem>['entity']
            }
          />
        </div>
      </TranslationProvider>,
    );

    expect(queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('should allow overriding the special mention row component', () => {
    const CustomSpecialMentionItem = ({ entity }: SpecialMentionItemProps) => (
      <button title={`@${entity.name ?? entity.id}`} type='button'>
        @{entity.name ?? entity.id}
      </button>
    );

    const { getByRole, getByText } = render(
      <TranslationProvider value={mockTranslationContextValue()}>
        <div role='menu'>
          <MentionItem
            entity={
              {
                id: 'unsupported',
                mentionType: 'unsupported',
                name: 'Unsupported',
              } as unknown as React.ComponentProps<typeof MentionItem>['entity']
            }
            SpecialMentionItem={CustomSpecialMentionItem}
          />
        </div>
      </TranslationProvider>,
    );

    expect(getByRole('button')).toHaveAttribute('title', '@Unsupported');
    expect(getByText('@Unsupported')).toBeInTheDocument();
  });

  it('should not crash when SpecialMentionItem receives an unsupported mention type', () => {
    const { queryByRole } = render(
      <TranslationProvider value={mockTranslationContextValue()}>
        <div role='menu'>
          <SpecialMentionItem
            entity={{
              id: 'ops-team',
              mentionType: 'unsupported',
              name: 'Ops Team',
            }}
          />
        </div>
      </TranslationProvider>,
    );

    expect(queryByRole('menuitem')).not.toBeInTheDocument();
  });
});
