import type { UserResponse } from 'stream-chat';
import { IconXmark } from 'stream-chat-react';
import { nameOf, Person } from './Person';

/** The people picked so far, as chips, each with a button named after the person that removes them. */
export const SelectedPeople = ({
  onRemove,
  people,
}: {
  onRemove: (user: UserResponse) => void;
  people: UserResponse[];
}) => {
  if (!people.length) return null;

  return (
    <ul aria-label='Selected people' className='cookbook-new-conversation__chips'>
      {people.map((user) => (
        <li className='cookbook-new-conversation__chip' key={user.id}>
          <Person size='xs' user={user} />
          <button
            aria-label={`Remove ${nameOf(user)}`}
            className='cookbook-new-conversation__chip-remove'
            onClick={() => onRemove(user)}
            type='button'
          >
            <IconXmark />
          </button>
        </li>
      ))}
    </ul>
  );
};
