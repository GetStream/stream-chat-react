import React, {
  MouseEventHandler,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';

import {
  MenuIcon as DefaultMenuIcon,
  SearchIcon as DefaultSearchInputIcon,
  ReturnIcon,
  XIcon,
} from './icons';
import { SearchInput as DefaultSearchInput, SearchInputProps } from './SearchInput';

export type AppMenuProps = {
  close?: () => void;
};

type SearchBarButtonProps = {
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

const SearchBarButton = ({
  children,
  className,
  onClick,
}: PropsWithChildren<SearchBarButtonProps>) => (
  <button
    className={clsx('str-chat__channel-search-bar-button', className)}
    data-testid='search-bar-button'
    onClick={onClick}
  >
    {children}
  </button>
);

export type SearchBarController = {
  /** Called on search input focus */
  activateSearch: () => void;
  /** Clears the search state, removes focus from the search input */
  exitSearch: () => void;
  /** Flag determining whether the search input is focused */
  inputIsFocused: boolean;
  /** Ref object for the input wrapper in the SearchBar */
  searchBarRef: React.RefObject<HTMLDivElement>;
};

export type AdditionalSearchBarProps = {
  /** Application menu to be displayed  when clicked on MenuIcon */
  AppMenu?: React.ComponentType<AppMenuProps>;
  /** Custom icon component used to clear the input value on click. Displayed within the search input wrapper. */
  ClearInputIcon?: React.ComponentType;
  /** Custom icon component used to terminate the search UI session on click. */
  ExitSearchIcon?: React.ComponentType;
  /** Custom icon component used to invoke context menu. */
  MenuIcon?: React.ComponentType;
  /** Custom UI component to display the search text input */
  SearchInput?: React.ComponentType<SearchInputProps>;
  /** Custom icon used to indicate search input. */
  SearchInputIcon?: React.ComponentType;
};

export type SearchBarProps = AdditionalSearchBarProps & SearchBarController & SearchInputProps;

// todo: add context menu control logic
export const SearchBar = (props: SearchBarProps) => {
  const {
    activateSearch,
    AppMenu,
    ClearInputIcon = XIcon,
    exitSearch,
    ExitSearchIcon = ReturnIcon,
    inputIsFocused,
    MenuIcon = DefaultMenuIcon,
    searchBarRef,
    SearchInput = DefaultSearchInput,
    SearchInputIcon = DefaultSearchInputIcon,
    ...inputProps
  } = props;

  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const appMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!appMenuRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (menuIsOpen && event.key === 'Escape') {
        setMenuIsOpen(false);
      }
    };

    const clickListener = (e: MouseEvent) => {
      if (
        !(e.target instanceof HTMLElement) ||
        !menuIsOpen ||
        appMenuRef.current?.contains(e.target)
      )
        return;
      setMenuIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', clickListener);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', clickListener);
    };
  }, [menuIsOpen]);

  useEffect(() => {
    if (!props.inputRef.current) return;

    const handleFocus = () => {
      activateSearch();
    };

    const handleBlur = (e: Event) => {
      e.stopPropagation(); // handle blur/focus state with React state
    };

    props.inputRef.current.addEventListener('focus', handleFocus);
    props.inputRef.current.addEventListener('blur', handleBlur);
    return () => {
      props.inputRef.current?.removeEventListener('focus', handleFocus);
      props.inputRef.current?.addEventListener('blur', handleBlur);
    };
  }, []);

  const handleClearClick = useCallback(() => {
    exitSearch();
    inputProps.inputRef.current?.focus();
  }, []);

  const closeAppMenu = useCallback(() => setMenuIsOpen(false), []);

  return (
    <div className='str-chat__channel-search-bar' data-testid='search-bar' ref={searchBarRef}>
      {inputIsFocused ? (
        <SearchBarButton
          className='str-chat__channel-search-bar-button--exit-search'
          onClick={exitSearch}
        >
          <ExitSearchIcon />
        </SearchBarButton>
      ) : AppMenu ? (
        <SearchBarButton
          className='str-chat__channel-search-bar-button--menu'
          onClick={() => setMenuIsOpen((prev) => !prev)}
        >
          <MenuIcon />
        </SearchBarButton>
      ) : null}

      <div
        className={clsx(
          'str-chat__channel-search-input--wrapper',
          inputProps.query && 'str-chat__channel-search-input--wrapper-active',
        )}
      >
        <div className='str-chat__channel-search-input--icon'>
          <SearchInputIcon />
        </div>
        <SearchInput {...inputProps} />
        <button
          className='str-chat__channel-search-input--clear-button'
          data-testid='clear-input-button'
          disabled={!inputProps.query}
          onClick={handleClearClick}
        >
          <ClearInputIcon />
        </button>
      </div>
      {menuIsOpen && AppMenu && (
        <div ref={appMenuRef}>
          <AppMenu close={closeAppMenu} />
        </div>
      )}
    </div>
  );
};
