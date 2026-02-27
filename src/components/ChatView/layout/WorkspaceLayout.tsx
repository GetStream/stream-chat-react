import React from 'react';
import clsx from 'clsx';
import { Slot } from './Slot';

import type { ReactNode } from 'react';

export type WorkspaceLayoutSlot = {
  content?: ReactNode;
  hidden?: boolean;
  slot: string;
};

export type WorkspaceLayoutProps = {
  entityListHidden?: boolean;
  entityListSlot?: WorkspaceLayoutSlot;
  navRail?: ReactNode;
  slots: WorkspaceLayoutSlot[];
};

export const WorkspaceLayout = ({
  entityListHidden = false,
  entityListSlot,
  navRail,
  slots,
}: WorkspaceLayoutProps) => (
  <div className='str-chat__chat-view__workspace-layout'>
    {navRail ? (
      <div className='str-chat__chat-view__workspace-layout-nav-rail'>{navRail}</div>
    ) : null}
    {entityListSlot?.content ? (
      <Slot
        className='str-chat__chat-view__workspace-layout-entity-list-pane'
        hidden={entityListHidden}
        key={entityListSlot.slot}
        slot={entityListSlot.slot}
      >
        {entityListSlot.content}
      </Slot>
    ) : null}
    <div
      className={clsx('str-chat__chat-view__workspace-layout-slots', {
        'str-chat__chat-view__workspace-layout-slots--empty': slots.length === 0,
      })}
    >
      {slots.map(({ content, hidden, slot }) => (
        <Slot
          className='str-chat__chat-view__workspace-layout-slot'
          hidden={hidden}
          key={slot}
          slot={slot}
        >
          {content}
        </Slot>
      ))}
    </div>
  </div>
);
