import { useId, useRef, useState } from 'react';
import type { UserResponse } from 'stream-chat';
import { PeopleResults } from './PeopleResults';
import { SelectedPeople } from './SelectedPeople';
import { usePeopleSearch } from './usePeopleSearch';

/**
 * Searches for people and lets the user pick them: the people picked show as chips above the search
 * input, and the results below it leave them out.
 */
export const PeoplePicker = ({
  onChange,
  selected,
}: {
  onChange: (selected: UserResponse[]) => void;
  selected: UserResponse[];
}) => {
  const [text, setText] = useState('');
  const { failed, isLoading, people } = usePeopleSearch(text);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const selectedIds = new Set(selected.map((user) => user.id));
  const results: UserResponse[] = people.filter(
    (user: UserResponse) => !selectedIds.has(user.id),
  );

  // The picked result and a removed chip leave the list, so the focus goes back to the input.
  const add = (user: UserResponse) => {
    onChange([...selected, user]);
    setText('');
    inputRef.current?.focus();
  };
  const remove = (user: UserResponse) => {
    onChange(selected.filter((person) => person.id !== user.id));
    inputRef.current?.focus();
  };

  return (
    <>
      <SelectedPeople onRemove={remove} people={selected} />
      <label className='cookbook-new-conversation__label' htmlFor={`${id}-search`}>
        Add people
      </label>
      {/* The dialog's content mounts a render after the modal opens, so the input takes the
          focus itself. */}
      <input
        aria-controls={`${id}-results`}
        autoFocus
        className='cookbook-new-conversation__input'
        id={`${id}-search`}
        onChange={(event) => setText(event.target.value)}
        placeholder='Search by name'
        ref={inputRef}
        type='search'
        value={text}
      />
      <PeopleResults
        failed={failed}
        isLoading={isLoading}
        listId={`${id}-results`}
        onAdd={add}
        people={results}
      />
    </>
  );
};
