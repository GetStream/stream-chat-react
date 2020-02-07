import React from 'react';
import PropTypes from 'prop-types';

export class Modal extends React.PureComponent {
  innerRef = React.createRef();
  static propTypes = {
    /** Callback handler for closing of modal. */
    onClose: PropTypes.func,
    /** If true, modal is opened or visible. */
    open: PropTypes.bool,
  };
  componentDidMount() {
    document.addEventListener('keyPress', this.handleEscKey, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keyPress', this.handleEscKey, false);
  }

  handleEscKey(e) {
    if (e.keyCode === 27) {
      this.props.onClose();
      document.removeEventListener('keyPress', this.handleEscKey, false);
    }
  }

  handleClick = (e) => {
    if (!this.innerRef.current.contains(e.target)) {
      this.props.onClose();
      document.removeEventListener('keyPress', this.handleEscKey, false);
    }
  };

  render() {
    const openClasses = this.props.open
      ? 'str-chat__modal--open'
      : 'str-chat__modal--closed';
    return (
      <div
        className={`str-chat__modal ${openClasses}`}
        onClick={this.handleClick}
      >
        <div className="str-chat__modal__close-button">
          Close
          <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9.916 1.027L8.973.084 5 4.058 1.027.084l-.943.943L4.058 5 .084 8.973l.943.943L5 5.942l3.973 3.974.943-.943L5.942 5z"
              fillRule="evenodd"
            />
          </svg>
        </div>
        <div className="str-chat__modal__inner" ref={this.innerRef}>
          {this.props.children}
        </div>
      </div>
    );
  }
}
