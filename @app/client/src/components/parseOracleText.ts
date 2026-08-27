export interface OracleTextSegment {
  isItalic: boolean;
  text: string;
}

const PARENTHESIZED_TEXT_PATTERN = /\([^)]*\)/g;

export const parseOracleText = (text: string): OracleTextSegment[] => {
  const segments: OracleTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(PARENTHESIZED_TEXT_PATTERN)) {
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      segments.push({
        isItalic: false,
        text: text.slice(lastIndex, matchIndex),
      });
    }

    segments.push({ isItalic: true, text: match[0] });
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ isItalic: false, text: text.slice(lastIndex) });
  }

  return segments;
};
