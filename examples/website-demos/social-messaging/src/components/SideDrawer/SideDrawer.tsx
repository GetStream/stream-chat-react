import './SideDrawer.scss';

type Props = {
    onClose: () => void;
}

export const SideDrawer: React.FC<Props> = (props) => {
    const { onClose } = props;

    console.log('in the sidedrawer');

    return (
        <div onClick={onClose}>
            SideDrawer!!
        </div>
    )
};