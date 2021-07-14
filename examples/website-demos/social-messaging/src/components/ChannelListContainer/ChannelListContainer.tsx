import { ChannelList } from 'stream-chat-react';

import { SocialChannelList } from '../SocialChannelList/SocialChannelList';
import { SocialChannelPreview } from '../ChannelPreview/SocialChannelPreview';

type Props = {
    filters: any,
    isSideDrawerOpen: boolean,
    options: any,
    setSideDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>,
    sort: any
};

export const ChannelListContainer: React.FC<Props> = (props) =>{
    const { filters, isSideDrawerOpen, options, setSideDrawerOpen, sort } = props;

    return (
        <ChannelList
            filters={filters}
            List={(props) => (
                <SocialChannelList {...props} {...{ isSideDrawerOpen, setSideDrawerOpen }} />
            )}
            options={options}
            Preview={SocialChannelPreview}
            sort={sort}
        />
    )
};