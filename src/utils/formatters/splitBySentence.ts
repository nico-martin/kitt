const splitBySentence = (text: string): string[] => {
  if (!text) {
    return [];
  }

  const sentenceRegex = /([.?!])\s+/g;

  let sentences: string[] = [];
  let currentIndex = 0;
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentenceEndIndex = match.index + match[0].length;
    const sentence = text.substring(currentIndex, sentenceEndIndex).trim();
    sentences.push(sentence);
    currentIndex = sentenceEndIndex;
  }

  if (currentIndex < text.length) {
    const lastSentence = text.substring(currentIndex).trim();
    sentences.push(lastSentence);
  }

  return sentences;
};

export default splitBySentence;
