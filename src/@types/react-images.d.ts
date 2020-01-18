import * as React from 'react';

// a very minimalistic type def for react-images
// if needed more can be extracted from https://github.com/jossmac/react-images (Flow types)
declare module 'react-images' {
    type CloseType = (event: MouseEvent | KeyboardEvent) => void;
    type ViewType = { [key: string]: any };
    type ViewsType = Array<ViewType>;

    interface CarouselProps {
        views: ViewsType;
    }

    export default class Carousel extends React.Component<CarouselProps> {}

    interface ModalProps {
        /* Function called to request close of the modal */
        onClose: CloseType,
    }

    class Modal extends React.Component<ModalProps> {}

    interface ModalGatewayProps {

    }

    class ModalGateway extends React.Component<ModalGatewayProps> {}

}