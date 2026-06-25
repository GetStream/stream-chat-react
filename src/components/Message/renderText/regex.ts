export function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,/\\^$|#]/g, '\\$&');
}

export const detectHttp = /(http(s?):\/\/)?(www\.)?/i;

// Regexes are hoisted to module scope so they are compiled once rather than on
// every call. `codeRegex`/`regexMdLinks` are only used with `String#match`
// (which resets `lastIndex`) and `singleMatch` is non-global (`.exec` ignores
// `lastIndex`), so sharing the instances is safe.
const codeRegex = /```[a-z]*\n[\s\S]*?\n```|`[a-z]*[\s\S]*?`/gm;
const regexMdLinks = /\[([^[]+)\](\(.*\))/gm;
const singleMatch = /\[([^[]+)\]\((.*)\)/;

export const messageCodeBlocks = (message: string) => {
  const matches = message.match(codeRegex);
  return matches || [];
};

export const matchMarkdownLinks = (message: string) => {
  const matches = message.match(regexMdLinks);

  const links = matches
    ? matches.map((match) => {
        const i = singleMatch.exec(match);
        return i && [i[1], i[2]];
      })
    : [];

  return links.flat();
};
