const splitTextIntoChunks = (
  text: string,
  maxLength: number = 2000
): string[] => {
  const sections = text.split("\n\n");
  const totalLength = text.length;
  const chunkCount = Math.ceil(totalLength / maxLength);
  const averageLength = Math.ceil(totalLength / chunkCount);

  const chunks: string[] = [];
  let currentChunk = "";
  let currentLength = 0;

  for (const section of sections) {
    const sectionLength = section.length + (currentChunk ? 2 : 0);

    if (currentLength + sectionLength <= averageLength) {
      currentChunk += (currentChunk ? "\n\n" : "") + section;
      currentLength += sectionLength;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = section;
      currentLength = section.length;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

export default splitTextIntoChunks;
