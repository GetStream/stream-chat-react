// @ts-check
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/** @type {React.FC<import("types").ModalProps>} */
const Modal = ({ children, onClose, open }) => {
  /** @type {React.RefObject<HTMLDivElement>} */
  const innerRef = useRef(null);

  /** @param {React.MouseEvent} e */
  const handleClick = (e) => {
    if (e.target instanceof Node && !innerRef.current?.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    /** @type {EventListener} */
    const handleEscKey = (e) => {
      if (e instanceof KeyboardEvent && e.keyCode === 27) {
        onClose();
      }
    };
    document.addEventListener('keyPress', handleEscKey, false);
    return () => document.removeEventListener('keyPress', handleEscKey, false);
  }, [onClose]);

  const openClasses = open
    ? 'str-chat__modal--open'
    : 'str-chat__modal--closed';

  return (
    <div className={`str-chat__modal ${openClasses}`} onClick={handleClick}>
      <div className="str-chat__modal__close-button">
        Close
        <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z"
            fillRule="evenodd"
          />
        </svg>
      </div>
      <div className="str-chat__modal__inner" ref={innerRef}>
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  /** Callback handler for closing of modal. */
  onClose: PropTypes.func.isRequired,
  /** If true, modal is opened or visible. */
  open: PropTypes.bool.isRequired,
};

export default Modal;
