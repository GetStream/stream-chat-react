import type { UserResponse } from 'stream-chat';
import { Person } from './Person';

/** The search results, each a button that adds the person, and a status line when there are none. */
export const PeopleResults = ({
  failed,
  isLoading,
  listId,
  onAdd,
  people,
}: {
  failed: boolean;
  isLoading: boolean;
  /** The results list's id, which the search input points to with `aria-controls`. */
  listId: string;
  onAdd: (user: UserResponse) => void;
  people: UserResponse[];
}) => (
  <>
    <ul
      aria-busy={isLoading}
      aria-label='People'
      className='cookbook-new-conversation__results'
      id={listId}
    >
      {people.map((user) => (
        <li className='cookbook-new-conversation__result' key={user.id}>
          <button
            className='cookbook-new-conversation__result-button'
            onClick={() => onAdd(user)}
            type='button'
          >
            <Person size='md' user={user} />
          </button>
        </li>
      ))}
    </ul>
    {!people.length && (
      <p className='cookbook-new-conversation__status' role='status'>
        {isLoading ? 'Searching…' : failed ? 'The search failed.' : 'No one found'}
      </p>
    )}
  </>
);
