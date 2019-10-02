import React from 'react';
import PropTypes from 'prop-types';

/**
 * Avatar - A round avatar image with fallback to username's first letter
 *
 * @example ./docs/Avatar.md
 * @extends PureComponent
 */
export class Avatar extends React.PureComponent {
  static propTypes = {
    /** image url */
    image: PropTypes.string,
    /** name of the picture, used for title tag fallback */
    name: PropTypes.string,
    /** shape of the avatar, circle, rounded or square */
    shape: PropTypes.oneOf(['circle', 'rounded', 'square']),
    /** size in pixels */
    size: PropTypes.number,
  };

  static defaultProps = {
    size: 32,
    shape: 'circle',
  };

  state = {
    errored: false,
    loaded: false,
  };

  getInitials = (name) =>
    name
      ? name
          .split(' ')
          .slice(0, 1)
          .map((name) => name.charAt(0))
      : null;

  onLoad = () => {
    this.setState({ loaded: true });
  };

  onError = () => {
    this.setState({ errored: true });
  };

  componentDidUpdate(prevProps) {
    if (prevProps.image !== this.props.image) {
      this.setState({ loaded: false, errored: false });
    }
  }

  render() {
    const { size, name, shape, image } = this.props;
    const initials = this.getInitials(name);
    return (
      <div
        className={`str-chat__avatar str-chat__avatar--${shape}`}
        title={name}
        style={{
          width: size,
          height: size,
          flexBasis: size,
          lineHeight: size + 'px',
          fontSize: size / 2,
        }}
      >
        {image && !this.state.errored ? (
          <img
            src={image}
            alt={initials}
            className={
              'str-chat__avatar-image' +
              (this.state.loaded ? ' str-chat__avatar-image--loaded' : '')
            }
            style={{
              width: size,
              height: size,
              flexBasis: size,
              objectFit: 'cover',
            }}
            onLoad={this.onLoad}
            onError={this.onError}
          />
        ) : (
          <div className="str-chat__avatar-fallback">{initials}</div>
        )}
      </div>
    );
  }
}
