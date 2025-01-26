const cleanUpJsonArray = (text: string): string => {
  let cleanText = text
    .replace(/```json\s*([\s\S]*?)```/g, "$1")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();

  if (cleanText === "[]") {
    return cleanText;
  }

  // remove all line breaks
  cleanText = cleanText.replace(/\n/g, "");

  // find spaces between the first character ([) and the first double quote and remove them
  cleanText = cleanText.replace(/\[\s+"/g, '["');

  // find all double quotes followed by a comma and then remove all spaces after that until the next double quote
  cleanText = cleanText.replace(/",\s+"/g, '","');

  // remove leading [" and trailing "]
  cleanText = cleanText.replace(/^\["/, "").replace(/"\]$/, "");
  cleanText = `["${cleanText
    .split('","')
    .map((s) => s.replace(/\"/g, '\\"'))
    .join('","')}"]`;

  cleanText = cleanText.replace(/\\\\"/g, '\\"');

  return cleanText;
};

export default cleanUpJsonArray;
