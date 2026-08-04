import React from 'react';
import clsx from 'clsx';
import { Slot } from './Slot';

import type { ReactNode } from 'react';

export type WorkspaceLayoutSlot = {
  content?: ReactNode;
  slot: string;
};

export type WorkspaceLayoutProps = {
  navRail?: ReactNode;
  slots: WorkspaceLayoutSlot[];
};

export const WorkspaceLayout = ({ navRail, slots }: WorkspaceLayoutProps) => (
  <div className='str-chat__chat-view__workspace-layout'>
    {navRail ? (
      <div className='str-chat__chat-view__workspace-layout-nav-rail'>{navRail}</div>
    ) : null}
    <div
      className={clsx('str-chat__chat-view__workspace-layout-slots', {
        'str-chat__chat-view__workspace-layout-slots--empty': slots.length === 0,
      })}
    >
      {slots.map(({ content, slot }) => (
        <Slot
          className='str-chat__chat-view__workspace-layout-slot'
          key={slot}
          slot={slot}
        >
          {content}
        </Slot>
      ))}
    </div>
  </div>
);
