import React from 'react';
import PropTypes from 'prop-types';

import Lightbox from 'react-images';

/**
 * Image - Small wrapper around an image tag, supports thumbnails
 *
 * @example ./docs/Image.md
 * @extends PureComponent
 */
export class Image extends React.PureComponent {
	state = {
		isOpen: false,
	};

	static propTypes = {
		/** The full size image url */
		image_url: PropTypes.string,
		/** The thumb url */
		thumb_url: PropTypes.string,
		/** The text fallback for the image */
		fallback: PropTypes.string,
	};

	openLightbox = () => {
		this.setState({
			isOpen: true,
		});
	};

	closeLightbox = () => {
		this.setState({
			isOpen: false,
		});
	};

	render() {
		const { image_url, thumb_url, fallback } = this.props;
		return (
			<React.Fragment>
				<img
					className="str-chat__message-attachment--img"
					onClick={this.openLightbox}
					src={thumb_url || image_url}
					alt={fallback}
				/>
				<Lightbox
					isOpen={this.state.isOpen}
					onClose={this.closeLightbox}
					images={[{ src: image_url || thumb_url }]}
					backdropClosesModal={true}
				/>
			</React.Fragment>
		);
	}
}
