import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import renderer from 'react-test-renderer';
import '@testing-library/jest-dom';

import { SearchBar } from '../SearchBar';
import { Chat } from '../../Chat';
import { useChannelSearch } from '../hooks/useChannelSearch';

import {
  generateUser,
  getTestClientWithUser,
  queryUsersApi,
  useMockedApis,
} from '../../../mock-builders';

// SearchBar needs searchBarRef to work correctly. That is not expected to be used with theme version 1.
jest.spyOn(window, 'getComputedStyle').mockReturnValue({
  getPropertyValue: jest.fn().mockReturnValue('2'),
});

let client;
const inputText = new Date().getTime().toString();

const AppMenu = ({ close }) => (
  <div>
    AppMenu
    <div data-testid='menu-item' onClick={close} />
  </div>
);
const ClearInputIcon = () => <div>CustomClearInputIcon</div>;
const MenuIcon = () => <div>CustomMenuIcon</div>;
const SearchInputIcon = () => <div>CustomSearchInputIcon</div>;

const SearchContainer = ({ props = {}, searchParams }) => {
  const controller = useChannelSearch(searchParams);
  return <SearchBar {...controller} {...props} />;
};

const renderComponent = ({ client, props = {}, searchParams }) =>
  render(
    <Chat client={client}>
      <SearchContainer props={props} searchParams={searchParams} />
    </Chat>,
  );

describe('SearchBar', () => {
  beforeEach(async () => {
    const user = generateUser();
    client = await getTestClientWithUser({ id: user.id });
    useMockedApis(client, [queryUsersApi([user])]); // eslint-disable-line react-hooks/rules-of-hooks
  });

  it.each([
    ['enable', false, 'xxxxxxxxxx', 'xxxxxxxxxx'],
    ['disable', true, 'xxxxxxxxxx', ''],
  ])('should %s typing', async (_, disabled, inputText, expectedValue) => {
    await renderComponent({ client, searchParams: { disabled } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      fireEvent.change(input, {
        target: {
          value: inputText,
        },
      });
    });

    await waitFor(() => {
      expect(input).toHaveValue(expectedValue);
    });
  });
  it('should render default layout', () => {
    expect(
      renderer
        .create(
          <SearchBar
            activateSearch={jest.fn}
            clearState={jest.fn}
            exitSearch={jest.fn}
            inputIsFocused={false}
            inputRef={{ current: null }}
            onSearch={jest.fn}
            query=''
            searchBarRef={{ current: null }}
          />,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
  it.each([
    ['should not render', undefined],
    ['should render', AppMenu],
  ])('%s menu icon', async (_, AppMenu) => {
    await render(
      <SearchBar
        activateSearch={jest.fn}
        AppMenu={AppMenu}
        clearState={jest.fn}
        exitSearch={jest.fn}
        inputIsFocused={false}
        inputRef={{ current: null }}
        onSearch={jest.fn}
        query=''
        searchBarRef={{ current: null }}
      />,
    );
    await waitFor(() => {
      if (!AppMenu) {
        expect(screen.queryByTestId('menu-icon')).not.toBeInTheDocument();
      } else {
        expect(screen.queryByTestId('menu-icon')).toBeInTheDocument();
      }
    });
  });
  it('should render custom icons', async () => {
    await render(
      <SearchBar
        activateSearch={jest.fn}
        AppMenu={AppMenu}
        ClearInputIcon={ClearInputIcon}
        clearState={jest.fn}
        exitSearch={jest.fn}
        inputIsFocused={false}
        inputRef={{ current: null }}
        MenuIcon={MenuIcon}
        onSearch={jest.fn}
        query=''
        searchBarRef={{ current: null }}
        SearchInputIcon={SearchInputIcon}
      />,
    );
    expect(screen.queryByText('CustomClearInputIcon')).toBeInTheDocument();
    expect(screen.queryByText('CustomMenuIcon')).toBeInTheDocument();
    expect(screen.queryByText('CustomSearchInputIcon')).toBeInTheDocument();
  });

  it('should not render ExitSearchIcon if input is not focused', async () => {
    await act(() => {
      renderComponent({ client, searchParams: { disabled: false } });
    });

    await waitFor(() => {
      expect(screen.queryByTestId('return-icon')).not.toBeInTheDocument();
    });
  });

  it('should render ExitSearchIcon on input focus', async () => {
    await renderComponent({ client, searchParams: { disabled: false } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      fireEvent.focus(input);
    });

    await waitFor(() => {
      expect(screen.queryByTestId('return-icon')).toBeInTheDocument();
    });
  });
  it('should render custom ExitSearchIcon', async () => {
    const ExitSearchIcon = () => <div>CustomExitSearchIcon</div>;
    await renderComponent({
      client,
      props: { ExitSearchIcon },
      searchParams: { disabled: false },
    });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      fireEvent.focus(input);
    });

    await waitFor(() => {
      expect(screen.queryByText('CustomExitSearchIcon')).toBeInTheDocument();
    });
  });
  it('should render custom input placeholder', async () => {
    const placeholder = 'Type and search xxxx';
    await act(() => {
      renderComponent({
        client,
        props: { placeholder },
        searchParams: { disabled: false },
      });
    });

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(placeholder)).toBeInTheDocument();
    });
  });
  it('should clear input', async () => {
    renderComponent({ client, searchParams: { disabled: false } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      input.focus();
      fireEvent.change(input, {
        target: {
          value: inputText,
        },
      });
    });

    await waitFor(() => {
      expect(input).toHaveValue(inputText);
    });

    const clearButton = screen.queryByTestId('clear-input-button');

    await act(() => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
      expect(screen.queryByTestId('return-icon')).toBeInTheDocument();
    });
  });

  it.each([
    [
      'on return button click',
      (target) => {
        fireEvent.click(target);
      },
    ],
    [
      'on Escape key down',
      (target) => {
        fireEvent.keyDown(target, { key: 'Escape' });
      },
    ],
  ])('should exit search UI %s', async (_case, doExitAction) => {
    await renderComponent({ client, searchParams: { disabled: false } });

    const input = screen.queryByTestId('search-input');

    await act(() => {
      input.focus();
      fireEvent.change(input, {
        target: {
          value: inputText,
        },
      });
    });

    await waitFor(() => {
      expect(input).toHaveValue(inputText);
    });

    const returnButton = screen.queryByTestId('search-bar-button');

    await act(() => {
      const target = _case === 'on return button click' ? returnButton : input;
      doExitAction(target);
    });

    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(input).not.toHaveFocus();
      expect(screen.queryByTestId('return-icon')).not.toBeInTheDocument();
    });
  });

  it('should render custom SearchInput', async () => {
    const SearchInput = () => <div>CustomSearchInput</div>;
    await act(() => {
      renderComponent({
        client,
        props: { SearchInput },
        searchParams: { disabled: false },
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('CustomSearchInput')).toBeInTheDocument();
      expect(screen.queryByTestId('search-input')).not.toBeInTheDocument();
    });
  });

  it('should toggle app menu render with menu icon click', async () => {
    await act(() => {
      renderComponent({
        client,
        props: { AppMenu },
        searchParams: { disabled: false },
      });
    });
    const menuIcon = screen.queryByTestId('menu-icon');
    await act(() => {
      fireEvent.click(menuIcon);
    });
    await waitFor(() => {
      expect(screen.queryByText('AppMenu')).toBeInTheDocument();
    });
    await act(() => {
      fireEvent.click(menuIcon);
    });
    await waitFor(() => {
      expect(screen.queryByText('AppMenu')).not.toBeInTheDocument();
    });
  });

  it('should close the app menu on menu item click', async () => {
    await act(() => {
      renderComponent({
        client,
        props: { AppMenu },
        searchParams: { disabled: false },
      });
    });
    const menuIcon = screen.queryByTestId('menu-icon');
    await act(() => {
      fireEvent.click(menuIcon);
    });

    const menuItem = screen.queryByTestId('menu-item');

    await act(() => {
      fireEvent.click(menuItem);
    });

    await waitFor(() => {
      expect(screen.queryByText('AppMenu')).not.toBeInTheDocument();
    });
  });

  it.each([
    [
      'on click outside',
      (target) => {
        fireEvent.click(target);
      },
    ],
    [
      'on Escape key down',
      (target) => {
        fireEvent.keyDown(target, { key: 'Escape' });
      },
    ],
  ])('should close app menu %s', async (_, doCloseAction) => {
    await act(() => {
      renderComponent({
        client,
        props: { AppMenu },
        searchParams: { disabled: false },
      });
    });
    const menuIcon = screen.queryByTestId('menu-icon');
    const searchBar = screen.queryByTestId('search-bar');
    await act(() => {
      fireEvent.click(menuIcon);
    });
    await waitFor(() => {
      expect(screen.queryByText('AppMenu')).toBeInTheDocument();
    });

    await act(() => {
      doCloseAction(searchBar);
    });

    await waitFor(() => {
      expect(screen.queryByText('AppMenu')).not.toBeInTheDocument();
    });
  });
});
