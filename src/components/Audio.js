import * as React from 'react';

export class Audio extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      playing: false,
      progress: 0,
      updateProgress: null,
    };
    this.audioRef = React.createRef();
  }

  playAudio = () => {
    if (this.audioRef.current !== null) {
      this.audioRef.current.pause();
      this.updateProgress();
      this.setState({
        playing: true,
        updateProgress: setInterval(this.updateProgress, 500),
      });
      //$FlowFixMe
      this.audioRef.current.play();
    }
  };

  pauseAudio = () => {
    if (this.audioRef.current !== null) {
      this.audioRef.current.pause();
    }
    this.setState({ playing: false });
    window.clearInterval(this.state.updateProgress);
  };

  updateProgress = () => {
    if (this.audioRef.current !== null) {
      const position = this.audioRef.current.currentTime;
      const duration = this.audioRef.current.duration;
      const progress = (100 / duration) * position;
      this.setState({
        progress,
      });
      if (position === duration) {
        this.pauseAudio();
      }
    }
  };

  componentWillUnmount() {
    window.clearInterval(this.state.updateProgress);
  }

  _handleClose = (e) => {
    if (this.props.handleClose) {
      this.props.handleClose(e);
    }
  };

  render() {
    const { og } = this.props;
    const audio = og;
    const url = og.asset_url;
    const image = og.image_url;
    return (
      <div className="str-chat__audio">
        <div className="str-chat__audio__wrapper">
          <audio ref={this.audioRef}>
            <source src={url} type="audio/mp3" />
          </audio>
          <div className="str-chat__audio__image">
            <div className="str-chat__audio__image--overlay">
              {!this.state.playing ? (
                <div
                  onClick={() => this.playAudio()}
                  className="str-chat__audio__image--button"
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 64 64"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M32 58c14.36 0 26-11.64 26-26S46.36 6 32 6 6 17.64 6 32s11.64 26 26 26zm0 6C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm13.237-28.412L26.135 45.625a3.27 3.27 0 0 1-4.426-1.4 3.319 3.319 0 0 1-.372-1.47L21 23.36c-.032-1.823 1.41-3.327 3.222-3.358a3.263 3.263 0 0 1 1.473.322l19.438 9.36a3.311 3.311 0 0 1 .103 5.905z"
                      fillRule="nonzero"
                    />
                  </svg>
                </div>
              ) : (
                <div
                  onClick={() => this.pauseAudio()}
                  className="str-chat__audio__image--button"
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 64 64"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M32 58.215c14.478 0 26.215-11.737 26.215-26.215S46.478 5.785 32 5.785 5.785 17.522 5.785 32 17.522 58.215 32 58.215zM32 64C14.327 64 0 49.673 0 32 0 14.327 14.327 0 32 0c17.673 0 32 14.327 32 32 0 17.673-14.327 32-32 32zm-7.412-45.56h2.892a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.892a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17zm12.293 0h2.893a2.17 2.17 0 0 1 2.17 2.17v23.865a2.17 2.17 0 0 1-2.17 2.17h-2.893a2.17 2.17 0 0 1-2.17-2.17V20.61a2.17 2.17 0 0 1 2.17-2.17z"
                      fillRule="nonzero"
                    />
                  </svg>
                </div>
              )}
            </div>
            <img src={image} alt={`${og.description}`} />
          </div>
          <div className="str-chat__audio__content">
            <span className="str-chat__audio__content--title">
              <strong>{og.title}</strong>
            </span>
            <span className="str-chat__audio__content--subtitle">
              {og.text}
            </span>
            <div className="str-chat__audio__content--progress">
              <div style={{ width: `${this.state.progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
