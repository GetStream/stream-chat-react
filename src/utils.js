import anchorme from 'anchorme';
import emojiRegex from 'emoji-regex';
import ReactMarkdown from 'react-markdown';
import truncate from 'lodash/truncate';

import React from 'react';

export const REACTIONS = {
	love: 'heart',
	sad: 'pensive',
	angry: 'angry',
	haha: 'joy',
	like: 'thumbsup',
	wow: 'astonished',
};

export const isOnlyEmojis = text => {
	if (!text) return false;

	const noEmojis = text.replace(emojiRegex(), '');
	const noSpace = noEmojis.replace(/[\s\n]/gm, '');
	return !noSpace;
};

export const isPromise = thing => {
	const promise = thing && typeof thing.then === 'function';
	return promise;
};

export const byDate = (a, b) => a.created_at - b.created_at;

// https://stackoverflow.com/a/29234240/7625485
export const formatArray = arr => {
	let outStr = '';
	if (arr.length === 1) {
		outStr = arr[0] + ' is typing...';
	} else if (arr.length === 2) {
		//joins all with "and" but =no commas
		//example: "bob and sam"
		outStr = arr.join(' and ') + ' are typing...';
	} else if (arr.length > 2) {
		//joins all with commas, but last one gets ", and" (oxford comma!)
		//example: "bob, joe, and sam"
		outStr =
			arr.slice(0, -1).join(', ') + ', and ' + arr.slice(-1) + ' are typing...';
	}

	return outStr;
};

export const renderText = message => {
	// take the @ mentions and turn them into markdown?
	// translate links
	const allowed = [
		'root',
		'text',
		'break',
		'paragraph',
		'emphasis',
		'strong',
		'link',
		'list',
		'listItem',
		'code',
		'inlineCode',
		'blockquote',
	];
	const regex = /\B@[a-z0-9_-]+/gim;
	message = message.replace(regex, x => `**${x}**`);

	const urls = anchorme(message, {
		list: true,
	});
	for (const urlInfo of urls) {
		const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
			length: 30,
			omission: '...',
		});
		const mkdown = `[${displayLink}](${urlInfo.raw})`;
		message = message.replace(urlInfo.raw, mkdown);
	}

	message = message.replace(/\n/g, '\n\n');

	return (
		<ReactMarkdown
			allowedTypes={allowed}
			source={message}
			linkTarget="_blank"
			skipHtml={true}
		/>
	);
};

// https://stackoverflow.com/a/6860916/2570866
export function generateRandomId() {
	// prettier-ignore
	return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

function S4() {
	return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
