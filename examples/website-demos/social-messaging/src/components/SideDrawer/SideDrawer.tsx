import './SideDrawer.scss';

type Props = {
    isSideDrawerOpen: boolean;
    onClose: () => void;
}

export const SideDrawer: React.FC<Props> = (props) => {
    const { isSideDrawerOpen, onClose } = props;

    return (
        <div className={`side-drawer ${isSideDrawerOpen ? 'isSideDrawerOpen' : ''}`} onClick={onClose}>
            <span>SideDrawer!!</span>
        </div>
    )
};