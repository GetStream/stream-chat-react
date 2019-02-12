import React from 'react';

export class NewChannel extends React.PureComponent {
  state = {
    name: '',
  };

  inputRef = React.createRef();

  componentDidMount() {
    this.inputRef.current.focus();
  }

  onChange = (e) => {
    this.setState({
      name: e.target.value,
    });
  };

  createChannel = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    const type = this.props.channel.type;
    this.props.createChannel(type, this.state.name);
  };

  render() {
    return (
      <div className="str-chat__new-channel">
        <div className="str-chat__new-channel--header">
          <button
            className="str-chat__square-button"
            onClick={this.props.cancelChannelStart}
          >
            <svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M11.672 10.081L7.59 6l4.08-4.081c.442-.44.442-1.15 0-1.59-.44-.442-1.15-.442-1.59 0L6 4.408 1.919.33c-.44-.442-1.15-.442-1.59 0-.442.44-.442 1.15 0 1.59L4.408 6 .33 10.081c-.442.44-.442 1.15 0 1.59.44.442 1.15.442 1.59 0L6 7.592l4.081 4.08c.44.442 1.15.442 1.59 0a1.128 1.128 0 0 0 0-1.59z"
                fill="#000"
                fillRule="evenodd"
              />
            </svg>
          </button>
          <div className="str-chat__new-channel--header__title">
            New Channel
          </div>
        </div>
        <form onSubmit={this.createChannel}>
          <div className="str-chat__new-channel--name">
            <label htmlFor="name">Name:</label>
            <input
              ref={this.inputRef}
              type="text"
              id="name"
              name="name"
              placeholder="Enter a Channel Name"
              onChange={this.onChange}
            />
          </div>

          <button
            className="str-chat__button str-chat__button--round"
            onClick={this.clickCreateChannel}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 17.713l17.333-8.507L0 .7v6.617l12.417 1.89L0 11.096z"
                fill="#006CFF"
                fillRule="evenodd"
              />
            </svg>
            Go
          </button>
        </form>
      </div>
    );
  }
}
