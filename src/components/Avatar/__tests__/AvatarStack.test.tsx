import React from 'react';

import { cleanup, render } from '@testing-library/react';

import { AvatarStack } from '../AvatarStack';
import { WithComponents } from '../../../context';

afterEach(cleanup);

const member1 = { id: '1', imageUrl: 'img1.png', userName: 'Alice' };
const member2 = { id: '2', imageUrl: 'img2.png', userName: 'Bob' };
const member3 = { id: '3', imageUrl: 'img3.png', userName: 'Charlie' };
const member4 = { id: '4', imageUrl: 'img4.png', userName: 'Diana' };

describe('AvatarStack', () => {
  it('should render nothing when displayInfo is empty or not provided', () => {
    const r1 = render(<AvatarStack displayInfo={[]} size='md' />);
    expect(r1.queryByTestId('avatar-stack')).not.toBeInTheDocument();

    const r2 = render(<AvatarStack size='md' />);
    expect(r2.queryByTestId('avatar-stack')).not.toBeInTheDocument();
  });

  it('should render avatars for each item in displayInfo', () => {
    const { getAllByTestId } = render(
      <AvatarStack displayInfo={[member1, member2]} size='md' />,
    );
    expect(getAllByTestId('avatar')).toHaveLength(2);
  });

  it('should render the correct avatar images', () => {
    const { getAllByTestId } = render(
      <AvatarStack displayInfo={[member1, member2]} size='md' />,
    );
    const images = getAllByTestId('avatar-img');
    expect(images[0]).toHaveAttribute('src', 'img1.png');
    expect(images[1]).toHaveAttribute('src', 'img2.png');
  });

  it('should apply the size class to the root element', () => {
    const { getByTestId } = render(<AvatarStack displayInfo={[member1]} size='sm' />);
    expect(getByTestId('avatar-stack')).toHaveClass('str-chat__avatar-stack--size-sm');
  });

  it('should not apply a size class when size is null', () => {
    const { getByTestId } = render(<AvatarStack displayInfo={[member1]} size={null} />);
    const root = getByTestId('avatar-stack');
    expect(root).toBeInTheDocument();
    expect(root.className).not.toContain('str-chat__avatar-stack--size-');
  });

  it('should render at most 3 avatars', () => {
    const { getAllByTestId } = render(
      <AvatarStack displayInfo={[member1, member2, member3, member4]} size='md' />,
    );
    expect(getAllByTestId('avatar')).toHaveLength(3);
  });

  it('should render overflow count badge when more than 3 items', () => {
    const { getByTestId } = render(
      <AvatarStack displayInfo={[member1, member2, member3, member4]} size='md' />,
    );
    const badge = getByTestId('avatar-stack-count-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('+1');
  });

  it('should not render overflow count badge when 3 or fewer items', () => {
    const { queryByTestId } = render(
      <AvatarStack displayInfo={[member1, member2, member3]} size='md' />,
    );
    expect(queryByTestId('avatar-stack-count-badge')).not.toBeInTheDocument();
  });

  it('should render with a custom component wrapper', () => {
    const { getByTestId } = render(
      <AvatarStack component='section' displayInfo={[member1]} size='md' />,
    );
    expect(getByTestId('avatar-stack').tagName).toBe('SECTION');
  });

  it('should default to div wrapper', () => {
    const { getByTestId } = render(<AvatarStack displayInfo={[member1]} size='md' />);
    expect(getByTestId('avatar-stack').tagName).toBe('DIV');
  });

  it('should use custom Avatar from ComponentContext', () => {
    const CustomAvatar = ({ userName }: { userName?: string }) => (
      <div data-testid='custom-avatar'>{userName}</div>
    );

    const { getAllByTestId, queryAllByTestId } = render(
      <WithComponents overrides={{ Avatar: CustomAvatar }}>
        <AvatarStack displayInfo={[member1, member2]} size='md' />
      </WithComponents>,
    );

    expect(getAllByTestId('custom-avatar')).toHaveLength(2);
    expect(getAllByTestId('custom-avatar')[0]).toHaveTextContent('Alice');
    expect(getAllByTestId('custom-avatar')[1]).toHaveTextContent('Bob');
    expect(queryAllByTestId('avatar')).toHaveLength(0);
  });
});
