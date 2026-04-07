import React from 'react';

import { cleanup, render } from '@testing-library/react';

import { ChannelAvatar } from '../ChannelAvatar';
import { GroupAvatar } from '../GroupAvatar';

afterEach(cleanup);

const member1 = { imageUrl: 'img1.png', userName: 'Alice' };
const member2 = { imageUrl: 'img2.png', userName: 'Bob' };
const member3 = { imageUrl: 'img3.png', userName: 'Charlie' };
const member4 = { imageUrl: 'img4.png', userName: 'Diana' };
const member5 = { imageUrl: 'img5.png', userName: 'Eve' };

describe('GroupAvatar', () => {
  it('should render a single Avatar when displayMembers has fewer than 2 members', () => {
    const { getByTestId, queryByTestId } = render(
      <GroupAvatar displayMembers={[member1]} size='xl' />,
    );
    expect(getByTestId('avatar')).toBeInTheDocument();
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'img1.png');
    expect(queryByTestId('group-avatar')).not.toBeInTheDocument();
  });

  it('should render a single Avatar when displayMembers is empty', () => {
    const { getByTestId, queryByTestId } = render(<GroupAvatar size='xl' />);
    expect(getByTestId('avatar')).toBeInTheDocument();
    expect(queryByTestId('group-avatar')).not.toBeInTheDocument();
  });

  it('should render group avatar when 2 or more members are provided', () => {
    const { getByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2]} size='xl' />,
    );
    expect(getByTestId('group-avatar')).toBeInTheDocument();
  });

  it('should apply correct size class to group avatar', () => {
    const { getByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2]} size='2xl' />,
    );
    expect(getByTestId('group-avatar')).toHaveClass('str-chat__avatar-group--size-2xl');
  });

  it('should render up to 4 avatars when displayMembers has 4 or fewer members', () => {
    const { getAllByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2, member3, member4]} size='xl' />,
    );
    expect(getAllByTestId('avatar')).toHaveLength(4);
  });

  it('should render up to 2 avatars when displayMembers has more than 4 members', () => {
    const { getAllByTestId } = render(
      <GroupAvatar
        displayMembers={[member1, member2, member3, member4, member5]}
        size='xl'
      />,
    );
    expect(getAllByTestId('avatar')).toHaveLength(2);
  });

  it('should render overflow count badge when displayMembers has more than 4 members', () => {
    const { getByTestId } = render(
      <GroupAvatar
        displayMembers={[member1, member2, member3, member4, member5]}
        size='xl'
      />,
    );
    expect(getByTestId('group-avatar-count-badge')).toHaveTextContent('+3');
  });

  it('should not render overflow count badge when displayMembers has 4 or fewer members', () => {
    const { queryByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2]} size='xl' />,
    );
    expect(queryByTestId('group-avatar-count-badge')).not.toBeInTheDocument();
  });

  it('should apply online status class', () => {
    const { getByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2]} isOnline={true} size='xl' />,
    );
    expect(getByTestId('group-avatar')).toHaveClass('str-chat__avatar-group--online');
  });

  it('should apply offline status class', () => {
    const { getByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2]} isOnline={false} size='xl' />,
    );
    expect(getByTestId('group-avatar')).toHaveClass('str-chat__avatar-group--offline');
  });

  it('should not apply online/offline classes when isOnline is not provided', () => {
    const { getByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2]} size='xl' />,
    );
    const root = getByTestId('group-avatar');
    expect(root).not.toHaveClass('str-chat__avatar-group--online');
    expect(root).not.toHaveClass('str-chat__avatar-group--offline');
  });

  it('should pass isOnline to single Avatar when fewer than 2 members', () => {
    const { container } = render(
      <GroupAvatar displayMembers={[member1]} isOnline={true} size='xl' />,
    );
    expect(
      container.querySelector('.str-chat__avatar-status-badge--online'),
    ).toBeInTheDocument();
  });

  it('should map 2xl group size to lg avatar size', () => {
    const { getAllByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2]} size='2xl' />,
    );
    getAllByTestId('avatar').forEach((avatar) => {
      expect(avatar).toHaveClass('str-chat__avatar--size-lg');
    });
  });

  it('should map xl group size to md avatar size', () => {
    const { getAllByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2]} size='xl' />,
    );
    getAllByTestId('avatar').forEach((avatar) => {
      expect(avatar).toHaveClass('str-chat__avatar--size-md');
    });
  });

  it('should map lg group size to sm avatar size', () => {
    const { getAllByTestId } = render(
      <GroupAvatar displayMembers={[member1, member2]} size='lg' />,
    );
    getAllByTestId('avatar').forEach((avatar) => {
      expect(avatar).toHaveClass('str-chat__avatar--size-sm');
    });
  });

  it('should forward additional props to the group container', () => {
    const { getByTestId } = render(
      <GroupAvatar data-custom='test' displayMembers={[member1, member2]} size='xl' />,
    );
    expect(getByTestId('group-avatar')).toHaveAttribute('data-custom', 'test');
  });

  it('should apply custom className to group avatar', () => {
    const { getByTestId } = render(
      <GroupAvatar
        className='custom-class'
        displayMembers={[member1, member2]}
        size='xl'
      />,
    );
    expect(getByTestId('group-avatar')).toHaveClass(
      'str-chat__avatar-group',
      'custom-class',
    );
  });
});

describe('ChannelAvatar', () => {
  it('should render Avatar with imageUrl and userName when no displayMembers are provided', () => {
    const { getByTestId, getByTitle, queryByTestId } = render(
      <ChannelAvatar imageUrl='channel.png' size='xl' userName='General' />,
    );
    expect(getByTestId('avatar')).toBeInTheDocument();
    expect(getByTestId('avatar-img')).toHaveAttribute('src', 'channel.png');
    expect(getByTitle('General')).toBeInTheDocument();
    expect(queryByTestId('group-avatar')).not.toBeInTheDocument();
  });

  it('should render Avatar when displayMembers has fewer than 2 entries', () => {
    const { getByTestId, queryByTestId } = render(
      <ChannelAvatar displayMembers={[member1]} size='xl' />,
    );
    expect(getByTestId('avatar')).toBeInTheDocument();
    expect(queryByTestId('group-avatar')).not.toBeInTheDocument();
  });

  it('should render Avatar when displayMembers is empty', () => {
    const { getByTestId, queryByTestId } = render(
      <ChannelAvatar displayMembers={[]} size='xl' />,
    );
    expect(getByTestId('avatar')).toBeInTheDocument();
    expect(queryByTestId('group-avatar')).not.toBeInTheDocument();
  });

  it('should render GroupAvatar when displayMembers has 2 or more entries', () => {
    const { getByTestId } = render(
      <ChannelAvatar displayMembers={[member1, member2]} size='xl' />,
    );
    expect(getByTestId('group-avatar')).toBeInTheDocument();
  });

  it('should pass overflowCount to GroupAvatar', () => {
    const { getByTestId } = render(
      <ChannelAvatar
        displayMembers={[member1, member2, member3, member4, member5]}
        size='xl'
      />,
    );
    expect(getByTestId('group-avatar-count-badge')).toHaveTextContent('+3');
  });

  it('should forward shared props to Avatar', () => {
    const { getByTestId } = render(
      <ChannelAvatar data-custom='value' imageUrl='ch.png' size='xl' />,
    );
    expect(getByTestId('avatar')).toHaveAttribute('data-custom', 'value');
  });

  it('should forward shared props to GroupAvatar', () => {
    const { getByTestId } = render(
      <ChannelAvatar
        className='custom'
        data-custom='value'
        displayMembers={[member1, member2]}
        size='xl'
      />,
    );
    const group = getByTestId('group-avatar');
    expect(group).toHaveAttribute('data-custom', 'value');
    expect(group).toHaveClass('custom');
  });

  it('should pass isOnline to Avatar for single member', () => {
    const { container } = render(<ChannelAvatar isOnline={true} size='xl' />);
    expect(
      container.querySelector('.str-chat__avatar-status-badge--online'),
    ).toBeInTheDocument();
  });

  it('should pass isOnline to GroupAvatar for multiple members', () => {
    const { getByTestId } = render(
      <ChannelAvatar displayMembers={[member1, member2]} isOnline={false} size='xl' />,
    );
    expect(getByTestId('group-avatar')).toHaveClass('str-chat__avatar-group--offline');
  });
});
