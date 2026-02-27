import React from 'react';
import clsx from 'clsx';

import type { ReactNode } from 'react';

export type WorkspaceLayoutSlot = {
  content?: ReactNode;
  slot: string;
};

export type WorkspaceLayoutProps = {
  entityListPane?: ReactNode;
  entityListPaneOpen?: boolean;
  navRail?: ReactNode;
  slots: WorkspaceLayoutSlot[];
};

export const WorkspaceLayout = ({
  entityListPane,
  entityListPaneOpen = true,
  navRail,
  slots,
}: WorkspaceLayoutProps) => (
  <div className='str-chat__chat-view__workspace-layout'>
    {navRail ? (
      <div className='str-chat__chat-view__workspace-layout-nav-rail'>{navRail}</div>
    ) : null}
    {entityListPaneOpen ? (
      <div className='str-chat__chat-view__workspace-layout-entity-list-pane'>
        {entityListPane}
      </div>
    ) : null}
    <div
      className={clsx('str-chat__chat-view__workspace-layout-slots', {
        'str-chat__chat-view__workspace-layout-slots--empty': slots.length === 0,
      })}
    >
      {slots.map(({ content, slot }) => (
        <section className='str-chat__chat-view__workspace-layout-slot' key={slot}>
          {content}
        </section>
      ))}
    </div>
  </div>
);
