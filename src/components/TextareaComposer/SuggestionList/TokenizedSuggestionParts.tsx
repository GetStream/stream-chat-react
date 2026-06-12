import clsx from 'clsx';
import React from 'react';

export type TokenizedSuggestionDisplayName = {
  token: string;
  parts: string[];
};

export type TokenizedSuggestionPartsProps = {
  tokenizedDisplayName: TokenizedSuggestionDisplayName;
};

const HTML_SPACE = '\u00A0';

const isWhitespace = (char: string) => char.trim() === '';

const replaceBoundaryWhitespaceWithHTMLSpace = (part: string) => {
  if (!part) return part;

  let startIndex = 0;
  while (startIndex < part.length && isWhitespace(part[startIndex])) {
    startIndex += 1;
  }

  if (startIndex === part.length) return HTML_SPACE;

  let endIndex = part.length - 1;
  while (endIndex >= startIndex && isWhitespace(part[endIndex])) {
    endIndex -= 1;
  }

  return `${startIndex > 0 ? HTML_SPACE : ''}${part.slice(startIndex, endIndex + 1)}${
    endIndex < part.length - 1 ? HTML_SPACE : ''
  }`;
};

export const TokenizedSuggestionParts = ({
  tokenizedDisplayName,
}: TokenizedSuggestionPartsProps) =>
  tokenizedDisplayName.parts.map((part, i) => {
    const matches = part.toLowerCase() === tokenizedDisplayName.token;
    const partWithHTMLSpacesAround = replaceBoundaryWhitespaceWithHTMLSpace(part);

    return (
      <span
        className={clsx({
          'str-chat__emoji-item-part': !matches,
          'str-chat__suggestion-item-part--match': matches,
        })}
        key={`part-${i}`}
      >
        {partWithHTMLSpacesAround}
      </span>
    );
  });
