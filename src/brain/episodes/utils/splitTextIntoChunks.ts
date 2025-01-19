const splitTextIntoChunks = (
  text: string,
  maxLength: number = 2000
): string[] => {
  const sections = text.split("\n\n"); // Split the text by the separator
  const totalLength = text.length;
  const chunkCount = Math.ceil(totalLength / maxLength); // Determine how many chunks are needed
  const averageLength = Math.ceil(totalLength / chunkCount); // Target length for each chunk

  const chunks: string[] = [];
  let currentChunk = "";
  let currentLength = 0;

  for (const section of sections) {
    const sectionLength = section.length + (currentChunk ? 2 : 0); // Include separator if necessary

    if (currentLength + sectionLength <= averageLength) {
      // Add the section to the current chunk
      currentChunk += (currentChunk ? "\n\n" : "") + section;
      currentLength += sectionLength;
    } else {
      // Push the current chunk and start a new one
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = section;
      currentLength = section.length;
    }
  }

  // Push the final chunk if there's remaining text
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

export default splitTextIntoChunks;
