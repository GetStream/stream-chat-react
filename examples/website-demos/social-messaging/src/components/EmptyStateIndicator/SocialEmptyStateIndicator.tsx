import React from 'react';

import { EmptyStateIndicatorProps } from 'stream-chat-react';

import './SocialEmptyStateIndicator.scss';

type Props = EmptyStateIndicatorProps;

export const SocialEmptyStateIndicator: React.FC<Props> = (props) => {
    const { listType } = props;

    if (listType === 'channel') {
        return <div className='empty-state-indicator'>No channels.</div>
    }

    if (listType === 'message') return null;

    return <div className='empty-state-indicator'>No items exist.</div>;
};